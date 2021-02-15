import { DIDDocument } from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { CryptoModule, JWT } from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { Response, Transport } from '@/service/transport/Transport';
import {
  Subject,
  Agent,
  Verifier,
  Identity,
  Builder,
  DefaultSubject,
  DefaultVerifier,
  Config,
} from './internal';
import { Registrar } from '@/service/agent/builder/Registrar';
import { TaskContext, TaskMaster } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import { DeepPartial } from '@/lib/util';
import {
  CommandType,
  MicrowaveState,
  StartCookingCommand,
} from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { Container } from 'inversify';
import { TYPES } from '@/wire/type';
import { AgentStorage } from '@/service/storage/AgentStorage';

const isIdentity = (identity: DID | Identity): identity is Identity =>
  Object.prototype.hasOwnProperty.call(identity, 'did');

export class DefaultAgent implements Agent {
  constructor(readonly document: DIDDocument, readonly container: Container) {}

  get did(): DID {
    return this.document.id as DID;
  }

  resolve(did: DID): Promise<DIDDocument> {
    return this.container.get<DIDResolver>(TYPES.DIDResolver)(did);
  }

  asSubject(): Subject {
    return new DefaultSubject(this);
  }

  asVerifier(): Verifier {
    return new DefaultVerifier(this);
  }

  get crypto(): CryptoModule {
    return this.container.get<CryptoModule>(TYPES.CryptoModule);
  }

  get taskMaster(): TaskMaster {
    return this.container.get<TaskMaster>(TYPES.TaskMaster);
  }

  get storage(): AgentStorage {
    return this.container.get<AgentStorage>(TYPES.AgentStorage);
  }

  get transport(): Transport {
    return this.container.get<Transport>(TYPES.Transport);
  }

  // temp
  sign(payload?: Record<string, any>): Promise<JWT> {
    return this.crypto.createToken(payload || {});
  }

  // temp
  verify(jwt: JWT): Promise<JWTVerified> {
    return this.crypto.verifyToken(jwt);
  }

  // temp
  encrypt(data: string, recipient: DID): Promise<JWE> {
    return this.crypto.encrypt(data, recipient);
  }

  // temp
  decrypt(jwe: JWE): Promise<string> {
    return this.crypto.decrypt(jwe);
  }

  send(message: Record<string, any>, recipient: DID): Promise<Response> {
    return this.transport.send(recipient, message, 'Message');
  }

  // temp
  startSlowTask(delay?: number): TaskContext<MicrowaveState> {
    const taskContext: TaskContext<MicrowaveState> = this.taskMaster.registerTask();

    const command: Sparse<StartCookingCommand> = {
      durationMS: delay || 2000,
    };

    taskContext.dispatch(CommandType.StartCooking, command);

    return taskContext;
  }

  get tasks() {
    return this.taskMaster.tasks;
  }

  static for(identity: DID | Identity, config?: DeepPartial<Config>) {
    if (isIdentity(identity)) {
      return new Builder(identity.did).withKeys(
        identity.signingKey,
        identity.encryptionKey
      );
    }

    return new Builder(identity, config);
  }

  static register(config?: DeepPartial<Config>) {
    return new Registrar(config);
  }
}
