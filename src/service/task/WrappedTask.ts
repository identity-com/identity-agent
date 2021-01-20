import { Task } from '@/service/task/Task';
import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { TaskEvent } from '@/service/task/Event';
import { v4 as uuid } from 'uuid';

export class WrappedTask<T> implements Task<T> {
  static readonly TYPE: string = 'WrappedTask';
  readonly type: string = WrappedTask.TYPE;
  readonly id: string;
  private promise: Promise<T>;

  constructor(promise: Promise<T>) {
    this.id = uuid();
    this.promise = promise;
  }

  deserialize(_serialized: Record<string, any>): void {}

  on(
    _eventType: EventType,
    _handler: EventHandler<any, TaskEvent<EventType>>
  ): this {
    throw new Error('Cannot assign event handlers to a wrapped promise task');
  }

  result(): Promise<T> {
    return this.promise;
  }

  serialize(): Record<string, any> {
    return {};
  }
}
