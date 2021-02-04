import { AsymmetricKey, PublicKey } from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { DID } from '@/api/DID';
import {
  keyBufferToBase58Compressed,
  keyToBase58Compressed,
  normalizePublicKey,
} from '@/lib/crypto/utils';
import { DIDDocument, ServiceEndpoint } from 'did-resolver';
import { deriveFromKey } from '@/lib/did/utils';
import { DEFAULT_HUB } from '@/lib/constants';
import { Config } from '@/api/Agent';

// const dummyXprv = 'xprv9vBSiyPPnUq3h9m1kMG4n2iY8CQDeWHTWV3bxWqaEECp5JfJULz4yBmYniAW3iJE9381onwJxx7xufcRordF3Y1PZ2dNhCBmye6Sw6NNaGf'
const dummyXpub =
  'xpub69Ao8UvHcrPLudqUrNo59AfGgEEi3y1JshyCkuFBnZjnx6zT1tJKWz62e2g6MdgXLoiqSHgANwkzGM45XKxY9PQcC7pDaK3SuRL1DH8kqJq';

export const dummyEncryptKey = nacl.box.keyPair();

const makeMessageService = (did: DID, config: Config): ServiceEndpoint => {
  const hubBaseUrl = config.hubBaseUrl || DEFAULT_HUB;

  return {
    type: 'MessagingService',
    id: did + '#messages',
    serviceEndpoint: `${hubBaseUrl}/${did}/message`,
  };
};

const makeKeyEntry = (
  did: DID,
  key: PublicKey,
  fragment: string,
  usage: string,
  type: string
) => ({
  publicKeyBase58: keyToBase58Compressed(key),
  id: `${did}#${fragment}`,
  usage,
  type,
  controller: did,
});

const makeEncryptEntry = (
  did: DID,
  key: Uint8Array,
  fragment: string,
  usage: string,
  type: string
) => ({
  publicKeyBase58: keyBufferToBase58Compressed(Buffer.from(key)),
  id: `${did}#${fragment}`,
  usage,
  type,
  controller: did,
});

const makeDocument = (
  did: DID,
  signKey: PublicKey,
  encryptKey: Uint8Array,
  config: Config = {}
) => {
  const keyEntry = makeKeyEntry(
    did,
    signKey,
    'key',
    'signing',
    'Secp256k1VerificationKey2018'
  );
  const authEntry = makeKeyEntry(
    did,
    signKey,
    'authentication',
    'signing',
    'Secp256k1VerificationKey2018'
  );
  const keyAgreementEntry = makeEncryptEntry(
    did,
    encryptKey,
    'keyAgreement',
    'encryption',
    'X25519KeyAgreementKey2019'
  );

  const services = [makeMessageService(did, config)];

  return {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: [keyEntry],
    authentication: [authEntry],
    keyAgreement: [keyAgreementEntry],
    service: services,
  };
};

export const makeDocumentForKeys = (
  key: AsymmetricKey,
  encryptKey: nacl.BoxKeyPair,
  config?: Config
): DIDDocument => {
  const did = deriveFromKey(key);
  return makeDocument(did, key, encryptKey.publicKey, config);
};

export const makeDummyDocument = (did: DID): DIDDocument =>
  makeDocument(did, normalizePublicKey(dummyXpub), dummyEncryptKey.publicKey);
