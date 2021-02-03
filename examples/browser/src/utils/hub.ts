// ES6 import or TypeScript
import io from "socket.io-client";
import { Agent } from "identity-agent";

export const connect = (agent: Agent, callback: (error: any, message?: any) => void) => {
  const socket = io('http://localhost:3030', {
    transports: ['websocket'],
    forceNew: true,
  });

// socketio 3 (not supported by feathers)
// socket.onAny((event: any, args: any) => {
//   console.log(event, args);
// })

  socket.on('connect', async () => {
    console.log('connected');

    const token = await agent.sign({})

    socket.emit('create', 'authentication', {
      strategy: 'jwt',
      accessToken: token
    }, (error: any, result: any) => {
      if (error) console.error(error)
    })
  });

  socket.on('did/:did/message created', async (data: any) => {
    console.log('created', data);

    const encryptedMessage = data.message;

    try {
      const decryptedMessage = await agent.decrypt(encryptedMessage);
      const verifiedMessage = await agent.verify(decryptedMessage);

      callback(null, verifiedMessage);
    } catch (error) {
      callback(error);
    }
  });
}
