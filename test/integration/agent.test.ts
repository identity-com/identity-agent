import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import * as nacl from 'tweetnacl';
import { dummyEncryptKey } from '../../src/service/did/resolver/StubCache';

const { objectContaining } = expect;

const dummyXprv =
  'xprv9vBSiyPPnUq3h9m1kMG4n2iY8CQDeWHTWV3bxWqaEECp5JfJULz4yBmYniAW3iJE9381onwJxx7xufcRordF3Y1PZ2dNhCBmye6Sw6NNaGf';

const senderDID = did;
const receiverDID = 'did:dummy:receiver';

describe('Simple Agent flows', () => {
  describe('Privileged agent', () => {
    it('should communicate signed information via JWT', async () => {
      const sender = await Agent.for(senderDID)
        .withKeys(dummyXprv, nacl.box.keyPair())
        .build();

      const message = { hello: 'world' };
      const jwt = await sender.sign(message);

      const receiver = await Agent.for(receiverDID).build();
      const received = await receiver.verify(jwt);

      expect(received.payload).toEqual(objectContaining(message));
      expect(received.issuer).toEqual(senderDID);
    });

    it('should encrypt information for a recipient', async () => {
      const sender = await Agent.for(senderDID).build();
      const receiver = await Agent.for(receiverDID)
        .withKeys(dummyXprv, dummyEncryptKey)
        .build();

      const message = 'hello world';

      const encryptedMessage = await sender.encrypt(message, receiver.did);
      const decryptedMessage = await receiver.decrypt(encryptedMessage);

      expect(decryptedMessage).toEqual(message);
    });
  });

  describe('Tasks', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.for(did).build();
    });

    it('can run a simple task', async () => {
      jest.setTimeout(5000);
      const task = agent.startSlowTask(2000);

      const result = await task.result();

      expect(result).toEqual('ding!');
    });

    it('can resume a task', async () => {
      jest.setTimeout(5000);
      agent.startSlowTask(2000);

      const newAgent = await Agent.for(did).build();
      const results = await newAgent.allResults();

      expect(results[0]).toEqual('ding!');
    });
  });
});
