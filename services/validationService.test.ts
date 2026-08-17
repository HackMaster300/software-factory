import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from './validationService';
import type { Blueprint } from '../types/factory';

const baseBlueprint: Blueprint = {
  id: 'bp-validation-test',
  name: 'Validation Test Blueprint',
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

describe('ValidationService.validateBlueprint', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns a single ALL_PASSING info message for a clean, fully-compliant blueprint', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      featureIds: ['feat-docker', 'feat-healthchecks', 'feat-postgres-ef'],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0].code).toBe('ALL_PASSING');
    expect(messages[0].type).toBe('info');
  });

  it('flags a Clean Architecture boundary violation when Core references Infrastructure', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      projects: [
        { id: 'core', name: 'App.Core', type: 'Core', references: ['infra'], description: '' },
        { id: 'infra', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '' },
      ],
    });
    expect(messages.some((m) => m.code === 'ARCH_RULE_001' && m.type === 'error')).toBe(true);
  });

  it('does not flag a boundary violation when Core has no reference to Infrastructure', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      projects: [
        { id: 'core', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'infra', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '' },
      ],
    });
    expect(messages.some((m) => m.code === 'ARCH_RULE_001')).toBe(false);
  });

  it('requires Health Checks whenever Docker is active (Smart Dependencies auto-activates it by default, so this explicitly disables it to prove the rule fires)', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      featureIds: ['feat-docker'],
      disabledAutoFeatures: ['feat-healthchecks'],
    });
    expect(messages.some((m) => m.code === 'DEP_RULE_006' && m.type === 'error')).toBe(true);
  });

  it('does not require Health Checks when Docker is not active', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      featureIds: [],
    });
    expect(messages.some((m) => m.code === 'DEP_RULE_006')).toBe(false);
  });

  it('warns when a Smart Dependencies recommended feature is explicitly disabled', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      featureIds: ['feat-docker', 'feat-healthchecks'],
      disabledAutoFeatures: ['feat-env-vars'],
    });
    expect(messages.some((m) => m.code === 'RECOMMENDED_FEATURE_DISABLED' && m.type === 'warning')).toBe(true);
  });

  it('warns when the Database Profile is PostgreSQL but the matching EF Core feature is not selected', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      profiles: { ...baseBlueprint.profiles, databaseProfileId: 'db-prof-pg' },
      featureIds: [],
    });
    expect(messages.some((m) => m.code === 'DB_PROVIDER_MISMATCH' && m.type === 'warning')).toBe(true);
  });

  it('does not warn about the database mismatch once the PostgreSQL EF Core feature is selected', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      profiles: { ...baseBlueprint.profiles, databaseProfileId: 'db-prof-pg' },
      featureIds: ['feat-docker', 'feat-healthchecks', 'feat-postgres-ef'],
    });
    expect(messages.some((m) => m.code === 'DB_PROVIDER_MISMATCH')).toBe(false);
  });
});
