import { DID } from '@/api/DID';
import { Transport } from '@/service/transport/Transport';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { PresentationVerification } from '@/service/credential/PresentationVerification';

export namespace PresentationRequestFlow {
  import Presentation = PresentationFlow.Presentation;
  export type PresentationRequest = {};

  export type PresentationRequestState = {
    subject: DID;
    request: PresentationRequest;
    requestResponse: Presentation;
    requestedAt: Date;
    respondedAt: Date;
    valid: boolean;
  };

  export enum EventType {
    Requested = 'Request',
    Responded = 'Responded',
  }

  export enum CommandType {
    Request = 'Request',
    ProcessResponse = 'ProcessResponse',
  }

  export interface RequestPresentationCommand
    extends Command<CommandType.Request> {
    readonly subject: DID;
    readonly request: PresentationRequest;
  }

  export interface ProcessPresentationResponseCommand
    extends Command<CommandType.ProcessResponse> {
    readonly response: Presentation;
  }

  export class RequestPresentationCommandHandler extends CommandHandler<
    CommandType.Request,
    RequestPresentationCommand,
    PresentationRequestState
  > {
    constructor(private transport: Transport) {
      super();
    }

    async execute(
      command: RequestPresentationCommand,
      task: Task<PresentationRequestState>
    ) {
      const requestResponse = await this.transport.send(
        command.subject,
        command.request,
        'PresentationRequest'
      );

      this.emit(
        EventType.Requested,
        {
          requestedAt: new Date(),
          ...command,
          requestResponse,
        },
        task
      );
    }
  }

  export class ProcessPresentationResponseCommandHandler extends CommandHandler<
    CommandType.ProcessResponse,
    ProcessPresentationResponseCommand,
    PresentationRequestState
  > {
    constructor(private verification: PresentationVerification) {
      super();
    }

    async execute(
      command: ProcessPresentationResponseCommand,
      task: Task<PresentationRequestState>
    ) {
      const valid = await this.verification.verify(command.response);

      this.emit(
        EventType.Responded,
        {
          respondedAt: new Date(),
          ...command,
          valid,
        },
        task
      );
    }
  }
}
