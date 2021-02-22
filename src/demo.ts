import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import { Agent, Identity } from '@/api/internal';
import { JWTVerified } from 'did-jwt';
import { DID } from '@/api/DID';
import { differenceWith, eqProps, prop } from 'ramda';
import Debug from 'debug';

const debug = Debug('ia:demo');

const createIdentity = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const agent = await Agent.register()
    .withKeys(signingKey, encryptionKey)
    .build();

  return { signingKey, encryptionKey, did: agent.did };
};

const messageCache: Record<string, JWTVerified[]> = {};

const newMessages = async (agent: Agent): Promise<JWTVerified[]> => {
  let currentMessages = messageCache[agent.did];
  if (!currentMessages) {
    currentMessages = [];
    messageCache[agent.did] = currentMessages;
  }
  const allMessages = await getMessages(agent);

  const newMessages = differenceWith(
    eqProps('jwt'),
    allMessages,
    currentMessages
  );
  currentMessages.push(...newMessages);

  return newMessages;
};

const processNewMessages = async (agent: Agent) => {
  const messages = await newMessages(agent);

  messages.forEach((m) => {
    if (m.payload.presentation) {
      debug(`${m.issuer} responded with presentation:`);
      debug(JSON.stringify(m.payload.presentation, null, 1));
    } else if (m.payload.presentationRequest) {
      agent
        .asSubject()
        .resolvePresentationRequest(m.payload.request, m.issuer as DID);
    } else {
      debug('Received message:');
      debug('%o', m.payload);
    }
  });
};

const getMessages = (agent: Agent): Promise<JWTVerified[]> => {
  return agent.transport.getMessages().then(prop('messages'));
};

export { createIdentity, processNewMessages };
