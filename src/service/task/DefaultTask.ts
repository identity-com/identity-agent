import {Task} from "@/service/task/Task";
import {v4 as uuid} from "uuid";
import {WrappedTask} from "@/service/task/WrappedTask";
import {TaskEvent} from "@/service/task/TaskEvent";
import {CommonEventType, EventType} from "@/service/task/EventType";
import {EventHandler} from "@/service/task/EventHandler";
import isPromise from "is-promise";
import {DoneEvent} from "@/service/task/DoneEvent";
import {FailedEvent} from "@/service/task/FailedEvent";

// Do not use instanceof Promise as different runtimes will use a different promise prototype
// Promises are essentially duck-typed "thenables". Not innate language features
const resultIsPromise = <T>(
  result: Task<T> | Promise<T>
): result is Promise<T> => isPromise(result);

// TODO move to lib
export const passthroughHandler = { handle: <R>(value: R) => Promise.resolve(value) };

export const rejectHandler = <R>(reject: (reason: Error) => void, promise: Promise<R>) => ({ handle: (failedEvent: FailedEvent) => {
    reject(failedEvent.reason);
    return promise;
  }});
export const doneHandler = <R>(resolve: (result: R) => void, promise: Promise<R>) => ({ handle: (doneEvent: DoneEvent<R>) => {
    resolve(doneEvent.result);
    return promise;
  }});

type HandlerMap = Map<EventType,
  {
    before: EventHandler<any, EventType>[]
    after: EventHandler<any, EventType>[]
  }
>

export abstract class DefaultTask<R> implements Task<R> {
  readonly id: string;
  readonly type: string

  protected donePromise: Promise<R>;
  protected resolve!: (result: R) => void;
  protected reject!: (reason: Error) => void;

  private handlers:HandlerMap = new Map();

  protected constructor(type: string) {
    this.id = uuid();
    this.type = type;
    this.donePromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })

    this.on(CommonEventType.New, passthroughHandler, true);
    this.on(CommonEventType.Dehydrate, passthroughHandler, true);
    this.on(CommonEventType.Rehydrate, passthroughHandler, true);
    this.on(CommonEventType.Failed, rejectHandler(this.reject, this.donePromise), true);
    this.on(CommonEventType.Done, doneHandler(this.resolve, this.donePromise), true);
  }

  protected abstract initialize():void;
  abstract deserialize(serialized: Record<string, any>): void;
  abstract serialize(): Record<string, any>;

  private reduceHandlers<E extends EventType>(
    event: TaskEvent<E>
  ): Promise<R> {
    const normalizeHandlerResult = <T>(result: Task<T> | Promise<T>): Task<T> =>
      resultIsPromise(result) ? new WrappedTask(result) : result;

    const handlersForEvent = this.getAllHandlersForEventType(event.type) || [];
    const reducer = (earlierResult: Promise<R>, handler: EventHandler<R, E>):Promise<R> => {
      const handlerTask = normalizeHandlerResult(handler.handle(event));
      return earlierResult.then(() => handlerTask.result());
    };

    return handlersForEvent.reduce(reducer, Promise.resolve(null as unknown as R));
  }

  emit<E extends EventType>(event: TaskEvent<E>): Promise<R> {
    return this.reduceHandlers(event)
  }

  private getAllHandlersForEventType(eventType: EventType) {
    const {before = [], after = []} = this.handlers.get(eventType) || {};

    return [...before, ...after];
  }

  private getOrInitHandlersForEventType(eventType: EventType, after = false) {
    const allHandlersForEventType = this.handlers.get(eventType)

    if (!allHandlersForEventType) {
      this.handlers.set(eventType, {
        before: [],
        after: []
      });
    }

    return after ? this.handlers.get(eventType)!.after : this.handlers.get(eventType)!.before;
  }

  on<R>(eventType: EventType, handler: EventHandler<R, EventType>, after = false ) {
    const handlerArray = this.getOrInitHandlersForEventType(eventType, after)

    handlerArray.push(handler)

    return this;
  }

  result(): Promise<R> {
    return this.donePromise;
  }
}
