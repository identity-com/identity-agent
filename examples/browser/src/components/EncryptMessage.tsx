import React, { useCallback, useState } from 'react';
import { Agent, DID } from "identity-agent";

import { Button } from "./Button";
import { TwoColumnContainer } from "./TwoColumnContainer";

type Props = { agent: Agent };
export const EncryptMessage = ({ agent }: Props) => {
  const [message, setMessage] = useState<string>("")
  const [recipient, setRecipient] = useState<string>("");

  const sendMessage = useCallback(
    () => agent.send({ message }, recipient as DID),
    [recipient, message, agent]
  );

  return (
    <TwoColumnContainer
      header={"Encrypt"}
      columnOne={
        <div className="mt-6 grid grid-cols-1 gap-y-6">
          <div className="mt-1">
          <div>
            <label
              htmlFor="encryptMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                id="encryptMessage"
                onChange={e => setMessage(e.target.value)}
                type="text"
                name="about"
                required
                className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-md sm:text-sm border-gray-300"
              />
            </div>
          </div>
          </div>
        </div>
      }
      columnTwo={
        <div className="mt-6">
          <div className="mt-1">
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
            <div className="mt-2">
              <Button onClick={sendMessage}>Send</Button>
            </div>
          </div>
        </div>
      }
    />
  );
};
