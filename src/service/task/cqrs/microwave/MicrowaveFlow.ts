import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import {
  Command,
  RehydrateCommand,
  CommandType as CommonCommandType,
} from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Task } from '@/service/task/cqrs/Task';
import { EventHandler } from '@/service/task/cqrs/EventHandler';

export namespace MicrowaveFlow {
  const whirr = (durationMS: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMS));

  export type MicrowaveState = {
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

  export interface StartCookingCommand
    extends Command<CommandType.StartCooking> {
    readonly durationMS: number;
  }

  export class StartCookingCommandHandler extends CommandHandler<
    CommandType.StartCooking,
    StartCookingCommand,
    MicrowaveState
  > {
    async execute(command: StartCookingCommand, task: Task<MicrowaveState>) {
      const now = Date.now();
      const event: TaskEvent<EventType.Started, MicrowaveState> = {
        startTime: now,
        durationMS: command.durationMS,
      };
      this.emit(EventType.Started, event, task);

      await whirr(command.durationMS);

      this.emit(EventType.Done, {}, task);
    }
  }

  export class RehydrateCommandHandler extends CommandHandler<
    CommonCommandType.Rehydrate,
    RehydrateCommand,
    MicrowaveState
  > {
    async execute(_command: RehydrateCommand, task: Task<MicrowaveState>) {
      const end = task.state.startTime - task.state.durationMS;
      const remainingTime = end - Date.now();
      await whirr(remainingTime);
      this.emit(EventType.Done, {}, task);
    }
  }

  type Handler<ET extends string> = EventHandler<ET, MicrowaveState>;

  export class DoneEventHandler implements Handler<EventType.Done> {
    handle() {
      console.log('Ping!');
    }
  }
}
