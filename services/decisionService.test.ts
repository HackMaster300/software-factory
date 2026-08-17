import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionService } from './decisionService';

describe('DecisionService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty (PLAN.md Phase 1: no invented seed data)', () => {
    expect(DecisionService.getDecisionLogs()).toEqual([]);
  });

  it('addDecisionLog assigns an id and date and prepends the log to the list', () => {
    const created = DecisionService.addDecisionLog({
      projectId: 'proj-1',
      decision: 'Adopted PostgreSQL over SQL Server',
      reason: 'Lower licensing cost.',
      impact: 'Infrastructure',
      warningsIgnored: [],
      aiRecommendations: [],
      userJustification: 'Team already runs Postgres in staging.',
      author: 'Test Author',
    });

    expect(created.id).toBeTruthy();
    expect(created.date).toBeTruthy();

    const all = DecisionService.getDecisionLogs();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('filters decision logs by projectId when provided', () => {
    DecisionService.addDecisionLog({
      projectId: 'proj-1',
      decision: 'Decision for proj-1',
      reason: '',
      impact: 'Infrastructure',
      warningsIgnored: [],
      aiRecommendations: [],
      userJustification: '',
      author: 'Test Author',
    });
    DecisionService.addDecisionLog({
      projectId: 'proj-2',
      decision: 'Decision for proj-2',
      reason: '',
      impact: 'Infrastructure',
      warningsIgnored: [],
      aiRecommendations: [],
      userJustification: '',
      author: 'Test Author',
    });

    expect(DecisionService.getDecisionLogs('proj-1')).toHaveLength(1);
    expect(DecisionService.getDecisionLogs('proj-1')[0].decision).toBe('Decision for proj-1');
    expect(DecisionService.getDecisionLogs()).toHaveLength(2);
  });
});
