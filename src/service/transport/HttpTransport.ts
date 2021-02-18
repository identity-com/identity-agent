import {
  TransportOptions,
  Transport,
  PayloadType,
  Response,
  MessageOptions,
  MessageResponse,
} from '@/service/transport/Transport';
import { DID, DIDResolver } from '@/api/DID';
import { Http, HttpResponse } from '@/service/transport/http/Http';
import { getService, serviceFor } from '@/lib/did/serviceUtils';
import { isDID } from '@/lib/did/utils';
import { CryptoModule } from '@/service/crypto/CryptoModule';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/wire/type';
import { DIDDocument } from 'did-resolver';
import { JWE, JWTVerified } from 'did-jwt';

const defaultTransportOptions: TransportOptions = {
  encrypted: true,
  signed: true,
};

const defaultHeaders = {
  'content-type': 'application/json',
};

type MessageHttpResponse = HttpResponse & {
  bodyJson: {
    data: JWE[];
  };
};

@injectable()
export class HttpTransport implements Transport {
  constructor(
    @inject(TYPES.Http) private http: Http,
    @inject(TYPES.DIDResolver) private resolve: DIDResolver,
    @inject(TYPES.CryptoModule) private crypto: CryptoModule,
    @inject(TYPES.DIDDocument) private document: DIDDocument
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

  private async makeAuthToken(): Promise<string> {
    return this.crypto.createToken({});
  }

  private async headers() {
    const token = await this.makeAuthToken();
    return {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    };
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
    const headers = await this.headers();

    return this.http
      .post(endpoint, body, headers)
      .then((response) => ({ status: 'ok', response }));
  }

  async getMessages(options: MessageOptions = {}): Promise<MessageResponse> {
    const serviceName = 'MessagingService';
    const service = getService(this.document, serviceName);
    if (!service) throw Error(`Missing service ${serviceName}`);

    const headers = await this.headers();

    const response = await this.http.get<MessageHttpResponse>(
      service.serviceEndpoint,
      headers,
      options
    );

    const encryptedMessages = response.bodyJson.data;

    const decryptedMessages = await Promise.all(
      encryptedMessages.map((encryptedMessage) =>
        this.decryptMessage(encryptedMessage)
      )
    );

    return {
      status: 'ok',
      messages: decryptedMessages,
    };
  }

  private async decryptMessage(message: JWE): Promise<JWTVerified> {
    const jwt = await this.crypto.decrypt(message);
    return this.crypto.verifyToken(jwt);
  }
}
