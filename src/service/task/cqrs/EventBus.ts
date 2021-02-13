import { EventHandler } from '@/service/task/cqrs/EventHandler';
import EventEmitter from 'events';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { TaskRepository } from '@/service/task/cqrs/TaskRepository';
import { Task } from '@/service/task/cqrs/Task';
import { propEq } from 'ramda';

export type Handler<T extends string, S> =
  | EventHandler<T, S>
  | ((event: TaskEvent<T, S>, task: Task<S>) => any);

const isEventHandler = <T extends string, S>(
  h: Handler<T, S>
): h is EventHandler<T, S> => 'handle' in h;

export class EventBus extends EventEmitter {
  constructor(private readonly taskRepository: TaskRepository) {
    super();
  }

  emit<ET extends string, S>(
    type: ET,
    eventPayload: Partial<S>,
    task: Task<S>
  ) {
    console.log(`Event emitted: ${type}`);
    const event = { type, payload: eventPayload };
    this.taskRepository.update(task.id, event);
    return super.emit(type, event, task);
  }

  registerHandler<T extends string, S>(
    type: T,
    handler: Handler<T, S>,
    overwrite: boolean
  ) {
    console.log('Registering listener for type ' + type);

    const eventHandler = isEventHandler(handler)
      ? handler
      : ({ handle: handler } as EventHandler<T, S>);

    if (overwrite) this.removeAllListeners(type);

    this.on(type, (event, task) => eventHandler.handle(event, task));
  }

  waitForEvent<ET extends string, S>(
    type: ET,
    taskId?: string
  ): Promise<TaskEvent<ET, S>> {
    if (taskId) {
      const task = this.taskRepository.get(taskId);
      const existingEvent = task?.events.find(propEq('type', type));
      if (existingEvent) {
        return Promise.resolve(existingEvent);
      }
    }

    return new Promise((resolve) => {
      this.on(
        type,
        (event: TaskEvent<ET, S>, task: Task<S>) =>
          (!taskId || task.id === taskId) && resolve(event)
      );
    });
  }
}
