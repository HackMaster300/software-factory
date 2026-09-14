import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateService } from './templateService';
import type { Template, Blueprint } from '../types/factory';

const sampleTemplate: Template = {
  id: 'tmpl-service-test-1',
  name: 'Service Test Template',
  description: 'A template used only in TemplateService unit tests.',
  category: 'Testing',
  blueprint: {
    id: 'bp-tmpl-service-test',
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

describe('TemplateService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the seeded template catalog by default', () => {
    expect(TemplateService.getTemplates().length).toBeGreaterThan(0);
  });

  it('getTemplateById finds an existing template and returns undefined for an unknown id', () => {
    const existing = TemplateService.getTemplates()[0];
    expect(TemplateService.getTemplateById(existing.id)).toEqual(existing);
    expect(TemplateService.getTemplateById('does-not-exist')).toBeUndefined();
  });

  it('saveTemplate appends a brand-new template', () => {
    const before = TemplateService.getTemplates().length;
    TemplateService.saveTemplate(sampleTemplate);
    expect(TemplateService.getTemplates()).toHaveLength(before + 1);
    expect(TemplateService.getTemplateById(sampleTemplate.id)).toEqual(sampleTemplate);
  });

  it('saveTemplate updates an existing template in place rather than duplicating it', () => {
    TemplateService.saveTemplate(sampleTemplate);
    const updated = { ...sampleTemplate, name: 'Renamed Template' };
    TemplateService.saveTemplate(updated);

    const all = TemplateService.getTemplates();
    expect(all.filter((t) => t.id === sampleTemplate.id)).toHaveLength(1);
    expect(TemplateService.getTemplateById(sampleTemplate.id)?.name).toBe('Renamed Template');
  });

  it('updateTemplateBlueprint replaces the blueprint and bumps updatedAt', () => {
    const originalUpdatedAt = sampleTemplate.updatedAt;
    TemplateService.saveTemplate(sampleTemplate);
    const newBlueprint: Blueprint = { ...sampleTemplate.blueprint, name: 'Swapped Blueprint' };

    TemplateService.updateTemplateBlueprint(sampleTemplate.id, newBlueprint);

    const updated = TemplateService.getTemplateById(sampleTemplate.id);
    expect(updated?.blueprint.name).toBe('Swapped Blueprint');
    expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('updateTemplateBlueprint is a no-op for an unknown template id', () => {
    const before = TemplateService.getTemplates();
    TemplateService.updateTemplateBlueprint('does-not-exist', sampleTemplate.blueprint);
    expect(TemplateService.getTemplates()).toEqual(before);
  });
});

describe('TemplateService versioning (Phase 12)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TemplateService.saveTemplate(sampleTemplate);
  });

  it('bumpVersion follows semver per level and rejects garbage honestly', () => {
    expect(TemplateService.bumpVersion('2.4.0', 'patch')).toBe('2.4.1');
    expect(TemplateService.bumpVersion('2.4.0', 'minor')).toBe('2.5.0');
    expect(TemplateService.bumpVersion('2.4.0', 'major')).toBe('3.0.0');
    expect(() => TemplateService.bumpVersion('not-a-version', 'patch')).toThrow('Invalid semver');
  });

  it('createNewVersion preserves the original and snapshots the blueprint', () => {
    const v2 = TemplateService.createNewVersion(sampleTemplate.id, 'minor', 'Added worker docs');

    expect(v2.id).toBe(`${sampleTemplate.id}-v1.1.0`);
    expect(v2.version).toBe('1.1.0');
    expect(v2.description).toContain('Added worker docs');
    expect(TemplateService.getTemplateById(sampleTemplate.id)?.version).toBe('1.0.0');
    // Snapshot: mutating the clone must not leak into v1.
    v2.blueprint.featureIds.push('feat-docker');
    TemplateService.saveTemplate(v2);
    expect(TemplateService.getTemplateById(sampleTemplate.id)?.blueprint.featureIds).not.toContain('feat-docker');
  });

  it('createNewVersion throws honestly for unknown templates', () => {
    expect(() => TemplateService.createNewVersion('missing', 'patch')).toThrow('not found');
  });

  it('getVersionHistory returns the line ordered ascending by semver', () => {
    TemplateService.createNewVersion(sampleTemplate.id, 'major');
    TemplateService.createNewVersion(sampleTemplate.id, 'patch');
    const history = TemplateService.getVersionHistory(`${sampleTemplate.id}-v2.0.0`);
    expect(history.map((t) => t.version)).toEqual(['1.0.0', '1.0.1', '2.0.0']);
  });

  it('diffBlueprints reports real changes and [] when identical', () => {
    const a = sampleTemplate.blueprint;
    const b: Blueprint = {
      ...a,
      techStackId: 'stack-node-nestjs',
      architectureStyle: 'Microservices',
      featureIds: ['feat-docker'],
      projects: [{ id: 'x', name: 'App.Extra', type: 'Worker', references: [], description: '' }],
    };
    const changes = TemplateService.diffBlueprints(a, b);
    const kinds = changes.map((c) => c.kind);
    expect(kinds).toContain('project-added');
    expect(kinds).toContain('feature-added');
    expect(kinds).toContain('stack-changed');
    expect(kinds).toContain('style-changed');
    expect(TemplateService.diffBlueprints(a, { ...a })).toEqual([]);
  });

  it('previewMigration never saves and preserves customConfig keys', () => {
    const v2 = TemplateService.createNewVersion(sampleTemplate.id, 'minor');
    const before = TemplateService.getTemplates().length;
    const preview = TemplateService.previewMigration(
      sampleTemplate.blueprint,
      { deployRegion: 'eu-west', replicas: 3 },
      v2.id
    );
    expect(TemplateService.getTemplates()).toHaveLength(before);
    expect(preview.preservedCustomConfigKeys).toEqual(['deployRegion', 'replicas']);
    expect(preview.blueprint.id).toBe(v2.blueprint.id);
  });
});
