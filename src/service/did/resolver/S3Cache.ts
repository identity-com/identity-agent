import { DID } from '@/api/DID';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { DIDDocument } from 'did-resolver';
import getStream from 'get-stream';
import { Readable } from 'stream';

const AWS_REGION = 'us-east-1';
const BUCKET = 'did-cache';

export const hasPermissions = (): Promise<boolean> => {
  const client = new S3Client({ region: AWS_REGION });
  const command = new HeadBucketCommand({ Bucket: BUCKET });
  return client
    .send(command)
    .then(() => true)
    .catch(() => false);
};

export const get = async (did: DID): Promise<DIDDocument> => {
  const client = new S3Client({ region: AWS_REGION });
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: did,
  });

  const response = await client.send(command);

  if (response.Body instanceof Readable) {
    const stringifiedDocument = await getStream(response.Body);
    return JSON.parse(stringifiedDocument);
  } else {
    throw new Error('Unknown object stream type.');
  }
};

export const put = async (document: DIDDocument): Promise<DID> => {
  const client = new S3Client({ region: AWS_REGION });
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: document.id,
    Body: JSON.stringify(document, null, 1),
  });

  return client.send(command).then(() => document.id as DID);
};
