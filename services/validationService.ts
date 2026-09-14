import { Blueprint, ValidationMessage } from '../types/factory';
import { ruleSetRepository } from './repositories/ruleSet.repository';
import { profileRepository } from './repositories/profile.repository';
import { FeatureService } from './featureService';
import type { SolutionTreeNode } from './projectService';

export class ValidationService {
  static validateBlueprint(blueprint: Blueprint): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const ruleSets = ruleSetRepository.getRuleSets();
    const activeRuleSet = ruleSets.find((rs) => rs.id === blueprint.ruleSetId) || ruleSets[0];
    const { activeFeatureIds, disabledRecommendedFeatures } = FeatureService.resolveBlueprintFeatures(blueprint);

    // 1. Evaluate Rule Set
    if (activeRuleSet) {
      for (const rule of activeRuleSet.rules) {
        if (!rule.isEnabled) continue;

        if (rule.id === 'rule-1') {
          // Domain Cannot Reference Infrastructure. Checks every Core project against every
          // Infrastructure project it references — a single-pair `.find()` here used to miss
          // real violations in any blueprint with more than one Core or Infrastructure project
          // (Hexagonal/Microservices/CQRS styles routinely produce multiple of each).
          const coreProjects = blueprint.projects.filter((p) => p.type === 'Core');
          const infraProjects = blueprint.projects.filter((p) => p.type === 'Infrastructure');
          for (const coreProj of coreProjects) {
            for (const infraProj of infraProjects) {
              if (coreProj.references.includes(infraProj.id)) {
                messages.push({
                  id: `val-rule-1-${coreProj.id}-${infraProj.id}`,
                  type: 'error',
                  code: 'ARCH_RULE_001',
                  title: 'Architecture Boundary Violation: Domain references Infrastructure',
                  description: `Project '${coreProj.name}' directly references '${infraProj.name}'. Domain logic must not depend on database or external infrastructure.`,
                  affectedComponent: `${coreProj.name}.csproj`,
                  autoFixAvailable: true,
                  ruleId: rule.id,
                  consequenceIfIgnored: 'Breaches Clean Architecture principles, makes unit testing impossible without live database connections.',
                });
              }
            }
          }
        }

        if (rule.id === 'rule-6') {
          // Health check endpoint mandatory for Docker
          const hasDocker = activeFeatureIds.includes('feat-docker');
          const hasHealth = activeFeatureIds.includes('feat-healthchecks');
          if (hasDocker && !hasHealth) {
            messages.push({
              id: 'val-rule-6',
              type: 'error',
              code: 'DEP_RULE_006',
              title: 'Missing Mandatory Health Checks for Docker Container',
              description: "Docker feature is active, but mandatory 'Health Checks & Diagnostics' feature is missing or disabled.",
              affectedComponent: 'Dockerfile / Deployment Probes',
              autoFixAvailable: true,
              ruleId: rule.id,
              consequenceIfIgnored: 'Container orchestrators (Kubernetes / Cloud Run) will be unable to detect deadlocks or database connection failures, leading to silent traffic routing failures.',
            });
          }
        }
      }
    }

    // 2. Validate Explicitly Disabled Recommended Features
    for (const disabled of disabledRecommendedFeatures) {
      const feat = FeatureService.getFeatureById(disabled.id);
      messages.push({
        id: `val-disabled-${disabled.id}`,
        type: 'warning',
        code: 'RECOMMENDED_FEATURE_DISABLED',
        title: `Explicitly Disabled Recommended Feature: ${feat?.name || disabled.id}`,
        description: disabled.reason,
        affectedComponent: `Feature Manifests (${feat?.category})`,
        autoFixAvailable: true,
        consequenceIfIgnored: `Operating without ${feat?.name} reduces architectural consistency and security score. ${feat?.securityWarnings[0] || ''}`,
      });
    }

    // 3. Database & ORM Profile Compatibility Checks
    const dbProfiles = profileRepository.getDatabaseProfiles();
    const activeDbProf = dbProfiles.find((p) => p.id === blueprint.profiles.databaseProfileId);
    if (activeDbProf) {
      if (activeDbProf.provider === 'PostgreSQL' && !activeFeatureIds.includes('feat-postgres-ef')) {
        messages.push({
          id: 'val-db-compat-1',
          type: 'warning',
          code: 'DB_PROVIDER_MISMATCH',
          title: 'Database Profile set to PostgreSQL but Npgsql EF Core package is missing',
          description: "Database profile specifies 'PostgreSQL', but 'PostgreSQL & Entity Framework Core' feature is not selected.",
          affectedComponent: 'Infrastructure.csproj / AppSettings',
          autoFixAvailable: true,
          consequenceIfIgnored: 'Application startup will fail when resolving Npgsql DbContext options.',
        });
      }
    }

    // 4. Security Profile Checks
    const secProfiles = profileRepository.getSecurityProfiles();
    const activeSecProf = secProfiles.find((p) => p.id === blueprint.profiles.securityProfileId);
    if (activeSecProf && activeSecProf.tokenLifetimeMinutes > 60) {
      messages.push({
        id: 'val-sec-1',
        type: 'warning',
        code: 'SEC_JWT_EXPIRE_HIGH',
        title: 'Security Risk: Excessive JWT Token Expiration Lifetime',
        description: `JWT token lifetime is configured to ${activeSecProf.tokenLifetimeMinutes} minutes. Enterprise standard recommends <= 60 minutes with refresh token rotation.`,
        affectedComponent: 'Security Profile / JWT Middleware',
        autoFixAvailable: false,
        consequenceIfIgnored: 'Stolen access tokens remain valid for prolonged durations, exposing API endpoints to unauthorized replay attacks.',
      });
    }

