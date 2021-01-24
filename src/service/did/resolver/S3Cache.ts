import { DID } from '@/api/DID';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { DIDDocument } from 'did-resolver';
import { Readable } from 'stream';
import { complement, isNil, pickBy } from 'ramda';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

const AWS_REGION = 'us-east-1';
const BUCKET = 'did-cache';

const filterOutMissingProps = pickBy(complement(isNil));

// AWS S3 Client returns Readable on node, and ReadableStream in the browser
type SupportedStream = Readable | ReadableStream;

// check if the input is a Web API readablestream.
const isReadableStream = (stream: any): stream is ReadableStream =>
  'getReader' in stream; // don't use hasOwnProperty, as the getReader function is on the prototype

const streamToString = async (stream: SupportedStream): Promise<string> => {
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

type S3Config = {
  // include this only while we keep an S3Cache DID resolver
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
};

type AWSCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
};
export class S3Cache {
  private config: S3Config;
  private credentials: AWSCredentials | undefined;

  constructor(config: S3Config = {}) {
    this.config = config;

    // WARNING - for demo purposes only - do not pass AWS keys if using this on a browser in production
    this.credentials =
      this.config.awsAccessKeyId && this.config.awsSecretAccessKey
        ? {
            accessKeyId: this.config.awsAccessKeyId,
            secretAccessKey: this.config.awsSecretAccessKey,
          }
        : undefined;
  }

  private makeClient() {
    return new S3Client(
      filterOutMissingProps({
        region: AWS_REGION,
        credentials: this.credentials,
      })
    );
  }

  hasPermissions = (): Promise<boolean> => {
    const client = this.makeClient();
    const command = new HeadBucketCommand({ Bucket: BUCKET });
    return client
      .send(command)
      .then(() => true)
      .catch((error) => {
        console.log('S3 Cache disabled - error ' + error);
        return false;
      });
  };

  get = async (did: DID): Promise<DIDDocument> => {
    const client = this.makeClient();
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: did,
    });

    const response = await client.send(command);
    try {
      const stringifiedDocument = await streamToString(
        response.Body as SupportedStream
      );
      return JSON.parse(stringifiedDocument);
    } catch (error) {
      console.error(error);
      throw new Error('Unknown object stream type.');
    }
  };

  put = async (document: DIDDocument): Promise<DID> => {
    const client = this.makeClient();
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: document.id,
      Body: JSON.stringify(document, null, 1),
    });

    return client.send(command).then(() => document.id as DID);
  };
}
