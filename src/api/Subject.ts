import { Agent, DefaultAgent } from './internal';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { DID } from '@/api/DID';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export class Subject extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  resolvePresentationRequest<S extends PresentationFlow.PresentationState>(
    request: PresentationRequest,
    verifier: DID
  ): TaskContext<S> {
    const taskContext: TaskContext<S> = this.me.context.taskMaster.registerTask();

    const command: Sparse<PresentationFlow.RequestPresentationCommand> = {
      verifier,
      request,
    };

    taskContext.dispatch(PresentationFlow.CommandType.Request, command);

    return taskContext;
  }
}
