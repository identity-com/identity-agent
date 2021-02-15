import { Agent } from '../../src';
import { STORAGE_FOLDER } from '../../src/service/did/resolver/Resolver';
import fetch from 'jest-fetch-mock';

let sender: Agent;
let recipient: Agent;

const message = {
  message: {
    with: [1, 2, 3],
    differentProperties: true,
  },
};

describe('transport', () => {
  beforeEach(async () => {
    sender = await Agent.register().build();
    recipient = await Agent.register().build();
  });

  describe('with a recipient DID document with no service endpoints', () => {
    it('should throw an error', async () => {
      // remove the services from the recipient DID
      recipient.document.service = [];
      await sender.storage.put(
        [STORAGE_FOLDER, recipient.did],
        recipient.document
      );

      const shouldFail = sender.send(message, recipient.did);

      return expect(shouldFail).rejects.toThrow(/no suitable service endpoint/);
    });
  });

  describe('with a valid recipient DID document', () => {
    it('should send a signed, encrypted message', async () => {
      const result = await sender.send(message, recipient.did);

      const receivedMessage = JSON.parse(
        fetch.mock.calls[0][1]!.body as string
      );

      const decryptedMessage = await recipient.decrypt(receivedMessage);
      const verifiedMessage = await recipient.verify(decryptedMessage);

      expect(result.status).toEqual('ok');
      expect(verifiedMessage.issuer).toEqual(sender.did);
    });
  });
});
