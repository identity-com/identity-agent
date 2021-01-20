import { AsymmetricKey, JWT } from '@/service/crypto/CryptoModule';
import { DID, DIDResolver } from '@/api/DID';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { createJWT } from '@/lib/crypto/utils';

export class PrivateKeyCrypto extends DefaultCryptoModule {
  private key: AsymmetricKey;

  constructor(did: DID, key: AsymmetricKey, resolver: DIDResolver) {
    super(did, resolver);
    this.key = key;
  }

  createToken(payload: Record<string, any>): Promise<JWT> {
    return createJWT(this.did, this.key.privateKey as Buffer, payload);
  }
}
