import {DefaultTask} from "@/service/task/DefaultTask";
import {Presentation, PresentationRequest} from "@/service/task/subject/Presentation";
import {DID} from "@/api/DID";
import {TaskEvent} from "@/service/task/TaskEvent";
import {DoneEvent} from "@/service/task/DoneEvent";

export enum PresentationRequestEventType {
  PresentationReceived = "PresentationReceived"
}

export class PresentationReceivedEvent extends TaskEvent<PresentationRequestEventType.PresentationReceived> {
  readonly presentation: Presentation;

  constructor(presentation: Presentation) {
    super(PresentationRequestEventType.PresentationReceived);
    this.presentation = presentation;
  }
}

export class PresentationRequestTask extends DefaultTask<Presentation> {
  static TYPE = 'PresentationRequestTask'

  readonly request?: PresentationRequest;
  readonly subject?: DID;

  constructor(request?: PresentationRequest, subject?: DID) {
    super(PresentationRequestTask.TYPE);
    this.request = request;
    this.subject = subject;

    this.initialize();

    const presentationReceivedEventHandler = {
      handle: (event: PresentationReceivedEvent) => {
        this.emit(new DoneEvent(event.presentation))
        return Promise.resolve(); // TODO allow void return type
      }
    }

    this.on(PresentationRequestEventType.PresentationReceived, presentationReceivedEventHandler, true);
  }

  protected initialize(): void {}

  deserialize(_serialized: Record<string, any>): void {
  }

  serialize(): Record<string, any> {
    return {};
  }
}

