import { DID } from '@/api/DID';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Transport } from '@/service/transport/Transport';
import { Response } from '@/service/transport/Transport';
import { IssuerProxy } from '@/service/credential/IssuerProxy';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { Context } from '@/api/Agent';
import { Presenter } from '@/service/credential/Presenter';
import { EventHandler } from '@/service/task/cqrs/EventHandler';
import {
  EventType as CommonEventType,
  TaskEvent,
} from '@/service/task/cqrs/TaskEvent';
import { TaskMaster } from '@/service/task/TaskMaster';

export namespace PresentationFlow {
  import PresentationRequest = PresentationRequestFlow.PresentationRequest;
  import CredentialRequest = CredentialRequestFlow.CredentialRequest;
  export type Presentation = {};

  export type PresentationState = {
    verifier: DID;
    request: PresentationRequest;
    requestedAt: Date;
    respondedAt: Date;
    rejectedAt: Date;
    rejectionReason: string | Error;
    credentialRequests: Task<CredentialRequestFlow.CredentialRequestState>[];
    presentation: Presentation;
    verifierResponse: Response;
  };

  export enum EventType {
    Requested = 'PresentationFlow.Requested',
    Resolved = 'PresentationFlow.Resolved',
    Confirmed = 'PresentationFlow.Confirmed',
    Responded = 'PresentationFlow.Responded',
    Rejected = 'PresentationFlow.Rejected',
    CredentialRequested = 'PresentationFlow.CredentialRequested',
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
    RequestCredentialCommand,
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

      this.emit(
        EventType.Resolved,
        {
          presentation,
        },
        task
      );
    }
  }

  export interface RequestCredentialCommand
    extends Command<CommandType.RequestCredential> {
    readonly request: CredentialRequest;
  }
  export class RequestCredentialCommandHandler extends CommandHandler<
    CommandType.Respond,
    RequestCredentialCommand,
    PresentationState
  > {
    constructor(private issuer: IssuerProxy) {
      super();
    }

    async execute(
      command: RequestCredentialCommand,
      task: Task<PresentationState>
    ) {
      const credentialRequestTask = this.issuer.requestCredential(
        command.request
      );

      this.emit(
        EventType.CredentialRequested,
        {
          credentialRequests: [
            ...(task.state.credentialRequests || []),
            credentialRequestTask,
          ],
        },
        task
      );
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

  export class ResolvedEventHandler
    implements EventHandler<EventType.Resolved, PresentationState> {
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
      CommandType.RequestCredential,
      new RequestCredentialCommandHandler(context.credential.issuerProxy)
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
      EventType.Resolved,
      new ResolvedEventHandler(context.taskMaster)
    );

    context.taskMaster.registerEventHandler(
      EventType.Confirmed,
      new ConfirmedEventHandler(context.taskMaster)
    );
  };
}
