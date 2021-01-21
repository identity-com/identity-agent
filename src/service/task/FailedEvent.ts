import { TaskEvent } from '@/service/task/TaskEvent';
import { CommonEventType } from '@/service/task/EventType';

export class FailedEvent extends TaskEvent<CommonEventType.Failed> {
  readonly reason: Error;

  constructor(reason: Error) {
    super(CommonEventType.Failed);
    this.reason = reason;
  }
}
