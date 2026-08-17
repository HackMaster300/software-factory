import { describe, it, expect, beforeEach } from 'vitest';
import { templateRepository } from './template.repository';
import type { Template } from '../../types/factory';

const sampleTemplate: Template = {
  id: 'tmpl-test-1',
  name: 'Test Template',
  description: 'A template used only in unit tests.',
  category: 'Testing',
  blueprint: {
    id: 'bp-tmpl-test',
    name: 'Test Blueprint',
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
  },
  version: '1.0.0',
  author: 'Test Author',
  updatedAt: '2026-01-01',
  tags: [],
  isOfficial: false,
  downloadCount: 0,
};

describe('templateRepository (LocalStorageTemplateRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded template catalog by default', () => {
    expect(templateRepository.getTemplates().length).toBeGreaterThan(0);
  });

  it('round-trips a custom template appended to the catalog', () => {
    const existing = templateRepository.getTemplates();
    templateRepository.saveTemplates([...existing, sampleTemplate]);
    const loaded = templateRepository.getTemplates();
    expect(loaded.find((t) => t.id === sampleTemplate.id)).toEqual(sampleTemplate);
  });

  it('supports deleting a custom template by filtering and re-saving', () => {
    const existing = templateRepository.getTemplates();
    templateRepository.saveTemplates([...existing, sampleTemplate]);
    templateRepository.saveTemplates(
      templateRepository.getTemplates().filter((t) => t.id !== sampleTemplate.id)
    );
    expect(templateRepository.getTemplates().find((t) => t.id === sampleTemplate.id)).toBeUndefined();
  });
});
