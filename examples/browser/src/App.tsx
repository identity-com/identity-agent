import React, { useCallback, useState } from "react";
import { Agent } from "identity-agent";

import { createAgent } from './utils/agent';

import { Header } from "./components/Header";
import { Button } from "./components/Button";
import { DIDDisplay } from "./components/DIDDisplay";
import { EncryptMessage } from "./components/EncryptMessage";
import { Decrypt } from "./components/DecryptMessage";

const App = () => {
  const [copied, setCopied] = useState<"did" | "message" | null>(null);

  const [agent, setAgent] = useState<Agent>(null);
  const registerAgent = useCallback(() => createAgent().then(setAgent), []);

  const [message, setMessage] = useState<string>("");
  const [encryptedMessage, setEncryptedMessage] = useState<string>("");

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {!agent ? (
          <div className="flex justify-center">
            <Button onClick={registerAgent} size='large'>
              Create Identity
            </Button>
          </div>
        ) : null}
        {agent && (
          <>
            <DIDDisplay
              agent={agent}
              onCopy={() => setCopied("did")}
              showIcon={copied === "did"}
            />
            <hr className="mt-2 mb-2"/>
            <EncryptMessage
              agent={agent}
              message={message}
              setMessage={setMessage}
              encryptedMessage={encryptedMessage}
              setEncryptedMessage={setEncryptedMessage}
              onCopy={() => setCopied("message")}
              showIcon={copied === "message"}
            />
            <hr className="mt-2 mb-2"/>
            <Decrypt
              agent={agent}
              message={message}
              setMessage={setMessage}
              encryptedMessage={encryptedMessage}
              setEncryptedMessage={setEncryptedMessage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
