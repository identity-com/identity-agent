import { DIDDocument } from 'did-resolver';
import { Config } from '@/api/Agent';
import { DID } from '@/api/DID';
import * as StubCache from '@/service/did/resolver/StubCache';
import { S3Cache } from '@/service/did/resolver/S3Cache';
import {
  makeDocumentForKeys,
  makeDummyDocument,
} from '@/service/did/generator/generate';
import { AsymmetricKey } from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { DID_METHOD } from '@/lib/did/utils';
import { always, memoizeWith } from 'ramda';

export class Registry {
  private s3Cache: S3Cache;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.s3Cache = new S3Cache(config);
  }

  private hasS3Permissions: () => Promise<boolean> = memoizeWith(
    always(''),
    () => this.s3Cache.hasPermissions()
  );

  async register(document: DIDDocument) {
    if (await this.hasS3Permissions()) {
      return this.s3Cache.put(document);
    }

    return StubCache.register(document);
  }

  async registerForKeys(
    signKey: AsymmetricKey,
    encryptKey: nacl.BoxKeyPair
  ): Promise<DID> {
    const document = makeDocumentForKeys(signKey, encryptKey, this.config);
    return this.register(document);
  }

  private async getDocument(did: DID): Promise<DIDDocument> {
    if (await this.hasS3Permissions()) {
      return this.s3Cache.get(did);
    }

    return StubCache.get(did);
  }

  resolvers() {
    return {
      dummy: async (did: string | DID) => makeDummyDocument(did as DID),
      [DID_METHOD]: async (did: string | DID) => this.getDocument(did as DID),
    };
  }
}
