import { v4 as uuid } from 'uuid';
import { any, mergeDeepRight, prop, propEq } from 'ramda';
import { EventType, TaskEvent } from '@/service/task/cqrs/TaskEvent';

export class Task<S> {
  readonly id: string;
  readonly events: TaskEvent<any, S>[];

  constructor(id?: string, events: TaskEvent<any, S>[] = []) {
    this.id = id || uuid();
    this.events = events;
  }

  get state(): S {
    return this.events
      .map(prop('payload'))
      .reduce(mergeDeepRight, {} as Partial<S>) as S;
  }

  isDone(): boolean {
    return any(propEq('type', EventType.Done), this.events);
  }
}
