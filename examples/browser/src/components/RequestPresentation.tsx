import React, { useCallback, useState } from 'react';
import { Agent, DID } from "identity-agent";

import { Button } from "./Button";
import { TwoColumnContainer } from "./TwoColumnContainer";
import { TextArea } from './TextArea';

type Props = {
  agent: Agent;
};

export const RequestPresentation = ({ agent }: Props) => {
  const [request, setRequest] = useState<string>("")
  const [recipient, setRecipient] = useState<string>("");

  const sendPresentationRequest = useCallback(
    () => {
      const task = agent.asVerifier().requestPresentation(recipient as DID, JSON.parse(request))
      console.log("Created Task", task);
    },
    [recipient, request, agent]
  );

  return (
    <TwoColumnContainer
      header={"Request Presentation"}
      columnOne={
        <form className="mt-6 grid grid-cols-1 gap-y-6">
          <div>
            <label
              htmlFor="presentationRequest"
              className="block text-sm font-medium text-gray-700"
            >
              Request
            </label>
            <div className="mt-1">
              <TextArea
                id="presentationRequest"
                onChange={e => setRequest(e.target.value)}
                name="about"
                required
              />
            </div>
          </div>

        </form>
      }
      columnTwo={
        <div className="mt-6">
          <div className="mt-1">
            <div>
              <label
                htmlFor="requestFor"
                className="block text-sm font-medium text-gray-700"
              >
                For (Recipient)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  required
                  onChange={e => setRecipient(e.target.value)}
                  type="text"
                  name="requestFor"
                  id="requestFor"
                  className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-md sm:text-sm border-gray-300"
                />
              </div>
            </div>
            <div className="mt-2">
              <Button onClick={sendPresentationRequest}>Send</Button>
            </div>
          </div>
        </div>
      }
    />
  );
};
