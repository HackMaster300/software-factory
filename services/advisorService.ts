import { Blueprint, AdvisorScores, ScoreRationale } from '../types/factory';
import { techStackRepository } from './repositories/techStack.repository';
import { FeatureService } from './featureService';
import { ValidationService } from './validationService';
import type { ValidationMessage } from '../types/factory';

/**
 * Phase 11 — scores traceable, não vibes.
 *
 * Cada ponto tem origem auditável: (1) penalidades vindas de
 * `ValidationService.validateBlueprint()` (error −15, warning −7, citando code/ruleId);
 * (2) bônus de checklist verificável (feature presente = +N, citando o feature id);
 * (3) propriedades estruturais documentadas (estilo de arquitetura);
 * (4) complexidade determinística por contagem (projetos/features/referências).
 *
 * Removido: bônus por estereótipo de linguagem (ex. "Rust +25 performance") — não
 * verificável. O ponto de partida 60 é baseline heurística declarada na UI
 * ("heuristic estimate"), nunca medição.
 */
function applyDelta(current: number, delta: number): number {
  if (delta === 0) return current;
  return delta > 0 ? current + delta * (1 - current / 100) : current + delta * (current / 100);
}

type Dimension = 'Security' | 'Architecture' | 'Performance' | 'Scalability' | 'Maintainability';

function dimensionForValidation(m: ValidationMessage): Dimension {
  if (m.code === 'DEP_RULE_006') return 'Scalability';
  if (m.code === 'SEC_JWT_EXPIRE_HIGH' || m.code === 'TREE_RULE_005') return 'Security';
  if (m.code === 'TREE_RULE_004') return 'Maintainability';
  if (m.code === 'RECOMMENDED_FEATURE_DISABLED') {
    if (m.id.includes('feat-env-vars')) return 'Security';
    if (m.id.includes('feat-healthchecks')) return 'Architecture';
    return 'Maintainability';
  }
  // ARCH_RULE_001, TREE_RULE_002, TREE_RULE_003, DB_PROVIDER_MISMATCH + default
  return 'Architecture';
}

const CHECKLIST: Array<{ featureId: string; dimension: Dimension; points: number; label: string }> = [
  { featureId: 'feat-jwt-auth', dimension: 'Security', points: 6, label: 'JWT Bearer authentication present' },
  { featureId: 'feat-secrets', dimension: 'Security', points: 8, label: 'Vault secrets management present' },
  { featureId: 'feat-fluent-validation', dimension: 'Security', points: 5, label: 'FluentValidation DTO sanitization present' },
  { featureId: 'feat-postgres-ef', dimension: 'Architecture', points: 5, label: 'EF Core persistence layer present' },
  { featureId: 'feat-mediatr-cqrs', dimension: 'Architecture', points: 5, label: 'MediatR CQRS handlers present' },
  { featureId: 'feat-redis-cache', dimension: 'Performance', points: 6, label: 'Redis distributed cache present' },
  { featureId: 'feat-docker', dimension: 'Scalability', points: 5, label: 'Docker packaging present' },
  { featureId: 'feat-healthchecks', dimension: 'Scalability', points: 8, label: 'Container health probes present' },
  { featureId: 'feat-opentelemetry', dimension: 'Maintainability', points: 5, label: 'OpenTelemetry tracing present' },
];

