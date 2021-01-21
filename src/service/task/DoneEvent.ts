import {TaskEvent} from "@/service/task/TaskEvent";
import {CommonEventType} from "@/service/task/EventType";

export class DoneEvent<R> extends TaskEvent<CommonEventType.Done> {
  readonly result: R;

  constructor(result: R) {
    super(CommonEventType.Done);
    this.result = result;
  }
}
