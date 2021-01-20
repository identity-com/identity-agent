import { ECPairInterface } from 'bitcoinjs-lib';
import { JWTVerified } from 'did-jwt';

export type Xprv = `xprv${string}`;
export type Xpub = `xprv${string}`;
export type Base58ECPrivateKey = string;
export type Base58ECPublicKey = string;

export type AsymmetricKey = ECPairInterface & { privateKey: Buffer };
export type AsymmetricKeyInput = Xprv | Base58ECPrivateKey | AsymmetricKey;

export type PublicKey = Omit<ECPairInterface, 'privateKey'>;
export type PublicKeyInput = Xpub | Base58ECPublicKey | PublicKey;

export type JWT = string;
export type Key = AsymmetricKey | PublicKey;

export interface CryptoModule {
  encrypt(data: String | Buffer): Promise<Buffer>; // symmetric or asymmetric

  decrypt(data: Buffer): string; // symmetric or asymmetric

  sign(data: string): Promise<Buffer>;
  verifySignature(signature: Buffer, data: string): Promise<boolean>;

  createAsymmetricKey(): AsymmetricKey;
  createSymmetricKey(): Key; // AKA OTP

  createToken(payload: Record<string, any>): Promise<JWT>;

  verifyToken(token: JWT): Promise<JWTVerified>;
}
