import { DID } from '@/api/DID';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { DIDDocument } from 'did-resolver';
import { filterOutMissingProps } from '@/lib/util';
import { streamToString, SupportedStream } from '@/lib/transport/streams';

const AWS_REGION = 'us-east-1';
const BUCKET = 'did-cache';
const PREFIX = 'dids';

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
  private readonly credentials: AWSCredentials | undefined;

  constructor(config: S3Config = {}) {
    this.config = config;

    this.credentials = this.makeCredentialObject();
  }

  private makeCredentialObject() {
    // WARNING - for demo purposes only - do not pass AWS keys if using this on a browser in production
    if (this.config.awsAccessKeyId && this.config.awsSecretAccessKey) {
      return {
        accessKeyId: this.config.awsAccessKeyId,
        secretAccessKey: this.config.awsSecretAccessKey,
      };
    }

    return undefined;
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
      Key: `${PREFIX}/${did}`,
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
      Key: `${PREFIX}/${document.id}`,
      Body: JSON.stringify(document, null, 1),
    });

    return client.send(command).then(() => document.id as DID);
  };
}
