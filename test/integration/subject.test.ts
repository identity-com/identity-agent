import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import {
  ConfirmPresentationEvent,
  ConfirmPresentationEventHandler,
  Presentation,
  PresentationRequest,
} from '../../src/service/task/subject/PresentationRequest';
import { EventType } from '../../src/service/task/EventType';

const { objectContaining } = expect;

const dummyXprv =
  'xprv9vBSiyPPnUq3h9m1kMG4n2iY8CQDeWHTWV3bxWqaEECp5JfJULz4yBmYniAW3iJE9381onwJxx7xufcRordF3Y1PZ2dNhCBmye6Sw6NNaGf';

const senderDID = did;
const receiverDID = 'did:dummy:receiver';

describe('Simple Agent flows', () => {
  describe('Privileged agent', () => {
    it('should communicate signed information via JWT', async () => {
      const sender = await Agent.for(senderDID).withKey(dummyXprv).build();

      const message = { hello: 'world' };
      const jwt = await sender.sign(message);

      const receiver = await Agent.for(receiverDID).build();
      const received = await receiver.verify(jwt);

      expect(received.payload).toEqual(objectContaining(message));
      expect(received.issuer).toEqual(senderDID);
    });
  });

  describe('Tasks', () => {
    let agent: Agent;

    beforeEach(async () => {
      agent = await Agent.for(did).build();
    });

    it('can resume a task', async () => {
      jest.setTimeout(5000);
      agent.startSlowTask(2000);

      const newAgent = await Agent.for(did).build();
      const results = await newAgent.allResults();

      expect(results[0]).toEqual('ding!');
    });

    describe('Presentation Requests', () => {
      const request = new PresentationRequest();
      const presentation = new Presentation();

      it('can resolve a presentation request with no confirmation handlers', async () => {
        const resolveTask = agent
          .asSubject()
          .resolvePresentationRequest(request);

        resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

        await resolveTask.result();
      });

      it('can resolve a presentation request with a confirmation handler', async () => {
        const confirmImmediatelyHandler = {
          handle: () => Promise.resolve(),
        };
        const resolveTask = agent
          .asSubject()
          .resolvePresentationRequest(request)
          .on(EventType.ConfirmPresentation, confirmImmediatelyHandler);

        resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

        await resolveTask.result();
      });

      it('can resolve a presentation request with a confirmation handler that requests input', async () => {
        let userClicksOK = () => {}; // dummy initial value
        const waitForOKHandler: ConfirmPresentationEventHandler = {
          handle: () =>
            new Promise((resolve) => {
              userClicksOK = () => resolve();
            }),
        };

        const resolveTask = agent
          .asSubject()
          .resolvePresentationRequest(request)
          .on(EventType.ConfirmPresentation, waitForOKHandler);

        resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

        userClicksOK();

        return expect(resolveTask.result()).resolves.toBeUndefined();
      });

      it('can reject a presentation request with a confirmation handler that requests input', async () => {
        const reason = new Error('User rejected the presentation');

        let userClicksCancel = () => {}; // dummy initial value
        const waitForCancelHandler: ConfirmPresentationEventHandler = {
          handle: () =>
            new Promise((_resolve, reject) => {
              userClicksCancel = () => reject(reason);
            }),
        };

        const resolveTask = agent
          .asSubject()
          .resolvePresentationRequest(request)
          .on(EventType.ConfirmPresentation, waitForCancelHandler);

        resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

        userClicksCancel();

        return expect(resolveTask.result()).rejects.toThrow(reason);
      });
    });
  });
});
