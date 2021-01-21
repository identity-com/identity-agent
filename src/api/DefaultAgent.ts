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
import { JWE, JWTVerified } from 'did-jwt';
import { Task } from '@/service/task/Task';
import { DummyTask } from '@/service/task/DummyTask';
import { Subject, Agent, Context, Verifier, Identity } from './internal';
import nacl from 'tweetnacl';

const isIdentity = (identity: DID | Identity): identity is Identity =>
  Object.prototype.hasOwnProperty.call(identity, 'did');

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

  decrypt(jwe: JWE): Promise<string> {
    return this.context.crypto.decrypt(jwe);
  }

  // temp
  startSlowTask(delay?: number): Task<string> {
    return this.context.taskMaster.register(new DummyTask(delay));
  }

  // temp
  allResults(): Promise<any[]> {
    return this.context.taskMaster.allResults();
  }

  static for(identity: DID | Identity) {
    if (isIdentity(identity)) {
      return new DefaultAgent.Builder(identity.did).withKeys(
        identity.signingKey,
        identity.encryptionKey
      );
    }

    return new DefaultAgent.Builder(identity);
  }

  static Builder = class {
    did: DID;
    context: Partial<Context>;
    signingKey?: AsymmetricKey;
    encryptionKey?: nacl.BoxKeyPair;

    constructor(did: DID) {
      this.did = did;
      this.context = {};
    }

    withKeys(
      signingKey: AsymmetricKeyInput,
      encryptionKey: nacl.BoxKeyPair
    ): this {
      this.signingKey = normalizePrivateKey(signingKey);
      this.encryptionKey = encryptionKey; // TODO allow other formats e.g. base58
      return this;
    }

    async build(): Promise<Agent> {
      this.context.storage = new WebStorage();
      this.context.didResolver = defaultDIDResolver(this.context.storage);

      if (this.signingKey && this.encryptionKey) {
        this.context.crypto = new PrivateKeyCrypto(
          this.did,
          this.signingKey,
          this.encryptionKey,
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
