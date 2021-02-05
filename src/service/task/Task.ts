import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { TaskEvent } from '@/service/task/TaskEvent';

export interface Task<R> {
  readonly type: string;
  readonly id: string;
  on<T>(
    eventType: EventType,
    handler: EventHandler<T, EventType>,
    replace?: boolean
  ): this;
  emit<E extends EventType>(event: TaskEvent<E>): Promise<R>;
  result(): Promise<R>;

  serialize(): Record<string, any>;
  deserialize(serialized: Record<string, any>): void;
}
