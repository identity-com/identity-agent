import { DID } from '@/api/DID';
import { Task } from '@/service/task/cqrs/Task';
import { Command } from '@/service/task/cqrs/Command';
import { CredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { Transport } from '@/service/transport/Transport';
import { Response } from '@/service/transport/Transport';
import { IssuerProxy } from '@/service/credential/IssuerProxy';
import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';

export namespace PresentationFlow {
  import PresentationRequest = PresentationRequestFlow.PresentationRequest;
  import CredentialRequest = CredentialRequestFlow.CredentialRequest;
  export type Presentation = {};

  export type PresentationState = {
    verifier: DID;
    request: PresentationRequest;
    requestedAt: Date;
    respondedAt: Date;
    credentialRequests: Task<CredentialRequestFlow.CredentialRequestState>[];
    response: Presentation;
    verifierResponse: Response;
  };

  export enum EventType {
    Requested = 'Request',
    Resolved = 'Resolved',
    Responded = 'Responded',
    CredentialRequested = 'CredentialRequested',
  }

  export enum CommandType {
    Request = 'Request',
    RequestCredential = 'RequestCredential',
    Resolve = 'Resolve',
  }

  export interface RequestPresentationCommand
    extends Command<CommandType.Request> {
    readonly verifier: DID;
    readonly request: PresentationRequest;
  }

  export interface RequestCredentialCommand
    extends Command<CommandType.RequestCredential> {
    readonly request: CredentialRequest;
  }
  export class RequestCredentialCommandHandler extends CommandHandler<
    CommandType.Resolve,
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

  export interface ResolveCommand extends Command<CommandType.Resolve> {
    readonly response: Presentation;
  }
  export class ResolveCommandHandler extends CommandHandler<
    CommandType.Resolve,
    ResolveCommand,
    PresentationState
  > {
    constructor(private transport: Transport) {
      super();
    }

    async execute(command: ResolveCommand, task: Task<PresentationState>) {
      this.emit(
        EventType.Resolved,
        {
          ...command,
        },
        task
      );

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
    }
  }
}
