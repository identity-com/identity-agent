import React, { useCallback } from "react";
import { Agent } from "identity-agent";
import { TwoColumnContainer } from "./TwoColumnContainer";
import { TextArea } from "./TextArea";
import { Button } from "./Button";

type Props = {
  agent: Agent;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  encryptedMessage: string;
  setEncryptedMessage: React.Dispatch<React.SetStateAction<string>>;
};

export const Decrypt = ({
  agent,
  message,
  setMessage,
  encryptedMessage,
  setEncryptedMessage
}: Props) => {
  const decrypt = useCallback(
    () => agent.decrypt(encryptedMessage).then(setMessage),
    [agent, encryptedMessage, setMessage]
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    decrypt();
  }

  return (
    <TwoColumnContainer
      header={"Decrypt"}
      columnOne={
        <form className="mt-6" onSubmit={onSubmit}>
          <label
            htmlFor="decryptMessage"
            className="block text-sm font-medium text-gray-700"
          >
            Message to decrypt
          </label>
          <div className="mt-1 mb-6">
            <TextArea
              onChange={e => setEncryptedMessage(JSON.parse(e.target.value))}
              required
            />
          </div>
          <Button type="submit" size="large">Decrypt</Button>
        </form>
      }
      columnTwo={
        <div className="mt-6">
          <label
            htmlFor="decryptMessage"
            className="block text-sm font-medium text-gray-700"
          >
            Decrypted message
          </label>
          <div className="mt-1">
            <TextArea
              name="decryptMessage"
              id="decryptMessage"
              value={JSON.stringify(message, null, 1)}
              disabled={true}
            />
          </div>
        </div>
      }
    />
  );
};
