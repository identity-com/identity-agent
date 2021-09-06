import { DIDDocument } from 'did-resolver';
import { DID } from './DID';
import { Subject, DefaultAgent, Verifier } from '@/api/internal';
import { AsymmetricKey, JWT } from '@/service/crypto/CryptoModule';
import { JWE, JWTVerified } from 'did-jwt';
import { TaskContext, TaskMaster } from '@/service/task/TaskMaster';
import { Response, Transport } from '@/service/transport/Transport';
import nacl from 'tweetnacl';
import { DeepPartial } from '@/lib/util';
import { MicrowaveState } from '@/service/task/cqrs/microwave/MicrowaveFlow';
import { AgentStorage } from '@/service/storage/AgentStorage';

/**
 * Optional configuration for agents.
 */
export type Config = {
  // include this only while we keep an S3Cache DID resolver
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;

  // used when registering new DIDs only
  hubBaseUrl?: string;

  // location of a remote DID resolver, following the uniresolver.io interface
  resolverUrl?: string;
};

/**
 * A 'shorthand' datatype used when instantiating an agent.
 * Typically an agent is instantiated via a DID only, and,
 * if it is a privileged agent, it is then granted keys with
 * Builder.withKeys().
 *
 * The Identity type allows both operations at once, for convenience
 * especially when using the REPL.
 */
export type Identity = {
  did: DID;
  signingKey: AsymmetricKey;
  encryptionKey: nacl.BoxKeyPair;
};

/**
 * The base type for an agent. Although this is an abstract class,
 * it is essentially an interface - the only logic is in the static
 * Agent.for() and Agent.register() functions that create builders.
 *
 *
 * Create an agent using:
 * ```
 * await Agent.for(did).build()
 * ```
 *
 * For more examples and details, see README.md
 */
export abstract class Agent {
  /**
   * The decentralised identifier of the agent instance.
   * The only thing an Agent absolutely needs is a DID.
   */
  abstract did: DID;

  /**
   * The Document obtained when resolving the agent's DID.
   * This is fetched when the agent is built, and cached in its storage.
   */
  abstract document: DIDDocument;

  /**
   * The coordinator for all agent tasks. See ARCHITECTURE.md for a description
   * of tasks.
   */
  abstract taskMaster: TaskMaster;

  /**
   * The storage module for an agent. Task state and DID documents of all known
   * parties are stored here. Example implementations may include:
   * - local storage for browsers
   * - file storage for a command-line agent or REPL
   * - DB for a remote agent.
   *
   */
  abstract storage: AgentStorage;

  /**
   * An accessor for all the agent's active tasks. This is available for
   * convenience only. In general, tasks should be interacted with via one
   * of the higher-level flow functions such as Subject.resolvePresentationRequest()
   */
  abstract tasks: TaskContext<any>[];

  /**
   * The transport layer for agents. This API is independent of the communication
   * mechanism.
   */
  abstract transport: Transport;

  /**
   * Given a DID, resolve its document.
   * @param did
   * @throws Error if the DID is not resolvable or the method is not recognised.
   */
  abstract resolve(did: DID): Promise<DIDDocument>;

  /**
   * Return this agent in the Subject role.
   */
  abstract asSubject(): Subject;

  /**
   * Return this agent in the Verifier role.
   */
  abstract asVerifier(): Verifier;

  /**
   * Sign an object with the agent's DID
   * @param payload
   * @return A JWT signed by the agent's DID
   * @throws An error if a non-privileged agent (i.e. an agent without keys)
   * attempts to perform this function.
   */
  abstract sign(payload?: Record<string, any>): Promise<JWT>;

  /**
   * Verify the signature of a JWT signed by a DID, and return
   * an object containing the contents of the token, and its issuer.
   * @param jwt
   */
  abstract verify(jwt: JWT): Promise<JWTVerified>;

  /**
   * Encrypt data for a recipient DID.
   * @param data
   * @param recipient
   */
  abstract encrypt(data: string, recipient: DID): Promise<JWE>;

  /**
   * Decrypt data sent to this agent's DID.
   * @param jwe
   */
  abstract decrypt(jwe: JWE): Promise<string>;

  /**
   * Send an object to a recipient DID. The default implementation of this
   * function sends the message e2e-encrypted by
   * performing the following operations:
   *
   * 1. Sign the message
   * 2. Encrypt it for the recipient
   * 3. Send it to the endpoint registered on the recipient DID document
   * at the url '<recipient DID>#messages'
   *
   * @param message
   * @param recipient
   */
  abstract send(
    message: Record<string, any>,
    recipient: DID
  ): Promise<Response>;

  /**
   * Demo only - starts a "microwave task" that completes after `delay` seconds.
   * This is used to demonstrate and test the 'resumability' of Identity Agent
   * tasks. If an agent is stopped midway through a microwave task, it should
   * be restarted again when the agent is restarted.
   *
   * Once the Task functionality has stablilised, this should be removed
   * from the API.
   * @param delay
   */
  abstract startSlowTask(delay?: number): TaskContext<MicrowaveState>;

  /**
   * Build an agent for the DID provided.
   *
   * Typically an agent is instantiated via a DID only, and,
   * if it is a privileged agent, it is then granted keys with
   * Builder.withKeys().
   *
   * Passing an  Identity type allows both operations at once, for convenience
   * especially when using the REPL.
   *
   * e.g.
   *
   * const Alice = createIdentity()
   *
   * Agent.for(Alice).build()
   *
   * @param identity A DID or an Identity object containing keys
   * @param config Optional configuration for the agent.
   */
  static for(identity: DID | Identity, config?: DeepPartial<Config>) {
    return DefaultAgent.for(identity, config);
  }

  /**
   * Create a new identity and register its DID using the default DID registry
   * @param config
   */
  static register(config?: DeepPartial<Config>) {
    return DefaultAgent.register(config);
  }
}
