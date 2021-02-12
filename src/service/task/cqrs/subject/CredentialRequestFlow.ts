import { DID } from '@/api/DID';
import { PresentationRequest } from '@/service/task/cqrs/verifier/PresentationRequestFlow';

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
