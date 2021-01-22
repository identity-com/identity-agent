import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import {
  defaultDIDResolver,
  registerForKeys,
} from './service/did/resolver/Resolver';
import {
  ConfirmPresentationEvent,
  PresentationRequest,
  PresentationTask,
} from '@/service/task/subject/Presentation';
import { Identity } from '@/api/internal';
import { CommonEventType } from '@/service/task/EventType';
import { TaskEvent } from '@/service/task/TaskEvent';

const createDID = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const did = await registerForKeys(signingKey, encryptionKey);

  return { signingKey, encryptionKey, did };
};

const resolveDID = defaultDIDResolver();

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
  resolveDID,
  resolvePresentationRequestTaskWithDummyCredentials,
  NewEvent,
};
