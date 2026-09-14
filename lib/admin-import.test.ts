import { describe, it, expect } from 'vitest';
import { validateWorkspaceExport } from './admin-import';

const good = {
  organizations: [{ id: 'o1', name: 'Acme', code: 'ACME', plan: 'Team' }],
  workspaces: [{ id: 'w1', organizationId: 'o1', name: 'WS', description: '' }],
  projects: [{ id: 'p1', name: 'P' }],
  decisionLogs: [{ id: 'd1', decision: 'x', date: '2026-01-01' }],
  aiProviders: [{ id: 'a1', name: 'Gem', provider: 'Google Gemini', model: 'm', apiKey: 'SECRET-MUST-DROP' }],
  techStacks: [{ id: 's1' }],
};

describe('validateWorkspaceExport', () => {
  it('rejects non-objects and non-array sections', () => {
    expect(validateWorkspaceExport(null).ok).toBe(false);
    expect(validateWorkspaceExport({ organizations: 'nope' }).ok).toBe(false);
  });

  it('requires string ids on every row', () => {
    expect(validateWorkspaceExport({ organizations: [{ name: 'NoId' }] })).toEqual({
      ok: false, error: '"organizations[0].id" is required (string).',
    });
  });

  it('accepts a full export and strips apiKey from providers', () => {
    const res = validateWorkspaceExport(good);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.organizations).toHaveLength(1);
    expect(res.value.catalog).toEqual([{ key: 'techStacks', value: [{ id: 's1' }] }]);
    expect('apiKey' in res.value.providers[0]).toBe(false);
  });

  it('accepts empty object (nothing to import)', () => {
    const res = validateWorkspaceExport({});
    expect(res).toEqual({
      ok: true,
      value: { organizations: [], workspaces: [], projects: [], decisionLogs: [], providers: [], catalog: [] },
    });
  });
});
