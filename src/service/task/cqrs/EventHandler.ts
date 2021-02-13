import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { Task } from '@/service/task/cqrs/Task';

export interface EventHandler<T extends string, S> {
  handle(event: TaskEvent<T, S>, task: Task<S>): void;
}
