import { TaskEvent } from '@/service/task/cqrs/TaskEvent';

export interface EventHandler<T extends string, S> {
  handle(event: TaskEvent<T, S>): void;
}
