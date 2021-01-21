import { pick } from 'ramda';
import { DefaultTask } from '@/service/task/DefaultTask';
import { DoneEvent } from '@/service/task/DoneEvent';

export class DummyTask extends DefaultTask<string> {
  static readonly TYPE: string = 'DummyTask';
  private delay: number;
  private startTime: number;

  constructor(delay = 60000) {
    super(DummyTask.TYPE);
    this.startTime = Date.now();
    this.delay = delay;

    this.initialize();
  }

  protected initialize(): void {
    const remainingDelay = this.startTime + this.delay - Date.now();

    setTimeout(
      () => this.emit(new DoneEvent('ding!')),
      Math.max(0, remainingDelay)
    );
  }

  serialize(): Record<string, any> {
    return pick(['delay', 'startTime'], this);
  }

  deserialize(serialized: Record<string, any>) {
    const { startTime, delay } = serialized;
    this.startTime = startTime;
    this.delay = delay;
    this.initialize();
  }
}
