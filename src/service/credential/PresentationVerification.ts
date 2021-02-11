import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import Presentation = PresentationFlow.Presentation;

export interface PresentationVerification {
  verify(presentation: Presentation): Promise<boolean>; // TODO boolean is temporary
}

export class StubPresentationVerification {
  verify(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
