import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureService } from './featureService';
import type { Blueprint } from '../types/factory';

const baseBlueprint: Blueprint = {
  id: 'bp-test',
  name: 'Test Blueprint',
  description: '',
  architectureStyle: 'CleanArchitecture',
  techStackId: 'stack-dotnet9',
  projects: [],
  featureIds: ['feat-docker'],
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

describe('FeatureService.resolveBlueprintFeatures (Smart Dependencies)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('auto-activates the recommended dependencies of an active feature', () => {
    const { activeFeatureIds, autoActivatedFeatures } = FeatureService.resolveBlueprintFeatures(baseBlueprint);

    // feat-docker's seeded recommendedDependencies include feat-env-vars, feat-healthchecks, feat-docker-compose
    expect(activeFeatureIds).toContain('feat-env-vars');
    expect(activeFeatureIds).toContain('feat-healthchecks');
    expect(autoActivatedFeatures.some((f) => f.id === 'feat-env-vars')).toBe(true);
  });

  it('respects a user-disabled recommended feature instead of forcing it back on', () => {
    const blueprintWithDisabled: Blueprint = {
      ...baseBlueprint,
      disabledAutoFeatures: ['feat-env-vars'],
    };

    const { activeFeatureIds, disabledRecommendedFeatures } = FeatureService.resolveBlueprintFeatures(blueprintWithDisabled);

    expect(activeFeatureIds).not.toContain('feat-env-vars');
    expect(disabledRecommendedFeatures.some((f) => f.id === 'feat-env-vars')).toBe(true);
  });
});
