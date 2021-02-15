import { DID } from '@/api/DID';
import { Transport, Response } from '@/service/transport/Transport';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { PresentationVerification } from '@/service/credential/PresentationVerification';
import { EventType as CommonEventType } from '@/service/task/cqrs/TaskEvent';
import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';
import { bind } from '@/wire/util';
import { TaskMaster } from '@/service/task/TaskMaster';
import { TYPES } from '@/wire/type';
import { Container } from 'inversify';

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
      // TODO does this wrapping belong in the transport layer?
      { presentationRequest: command.request },
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

export const register = (container: Container) =>
  bind(
    container,
    (
      taskMaster: TaskMaster,
      transport: Transport,
      presentationVerification: PresentationVerification
    ) => {
      taskMaster.registerCommandHandler(
        CommandType.Request,
        new RequestPresentationCommandHandler(transport)
      );

      taskMaster.registerCommandHandler(
        CommandType.ProcessResponse,
        new ProcessPresentationResponseCommandHandler(presentationVerification)
      );
    },
    [TYPES.TaskMaster, TYPES.Transport, TYPES.PresentationVerification]
  )();
