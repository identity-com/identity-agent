import { SerializedTask, Task } from '@/service/task/Task';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { DummyTask } from '@/service/task/DummyTask';
import {
  PresentationRequest,
  PresentationTask,
} from '@/service/task/subject/Presentation';
import { CredentialRequestTask } from '@/service/task/subject/CredentialRequest';
import { PresentationRequestTask } from '@/service/task/verifier/PresentationRequest';
import { DID } from '@/api/DID';

const STORAGE_FOLDER = 'tasks';

export interface TaskMaster {
  register<T extends Task<any, any>>(task: T): T;
  allResults(): Promise<any[]>;
}

// A static mapping from task name to constructor
// this implementation will likely change in the future
// to allow for custom tasks
const taskRegistry: Record<
  string,
  <Type, Contents>() => Task<Type, Contents>
> = {
  [DummyTask.TYPE]: () => new DummyTask(),
};

const serializeTask = <Contents>(
  task: Task<any, Contents>
): SerializedTask<Contents> => {
  return task.serialize();
};

const deserializeTask = <Contents>(
  serializedTask: SerializedTask<Contents>
) => {
  const creatorFunction = taskRegistry[serializedTask.type];

  if (!creatorFunction)
    throw new Error(
      `Unable to deserialize task of type ${serializedTask.type}`
    );

  const unpopulatedTask = creatorFunction();

  unpopulatedTask.deserialize(serializedTask);

  return unpopulatedTask;
};

export class DefaultTaskMaster implements TaskMaster {
  constructor(private storage: AgentStorage, private tasks: Task<any>[]) {}

  static async rehydrate(storage: AgentStorage): Promise<TaskMaster> {
    const tasksInStorage = await storage.findKeys(STORAGE_FOLDER);

    const rehydratedTaskPromises = tasksInStorage.map(async (key) => {
      const serializedTask = await storage.get(key);
      return deserializeTask(serializedTask as SerializedTask);
    });

    const rehydratedTasks = await Promise.all(rehydratedTaskPromises);

    return new DefaultTaskMaster(storage, rehydratedTasks);
  }

  register<T extends Task<any>>(task: T): T {
    this.tasks.push(task);

    this.storage.put([STORAGE_FOLDER, task.id], serializeTask(task));

    return task;
  }

  allResults(): Promise<any[]> {
    return Promise.all(this.tasks.map((t) => t.result()));
  }
}
