import { TaskEvent } from '@/service/task/TaskEvent';
import { EventHandler } from '@/service/task/EventHandler';
import { DID } from '@/api/DID';
import { DefaultTask } from '@/service/task/DefaultTask';
import { DoneEvent } from '@/service/task/DoneEvent';
import { pick } from 'ramda';

export class CredentialConstraints {}

export type PresentationRequest = {
  verifier: DID;
  constraints: CredentialConstraints;
};

export class Presentation {
  // empty for now
}

export enum PresentationEventType {
  ConfirmPresentation = 'ConfirmPresentation',
}

export class PresentationTask extends DefaultTask<void> {
  static TYPE = 'PresentationTask';

  private request?: PresentationRequest;

  getRequest() {
    return this.request;
  }

  constructor(request?: PresentationRequest) {
    super(PresentationTask.TYPE);
    this.request = request;

    this.initialize();

    const emitDone = {
      handle: () => this.emit(new DoneEvent(undefined as void)),
    };

    this.on(PresentationEventType.ConfirmPresentation, emitDone, true);
  }

  protected initialize(): void {}

  resolveWithPresentation(presentation: Presentation) {
    if (!this.request) throw new Error('Missing event');
    return this.emit(new ConfirmPresentationEvent(this.request, presentation));
  }

  deserialize(serialized: Record<string, any>): void {
    const { request } = serialized;
    this.request = request;
    this.initialize();
  }

  serialize(): Record<string, any> {
    return pick(['request', 'confirmed'], this);
  }
}

export class ConfirmPresentationEvent extends TaskEvent<PresentationEventType.ConfirmPresentation> {
  readonly request: PresentationRequest;
  readonly presentation: Presentation;

  constructor(request: PresentationRequest, presentation: Presentation) {
    super(PresentationEventType.ConfirmPresentation);
    this.request = request;
    this.presentation = presentation;
  }
}

export interface ConfirmPresentationEventHandler
  extends EventHandler<void, PresentationEventType.ConfirmPresentation> {}
