import { EventType } from '@/service/task/EventType';

export class TaskEvent<T extends EventType> {
  type: EventType;

  constructor(type: T) {
    this.type = type;
  }
}
