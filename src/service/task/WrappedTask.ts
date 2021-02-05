import { Task } from '@/service/task/Task';
import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { v4 as uuid } from 'uuid';
import { TaskEvent } from '@/service/task/TaskEvent';

export class WrappedTask<R> implements Task<R> {
  static readonly TYPE: string = 'WrappedTask';
  readonly type: string = WrappedTask.TYPE;
  readonly id: string;
  private promise: Promise<R>;

  constructor(promise: Promise<R>) {
    this.id = uuid();
    this.promise = promise;
  }

  deserialize(_serialized: Record<string, any>): void {}

  on(_eventType: EventType, _handler: EventHandler<any, EventType>): this {
    throw new Error('Cannot assign event handlers to a wrapped promise task');
  }

  emit<E extends EventType>(_event: TaskEvent<E>): Promise<R> {
    throw new Error('Cannot emit event handlers from a wrapped promise task');
  }

  result(): Promise<R> {
    return this.promise;
  }

  serialize(): Record<string, any> {
    return {};
  }
}
