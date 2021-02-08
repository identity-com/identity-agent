import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import {
  Command,
  RehydrateCommand,
  CommandType as CommonCommandType,
} from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Task } from '@/service/task/cqrs/Task';
import { EventHandler } from '@/service/task/cqrs/EventHandler';

export namespace Microwave {
  const whirr = (durationMS: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMS));

  type State = {
    startTime: number;
    durationMS: number;
  };

  export enum EventType {
    Started = 'Started',
    Done = 'Done',
  }

  export enum CommandType {
    StartCooking = 'StartCooking',
  }

  export class MicrowaveTask extends Task<State> {}

  export interface StartCookingCommand
    extends Command<CommandType.StartCooking> {
    readonly durationMS: number;
  }

  interface StartedEvent extends TaskEvent<EventType.Started> {
    readonly startTime: number;
    readonly durationMS: number;
  }

  interface DoneEvent extends TaskEvent<EventType.Done> {}

  export class StartCookingCommandHandler extends CommandHandler<
    CommandType.StartCooking,
    StartCookingCommand,
    MicrowaveTask
  > {
    async execute(command: StartCookingCommand) {
      const now = Date.now();
      const startedEvent: StartedEvent = {
        startTime: now,
        durationMS: command.durationMS,
      };
      this.emit(EventType.Started, startedEvent);

      await whirr(command.durationMS);

      this.emit(EventType.Done, {} as DoneEvent);
    }
  }

  export class RehydrateCommandHandler extends CommandHandler<
    CommonCommandType.Rehydrate,
    RehydrateCommand,
    MicrowaveTask
  > {
    async execute(_command: RehydrateCommand, task: MicrowaveTask) {
      const end = task.state.startTime - task.state.durationMS;
      const remainingTime = end - Date.now();
      await whirr(remainingTime);
      this.emit(EventType.Done, {} as DoneEvent);
    }
  }

  export class DoneEventHandler implements EventHandler<EventType.Done> {
    handle() {
      console.log('Ping!');
    }
  }
}
