import { DID } from '@/api/DID';
import { Agent, Context } from '@/api/Agent';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { normalizePrivateKey } from '@/lib/crypto/utils';
import { WebStorage } from '@/service/storage/WebStorage';
import { defaultDIDResolver } from '@/service/did/resolver/Resolver';
import { PrivateKeyCrypto } from '@/service/crypto/PrivateKeyCrypto';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { DefaultTaskMaster } from '@/service/task/TaskMaster';
import { DefaultAgent } from '@/api/internal';
import { DefaultHttp } from '@/service/transport/http/DefaultHttp';
import { HttpTransport } from '@/service/transport/HttpTransport';

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

    this.context.transport = new HttpTransport(
      new DefaultHttp(),
      this.context.didResolver,
      this.context.crypto
    );

    return new DefaultAgent(document, this.context as Context);
  }
}
