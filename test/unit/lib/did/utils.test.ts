import * as cryptoUtils from '@/lib/crypto/utils';
import * as utils from '@/lib/did/utils';
import { ECPair } from 'bitcoinjs-lib';
import { xprv } from '../../../fixtures/keys';
import { DID_METHOD } from '@/lib/did/utils';
import { DID } from '@/api/DID';

describe('did utils', () => {
  const keyPair = ECPair.fromPrivateKey(cryptoUtils.xprvToBytes(xprv));
  const publicKey = ECPair.fromPublicKey(keyPair.publicKey);
  const expectedDID = 'did:solid:FT4ohfRGNWsok2kykdCugxtQePju2xYQBqZ1aVNSqokN';

  describe('deriveFromKey', () => {
    it('should generate a DID from a key pair with a public key', () => {
      const did = utils.deriveFromKey(publicKey);
      expect(did).toEqual(expectedDID);
    });

    it('should generate a DID from a key pair with a private key', () => {
      const did = utils.deriveFromKey(keyPair);
      expect(did).toEqual(expectedDID);
    });
  });

  describe('validateFromKey', () => {
    it('should validate a DID against a key pair with a public key', () => {
      expect(utils.validateFromKey(expectedDID, publicKey)).toBeTruthy();
    });

    it('should return false if the DID was not derived from the key', () => {
      expect(
        utils.validateFromKey(
          `did:${DID_METHOD}:some-other-identifier` as DID,
          publicKey
        )
      ).toBeFalsy();
    });

    it('should validate a DID against a key pair with a private key', () => {
      expect(utils.validateFromKey(expectedDID, keyPair)).toBeTruthy();
    });

    it('should throw an error when attempting to validate a foreign DID', () => {
      const shouldFail = () =>
        utils.validateFromKey(
          'did:someOtherMethod:some-other-identifier' as DID,
          publicKey
        );
      expect(shouldFail).toThrow();
    });
  });
});
