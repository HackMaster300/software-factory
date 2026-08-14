import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureService } from './featureService';
import { featureManifestRepository } from './repositories';
import type { Blueprint, FeatureManifest } from '../types/factory';

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

describe('FeatureService.saveFeature (Phase 2b — Feature Manifest create/edit builder)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const customFeature: FeatureManifest = {
    id: 'feat-custom-test',
    name: 'Custom Test Feature',
    description: 'A feature manifest created for test coverage.',
    category: 'Testing',
    tags: ['custom'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: {},
    generatedFiles: [],
    generatedPackages: [],
    generatedProjects: [],
    documentation: '',
    aiRecommendations: [],
    securityWarnings: [],
    architectureImpact: '',
    performanceImpact: '',
    maintainabilityImpact: '',
    bestPractices: [],
    impactScores: { security: 0, architecture: 0, performance: 0, scalability: 0, maintainability: 0, complexity: 0 },
  };

  it('appends a brand-new feature manifest to the catalog', () => {
    const before = FeatureService.getAllFeatures().length;
    FeatureService.saveFeature(customFeature);
    const after = FeatureService.getAllFeatures();
    expect(after.length).toBe(before + 1);
    expect(FeatureService.getFeatureById('feat-custom-test')).toEqual(customFeature);
  });

  it('updates an existing feature manifest in place rather than duplicating it', () => {
    FeatureService.saveFeature(customFeature);
    const updated = { ...customFeature, name: 'Renamed Feature' };
    FeatureService.saveFeature(updated);

    const all = FeatureService.getAllFeatures();
    expect(all.filter((f) => f.id === 'feat-custom-test')).toHaveLength(1);
    expect(FeatureService.getFeatureById('feat-custom-test')?.name).toBe('Renamed Feature');
  });

  it('supports deleting a feature manifest by filtering and re-saving', () => {
    FeatureService.saveFeature(customFeature);
    featureManifestRepository.saveFeatureManifests(
      FeatureService.getAllFeatures().filter((f) => f.id !== 'feat-custom-test')
    );
    expect(FeatureService.getFeatureById('feat-custom-test')).toBeUndefined();
  });
});
