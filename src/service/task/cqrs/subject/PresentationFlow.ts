import { DID } from '@/api/DID';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CredentialRequest } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Transport, Response } from '@/service/transport/Transport';
import { Context } from '@/api/Agent';
import { Presenter } from '@/service/credential/Presenter';
import { EventHandler } from '@/service/task/cqrs/EventHandler';
import {
  EventType as CommonEventType,
  TaskEvent,
} from '@/service/task/cqrs/TaskEvent';
import { TaskContext, TaskMaster } from '@/service/task/TaskMaster';
import { PresentationRequest } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import * as CredentialRequestFlow from '@/service/task/cqrs/subject/CredentialRequestFlow';

export type Presentation = {};

export type PresentationState = {
  verifier: DID;
  request: PresentationRequest;
  requestedAt: Date;
  respondedAt: Date;
  rejectedAt: Date;
  rejectionReason: string | Error;
  credentialRequests: CredentialRequest[];
  presentation: Presentation;
  verifierResponse: Response;
};

export enum EventType {
  Requested = 'PresentationFlow.Requested',
  MissingCredentials = 'PresentationFlow.MissingCredential',
  Resolved = 'PresentationFlow.Resolved',
  Confirmed = 'PresentationFlow.Confirmed',
  Responded = 'PresentationFlow.Responded',
  Rejected = 'PresentationFlow.Rejected',
}

export enum CommandType {
  Request = 'PresentationFlow.Request',
  RequestCredential = 'PresentationFlow.RequestCredential',
  Confirm = 'PresentationFlow.Confirm',
  Reject = 'PresentationFlow.Reject',
  Respond = 'PresentationFlow.Respond',
}

export interface RequestPresentationCommand
  extends Command<CommandType.Request> {
  readonly verifier: DID;
  readonly request: PresentationRequest;
}
export class RequestPresentationCommandHandler extends CommandHandler<
  CommandType.Request,
  RequestPresentationCommand,
  PresentationState
> {
  constructor(private presenter: Presenter) {
    super();
  }

  async execute(
    command: RequestPresentationCommand,
    task: Task<PresentationState>
  ) {
    this.emit(EventType.Requested, command, task);

    const presentation = await this.presenter.present(command.request);

    // TODO replace with some Missing array for multiple missing credentials
    if (!presentation) {
      const newCredentialRequest = { type: 'TODO' };
      this.emit(
        EventType.MissingCredentials,
        {
          credentialRequests: [newCredentialRequest],
        },
        task
      );
    } else {
      this.emit(
        EventType.Resolved,
        {
          presentation,
        },
        task
      );
    }
  }
}

export interface ConfirmCommand extends Command<CommandType.Confirm> {}
export class ConfirmCommandHandler extends CommandHandler<
  CommandType.Confirm,
  RespondCommand,
  PresentationState
> {
  async execute(_command: ConfirmCommand, task: Task<PresentationState>) {
    this.emit(EventType.Confirmed, {}, task);
  }
}

export interface RejectCommand extends Command<CommandType.Reject> {
  rejectionReason: string | Error;
}
export class RejectCommandHandler extends CommandHandler<
  CommandType.Reject,
  RejectCommand,
  PresentationState
> {
  async execute(command: RejectCommand, task: Task<PresentationState>) {
    this.emit(
      EventType.Rejected,
      { rejectionReason: command.rejectionReason },
      task
    );

    this.emit(CommonEventType.Done, {}, task);
  }
}

export interface RespondCommand extends Command<CommandType.Respond> {
  readonly response: Presentation;
}
export class RespondCommandHandler extends CommandHandler<
  CommandType.Respond,
  RespondCommand,
  PresentationState
> {
  constructor(private transport: Transport) {
    super();
  }

  async execute(command: RespondCommand, task: Task<PresentationState>) {
    const verifierResponse = await this.transport.send(
      task.state.verifier,
      command.response,
      'Presentation'
    );

    this.emit(
      EventType.Responded,
      {
        respondedAt: new Date(),
        verifierResponse,
      },
      task
    );

    this.emit(CommonEventType.Done, {}, task);
  }
}

type Handler<ET extends string> = EventHandler<ET, PresentationState>;

// TODO this would be injected
export class MissingCredentialsEventHandler
  implements Handler<EventType.MissingCredentials> {
  constructor(private taskMaster: TaskMaster) {}
  handle(
    event: TaskEvent<EventType.MissingCredentials, PresentationState>,
    task: Task<PresentationState>
  ) {
    event.payload.credentialRequests?.map((request) => {
      const taskContext: TaskContext<CredentialRequestFlow.CredentialRequestState> = this.taskMaster.registerTask();
      taskContext.dispatch(CredentialRequestFlow.CommandType.Request, {
        request,
        requestedAt: new Date(),
        forPresentationRequestTaskId: task.id,
      });
    });
  }
}

export class ResolvedEventHandler implements Handler<EventType.Resolved> {
  constructor(private taskMaster: TaskMaster) {}
  handle(
    event: TaskEvent<EventType.Resolved, PresentationState>,
    task: Task<PresentationState>
  ) {
    if (event.payload.presentation) {
      this.taskMaster.dispatch(CommandType.Confirm, {
        taskId: task.id,
      });
    }
  }
}

export class ConfirmedEventHandler implements Handler<EventType.Confirmed> {
  constructor(private taskMaster: TaskMaster) {}
  handle(
    _event: TaskEvent<EventType.Confirmed, PresentationState>,
    task: Task<PresentationState>
  ) {
    this.taskMaster.dispatch(CommandType.Respond, {
      taskId: task.id,
    });
  }
}

export const register = (context: Context) => {
  context.taskMaster.registerCommandHandler(
    CommandType.Request,
    new RequestPresentationCommandHandler(context.credential.presenter)
  );

  context.taskMaster.registerCommandHandler(
    CommandType.Confirm,
    new ConfirmCommandHandler()
  );

  context.taskMaster.registerCommandHandler(
    CommandType.Reject,
    new RejectCommandHandler()
  );

  context.taskMaster.registerCommandHandler(
    CommandType.Respond,
    new RespondCommandHandler(context.transport)
  );

  context.taskMaster.registerEventHandler(
    EventType.MissingCredentials,
    new MissingCredentialsEventHandler(context.taskMaster)
  );

  context.taskMaster.registerEventHandler(
    EventType.Resolved,
    new ResolvedEventHandler(context.taskMaster)
  );

  context.taskMaster.registerEventHandler(
    EventType.Confirmed,
    new ConfirmedEventHandler(context.taskMaster)
  );
};
