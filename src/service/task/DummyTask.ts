import { DefaultTask } from '@/service/task/DefaultTask';
import { DoneEvent } from '@/service/task/DoneEvent';
import { TaskEvent } from '@/service/task/TaskEvent';

export class DummyTask extends DefaultTask<string> {
  static readonly TYPE: string = 'DummyTask';

  constructor(delay = 60000) {
    super(DummyTask.TYPE);

    this.emit(
      new TaskEvent({
        startTime: Date.now,
        delay,
      })
    );

    this.initialize();
  }

  protected initialize(): void {
    const remainingDelay =
      this.state().startTime + this.state().delay - Date.now();

    setTimeout(
      () => this.emit(new DoneEvent('ding!')),
      Math.max(0, remainingDelay)
    );
  }
}
