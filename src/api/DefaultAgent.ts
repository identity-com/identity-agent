import { DIDDocument } from 'did-resolver';
import { DID } from '@/api/DID';
import { defaultDIDResolver } from '@/service/did/resolver/Resolver';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
  JWT,
} from '@/service/crypto/CryptoModule';
import { normalizePrivateKey } from '@/lib/crypto/utils';
import { PrivateKeyCrypto } from '@/service/crypto/PrivateKeyCrypto';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { WebStorage } from '@/service/storage/WebStorage';
import { DefaultTaskMaster } from '@/service/task/TaskMaster';
import { JWTVerified } from 'did-jwt';
import { Task } from '@/service/task/Task';
import { DummyTask } from '@/service/task/DummyTask';
import { Subject, Agent, Context } from './internal';

export class DefaultAgent implements Agent {
  readonly document: DIDDocument;
  readonly context: Context;

  constructor(document: DIDDocument, context: Context) {
    this.document = document;
    this.context = context;
  }

  get did(): DID {
    return this.document.id as DID;
  }

  asSubject(): Subject {
    return new Subject(this);
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
  startSlowTask(delay?: number): Task<string> {
    return this.context.taskMaster.register(new DummyTask(delay));
  }

  // temp
  allResults(): Promise<any[]> {
    return this.context.taskMaster.allResults();
  }

  static for(did: DID) {
    return new DefaultAgent.Builder(did);
  }

  static Builder = class {
    did: DID;
    context: Partial<Context>;
    key?: AsymmetricKey;

    constructor(did: DID) {
      this.did = did;
      this.context = {};
    }

    withKey(key: AsymmetricKeyInput): this {
      this.key = normalizePrivateKey(key);
      return this;
    }

    async build(): Promise<Agent> {
      this.context.storage = new WebStorage();
      this.context.didResolver = defaultDIDResolver(this.context.storage);

      if (this.key) {
        this.context.crypto = new PrivateKeyCrypto(
          this.did,
          this.key,
          this.context.didResolver
        );
      } else {
        this.context.crypto = new DefaultCryptoModule(
          this.did,
          this.context.didResolver
        );
      }

      const document = await this.context.didResolver(this.did);

      // rehydrate the tasks only after resolving the DID
      this.context.taskMaster = await DefaultTaskMaster.rehydrate(
        this.context.storage
      );

      return new DefaultAgent(document, this.context as Context);
    }
  };
}
