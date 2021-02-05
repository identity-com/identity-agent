import {
  AsymmetricKey,
  AsymmetricKeyInput,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { Context } from '@/api/Agent';
import {
  generateEncryptKey,
  generateSignKey,
  normalizePrivateKey,
} from '@/lib/crypto/utils';
import { Registry } from '@/service/did/resolver/Registry';
import { Builder } from '@/service/agent/builder/Builder';

export class Registrar {
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
}
