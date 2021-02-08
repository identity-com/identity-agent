import { EventHandler } from '@/service/task/cqrs/EventHandler';
import EventEmitter from 'events';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';

type Handler<T extends string> =
  | EventHandler<T>
  | ((event: TaskEvent<T>) => any);

const isEventHandler = <T extends string>(
  h: Handler<T>
): h is EventHandler<T> => 'handle' in h;

export class EventBus extends EventEmitter {
  emit<T extends string>(type: T, event: TaskEvent<T>) {
    console.log(type + ' emitted. Listeners: ' + this.listeners(type));
    return super.emit(type, event);
  }

  registerHandler<T extends string>(type: T, handler: Handler<T>) {
    console.log('Registering listener for type ' + type);

    const eventHandler = isEventHandler(handler)
      ? handler
      : ({ handle: handler } as EventHandler<T>);

    this.on(type, (event) => eventHandler.handle(event));
  }

  waitForEvent<T extends string>(type: T): Promise<TaskEvent<T>> {
    return new Promise((resolve) => {
      this.on(type, resolve);
    });
  }
}
