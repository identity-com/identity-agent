import {
  AgentStorage,
  StorageKey,
  StorageValue,
} from '@/service/storage/AgentStorage';

const cache: Record<string, any> = {};
const toKey = (storageKey: StorageKey): string =>
  Array(storageKey).flat().join(',');

export class InMemoryStorage implements AgentStorage {
  put(key: StorageKey, value: StorageValue) {
    cache[toKey(key)] = value;
    return Promise.resolve();
  }

  get(key: StorageKey) {
    return cache[toKey(key)];
  }

  remove(key: StorageKey) {
    delete cache[toKey(key)];
    return Promise.resolve();
  }

  findKeys(keyFragment: StorageKey) {
    const matchedKeys = Object.keys(cache).filter((key) =>
      key.startsWith(toKey(keyFragment))
    );
    return Promise.all(matchedKeys.map((key) => cache[key]));
  }
}
