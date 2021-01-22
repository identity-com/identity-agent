import * as utils from '@/lib/crypto/utils';
import { defaultDIDResolver } from '@/service/did/resolver/Resolver';
import { example as did } from '../../../fixtures/did';
import { xpub, xprv } from '../../../fixtures/keys';
import { dummyEncryptKey } from '../../../../src/service/did/generator/generate';

describe('crypto utils', () => {
  describe('xpubToBase58Compressed', () => {
    it('should convert an xpub to a compressed ECDSA public key in base58', () => {
      expect(utils.xpubToBase58Compressed(xpub)).toEqual(
        '28NZZAdRunR4iG4euSsnQatzJxDMXjv9v71ET6HoFPVcu'
      );
    });
  });

  describe('xpubToCompressedBytes', () => {
    it('should convert an xpub to a compressed ECDSA public key buffer', () => {
      expect(utils.xpubToCompressedBytes(xpub).toString('hex')).toEqual(
        '03cb4da8237ca56256dff7eead5fcc2bf4d4cbccfa2caffbad2793a4e62804d5a2'
      );
    });
  });

  describe('createJWT', () => {
    it('should create and sign a JWT with an xprv', async () => {
      const key = utils.xprvToBytes(xprv);
      const jwt = await utils.createJWT(did, key, {});
      const verifiedJWT = await utils.verifyJWT(jwt, defaultDIDResolver());

      expect(verifiedJWT.doc.id).toEqual(did);
    });
  });

  describe('encrypt', () => {
    it('should encrypt data as JWE', async () => {
      const message = 'hello';
      const jwe = await utils.encrypt(message, did, defaultDIDResolver());

      const decrypted = await utils.decrypt(jwe, dummyEncryptKey);

      expect(decrypted).toEqual(message);
    });
  });
});
