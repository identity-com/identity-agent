export type EventPayload = { [k: string]: any };

export class TaskEvent {
  constructor(readonly payload: EventPayload) {}
}
