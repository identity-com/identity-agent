require('dotenv').config()
const identityAgent = require('./dist/');


const { demo: { createIdentity, resolveDID, ...demoRest }, ...identityAgentRest } = identityAgent;

const Alice = createIdentity()
const Bob = createIdentity()

module.exports = {
  enableAwait: true,
  context: { Alice, Bob, createIdentity, resolveDID, demo: demoRest, ...identityAgentRest },
  prompt: 'Identity $ '
}
