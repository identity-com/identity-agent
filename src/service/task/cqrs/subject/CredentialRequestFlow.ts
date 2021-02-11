import { DID } from '@/api/DID';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';

export namespace CredentialRequestFlow {
  import PresentationRequest = PresentationRequestFlow.PresentationRequest;
  export type Credential = {};
  export type CredentialRequest = {};

  export type CredentialRequestState = {
    issuer: DID;
    request: CredentialRequest;
    credential: Credential;
    requestedAt: Date;
    forPresentationRequest: PresentationRequest;
  };

  export enum EventType {
    Requested = 'CredentialRequestFlow.Requested',
    Responded = 'CredentialRequestFlow.Responded',
  }

  export enum CommandType {
    Request = 'CredentialRequestFlow.Request',
  }

  export interface RequestCredentialCommand {
    issuer: DID;
    request: CredentialRequest;
    requestedAt: Date;
    forPresentationRequest: PresentationRequest;
  }
}
