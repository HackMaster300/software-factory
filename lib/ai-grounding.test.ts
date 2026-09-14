import { describe, it, expect, beforeEach } from 'vitest';
import { buildGroundedPrompt, getGroundedSystemInstruction, GROUNDED_SYSTEM_INSTRUCTION } from './ai-grounding';
import type { Blueprint } from '../types/factory';

const bp: Blueprint = {
  id: 'bp-ground',
  name: 'Ground Test',
  description: '',
  architectureStyle: 'CleanArchitecture',
  techStackId: 'stack-dotnet9',
  projects: [
    { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
    { id: 'a', name: 'App.Application', type: 'Application', references: ['c'], description: '' },
    { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: ['a', 'c'], description: '' },
    { id: 'api', name: 'App.Api', type: 'API', references: ['i', 'a'], description: '' },
  ],
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

describe('ai-grounding', () => {
  beforeEach(() => window.localStorage.clear());

  it('grounded system instruction mandates citing ruleId', () => {
    expect(getGroundedSystemInstruction()).toContain('ruleId');
    expect(getGroundedSystemInstruction()).toContain('ground');
    expect(getGroundedSystemInstruction('  Be concise.  ')).toContain('Be concise.');
  });

  it('buildGroundedPrompt embeds blueprint + ruleSet + validation with real codes', () => {
    // Smart Dependencies auto-ativa healthchecks via feat-docker; para forçar a
    // violação rule-6 de verdade, desabilita explicitamente o recomendado.
    const violating = { ...bp, disabledAutoFeatures: ['feat-healthchecks'] };
    const prompt = buildGroundedPrompt(violating, 'Is my architecture ok?');
    expect(prompt).toContain('Ground Test');
    expect(prompt).toContain('stack-dotnet9');
    expect(prompt).toContain('App.Core');
    // feat-docker sem healthchecks dispara DEP_RULE_006
    expect(prompt).toContain('DEP_RULE_006');
    expect(prompt).toContain('rule-6');
    expect(prompt).toContain('Is my architecture ok?');
    expect(prompt).toContain('VALIDATION REPORT');
  });

  it('passing blueprint (docker+healthchecks+postgres) yields ALL_PASSING', () => {
    const passing = buildGroundedPrompt({ ...bp, featureIds: ['feat-docker', 'feat-healthchecks', 'feat-postgres-ef'] }, 'ok?');
    expect(passing).toContain('ALL_PASSING');
  });

  it('exposes the grounded constant for API route use', () => {
    expect(GROUNDED_SYSTEM_INSTRUCTION.length).toBeGreaterThan(40);
  });
});
