import { DID, DIDResolver } from '@/api/DID';
import { Agent, Config } from '@/api/Agent';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
  CryptoModule,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { normalizePrivateKey } from '@/lib/crypto/utils';
import { wireDIDResolverFactory } from '@/service/did/resolver/Resolver';
import { PrivateKeyCrypto } from '@/service/crypto/PrivateKeyCrypto';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { TaskMaster } from '@/service/task/TaskMaster';
import { DefaultAgent } from '@/api/internal';
import { DeepPartial } from '@/lib/util';
import { DIDDocument } from 'did-resolver';
import { wire } from '@/wire/wire';
import { TYPES } from '@/wire/type';
import { register as registerMicrowaveFlow } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { register as registerPresentationRequestFlow } from '@/service/task/cqrs/verifier/PresentationRequestFlow';
import { register as registerPresentationFlow } from '@/service/task/cqrs/subject/PresentationFlow';
import { register as registerCredentialRequestFlow } from '@/service/task/cqrs/subject/CredentialRequestFlow';
import { register as registerRequestInputFlow } from '@/service/task/cqrs/requestInput/RequestInput';

import { Container } from 'inversify';

/**
 * A builder for configuring and generating agent
 */
export class Builder {
  did: DID;
  config: DeepPartial<Config>;
  signingKey?: AsymmetricKey;
  encryptionKey?: nacl.BoxKeyPair;

  container: Container;

  constructor(did: DID, config: DeepPartial<Config> = {}) {
    this.did = did;
    this.config = config;
    this.container = new Container();
  }

  /**
   * Addi private keys to an agent to make it a 'privileged' agent,
   * i.e. able to sign and decrypt messages on behalf of the owner of the
   * DID.
   * @param signingKey
   * @param encryptionKey
   */
  withKeys(
    signingKey: AsymmetricKeyInput,
    encryptionKey: nacl.BoxKeyPair
  ): this {
    this.signingKey = normalizePrivateKey(signingKey);
    this.encryptionKey = encryptionKey; // TODO allow other formats e.g. base58
    return this;
  }

  /**
   * Add a plugin to the agent.
   *
   * For example, to add a different storage module:
   *
   * ```
   * await Agent
   *  .for(did)
   *  .with(TYPES.AgentStorage, myStorageModule)
   *  .build()
   * ```
   *
   * @param type
   * @param component
   */
  with<T>(type: symbol, component: T): this {
    this.container
      .bind<T>(type)
      .toConstantValue(component)
      .whenTargetIsDefault();
    return this;
  }

  /**
   * Add a plugin type to the agent. Use [inversify](https://inversify.io/)
   * to register bind targets.
   *
   * For example, to add a different storage module:
   *
   * ```
   * @injectable
   * class MyStorageModule implements AgentStorage { ... }
   *
   * await Agent
   *  .for(did)
   *  .with(TYPES.AgentStorage, myStorageModule)
   *  .build()
   * ```
   *
   * @param type
   * @param constructor
   */
  withType<T>(type: symbol, constructor: new (...args: any[]) => T): this {
    this.container.bind<T>(type).to(constructor).whenTargetIsDefault();
    return this;
  }

  private async configure() {
    wire(this.container);

    const didResolverFactory = wireDIDResolverFactory(
      this.config,
      this.container
    );
    this.container
      .bind<DIDResolver>(TYPES.DIDResolver)
      .toProvider<DIDDocument>(didResolverFactory);

    const didResolver = this.container.get<DIDResolver>(TYPES.DIDResolver);

    const document = await didResolver(this.did);
    this.container
      .bind<DIDDocument>(TYPES.DIDDocument)
      .toConstantValue(document);

    let cryptoModule;
    if (this.signingKey && this.encryptionKey) {
      cryptoModule = new PrivateKeyCrypto(
        this.did,
        this.signingKey,
        this.encryptionKey,
        didResolver
      );
    } else {
      cryptoModule = new DefaultCryptoModule(this.did, didResolver);
    }
    this.container
      .bind<CryptoModule>(TYPES.CryptoModule)
      .toConstantValue(cryptoModule);
  }

  /**
   * Resolve the DID document and generate the agent.
   */
  async build(): Promise<Agent> {
    await this.configure();

    const taskMaster = this.container.get<TaskMaster>(TYPES.TaskMaster);

    // TODO perhaps move this to a module
    // Register flows
    registerMicrowaveFlow(this.container);
    registerPresentationRequestFlow(this.container);
    registerPresentationFlow(this.container);
    registerCredentialRequestFlow(this.container);
    registerRequestInputFlow(this.container);

    await taskMaster.rehydrate();

    return new DefaultAgent(this.container);
  }
}
