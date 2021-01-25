// AWS S3 Client returns Readable on node, and ReadableStream in the browser
import { Readable } from 'stream';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

export type SupportedStream = Readable | ReadableStream;

// check if the input is a Web API readablestream.
const isReadableStream = (stream: any): stream is ReadableStream =>
  'getReader' in stream; // don't use hasOwnProperty, as the getReader function is on the prototype

export const streamToString = async (
  stream: SupportedStream
): Promise<string> => {
  // support browser implementations. Convert the Web ReadableStream API to the Node Stream API
  const nodeStream = isReadableStream(stream)
    ? new ReadableWebToNodeStream(stream)
    : stream;
  return new Promise<string>((resolve) => {
    const chunks: any[] = [];

    nodeStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    nodeStream.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf-8'))
    );
  });
};
