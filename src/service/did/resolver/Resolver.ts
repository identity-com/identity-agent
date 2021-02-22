import {
  Resolver,
  DIDDocument,
  inMemoryCache,
  DIDCache,
  ParsedDID,
  WrappedResolver,
} from 'did-resolver';
import { DID } from '@/api/DID';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { Config } from '@/api/Agent';
import { DefaultRegistry } from '@/service/did/resolver/DefaultRegistry';
import { bind } from '@/wire/util';
import { TYPES } from '@/wire/type';
import { Container } from 'inversify';

export const STORAGE_FOLDER = 'dids';

const makeRegistry = (config: Config) =>
  new DefaultRegistry(config).resolvers();

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

export const buildDIDResolver = (config: Config, storage?: AgentStorage) => {
  const cache = storage ? wrapStorage(storage) : inMemoryCache();
  const registry = makeRegistry(config);

  const resolver = new Resolver(registry, cache);
  return (did: DID) => resolver.resolve(did);
};

export const wireDIDResolverFactory = (
  config: Config,
  container: Container
) => {
  return bind(container, (storage) => buildDIDResolver(config, storage), [
    TYPES.AgentStorage,
  ]);
};
