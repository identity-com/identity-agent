import { registerForKeys } from '@/service/did/resolver/StubCache';
import {generateEncryptKey, generateSignKey} from '@/lib/crypto/utils';
import { defaultDIDResolver } from './service/did/resolver/Resolver';
import {
  ConfirmPresentationEvent,
  PresentationRequest,
  PresentationTask,
} from '@/service/task/subject/Presentation';
import {Identity} from "@/api/internal";

const createDID = ():Identity => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const did = registerForKeys(signingKey, encryptionKey);

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

export {
  createDID,
  resolveDID,
  resolvePresentationRequestTaskWithDummyCredentials,
};
