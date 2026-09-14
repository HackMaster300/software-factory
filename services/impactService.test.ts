import { describe, it, expect } from 'vitest';
import { ImpactService } from './impactService';

// ImpactService is a pure canned-copy generator (no state, no storage) — a light
// smoke test on its branching is enough, per GOING_HOME_REPORT.md's Phase 6 note.
describe('ImpactService.analyzeDatabaseChange', () => {
  it('returns no impacts when the provider does not actually change', () => {
    expect(ImpactService.analyzeDatabaseChange('PostgreSQL', 'PostgreSQL')).toEqual([]);
  });

  it('returns a non-empty, well-formed impact list mentioning both providers when the provider changes', () => {
    const impacts = ImpactService.analyzeDatabaseChange('SQL Server', 'PostgreSQL');
    expect(impacts.length).toBeGreaterThan(0);
    for (const impact of impacts) {
      expect(impact.type).toBeTruthy();
      expect(impact.name).toBeTruthy();
      expect(impact.action).toBeTruthy();
      expect(impact.detail).toBeTruthy();
    }
    expect(impacts.some((i) => i.detail.includes('PostgreSQL'))).toBe(true);
  });

  it('mentions the correct package swap direction for the reverse change', () => {
    const toSqlServer = ImpactService.analyzeDatabaseChange('PostgreSQL', 'SQL Server');
    const pkgImpact = toSqlServer.find((i) => i.name === 'Infrastructure.csproj');
    expect(pkgImpact?.detail).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
    expect(pkgImpact?.detail).toContain('Microsoft.EntityFrameworkCore.SqlServer');
  });
});

describe('ImpactService.analyzeFeatureToggle', () => {
  it('returns Docker-specific impacts when the feature name mentions docker', () => {
    const impacts = ImpactService.analyzeFeatureToggle('Docker Support', true);
    expect(impacts.some((i) => i.name.includes('Dockerfile'))).toBe(true);
    expect(impacts.every((i) => i.action === 'Added' || i.action === 'Modified')).toBe(true);
  });

  it('marks Docker impacts as Removed when deactivating', () => {
    const impacts = ImpactService.analyzeFeatureToggle('Docker Support', false);
    const dockerfileImpact = impacts.find((i) => i.name.includes('Dockerfile'));
    expect(dockerfileImpact?.action).toBe('Removed');
  });

  it('returns an honest empty list for a non-Docker feature name (no computable diff)', () => {
    const impacts = ImpactService.analyzeFeatureToggle('JWT Authentication', true);
    expect(impacts).toEqual([]);
  });
});
