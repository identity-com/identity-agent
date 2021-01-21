import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';

export interface Task<T> {
  readonly type: string;
  readonly id: string;
  on<R>(
    eventType: EventType,
    handler: EventHandler<R, EventType>,
    replace?: boolean
  ): this;
  result(): Promise<T>;

  serialize(): Record<string, any>;
  deserialize(serialized: Record<string, any>): void;
}
