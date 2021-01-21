import { pick } from 'ramda';
import {DID} from "@/api/DID";
import {DefaultTask, passthroughHandler} from "@/service/task/DefaultTask";

export type CredentialRequest = {
  verifier: DID;
  identifier: string
}

export enum CredentialRequestEventType {
  UCARequested = "UCARequested",
  UCARejected = "UCARejected",
  SignCredential = "SignCredential"
}

export class CredentialRequestTask extends DefaultTask<void> {
  static TYPE = 'CredentialRequestTask';
  readonly type = CredentialRequestTask.TYPE;

  private request?: CredentialRequest;

  getRequest() {
    return this.request;
  }

  constructor(request?: CredentialRequest) {
    super(CredentialRequestTask.TYPE);
    this.request = request;

    this.initialize();

    // TODO
    this.on(CredentialRequestEventType.UCARequested, passthroughHandler, true);
    this.on(CredentialRequestEventType.UCARejected, passthroughHandler, true);
    this.on(CredentialRequestEventType.SignCredential, passthroughHandler, true);
  }

  protected initialize(): void {}

  deserialize(serialized: Record<string, any>): void {
    const { request } = serialized;
    this.request = request;
    this.initialize();
  }

  serialize(): Record<string, any> {
    return pick(['request'], this);
  }
}
