import { RuleSet, Rule, Blueprint } from '../types/factory';
import { ruleSetRepository } from './repositories/ruleSet.repository';

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  target: string;
  message: string;
  remediation: string;
  canAutoFix?: boolean;
  autoFixType?: 'remove_reference' | 'enable_feature' | 'toggle_rule';
  autoFixData?: {
    fromProjectId?: string;
    toProjectId?: string;
    featureId?: string;
    ruleId?: string;
  };
}

export interface RuleValidationReport {
  evaluatedCount: number;
  passedCount: number;
  failedCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  violations: RuleViolation[];
}

export class RuleService {
  static getRuleSets(): RuleSet[] {
    return ruleSetRepository.getRuleSets();
  }

  static getRuleSetById(id: string): RuleSet | undefined {
    return this.getRuleSets().find((rs) => rs.id === id);
  }

  static toggleRule(ruleSetId: string, ruleId: string, isEnabled: boolean): void {
    const ruleSets = this.getRuleSets();
    const rs = ruleSets.find((r) => r.id === ruleSetId);
    if (rs) {
      const rule = rs.rules.find((r) => r.id === ruleId);
      if (rule) {
        rule.isEnabled = isEnabled;
        ruleSetRepository.saveRuleSets(ruleSets);
      }
    }
  }

  static addRule(ruleSetId: string, newRule: Rule): void {
    const ruleSets = this.getRuleSets();
    const rs = ruleSets.find((r) => r.id === ruleSetId);
    if (rs) {
      rs.rules.unshift(newRule);
      ruleSetRepository.saveRuleSets(ruleSets);
    }
  }

  static deleteRule(ruleSetId: string, ruleId: string): void {
    const ruleSets = this.getRuleSets();
    const rs = ruleSets.find((r) => r.id === ruleSetId);
    if (rs) {
      rs.rules = rs.rules.filter((r) => r.id !== ruleId);
      ruleSetRepository.saveRuleSets(ruleSets);
    }
  }

  static saveRule(ruleSetId: string, updatedRule: Rule): void {
    const ruleSets = this.getRuleSets();
    const rs = ruleSets.find((r) => r.id === ruleSetId);
    if (rs) {
      const idx = rs.rules.findIndex((r) => r.id === updatedRule.id);
      if (idx >= 0) {
        rs.rules[idx] = updatedRule;
      } else {
        rs.rules.push(updatedRule);
      }
      ruleSetRepository.saveRuleSets(ruleSets);
    }
  }

  /**
   * Evaluates active rules against a Blueprint's solution project graph & feature configuration.
   */
  static validateBlueprint(blueprint: Blueprint, ruleSet: RuleSet): RuleValidationReport {
    const enabledRules = ruleSet.rules.filter((r) => r.isEnabled);
    const violations: RuleViolation[] = [];

    for (const rule of enabledRules) {
      const exprLower = rule.expression.toLowerCase();
      const idLower = rule.id.toLowerCase();
      const nameLower = rule.name.toLowerCase();

      // Rule Evaluation 1: Domain / Core cannot reference Infrastructure
      if (
        exprLower.includes('domain') ||
        exprLower.includes('core') ||
        nameLower.includes('domain cannot reference infrastructure')
      ) {
        // Search projects for Core/Domain/POCO layer
        const domainProjects = blueprint.projects.filter(
          (p) =>
            p.type === 'Core' ||
            p.name.toLowerCase().includes('core') ||
            p.name.toLowerCase().includes('domain')
        );

        for (const domProj of domainProjects) {
          for (const refId of domProj.references) {
            const refProj = blueprint.projects.find((p) => p.id === refId);
            if (
              refProj &&
              (refProj.type === 'Infrastructure' ||
                refProj.name.toLowerCase().includes('infrastructure') ||
                refProj.name.toLowerCase().includes('infra'))
            ) {
              violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                category: rule.category,
                target: `Project: ${domProj.name}`,
                message: `Domain/Core project "${domProj.name}" contains a illegal dependency reference to Infrastructure project "${refProj.name}".`,
                remediation: rule.remediation,
                canAutoFix: true,
                autoFixType: 'remove_reference',
                autoFixData: { fromProjectId: domProj.id, toProjectId: refProj.id },
              });
            }
          }
        }
      }