export class AdvisorService {
  static calculateScores(blueprint: Blueprint): AdvisorScores {
    const techStacks = techStackRepository.getTechStacks();
    const selectedStack = techStacks.find((s) => s.id === blueprint.techStackId) || techStacks[0];

    const { activeFeatureIds } = FeatureService.resolveBlueprintFeatures(blueprint);
    const validation = ValidationService.validateBlueprint(blueprint);

    // Heuristic baseline, declarada como tal na UI.
    let securityScore = 60;
    let architectureScore = 60;
    let performanceScore = 60;
    let scalabilityScore = 60;
    let maintainabilityScore = 60;

    const reasons: Record<Dimension | 'Complexity', string[]> = {
      Security: [], Architecture: [], Performance: [], Scalability: [], Maintainability: [], Complexity: [],
    };
    const recommendations: Record<Dimension | 'Complexity', string[]> = {
      Security: [], Architecture: [], Performance: [], Scalability: [], Maintainability: [], Complexity: [],
    };

    const adjust = (dim: Dimension, points: number, reason: string): void => {
      if (dim === 'Security') securityScore = applyDelta(securityScore, points);
      else if (dim === 'Architecture') architectureScore = applyDelta(architectureScore, points);
      else if (dim === 'Performance') performanceScore = applyDelta(performanceScore, points);
      else if (dim === 'Scalability') scalabilityScore = applyDelta(scalabilityScore, points);
      else maintainabilityScore = applyDelta(maintainabilityScore, points);
      reasons[dim].push(`${points >= 0 ? '+' : ''}${points} — ${reason}`);
    };

    // 1. Validation penalties — cada ponto rastreável a code/ruleId.
    for (const m of validation) {
      if (m.type === 'info') continue;
      const penalty = m.type === 'error' ? -15 : -7;
      const dim = dimensionForValidation(m);
      const ref = m.ruleId ? `${m.code}/${m.ruleId}` : m.code;
      adjust(dim, penalty, `[validation ${m.type} ${ref}] ${m.title}`);
      if (m.consequenceIfIgnored) recommendations[dim].push(m.consequenceIfIgnored);
      else if (m.ruleId) recommendations[dim].push(`Remediate per rule ${m.ruleId}: ${m.title}.`);
    }

    // 2. Verifiable checklist — feature presente ou não, sem meio-termo.
    for (const item of CHECKLIST) {
      if (activeFeatureIds.includes(item.featureId)) {
        adjust(item.dimension, item.points, `[checklist ${item.featureId}] ${item.label}`);
      }
    }
    if (blueprint.projects.some((p) => p.type === 'Tests')) {
      adjust('Maintainability', 5, '[checklist] dedicated Tests project present');
    }

    // 3. Structural properties (documented trade-offs, still heuristic — UI-labeled).
    const archStyle = blueprint.architectureStyle;
    if (archStyle === 'Microservices') {
      adjust('Scalability', 8, '[structure] Microservices: independent deploy/scale units');
    } else if (archStyle === 'ModularMonolith') {
      adjust('Maintainability', 5, '[structure] Modular Monolith: boundaries without network hops');
    } else if (archStyle === 'CleanArchitecture' || archStyle === 'Hexagonal' || archStyle === 'CQRS') {
      adjust('Architecture', 5, `[structure] ${archStyle}: enforced layer/port separation`);
    }

    // 4. Complexity — deterministic count, zero vibes.
    const refCount = blueprint.projects.reduce((n, p) => n + p.references.length, 0);
    const complexityScore = Math.min(
      100,
      Math.max(0, Math.round(20 + 3 * blueprint.projects.length + 2 * activeFeatureIds.length + 2 * refCount))
    );
    reasons.Complexity.push(
      `Deterministic count: ${blueprint.projects.length} projects, ${activeFeatureIds.length} active features, ${refCount} references → 20 + 3n + 2n + 2n`
    );
    recommendations.Complexity.push('Keep handler functions concise and under 50 lines.');

    securityScore = Math.min(100, Math.max(0, Math.round(securityScore)));
    architectureScore = Math.min(100, Math.max(0, Math.round(architectureScore)));
    performanceScore = Math.min(100, Math.max(0, Math.round(performanceScore)));
    scalabilityScore = Math.min(100, Math.max(0, Math.round(scalabilityScore)));
    maintainabilityScore = Math.min(100, Math.max(0, Math.round(maintainabilityScore)));

    const qualityScore = Math.round(
      securityScore * 0.25 +
        architectureScore * 0.25 +
        performanceScore * 0.15 +
        scalabilityScore * 0.15 +
        maintainabilityScore * 0.2
    );

    const rationaleList: ScoreRationale[] = [
      {
        category: 'Security Score',
        score: securityScore,
        reason: reasons.Security.join(' • ') || 'Heuristic baseline 60, no security adjustments measured.',
        recommendations: recommendations.Security.length > 0 ? recommendations.Security : ['Ensure secrets and signing keys are rotated via Vault.'],
      },
      {
        category: 'Architecture Score',
        score: architectureScore,
        reason: reasons.Architecture.join(' • ') || 'Heuristic baseline 60, no architecture adjustments measured.',
        recommendations: recommendations.Architecture.length > 0 ? recommendations.Architecture : ['Maintain strict boundary rules preventing domain from referencing infrastructure.'],
      },
      {
        category: 'Performance Score',
        score: performanceScore,
        reason: reasons.Performance.join(' • ') || 'Heuristic baseline 60, no performance adjustments measured.',
        recommendations: ['Utilize connection pooling and async non-blocking query execution.'],
      },
      {
        category: 'Scalability Score',
        score: scalabilityScore,
        reason: reasons.Scalability.join(' • ') || 'Heuristic baseline 60, no scalability adjustments measured.',
        recommendations: ['Deploy behind Cloud Run or Kubernetes HPA auto-scaler.'],
      },
      {
        category: 'Maintainability Score',
        score: maintainabilityScore,
        reason: reasons.Maintainability.join(' • ') || 'Heuristic baseline 60, no maintainability adjustments measured.',
        recommendations: ['Enforce unit tests for all domain logic handlers.'],
      },
      {
        category: 'Complexity Score',
        score: complexityScore,
        reason: reasons.Complexity.join(' • ') || `Complexity for ${selectedStack?.name || 'stack'}.`,
        recommendations: recommendations.Complexity,
      },
    ];

    return {
      securityScore,
      architectureScore,
      performanceScore,
      scalabilityScore,
      maintainabilityScore,
      complexityScore,
      qualityScore,
      rationale: rationaleList,
    };
  }
}
