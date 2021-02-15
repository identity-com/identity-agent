import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';
import { injectable } from 'inversify';

export interface PresentationVerification {
  verify(presentation: Presentation): Promise<boolean>; // TODO boolean is temporary
}

@injectable()
export class StubPresentationVerification {
  verify(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
