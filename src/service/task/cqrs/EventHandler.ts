import { TaskEvent } from '@/service/task/cqrs/TaskEvent';

export interface EventHandler<T extends string> {
  handle(event: TaskEvent<T>): void;
}
