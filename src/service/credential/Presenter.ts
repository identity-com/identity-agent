import { PresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { PresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { Task } from '@/service/task/cqrs/Task';
import PresentationRequest = PresentationRequestFlow.PresentationRequest;

export interface Presenter {
  present(
    request: PresentationRequest
  ): Task<PresentationFlow.PresentationState>;
}
