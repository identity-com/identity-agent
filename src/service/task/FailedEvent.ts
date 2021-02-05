import { TaskEvent } from '@/service/task/TaskEvent';
import { CommonEventType } from '@/service/task/EventType';

export class FailedEvent extends TaskEvent<CommonEventType.Failed> {
  constructor(readonly reason: Error) {
    super(CommonEventType.Failed);
  }
}
