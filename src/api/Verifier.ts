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
    request: PresentationRequest,
    subject: DID
  ): TaskContext<S>;
}

export class DefaultVerifier extends DefaultAgent implements Verifier {
  constructor(private me: DefaultAgent) {
    super(me.container);
  }

  requestPresentation<S extends PresentationRequestState>(
    request: PresentationRequest,
    subject: DID
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
