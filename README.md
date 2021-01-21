# Identity Agent

## Quick Start

Start a REPL like this:

```shell
yarn
yarn repl
```

Try the following commands:

### Register a DID
```js
createDID()
```

### Create a privileged agent
Creating an agent with a private key ()
```js
a = await Agent.for(Alice.did).withKey(Alice.key).build()
```

### Create a privileged agent
```js
b = await Agent.for(Bob.did).build()
```

### Sign a message
```js
jwt = await a.sign({some: 'payload'})
```

### Verify a message
```js
verifiedPayload = await b.verify(jwt)
```

### Demo resolve a verifiable presentation

Automated (i.e. with no interaction)
```js
task = a.asSubject().resolvePresentationRequest(dummyVerifiablePresentation)

// stub out the credential being retrieved for the presentation
demo.resolvePresentationRequestTaskWithDummyCredentials(task)

await task.result()
```


With user interaction

```js
// a handler mimicing a user confirming the presentation 
userAlwaysClicksOk = () => Promise.resolve()

// create a task to resolve a verifiable presentation request
dummyVerifiablePresentation = {};
task = a.asSubject().resolvePresentationRequest(dummyVerifiablePresentation)

// inject our handler into the confirmation process 
task.on(EventType.ConfirmPresentation, { handle: alwaysOK })

// stub out the credential being retrieved for the presentation
demo.resolvePresentationRequestTaskWithDummyCredentials(task)

await task.result()
```
