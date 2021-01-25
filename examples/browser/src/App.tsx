import React, {useCallback, useState} from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import logo from './logo.svg';
import './App.css';
import { Agent } from 'identity-agent';

const createAgent = async () => {
  return Agent.register({
    config: {
      // WARNING - for demo purposes only - do not pass AWS keys if using this on a browser in production
      awsAccessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    }
  }).build()
}

const App = () => {
  const [agent, setAgent] = useState<Agent>(null);
  const [recipient, setRecipient] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [encryptedMessage, setEncryptedMessage] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const encrypt = useCallback(() => agent.encrypt(message, recipient).then(setEncryptedMessage), [agent, recipient])
  const decrypt = useCallback(() => agent.decrypt(message).then(setMessage), [agent])
  const registerAgent = useCallback(() => createAgent().then(setAgent), []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
      </header>
      <div className="App-body">
        DID: {agent?.did}
        {agent ?
          <CopyToClipboard text={agent?.did} onCopy={() => setCopied('did')}>
            <button>Copy {copied === 'did' && '✅'}</button>
          </CopyToClipboard> : <button onClick={registerAgent}>Create Identity</button>
        }
        {agent &&
        <>
          <hr/>
          <div>
            <div>
              Encrypt <input onChange={e => setMessage(e.target.value)}/>
              for <input onChange={e => setRecipient(e.target.value)}/>
              <button onClick={encrypt}>Go</button>
            </div>
            <div>
              Encrypted message
              <textarea value={JSON.stringify(encryptedMessage, null, 1)} disabled={true}/>
              <CopyToClipboard text={JSON.stringify(encryptedMessage)} onCopy={() => setCopied('message')}>
                <button>Copy {copied === 'message' && '✅'}</button>
              </CopyToClipboard>
            </div>
          </div>

          <hr/>
          <div>
            <div>
              Decrypt <textarea onChange={e => setEncryptedMessage(JSON.parse(e.target.value))}/>
              <button onClick={decrypt}>Go</button>
            </div>
            <div>
              Decrypted message
              <textarea value={JSON.stringify(message, null, 1)} disabled={true}/>
            </div>
          </div>
        </>
        }
      </div>
    </div>
  );
};

export default App;
