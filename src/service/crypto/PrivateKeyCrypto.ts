import { AsymmetricKey, JWT } from '@/service/crypto/CryptoModule';
import { DID, DIDResolver } from '@/api/DID';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import {createJWT, decrypt} from '@/lib/crypto/utils';
import nacl from "tweetnacl";
import {JWE} from "did-jwt";

export class PrivateKeyCrypto extends DefaultCryptoModule {
  private signingKey: AsymmetricKey;
  private encryptionKey: nacl.BoxKeyPair;

  constructor(did: DID, signingKey: AsymmetricKey, encryptionKey: nacl.BoxKeyPair, resolver: DIDResolver) {
    super(did, resolver);
    this.signingKey = signingKey;
    this.encryptionKey = encryptionKey
  }

  createToken(payload: Record<string, any>): Promise<JWT> {
    return createJWT(this.did, this.signingKey.privateKey as Buffer, payload);
  }

  decrypt(jwe: JWE): Promise<string> {
    return decrypt(jwe, this.encryptionKey)
  }
}
