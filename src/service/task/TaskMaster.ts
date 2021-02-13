import { Context } from '@/api/Agent';
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
import { register as registerMicrowaveFlow } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { register as registerPresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { register as registerPresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { register as registerCredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { register as registerRequestInputFlow } from '@/service/task/cqrs/requestInput/RequestInput';

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

export class DefaultTaskMaster implements TaskMaster {
  private readonly commandDispatcher: CommandDispatcher;
  private readonly taskRepository: TaskRepository;
  private readonly eventBus: EventBus;

  constructor(private context: Context) {
    this.taskRepository = new TaskRepository(this.context.storage);
    this.commandDispatcher = new CommandDispatcher(this.taskRepository);
    this.eventBus = new EventBus(this.taskRepository);

    // TODO perhaps move this to a module
    // Register flows

    // TODO Temp - DI library needed
    const populatedContext = { ...context, taskMaster: this };
    registerMicrowaveFlow(populatedContext);
    registerPresentationRequestFlow(populatedContext);
    registerPresentationFlow(populatedContext);
    registerCredentialRequestFlow(populatedContext);
    registerRequestInputFlow(populatedContext);
  }

  registerFlows(flowRegister: (context: Context) => void) {
    flowRegister(this.context);
  }

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

  static async rehydrate(context: Context): Promise<TaskMaster> {
    const taskMaster = new DefaultTaskMaster(context);

    await taskMaster.taskRepository.rehydrate();

    taskMaster.tasks.map((t) => t.dispatch(CommandType.Rehydrate, {}));

    return taskMaster;
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
    const commandHandler = isCommandHandler(handler) ? handler : wrap(handler);

    commandHandler.eventBus = this.eventBus; // TODO add IoC library or refactor
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
