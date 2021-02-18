import { Agent, Config } from '@/api/internal';
import { DID } from '@/api/DID';
import { PayloadType, Transport } from '@/service/transport/Transport';
import * as demo from './demo';
import { Presentation } from './service/task/cqrs/subject/PresentationFlow';
import { PresentationRequest } from './service/task/cqrs/verifier/PresentationRequestFlow';
import { TYPES } from './wire/type';
import { AgentStorage } from './service/storage/AgentStorage';
import { CryptoModule } from './service/crypto/CryptoModule';
import { DIDResolver } from 'did-resolver';
import { Http } from './service/transport/http/Http';
import { TaskMaster } from './service/task/TaskMaster';
import { IssuerProxy } from './service/credential/IssuerProxy';
import { PresentationVerification } from './service/credential/PresentationVerification';
import { Presenter } from './service/credential/Presenter';

export {
  Agent,
  demo,
  DID,
  Config,
  PayloadType,
  Presentation,
  PresentationRequest,
  TYPES,
  AgentStorage,
  CryptoModule,
  DIDResolver,
  Transport,
  Http,
  TaskMaster,
  IssuerProxy,
  PresentationVerification,
  Presenter,
};
