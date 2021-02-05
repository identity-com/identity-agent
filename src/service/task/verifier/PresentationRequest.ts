import { DefaultTask } from '@/service/task/DefaultTask';
import {
  Presentation,
  PresentationRequest,
} from '@/service/task/subject/Presentation';
import { DID } from '@/api/DID';
import { TaskEvent } from '@/service/task/TaskEvent';
import { DoneEvent } from '@/service/task/DoneEvent';

export enum PresentationRequestEventType {
  PresentationReceived = 'PresentationReceived',
}

export class PresentationReceivedEvent extends TaskEvent<PresentationRequestEventType.PresentationReceived> {
  constructor(readonly presentation: Presentation) {
    super(PresentationRequestEventType.PresentationReceived);
  }
}

export class PresentationRequestTask extends DefaultTask<Presentation> {
  static TYPE = 'PresentationRequestTask';

  constructor(readonly request?: PresentationRequest, readonly subject?: DID) {
    super(PresentationRequestTask.TYPE);

    this.initialize();

    const presentationReceivedEventHandler = {
      handle: (event: PresentationReceivedEvent) => {
        this.emit(new DoneEvent(event.presentation));
        return Promise.resolve(); // TODO allow void return type
      },
    };

    this.on(
      PresentationRequestEventType.PresentationReceived,
      presentationReceivedEventHandler,
      true
    );
  }

  receivePresentation(presentation: Presentation): Promise<Presentation> {
    return this.emit(new PresentationReceivedEvent(presentation));
  }

  protected initialize(): void {}

  deserialize(_serialized: Record<string, any>): void {}

  serialize(): Record<string, any> {
    return {};
  }
}
