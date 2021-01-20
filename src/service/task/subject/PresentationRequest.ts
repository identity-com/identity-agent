import { Task } from '@/service/task/Task';
import { EventType } from '@/service/task/EventType';
import { TaskEvent } from '@/service/task/Event';
import { EventHandler } from '@/service/task/EventHandler';
import R from 'ramda';
import { v4 as uuid } from 'uuid';
import { WrappedTask } from '@/service/task/WrappedTask';
import isPromise from 'is-promise';

export class PresentationRequest {
  // empty for now
}

export class Presentation {
  // empty for now
}

// Do not use instanceof Promise as differet runtimes will use a different promise prototype
// Promises are essentially duck-typed "thenables". Not innate language features
const resultIsPromise = (
  result: Task<void> | Promise<void>
): result is Promise<void> => isPromise(result);

export class PresentationRequestTask implements Task<void> {
  static TYPE = 'PresentationRequestTask';
  readonly id: string;
  readonly type = PresentationRequestTask.TYPE;

  private request?: PresentationRequest;
  private confirmed?: boolean;

  protected confirmPromise?: Promise<void>;
  private resolve?: () => void;
  private reject?: (reason: Error) => void;

  private confirmHandlers: ConfirmPresentationEventHandler[] = [];

  getRequest() {
    return this.request;
  }

  constructor(request?: PresentationRequest) {
    this.request = request;
    this.id = uuid();
    this.initialize();
  }

  private initialize(): Promise<void> {
    this.confirmPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;

      if (this.confirmed !== undefined) {
        if (this.confirmed) this.resolve();
        if (!this.confirmed)
          this.reject(new Error('User has already rejected the request'));
      }
    });

    return this.confirmPromise;
  }

  deserialize(serialized: Record<string, any>): void {
    const { request, confirmed } = serialized;
    this.request = request;
    this.confirmed = confirmed;
    this.initialize();
  }

  private reduceConfirmHandlers(
    event: ConfirmPresentationEvent
  ): Promise<void> {
    const normalizeHandlerResult = (
      result: Task<void> | Promise<void>
    ): Task<void> => {
      if (resultIsPromise(result)) {
        return new WrappedTask(result);
      }

      return result;
    };

    return this.confirmHandlers.reduce((earlierResult, handler) => {
      const handlerTask = normalizeHandlerResult(handler.handle(event));
      return earlierResult.then(() => handlerTask.result());
    }, Promise.resolve());
  }

  emit(event: TaskEvent<EventType>): void {
    console.log(
      'Emitting confirmation event for ' + JSON.stringify(this.request)
    );
    switch (event.type) {
      case EventType.ConfirmPresentation:
        this.reduceConfirmHandlers(event as ConfirmPresentationEvent)
          .then(() => this.resolve && this.resolve())
          .catch((error) => this.reject && this.reject(error));
        break;
    }
  }

  on(eventType: EventType, handler: EventHandler<any, TaskEvent<EventType>>) {
    switch (eventType) {
      case EventType.NewPresentationRequest:
        break;
      case EventType.ConfirmPresentation:
        this.confirmHandlers.push(handler);
        break;
      default:
        throw new Error(`Unsupported type ${eventType}`);
    }

    return this;
  }

  result(): Promise<void> {
    return this.confirmPromise || this.initialize();
  }

  serialize(): Record<string, any> {
    return R.pick(['request', 'confirmed'], this);
  }
}

export class NewPresentationRequestEvent extends TaskEvent<EventType.NewPresentationRequest> {
  readonly request: PresentationRequest;

  constructor(request: PresentationRequest) {
    super(EventType.NewPresentationRequest);
    this.request = request;
  }
}

export class ConfirmPresentationEvent extends TaskEvent<EventType.ConfirmPresentation> {
  readonly request: PresentationRequest;
  readonly presentation: Presentation;

  constructor(request: PresentationRequest, presentation: Presentation) {
    super(EventType.ConfirmPresentation);
    this.request = request;
    this.presentation = presentation;
  }
}

export interface ConfirmPresentationEventHandler
  extends EventHandler<void, ConfirmPresentationEvent> {}
