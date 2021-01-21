import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import {
  ConfirmPresentationEvent,
  ConfirmPresentationEventHandler, CredentialConstraints,
  Presentation, PresentationEventType,
  PresentationRequest,
} from '../../src/service/task/subject/Presentation';
import {Subject} from "../../src/api/Subject";

const receiverDID = 'did:dummy:receiver';

describe('Subject flows', () => {
  let subject: Subject;

  beforeEach(async () => {
    subject = (await Agent.for(did).build()).asSubject();
  });

  describe('Presentation Requests', () => {
    const request = {
      verifier: receiverDID,
      constraints: new CredentialConstraints()
    } as PresentationRequest;
    const presentation = new Presentation();

    it('can resolve a presentation request with no confirmation handlers', async () => {
      const resolveTask = subject
        .resolvePresentationRequest(request);

      resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

      await resolveTask.result();
    });

    it('can resolve a presentation request with a confirmation handler', async () => {
      const confirmImmediatelyHandler = {
        handle: () => Promise.resolve(),
      };
      const resolveTask = subject
        .resolvePresentationRequest(request)
        .on(PresentationEventType.ConfirmPresentation, confirmImmediatelyHandler);

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

      const resolveTask = subject
        .resolvePresentationRequest(request)
        .on(PresentationEventType.ConfirmPresentation, waitForOKHandler);

      resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

      userClicksOK();

      return expect(resolveTask.result()).resolves.toBeUndefined();
    });

    // TODO fix handler chaining
    it.skip('can reject a presentation request with a confirmation handler that requests input', async () => {
      const reason = new Error('User rejected the presentation');

      let userClicksCancel = () => {}; // dummy initial value
      const waitForCancelHandler: ConfirmPresentationEventHandler = {
        handle: () =>
          new Promise((_resolve, reject) => {
            userClicksCancel = () => reject(reason);
          }),
      };

      const resolveTask = subject
        .resolvePresentationRequest(request)
        .on(PresentationEventType.ConfirmPresentation, waitForCancelHandler);

      resolveTask.emit(new ConfirmPresentationEvent(request, presentation));

      userClicksCancel();

      return expect(resolveTask.result()).rejects.toThrow(reason);
    });
  });
});
