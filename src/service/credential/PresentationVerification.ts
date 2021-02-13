import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';

export interface PresentationVerification {
  verify(presentation: Presentation): Promise<boolean>; // TODO boolean is temporary
}

export class StubPresentationVerification {
  verify(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
