import {
  Resolver,
  DIDDocument,
  inMemoryCache,
  DIDCache,
  ParsedDID,
  WrappedResolver,
} from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { AgentStorage } from '@/service/storage/AgentStorage';
import * as StubCache from '@/service/did/resolver/StubCache';
import * as S3 from '@/service/did/resolver/S3Cache';
import { AsymmetricKey } from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import {
  makeDocumentForKeys,
  makeDummyDocument,
} from '@/service/did/generator/generate';

const STORAGE_FOLDER = 'dids';

let hasS3Permissions: Promise<boolean> | null = null;
const getDocument = async (did: DID): Promise<DIDDocument> => {
  if (hasS3Permissions === null) {
    hasS3Permissions = S3.hasPermissions();
  }

  if (await hasS3Permissions) {
    return S3.get(did);
  }

  return StubCache.get(did);
};
export const registerDocument = async (document: DIDDocument): Promise<DID> => {
  if (hasS3Permissions === null) {
    hasS3Permissions = S3.hasPermissions();
  }

  if (await hasS3Permissions) {
    return S3.put(document);
  }

  return StubCache.register(document);
};

const registry = {
  dummy: async (did: string | DID) => makeDummyDocument(did as DID),
  civic: async (did: string | DID) => getDocument(did as DID),
};

const wrapStorage = (storage: AgentStorage): DIDCache => async (
  parsed: ParsedDID,
  resolve: WrappedResolver
) => {
  if (parsed.params && parsed.params['no-cache'] === 'true') return resolve();

  const storageKey = [STORAGE_FOLDER, parsed.did];
  const cached = (await storage.get(storageKey)) as DIDDocument;
  if (cached) return cached;
  const doc = await resolve();
  if (doc) {
    await storage.put(storageKey, doc);
  }
  return doc;
};

export const registerForKeys = (
  signKey: AsymmetricKey,
  encryptKey: nacl.BoxKeyPair
): Promise<DID> => {
  const document = makeDocumentForKeys(signKey, encryptKey);
  return registerDocument(document);
};

export const defaultDIDResolver = (storage?: AgentStorage): DIDResolver => {
  const cache = storage ? wrapStorage(storage) : inMemoryCache();
  const resolver = new Resolver(registry, cache);
  return (did: DID) => resolver.resolve(did);
};
