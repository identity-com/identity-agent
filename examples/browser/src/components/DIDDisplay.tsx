import React, { ComponentProps } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Agent } from 'identity-agent';

import { Button } from './Button';
import { CheckIcon } from './icons/CheckIcon';

type Props = { agent: Agent; showIcon?: boolean } & Pick<
  ComponentProps<typeof CopyToClipboard>,
  "onCopy"
  >;

export const DIDDisplay = ({ agent, onCopy, showIcon }: Props) => (
  <>
    <div className="rounded-md bg-blue-50 p-4">
      <div className="flex items-center">
        <div className="ml-3 flex items-center text-xl">
          <div className="text-blue-800">
            <code className="break-all">{agent.did}</code>
          </div>
          <div className="mt-3 md:mt-0 ml-6">
            <CopyToClipboard text={agent?.did} onCopy={onCopy}>
              <Button>Copy {showIcon && <CheckIcon />}</Button>
            </CopyToClipboard>
          </div>
        </div>
      </div>
    </div>
  </>
);
