import { Task } from '@/service/task/Task';
import { TaskEvent } from '@/service/task/Event';

export interface EventHandler<R, T extends TaskEvent<any>> {
  handle(event: T): Task<R> | Promise<R>;
}
