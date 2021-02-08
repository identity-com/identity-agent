import { EventPayload } from '@/service/task/cqrs/TaskEvent';

export enum CommandType {
  Rehydrate = 'Rehydrate',
}

// @ts-ignore
export interface Command<CT extends string> {
  readonly taskId: string;
}
export interface RehydrateCommand extends Command<CommandType.Rehydrate> {
  readonly events: EventPayload[];
}
