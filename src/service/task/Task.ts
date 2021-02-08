import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { TaskEvent } from '@/service/task/TaskEvent';

export type SerializedTask<Contents> = {
  id: string;
  type: string;
  state: Contents;
  done: boolean;
};

export interface Task<R, Contents> {
  readonly type: string;
  readonly id: string;
  on<T>(
    eventType: EventType,
    handler: EventHandler<T, EventType>,
    replace?: boolean
  ): this;
  emit<E extends EventType>(event: TaskEvent<E>): Promise<R>;
  result(): Promise<R>;

  serialize(): SerializedTask<Contents>;
  deserialize(serialized: SerializedTask<Contents>): void;
}
