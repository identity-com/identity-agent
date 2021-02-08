import { Command } from '@/service/task/cqrs/Command';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { Task } from '@/service/task/cqrs/Task';
import { EventBus } from '@/service/task/cqrs/EventBus';

export abstract class CommandHandler<
  CT extends string,
  C extends Command<CT>,
  T extends Task<any>
> {
  constructor(protected readonly eventBus: EventBus) {}

  abstract execute(command: C, task: T): Promise<void>;
  emit<ET extends string>(type: ET, event: TaskEvent<ET>): boolean {
    return this.eventBus.emit(type, event);
  }
}
