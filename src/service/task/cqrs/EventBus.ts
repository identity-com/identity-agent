import { EventHandler } from '@/service/task/cqrs/EventHandler';
import EventEmitter from 'events';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { TaskRepository } from '@/service/task/cqrs/TaskRepository';
import { Task } from '@/service/task/cqrs/Task';

export type Handler<T extends string, S> =
  | EventHandler<T, S>
  | ((event: TaskEvent<T, S>) => any);

const isEventHandler = <T extends string, S>(
  h: Handler<T, S>
): h is EventHandler<T, S> => 'handle' in h;

export class EventBus extends EventEmitter {
  constructor(private readonly taskRepository: TaskRepository) {
    super();
  }

  emit<T extends string, S>(type: T, event: TaskEvent<T, S>, task: Task<S>) {
    console.log(type + ' emitted. Listeners: ' + this.listeners(type));
    this.taskRepository.update(task.id, event);
    return super.emit(type, event, task.id);
  }

  registerHandler<T extends string, S>(type: T, handler: Handler<T, S>) {
    console.log('Registering listener for type ' + type);

    const eventHandler = isEventHandler(handler)
      ? handler
      : ({ handle: handler } as EventHandler<T, S>);

    this.on(type, (event) => eventHandler.handle(event));
  }

  waitForEvent<T extends string, S>(type: T): Promise<TaskEvent<T, S>> {
    return new Promise((resolve) => {
      this.on(type, resolve);
    });
  }
}
