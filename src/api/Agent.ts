import { DIDDocument } from 'did-resolver';
import { DID } from './DID';
import { Subject, DefaultAgent, Verifier } from '@/api/internal';
import { AsymmetricKey, JWT } from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { TaskContext, TaskMaster } from '@/service/task/TaskMaster';
import { Response, Transport } from '@/service/transport/Transport';
import nacl from 'tweetnacl';
import { DeepPartial } from '@/lib/util';
import { MicrowaveState } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { AgentStorage } from '@/service/storage/AgentStorage';

export type Config = {
  // include this only while we keep an S3Cache DID resolver
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;

  // used when registering new DIDs only
  hubBaseUrl?: string;
};

export type Identity = {
  did: DID;
  signingKey: AsymmetricKey;
  encryptionKey: nacl.BoxKeyPair;
};

export abstract class Agent {
  abstract did: DID;
  abstract document: DIDDocument;

  abstract taskMaster: TaskMaster;
  abstract storage: AgentStorage;
  abstract tasks: TaskContext<any>[];
  abstract transport: Transport;

  abstract resolve(did: DID): Promise<DIDDocument>;

  abstract asSubject(): Subject;
  abstract asVerifier(): Verifier;

  abstract sign(payload?: Record<string, any>): Promise<JWT>;
  abstract verify(jwt: JWT): Promise<JWTVerified>;

  abstract encrypt(data: string, recipient: DID): Promise<JWE>;
  abstract decrypt(jwe: JWE): Promise<string>;

  abstract send(
    message: Record<string, any>,
    recipient: DID
  ): Promise<Response>;

  abstract startSlowTask(delay?: number): TaskContext<MicrowaveState>;

  static for(did: DID, config?: DeepPartial<Config>) {
    return DefaultAgent.for(did, config);
  }

  static register(config?: DeepPartial<Config>) {
    return DefaultAgent.register(config);
  }
}
