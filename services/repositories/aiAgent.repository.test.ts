import { describe, it, expect, beforeEach } from 'vitest';
import { aiAgentRepository } from './aiAgent.repository';
import type { AIAgent } from '../../types/factory';

const sampleAgent: AIAgent = {
  id: 'agent-test-1',
  name: 'Compliance Reviewer',
  description: 'Focuses on regulatory and audit compliance concerns.',
  systemPromptStyle: 'You are a meticulous Compliance Reviewer who flags regulatory risk.',
};

describe('aiAgentRepository (LocalStorageAIAgentRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty when nothing has been saved yet', () => {
    expect(aiAgentRepository.getAIAgents()).toEqual([]);
  });

  it('round-trips custom AI agents through localStorage', () => {
    aiAgentRepository.saveAIAgents([sampleAgent]);
    const loaded = aiAgentRepository.getAIAgents();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sampleAgent);
  });

  it('supports deleting an agent by filtering and re-saving', () => {
    aiAgentRepository.saveAIAgents([sampleAgent]);
    aiAgentRepository.saveAIAgents(
      aiAgentRepository.getAIAgents().filter((a) => a.id !== sampleAgent.id)
    );
    expect(aiAgentRepository.getAIAgents()).toEqual([]);
  });
});
