import { Container } from 'inversify';
import 'reflect-metadata';
import { WebStorage } from '@/service/storage/WebStorage';
import { Transport } from '@/service/transport/Transport';
import { HttpTransport } from '@/service/transport/HttpTransport';
import { IssuerProxy, StubIssuerProxy } from '@/service/credential/IssuerProxy';
import { AgentStorage } from '@/service/storage/AgentStorage';
import {
  PresentationVerification,
  StubPresentationVerification,
} from '@/service/credential/PresentationVerification';
import { Presenter, StubPresenter } from '@/service/credential/Presenter';
import { TYPES } from '@/wire/type';
import {
  DefaultTaskRepository,
  TaskRepository,
} from '@/service/task/cqrs/TaskRepository';
import {
  CommandDispatcher,
  DefaultCommandDispatcher,
} from '@/service/task/cqrs/CommandDispatcher';
import { DefaultEventBus, EventBus } from '@/service/task/cqrs/EventBus';
import { DefaultTaskMaster, TaskMaster } from '@/service/task/TaskMaster';
import { DefaultHttp } from '@/service/transport/http/DefaultHttp';
import { Http } from '@/service/transport/http/Http';
import { bindIfAbsent } from '@/wire/util';
import { DefaultRegistry } from '@/service/did/resolver/DefaultRegistry';
import { Config } from '@/api/Agent';

export const wire = (container: Container) => {
  // Always use bindIfAbsent here to avoid overwriting bindings made via the agent builder
  bindIfAbsent<AgentStorage>(container, TYPES.AgentStorage)
    ?.to(WebStorage)
    .inSingletonScope();

  bindIfAbsent<Transport>(container, TYPES.Transport)?.to(HttpTransport);
  bindIfAbsent<Http>(container, TYPES.Http)?.to(DefaultHttp);

  bindIfAbsent<IssuerProxy<any>>(container, TYPES.IssuerProxy)?.to(
    StubIssuerProxy
  );
  bindIfAbsent<PresentationVerification>(
    container,
    TYPES.PresentationVerification
  )?.to(StubPresentationVerification);
  bindIfAbsent<Presenter>(container, TYPES.Presenter)?.toConstantValue(
    new StubPresenter()
  );

  bindIfAbsent<TaskMaster>(container, TYPES.TaskMaster)?.to(DefaultTaskMaster);
  bindIfAbsent<TaskRepository>(container, TYPES.TaskRepository)
    ?.to(DefaultTaskRepository)
    .inSingletonScope();
  bindIfAbsent<CommandDispatcher>(container, TYPES.CommandDispatcher)
    ?.to(DefaultCommandDispatcher)
    .inSingletonScope();
  bindIfAbsent<EventBus>(container, TYPES.EventBus)
    ?.to(DefaultEventBus)
    .inSingletonScope();

  const http = container.get<Http>(TYPES.Http);
  bindIfAbsent<DefaultRegistry>(
    container,
    TYPES.DIDRegistry
  )?.toFactory(() => (config: Config) => new DefaultRegistry(config, http));
};
