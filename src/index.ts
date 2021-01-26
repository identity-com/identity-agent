import { Agent } from '@/api/internal';
import * as Presentation from '@/service/task/subject/Presentation';
import * as PresentationRequest from '@/service/task/verifier/PresentationRequest';
import { DID } from '@/api/DID';
import * as demo from './demo';
import { EventType, CommonEventType } from './service/task/EventType';

export {
  Agent,
  Presentation,
  PresentationRequest,
  EventType,
  CommonEventType,
  demo,
  DID,
};
