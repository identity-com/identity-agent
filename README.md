# Identity Agent

The Identity Agent is a Self-Sovereign Identity agent based on [DIDs](https://www.w3.org/TR/did-core/Overview.html).

The Agent is capable of communicating with other DID-based agents using end-to-end encryption,
as well as requesting and resolving [Verifiable Credentials](https://www.w3.org/TR/vc-data-model).

The Agent can be run via the command line, in the browser or on a remote server, and is
designed to be extensible to support various use-cases and environments.

## Capabilities

- ✅ Resolve a DID to a document with a pluggable DID resolver
- ✅ Sign, encrypt, decrypt and verify a message using DIDs
- ✅ Send a message E2E encrypted using a simple decentralized 'hub' API
- ✅ Create and process long-running tasks for credential presentation

### TODO for V1   

- ⏳ Integrate with a remote DID resolver (e.g [uniresolver.io](http://uniresolver.io/))
- ⏳ A simple local credential store and presentation resolver
- ⏳ Resolve tasks on incoming messages

## Quick Start

### Running as a library

```
yarn add @identity.com/identity-agent
```

```js
const did = 'did:your-did-here'
const agent = await Agent.for(did).build()

const bob = 'did:bobs-did'
await agent.send({ message: 'hello Bob!'}, bob)
```

### Building locally

Note: Before contributing to this project, please check out the code of conduct
and contributing guidelines. Thanks!

Install

Identity-Agent uses [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/)
```shell
nvm i
yarn
```

Start a REPL like this:

```shell
yarn repl
```

## Agent creation

### Register a DID
```js
createIdentity()
```

### Create a privileged agent
Creating an agent with a private key
```js
a = await Agent.for(Alice.did).withKeys(Alice.signingKey, Alice.encryptionKey).build()

// shorter version
a = await Agent.for(Alice).build()
```

### Create a non-privileged agent
Creating an agent with no private keys (e.g. a mediator or relay)
```js
b = await Agent.for(Bob.did).build()
```

## Messages

### Send a message via HTTP
```js
message = { hello: 'Bob' }
await a.send(message, Bob.did)
```

### Sign a message
```js
jwt = await a.sign({some: 'payload'})
```

### Verify a message

```js
verifiedPayload = await b.verify(jwt)
```

## Subject operations

### Resolve a verifiable presentation

```js
presentation = {} // dummy

taskContext = a.asSubject().resolvePresentationRequest(presentation, Bob.did)

await taskContext.waitForDone()
```

## Verifier operations

### Request a verifiable presentation

```js
request = {}

taskContext = a.asVerifier().requestPresentation(request, Bob.did)

await taskContext.waitForDone()
```

## Running the example browser app

The example app must be linked to the library using yarn link.

```shell
yarn link
cd examples/browser
yarn
yarn link identity-agent
yarn start
```

## Architecture

Given the variety of identity use-cases, the Identity Agent is designed to be flexible.
However, it does have some core concepts and design patterns that are described in this
document.

### Extending the Agent

The Agent uses [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)
to allow it to be extensible by clients.

The following example shows how to inject an alternative storage module, e.g. to store
messages in a database:

```ts
import { AgentStorage } from 'identity-agent';

class MyDBStorage implements AgentStorage {
  // ...implement the interface
}

const myDBStorage = new MyDBStorage()
Agent.for(did).with<AgentStorage>(TYPES.AgentStorage, myDBStorage)
```

### Components

The following components are used by the Identity Agent:

| Module                   | Description                                                                                                   | Default                                                                                                                                                              |
|--------------------------|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| AgentStorage             | Storage interface used to store and retrieve DID documents and task state                                     | Backed by node-localstorage.<br>Stores data in localstorage when run in the browser,<br>and in a scratch folder when run via node.                                   |
| DIDResolver              | A function which resolves a DID to its document                                                               | Looks up an AWS S3 bucket, if credentials are provided,<br>otherwise uses a local in-memory cache. Note - retrieved DID<br>documents are stored in the AgentStorage. |
| CryptoModule             | Encapsulates cryptographic functions such as encrypting, decrypting and signing                               | Uses tweetnacl and the X25519 curve for encryption/decryption<br>and bitcoin-js and the Secp256k1 Bitcoin curve for signing.                                         |
| Transport                | An interface uses for communicating with other agents (including remote agents<br>controlled by the same DID) | Backed by the Http module                                                                                                                                            |
| Http                     | A Http client                                                                                                 | Backed by node-fetch (uses window.fetch on the browser)                                                                                                              |
| IssuerProxy              | A client-side proxy for credential issuers. Used by the identity agent to make<br>credential requests.        | A stub. This should be replaced by clients. An identity.com<br>IDV Toolkit proxy is under development.                                                               |
| PresentationVerification | A service that cryptographically verifies presented credentials                                               | A stub. The implementation depends on the type of credentials<br>and proofs used. An identity.com-compliant implementation is<br>under development.                  |
| Presenter                | A service that locates and presents credentials in response to a presentation<br>request                      | A stub. An identity.com-compliant implementation is<br>under development.                                                                                            |

### Tasks

Tasks are defined as:
- long-running
- resumable
- interactive
- chainable

processes.

Examples are:

- PresentationRequest: a verifier requests a presentation from a subject:
- Presentation: a subject receives a presentation request from a verifier and responds
  with a presentation of one or more credentials.
- CredentialRequest: a subject requests the issuance of a credential from
  an issuer. This usually results in a flow of information from the subject to the issuer
  as they validate the subject's identity.

#### Long-running

If a process may take longer than 1-2 seconds, it may make sense to model
it as a task. The reason for this is resumability (see below).

#### Resumable

Since agents are often used on mobile devices, browsers, or are otherwise ephemeral,
long-running tasks must be able to store and resume their own state, so that
they can continue after the agent has restarted.

For example, a credential request task may be in progress with an issuer, that is
performing background checks that may take days. Once complete, the credential
request task should be completed, resulting in a credential stored in the AgentStorage.

#### Interactive

Tasks may require input from the user or some external service. For example,
a credential request may require the user to answer questions from the
issuer, or a remote agent may require permission from the user before
presenting a credential to a verifier.

#### Chainable

Tasks may spawn or resolve other tasks. Consider thee following complicated but
plausible example.

- Potential employer E, asks candidate C for their
  university transcript (PresentationRequest Task 1)
- C does not recognise E and asks for their "Organisation Credential"
  (PresentationRequest Task 2)
- E requests an organisation credential from an issuer
  I1 capable of issuing such credentials (CredentialRequest Task 3)
- I1 issues a credential to E, resolving task 3
- E sends the credential to C, resolving task 2
- C accepts the credential, and asks their university U
  to issue them with a transcript credential (PresentationRequest Task 4)
- In order to verify they are speaking to the correct
  former student, U asks C to provide their passport
  credential (CredentialRequest Task 5)
- C scans and sends their passport document to U as a
  self-signed credential, resolving task 5.
- U accepts the self-signed credential as sufficient proof
  and issues the transcript credential, resolving task 6
- Finally, C presents the transcript credential to E, resolving task 1

#### Task Architecture

Tasks are designed using the CQRS model and Event Sourcing,
so that state can easily be stored and rehydrated
when an agent is resumed.

Tasks are therefore not directly manipulated, but are updated by executing _commands_,
which emit _events_. The task state is the composition of the payloads of each of these events.

Events can themselves trigger new commands, so the entire task can be modelled as a _flow_.

Formally a _flow_ consists of the following:

1. A State type: this defines the contents of the task. Each event payload is therefore a deep subset of this state.
2. A set of command types
3. A set of event types
4. A set of default Command Handlers that are executed when a command is triggered
5. A set of default Event Handlers that are called when an event of a particular type is added to the task.

### Roles

By default, an agent is in neutral role, i.e. it has not assumed a role in the SSI
[trust triangle](https://freecontent.manning.com/the-basic-building-blocks-of-ssi/).

In order to keep the base API simple, most actions that an agent can perform are hidden
behind the role APIs: Subject and Verifier.

To switch role, call the following functions:

```
agent.asSubject()

agent.asVerifier()
```
