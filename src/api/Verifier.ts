import { Agent, DefaultAgent } from './internal';
import { DID } from '@/api/DID';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import {
  CommandType,
  PresentationRequest,
  PresentationRequestState,
  RequestPresentationCommand,
} from '@/service/task/cqrs/verifier/PresentationRequestFlow';

export class Verifier extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  requestPresentation<S extends PresentationRequestState>(
    subject: DID,
    request: PresentationRequest
  ): TaskContext<S> {
    const taskContext: TaskContext<S> = this.me.context.taskMaster.registerTask();

    const command: Sparse<RequestPresentationCommand> = {
      subject,
      request,
    };

    taskContext.dispatch(CommandType.Request, command);

    return taskContext;
  }
}
