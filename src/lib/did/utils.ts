import { crypto } from 'bitcoinjs-lib';
import { PublicKey } from '@/service/crypto/CryptoModule';
import { encode } from 'bs58';
import { DID } from '@/api/DID';

export const DID_METHOD = 'civic';

export const toDID = (method: string, identifier: string): DID =>
  `did:${method}:${identifier}` as DID;

const decomposeDID = (did: DID) => {
  const components = did.match(/^did:(.+):(.+)$/);
  if (!components) throw new Error(`Invalid DID ${did}`);
  const [, method, identifier] = components;
  return { method, identifier };
};

/**
 * Derive a DID from a public key. This is used to generate new DIDs.
 * it uses bitcoin's hash256 to derive the identifier,
 * which performs a double sha256 to protect against length-extension attacks
 * See https://crypto.stackexchange.com/a/884/56797
 *
 * Note, this can be used to create new DIDs, but not verify control
 * of a DID by a particular key. A DID may be associated by many keys,
 * and the original key used to generate the DID may since have been
 * disabled.
 *
 * The only way to know if a key controls a DID is to resolve it,
 * and check the document.
 *
 * @param key The public key to derive the DID from
 */
export const deriveFromKey = (key: PublicKey): DID =>
  toDID(DID_METHOD, encode(crypto.hash256(key.publicKey)));

export const validateFromKey = (did: DID, key: PublicKey) => {
  const { method } = decomposeDID(did);
  if (method !== DID_METHOD)
    throw new Error(`Can only validate ${DID_METHOD} DIDs`);

  const derivedDID = deriveFromKey(key);

  return derivedDID === did;
};
