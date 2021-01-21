import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import { CredentialConstraints } from '../../src/service/task/subject/Presentation';
import {Verifier} from "../../src/api/Verifier";
import {CommonEventType} from "../../src/service/task/EventType";
import {TaskEvent} from "../../src/service/task/TaskEvent";

const subjectDID = 'did:dummy:receiver';

class NewPresentationEvent extends TaskEvent<CommonEventType.New>{
  constructor() {
    super(CommonEventType.New);
  }
}

describe('Subject flows', () => {
  let verifier: Verifier;

  beforeEach(async () => {
    verifier = (await Agent.for(did).build()).asVerifier();
  });

  describe('Presentation Requests', () => {
    it('can request a presentation', async () => {
      const resolveTask = verifier
        .requestPresentation(subjectDID, new CredentialConstraints());

      resolveTask.emit(new NewPresentationEvent());

      await resolveTask.result();
    });
  });
});
