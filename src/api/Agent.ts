import { DIDDocument } from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import {Subject, DefaultAgent, Verifier} from '@/api/internal';
import {AsymmetricKey, CryptoModule, JWT} from '@/service/crypto/CryptoModule';
import {JWE, JWTVerified} from 'did-jwt';
import { Task } from '@/service/task/Task';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { TaskMaster } from '@/service/task/TaskMaster';
import nacl from "tweetnacl";

export type Context = {
  didResolver: DIDResolver;
  crypto: CryptoModule;
  storage: AgentStorage;
  taskMaster: TaskMaster;
};

export type Identity = { did: DID, signingKey : AsymmetricKey, encryptionKey: nacl.BoxKeyPair }

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
  abstract asVerifier(): Verifier;

  abstract sign(payload?: Record<string, any>): Promise<JWT>;

  abstract verify(jwt: JWT): Promise<JWTVerified>;

  abstract encrypt(data: string, recipient: DID): Promise<JWE>
  abstract decrypt(jwe: JWE):Promise<string>

  abstract startSlowTask(delay?: number): Task<string>;

  abstract allResults(): Promise<any[]>;

  static for(did: DID) {
    return DefaultAgent.for(did);
  }
}
