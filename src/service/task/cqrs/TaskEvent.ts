export type EventPayload = { [k: string]: any };

export enum EventType {
  Started = 'Started',
  Done = 'Done',
}

export type TaskEvent<ET extends string, S> = { type: ET; payload: Partial<S> };
