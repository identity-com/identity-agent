import { Context } from '@/api/Agent';
import { CommandDispatcher } from '@/service/task/cqrs/CommandDispatcher';
import { TaskRepository } from '@/service/task/cqrs/TaskRepository';
import { Command } from '@/service/task/cqrs/Command';
import { Task } from '@/service/task/cqrs/Task';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { EventBus, Handler } from '@/service/task/cqrs/EventBus';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';

export interface TaskMaster {
  dispatch<CT extends string, C extends Command<CT>>(
    type: CT,
    command: C
  ): Promise<void>;
  registerCommandHandler<
    S, // Task state
    C extends Command<CT>, // command type
    CT extends string // command name string
  >(
    commandType: CT,
    handler: CommandHandler<CT, C, S>
  ): void;
  registerEventHandler<T extends string, S>(
    type: T,
    handler: Handler<T, S>
  ): void;

  registerTask<S>(task: Task<S>): void;
  waitForEvent<T extends string, S>(type: T): Promise<TaskEvent<T, S>>;
}

export class DefaultTaskMaster implements TaskMaster {
  private readonly commandDispatcher: CommandDispatcher;
  private readonly taskRepository: TaskRepository;
  private readonly eventBus: EventBus;

  constructor(private context: Pick<Context, 'storage'>) {
    this.taskRepository = new TaskRepository(this.context.storage);
    this.commandDispatcher = new CommandDispatcher(this.taskRepository);
    this.eventBus = new EventBus(this.taskRepository);
  }

  static async rehydrate(
    context: Pick<Context, 'storage'>
  ): Promise<TaskMaster> {
    const taskMaster = new DefaultTaskMaster(context);

    await taskMaster.taskRepository.rehydrate();

    return taskMaster;
  }

  dispatch<CT extends string, C extends Command<CT>>(type: CT, command: C) {
    return this.commandDispatcher.execute(type, command);
  }

  registerCommandHandler<
    S, // Task state
    C extends Command<CT>, // command type
    CT extends string // command name string
  >(commandType: CT, handler: CommandHandler<CT, C, S>) {
    handler.eventBus = this.eventBus; // TODO add IoC library or refactor
    return this.commandDispatcher.registerCommandHandler(commandType, handler);
  }

  registerEventHandler<T extends string, S>(type: T, handler: Handler<T, S>) {
    return this.eventBus.registerHandler(type, handler);
  }

  registerTask<S>(task: Task<S>): void {
    return this.taskRepository.add(task);
  }

  waitForEvent<T extends string, S>(type: T): Promise<TaskEvent<T, S>> {
    return this.eventBus.waitForEvent(type);
  }
}
