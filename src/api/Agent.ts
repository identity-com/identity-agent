import { DIDDocument } from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { Subject, DefaultAgent, Verifier } from '@/api/internal';
import {
  AsymmetricKey,
  CryptoModule,
  JWT,
} from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { TaskContext, TaskMaster } from '@/service/task/TaskMaster';
import { Transport, Response } from '@/service/transport/Transport';
import nacl from 'tweetnacl';
import { MicrowaveFlow } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { Presenter } from '@/service/credential/Presenter';
import { PresentationVerification } from '@/service/credential/PresentationVerification';
import { IssuerProxy } from '@/service/credential/IssuerProxy';
import { DeepPartial } from '@/lib/util';

export type Config = {
  // include this only while we keep an S3Cache DID resolver
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;

  // used when registering new DIDs only
  hubBaseUrl?: string;
};

export type Context = {
  didResolver: DIDResolver;
  crypto: CryptoModule;
  storage: AgentStorage;
  taskMaster: TaskMaster;
  config: Config;
  transport: Transport;
  credential: {
    presenter: Presenter;
    presentationVerification: PresentationVerification;
    issuerProxy: IssuerProxy;
  };
};

export type Identity = {
  did: DID;
  signingKey: AsymmetricKey;
  encryptionKey: nacl.BoxKeyPair;
};

export abstract class Agent {
  abstract did: DID;
  abstract document: DIDDocument;
  abstract context: Context;

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

  abstract startSlowTask(
    delay?: number
  ): TaskContext<MicrowaveFlow.MicrowaveState>;

  abstract get tasks(): TaskContext<any>[];

  static for(did: DID, context?: DeepPartial<Context>) {
    return DefaultAgent.for(did, context);
  }

  static register(context?: DeepPartial<Context>) {
    return DefaultAgent.register(context);
  }
}
