import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { CredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { Task } from '@/service/task/cqrs/Task';
import CredentialRequest = PresentationFlow.CredentialRequest;

export interface IssuerProxy {
  requestCredential(
    request: CredentialRequest
  ): Task<CredentialRequestFlow.CredentialRequestState>;
}
