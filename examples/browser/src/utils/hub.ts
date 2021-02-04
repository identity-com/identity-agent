// ES6 import or TypeScript
import io from "socket.io-client";
import { Agent } from "identity-agent";
import { Message } from '../App';

type Service = {
  type: string,
  serviceEndpoint: string
}
const isMessagingService = (service: Service) => service.type === 'MessagingService';
const getHub = (agent: Agent) => agent.document?.service?.find(isMessagingService)?.serviceEndpoint;

const randomId = () => btoa(`${Math.random()}`).substr(10, 5);

export const connect = (agent: Agent, callback: (error: any, message?: Message) => void) => {
  const hub = getHub(agent);

  if (!hub) {
    console.warn(
      `No messaging service found on DID Document for ${agent.did}. Websocket connection not established`
    )
    return;
  }

  // Remove everything after the hostname and possible port
  // TODO generalise this by exposing channels via url paths in the remote hub?
  const hubSocketPath = hub.replace(/(?<=\/\/[^/]+)\/.*/, '')

  const socket = io(hubSocketPath, {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on('connect', async () => {
    console.log('connected');

    const token = await agent.sign({})

    socket.emit('create', 'authentication', {
      strategy: 'jwt',
      accessToken: token
    }, (error: any) => {
      if (error) console.error(error)
    })
  });

  socket.on('did/:did/message created', async (encryptedMessage: any) => {
    console.log('received', encryptedMessage);

    try {
      const decryptedMessage = await agent.decrypt(encryptedMessage);
      const verifiedMessage = await agent.verify(decryptedMessage);

      const message = {
        sender: verifiedMessage.issuer,
        content: verifiedMessage.payload.message,
        receivedAt: new Date(),
        id: randomId()
      }

      callback(null, message);
    } catch (error) {
      callback(error);
    }
  });
}
