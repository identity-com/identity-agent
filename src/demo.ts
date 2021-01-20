import { registerForKey } from '@/service/did/resolver/StubCache';
import { generateKey } from '@/lib/crypto/utils';
import { defaultDIDResolver } from './service/did/resolver/Resolver';
import {
  ConfirmPresentationEvent,
  PresentationRequest,
  PresentationRequestTask,
} from '@/service/task/subject/PresentationRequest';

const createDID = () => {
  const key = generateKey();
  const did = registerForKey(key);

  return { key, did };
};

const resolveDID = defaultDIDResolver();

const resolvePresentationRequestTaskWithDummyCredentials = (
  task: PresentationRequestTask
) =>
  task.emit(
    new ConfirmPresentationEvent(task.getRequest() as PresentationRequest, {
      dummy: 'credentials',
    })
  );

export {
  createDID,
  resolveDID,
  resolvePresentationRequestTaskWithDummyCredentials,
};
