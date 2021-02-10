import { DID } from '@/api/DID';

export namespace CredentialRequestFlow {
  export type Credential = {};
  export type CredentialRequest = {};

  export type CredentialRequestState = {
    issuer: DID;
    request: CredentialRequest;
    credential: Credential;
    requestedAt: Date;
  };

  export enum EventType {
    Requested = 'Request',
    Responded = 'Responded',
  }

  export enum CommandType {
    Request = 'Request',
  }
}
