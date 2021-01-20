import { DIDDocument } from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { Subject, DefaultAgent } from '@/api/internal';
import { CryptoModule, JWT } from '@/service/crypto/CryptoModule';
import { JWTVerified } from 'did-jwt';
import { Task } from '@/service/task/Task';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { TaskMaster } from '@/service/task/TaskMaster';

export type Context = {
  didResolver: DIDResolver;
  crypto: CryptoModule;
  storage: AgentStorage;
  taskMaster: TaskMaster;
};
export abstract class Agent {
  readonly document: DIDDocument;
  readonly context: Context;

  constructor(document: DIDDocument, context: Context) {
    this.document = document;
    this.context = context;
  }

  get did(): DID {
    return this.document.id as DID;
  }

  abstract asSubject(): Subject;

  abstract sign(payload?: Record<string, any>): Promise<JWT>;

  abstract verify(jwt: JWT): Promise<JWTVerified>;

  abstract startSlowTask(delay?: number): Task<string>;

  abstract allResults(): Promise<any[]>;

  static for(did: DID) {
    return DefaultAgent.for(did);
  }
}
