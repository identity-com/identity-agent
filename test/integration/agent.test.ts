import { example as did } from '../fixtures/did';
import { xprv as dummyXprv } from '../fixtures/keys';
import { Agent } from '@/api/Agent';
import * as nacl from 'tweetnacl';
import { dummyEncryptKey } from '../../src/service/did/generator/generate';
import { propEq } from 'ramda';
import { EventType } from '../../src/service/task/cqrs/TaskEvent';

const { objectContaining } = expect;

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

      await task.waitForDone();
    });

    it('can run a simple task - global wait', async () => {
      jest.setTimeout(5000);
      agent.startSlowTask(2000);

      await agent.context.taskMaster.waitForEvent(EventType.Done);
    });

    it('can run a simple task - wait by ID', async () => {
      jest.setTimeout(5000);
      const taskContext = await agent.startSlowTask(2000);

      await agent.context.taskMaster.waitForEvent(
        EventType.Done,
        taskContext.id
      );
    });

    it('can resume a task', async () => {
      jest.setTimeout(5000);
      const task = agent.startSlowTask(2000);

      await task.waitForEvent(EventType.Started);

      const newAgent = await Agent.for(did).build();

      const newTask = newAgent.tasks.find(propEq('id', task.id));

      expect(newTask).toBeDefined();
      await newTask!.waitForDone();
    });
  });
});
