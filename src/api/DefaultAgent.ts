import { DIDDocument } from 'did-resolver';
import { DID } from '@/api/DID';
import { JWT } from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { Response } from '@/service/transport/Transport';
import {
  Subject,
  Agent,
  Context,
  Verifier,
  Identity,
  Builder,
} from './internal';
import { Registrar } from '@/service/agent/builder/Registrar';
import { MicrowaveFlow } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { TaskContext } from '@/service/task/TaskMaster';
import { Sparse } from '@/service/task/cqrs/Command';
import { DeepPartial } from '@/lib/util';

const isIdentity = (identity: DID | Identity): identity is Identity =>
  Object.prototype.hasOwnProperty.call(identity, 'did');

export class DefaultAgent implements Agent {
  constructor(readonly document: DIDDocument, readonly context: Context) {}

  get did(): DID {
    return this.document.id as DID;
  }

  resolve(did: DID): Promise<DIDDocument> {
    return this.context.didResolver(did);
  }

  asSubject(): Subject {
    return new Subject(this);
  }

  asVerifier(): Verifier {
    return new Verifier(this);
  }

  // temp
  sign(payload?: Record<string, any>): Promise<JWT> {
    return this.context.crypto.createToken(payload || {});
  }

  // temp
  verify(jwt: JWT): Promise<JWTVerified> {
    return this.context.crypto.verifyToken(jwt);
  }

  // temp
  encrypt(data: string, recipient: DID): Promise<JWE> {
    return this.context.crypto.encrypt(data, recipient);
  }

  // temp
  decrypt(jwe: JWE): Promise<string> {
    return this.context.crypto.decrypt(jwe);
  }

  send(message: Record<string, any>, recipient: DID): Promise<Response> {
    return this.context.transport.send(recipient, message, 'Message');
  }

  // temp
  startSlowTask(delay?: number): TaskContext<MicrowaveFlow.MicrowaveState> {
    const taskContext: TaskContext<MicrowaveFlow.MicrowaveState> = this.context.taskMaster.registerTask();

    const command: Sparse<MicrowaveFlow.StartCookingCommand> = {
      durationMS: delay || 2000,
    };

    taskContext.dispatch(MicrowaveFlow.CommandType.StartCooking, command);

    return taskContext;
  }

  get tasks() {
    return this.context.taskMaster.tasks;
  }

  static for(identity: DID | Identity, context?: DeepPartial<Context>) {
    if (isIdentity(identity)) {
      return new Builder(identity.did).withKeys(
        identity.signingKey,
        identity.encryptionKey
      );
    }

    return new Builder(identity, context);
  }

  static register(context?: DeepPartial<Context>) {
    return new Registrar(context);
  }
}
