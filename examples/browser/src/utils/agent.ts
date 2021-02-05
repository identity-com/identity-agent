import { Agent, Config } from "identity-agent";
import { DID } from '../../../../src';
import { encode, decode } from 'bs58';
import nacl from 'tweetnacl';

export const config: Config = {
  // WARNING - for demo purposes only - do not pass AWS keys if using this on a browser in production
  awsAccessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,

  hubBaseUrl: process.env.REACT_APP_DEFAULT_HUB
};

const findExistingAgent = () => {
  const myDID = localStorage.getItem('myDID')
  const myEncryptionKey = localStorage.getItem('myEncryptionKey');
  const mySigningKey = localStorage.getItem('mySigningKey');

  if (myDID && myEncryptionKey && mySigningKey) {
    console.log("Found " + myDID);
    return Agent.for(myDID as DID, { config }).withKeys(
      mySigningKey,
      nacl.box.keyPair.fromSecretKey(decode(myEncryptionKey))
    ).build();
  }

  return null;
}

export const createAgent = async () => {
  const foundAgentPromise = findExistingAgent();
  if (foundAgentPromise) return foundAgentPromise;

  const builder = Agent.register({ config });
  const agent = await builder.build();

  localStorage.setItem('myEncryptionKey', encode(builder.encryptionKey!.secretKey));
  localStorage.setItem('mySigningKey', encode(builder.signingKey!.privateKey));
  localStorage.setItem('myDID', agent.did);

  return agent;
}
