import { Task } from '@/service/task/Task';
import { Command } from '@/service/task/Command';

export interface CommandHandler {
  execute<R>(command: Command, task: Task<R, any>): Event | undefined;
}
