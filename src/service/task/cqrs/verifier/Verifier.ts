import { DID } from '@/api/DID';
import { Transport } from '@/service/transport/Transport';
import {
  Presentation,
  PresentationRequest,
} from '@/service/task/subject/Presentation';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { EventBus } from '@/service/task/cqrs/EventBus';

export namespace Verifier {
  type State = {
    subject: DID;
    request: PresentationRequest;
  };

  export enum EventType {
    Requested = 'Request',
    Responded = 'Responded',
  }

  export enum CommandType {
    Request = 'Request',
    ProcessResponse = 'ProcessResponse',
  }

  export class PresentationRequestTask extends Task<State> {}

  export interface RequestPresentationCommand
    extends Command<CommandType.Request> {
    readonly subject: DID;
    readonly request: PresentationRequest;
  }

  export interface ProcessPresentationResponseCommand
    extends Command<CommandType.ProcessResponse> {
    readonly response: Presentation;
  }

  interface RequestedEvent extends TaskEvent<EventType.Requested> {
    requestedAt: Date;
    request: PresentationRequest;
    subject: DID;
  }
  interface RespondedEvent extends TaskEvent<EventType.Responded> {
    respondedAt: Date;
    response: Presentation;
  }

  export class RequestPresentationCommandHandler extends CommandHandler<
    CommandType.Request,
    RequestPresentationCommand,
    PresentationRequestTask
  > {
    private transport: Transport;

    constructor(eventBus: EventBus, transport: Transport) {
      super(eventBus);
      this.transport = transport;
    }

    async execute(command: RequestPresentationCommand) {
      const requestResponse = await this.transport.send(
        command.subject,
        command.request,
        'PresentationRequest'
      );

      this.emit(EventType.Requested, {
        requestedAt: new Date(),
        ...command,
        requestResponse,
      } as RequestedEvent);
    }
  }

  export class ProcessPresentationResponseCommandHandler extends CommandHandler<
    CommandType.ProcessResponse,
    ProcessPresentationResponseCommand,
    PresentationRequestTask
  > {
    async execute(command: ProcessPresentationResponseCommand) {
      this.emit(EventType.Responded, {
        respondedAt: new Date(),
        ...command,
      } as RespondedEvent);
    }
  }
}
