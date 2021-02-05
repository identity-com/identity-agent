import { EventType } from '@/service/task/EventType';

export class TaskEvent<T extends EventType> {
  constructor(readonly type: T) {}
}
