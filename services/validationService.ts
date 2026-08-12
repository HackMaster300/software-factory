import { Blueprint, ValidationMessage } from '../types/factory';
import { StorageService } from './storageService';
import { FeatureService } from './featureService';

export class ValidationService {
  static validateBlueprint(blueprint: Blueprint): ValidationMessage[] {
    const messages: ValidationMessage[] = [];
    const ruleSets = StorageService.getRuleSets();
    const activeRuleSet = ruleSets.find((rs) => rs.id === blueprint.ruleSetId) || ruleSets[0];
    const { activeFeatureIds, disabledRecommendedFeatures } = FeatureService.resolveBlueprintFeatures(blueprint);

    // 1. Evaluate Rule Set
    if (activeRuleSet) {
      for (const rule of activeRuleSet.rules) {
        if (!rule.isEnabled) continue;

        if (rule.id === 'rule-1') {
          // Domain Cannot Reference Infrastructure
          const coreProj = blueprint.projects.find((p) => p.type === 'Core');
          const infraProj = blueprint.projects.find((p) => p.type === 'Infrastructure');
          if (coreProj && infraProj && coreProj.references.includes(infraProj.id)) {
            messages.push({
              id: 'val-rule-1',
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
    const dbProfiles = StorageService.getDatabaseProfiles();
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
    const secProfiles = StorageService.getSecurityProfiles();
    const activeSecProf = secProfiles.find((p) => p.id === blueprint.profiles.securityProfileId);
    if (activeSecProf && activeSecProf.tokenLifetimeMinutes > 120) {
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
}
