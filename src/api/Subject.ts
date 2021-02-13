import { Agent, DefaultAgent } from './internal';
import { DID } from '@/api/DID';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import {
  CommandType,
  PresentationState,
  RequestPresentationCommand,
} from '@/service/task/cqrs/subject/PresentationFlow';
import { PresentationRequest } from '@/service/task/cqrs/verifier/PresentationRequestFlow';

export class Subject extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  resolvePresentationRequest<S extends PresentationState>(
    request: PresentationRequest,
    verifier: DID
  ): TaskContext<S> {
    const taskContext: TaskContext<S> = this.me.context.taskMaster.registerTask();

    const command: Sparse<RequestPresentationCommand> = {
      verifier,
      request,
    };

    taskContext.dispatch(CommandType.Request, command);

    return taskContext;
  }
}
