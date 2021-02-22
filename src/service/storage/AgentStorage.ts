export type StorageKey = string | string[];
export type StorageValue = string | Record<string, any>;
export type PutOptions = {
  allowOverwrite?: boolean;
};
export type RemoveOptions = {
  errorOnMissing?: boolean;
};

/**
 * The storage module for an agent. Task state and DID documents of all known
 * parties are stored here. Example implementations may include:
 * - local storage for browsers
 * - file storage for a command-line agent or REPL
 * - DB for a remote agent.
 *
 */
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
