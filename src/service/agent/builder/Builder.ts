import { DID } from '@/api/DID';
import { Agent, Context } from '@/api/Agent';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import {
  generateEncryptKey,
  generateSignKey,
  normalizePrivateKey,
} from '@/lib/crypto/utils';
import { WebStorage } from '@/service/storage/WebStorage';
import { defaultDIDResolver } from '@/service/did/resolver/Resolver';
import { PrivateKeyCrypto } from '@/service/crypto/PrivateKeyCrypto';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { DefaultTaskMaster } from '@/service/task/TaskMaster';
import { DefaultAgent } from '@/api/internal';
import { Registry } from '@/service/did/resolver/Registry';

export class Builder {
  did: DID;
  context: Partial<Context>;
  signingKey?: AsymmetricKey;
  encryptionKey?: nacl.BoxKeyPair;

  constructor(did: DID, context: Partial<Context> = {}) {
    this.did = did;
    this.context = context;

    if (!this.context.config) {
      this.context.config = {};
    }
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
    this.context.didResolver = defaultDIDResolver(
      this.context.config || {},
      this.context.storage
    );

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

  static Registrar = class {
    signingKey?: AsymmetricKey;
    encryptionKey?: nacl.BoxKeyPair;
    context: Partial<Context>;

    constructor(context: Partial<Context> = {}) {
      this.context = context;
    }

    withKeys(
      signingKey: AsymmetricKeyInput,
      encryptionKey: nacl.BoxKeyPair
    ): this {
      this.signingKey = normalizePrivateKey(signingKey);
      this.encryptionKey = encryptionKey; // TODO allow other formats e.g. base58
      return this;
    }

    generateKeys() {
      const signingKey = generateSignKey();
      const encryptionKey = generateEncryptKey();
      return this.withKeys(signingKey, encryptionKey);
    }

    async build() {
      if (!this.signingKey) this.generateKeys();

      if (this.signingKey && this.encryptionKey) {
        const registry = new Registry(this.context.config || {});
        const did = await registry.registerForKeys(
          this.signingKey,
          this.encryptionKey
        );
        const builder = new Builder(did, this.context);
        return builder.withKeys(this.signingKey, this.encryptionKey).build();
      } else throw new Error('Missing keys');
    }
  };
}
