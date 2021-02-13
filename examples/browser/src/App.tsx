import React, { useEffect, useState } from 'react';
import { Agent, DID, PayloadType } from "identity-agent";

import { createAgent, handlePresentationRequest } from './utils/agent';

import { Header } from "./components/Header";
import { DIDDisplay } from "./components/DIDDisplay";
import { EncryptMessage } from "./components/EncryptMessage";
import {connect} from "./utils/hub";
import { IncomingMessages } from './components/IncomingMessages';

export type Message = {
  content: string,
  sender: DID,
  receivedAt: Date,
  id: string
  type: PayloadType
}

const App = () => {
  const [copied, setCopied] = useState<"did" | "message" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState<Agent>();


  useEffect(() => {
    const listener = (error: any, message:Message | undefined) => {
      if (error) console.error(error);
      if (!agent) return;
      if (message) {
        switch (message.type) {
          case 'Message':
            setIncomingMessages(incomingMessages => [message, ...incomingMessages])
            break;
          case 'PresentationRequest':
            handlePresentationRequest(agent, message.content, message.sender);
            break;
        }
      }
    }

    if (!agent) return;

    connect(agent, listener);
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
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
