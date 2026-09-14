import { describe, it, expect, beforeEach } from 'vitest';
import { AdvisorService } from './advisorService';
import type { Blueprint } from '../types/factory';

const baseBlueprint: Blueprint = {
  id: 'bp-advisor-test',
  name: 'Advisor Test Blueprint',
  description: '',
  architectureStyle: 'CleanArchitecture',
  techStackId: 'stack-dotnet9',
  projects: [],
  featureIds: [],
  disabledAutoFeatures: [],
  ruleSetId: 'ruleset-clean-arch',
  profiles: {
    securityProfileId: 'sec-prof-jwt',
    databaseProfileId: 'db-prof-pg',
    dockerProfileId: 'docker-prof-prod',
    cacheProfileId: 'cache-prof-redis',
    loggingProfileId: 'log-prof-opentelemetry',
  },
};

describe('AdvisorService.calculateScores', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('never returns a score outside 0-100 for any dimension', () => {
    const heavilyFeatured: Blueprint = {
      ...baseBlueprint,
      featureIds: ['feat-docker', 'feat-jwt-auth', 'feat-secrets', 'feat-redis-cache', 'feat-mediatr-cqrs', 'feat-fluent-validation'],
    };
    const scores = AdvisorService.calculateScores(heavilyFeatured);
    for (const key of ['securityScore', 'architectureScore', 'performanceScore', 'scalabilityScore', 'maintainabilityScore', 'complexityScore', 'qualityScore'] as const) {
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
    }
  });

  it('does not saturate every dimension to 100 just because many well-scored features are active (regression: scores must reflect real configuration, not always read 100%)', () => {
    const heavilyFeatured: Blueprint = {
      ...baseBlueprint,
      featureIds: ['feat-docker', 'feat-jwt-auth', 'feat-secrets', 'feat-redis-cache', 'feat-mediatr-cqrs', 'feat-fluent-validation'],
    };
    const scores = AdvisorService.calculateScores(heavilyFeatured);
    const dimensions = [scores.securityScore, scores.architectureScore, scores.performanceScore, scores.scalabilityScore, scores.maintainabilityScore];
    expect(dimensions.some((s) => s < 100)).toBe(true);
  });

  it('produces a higher security score for a blueprint with more security-positive features than one with none', () => {
    const noFeatures: Blueprint = { ...baseBlueprint, featureIds: [] };
    const withSecurityFeatures: Blueprint = { ...baseBlueprint, featureIds: ['feat-jwt-auth', 'feat-secrets', 'feat-fluent-validation'] };

    const scoresWithout = AdvisorService.calculateScores(noFeatures);
    const scoresWith = AdvisorService.calculateScores(withSecurityFeatures);

    expect(scoresWith.securityScore).toBeGreaterThan(scoresWithout.securityScore);
  });

  it('produces a higher performance score when Redis caching is present (traceable checklist, not language stereotype)', () => {
    const withoutRedis: Blueprint = { ...baseBlueprint, featureIds: ['feat-docker'] };
    const withRedis: Blueprint = { ...baseBlueprint, featureIds: ['feat-docker', 'feat-redis-cache'] };

    expect(AdvisorService.calculateScores(withRedis).performanceScore).toBeGreaterThan(
      AdvisorService.calculateScores(withoutRedis).performanceScore
    );
  });

  it('produces higher complexity for Microservices than CleanArchitecture with the same modules (structural, documented)', () => {
    // Complexity is a deterministic count; Microservices blueprint fixture below carries
    // more projects/references, so the count — not a vibe — must be higher.
    const clean: Blueprint = {
      ...baseBlueprint,
      architectureStyle: 'CleanArchitecture',
      projects: [{ id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' }],
      featureIds: [],
    };
    const micro: Blueprint = {
      ...baseBlueprint,
      architectureStyle: 'Microservices',
      projects: [
        { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'm', name: 'App.Messaging', type: 'Infrastructure', references: ['c'], description: '' },
        { id: 's', name: 'App.Service', type: 'API', references: ['m', 'c'], description: '' },
      ],
      featureIds: [],
    };

    expect(AdvisorService.calculateScores(micro).complexityScore).toBeGreaterThan(
      AdvisorService.calculateScores(clean).complexityScore
    );
  });

  it('applies a real penalty when a recommended feature is explicitly disabled', () => {
    const withDefaults: Blueprint = { ...baseBlueprint, featureIds: ['feat-docker'], disabledAutoFeatures: [] };
    const withDisabled: Blueprint = { ...baseBlueprint, featureIds: ['feat-docker'], disabledAutoFeatures: ['feat-env-vars'] };

    const scoresDefault = AdvisorService.calculateScores(withDefaults);
    const scoresDisabled = AdvisorService.calculateScores(withDisabled);

    expect(scoresDisabled.securityScore).toBeLessThan(scoresDefault.securityScore);
  });

  it('traces every validation penalty to a real code/ruleId in the rationale (Phase 11 regression)', () => {
    const violating: Blueprint = { ...baseBlueprint, featureIds: ['feat-docker'], disabledAutoFeatures: ['feat-healthchecks'] };
    const scores = AdvisorService.calculateScores(violating);
    const arch = scores.rationale.find((r) => r.category === 'Architecture Score');
    const scal = scores.rationale.find((r) => r.category === 'Scalability Score');
    const combined = `${arch?.reason || ''} • ${scal?.reason || ''}`;
    // rule-6 docker-without-healthchecks must appear with its real code, not a vague warning.
    expect(combined).toContain('rule-6');
    expect(combined).toContain('DEP_RULE_006');
  });
});
