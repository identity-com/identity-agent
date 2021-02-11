import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Command } from '@/service/task/cqrs/Command';
import { TaskRepository } from '@/service/task/cqrs/TaskRepository';

export class CommandDispatcher {
  private handlers: {
    // "key" is not recognised by eslint as a key identifier
    // eslint-disable-next-line no-undef
    [key: string]: CommandHandler<typeof key, Command<typeof key>, any>[];
  };
  private taskRepository: TaskRepository;

  constructor(taskRepository: TaskRepository) {
    this.taskRepository = taskRepository;
    this.handlers = {};
  }

  registerCommandHandler<
    S, // Task state
    C extends Command<CT>, // command type
    CT extends string // command name string
  >(commandType: CT, handler: CommandHandler<CT, C, S>, overwrite: boolean) {
    let handlers = this.handlers[commandType];

    if (!handlers) {
      handlers = [];
      this.handlers[commandType] = handlers;
    }

    if (overwrite) {
      handlers.length = 0;
    }

    handlers.push(handler);
  }

  execute<C extends Command<CT>, CT extends string>(
    type: CT,
    command: C
  ): Promise<void> {
    const handlers = this.handlers[type];

    if (!handlers) return Promise.resolve();

    const task = this.taskRepository.get(command.taskId);

    if (!task) throw new Error(`No task found with ID ${command.taskId}`);

    console.log(`Dispatching command: ${type}`, command);

    return handlers.reduce(async (previousPromise, handler) => {
      await previousPromise;
      return handler.execute(command, task);
    }, Promise.resolve());
  }
}
