import { describe, it, expect, beforeEach } from 'vitest';
import { promptTemplateRepository } from './promptTemplate.repository';
import type { PromptTemplate } from '../../types/factory';

const samplePrompt: PromptTemplate = {
  id: 'prompt-test-1',
  name: 'Test Prompt',
  role: 'System',
  category: 'Testing',
  prompt: 'You are a test prompt used only in unit tests.',
  variables: [],
  version: '1.0.0',
};

describe('promptTemplateRepository (LocalStoragePromptTemplateRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded prompt library by default', () => {
    expect(promptTemplateRepository.getPromptTemplates().length).toBeGreaterThan(0);
  });

  it('round-trips a custom prompt template appended to the library', () => {
    const existing = promptTemplateRepository.getPromptTemplates();
    promptTemplateRepository.savePromptTemplates([...existing, samplePrompt]);
    const loaded = promptTemplateRepository.getPromptTemplates();
    expect(loaded.find((p) => p.id === samplePrompt.id)).toEqual(samplePrompt);
  });

  it('supports deleting a custom prompt template by filtering and re-saving', () => {
    const existing = promptTemplateRepository.getPromptTemplates();
    promptTemplateRepository.savePromptTemplates([...existing, samplePrompt]);
    promptTemplateRepository.savePromptTemplates(
      promptTemplateRepository.getPromptTemplates().filter((p) => p.id !== samplePrompt.id)
    );
    expect(promptTemplateRepository.getPromptTemplates().find((p) => p.id === samplePrompt.id)).toBeUndefined();
  });
});
