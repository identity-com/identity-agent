import { MicrowaveFlow } from '../../../../src/service/task/cqrs/microwave/MicrowaveFlow';
import { CommandType } from '../../../../src/service/task/cqrs/Command';
import {
  DefaultTaskMaster,
  TaskMaster,
} from '../../../../src/service/task/TaskMaster';
import {
  AgentStorage,
  StorageKey,
} from '../../../../src/service/storage/AgentStorage';
import { Task } from '../../../../src/service/task/cqrs/Task';

describe('microwave', () => {
  let taskMaster: TaskMaster;
  let storage: AgentStorage;

  beforeEach(() => {
    const cache: Record<string, any> = {};
    const toKey = (storageKey: StorageKey): string =>
      Array(storageKey).flat().join(',');
    storage = {
      put(key, value) {
        cache[toKey(key)] = value;
        return Promise.resolve();
      },
      get(key) {
        return cache[toKey(key)];
      },
      remove(key) {
        delete cache[toKey(key)];
        return Promise.resolve();
      },
      findKeys(keyFragment) {
        const matchedKeys = Object.keys(cache).filter((key) =>
          key.startsWith(toKey(keyFragment))
        );
        return Promise.all(matchedKeys.map((key) => cache[key]));
      },
    };

    taskMaster = new DefaultTaskMaster({ storage });

    taskMaster.registerCommandHandler(
      MicrowaveFlow.CommandType.StartCooking,
      new MicrowaveFlow.StartCookingCommandHandler()
    );

    taskMaster.registerCommandHandler(
      CommandType.Rehydrate,
      new MicrowaveFlow.RehydrateCommandHandler()
    );

    taskMaster.registerEventHandler(
      MicrowaveFlow.EventType.Done,
      new MicrowaveFlow.DoneEventHandler()
    );
  });

  it('executes in 2 seconds', async () => {
    jest.setTimeout(3000);
    const microwaveDone = taskMaster.waitForEvent(MicrowaveFlow.EventType.Done);

    const task = new Task<MicrowaveFlow.MicrowaveState>();

    taskMaster.registerTask(task);
    await taskMaster.execute(MicrowaveFlow.CommandType.StartCooking, {
      taskId: task.id,
      durationMs: 2000,
    });

    await microwaveDone;
  });
});
