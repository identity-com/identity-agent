import { example as did } from '../fixtures/did';
import { xprv as dummyXprv } from '../fixtures/keys';
import { Agent } from '@/api/Agent';
import { Verifier } from '@//api/Verifier';
import * as nacl from 'tweetnacl';
import { TaskEvent } from '@/service/task/cqrs/TaskEvent';
import { repeat, times } from 'ramda';
import {
  ProcessPresentationResponseCommand,
  EventType,
  CommandType,
  PresentationRequestState,
} from '../../src/service/task/cqrs/verifier/PresentationRequestFlow';
import { Sparse } from '../../src/service/task/cqrs/Command';
import { Presentation } from '../../src';

const subjectDID = 'did:dummy:receiver';

describe('PresentationRequestFlow flows', () => {
  let verifier: Verifier;

  beforeEach(async () => {
    const agent = await Agent.for(did)
      .withKeys(dummyXprv, nacl.box.keyPair())
      .build();
    verifier = agent.asVerifier();
  });

  describe('Presentation Requests', () => {
    const presentationRequest = { question: 'What is your name?' };
    const presentation = { answer: 'It is Arthur, King of the Britons' };

    it('can request a presentation', async () => {
      const presentationTask = verifier.requestPresentation(
        subjectDID,
        presentationRequest
      );

      await presentationTask.waitForEvent(EventType.Requested);

      // resolves the task. No need to await the result,
      // that will happen in the next step
      const command: Sparse<ProcessPresentationResponseCommand> = {
        response: presentation,
      };

      presentationTask.dispatch(CommandType.ProcessResponse, command);

      await presentationTask.waitForDone();

      expect(presentationTask.state.response).toEqual(presentation);
    });

    it('can inject functional event handlers on presentation receipt', async () => {
      // send five presentation requests and store the results in a dummy store
      const expectedTaskCount = 5;
      const receivedPresentationRepository: Presentation[] = [];

      // register the handler to add the presentations to the repository
      const handler = (
        event: TaskEvent<
          EventType.PresentationReceived,
          PresentationRequestState
        >
      ) => {
        receivedPresentationRepository.push(event.payload.response!);
      };
      verifier.taskMaster.registerEventHandler(
        EventType.PresentationReceived,
        handler
      );

      // create and resolve 5 presentationRequest 5 tasks
      const tasks = times(
        () => verifier.requestPresentation(subjectDID, presentationRequest),
        expectedTaskCount
      );
      await Promise.all(
        tasks.map(async (t) => {
          await t.waitForEvent(EventType.Requested);
          await t.dispatch(CommandType.ProcessResponse, {
            response: presentation,
          });
          return t.waitForDone();
        })
      );

      // expect five presentations
      expect(receivedPresentationRepository).toEqual(
        expect.arrayContaining(repeat(presentation, expectedTaskCount))
      );
    });
  });
});
