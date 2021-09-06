import { DIDDocument, PublicKey } from 'did-resolver';
import { Config } from '@/api/Agent';
import { DID } from '@/api/DID';
import * as StubCache from '@/service/did/resolver/StubCache';
import { S3Cache } from '@/service/did/resolver/S3Cache';
import {
  makeDocumentForKeys,
  makeDummyDocument,
  makeMessageService,
} from '@/service/did/generator/generate';
import { AsymmetricKey } from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { always, memoizeWith } from 'ramda';
import { injectable } from 'inversify';
import { Http, HttpResponse } from '@/service/transport/http/Http';
import {
  DEFAULT_REGISTRAR,
  DEFAULT_RESOLVER,
  S3_DID_METHOD,
} from '@/lib/constants';
import { DID_METHOD } from '@/lib/did/utils';
import Debug from 'debug';
import { getKey } from '@/lib/did/serviceUtils';

const debug = Debug('ia:registry');

interface Registry {
  register(document: DIDDocument): Promise<DID>;

  registerForKeys(
    signKey: AsymmetricKey,
    encryptKey: nacl.BoxKeyPair
  ): Promise<DID>;
}

interface ResolverResult extends HttpResponse {
  bodyJson: {
    didDocument: DIDDocument;
  };
}

interface RegistrationResult extends HttpResponse {
  bodyJson: {
    didState: {
      identifier: DID;
    };
  };
}

// TODO temporary function until SOLID method allows content
const mergeDocs = (
  fromResolver: DIDDocument,
  fromS3: DIDDocument
): DIDDocument => {
  fromS3.publicKey[0].id =
    fromResolver.id + '#key' + (fromResolver.publicKey.length + 1);
  const keys = [...fromResolver.publicKey, ...fromS3.publicKey];
  return {
    ...fromResolver,
    // verificationMethod: keys, // TODO add when did-resolver is updated
    publicKey: keys,
    authentication: [fromS3.publicKey[0]],
  };
};

@injectable()
export class DefaultRegistry implements Registry {
  private s3Cache: S3Cache;

  constructor(private config: Config, private http: Http) {
    this.s3Cache = new S3Cache(config);
  }

  private hasS3Permissions: () => Promise<boolean> = memoizeWith(
    always(''),
    () => this.s3Cache.hasPermissions()
  );

  async register(document: DIDDocument) {
    if (
      document.id.startsWith(`did:${S3_DID_METHOD}`) &&
      (await this.hasS3Permissions())
    ) {
      return this.s3Cache.put(document);
    }

    if (document.id.startsWith(`did:${DID_METHOD}`)) {
      const key = (document.keyAgreement as PublicKey[])[0];
      const owner = key.publicKeyBase58;
      const payload = {
        options: {
          cluster: 'devnet',
          owner,
          // TODO generate correct ID and fix all DID Urls
          document,
        },
      };

      const registrationResult = await this.http.post<RegistrationResult>(
        DEFAULT_REGISTRAR,
        JSON.stringify(payload),
        {
          'content-type': 'application/json',
        }
      );

      debug(registrationResult);

      const identifier = registrationResult.bodyJson.didState.identifier as DID;

      document.id = identifier;
      await this.s3Cache.put(document);

      return identifier;
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

  private async getDocumentFromS3(did: DID): Promise<DIDDocument> {
    if (await this.hasS3Permissions()) {
      return this.s3Cache.get(did);
    }

    return StubCache.get(did);
  }

  private async getDocumentFromRemoteResolver(did: DID): Promise<DIDDocument> {
    const resolverUrl = this.config.resolverUrl || DEFAULT_RESOLVER;

    debug(`Retrieving did ${did} with url ${resolverUrl}`);

    // TODO temp until SOLD supports writing services etc
    const s3ResultPromise = this.getDocumentFromS3(did as DID);
    const resolverResultPromise = this.http.get<ResolverResult>(
      resolverUrl + '/' + did
    );

    const [s3Result, resolverResult] = await Promise.all([
      s3ResultPromise,
      resolverResultPromise,
    ]);

    console.log({
      s3Result: JSON.stringify(s3Result, null, 1),
      resolverResult: JSON.stringify(
        resolverResult.bodyJson.didDocument,
        null,
        1
      ),
    });

    const didDocument = mergeDocs(
      resolverResult.bodyJson.didDocument,
      s3Result
    ) as DIDDocument;

    if (!didDocument.service || didDocument.service.length === 0) {
      // Add a "default" service if none is on the DID document.
      // this is not in the hands of the user, as it should be,
      // but allows the agent to support limited DID method such as
      // did:key

      didDocument.service = [makeMessageService(did, this.config)];
    }

    // TODO Temp - add a KeyAgreement key if none exists
    if (!getKey(didDocument, 'X25519KeyAgreementKey2019')) {
      const keyToClone = getKey(didDocument, 'Ed25519VerificationKey2018');
      if (keyToClone) {
        const keyAgreementKey = {
          ...keyToClone,
          type: 'X25519KeyAgreementKey2019',
          // replace an ID like did:solid:devnet:AQXCYsmdqPZAht8rsG8BZBk69FDNJdFaU2nACaQnrzVT#key1
          // with did:solid:devnet:AQXCYsmdqPZAht8rsG8BZBk69FDNJdFaU2nACaQnrzVT#key2
          id: keyToClone.id.replace(
            /(\d+)$/,
            '' + (+didDocument.publicKey.length + 1)
          ),
        };

        didDocument.publicKey.push(keyAgreementKey);
        didDocument.keyAgreement = [keyAgreementKey.id];
      }
    }

    return didDocument;
  }

  resolvers() {
    const fixedResolvers = {
      dummy: async (did: string | DID) => makeDummyDocument(did as DID),
      [S3_DID_METHOD]: async (did: string | DID) =>
        this.getDocumentFromS3(did as DID),
    };

    const self = this;
    return new Proxy(fixedResolvers, {
      get(target, method) {
        const resolver = target[method as keyof typeof fixedResolvers];

        if (resolver) return resolver;

        return async (did: string | DID) =>
          self.getDocumentFromRemoteResolver(did as DID);
      },
    });
  }
}
