import { describe, it, expect, beforeEach } from 'vitest';
import { decisionLogRepository } from './decisionLog.repository';
import type { DecisionLogItem } from '../../types/factory';

const sampleLog: DecisionLogItem = {
  id: 'dec-test-1',
  projectId: 'proj-1',
  decision: 'Adopted PostgreSQL over SQL Server',
  date: '2026-01-01 10:00',
  reason: 'Lower licensing cost and native JSONB support.',
  impact: 'Infrastructure',
  warningsIgnored: [],
  aiRecommendations: [],
  userJustification: 'Team already runs Postgres in staging.',
  author: 'Test Author',
};

describe('decisionLogRepository (LocalStorageDecisionLogRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty when nothing has been saved yet (PLAN.md Phase 1: no invented seed data)', () => {
    expect(decisionLogRepository.getDecisionLogs()).toEqual([]);
  });

  it('round-trips decision logs through localStorage', () => {
    decisionLogRepository.saveDecisionLogs([sampleLog]);
    const loaded = decisionLogRepository.getDecisionLogs();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sampleLog);
  });

  it('supports deleting a decision log by filtering and re-saving', () => {
    decisionLogRepository.saveDecisionLogs([sampleLog]);
    decisionLogRepository.saveDecisionLogs(
      decisionLogRepository.getDecisionLogs().filter((l) => l.id !== sampleLog.id)
    );
    expect(decisionLogRepository.getDecisionLogs()).toEqual([]);
  });
});
