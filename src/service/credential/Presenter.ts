import { PresentationRequest } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { Presentation } from '@/service/task/cqrs/subject/PresentationFlow';

export interface Presenter {
  present(request: PresentationRequest): Promise<Presentation | null>;
}

// The stub implementation just returns the same presentation
// for every request
export class StubPresenter {
  constructor(
    private dummyPresentation: Presentation = {
      dummy: 'presentation',
    }
  ) {}

  present() {
    return Promise.resolve(this.dummyPresentation);
  }
}
