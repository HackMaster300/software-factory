import { describe, it, expect, beforeEach } from 'vitest';
import { featureManifestRepository } from './featureManifest.repository';
import type { FeatureManifest } from '../../types/factory';

const sampleFeature: FeatureManifest = {
  id: 'feat-repo-test-1',
  name: 'Repo Test Feature',
  description: 'A feature manifest used only in repository unit tests.',
  category: 'Testing',
  tags: [],
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

describe('featureManifestRepository (LocalStorageFeatureManifestRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded feature manifest library by default', () => {
    expect(featureManifestRepository.getFeatureManifests().length).toBeGreaterThan(0);
  });

  it('round-trips a custom feature manifest appended to the library', () => {
    const existing = featureManifestRepository.getFeatureManifests();
    featureManifestRepository.saveFeatureManifests([...existing, sampleFeature]);
    const loaded = featureManifestRepository.getFeatureManifests();
    expect(loaded.find((f) => f.id === sampleFeature.id)).toEqual(sampleFeature);
  });

  it('supports deleting a custom feature manifest by filtering and re-saving', () => {
    const existing = featureManifestRepository.getFeatureManifests();
    featureManifestRepository.saveFeatureManifests([...existing, sampleFeature]);
    featureManifestRepository.saveFeatureManifests(
      featureManifestRepository.getFeatureManifests().filter((f) => f.id !== sampleFeature.id)
    );
    expect(featureManifestRepository.getFeatureManifests().find((f) => f.id === sampleFeature.id)).toBeUndefined();
  });
});
