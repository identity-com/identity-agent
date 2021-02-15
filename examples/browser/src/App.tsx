import React, { useEffect, useState } from 'react';
import { Agent, DID, PayloadType } from "identity-agent";

import { createAgent, handlePresentationRequest, handlePresentation } from './utils/agent';

import { Header } from "./components/Header";
import { DIDDisplay } from "./components/DIDDisplay";
import { EncryptMessage } from "./components/EncryptMessage";
import {connect} from "./utils/hub";
import { IncomingMessages } from './components/IncomingMessages';
import { RequestPresentation } from './components/RequestPresentation';

export type Message = {
  content: string,
  sender: DID,
  receivedAt: Date,
  id: string
  type: PayloadType
}

const App = () => {
  const [copied, setCopied] = useState<"did" | "message" | null>(null);
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState<Agent>();

  useEffect(() => {
    const listener = (error: any, message:Message | undefined) => {
      if (error) console.error(error);
      if (!agent) return;

      const addMessage = (message: Message) => setIncomingMessages(incomingMessages => [message, ...incomingMessages])

      if (message) {
        switch (message.type) {
          case 'Message':
            addMessage(message)
            break;
          case 'PresentationRequest':
            addMessage(message)
            handlePresentationRequest(agent, message.content, message.sender);
            break;
          case 'Presentation':
            addMessage(message)
            handlePresentation(agent, message.content, message.sender);
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
            <EncryptMessage agent={agent} />
            <hr className="mt-2 mb-2"/>
            <RequestPresentation agent={agent} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
