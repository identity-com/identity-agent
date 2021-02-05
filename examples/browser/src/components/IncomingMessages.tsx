import React from 'react';
import { IncomingMessage } from './IncomingMessage';
import { Message } from '../App';

type Props = { messages: Message[] }

export const IncomingMessages = ({ messages }: Props) => (
  <div className='overflow-auto h-24'>
    { messages.map(message => <IncomingMessage message={message} key={message.id}/>)}
  </div>
);
