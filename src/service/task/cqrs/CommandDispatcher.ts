import { Task } from '@/service/task/cqrs/Task';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Command } from '@/service/task/cqrs/Command';
import { find, propEq } from 'ramda';

export class CommandDispatcher {
  private readonly tasks: Task<any>[];
  private handlers: {
    // "key" is not recognised by eslint as a key identifier
    // eslint-disable-next-line no-undef
    [key: string]: CommandHandler<typeof key, Command<typeof key>, any>[];
  };

  constructor() {
    this.tasks = [];
    this.handlers = {};
  }

  registerTask(task: Task<any>) {
    this.tasks.push(task);
  }

  registerCommandHandler<
    T extends Task<S>,
    S,
    C extends Command<CT>,
    CT extends string
  >(commandType: CT, handler: CommandHandler<CT, C, T>) {
    let handlers = this.handlers[commandType];

    if (!handlers) {
      handlers = [];
      this.handlers[commandType] = handlers;
    }

    handlers.push(handler);
  }

  execute<C extends Command<CT>, CT extends string>(
    type: CT,
    command: C
  ): Promise<void> {
    const handlers = this.handlers[type];

    if (!handlers) return Promise.resolve();

    const task = find(propEq('id', command.taskId), this.tasks);

    if (!task) throw new Error(`No task found with ID ${command.taskId}`);

    return handlers.reduce(async (previousPromise, handler) => {
      await previousPromise;
      return handler.execute(command, task);
    }, Promise.resolve());
  }
}
