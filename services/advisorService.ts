import { Blueprint, AdvisorScores, ScoreRationale } from '../types/factory';
import { StorageService } from './storageService';
import { FeatureService } from './featureService';

export class AdvisorService {
  static calculateScores(blueprint: Blueprint): AdvisorScores {
    const allFeatures = StorageService.getFeatureManifests();
    const techStacks = StorageService.getTechStacks();
    const selectedStack = techStacks.find((s) => s.id === blueprint.techStackId) || techStacks[0];

    const { activeFeatureIds, disabledRecommendedFeatures } = FeatureService.resolveBlueprintFeatures(blueprint);
    const activeFeatures = allFeatures.filter((f) => activeFeatureIds.includes(f.id));

    let securityScore = 50;
    let architectureScore = 55;
    let performanceScore = 60;
    let scalabilityScore = 50;
    let maintainabilityScore = 55;
    let complexityScore = 30;

    const rationaleMap: Record<string, { score: number; reasons: string[]; recommendations: string[] }> = {
      Security: { score: 50, reasons: [], recommendations: [] },
      Architecture: { score: 55, reasons: [], recommendations: [] },
      Performance: { score: 60, reasons: [], recommendations: [] },
      Scalability: { score: 50, reasons: [], recommendations: [] },
      Maintainability: { score: 55, reasons: [], recommendations: [] },
      Complexity: { score: 30, reasons: [], recommendations: [] },
    };

    // Stack-specific score impacts & rationale
    if (selectedStack) {
      const lang = selectedStack.language;
      if (lang === 'rust') {
        performanceScore += 25;
        securityScore += 15;
        scalabilityScore += 20;
        rationaleMap.Performance.reasons.push('Rust Tokio/Axum zero-cost abstractions deliver sub-millisecond API execution (+25 performance)');
        rationaleMap.Security.reasons.push('Rust compile-time memory safety eliminates null pointers and data races (+15 security)');
      } else if (lang === 'go') {
        performanceScore += 20;
        scalabilityScore += 20;
        maintainabilityScore += 10;
        rationaleMap.Performance.reasons.push('Go goroutines and fast compile times maximize throughput (+20 performance)');
        rationaleMap.Scalability.reasons.push('Low footprint container runtime allows dense pod packing (+20 scalability)');
      } else if (lang === 'java') {
        architectureScore += 20;
        securityScore += 15;
        maintainabilityScore += 15;
        rationaleMap.Architecture.reasons.push('Java Spring Boot enterprise Ecosystem provides battle-tested DI & modularity (+20 architecture)');
        rationaleMap.Security.reasons.push('Spring Security delivers production RBAC and OAuth2 integration (+15 security)');
      } else if (lang === 'typescript') {
        maintainabilityScore += 20;
        architectureScore += 15;
        rationaleMap.Maintainability.reasons.push('Full-stack TypeScript enables shared DTO types between backend and frontend (+20 maintainability)');
      } else if (lang === 'python') {
        maintainabilityScore += 15;
        performanceScore += 10;
        rationaleMap.Maintainability.reasons.push('FastAPI Pydantic v2 offers fast development velocity and AI pipeline readiness (+15 maintainability)');
      } else if (lang === 'csharp') {
        architectureScore += 20;
        performanceScore += 15;
        maintainabilityScore += 15;
        rationaleMap.Architecture.reasons.push('.NET 9 ASP.NET Core native Dependency Injection and C# 13 features (+20 architecture)');
      } else if (lang === 'kotlin') {
        architectureScore += 15;
        maintainabilityScore += 15;
        rationaleMap.Architecture.reasons.push('Kotlin Coroutines deliver non-blocking async execution without callback complexity (+15 architecture)');
      } else if (lang === 'dart') {
        maintainabilityScore += 20;
        scalabilityScore += 10;
        rationaleMap.Maintainability.reasons.push('Flutter cross-platform Dart runtime unifies Mobile, Web, and Desktop UI codebases (+20 maintainability)');
      }
    }

    // Architecture Style impact
    const archStyle = blueprint.architectureStyle;
    if (archStyle === 'CleanArchitecture') {
      architectureScore += 20;
      maintainabilityScore += 20;
      rationaleMap.Architecture.reasons.push('Clean Architecture enforces strict Domain isolation and Dependency Inversion (+20 architecture)');
    } else if (archStyle === 'Hexagonal') {
      architectureScore += 20;
      maintainabilityScore += 15;
      rationaleMap.Architecture.reasons.push('Hexagonal Ports & Adapters isolate core business domain from HTTP and DB drivers (+20 architecture)');
    } else if (archStyle === 'Microservices') {
      scalabilityScore += 25;
      complexityScore += 20;
      rationaleMap.Scalability.reasons.push('Microservices allow independent deployment and horizontal node scaling (+25 scalability)');
    } else if (archStyle === 'CQRS') {
      architectureScore += 25;
      performanceScore += 15;
      rationaleMap.Architecture.reasons.push('CQRS decouples read queries from transactional write commands (+25 architecture)');
    } else if (archStyle === 'ModularMonolith') {
      maintainabilityScore += 25;
      complexityScore -= 10;
      rationaleMap.Maintainability.reasons.push('Modular Monolith delivers clean boundaries without distributed network complexity (+25 maintainability)');
    }

    // Evaluate features
    for (const feat of activeFeatures) {
      const scores = feat.impactScores;
      if (scores) {
        securityScore += scores.security || 0;
        architectureScore += scores.architecture || 0;
        performanceScore += scores.performance || 0;
        scalabilityScore += scores.scalability || 0;
        maintainabilityScore += scores.maintainability || 0;
        complexityScore += scores.complexity || 0;
      }

      if (feat.id === 'feat-jwt-auth') {
        rationaleMap.Security.reasons.push('JWT Bearer authentication protects endpoints with token verification (+25 security)');
      }
      if (feat.id === 'feat-secrets') {
        rationaleMap.Security.reasons.push('Vault secrets management prevents hardcoded connection credentials (+25 security)');
      }
      if (feat.id === 'feat-redis-cache') {
        rationaleMap.Performance.reasons.push('Redis distributed caching speeds up API responses up to 10x (+25 performance)');
        rationaleMap.Scalability.reasons.push('Distributed state allows stateless horizontal API node scaling (+25 scalability)');
      }
      if (feat.id === 'feat-docker') {
        rationaleMap.Scalability.reasons.push('Docker packaging enables container orchestration in Kubernetes/Cloud Run (+20 scalability)');
        rationaleMap.Maintainability.reasons.push('Environment parity eliminates host configuration mismatches (+20 maintainability)');
      }
      if (feat.id === 'feat-mediatr-cqrs') {
        rationaleMap.Architecture.reasons.push('CQRS architecture enforces Command/Query handler isolation (+30 architecture)');
        rationaleMap.Maintainability.reasons.push('Decoupled request handlers obey Open-Closed principle (+25 maintainability)');
      }
      if (feat.id === 'feat-fluent-validation') {
        rationaleMap.Security.reasons.push('FluentValidation sanitizes and validates incoming DTO payloads (+15 security)');
      }
    }

    // Deduce penalties for disabled recommended features
    for (const disabled of disabledRecommendedFeatures) {
      if (disabled.id === 'feat-healthchecks') {
        securityScore -= 10;
        architectureScore -= 15;
        rationaleMap.Architecture.reasons.push('WARNING: Health checks disabled despite Docker containerization (-15 architecture)');
        rationaleMap.Architecture.recommendations.push('Re-enable Health Checks & Diagnostics to ensure container health probe accuracy.');
      }
      if (disabled.id === 'feat-env-vars') {
        securityScore -= 20;
        rationaleMap.Security.reasons.push('WARNING: Environment variables feature disabled, risking hardcoded config files (-20 security)');
        rationaleMap.Security.recommendations.push('Re-enable Environment Variables Config Provider to comply with Twelve-Factor config isolation.');
      }
    }

    // Clamp scores 0-100
    securityScore = Math.min(100, Math.max(0, securityScore));
    architectureScore = Math.min(100, Math.max(0, architectureScore));
    performanceScore = Math.min(100, Math.max(0, performanceScore));
    scalabilityScore = Math.min(100, Math.max(0, scalabilityScore));
    maintainabilityScore = Math.min(100, Math.max(0, maintainabilityScore));
    complexityScore = Math.min(100, Math.max(0, complexityScore));

    // Calculate Overall Quality Score (weighted average)
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
        reason: rationaleMap.Security.reasons.join(' • ') || 'Standard security baseline established.',
        recommendations: rationaleMap.Security.recommendations.length > 0 ? rationaleMap.Security.recommendations : ['Ensure secrets and signing keys are rotated via Vault.'],
      },
      {
        category: 'Architecture Score',
        score: architectureScore,
        reason: rationaleMap.Architecture.reasons.join(' • ') || 'Architecture layer separation active.',
        recommendations: rationaleMap.Architecture.recommendations.length > 0 ? rationaleMap.Architecture.recommendations : ['Maintain strict boundary rules preventing domain from referencing infrastructure.'],
      },
      {
        category: 'Performance Score',
        score: performanceScore,
        reason: rationaleMap.Performance.reasons.join(' • ') || 'Standard response latency targets met.',
        recommendations: ['Utilize connection pooling and async non-blocking query execution.'],
      },
      {
        category: 'Scalability Score',
        score: scalabilityScore,
        reason: rationaleMap.Scalability.reasons.join(' • ') || 'Stateless API architecture ready for auto-scaling.',
        recommendations: ['Deploy behind Cloud Run or Kubernetes HPA auto-scaler.'],
      },
      {
        category: 'Maintainability Score',
        score: maintainabilityScore,
        reason: rationaleMap.Maintainability.reasons.join(' • ') || 'Strong typing and modular folder structure in place.',
        recommendations: ['Enforce unit tests for all domain logic handlers.'],
      },
      {
        category: 'Complexity Score',
        score: complexityScore,
        reason: `System complexity rating is ${complexityScore}/100 based on selected ${selectedStack?.name || 'stack'} and ${activeFeatures.length} active feature modules.`,
        recommendations: ['Keep handler functions concise and under 50 lines.'],
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