    // 5. Positive Architectural Status Message
    if (messages.length === 0) {
      messages.push({
        id: 'val-ok-1',
        type: 'info',
        code: 'ALL_PASSING',
        title: 'All Architectural & Security Validation Rules Passing',
        description: 'Blueprint conforms strictly to enterprise Clean Architecture boundaries and security policies.',
        affectedComponent: 'Solution Architecture',
        autoFixAvailable: false,
      });
    }

    return messages;
  }

  /**
   * Phase 9 — verifica o CÓDIGO GERADO (solution tree) contra as code-standard rules
   * do ruleset-clean-arch que não são verificáveis só no blueprint estrutural:
   * rule-2 (controllers herdam BaseApiController), rule-3 (interfaces em
   * Application/Core + impl em Infrastructure), rule-4 (sem DateTime.Now),
   * rule-5 (sem Console.WriteLine). Só examina arquivos `csharp`; sem arquivo C#,
   * retorna [] (não aplicável) em vez de alegar conformidade.
   */
  static validateGeneratedTree(tree: SolutionTreeNode[]): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const files: SolutionTreeNode[] = [];
    const walk = (nodes: SolutionTreeNode[]): void => {
      for (const n of nodes) {
        if (n.type === 'file') files.push(n);
        if (n.children) walk(n.children);
      }
    };
    walk(tree);

    const csharp = files.filter((f) => f.language === 'csharp');
    if (csharp.length === 0) return messages;

    const contentOf = (f: SolutionTreeNode): string => f.contentSnippet || '';

    // rule-4: Prohibit DateTime.Now (TimeProvider / DateTimeOffset.UtcNow instead).
    for (const f of csharp.filter((f) => /DateTime\.Now/.test(contentOf(f)))) {
      messages.push({
        id: `val-tree-rule-4-${f.id}`,
        type: 'warning',
        code: 'TREE_RULE_004',
        title: 'Prohibited DateTime.Now in generated code',
        description: `File '${f.path}' calls DateTime.Now, which breaks unit test determinism.`,
        affectedComponent: f.path,
        autoFixAvailable: true,
        ruleId: 'rule-4',
        consequenceIfIgnored: 'Non-deterministic timestamps make tests flaky and time-zone dependent.',
      });
    }

    // rule-5: No Console.WriteLine (ILogger<T> instead).
    for (const f of csharp.filter((f) => /Console\.WriteLine/.test(contentOf(f)))) {
      messages.push({
        id: `val-tree-rule-5-${f.id}`,
        type: 'warning',
        code: 'TREE_RULE_005',
        title: 'Direct console output in generated code',
        description: `File '${f.path}' calls Console.WriteLine, bypassing structured logging.`,
        affectedComponent: f.path,
        autoFixAvailable: true,
        ruleId: 'rule-5',
        consequenceIfIgnored: 'Log output loses correlation IDs and structured formatting.',
      });
    }

    // rule-2: every controller inherits BaseApiController; the base must exist.
    const controllers = csharp.filter((f) => f.path.includes('Controller'));
    if (controllers.length > 0) {
      const baseDef = csharp.find((f) => /class\s+BaseApiController/.test(contentOf(f)));
      if (!baseDef) {
        messages.push({
          id: 'val-tree-rule-2-base',
          type: 'error',
          code: 'TREE_RULE_002',
          title: 'Missing BaseApiController in generated API project',
          description: 'Controllers exist but no BaseApiController definition was generated.',
          affectedComponent: 'API/Controllers',
          autoFixAvailable: true,
          ruleId: 'rule-2',
          consequenceIfIgnored: 'No unified error handling, route logging, or trace correlation.',
        });
      }
      for (const c of controllers) {
        if (baseDef && c.id === baseDef.id) continue;
        if (!/:\s*BaseApiController/.test(contentOf(c))) {
          messages.push({
            id: `val-tree-rule-2-${c.id}`,
            type: 'error',
            code: 'TREE_RULE_002',
            title: 'Controller does not inherit BaseApiController',
            description: `File '${c.path}' must extend BaseApiController for unified error handling.`,
            affectedComponent: c.path,
            autoFixAvailable: true,
            ruleId: 'rule-2',
            consequenceIfIgnored: 'Inconsistent error responses and missing route logging.',
          });
        }
      }
    }

    // rule-3: repository interface (Application/Core) + implementation (Infrastructure).
    const hasInterface = csharp.some((f) => /interface\s+I\w*Repository/.test(contentOf(f)));
    const hasImpl = csharp.some((f) => /class\s+\w*Repository[^{]*:[^{]*I\w*Repository/.test(contentOf(f)));
    if (hasInterface || hasImpl) {
      if (hasInterface && !hasImpl) {
        messages.push({
          id: 'val-tree-rule-3-impl',
          type: 'error',
          code: 'TREE_RULE_003',
          title: 'Repository interface without Infrastructure implementation',
          description: 'A repository interface exists but no Infrastructure class implements it.',
          affectedComponent: 'Infrastructure/Persistence',
          autoFixAvailable: true,
          ruleId: 'rule-3',
          consequenceIfIgnored: 'Application layer cannot resolve persistence at runtime.',
        });
      }
      if (!hasInterface && hasImpl) {
        messages.push({
          id: 'val-tree-rule-3-iface',
          type: 'error',
          code: 'TREE_RULE_003',
          title: 'Repository implementation without Application/Core interface',
          description: 'A repository class exists but its interface is not defined in Application/Core.',
          affectedComponent: 'Application/Common',
          autoFixAvailable: true,
          ruleId: 'rule-3',
          consequenceIfIgnored: 'Domain/Application depends directly on Infrastructure, breaking Clean Architecture.',
        });
      }
    }

    return messages;
  }
}
