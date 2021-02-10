import { generateEncryptKey, generateSignKey } from '@/lib/crypto/utils';
import { Agent, Config, Identity } from '@/api/internal';
import { DID } from '@/api/DID';
import { v4 as uuid } from 'uuid';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { filterOutMissingProps } from '@/lib/util';
import { streamToString, SupportedStream } from '@/lib/transport/streams';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { Task } from '@/service/task/cqrs/Task';

const createDID = async (): Promise<Identity> => {
  const signingKey = generateSignKey();
  const encryptionKey = generateEncryptKey();
  const agent = await Agent.register()
    .withKeys(signingKey, encryptionKey)
    .build();

  return { signingKey, encryptionKey, did: agent.did };
};

const resolvePresentationRequestTaskWithDummyCredentials = (
  agent: Agent,
  task: Task<PresentationFlow.PresentationState>
) => {
  const command: PresentationFlow.ResolveCommand = {
    response: {},
    taskId: task.id,
  };
  agent.context.taskMaster.dispatch(
    PresentationFlow.CommandType.Resolve,
    command
  );
};

// Temporary demo mechanism for sending messages
// will likely be replaced by Identity Hubs
const sendMessage = async (did: DID, message: any, config?: Config) => {
  const client = new S3Client(
    filterOutMissingProps({
      region: 'us-east-1',
      credentials: config && {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })
  );

  const messageId = uuid();

  const command = new PutObjectCommand({
    Bucket: 'did-cache',
    Key: `messages/${did}/${messageId}`,
    Body: JSON.stringify(message, null, 1),
  });

  await client.send(command);

  return messageId;
};

const getMessage = async (did: DID, id: string, config?: Config) => {
  const client = new S3Client(
    filterOutMissingProps({
      region: 'us-east-1',
      credentials: config && {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })
  );

  const command = new GetObjectCommand({
    Bucket: 'did-cache',
    Key: `messages/${did}/${id}`,
  });

  const response = await client.send(command);

  const stringifiedDocument = await streamToString(
    response.Body as SupportedStream
  );
  return JSON.parse(stringifiedDocument);
};

export {
  createDID,
  resolvePresentationRequestTaskWithDummyCredentials,
  getMessage,
  sendMessage,
};
