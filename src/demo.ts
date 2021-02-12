import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import { Agent, Identity } from '@/api/internal';
import { StubPresenter } from '@/service/credential/Presenter';
import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';

const createDID = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const agent = await Agent.register()
    .withKeys(signingKey, encryptionKey)
    .build();

  return { signingKey, encryptionKey, did: agent.did };
};

const addPresentation = (agent: Agent, presentation: Presentation) => {
  agent.context.credential.presenter = new StubPresenter(presentation);
};

export { createDID, addPresentation };
