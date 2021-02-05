import { CredentialConstraints } from '@/service/task/subject/Presentation';
import { Agent, DefaultAgent } from './internal';
import { DID } from '@/api/DID';
import { PresentationRequestTask } from '@/service/task/verifier/PresentationRequest';

export class Verifier extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  requestPresentation(
    subject: DID,
    constraints: CredentialConstraints
  ): PresentationRequestTask {
    return this.me.context.taskMaster.register(
      new PresentationRequestTask(
        {
          verifier: this.me.did,
          constraints,
        },
        subject
      )
    );
  }
}
