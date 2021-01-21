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

// TESTING TYPES

// class Event<T extends EventType> {
//   constructor() {
//   }
// }
//
// class Handler<T extends EventType> {
//   handle(e: Event<T>):void {
//     console.log(e);
//   }
// }
// class NewHandler extends Handler<CommonEventType.New> {}
//
// const event = new Event<CommonEventType.New>()
// const newHandler = new NewHandler();
//
// newHandler.handle(event)
