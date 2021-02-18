# Identity Agent

The Identity Agent is a Self-Sovereign Identity agent based on [DIDs](https://www.w3.org/TR/did-core/Overview.html).

The Agent is capable of communicating with other DID-based agents using end-to-end encryption,
as well as requesting and resolving [Verifiable Credentials](https://www.w3.org/TR/vc-data-model).

The Agent can be run via the command line, in the browser or on a remote server, and is
designed to be extensible to support various use-cases and environments.

## Quick Start

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
createDID()
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
