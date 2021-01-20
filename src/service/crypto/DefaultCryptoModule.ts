import {
  AsymmetricKey,
  CryptoModule,
  JWT,
  Key,
} from '@/service/crypto/CryptoModule';
import { JWTVerified } from 'did-jwt';
import { DID, DIDResolver } from '@/api/DID';
import { verifyJWT } from '@/lib/crypto/utils';

export class DefaultCryptoModule implements CryptoModule {
  readonly did: DID;
  private resolver: DIDResolver;

  constructor(did: DID, resolver: DIDResolver) {
    this.did = did;
    this.resolver = resolver;
  }

  createAsymmetricKey(): AsymmetricKey {
    throw Error('unimplemented');
  }

  createSymmetricKey(): Key {
    throw Error('unimplemented');
  }

  createToken(_payload: Record<string, any>): Promise<JWT> {
    throw Error('A private key must be provided to perform this operation');
  }

  decrypt(_data: Buffer): string {
    throw Error('A private key must be provided to perform this operation');
  }

  encrypt(_data: string | Buffer): Promise<Buffer> {
    throw Error('A private key must be provided to perform this operation');
  }

  sign(_data: string): Promise<Buffer> {
    throw Error('A private key must be provided to perform this operation');
  }

  verifySignature(_signature: Buffer, _data: string): Promise<boolean> {
    throw Error('unimplemented');
  }

  verifyToken(token: JWT): Promise<JWTVerified> {
    return verifyJWT(token, this.resolver);
  }
}
