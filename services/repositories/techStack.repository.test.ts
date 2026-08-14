import { describe, it, expect, beforeEach } from 'vitest';
import { techStackRepository } from './techStack.repository';
import type { TechStack } from '../../types/factory';

const sampleStack: TechStack = {
  id: 'stack-test-1',
  name: 'Test Stack',
  language: 'typescript',
  framework: 'Test Framework',
  packageManager: 'npm',
  testingFramework: 'vitest',
  targetRuntime: 'Node.js',
  description: 'A stack used only in tests.',
};

describe('techStackRepository (LocalStorageTechStackRepository) — Phase 2b save support', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded catalog by default', () => {
    expect(techStackRepository.getTechStacks().length).toBeGreaterThan(0);
  });

  it('round-trips a custom tech stack appended to the catalog', () => {
    const existing = techStackRepository.getTechStacks();
    techStackRepository.saveTechStacks([...existing, sampleStack]);
    const loaded = techStackRepository.getTechStacks();
    expect(loaded.find((s) => s.id === sampleStack.id)).toEqual(sampleStack);
  });

  it('supports deleting a custom tech stack by filtering and re-saving', () => {
    const existing = techStackRepository.getTechStacks();
    techStackRepository.saveTechStacks([...existing, sampleStack]);
    techStackRepository.saveTechStacks(
      techStackRepository.getTechStacks().filter((s) => s.id !== sampleStack.id)
    );
    expect(techStackRepository.getTechStacks().find((s) => s.id === sampleStack.id)).toBeUndefined();
  });
});
