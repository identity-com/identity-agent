import { Agent, DefaultAgent } from './internal';
import { DID } from '@/api/DID';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export class Verifier extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  requestPresentation<
    S extends PresentationRequestFlow.PresentationRequestState
  >(subject: DID, request: PresentationRequest): TaskContext<S> {
    const taskContext: TaskContext<S> = this.me.context.taskMaster.registerTask();

    const command: Sparse<PresentationRequestFlow.RequestPresentationCommand> = {
      subject,
      request,
    };

    taskContext.dispatch(PresentationRequestFlow.CommandType.Request, command);

    return taskContext;
  }
}
