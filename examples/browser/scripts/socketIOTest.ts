// ES6 import or TypeScript
import io from "socket.io-client";

console.log("Connecting...");
const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  forceNew: true,
  // query: { did: 'did:civic:Cf8XQsKpi8SrC8YzHqGxNwcaFvKc9eeqn6bNGJM1hmhv' }
});

// socketio 3 (not supported by feathers)
// socket.onAny((event: any, args: any) => {
//   console.log(event, args);
// })

socket.on('connect', () => {
  console.log('connected');
  socket.emit('create', 'authentication', {
    strategy: 'jwt',
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE2MTIyNjIzOTAsImlzcyI6ImRpZDpjaXZpYzozRGRSNmphMmpBWHRTaVl4NVl0ZnFqeU5Qd0tjYmhZRjk2RWt6b2VGNkVwRSJ9.5swHs-2pxZuIVy1j5b4Jx3eBQ3KIfCe5ydgTKjnFdTnDkNCX_iSmIxSKr7twF4aSMs2K1IVp2fZDP6kCbuvSFw'
  }, (error: any, result: any) => {
    if (error) console.error(error)
    if (result) console.log(result)
  })
});


socket.on('data', (data: any) => {
  console.log(data);
});

socket.on('message', (data: any) => {
  console.log(data);
})

socket.on('did/:did/message removed', (data: any) => {
  console.log('removed', data);
});

socket.on('did/:did/message created', (data: any) => {
  console.log('created', data);
});
