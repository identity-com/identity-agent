import { TaskEvent } from '@/service/task/TaskEvent';
import { EventType } from '@/service/task/EventType';
import { Task } from '@/service/task/Task';

export interface EventHandler<R, T extends EventType> {
  handle(event: TaskEvent<T>): Task<R> | Promise<R>;
}
