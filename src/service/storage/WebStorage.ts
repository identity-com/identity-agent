import {
  AgentStorage,
  PutOptions,
  RemoveOptions,
  StorageKey,
  StorageValue,
} from '@/service/storage/AgentStorage';
import { LocalStorage } from 'node-localstorage';
import { complement, isNil, range } from 'ramda';
import { injectable } from 'inversify';

const DELIMITER = ':';

const concatenateKey = (key: StorageKey): string =>
  [key].flat().map(encodeURIComponent).join(DELIMITER);
const unconcatenateKey = (concatenatedKey: string): StorageKey =>
  concatenatedKey.split(DELIMITER).map(decodeURIComponent);

@injectable()
export class WebStorage implements AgentStorage {
  private localStorage: Storage;

  constructor() {
    if (
      !global.window ||
      typeof global.window.localStorage === 'undefined' ||
      global.window.localStorage === null
    ) {
      this.localStorage = new LocalStorage('./scratch');
    } else {
      this.localStorage = global.window.localStorage;
    }
  }

  get(key: StorageKey): Promise<StorageValue | null> {
    const item = this.localStorage.getItem(concatenateKey(key));

    if (item === null) return Promise.resolve(null);

    const parsedItem = JSON.parse(item);

    return Promise.resolve(parsedItem);
  }

  async put(
    key: StorageKey,
    value: StorageValue,
    options: PutOptions = {}
  ): Promise<void> {
    if (options.allowOverwrite === false) {
      const exists = await this.get(key);
      if (exists !== null)
        throw new Error(
          `Attempt to overwrite key ${key} in storage but allowOverwrite was set to false`
        );
    }

    const stringifiedValue = JSON.stringify(value, null, 1);

    this.localStorage.setItem(concatenateKey(key), stringifiedValue);

    return Promise.resolve();
  }

  async remove(key: StorageKey, options: RemoveOptions = {}): Promise<void> {
    if (options.errorOnMissing) {
      const exists = await this.get(key);
      if (exists !== null)
        throw new Error(
          `Attempt to remove missing key ${key} in storage but errorOnMissing was set to true`
        );
    }
    this.localStorage.removeItem(concatenateKey(key));
    return Promise.resolve();
  }

  findKeys(keyFragment: StorageKey): Promise<StorageKey[]> {
    const concatenatedKeyFragment = concatenateKey(keyFragment);

    const allMatchingKeys =
      // iterate through all the keys in storage
      range(0, this.localStorage.length)
        // extract each one
        .map((i) => this.localStorage.key(i))
        // guard against nulls
        // (since we are iterating across a range provided by the localstorage,
        // there should be none)
        .filter(complement(isNil) as (x: string | null) => x is string)
        // check if it matches the key we arer looking for
        .filter((key) => key.startsWith(concatenatedKeyFragment))
        // if so, convert it to a storage key
        .map(unconcatenateKey);

    return Promise.resolve(allMatchingKeys);
  }
}
