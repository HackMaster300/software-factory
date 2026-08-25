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

  it('duplicates a rule set including all of its rules, under fresh ids for both', () => {
    const source = RuleService.getRuleSets()[0];
    expect(source.rules.length).toBeGreaterThan(0);

    const copy = RuleService.duplicateRuleSet(source.id);

    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(source.id);
    expect(copy!.name).toBe(`${source.name} (Copy)`);
    expect(copy!.rules).toHaveLength(source.rules.length);
    expect(copy!.rules.map((r) => r.id)).not.toEqual(source.rules.map((r) => r.id));
    expect(copy!.rules.map((r) => r.name)).toEqual(source.rules.map((r) => r.name));

    const persisted = RuleService.getRuleSets();
    expect(persisted.some((rs) => rs.id === copy!.id)).toBe(true);
    // Editing the copy's rules must never mutate the source set's rules (distinct objects).
    expect(persisted.find((rs) => rs.id === source.id)!.rules).toEqual(source.rules);
  });

  it('returns undefined when duplicating a non-existent rule set id', () => {
    expect(RuleService.duplicateRuleSet('does-not-exist')).toBeUndefined();
  });

  it('restores a previously deleted rule set as-is, for the Undo-delete toast', () => {
    const deleted = RuleService.getRuleSets()[0];
    RuleService.createRuleSet('Keeps at least one other set alive', '');
    RuleService.deleteRuleSet(deleted.id);
    expect(RuleService.getRuleSets().some((rs) => rs.id === deleted.id)).toBe(false);

    RuleService.restoreRuleSet(deleted);

    const restored = RuleService.getRuleSets().find((rs) => rs.id === deleted.id);
    expect(restored).toEqual(deleted);
  });
});
