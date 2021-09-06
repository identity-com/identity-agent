import {
  AsymmetricKey,
  AsymmetricKeyInput,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { Config } from '@/api/Agent';
import {
  generateEncryptKey,
  generateSignKey,
  normalizePrivateKey,
} from '@/lib/crypto/utils';
import { DefaultRegistry } from '@/service/did/resolver/DefaultRegistry';
import { Builder } from '@/service/agent/builder/Builder';
import { DeepPartial } from '@/lib/util';
import { DefaultHttp } from '@/service/transport/http/DefaultHttp';

export class Registrar {
  signingKey?: AsymmetricKey;
  encryptionKey?: nacl.BoxKeyPair;
  config: DeepPartial<Config>;

  constructor(config: DeepPartial<Config> = {}) {
    this.config = config;
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
      const registry = new DefaultRegistry(
        this.config || {},
        new DefaultHttp()
      );
      const did = await registry.registerForKeys(
        this.signingKey,
        this.encryptionKey
      );
      const builder = new Builder(did, this.config);
      return builder.withKeys(this.signingKey, this.encryptionKey).build();
    } else throw new Error('Missing keys');
  }
}
