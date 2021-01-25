import React, { useCallback, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
// eslint-disable-next-line
import { Agent, demo, DID } from "identity-agent";

// import { config } from '../utils/agent';

import { CheckIcon } from "./icons/CheckIcon";
import { Button } from "./Button";
import { TwoColumnContainer } from "./TwoColumnContainer";
import { TextArea } from './TextArea';

/*
const sendMessage = (did: DID, message: any) =>
  demo.sendMessage(did, message, config);
*/

type Props = {
  agent: Agent;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  encryptedMessage: string;
  setEncryptedMessage: React.Dispatch<React.SetStateAction<string>>;
  onCopy: () => void;
  showIcon?: boolean;
};

export const EncryptMessage = ({
 agent,
 message,
 setMessage,
 encryptedMessage,
 setEncryptedMessage,
 onCopy,
 showIcon
}: Props) => {
  const [recipient, setRecipient] = useState<string>("");

  const encrypt = useCallback(
    () => agent.encrypt(message, recipient).then(setEncryptedMessage),
    [agent, recipient, message, setEncryptedMessage]
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    encrypt();
  }

  /*const sendEncryptedMessage = useCallback(
    () => sendMessage(recipient as DID, encryptedMessage),
    [recipient, encryptedMessage]
  );*/

  return (
    <TwoColumnContainer
      header={"Encrypt"}
      columnOne={
        <form className="mt-6 grid grid-cols-1 gap-y-6" onSubmit={onSubmit}>
          <div>
            <label
              htmlFor="encryptMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <div className="mt-1">
              <TextArea
                id="encryptMessage"
                onChange={e => setMessage(e.target.value)}
                name="about"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="messageFor"
              className="block text-sm font-medium text-gray-700"
            >
              For (Recipient)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                required
                onChange={e => setRecipient(e.target.value)}
                type="text"
                name="messageFor"
                id="messageFor"
                className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-md sm:text-sm border-gray-300"
              />
            </div>
          </div>
          <div>
            <Button
              size="large"
              type="submit"
            >
              Encrypt
            </Button>
          </div>
        </form>
      }
      columnTwo={
        <div className="mt-6">
          <label
            htmlFor="encryptMessage"
            className="block text-sm font-medium text-gray-700"
          >
            Encrypted message
          </label>
          <div className="mt-1">
            <TextArea
              value={JSON.stringify(encryptedMessage, null, 1)}
              disabled={true}
            />
            <div className="mt-2">
              <CopyToClipboard
                text={JSON.stringify(encryptedMessage)}
                onCopy={onCopy}
              >
                <Button>Copy {showIcon && <CheckIcon />}</Button>
              </CopyToClipboard>
              {/*<button onClick={sendEncryptedMessage}>Send</button>*/}
            </div>
          </div>
        </div>
      }
    />
  );
};
