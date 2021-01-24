import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import {
  ConfirmPresentationEvent,
  PresentationRequest,
  PresentationTask,
} from '@/service/task/subject/Presentation';
import { Agent, Identity } from '@/api/internal';
import { CommonEventType } from '@/service/task/EventType';
import { TaskEvent } from '@/service/task/TaskEvent';

const createDID = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const agent = await Agent.register()
    .withKeys(signingKey, encryptionKey)
    .build();

  return { signingKey, encryptionKey, did: agent.did };
};

const resolvePresentationRequestTaskWithDummyCredentials = (
  task: PresentationTask
) =>
  task.emit(
    new ConfirmPresentationEvent(task.getRequest() as PresentationRequest, {
      dummy: 'credentials',
    })
  );

class NewEvent extends TaskEvent<CommonEventType.New> {
  constructor() {
    super(CommonEventType.New);
  }
}

export {
  createDID,
  resolvePresentationRequestTaskWithDummyCredentials,
  NewEvent,
};
