import { DID, DIDResolver } from '@/api/DID';
import { Agent, Context } from '@/api/Agent';
import {
  AsymmetricKey,
  AsymmetricKeyInput,
  CryptoModule,
} from '@/service/crypto/CryptoModule';
import nacl from 'tweetnacl';
import { mergeDeepLeft } from 'ramda';
import { normalizePrivateKey } from '@/lib/crypto/utils';
import { WebStorage } from '@/service/storage/WebStorage';
import { defaultDIDResolver } from '@/service/did/resolver/Resolver';
import { PrivateKeyCrypto } from '@/service/crypto/PrivateKeyCrypto';
import { DefaultCryptoModule } from '@/service/crypto/DefaultCryptoModule';
import { DefaultTaskMaster } from '@/service/task/TaskMaster';
import { DefaultAgent } from '@/api/internal';
import { DefaultHttp } from '@/service/transport/http/DefaultHttp';
import { HttpTransport } from '@/service/transport/HttpTransport';
import { StubPresenter } from '@/service/credential/Presenter';
import { StubPresentationVerification } from '@/service/credential/PresentationVerification';
import { StubIssuerProxy } from '@/service/credential/IssuerProxy';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { DeepPartial } from '@/lib/util';

export class Builder {
  did: DID;
  context: DeepPartial<Context>;
  signingKey?: AsymmetricKey;
  encryptionKey?: nacl.BoxKeyPair;

  constructor(did: DID, context: DeepPartial<Context> = {}) {
    this.did = did;
    this.context = context;

    if (!this.context.config) {
      this.context.config = {};
    }
  }

  mergeContext(newProperties: DeepPartial<Context>) {
    this.context = mergeDeepLeft(
      this.context,
      newProperties
    ) as DeepPartial<Context>;
  }

  withKeys(
    signingKey: AsymmetricKeyInput,
    encryptionKey: nacl.BoxKeyPair
  ): this {
    this.signingKey = normalizePrivateKey(signingKey);
    this.encryptionKey = encryptionKey; // TODO allow other formats e.g. base58
    return this;
  }

  private async configure() {
    this.context.storage = this.context.storage || new WebStorage();
    this.context.didResolver =
      this.context.didResolver ||
      defaultDIDResolver(
        this.context.config || {},
        this.context.storage as AgentStorage
      );

    if (!this.context.crypto) {
      if (this.signingKey && this.encryptionKey) {
        this.context.crypto = new PrivateKeyCrypto(
          this.did,
          this.signingKey,
          this.encryptionKey,
          this.context.didResolver as DIDResolver
        );
      } else {
        this.context.crypto = new DefaultCryptoModule(
          this.did,
          this.context.didResolver as DIDResolver
        );
      }
    }

    this.context.credential = this.context.credential || {};
    this.context.credential.presenter =
      this.context.credential.presenter || new StubPresenter({});
    this.context.credential.presentationVerification =
      this.context.credential.presentationVerification ||
      new StubPresentationVerification();
    this.context.credential.issuerProxy =
      this.context.credential.issuerProxy || new StubIssuerProxy();

    this.context.transport =
      this.context.transport ||
      new HttpTransport(
        new DefaultHttp(),
        this.context.didResolver as DIDResolver,
        this.context.crypto as CryptoModule
      );

    this.context.taskMaster =
      this.context.taskMaster ||
      (await DefaultTaskMaster.rehydrate(this.context as Context));
  }

  async build(): Promise<Agent> {
    await this.configure();

    if (!this.context.didResolver)
      throw Error('An agent must include a DID resolver');

    const document = await (this.context as Context).didResolver(this.did);

    return new DefaultAgent(document, this.context as Context);
  }
}
