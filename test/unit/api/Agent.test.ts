import { Agent } from '@/api/Agent';
import { example as did } from '../../fixtures/did';

describe('Agent', () => {
  describe('AgentBuilder', () => {
    it('should create an agent with no key', async () => {
      const agent = await Agent.for(did).build();
      expect(agent.document.id).toEqual(did);
    });
  });
});
