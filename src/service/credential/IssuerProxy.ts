import { CredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { Task } from '@/service/task/cqrs/Task';
import { DID } from '@/api/DID';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import CredentialRequest = CredentialRequestFlow.CredentialRequest;
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export interface IssuerProxy {
  requestCredential(
    request: CredentialRequest
  ): Task<CredentialRequestFlow.CredentialRequestState>;
}

export class StubIssuerProxy {
  //constructor() {} private readonly taskMaster: TaskMaster // TODO inject

  requestCredential(
    request: CredentialRequest,
    forPresentationRequest?: PresentationRequest
  ): Task<CredentialRequestFlow.CredentialRequestState> {
    // call Issuer
    const issuer: DID = 'did:stub:stubissuer'; // should be derived from the presentation request

    const command = {
      issuer,
      request,
      requestedAt: new Date(),
      forPresentationRequest,
    };
    // TODO
    // const taskContext: TaskContext<CredentialRequestFlow.CredentialRequestState>
    //   = this.taskMaster.registerTask();

    // taskContext.dispatch(CredentialRequestFlow.CommandType.Request, command);
    console.log('dispatching command', command);

    return new Task<CredentialRequestFlow.CredentialRequestState>();
  }
}
