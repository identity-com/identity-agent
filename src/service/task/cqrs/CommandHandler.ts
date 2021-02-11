import { Command } from '@/service/task/cqrs/Command';
import { Task } from '@/service/task/cqrs/Task';
import { EventBus } from '@/service/task/cqrs/EventBus';

export type Handler<CT extends string, C extends Command<CT>, S> =
  | CommandHandler<CT, C, S>
  | ((
      command: C,
      task: Task<S>,
      emitter: CommandHandler<CT, C, S>
    ) => Promise<void>);

export const isCommandHandler = <CT extends string, C extends Command<CT>, S>(
  h: Handler<CT, C, S>
): h is CommandHandler<CT, C, S> => 'execute' in h;

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
    eventPayload: Partial<S>,
    task: Task<S>
  ): boolean {
    if (!this._eventBus)
      throw new Error('Unable to emit from this handler - missing event bus');
    return this._eventBus.emit(type, eventPayload, task);
  }
}

class WrappedCommandHandler<
  CT extends string,
  C extends Command<CT>,
  S
> extends CommandHandler<CT, C, S> {
  constructor(
    private readonly executor: (
      command: C,
      task: Task<S>,
      emitter: CommandHandler<CT, C, S>
    ) => Promise<void>
  ) {
    super();
  }

  execute(command: C, task: Task<S>): Promise<void> {
    return this.executor(command, task, this);
  }
}

export const wrap = <CT extends string, C extends Command<CT>, S>(
  executor: (
    command: C,
    task: Task<S>,
    emitter: CommandHandler<CT, C, S>
  ) => Promise<void>
) => new WrappedCommandHandler(executor);
