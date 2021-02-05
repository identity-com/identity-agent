import { CredentialRequestEventType } from '@/service/task/subject/CredentialRequest';
import { PresentationEventType } from '@/service/task/subject/Presentation';
import { PresentationRequestEventType } from '@/service/task/verifier/PresentationRequest';

export enum CommonEventType {
  New = 'New',
  Dehydrate = 'Dehydrate',
  Rehydrate = 'Rehydrate',
  Done = 'Done',
  Failed = 'Failed',
}
export type EventType =
  | CommonEventType
  | CredentialRequestEventType
  | PresentationEventType
  | PresentationRequestEventType;
