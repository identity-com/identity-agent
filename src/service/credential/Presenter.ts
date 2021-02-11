import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;
import Presentation = PresentationFlow.Presentation;

export interface Presenter {
  present(request: PresentationRequest): Promise<Presentation>;
}

// The stub implementation just returns the same presentation
// for every request
export class StubPresenter {
  constructor(private dummyPresentation: Presentation) {}

  present() {
    return Promise.resolve(this.dummyPresentation);
  }
}
