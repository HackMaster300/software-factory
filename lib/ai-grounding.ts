import { Blueprint } from '../types/factory';
import { ValidationService } from '../services/validationService';
import { FeatureService } from '../services/featureService';
import { ruleSetRepository } from '../services/repositories/ruleSet.repository';

/**
 * Phase 10 — contexto grounded para IA.
 * Constrói prompt + system instruction com blueprint REAL + ruleSet ativo + features ativas
 * + validation (com ruleId) para que a IA cite regras violadas em vez de chutar genérico.
 * Puro (sem fetch) — testável sem rede.
 */

export const GROUNDED_SYSTEM_INSTRUCTION = `You are the Software Factory Standard Consultant. You MUST ground every finding in the provided Blueprint, active RuleSet (cite ruleId like rule-1, rule-2), active FeatureManifests, and Validation Report. When flagging a violation, cite the exact ruleId and remediation. Prefer "no violation" over hallucinating a rule. Final decisions belong to the human Architect.`;

export function buildGroundedPrompt(blueprint: Blueprint, userPrompt: string): string {
  const activeFeatureIds = (() => {
    try {
      return FeatureService.resolveBlueprintFeatures(blueprint).activeFeatureIds;
    } catch {
      return blueprint.featureIds;
    }
  })();

  const validation = (() => {
    try {
      return ValidationService.validateBlueprint(blueprint);
    } catch {
      return [];
    }
  })();

  const activeRuleSet = (() => {
    try {
      const sets = ruleSetRepository.getRuleSets();
      return sets.find((s) => s.id === blueprint.ruleSetId) || sets[0];
    } catch {
      return undefined;
    }
  })();

  const projectsSummary = blueprint.projects
    .map((p) => `- ${p.name} (${p.type}) refs [${p.references.join(', ') || 'none'}]`)
    .join('\n');

  const validationSummary = validation.length === 0
    ? 'No validation messages.'
    : validation.map((m) => `  - [${m.type}/${m.code}] ${m.title} — ${m.description} (ruleId: ${m.ruleId || 'n/a'}, component: ${m.affectedComponent})`).join('\n');

  const ruleSetSummary = activeRuleSet
    ? `RuleSet "${activeRuleSet.name}" (${activeRuleSet.rules.length} rules): ${activeRuleSet.rules.filter((r) => r.isEnabled).map((r) => `${r.id}(${r.category}/${r.severity})`).join(', ')}`
    : 'No RuleSet resolved.';

  return [
    `## BLUEPRINT (ground truth, do not invent)`,
    `Name: ${blueprint.name}`,
    `TechStack: ${blueprint.techStackId} | Architecture: ${blueprint.architectureStyle}`,
    `Projects (${blueprint.projects.length}):`,
    projectsSummary || '  (none)',
    `Active Features (${activeFeatureIds.length}): ${activeFeatureIds.join(', ') || '(none)'}`,
    ``,
    `## ACTIVE RULESET`,
    ruleSetSummary,
    ``,
    `## VALIDATION REPORT (must cite ruleId when referring to violations)`,
    validationSummary,
    ``,
    `## USER REQUEST`,
    userPrompt,
  ].join('\n');
}

export function getGroundedSystemInstruction(customPromptStyle?: string): string {
  // Custom agent style vira complemento, nunca substitui a instrução grounded.
  if (customPromptStyle && customPromptStyle.trim()) {
    return `${GROUNDED_SYSTEM_INSTRUCTION}\n\nAdditional style/role instruction:\n${customPromptStyle.trim()}`;
  }
  return GROUNDED_SYSTEM_INSTRUCTION;
}
