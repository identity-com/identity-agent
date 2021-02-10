import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import { CredentialConstraints } from '../../src/service/task/subject/Presentation';
import { Verifier } from '../../src/api/Verifier';
import { DefaultTask } from '../../src/service/task/DefaultTask';
import { DoneEvent } from '../../src/service/task/DoneEvent';
import { PresentationRequestEventType } from '../../src/service/task/verifier/PresentationRequest';
import { Task } from '../../src/service/task/Task';

const subjectDID = 'did:dummy:receiver';

// a simple task class with dummy implementations for unnecessary functions,
// used to simplify test cases
class SimpleTask<R> extends DefaultTask<R> {
  deserialize(_serialized: Record<string, any>): void {}

  protected initialize(): void {}

  serialize(): Record<string, any> {
    return {};
  }
}

const makeSimpleTask = <R>(
  type: string,
  callback: (thisTask: Task<R>) => {}
): Task<R> => {
  // A dummy task to download evidence for a credential, once the presentation is received
  // the download is configured to take 500ms
  return new (class extends SimpleTask<R> {
    constructor() {
      super(type);
      callback(this);
    }
  })();
};

describe('PresentationRequestFlow flows', () => {
  let verifier: Verifier;

  beforeEach(async () => {
    verifier = (await Agent.for(did).build()).asVerifier();
  });

  describe('Presentation Requests', () => {
    it('can request a presentation', async () => {
      const presentationTask = verifier.requestPresentation(
        subjectDID,
        new CredentialConstraints()
      );

      const presentation = {};

      // resolves the task. No need to await the result,
      // that will happen in the next step
      presentationTask.receivePresentation(presentation);

      await presentationTask.result();
    });

    it('can inject task-based event handlers on presentation receipt', async () => {
      const expectedEvidence = 'dummy evidence data for presentation';

      // create a handler that triggers the download task
      let downloadEvidenceTask: Task<string>;
      const downloadEvidenceOnReceiptHandler = {
        handle: () => {
          // A dummy task to download evidence for a credential, once the presentation is received
          // the download is configured to take 500ms
          downloadEvidenceTask = makeSimpleTask(
            'DummyDownloadEvidenceTask',
            // pretend to download the evidence from somewhere
            (thisTask) =>
              setTimeout(
                () => thisTask.emit(new DoneEvent(expectedEvidence)),
                500
              )
          );
          return downloadEvidenceTask;
        },
      };

      // request a new presentation, and connect the
      // download evidence task to the PresentationReceived event
      const presentationTask = verifier
        .requestPresentation(subjectDID, new CredentialConstraints())
        .on(
          PresentationRequestEventType.PresentationReceived,
          downloadEvidenceOnReceiptHandler
        );

      // trigger the receipt of the presentation and wait for the task to complete
      presentationTask.receivePresentation({});
      await presentationTask.result();

      // check that the presentation task triggered
      // and resolved the download evidence task
      return expect(downloadEvidenceTask!.result()).resolves.toEqual(
        expectedEvidence
      );
    });
  });
});
