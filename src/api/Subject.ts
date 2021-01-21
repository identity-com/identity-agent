import {
  PresentationRequest,
  PresentationTask,
} from '@/service/task/subject/Presentation';
import { Agent, DefaultAgent } from './internal';

export class Subject extends DefaultAgent {
  private me: Agent;

  constructor(me: Agent) {
    super(me.document, me.context);
    this.me = me;
  }

  resolvePresentationRequest(request: PresentationRequest): PresentationTask {
    return this.me.context.taskMaster.register(new PresentationTask(request));
  }
}
