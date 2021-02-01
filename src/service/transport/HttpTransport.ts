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

const defaultTransportOptions: TransportOptions = {
  encrypted: true,
  signed: true,
};

export class HttpTransport implements Transport {
  private http: Http;
  private resolve: DIDResolver;
  private crypto: CryptoModule;

  constructor(http: Http, didResolver: DIDResolver, crypto: CryptoModule) {
    this.http = http;
    this.resolve = didResolver;
    this.crypto = crypto;
  }

  private async makeHttpBody(
    payload: any,
    recipient: DID,
    options: TransportOptions = defaultTransportOptions
  ): Promise<string> {
    return Promise.resolve(payload)
      .then((body) => (options.signed ? this.crypto.createToken(body) : body))
      .then(JSON.stringify)
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
    const doc = await this.resolve(recipient);
    const service = serviceFor(doc, type);
    if (!service)
      throw new Error(
        recipient +
          ' has no suitable service endpoint for payload of type ' +
          type
      );

    const endpoint = service.serviceEndpoint;

    if (isDID(endpoint)) {
      throw new Error('DID service endpoints not yet supported');
    }

    const body = await this.makeHttpBody(payload, recipient, options);

    return this.http.post(endpoint, body, {}).then(() => ({ status: 'ok' }));
  }
}
