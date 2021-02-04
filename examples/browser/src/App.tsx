import React, { useEffect, useState } from 'react';
import { Agent } from "identity-agent";

import { createAgent } from './utils/agent';

import { Header } from "./components/Header";
import { DIDDisplay } from "./components/DIDDisplay";
import { EncryptMessage } from "./components/EncryptMessage";
import {connect} from "./utils/hub";
import { IncomingMessages } from './components/IncomingMessages';
import { DID } from '../../../src';

export type Message = {
  content: string,
  sender: DID,
  receivedAt: Date,
  id: string
}

const App = () => {
  const [copied, setCopied] = useState<"did" | "message" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState<Agent>();

  useEffect(() => {
    const listener = (error: any, message:any) => {
      if (error) console.error(error);
      if (message) {
        setIncomingMessages(incomingMessages => [message, ...incomingMessages])
      }
    }

    if (!agent) return;

    connect(agent, listener );
  }, [agent]);

  useEffect(() => {
    const registerAgent = async () => {
      const agent = await createAgent()
      setAgent(agent)
    }

    registerAgent()
  }, []);

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {agent && (
          <>
            <DIDDisplay
              agent={agent}
              onCopy={() => setCopied("did")}
              showIcon={copied === "did"}
            />
            <hr className="mt-2 mb-2"/>
            <IncomingMessages messages={incomingMessages}/>
            <hr className="mt-2 mb-2"/>
            <EncryptMessage
              agent={agent}
              message={message}
              setMessage={setMessage}
              onCopy={() => setCopied("message")}
              showIcon={copied === "message"}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
