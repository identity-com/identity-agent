import { DID } from '@/api/DID';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { IssuerProxy } from '@/service/credential/IssuerProxy';
import { Task } from '../Task';
import { Command } from '@/service/task/cqrs/Command';
import { bind } from '@/wire/util';
import { TYPES } from '@/wire/type';
import { TaskMaster } from '@/service/task/TaskMaster';
import { Container } from 'inversify';

export type CredentialType = string;
export type Credential = {};
export type CredentialRequest = {
  issuer?: DID;
  type: CredentialType;
};

export type CredentialRequestState = {
  issuer: DID;
  request: CredentialRequest;
  credential: Credential;
  requestedAt: Date;
  forPresentationRequestTaskId: string;
};

export enum EventType {
  Requested = 'CredentialRequestFlow.Requested',
  Responded = 'CredentialRequestFlow.Responded',
}

export enum CommandType {
  Request = 'CredentialRequestFlow.Request',
}

export interface RequestCredentialCommand extends Command<CommandType.Request> {
  request: CredentialRequest;
  requestedAt: Date;
  forPresentationRequestTaskId: string;
}

export class RequestCredentialCommandHandler extends CommandHandler<
  CommandType.Request,
  RequestCredentialCommand,
  CredentialRequestState
> {
  constructor(private readonly issuer: IssuerProxy<any>) {
    super();
  }

  async execute(
    command: RequestCredentialCommand,
    task: Task<CredentialRequestState>
  ): Promise<void> {
    const credential = await this.issuer.requestCredential(command.request);
    this.emit(EventType.Responded, { credential }, task);
  }
}

export const register = (container: Container) =>
  bind(
    container,
    (taskMaster: TaskMaster, issuerProxy: IssuerProxy<any>) => {
      taskMaster.registerCommandHandler(
        CommandType.Request,
        new RequestCredentialCommandHandler(issuerProxy)
      );
    },
    [TYPES.TaskMaster, TYPES.IssuerProxy]
  )();
