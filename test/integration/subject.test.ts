import { example as did } from '../fixtures/did';
import { Agent } from '@/api/Agent';
import { Subject } from '@/api/Subject';
import { xprv as dummyXprv } from '../fixtures/keys';
import * as nacl from 'tweetnacl';
import { Task } from '@/service/task/cqrs/Task';
import { EventType as CommonEventType } from '@/service/task/cqrs/TaskEvent';
import { StubPresenter } from '@/service/credential/Presenter';
import { TaskContext } from '@/service/task/TaskMaster';
import {
  ConfirmCommand,
  ConfirmCommandHandler,
  PresentationState,
  RejectCommand,
  EventType,
  CommandType,
} from '@/service/task/cqrs/subject/PresentationFlow';
import {
  Callback,
  create,
} from '@/service/task/cqrs/requestInput/RequestInput';
import { CommandHandler } from '@/service/task/cqrs/CommandHandler';
import { TYPES } from '../../src';
import { Command } from '../../src/service/task/cqrs/Command';

const verifierDID = 'did:dummy:receiver';

// this command handler rejects a presentation request if the verifier
// is not verifierDID
class RejectIfVerifierIsNotRecognisedHandler extends ConfirmCommandHandler {
  async execute(command: ConfirmCommand, task: Task<PresentationState>) {
    if (task.state.verifier === verifierDID) {
      return super.execute(command, task);
    }

    this.emit(
      EventType.Rejected,
      {
        rejectedAt: new Date(),
        rejectionReason: 'Unrecognised DID ' + task.state.verifier,
      },
      task
    );

    this.emit(CommonEventType.Done, {}, task);
  }
}

describe('PresentationFlow flows', () => {
  let subject: Subject;

  const presentationRequest = { question: 'What is your name?' };
  const presentation = { answer: 'It is Arthur, King of the Britons' };

  beforeEach(async () => {
    const agent = await Agent.for(did)
      .with(TYPES.Presenter, new StubPresenter(presentation))
      .withKeys(dummyXprv, nacl.box.keyPair())
      .build();
    subject = agent.asSubject();
  });

  it('can resolve a presentation request with no confirmation handlers', async () => {
    const presentationTask = subject.resolvePresentationRequest(
      presentationRequest,
      verifierDID
    );

    await presentationTask.waitForDone();

    expect(presentationTask.state.presentation).toEqual(presentation);
  });

  it('can resolve a presentation request with a simple confirmation handler', async () => {
    const addsATokenToTheConfirmationHandler = async <
      CT extends string,
      C extends Command<CT>
    >(
      _command: C,
      task: Task<PresentationState>,
      emitter: CommandHandler<CT, C, PresentationState>
    ) => {
      const token = await subject.sign({});
      emitter.emit(EventType.Confirmed, { presentation: { token } }, task);
      emitter.emit(CommonEventType.Done, {}, task);
    };

    subject.taskMaster.registerCommandHandler(
      CommandType.Confirm,
      addsATokenToTheConfirmationHandler,
      true
    );

    const task = subject.resolvePresentationRequest(
      presentationRequest,
      verifierDID
    );

    await task.waitForDone();

    await subject.verify(task.state.presentation.token);
  });

  it('can resolve a presentation request with a confirmation handler', async () => {
    subject.taskMaster.registerCommandHandler(
      CommandType.Confirm,
      new RejectIfVerifierIsNotRecognisedHandler(),
      true
    );

    const rejectedPresentationTask = subject.resolvePresentationRequest(
      presentationRequest,
      'did:dummy:some-unrecognised-did'
    );

    const acceptedPresentationTask = subject.resolvePresentationRequest(
      presentationRequest,
      verifierDID
    );

    await acceptedPresentationTask.waitForDone();
    await rejectedPresentationTask.waitForDone();

    expect(acceptedPresentationTask.state.rejectionReason).not.toBeDefined();
    expect(rejectedPresentationTask.state.rejectionReason).toBeDefined();
  });

  describe('with a requestInput subtask', () => {
    const callback: Record<string, Callback<string>> = {};
    type AugmentedPresentationState = PresentationState & { value: string };

    beforeEach(() => {
      const requestInputTaskGenerator = create(
        subject.taskMaster,
        (parentTaskId, value: string) => {
          const command: ConfirmCommand & { value: string } = {
            taskId: parentTaskId,
            value,
          };
          subject.taskMaster.dispatch(CommandType.Confirm, command);
        },
        (parentTaskId, rejectionReason: string | Error) => {
          const command: RejectCommand = {
            taskId: parentTaskId,
            rejectionReason,
          };
          subject.taskMaster.dispatch(CommandType.Reject, command);
        }
      );

      // Override the default confirm event to provide an input value
      subject.taskMaster.registerCommandHandler(
        CommandType.Confirm,
        async (command: ConfirmCommand & { value: string }, task, emitter) => {
          emitter.emit(EventType.Confirmed, { value: command.value }, task);
        },
        true
      );

      // Register an event that generates the callback when the presentation is resolved
      subject.taskMaster.registerEventHandler(
        EventType.Resolved,
        (_event, task) => {
          callback[task.id] = requestInputTaskGenerator(task.id);
        },
        true
      );
    });

    it('can resolve a presentation request with a confirmation handler that requests input', async () => {
      const presentationTask: TaskContext<AugmentedPresentationState> = subject.resolvePresentationRequest(
        presentationRequest,
        verifierDID
      );

      await presentationTask.waitForEvent(EventType.Resolved);

      const value = 'my value';
      expect(callback[presentationTask.id]).toBeDefined();
      await callback[presentationTask.id](undefined, value);

      await presentationTask.waitForDone();

      expect(presentationTask.state.value).toEqual(value);
    });

    it('can resolve or reject multiple presentation request with different requestInput subtasks', async () => {
      const firstTask: TaskContext<AugmentedPresentationState> = subject.resolvePresentationRequest(
        presentationRequest,
        verifierDID
      );
      const secondTask: TaskContext<AugmentedPresentationState> = subject.resolvePresentationRequest(
        presentationRequest,
        verifierDID
      );

      await firstTask.waitForEvent(EventType.Resolved);
      await secondTask.waitForEvent(EventType.Resolved);

      const rejectionReason = 'user rejected';
      const value = 'my value';
      await callback[firstTask.id](rejectionReason);
      await callback[secondTask.id](undefined, value);

      await firstTask.waitForDone();
      await secondTask.waitForDone();

      expect(firstTask.state.rejectionReason).toEqual(rejectionReason);
      expect(secondTask.state.value).toEqual(value);
    });
  });
});
