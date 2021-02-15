import { v4 as uuid } from 'uuid';
import {
  CredentialRequest,
  Credential,
} from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { injectable } from 'inversify';

export interface IssuerProxy<C extends Credential> {
  requestCredential(request: CredentialRequest): Promise<C>;
}

export type StubClaim = string;
export interface StubCredential extends Credential {
  claims: Record<string, StubClaim>;
}
@injectable()
export class StubIssuerProxy implements IssuerProxy<StubCredential> {
  requestCredential({
    issuer,
    type,
  }: CredentialRequest): Promise<StubCredential> {
    return Promise.resolve({
      type,
      issuer: issuer || 'did:stub:stub',
      claims: {
        dummyClaim1: uuid(),
        dummyClaim2: uuid(),
      },
    });
  }
}
