import { EventBus } from '../../../../src/service/task/cqrs/EventBus';
import { CommandDispatcher } from '../../../../src/service/task/cqrs/CommandDispatcher';
import { Microwave } from '../../../../src/service/task/cqrs/microwave/Microwave';
import { CommandType } from '../../../../src/service/task/cqrs/Command';

describe('microwave', () => {
  let commandDispatcher: CommandDispatcher;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    commandDispatcher = new CommandDispatcher();

    commandDispatcher.registerCommandHandler(
      Microwave.CommandType.StartCooking,
      new Microwave.StartCookingCommandHandler(eventBus)
    );

    commandDispatcher.registerCommandHandler(
      CommandType.Rehydrate,
      new Microwave.RehydrateCommandHandler(eventBus)
    );

    eventBus.registerHandler(
      Microwave.EventType.Done,
      new Microwave.DoneEventHandler()
    );
  });

  it('executes in 2 seconds', async () => {
    const microwaveDone = eventBus.waitForEvent(Microwave.EventType.Done);

    const task = new Microwave.MicrowaveTask();

    commandDispatcher.registerTask(task);
    await commandDispatcher.execute(Microwave.CommandType.StartCooking, {
      taskId: task.id,
      durationMs: 2000,
    });

    await microwaveDone;
  });
});
