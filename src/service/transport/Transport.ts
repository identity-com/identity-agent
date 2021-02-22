import { DID } from '@/api/DID';
import { JWTVerified } from 'did-jwt';

export type PayloadType = 'Presentation' | 'PresentationRequest' | 'Message';
export type Response = {
  status: 'ok'; // TODO
};

export type MessageResponse = Response & { messages: JWTVerified[] };

export type MessageOptions = {
  since?: Date;
};

export type TransportOptions = {
  encrypted?: boolean;
  signed?: boolean;
};

/**
 * The transport layer for agents. This API is independent of the communication
 * mechanism.
 */
export interface Transport {
  send(
    recipient: DID,
    payload: any,
    type: PayloadType,
    options?: TransportOptions
  ): Promise<Response>;

  getMessages(options?: MessageOptions): Promise<MessageResponse>;
}
