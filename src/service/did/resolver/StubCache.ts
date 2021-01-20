import { keyToBase58Compressed, normalizePublicKey } from '@/lib/crypto/utils';
import { AsymmetricKey, PublicKey } from '@/service/crypto/CryptoModule';
import { DIDDocument } from 'did-resolver';
import { deriveFromKey } from '@/lib/did/utils';
import { DID } from '@/api/DID';

// const dummyXprv = 'xprv9vBSiyPPnUq3h9m1kMG4n2iY8CQDeWHTWV3bxWqaEECp5JfJULz4yBmYniAW3iJE9381onwJxx7xufcRordF3Y1PZ2dNhCBmye6Sw6NNaGf'
const dummyXpub =
  'xpub69Ao8UvHcrPLudqUrNo59AfGgEEi3y1JshyCkuFBnZjnx6zT1tJKWz62e2g6MdgXLoiqSHgANwkzGM45XKxY9PQcC7pDaK3SuRL1DH8kqJq';

const makeKeyEntry = (did: DID, key: PublicKey) => ({
  publicKeyBase58: keyToBase58Compressed(key),
  id: `${did}#authentication`,
  usage: 'signing',
  type: 'Secp256k1VerificationKey2018',
  controller: did,
});

const makeDocument = (did: DID, key: PublicKey) => {
  const keyEntry = makeKeyEntry(did, key);

  return {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [keyEntry],
    authentication: [keyEntry],
  };
};

const makeDocumentForKey = (key: AsymmetricKey): DIDDocument => {
  const did = deriveFromKey(key);
  return makeDocument(did, key);
};

export const makeDummyDocument = (did: DID): DIDDocument =>
  makeDocument(did, normalizePublicKey(dummyXpub));

const cache: Record<string, DIDDocument> = {};
export const registerForKey = (key: AsymmetricKey): DID => {
  const document = makeDocumentForKey(key);
  cache[document.id] = document;
  return document.id as DID;
};
export const get = (did: DID) => cache[did];
