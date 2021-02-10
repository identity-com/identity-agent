import { Agent, DefaultAgent } from './internal';
import { DID } from '@/api/DID';
import { Task } from '@/service/task/cqrs/Task';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export class Verifier extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  async requestPresentation(
    subject: DID,
    request: PresentationRequest
  ): Promise<Task<PresentationRequestFlow.PresentationRequestState>> {
    const task = new Task<PresentationRequestFlow.PresentationRequestState>();
    this.me.context.taskMaster.registerTask(task);

    const command: PresentationRequestFlow.RequestPresentationCommand = {
      taskId: task.id,
      subject,
      request,
    };

    await this.me.context.taskMaster.dispatch(
      PresentationRequestFlow.CommandType.Request,
      command
    );

    return task;
  }
}
