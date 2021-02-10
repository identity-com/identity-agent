import { Command } from '@/service/task/cqrs/Command';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { Task } from '@/service/task/cqrs/Task';
import { EventBus } from '@/service/task/cqrs/EventBus';

export abstract class CommandHandler<
  CT extends string,
  C extends Command<CT>,
  S
> {
  // TODO add IoC library or refactor
  private _eventBus: EventBus | undefined;

  set eventBus(eventBus: EventBus) {
    this._eventBus = eventBus;
  }

  abstract execute(command: C, task: Task<S>): Promise<void>;
  emit<ET extends string>(
    type: ET,
    event: TaskEvent<ET, S>,
    task: Task<S>
  ): boolean {
    if (!this._eventBus)
      throw new Error('Unable to emit from this handler - missing event bus');
    return this._eventBus.emit(type, event, task);
  }
}
