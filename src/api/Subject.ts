import { Agent, DefaultAgent } from './internal';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { Task } from '@/service/task/cqrs/Task';
import { DID } from '@/api/DID';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export class Subject extends DefaultAgent {
  constructor(private me: Agent) {
    super(me.document, me.context);
  }

  async resolvePresentationRequest(
    request: PresentationRequest,
    verifier: DID
  ): Promise<Task<PresentationFlow.PresentationState>> {
    const task = new Task<PresentationFlow.PresentationState>();
    this.me.context.taskMaster.registerTask(task);

    const command: PresentationFlow.RequestPresentationCommand = {
      taskId: task.id,
      verifier,
      request,
    };

    await this.me.context.taskMaster.dispatch(
      PresentationFlow.CommandType.Request,
      command
    );

    return task;
  }
}
