import { DefaultAgent, Agent } from './internal';
import { DID } from '@/api/DID';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import {
  CommandType,
  PresentationRequest,
  PresentationRequestState,
  RequestPresentationCommand,
} from '@/service/task/cqrs/verifier/PresentationRequestFlow';

export interface Verifier extends Agent {
  requestPresentation<S extends PresentationRequestState>(
    subject: DID,
    request: PresentationRequest
  ): TaskContext<S>;
}

export class DefaultVerifier extends DefaultAgent implements Verifier {
  constructor(private me: DefaultAgent) {
    super(me.document, me.container);
  }

  requestPresentation<S extends PresentationRequestState>(
    subject: DID,
    request: PresentationRequest
  ): TaskContext<S> {
    const taskContext: TaskContext<S> = this.me.taskMaster.registerTask();

    const command: Sparse<RequestPresentationCommand> = {
      subject,
      request,
    };

    taskContext.dispatch(CommandType.Request, command);

    return taskContext;
  }
}
