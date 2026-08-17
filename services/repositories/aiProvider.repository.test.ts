import { describe, it, expect, beforeEach } from 'vitest';
import { aiProviderRepository } from './aiProvider.repository';
import type { AIProviderConfig } from '../../types/factory';

const sampleProvider: AIProviderConfig = {
  id: 'ai-prov-test-1',
  name: 'Test Provider',
  model: 'test-model',
  provider: 'OpenAI',
  status: 'configured',
  costPer1k: '$0.00',
  latency: '0ms',
  apiKey: 'sk-test-key',
  isActiveDefault: false,
};

describe('aiProviderRepository (LocalStorageAIProviderRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded provider catalog by default', () => {
    expect(aiProviderRepository.getAIProviders().length).toBeGreaterThan(0);
  });

  it('round-trips a custom provider (including apiKey/isActiveDefault, Phase 3 bring-your-own-key fields) appended to the catalog', () => {
    const existing = aiProviderRepository.getAIProviders();
    aiProviderRepository.saveAIProviders([...existing, sampleProvider]);
    const loaded = aiProviderRepository.getAIProviders();
    expect(loaded.find((p) => p.id === sampleProvider.id)).toEqual(sampleProvider);
  });

  it('persists which provider is marked isActiveDefault across a save/get cycle', () => {
    const existing = aiProviderRepository.getAIProviders();
    const updated = existing.map((p, i) => ({ ...p, isActiveDefault: i === 0 }));
    aiProviderRepository.saveAIProviders(updated);
    const loaded = aiProviderRepository.getAIProviders();
    expect(loaded.filter((p) => p.isActiveDefault)).toHaveLength(1);
    expect(loaded[0].isActiveDefault).toBe(true);
  });

  it('supports deleting a custom provider by filtering and re-saving', () => {
    const existing = aiProviderRepository.getAIProviders();
    aiProviderRepository.saveAIProviders([...existing, sampleProvider]);
    aiProviderRepository.saveAIProviders(
      aiProviderRepository.getAIProviders().filter((p) => p.id !== sampleProvider.id)
    );
    expect(aiProviderRepository.getAIProviders().find((p) => p.id === sampleProvider.id)).toBeUndefined();
  });
});
