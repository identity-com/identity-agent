import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import { Agent, Identity } from '@/api/internal';

const createDID = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const agent = await Agent.register()
    .withKeys(signingKey, encryptionKey)
    .build();

  return { signingKey, encryptionKey, did: agent.did };
};

export { createDID };
