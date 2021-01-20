import {
  PresentationRequest,
  PresentationRequestTask,
} from '@/service/task/subject/PresentationRequest';
import { Agent, DefaultAgent } from './internal';

export class Subject extends DefaultAgent {
  private me: Agent;

  constructor(me: Agent) {
    super(me.document, me.context);
    this.me = me;
  }

  resolvePresentationRequest(
    request: PresentationRequest
  ): PresentationRequestTask {
    return this.me.context.taskMaster.register(
      new PresentationRequestTask(request)
    );
  }
}
