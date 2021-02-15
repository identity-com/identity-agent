import React from 'react';
import { Transition } from '@headlessui/react';
import { Message } from '../App';

type Props = { message: Message };
export const IncomingMessage = ({ message: { type, content, sender, receivedAt }}: Props) => (
  <Transition
    appear={true}
    show={true}
    enter="transition-opacity duration-1000"
    enterFrom="opacity-0"
    enterTo="opacity-100"
  >
    <div className="rounded-md bg-blue-50 p-4">
      <div className="flex">
        {type === 'Message' ?
          <div className="text-blue-800">
            <div className="font-bold">From {sender}</div>
            <code className="break-all">{content}</code>
          </div>
          :
          <div className="text-blue-800">
            <div className="font-bold">{type} from {sender}</div>
            <code className="break-all">{JSON.stringify(content)}</code>
          </div>
        }
        <div className="right-full text-blue-800 pl-4">{receivedAt.toLocaleTimeString()}</div>
      </div>
    </div>
  </Transition>
);
