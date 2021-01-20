export type StorageKey = string | string[];
export type StorageValue = string | Record<string, any>;
export type PutOptions = {
  allowOverwrite?: boolean;
};
export type RemoveOptions = {
  errorOnMissing?: boolean;
};
export interface AgentStorage {
  put(
    key: StorageKey,
    value: StorageValue,
    options?: PutOptions
  ): Promise<void>;
  get(key: StorageKey): Promise<StorageValue | null>;
  findKeys(keyFragment: StorageKey): Promise<StorageKey[]>;
  remove(key: StorageKey, options?: RemoveOptions): Promise<void>;
}
