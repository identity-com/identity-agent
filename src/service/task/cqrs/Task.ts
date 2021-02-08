import { v4 as uuid } from 'uuid';
import { mergeDeepRight } from 'ramda';

export class Task<S> {
  readonly id: string;
  readonly events: Partial<S>[];

  constructor(id?: string, events: Partial<S>[] = []) {
    this.id = id || uuid();
    this.events = events;
  }

  get state(): S {
    return this.events.reduce(mergeDeepRight, {} as Partial<S>) as S;
  }
}
