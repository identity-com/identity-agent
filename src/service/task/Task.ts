import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { TaskEvent } from '@/service/task/Event';

export interface Task<T> {
  readonly type: string;
  readonly id: string;
  on(
    eventType: EventType,
    handler: EventHandler<any, TaskEvent<EventType>>
  ): this;
  result(): Promise<T>;

  serialize(): Record<string, any>;
  deserialize(serialized: Record<string, any>): void;
}
