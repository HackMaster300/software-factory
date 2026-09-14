import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from './validationService';
import { ProjectService } from './projectService';
import { profileRepository } from './repositories/profile.repository';
import type { Blueprint } from '../types/factory';
import type { SolutionTreeNode } from './projectService';

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

  it('flags a boundary violation from a second Core project even when the first Core project is clean', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      projects: [
        { id: 'core1', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'core2', name: 'App.Domain', type: 'Core', references: ['infra'], description: '' },
        { id: 'infra', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '' },
      ],
    });
    const violations = messages.filter((m) => m.code === 'ARCH_RULE_001');
    expect(violations).toHaveLength(1);
    expect(violations[0].affectedComponent).toContain('App.Domain');
  });

  it('flags every Core→Infrastructure violation pair, not just the first', () => {
    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      projects: [
        { id: 'core1', name: 'App.Core', type: 'Core', references: ['infra1'], description: '' },
        { id: 'core2', name: 'App.Domain', type: 'Core', references: ['infra2'], description: '' },
        { id: 'infra1', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '' },
        { id: 'infra2', name: 'App.Persistence', type: 'Infrastructure', references: [], description: '' },
      ],
    });
    const violations = messages.filter((m) => m.code === 'ARCH_RULE_001');
    expect(violations).toHaveLength(2);
    const ids = violations.map((v) => v.id);
    expect(new Set(ids).size).toBe(2); // distinct ids — no duplicate React keys
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

  it('warns about JWT token lifetime above the 60-minute policy the warning message itself states', () => {
    // Regression test: the warning text has always said "<= 60 minutes", but the threshold that
    // triggered it was `> 120` — so a 90-minute lifetime (already over the stated policy)
    // silently passed with no warning at all.
    const secProfiles = profileRepository.getSecurityProfiles();
    profileRepository.saveSecurityProfiles(
      secProfiles.map((p) => (p.id === 'sec-prof-jwt' ? { ...p, tokenLifetimeMinutes: 90 } : p))
    );

    const messages = ValidationService.validateBlueprint({
      ...baseBlueprint,
      featureIds: ['feat-docker', 'feat-healthchecks', 'feat-postgres-ef'],
    });
    expect(messages.some((m) => m.code === 'SEC_JWT_EXPIRE_HIGH' && m.type === 'warning')).toBe(true);
  });
});

describe('ValidationService.validateGeneratedTree (Phase 9 golden path)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const csFile = (id: string, path: string, contentSnippet: string): SolutionTreeNode => ({
    id, name: path.split('/').pop() || id, type: 'file', path, language: 'csharp', contentSnippet,
  });

  it('returns [] when the tree has no C# files (not applicable, not fake-passing)', () => {
    const tree: SolutionTreeNode[] = [csFile('f1', 'src/app/index.ts', 'export const x = 1;')];
    tree[0].language = 'typescript';
    expect(ValidationService.validateGeneratedTree(tree)).toEqual([]);
  });

  it('passes the golden C# template with zero rule-2..5 violations', () => {
    const preview = ProjectService.generateSolutionPreview(
      {
        id: 'bp-golden', name: 'Golden', description: '', architectureStyle: 'CleanArchitecture',
        techStackId: 'stack-dotnet9',
        projects: [
          { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
          { id: 'a', name: 'App.Application', type: 'Application', references: ['c'], description: '' },
          { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: ['a', 'c'], description: '' },
          { id: 'api', name: 'App.Api', type: 'API', references: ['i', 'a'], description: '' },
          { id: 't', name: 'App.Tests', type: 'Tests', references: ['a', 'c'], description: '' },
        ],
        featureIds: [], disabledAutoFeatures: [], ruleSetId: 'ruleset-clean-arch',
        profiles: {
          securityProfileId: 'sec-prof-jwt', databaseProfileId: 'db-prof-pg',
          dockerProfileId: 'docker-prof-prod', cacheProfileId: 'cache-prof-redis',
          loggingProfileId: 'log-prof-opentelemetry',
        },
      },
      'Acme.Golden',
      true
    );
    const messages = ValidationService.validateGeneratedTree(preview.solutionTree);
    expect(messages.filter((m) => m.ruleId === 'rule-2')).toEqual([]);
    expect(messages.filter((m) => m.ruleId === 'rule-3')).toEqual([]);
    expect(messages.filter((m) => m.ruleId === 'rule-4')).toEqual([]);
    expect(messages.filter((m) => m.ruleId === 'rule-5')).toEqual([]);
  });

  it('flags DateTime.Now (rule-4) and Console.WriteLine (rule-5) per offending file', () => {
    const tree = [
      csFile('bad', 'src/App.Api/Bad.cs', 'var t = DateTime.Now; Console.WriteLine(t);'),
    ];
    const messages = ValidationService.validateGeneratedTree(tree);
    expect(messages.some((m) => m.ruleId === 'rule-4' && m.type === 'warning')).toBe(true);
    expect(messages.some((m) => m.ruleId === 'rule-5' && m.type === 'warning')).toBe(true);
  });

  it('flags a controller that does not inherit BaseApiController (rule-2)', () => {
    const tree = [
      csFile('base', 'src/App.Api/Controllers/BaseApiController.cs', 'public abstract class BaseApiController : ControllerBase {}'),
      csFile('rogue', 'src/App.Api/Controllers/RogueController.cs', 'public class RogueController : ControllerBase {}'),
    ];
    const messages = ValidationService.validateGeneratedTree(tree);
    expect(messages.some((m) => m.ruleId === 'rule-2' && m.type === 'error' && m.affectedComponent.includes('Rogue'))).toBe(true);
  });

  it('flags a repository interface without an Infrastructure implementation (rule-3)', () => {
    const tree = [
      csFile('iface', 'src/App.Application/Common/IRepository.cs', 'public interface IOrderRepository { }'),
    ];
    const messages = ValidationService.validateGeneratedTree(tree);
    expect(messages.some((m) => m.ruleId === 'rule-3' && m.type === 'error')).toBe(true);
  });
});
