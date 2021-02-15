import { PresentationRequest } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';
import { injectable } from 'inversify';

export interface Presenter {
  present(request: PresentationRequest): Promise<Presentation | null>;
}

// The stub implementation just returns the same presentation
// for every request
@injectable()
export class StubPresenter {
  constructor(private dummyPresentation: Presentation = {}) {}

  present() {
    return Promise.resolve(this.dummyPresentation);
  }
}
