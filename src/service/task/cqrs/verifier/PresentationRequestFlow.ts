import { DID } from '@/api/DID';
import { Transport, Response } from '@/service/transport/Transport';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { PresentationVerification } from '@/service/credential/PresentationVerification';
import { Context } from '@/api/Agent';
import { EventType as CommonEventType } from '@/service/task/cqrs/TaskEvent';

export namespace PresentationRequestFlow {
  import Presentation = PresentationFlow.Presentation;
  export type PresentationRequest = {};

  export type PresentationRequestState = {
    subject: DID;
    request: PresentationRequest;
    requestResponse: Response;
    response: Presentation;
    requestedAt: Date;
    respondedAt: Date;
    valid: boolean;
  };

  // TODO replace with Symbols?
  export enum EventType {
    Requested = 'PresentationRequestFlow.Request',
    PresentationReceived = 'PresentationRequestFlow.PresentationReceived',
  }

  export enum CommandType {
    Request = 'PresentationRequestFlow.Request',
    ProcessResponse = 'PresentationRequestFlow.ProcessResponse',
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
        EventType.PresentationReceived,
        {
          respondedAt: new Date(),
          ...command,
          valid,
        },
        task
      );

      this.emit(CommonEventType.Done, {}, task);
    }
  }

  export const register = (context: Context) => {
    context.taskMaster.registerCommandHandler(
      CommandType.Request,
      new RequestPresentationCommandHandler(context.transport)
    );

    context.taskMaster.registerCommandHandler(
      CommandType.ProcessResponse,
      new ProcessPresentationResponseCommandHandler(
        context.credential.presentationVerification
      )
    );
  };
}
