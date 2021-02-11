import { TaskMaster } from '@/service/task/TaskMaster';
import { Command } from '@/service/task/cqrs/Command';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { Task } from '@/service/task/cqrs/Task';
import { Context } from '@/api/Agent';

export namespace RequestInputFlow {
  type State = {
    parentTaskId: string;
    value: any;
    rejectionReason: string | Error;
  };

  export type Callback<T> = (
    reason: string | Error | undefined,
    value?: T
  ) => Promise<void>;

  enum CommandType {
    Create = 'RequestInput.Create',
    Complete = 'RequestInput.Complete',
    Reject = 'RequestInput.Reject',
  }

  enum EventType {
    Requested = 'RequestInput.Requested',
    Received = 'RequestInput.Received',
    Rejected = 'RequestInput.Rejected',
  }

  interface CreateCommand extends Command<CommandType.Create> {
    parentTaskId: string;
  }
  interface CompleteCommand extends Command<CommandType.Complete> {
    value: any;
  }
  interface RejectCommand extends Command<CommandType.Reject> {
    reason: string;
  }

  export const register = (context: Context) => {
    context.taskMaster.registerCommandHandler(
      CommandType.Create,
      async (command: CreateCommand, task, emitter) => {
        emitter.emit(
          EventType.Requested,
          { parentTaskId: command.parentTaskId },
          task
        );
      }
    );

    context.taskMaster.registerCommandHandler(
      CommandType.Complete,
      async (command: CompleteCommand, task, emitter) => {
        emitter.emit(EventType.Received, { value: command.value }, task);
      }
    );

    context.taskMaster.registerCommandHandler(
      CommandType.Reject,
      async (command: RejectCommand, task, emitter) => {
        emitter.emit(
          EventType.Rejected,
          { rejectionReason: command.reason },
          task
        );
      }
    );
  };

  export const create = <T>(
    taskMaster: TaskMaster,
    onComplete: (parentTaskId: string, value: T) => any,
    onReject?: (parentTaskId: string, reason: string | Error) => any
  ) => (parentTaskId: string): Callback<T> => {
    taskMaster.registerEventHandler(
      EventType.Received,
      (_event: TaskEvent<EventType.Received, State>, task: Task<State>) => {
        onComplete(task.state.parentTaskId, task.state.value);
      }
    );

    taskMaster.registerEventHandler(
      EventType.Rejected,
      (_event: TaskEvent<EventType.Rejected, State>, task: Task<State>) => {
        if (onReject)
          onReject(task.state.parentTaskId, task.state.rejectionReason);
      }
    );

    const taskContext = taskMaster.registerTask();
    taskContext.dispatch(CommandType.Create, { parentTaskId });

    return (reason, value?) => {
      if (reason) return taskContext.dispatch(CommandType.Reject, { reason });
      return taskContext.dispatch(CommandType.Complete, { value });
    };
  };
}
