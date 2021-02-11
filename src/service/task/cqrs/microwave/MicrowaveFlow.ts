import { EventType } from '@/service/task/cqrs/TaskEvent';
import {
  Command,
  RehydrateCommand,
  CommandType as CommonCommandType,
} from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Task } from '@/service/task/cqrs/Task';
import { EventHandler } from '@/service/task/cqrs/EventHandler';
import { Context } from '@/api/Agent';

export namespace MicrowaveFlow {
  const whirr = (durationMS: number) =>
    new Promise((resolve) => setTimeout(resolve, durationMS));

  export type MicrowaveState = {
    startTime: number;
    durationMS: number;
  };

  export enum CommandType {
    StartCooking = 'MicrowaveFlow.StartCooking',
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
      const event: Partial<MicrowaveState> = {
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

  export const register = (context: Context) => {
    context.taskMaster.registerCommandHandler(
      MicrowaveFlow.CommandType.StartCooking,
      new MicrowaveFlow.StartCookingCommandHandler()
    );

    context.taskMaster.registerCommandHandler(
      CommonCommandType.Rehydrate,
      new MicrowaveFlow.RehydrateCommandHandler()
    );

    // TODO add only to Microwave tasks
    context.taskMaster.registerEventHandler(
      EventType.Done,
      new MicrowaveFlow.DoneEventHandler()
    );
  };
}
