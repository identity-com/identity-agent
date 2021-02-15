import {
  TransportOptions,
  Transport,
  PayloadType,
  Response,
} from '@/service/transport/Transport';
import { DID, DIDResolver } from '@/api/DID';
import { Http } from '@/service/transport/http/Http';
import { serviceFor } from '@/lib/did/serviceUtils';
import { isDID } from '@/lib/did/utils';
import { CryptoModule } from '@/service/crypto/CryptoModule';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/wire/type';

const defaultTransportOptions: TransportOptions = {
  encrypted: true,
  signed: true,
};

@injectable()
export class HttpTransport implements Transport {
  constructor(
    @inject(TYPES.Http) private http: Http,
    @inject(TYPES.DIDResolver) private resolve: DIDResolver,
    @inject(TYPES.CryptoModule) private crypto: CryptoModule
  ) {}

  private async makeHttpBody(
    payload: any,
    recipient: DID,
    options: TransportOptions = defaultTransportOptions
  ): Promise<string> {
    return Promise.resolve(payload)
      .then((body) => (options.signed ? this.crypto.createToken(body) : body))
      .then((body) =>
        options.encrypted
          ? this.crypto.encrypt(body, recipient).then(JSON.stringify)
          : body
      );
  }

  async send(
    recipient: DID,
    payload: any,
    type: PayloadType,
    options: TransportOptions
  ): Promise<Response> {
    const document = await this.resolve(recipient);
    const service = serviceFor(document, type);
    if (!service) {
      const message =
        recipient +
        ' has no suitable service endpoint for payload of type ' +
        type;
      console.error(message, JSON.stringify({ document }, null, 1));
      throw new Error(message);
    }

    const endpoint = service.serviceEndpoint;

    if (isDID(endpoint)) {
      throw new Error('DID service endpoints not yet supported');
    }

    console.log(`Sending to ${recipient}`, payload);

    const body = await this.makeHttpBody(payload, recipient, options);

    return this.http
      .post(endpoint, body, {
        'content-type': 'application/json',
      })
      .then((response) => ({ status: 'ok', response }));
  }
}
