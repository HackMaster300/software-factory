import { describe, it, expect, beforeEach } from 'vitest';
import { ruleSetRepository } from './ruleSet.repository';
import type { RuleSet } from '../../types/factory';

const sampleRuleSet: RuleSet = {
  id: 'ruleset-test-1',
  name: 'Test Rule Set',
  description: 'A rule set used only in unit tests.',
  rules: [],
};

describe('ruleSetRepository (LocalStorageRuleSetRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded catalog by default', () => {
    expect(ruleSetRepository.getRuleSets().length).toBeGreaterThan(0);
  });

  it('round-trips a custom rule set appended to the catalog', () => {
    const existing = ruleSetRepository.getRuleSets();
    ruleSetRepository.saveRuleSets([...existing, sampleRuleSet]);
    const loaded = ruleSetRepository.getRuleSets();
    expect(loaded.find((rs) => rs.id === sampleRuleSet.id)).toEqual(sampleRuleSet);
  });

  it('supports deleting a custom rule set by filtering and re-saving', () => {
    const existing = ruleSetRepository.getRuleSets();
    ruleSetRepository.saveRuleSets([...existing, sampleRuleSet]);
    ruleSetRepository.saveRuleSets(
      ruleSetRepository.getRuleSets().filter((rs) => rs.id !== sampleRuleSet.id)
    );
    expect(ruleSetRepository.getRuleSets().find((rs) => rs.id === sampleRuleSet.id)).toBeUndefined();
  });
});
