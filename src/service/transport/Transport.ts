import { DID } from '@/api/DID';

export type PayloadType = 'Presentation' | 'PresentationRequest' | 'Message';
export type Response = {
  status: 'ok'; // TODO
};

export type TransportOptions = {
  encrypted?: boolean;
  signed?: boolean;
};

export interface Transport {
  send(
    recipient: DID,
    payload: any,
    type: PayloadType,
    options?: TransportOptions
  ): Promise<Response>;
}
