import { describe, it, expect, beforeEach } from 'vitest';
import { projectRepository } from './project.repository';
import type { Project } from '../../types/factory';

const sampleProject: Project = {
  id: 'proj-test-1',
  name: 'Test Project',
  slug: 'test-project',
  description: 'A project used in tests',
  organizationId: 'org-1',
  workspaceId: 'ws-1',
  templateId: 'tmpl-1',
  blueprint: {
    id: 'bp-1',
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
  status: 'draft',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  customConfig: {},
};

describe('projectRepository (LocalStorageProjectRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips projects through localStorage', () => {
    projectRepository.saveProjects([sampleProject]);
    const loaded = projectRepository.getProjects();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('proj-test-1');
  });

  it('starts genuinely empty when nothing has been saved yet (PLAN.md Phase 1: no invented seed data)', () => {
    const loaded = projectRepository.getProjects();
    expect(loaded).toEqual([]);
  });
});
