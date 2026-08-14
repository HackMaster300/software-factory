import { describe, it, expect, beforeEach } from 'vitest';
import { RuleService } from './ruleService';

describe('RuleService.createRuleSet / deleteRuleSet (Phase 2b — Rule Set as a container)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates a brand-new, empty-of-rules Rule Set and persists it alongside the seeded one', () => {
    const before = RuleService.getRuleSets().length;
    const created = RuleService.createRuleSet('Fintech Compliance', 'Extra strict rules for payment services.');

    expect(created.rules).toEqual([]);
    expect(created.name).toBe('Fintech Compliance');

    const after = RuleService.getRuleSets();
    expect(after.length).toBe(before + 1);
    expect(after.some((rs) => rs.id === created.id)).toBe(true);
  });

  it('falls back to "Untitled Rule Set" when no name is given', () => {
    const created = RuleService.createRuleSet('   ', '');
    expect(created.name).toBe('Untitled Rule Set');
  });

  it('deletes a rule set as long as more than one remains', () => {
    const created = RuleService.createRuleSet('Temp Rule Set', '');
    const beforeCount = RuleService.getRuleSets().length;
    RuleService.deleteRuleSet(created.id);
    const after = RuleService.getRuleSets();
    expect(after.length).toBe(beforeCount - 1);
    expect(after.some((rs) => rs.id === created.id)).toBe(false);
  });

  it('refuses to delete the last remaining rule set', () => {
    // Drain down to exactly one rule set first.
    let ruleSets = RuleService.getRuleSets();
    while (ruleSets.length > 1) {
      RuleService.deleteRuleSet(ruleSets[ruleSets.length - 1].id);
      ruleSets = RuleService.getRuleSets();
    }
    const lastId = ruleSets[0].id;
    RuleService.deleteRuleSet(lastId);
    expect(RuleService.getRuleSets().map((rs) => rs.id)).toContain(lastId);
  });
});
