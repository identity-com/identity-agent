import { Task } from '@/service/task/Task';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { DummyTask } from '@/service/task/DummyTask';
import {PresentationRequest, PresentationTask} from '@/service/task/subject/Presentation';
import {CredentialRequestTask} from "@/service/task/subject/CredentialRequest";
import {PresentationRequestTask} from "@/service/task/verifier/PresentationRequest";
import {DID} from "@/api/DID";

const STORAGE_FOLDER = 'tasks';

export interface TaskMaster {
  register<T extends Task<any>>(task: T): T;
  allResults(): Promise<any[]>;
}

// A static mapping from task name to constructor
// this implementation will likely change in the future
// to allow for custom tasks
const taskRegistry: Record<string, () => Task<any>> = {
  [DummyTask.TYPE]: () => new DummyTask(),
  [PresentationTask.TYPE]: () => new PresentationTask(),
  [PresentationRequestTask.TYPE]: (request?: PresentationRequest, subject?: DID) => new PresentationRequestTask(request, subject),
  [CredentialRequestTask.TYPE]: () => new CredentialRequestTask(),
};

type SerializedTask = {
  type: string;
  contents: Record<string, any>;
};

const serializeTask = (task: Task<any>): SerializedTask => {
  const type = task.type;
  const contents = task.serialize();

  return {
    type,
    contents,
  };
};

const deserializeTask = (serializedTask: SerializedTask) => {
  const creatorFunction = taskRegistry[serializedTask.type];

  if (!creatorFunction)
    throw new Error(
      `Unable to deserialize task of type ${serializedTask.type}`
    );

  const unpopulatedTask = creatorFunction();

  unpopulatedTask.deserialize(serializedTask.contents);

  return unpopulatedTask;
};

export class DefaultTaskMaster implements TaskMaster {
  private storage: AgentStorage;
  private tasks: Task<any>[];

  constructor(storage: AgentStorage, tasks: Task<any>[]) {
    this.storage = storage;
    this.tasks = tasks;
  }

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
