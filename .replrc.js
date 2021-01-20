const identityAgent = require('./dist/');

const { demo: { createDID, resolveDID, ...demoRest }, ...identityAgentRest } = identityAgent;

const Alice = createDID()
const Bob = createDID()

module.exports = {
  enableAwait: true,
  context: { Alice, Bob, createDID, resolveDID, demo: demoRest, ...identityAgentRest },
  prompt: 'Identity $ '
}
