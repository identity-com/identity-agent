import { bip32, ECPair } from 'bitcoinjs-lib';
import { encode, decode } from 'bs58';
import didJWT, { JWE } from 'did-jwt';
import { DID, DIDResolver } from '@/api/DID';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
  PublicKey,
  PublicKeyInput,
  Xprv,
  Xpub,
} from '@/service/crypto/CryptoModule';
import { Resolver } from 'did-resolver';
import nacl from 'tweetnacl';

/**
 * Test this via the command line using
 *
 * echo <XPUB> | base58 -dc | xxd -p -c 100
 *
 * The final 32 bytes (64 hex characters) will be the compressed pubkey in hex
 *
 * More details: https://bitcoin.stackexchange.com/questions/80724/converting-xpub-key-to-core-format
 */
export const xpubToBase58Compressed = (xpub: string): string =>
  encode(xpubToCompressedBytes(xpub));

export const xpubToCompressedBytes = (xpub: string): Buffer =>
  ECPair.fromPublicKey(bip32.fromBase58(xpub).publicKey, { compressed: true })
    .publicKey;

export const xprvToBytes = (xprv: string): Buffer =>
  ECPair.fromPrivateKey(bip32.fromBase58(xprv).privateKey as Buffer)
    .privateKey as Buffer;

export const createJWT = (
  did: DID,
  key: Buffer, // TODO switch to using AsymmetricKey object
  payload: Record<string, any>
): Promise<string> => {
  const signer = didJWT.SimpleSigner(key.toString('hex'));
  return didJWT.createJWT(payload, {
    issuer: did,
    signer,
  });
};

export const keyBufferToBase58Compressed = (key: Buffer) => encode(key);

export const keyToBase58Compressed = (key: PublicKey) =>
  encode(ECPair.fromPublicKey(key.publicKey, { compressed: true }).publicKey);

export const verifyJWT = (jwt: string, resolver: DIDResolver) => {
  const jwtResolver = { resolve: (did: string) => resolver(did as DID) };
  return didJWT.verifyJWT(jwt, { resolver: jwtResolver, auth: true });
};

const isXprv = (keyInput: any): keyInput is Xprv =>
  typeof keyInput === 'string' && keyInput.startsWith('xprv');
const isXpub = (keyInput: any): keyInput is Xpub =>
  typeof keyInput === 'string' && keyInput.startsWith('xpub');
const isAsymmetricKey = (keyInput: any): keyInput is AsymmetricKey =>
  (keyInput as AsymmetricKey).privateKey !== undefined;
const isPublicKey = (keyInput: any): keyInput is PublicKey =>
  (keyInput as PublicKey).publicKey !== undefined;

export const normalizePrivateKey = (
  keyInput: AsymmetricKeyInput
): AsymmetricKey => {
  if (isXprv(keyInput)) {
    return ECPair.fromPrivateKey(
      bip32.fromBase58(keyInput as string).privateKey as Buffer
    ) as AsymmetricKey;
  }

  if (typeof keyInput === 'string') {
    // assume this is a ec private key in base58
    return ECPair.fromPrivateKey(decode(keyInput as string)) as AsymmetricKey;
  }

  if (isAsymmetricKey(keyInput)) {
    return keyInput;
  }

  throw new Error('Unrecognised key input');
};
export const normalizePublicKey = (keyInput: PublicKeyInput): PublicKey => {
  if (isXpub(keyInput)) {
    return ECPair.fromPublicKey(
      bip32.fromBase58(keyInput as string).publicKey as Buffer
    ) as PublicKey;
  }

  if (typeof keyInput === 'string') {
    // assume this is a ec public key in base58
    return ECPair.fromPublicKey(decode(keyInput as string)) as PublicKey;
  }

  if (isPublicKey(keyInput)) {
    return keyInput;
  }

  throw new Error('Unrecognised key input');
};

export const generateSignKey = (): AsymmetricKey =>
  ECPair.makeRandom() as AsymmetricKey;

// TODO Unify Key concept with AsymmetricKey
export const generateEncryptKey = (): nacl.BoxKeyPair => nacl.box.keyPair();

export const decrypt = async (jwe: JWE, key: nacl.BoxKeyPair) => {
  const decrypted = await didJWT.decryptJWE(
    jwe,
    didJWT.x25519Decrypter(key.secretKey)
  );
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(decrypted);
};

export const encrypt = async (
  payload: string,
  recipient: DID,
  resolver: DIDResolver
) => {
  // Remove this 'as resolver' when didJWT supports Resolvable rather than Resolver
  const didJwtResolver = {
    resolve: (did: string) => resolver(did as DID),
  } as Resolver;

  const encoder = new TextEncoder(); // always utf-8
  const encoded = encoder.encode(payload);

  const encrypters = await didJWT.resolveX25519Encrypters(
    [recipient],
    didJwtResolver
  );
  return didJWT.createJWE(encoded, encrypters);
};
