import { CommandDispatcher } from '@/service/task/cqrs/CommandDispatcher';
import { TaskRepository } from '@/service/task/cqrs/TaskRepository';
import {
  Command,
  CommandType,
  SparseCommand,
} from '@/service/task/cqrs/Command';
import { Task } from '@/service/task/cqrs/Task';
import { EventBus, Handler } from '@/service/task/cqrs/EventBus';
import { EventType, TaskEvent } from '@/service/task/cqrs/TaskEvent';
import {
  Handler as CommandHandler,
  isCommandHandler,
  wrap,
} from '@/service/task/cqrs/CommandHandler';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/wire/type';

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
    handler: CommandHandler<CT, C, S>,
    overwrite?: boolean
  ): void;
  registerEventHandler<T extends string, S>(
    type: T,
    handler: Handler<T, S>,
    overwrite?: boolean
  ): void;

  registerTask<S>(): TaskContext<S>;
  waitForEvent<T extends string, S>(
    type: T,
    taskId?: string
  ): Promise<TaskEvent<T, S>>;

  tasks: TaskContext<any>[];

  rehydrate(): Promise<void>;
}

export interface TaskContext<S> {
  waitForDone(): Promise<TaskEvent<EventType.Done, S>>;
  waitForEvent<ET extends string, S>(type: ET): Promise<TaskEvent<ET, S>>;
  dispatch<CT extends string, C extends SparseCommand<CT>>(
    type: CT,
    command: C
  ): Promise<void>;
  state: S;
  id: string;
  task: Task<S>;
}

@injectable()
export class DefaultTaskMaster implements TaskMaster {
  constructor(
    @inject(TYPES.TaskRepository)
    private readonly taskRepository: TaskRepository,
    @inject(TYPES.CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher,
    @inject(TYPES.EventBus) private readonly eventBus: EventBus
  ) {}

  static DefaultTaskContext = class<S> implements TaskContext<S> {
    constructor(
      readonly taskMaster: DefaultTaskMaster,
      readonly task: Task<S>
    ) {}

    waitForEvent<ET extends string, S>(type: ET): Promise<TaskEvent<ET, S>> {
      return this.taskMaster.eventBus.waitForEvent(type, this.task.id);
    }

    waitForDone<S>(): Promise<TaskEvent<EventType.Done, S>> {
      return this.waitForEvent(EventType.Done);
    }

    dispatch<CT extends string, C extends SparseCommand<CT>>(
      type: CT,
      command: C
    ): Promise<void> {
      const commandForTask = {
        taskId: this.task.id,
        ...command,
      };
      return this.taskMaster.commandDispatcher.execute(type, commandForTask);
    }

    get state(): S {
      return this.task.state;
    }

    get id(): string {
      return this.task.id;
    }
  };

  async rehydrate(): Promise<void> {
    await this.taskRepository.rehydrate();

    this.tasks.map((t) => t.dispatch(CommandType.Rehydrate, {}));
  }

  dispatch<CT extends string, C extends Command<CT>>(type: CT, command: C) {
    return this.commandDispatcher.execute(type, command);
  }

  registerCommandHandler<
    S, // Task state
    C extends Command<CT>, // command type
    CT extends string // command name string
  >(
    commandType: CT,
    handler: CommandHandler<CT, C, S>,
    overwrite: boolean = false
  ) {
    console.log('Registering command handler for type ' + commandType);
    const commandHandler = isCommandHandler(handler) ? handler : wrap(handler);

    commandHandler.eventBus = this.eventBus; // TODO add to inversify container
    return this.commandDispatcher.registerCommandHandler(
      commandType,
      commandHandler,
      overwrite
    );
  }

  registerEventHandler<T extends string, S>(
    type: T,
    handler: Handler<T, S>,
    overwrite: boolean = false
  ) {
    return this.eventBus.registerHandler(type, handler, overwrite);
  }

  registerTask<S>(): TaskContext<S> {
    const task = new Task<S>();
    this.taskRepository.add(task);
    return new DefaultTaskMaster.DefaultTaskContext(this, task);
  }

  get tasks(): TaskContext<any>[] {
    return this.taskRepository.tasks.map(
      (t) => new DefaultTaskMaster.DefaultTaskContext(this, t)
    );
  }

  waitForEvent<ET extends string, S>(
    type: ET,
    taskId?: string
  ): Promise<TaskEvent<ET, S>> {
    return this.eventBus.waitForEvent(type, taskId);
  }
}