      // Rule Evaluation 2: Health Checks Mandatory when Docker Containerized
      if (
        idLower.includes('health') ||
        exprLower.includes('feat-docker') ||
        nameLower.includes('health check')
      ) {
        const hasDocker = blueprint.featureIds.includes('feat-docker');
        const hasHealthChecks = blueprint.featureIds.includes('feat-healthchecks');

        if (hasDocker && !hasHealthChecks) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            target: `Blueprint Feature Manifests`,
            message: `Docker containerization is active ("feat-docker") but mandatory Health Checks endpoint ("feat-healthchecks") is missing.`,
            remediation: rule.remediation,
            canAutoFix: true,
            autoFixType: 'enable_feature',
            autoFixData: { featureId: 'feat-healthchecks' },
          });
        }
      }

      // Rule Evaluation 3: Environment Variables Feature Mandatory
      if (
        idLower.includes('env') ||
        nameLower.includes('env') ||
        exprLower.includes('feat-env-vars')
      ) {
        const hasEnvVars = blueprint.featureIds.includes('feat-env-vars');
        if (!hasEnvVars) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            target: `Blueprint Configurations`,
            message: `Environment variables manifest ("feat-env-vars") is disabled, risking hardcoded config files.`,
            remediation: rule.remediation,
            canAutoFix: true,
            autoFixType: 'enable_feature',
            autoFixData: { featureId: 'feat-env-vars' },
          });
        }
      }

      // Rule Evaluation 4: Secrets Vault for Production Database
      if (
        nameLower.includes('secret') ||
        exprLower.includes('vault') ||
        exprLower.includes('secrets')
      ) {
        const hasDb = blueprint.featureIds.some((f) => f.includes('db') || f.includes('postgres') || f.includes('sql'));
        const hasSecrets = blueprint.featureIds.includes('feat-secrets');
        if (hasDb && !hasSecrets) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            target: `Security Profile`,
            message: `Database layer configured without HashiCorp Vault / Secrets Manager manifest ("feat-secrets").`,
            remediation: rule.remediation,
            canAutoFix: true,
            autoFixType: 'enable_feature',
            autoFixData: { featureId: 'feat-secrets' },
          });
        }
      }

      // Rule Evaluation 5: Repositories Must Be Interfaces in Application/Core
      if (nameLower.includes('repositories') || exprLower.includes('repositories')) {
        // If Application layer references Core, ensure Infrastructure references both
        const infraProjects = blueprint.projects.filter((p) => p.type === 'Infrastructure' || p.name.toLowerCase().includes('infra'));
        const appProjects = blueprint.projects.filter((p) => p.type === 'Application' || p.name.toLowerCase().includes('app'));

        for (const appP of appProjects) {
          const hasInfraRef = appP.references.some((r) => infraProjects.some((i) => i.id === r));
          if (hasInfraRef) {
            violations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              category: rule.category,
              target: `Project: ${appP.name}`,
              message: `Application layer "${appP.name}" references Infrastructure directly instead of referencing repository interface abstractions in Core.`,
              remediation: rule.remediation,
              canAutoFix: false,
            });
          }
        }
      }
    }

    const errorCount = violations.filter((v) => v.severity === 'error').length;
    const warningCount = violations.filter((v) => v.severity === 'warning').length;
    const infoCount = violations.filter((v) => v.severity === 'info').length;

    return {
      evaluatedCount: enabledRules.length,
      passedCount: Math.max(0, enabledRules.length - violations.length),
      failedCount: violations.length,
      errorCount,
      warningCount,
      infoCount,
      violations,
    };
  }
}

