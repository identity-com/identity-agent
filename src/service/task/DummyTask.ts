import { Task } from '@/service/task/Task';
import R from 'ramda';
import { EventType } from '@/service/task/EventType';
import { EventHandler } from '@/service/task/EventHandler';
import { v4 as uuid } from 'uuid';
import { TaskEvent } from '@/service/task/Event';

export class DummyTask implements Task<string> {
  static readonly TYPE: string = 'DummyTask';
  readonly type: string = DummyTask.TYPE;
  readonly id: string;
  private delay: number;
  private startTime: number;

  private timer?: Promise<void>;

  constructor(delay = 60000) {
    this.startTime = Date.now();
    this.delay = delay;
    this.setTimer();
    this.id = uuid();
  }

  private setTimer(): Promise<void> {
    const remainingDelay = this.startTime + this.delay - Date.now();

    if (remainingDelay <= 0) this.timer = Promise.resolve();

    this.timer = new Promise<void>((resolve) =>
      setTimeout(resolve, this.delay)
    );

    return this.timer;
  }

  serialize(): Record<string, any> {
    return R.pick(['delay', 'startTime'], this);
  }

  deserialize(serialized: Record<string, any>) {
    const { startTime, delay } = serialized;
    this.startTime = startTime;
    this.delay = delay;
    this.setTimer();
  }

  result(): Promise<string> {
    return (this.timer || this.setTimer()).then(() => 'ding!');
  }

  on(_eventType: EventType, _handler: EventHandler<any, TaskEvent<EventType>>) {
    // nothing yet
    return this;
  }
}
