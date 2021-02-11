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

export type SparseCommand<CT extends string> = Omit<Command<CT>, 'taskId'>;

export type Sparse<C extends Command<any>> = Omit<C, 'taskId'>;
