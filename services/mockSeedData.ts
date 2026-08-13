import {
  Organization,
  Workspace,
  TechStack,
  ProfileSecurity,
  ProfileDatabase,
  ProfileDocker,
  ProfileCache,
  ProfileLogging,
  RuleSet,
  FeatureManifest,
  Blueprint,
  Template,
  Project,
  DecisionLogItem,
  AIProviderConfig,
  PromptTemplate,
} from '../types/factory';
import { BlueprintService } from './blueprintService';

// Phase 1 (see PLAN.md): fabricated Organization/Workspace history removed.
// The app now starts genuinely empty — no invented orgs/workspaces are seeded.
export const initialOrganizations: Organization[] = [];

export const initialWorkspaces: Workspace[] = [];

export const initialTechStacks: TechStack[] = [
  {
    id: 'stack-dotnet9',
    name: '.NET 9 Enterprise Web API',
    language: 'csharp',
    framework: '.NET 9 ASP.NET Core',
    packageManager: 'NuGet',
    testingFramework: 'xUnit + FluentAssertions + Moq',
    targetRuntime: 'Linux x64 (Container / Cloud Run)',
    description: 'High-performance .NET 9 Web API architecture optimized for enterprise cloud deployment',
  },
  {
    id: 'stack-java-spring',
    name: 'Java 21 Spring Boot 3.3 Microservice',
    language: 'java',
    framework: 'Spring Boot 3.3 + Spring Cloud',
    packageManager: 'Maven / Gradle',
    testingFramework: 'JUnit 5 + Mockito + Testcontainers',
    targetRuntime: 'JVM / GraalVM Native Image',
    description: 'Enterprise Java 21 Spring Boot microservices with Spring Security, JPA Hibernate, and Resilience4j',
  },
  {
    id: 'stack-gofiber',
    name: 'Go Fiber & gRPC Service Mesh',
    language: 'go',
    framework: 'Go 1.22 + Fiber v2 + gRPC',
    packageManager: 'Go Modules',
    testingFramework: 'testing + stretchr/testify',
    targetRuntime: 'Alpine Linux Container',
    description: 'Ultra low-latency Go microservice stack with gRPC, REST handlers, and zero-allocation routing',
  },
  {
    id: 'stack-python-fastapi',
    name: 'Python 3.12 FastAPI AI & Microservice',
    language: 'python',
    framework: 'FastAPI + Pydantic v2 + AsyncIO',
    packageManager: 'Poetry / uv',
    testingFramework: 'Pytest + HTTPX',
    targetRuntime: 'Python 3.12 Slim Container',
    description: 'High-performance asynchronous Python microservice architecture for AI pipelines and data services',
  },
  {
    id: 'stack-node-nestjs',
    name: 'Node.js 22 NestJS Enterprise Backend',
    language: 'typescript',
    framework: 'NestJS 10 + Express / Fastify',
    packageManager: 'pnpm / npm',
    testingFramework: 'Jest + Supertest',
    targetRuntime: 'Node.js 22 LTS / Docker',
    description: 'Modular TypeScript architecture with Dependency Injection, Swagger OpenAPI, and TypeORM / Prisma',
  },
  {
    id: 'stack-rust-axum',
    name: 'Rust Axum High-Performance Engine',
    language: 'rust',
    framework: 'Rust 2021 + Axum + Tokio',
    packageManager: 'Cargo',
    testingFramework: 'cargo test + nextest',
    targetRuntime: 'Distroless / Scratch Container',
    description: 'Memory-safe, zero-cost abstraction Rust web engine delivering sub-millisecond API responses',
  },
  {
    id: 'stack-nextjs',
    name: 'Next.js 15 App Router Full-Stack',
    language: 'typescript',
    framework: 'Next.js 15 + React 19',
    packageManager: 'pnpm / npm',
    testingFramework: 'Vitest + Playwright',
    targetRuntime: 'Node.js 22 LTS / Edge Runtime',
    description: 'Modern server-first web application architecture with TypeScript, Tailwind v4, and React Server Components',
  },
  {
    id: 'stack-kotlin-ktor',
    name: 'Kotlin 2.0 Ktor Async Microservice',
    language: 'kotlin',
    framework: 'Kotlin Ktor 2.3 + Coroutines',
    packageManager: 'Gradle Kotlin DSL',
    testingFramework: 'Kotest + Mockk',
    targetRuntime: 'JVM / GraalVM Native',
    description: 'Lightweight, fully asynchronous Kotlin backend powered by Coroutines and kotlinx.serialization',
  },
  {
    id: 'stack-flutter',
    name: 'Flutter 3.22 Multiplatform App',
    language: 'dart',
    framework: 'Flutter 3.22 + Bloc / Riverpod',
    packageManager: 'pub',
    testingFramework: 'flutter_test + mocktail',
    targetRuntime: 'Web / iOS / Android / Desktop',
    description: 'Single codebase multiplatform client architecture with clean state management and responsive UI',
  },
];

export const initialSecurityProfiles: ProfileSecurity[] = [
  {
    id: 'sec-prof-jwt',
    name: 'Enterprise JWT OAuth2 Bearer',
    jwtIssuer: 'https://auth.acme-enterprise.internal',
    tokenLifetimeMinutes: 60,
    enableCors: true,
    allowedOrigins: ['https://app.acme.com', 'https://dev.acme.com'],
    enableRateLimiting: true,
    rateLimitPermitLimit: 100,
  },
];

export const initialDatabaseProfiles: ProfileDatabase[] = [
  {
    id: 'db-prof-pg',
    name: 'PostgreSQL 16 + Entity Framework Core',
    provider: 'PostgreSQL',
    orm: 'Entity Framework Core',
    enableMigrations: true,
    enableAuditing: true,
    connectionStringName: 'DefaultConnection',
  },
  {
    id: 'db-prof-mssql',
    name: 'SQL Server 2022 + EF Core',
    provider: 'SQL Server',
    orm: 'Entity Framework Core',
    enableMigrations: true,
    enableAuditing: true,
    connectionStringName: 'SqlServerConnection',
  },
];

export const initialDockerProfiles: ProfileDocker[] = [
  {
    id: 'docker-prof-prod',
    name: 'Multi-Stage Production Container',
    baseImage: 'mcr.microsoft.com/dotnet/aspnet:9.0-alpine',
    multiStage: true,
    exposePorts: [8080, 8081],
    includeDockerCompose: true,
    healthCheckEndpoint: '/healthz',
  },
];

export const initialCacheProfiles: ProfileCache[] = [
  {
    id: 'cache-prof-redis',
    name: 'Redis Cluster Distributed Cache',
    provider: 'Redis',
    defaultTtlMinutes: 30,
    enableDistributedLock: true,
  },
];

export const initialLoggingProfiles: ProfileLogging[] = [
  {
    id: 'log-prof-opentelemetry',
    name: 'Serilog + OpenTelemetry + Jaeger',
    provider: 'OpenTelemetry',
    minLevel: 'Information',
    structuredJson: true,
    sinkToConsole: true,
    sinkToSeqOrJaeger: true,
  },
];

export const initialRuleSets: RuleSet[] = [
  {
    id: 'ruleset-clean-arch',
    name: 'Strict Clean Architecture & Security Standards',
    description: 'Enforces architectural boundary separation, interface abstraction, and coding best practices.',
    rules: [
      {
        id: 'rule-1',
        name: 'Domain Cannot Reference Infrastructure',
        description: 'Domain layer must remain purely POCO/Entities without external framework dependencies.',
        category: 'dependency',
        severity: 'error',
        expression: 'Projects["Domain"].References.Includes("Infrastructure") == false',
        isEnabled: true,
        remediation: 'Remove ProjectReference to Infrastructure from Domain.csproj and use interfaces in Application layer.',
      },
      {
        id: 'rule-2',
        name: 'Controllers Inherit BaseApiController',
        description: 'All API Controllers must extend the enterprise BaseApiController to enforce unified error handling and route logging.',
        category: 'code-standard',
        severity: 'error',
        expression: 'Controllers.All(c => c.BaseClass == "BaseApiController")',
        isEnabled: true,
        remediation: 'Inherit from BaseApiController instead of ControllerBase.',
      },
      {
        id: 'rule-3',
        name: 'Repositories Must Be Interfaces in Application/Core',
        description: 'Data repositories must define interfaces in Core/Application and implementations in Infrastructure.',
        category: 'dependency',
        severity: 'error',
        expression: 'Repositories.InterfacesIn("Application") && Repositories.ImplementationsIn("Infrastructure")',
        isEnabled: true,
        remediation: 'Define IRepository<T> in Core and implement Repository<T> in Infrastructure.',
      },
      {
        id: 'rule-4',
        name: 'Prohibit System DateTime.Now',
        description: 'System.DateTime.Now breaks unit test determinism. Mandatory use of TimeProvider or IDateTimeService.',
        category: 'code-standard',
        severity: 'warning',
        expression: 'Code.Contains("DateTime.Now") == false',
        isEnabled: true,
        remediation: 'Inject TimeProvider or ITimeProvider instead of calling DateTime.Now directly.',
      },
      {
        id: 'rule-5',
        name: 'No Direct Console Output',
        description: 'Console.WriteLine bypasses structured log formatters and tracing correlation IDs.',
        category: 'security',
        severity: 'warning',
        expression: 'Code.Contains("Console.WriteLine") == false',
        isEnabled: true,
        remediation: 'Inject ILogger<T> and call _logger.LogInformation(...) instead.',
      },
      {
        id: 'rule-6',
        name: 'Health Check Endpoint Mandatory for Docker',
        description: 'Containers deployed without health check probes risk silent failures in Kubernetes / Cloud Run.',
        category: 'performance',
        severity: 'error',
        expression: 'FeatureActive("feat-docker") => FeatureActive("feat-healthchecks")',
        isEnabled: true,
        remediation: 'Activate the Health Checks & Diagnostics feature manifest.',
      },
    ],
  },
];

export const initialFeatureManifests: FeatureManifest[] = [
  {
    id: 'feat-docker',
    name: 'Docker Containerization',
    description: 'Provides Docker container packaging for deployment across Kubernetes, Cloud Run, and container instances.',
    category: 'DevOps',
    tags: ['docker', 'containers', 'devops', 'deployment'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-env-vars', 'feat-healthchecks', 'feat-docker-compose'],
    conflictingFeatures: [],
    questions: [
      {
        id: 'base_os',
        question: 'Container Base OS Image',
        type: 'select',
        options: ['Alpine Linux (Smallest)', 'Debian Slim (Standard)', 'Distroless (Hardened)'],
        defaultValue: 'Alpine Linux (Smallest)',
        impactDescription: 'Alpine reduces container size by ~60MB but requires musl libc compatibility.',
      },
    ],
    configuration: { baseOS: 'Alpine Linux (Smallest)', exposePort: 8080 },
    generatedFiles: [
      {
        path: 'Dockerfile',
        language: 'dockerfile',
        templateSnippet: `# Multi-Stage Dockerfile generated by Software Factory
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS final
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENTRYPOINT ["dotnet", "App.Api.dll"]`,
        description: 'Optimized multi-stage Docker build file',
      },
      {
        path: '.dockerignore',
        language: 'plaintext',
        templateSnippet: `bin/
obj/
.git/
.vs/
.idea/
appsettings.Development.json`,
        description: 'Docker build context exclusions',
      },
    ],
    generatedPackages: [],
    generatedProjects: [],
    documentation: 'Provides Docker multi-stage builds. Automatically enables non-root user execution for security compliance.',
    aiRecommendations: [
      'Pair Docker with Health Checks to ensure Cloud Run automatically restarts unhealthy instances.',
      'Utilize Docker Compose for local multi-container development with PostgreSQL and Redis.',
    ],
    securityWarnings: ['Ensure appsettings.json secrets are not baked into the Docker image layer history.'],
    architectureImpact: 'Decouples service execution from host OS. Enables horizontal auto-scaling.',
    performanceImpact: 'Slight initial container spin-up time; zero runtime overhead.',
    maintainabilityImpact: 'Ensures identical execution environment in local dev, QA, and production.',
    bestPractices: [
      'Use multi-stage builds to exclude build tools from production runtime image.',
      'Run as non-root user appuser (UID 10001).',
    ],
    impactScores: { security: 15, architecture: 20, performance: 10, scalability: 25, maintainability: 20, complexity: 10 },
  },

  {
    id: 'feat-env-vars',
    name: 'Environment Variables & Config Provider',
    description: 'Strongly-typed environment variable loader and config validator.',
    category: 'Infrastructure',
    tags: ['configuration', 'env', 'infrastructure'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { envPrefix: 'APP_' },
    generatedFiles: [
      {
        path: '.env.example',
        language: 'env',
        templateSnippet: `# Generated Environment Config Example
APP_ENV=Production
APP_PORT=8080
APP_DATABASE_URL=Host=localhost;Database=appdb;Username=appuser;Password=secret
APP_JWT_SECRET=your_super_secret_key_minimum_32_characters_long`,
        description: 'Sample environment variables configuration template',
      },
    ],
    generatedPackages: [{ name: 'Microsoft.Extensions.Configuration.EnvironmentVariables', version: '9.0.0', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'API'],
    documentation: 'Loads runtime variables with strict startup validation.',
    aiRecommendations: ['Always maintain sync between .env.example and startup validation schemas.'],
    securityWarnings: ['Never commit actual credentials to source repositories.'],
    architectureImpact: 'Enforces Twelve-Factor App config isolation.',
    performanceImpact: 'Negligible (evaluated once at startup).',
    maintainabilityImpact: 'Simplifies environment switches between local, staging, and production.',
    bestPractices: ['Validate configuration options on app startup using IValidateOptions<T>.'],
    impactScores: { security: 20, architecture: 15, performance: 5, scalability: 15, maintainability: 20, complexity: 5 },
  },

  {
    id: 'feat-healthchecks',
    name: 'Health Checks & Diagnostics',
    description: 'Provides /healthz, /readyz, and /livez endpoints for liveness & readiness probes.',
    category: 'Observability',
    tags: ['health', 'diagnostics', 'k8s', 'monitoring'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { endpoint: '/healthz' },
    generatedFiles: [
      {
        path: 'src/Infrastructure/Diagnostics/HealthCheckExtensions.cs',
        language: 'csharp',
        templateSnippet: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Infrastructure.Diagnostics;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddCustomHealthChecks(this IServiceCollection services, string connectionString)
    {
        services.AddHealthChecks()
            .AddNpgSql(connectionString, name: "database", failureStatus: HealthStatus.Unhealthy)
            .AddCheck("self", () => HealthCheckResult.Healthy(), tags: new[] { "live" });

        return services;
    }
}`,
        description: 'Health Check DI registration module',
      },
    ],
    generatedPackages: [{ name: 'AspNetCore.HealthChecks.NpgSql', version: '9.0.0', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'API'],
    documentation: 'Exposes HTTP health status endpoints for load balancers and container orchestrators.',
    aiRecommendations: ['Separate readiness checks (database connected) from liveness checks (app responsive).'],
    securityWarnings: ['Do not expose internal stack traces or database server names in unauthenticated health check responses.'],
    architectureImpact: 'Enables self-healing container orchestrations.',
    performanceImpact: 'Sub-millisecond probe overhead.',
    maintainabilityImpact: 'Simplifies automated uptime verification.',
    bestPractices: ['Keep health probe timeout under 2 seconds.'],
    impactScores: { security: 10, architecture: 20, performance: 10, scalability: 20, maintainability: 15, complexity: 5 },
  },

  {
    id: 'feat-docker-compose',
    name: 'Docker Compose Local Infrastructure',
    description: 'Generates docker-compose.yml for running local dependencies (PostgreSQL, Redis, RabbitMQ, Seq).',
    category: 'DevOps',
    tags: ['docker', 'compose', 'local-dev'],
    dependencies: ['feat-docker'],
    optionalDependencies: [],
    recommendedDependencies: ['feat-secrets'],
    conflictingFeatures: [],
    questions: [],
    configuration: { includeDatabase: true, includeCache: true },
    generatedFiles: [
      {
        path: 'docker-compose.yml',
        language: 'yaml',
        templateSnippet: `version: '3.8'
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=appdb;Username=appuser;Password=appsecret
      - Redis__ConnectionString=redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: appsecret
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"`,
        description: 'Multi-container local development compose file',
      },
    ],
    generatedPackages: [],
    generatedProjects: [],
    documentation: 'Spins up all backing services with a single `docker compose up` command.',
    aiRecommendations: ['Use Docker volumes for persistent Postgres database data during local development.'],
    securityWarnings: ['Never use default passwords from docker-compose.yml in live environments.'],
    architectureImpact: 'Standardizes local dependency setup across team developers.',
    performanceImpact: 'Zero production impact.',
    maintainabilityImpact: 'Eliminates "works on my machine" dependency mismatches.',
    bestPractices: ['Keep local ports aligned with standard service defaults.'],
    impactScores: { security: 10, architecture: 15, performance: 10, scalability: 15, maintainability: 25, complexity: 10 },
  },

  {
    id: 'feat-secrets',
    name: 'Secrets Management & Vault Integration',
    description: 'Integrates secret providers (HashiCorp Vault / Azure Key Vault / GCP Secret Manager).',
    category: 'Security',
    tags: ['secrets', 'vault', 'security'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { provider: 'Azure Key Vault' },
    generatedFiles: [
      {
        path: 'src/Infrastructure/Security/SecretManager.cs',
        language: 'csharp',
        templateSnippet: `namespace Infrastructure.Security;

public interface ISecretManager
{
    Task<string> GetSecretAsync(string secretName);
}`,
        description: 'Cloud Secret Manager wrapper contract',
      },
    ],
    generatedPackages: [{ name: 'Azure.Identity', version: '1.12.0', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'Application'],
    documentation: 'Fetches sensitive connection strings and private keys securely at runtime.',
    aiRecommendations: ['Cache secrets in-memory with TTL to reduce external Vault API calls.'],
    securityWarnings: ['Never log secret values or include them in exception messages.'],
    architectureImpact: 'Removes secrets entirely from source code and config files.',
    performanceImpact: 'Initial latency on key fetch (mitigated by in-memory cache).',
    maintainabilityImpact: 'Allows immediate secret rotation without redeploying applications.',
    bestPractices: ['Use Managed Identity / Workload Identity instead of hardcoded API tokens.'],
    impactScores: { security: 35, architecture: 20, performance: 0, scalability: 20, maintainability: 20, complexity: 15 },
  },

  {
    id: 'feat-dockerfile',
    name: 'Dockerfile Hardened Build',
    description: 'Generates non-root, hardened Dockerfile with security scanning annotations.',
    category: 'DevOps',
    tags: ['docker', 'security'],
    dependencies: ['feat-docker'],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { nonRootUser: true },
    generatedFiles: [],
    generatedPackages: [],
    generatedProjects: [],
    documentation: 'Ensures container security compliance.',
    aiRecommendations: ['Scan image against Trivy or Grype in CI/CD.'],
    securityWarnings: ['Do not run as root inside containers.'],
    architectureImpact: 'Improves container isolation.',
    performanceImpact: 'None.',
    maintainabilityImpact: 'Complies with enterprise security policies.',
    bestPractices: ['Use distroless or minimal Alpine bases.'],
    impactScores: { security: 25, architecture: 10, performance: 5, scalability: 15, maintainability: 15, complexity: 5 },
  },

  {
    id: 'feat-jwt-auth',
    name: 'JWT Authentication & Role Claims',
    description: 'Implements OAuth2 JWT Bearer authentication, claims authorization, and refresh token pipeline.',
    category: 'Security',
    tags: ['auth', 'jwt', 'security'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-swagger'],
    conflictingFeatures: [],
    questions: [],
    configuration: { tokenExpirationMinutes: 60 },
    generatedFiles: [
      {
        path: 'src/Infrastructure/Auth/JwtTokenGenerator.cs',
        language: 'csharp',
        templateSnippet: `using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Auth;

public class JwtTokenGenerator
{
    public string GenerateToken(string userId, string email, IEnumerable<string> roles)
    {
        // JWT generation logic
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
    }
}`,
        description: 'JWT Bearer token generation utility',
      },
    ],
    generatedPackages: [{ name: 'Microsoft.AspNetCore.Authentication.JwtBearer', version: '9.0.0', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'API'],
    documentation: 'Secures REST API endpoints with token validation middleware.',
    aiRecommendations: ['Store refresh tokens in Redis with automatic TTL expiration.'],
    securityWarnings: ['Ensure secret signing key is at least 256-bit (32 bytes) long.'],
    architectureImpact: 'Stateless authentication scaling effortlessly across container nodes.',
    performanceImpact: 'Cryptographic token validation overhead per HTTP request (~0.2ms).',
    maintainabilityImpact: 'Standardized RBAC claims policy control across endpoints.',
    bestPractices: ['Validate issuer, audience, lifetime, and signing key on every request.'],
    impactScores: { security: 35, architecture: 25, performance: 5, scalability: 30, maintainability: 20, complexity: 15 },
  },

  {
    id: 'feat-postgres-ef',
    name: 'PostgreSQL & Entity Framework Core',
    description: 'Database persistence layer using EF Core, Npgsql, migration scripts, and audit interceptors.',
    category: 'Database',
    tags: ['database', 'postgres', 'efcore', 'orm'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-healthchecks', 'feat-env-vars'],
    conflictingFeatures: ['feat-mssql-ef'],
    questions: [],
    configuration: { autoMigrateOnStartup: false },
    generatedFiles: [
      {
        path: 'src/Infrastructure/Persistence/ApplicationDbContext.cs',
        language: 'csharp',
        templateSnippet: `using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}`,
        description: 'Entity Framework Core DB Context',
      },
    ],
    generatedPackages: [
      { name: 'Npgsql.EntityFrameworkCore.PostgreSQL', version: '9.0.0', packageManager: 'nuget' },
      { name: 'Microsoft.EntityFrameworkCore.Tools', version: '9.0.0', packageManager: 'nuget' },
    ],
    generatedProjects: ['Infrastructure', 'Core'],
    documentation: 'Enterprise relational persistence module using PostgreSQL.',
    aiRecommendations: ['Use EF Core DbContext pooling for high-throughput API workloads.'],
    securityWarnings: ['Never format SQL strings manually; rely on EF Core parameterized queries to prevent SQL injection.'],
    architectureImpact: 'Provides repository abstraction over relational database storage.',
    performanceImpact: 'Optimized query compilation with connection pooling.',
    maintainabilityImpact: 'Code-first migrations track database schema changes in git.',
    bestPractices: ['Use AsNoTracking() for read-only query scenarios.'],
    impactScores: { security: 20, architecture: 25, performance: 15, scalability: 25, maintainability: 25, complexity: 15 },
  },

  {
    id: 'feat-redis-cache',
    name: 'Redis Distributed Cache',
    description: 'High-speed distributed cache layer for API responses, user sessions, and rate limiting.',
    category: 'Infrastructure',
    tags: ['cache', 'redis', 'performance'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-docker-compose'],
    conflictingFeatures: [],
    questions: [],
    configuration: { defaultTtl: 1800 },
    generatedFiles: [
      {
        path: 'src/Infrastructure/Caching/RedisCacheService.cs',
        language: 'csharp',
        templateSnippet: `using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Infrastructure.Caching;

public class RedisCacheService
{
    private readonly IDistributedCache _cache;
    public RedisCacheService(IDistributedCache cache) => _cache = cache;

    public async Task<T?> GetAsync<T>(string key)
    {
        var data = await _cache.GetStringAsync(key);
        return data == null ? default : JsonSerializer.Deserialize<T>(data);
    }
}`,
        description: 'Distributed cache abstraction service',
      },
    ],
    generatedPackages: [{ name: 'Microsoft.Extensions.Caching.StackExchangeRedis', version: '9.0.0', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'Application'],
    documentation: 'Reduces database load by caching frequently requested data.',
    aiRecommendations: ['Implement Cache-Aside pattern for database query caching.'],
    securityWarnings: ['Enable TLS and password authentication for Redis production connection.'],
    architectureImpact: 'Decouples state storage from application memory.',
    performanceImpact: 'Dramatically improves API response times (10x - 50x faster for cached data).',
    maintainabilityImpact: 'Standardized caching interface.',
    bestPractices: ['Set explicit TTL on every cached item to prevent memory exhaustion.'],
    impactScores: { security: 10, architecture: 20, performance: 35, scalability: 35, maintainability: 15, complexity: 10 },
  },

  {
    id: 'feat-opentelemetry',
    name: 'OpenTelemetry & Distributed Tracing',
    description: 'Exports metrics, traces, and structured logs to OTLP collectors (Jaeger, Prometheus, Datadog).',
    category: 'Observability',
    tags: ['opentelemetry', 'tracing', 'metrics', 'observability'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { serviceName: 'PaymentService' },
    generatedFiles: [],
    generatedPackages: [
      { name: 'OpenTelemetry.Extensions.Hosting', version: '1.9.0', packageManager: 'nuget' },
      { name: 'OpenTelemetry.Instrumentation.AspNetCore', version: '1.9.0', packageManager: 'nuget' },
    ],
    generatedProjects: ['Infrastructure', 'API'],
    documentation: 'End-to-end distributed tracing across microservices.',
    aiRecommendations: ['Inject W3C traceparent headers across HTTP and gRPC service calls.'],
    securityWarnings: ['Scrub sensitive user identifiers (PNN, credit cards) from span attributes.'],
    architectureImpact: 'Full observability across distributed service mesh.',
    performanceImpact: 'Low overhead (~1-2% CPU overhead for tracing export).',
    maintainabilityImpact: 'Allows instant diagnosis of distributed system bottlenecks.',
    bestPractices: ['Use sampling ratio in high-volume production traffic (e.g. 10% sampling).'],
    impactScores: { security: 15, architecture: 25, performance: 10, scalability: 30, maintainability: 30, complexity: 15 },
  },

  {
    id: 'feat-mediatr-cqrs',
    name: 'MediatR CQRS Architecture',
    description: 'Command Query Responsibility Segregation pattern with pipeline behaviors for validation and logging.',
    category: 'Architecture',
    tags: ['cqrs', 'mediatr', 'architecture', 'clean-code'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-fluent-validation'],
    conflictingFeatures: [],
    questions: [],
    configuration: { enablePipelineValidation: true },
    generatedFiles: [
      {
        path: 'src/Application/Common/Behaviors/ValidationBehavior.cs',
        language: 'csharp',
        templateSnippet: `using FluentValidation;
using MediatR;

namespace Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators) => _validators = validators;

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (_validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var failures = _validators.Select(v => v.Validate(context)).SelectMany(result => result.Errors).Where(f => f != null).ToList();
            if (failures.Count != 0) throw new ValidationException(failures);
        }
        return await next();
    }
}`,
        description: 'MediatR validation pipeline behavior',
      },
    ],
    generatedPackages: [{ name: 'MediatR', version: '12.4.1', packageManager: 'nuget' }],
    generatedProjects: ['Application', 'Core'],
    documentation: 'Separates read models (Queries) from write operations (Commands).',
    aiRecommendations: ['Use MediatR pipeline behaviors to enforce validation and transaction boundaries automatically.'],
    securityWarnings: [],
    architectureImpact: 'Enforces strict single-responsibility principles and decoupled handlers.',
    performanceImpact: 'Sub-millisecond dynamic dispatch overhead.',
    maintainabilityImpact: 'Extremely easy to add new features without modifying existing code (Open-Closed Principle).',
    bestPractices: ['Keep Commands immutable records with Result<T> return types.'],
    impactScores: { security: 10, architecture: 35, performance: 10, scalability: 25, maintainability: 35, complexity: 15 },
  },

  {
    id: 'feat-fluent-validation',
    name: 'FluentValidation Pipeline',
    description: 'Strongly-typed validation rules for request DTOs with automated HTTP 400 error responses.',
    category: 'API',
    tags: ['validation', 'api', 'input-sanitization'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { autoDiscoverValidators: true },
    generatedFiles: [],
    generatedPackages: [{ name: 'FluentValidation.DependencyInjectionExtensions', version: '11.10.0', packageManager: 'nuget' }],
    generatedProjects: ['Application'],
    documentation: 'Validates input data before command handlers execute.',
    aiRecommendations: ['Chain validation rules with .WithMessage() for user-friendly error details.'],
    securityWarnings: ['Prevents malicious payloads and malformed data from touching database layers.'],
    architectureImpact: 'Keeps validation logic separated from domain entities and API controllers.',
    performanceImpact: 'Sub-millisecond validation time.',
    maintainabilityImpact: 'Centralized validation logic in DTO validator classes.',
    bestPractices: ['Write unit tests for every validator rule.'],
    impactScores: { security: 25, architecture: 20, performance: 10, scalability: 15, maintainability: 25, complexity: 5 },
  },

  {
    id: 'feat-swagger',
    name: 'Swagger / OpenAPI Specification',
    description: 'Generates interactive API documentation UI with OAuth2 Bearer authorization support.',
    category: 'API',
    tags: ['swagger', 'openapi', 'documentation'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: { title: 'Enterprise Core API', version: 'v1' },
    generatedFiles: [],
    generatedPackages: [{ name: 'Swashbuckle.AspNetCore', version: '7.0.0', packageManager: 'nuget' }],
    generatedProjects: ['API'],
    documentation: 'Exposes /swagger UI for testing and frontend SDK generation.',
    aiRecommendations: ['Hide Swagger UI in production environments or require admin authentication.'],
    securityWarnings: ['Disable Swagger in public production if internal endpoint schemas should remain private.'],
    architectureImpact: 'Serves as single source of truth for REST API contracts.',
    performanceImpact: 'Zero runtime overhead (generated at application startup).',
    maintainabilityImpact: 'Enables frontend developers to integrate APIs seamlessly.',
    bestPractices: ['Annotate API response types with [ProducesResponseType].'],
    impactScores: { security: 10, architecture: 15, performance: 5, scalability: 15, maintainability: 25, complexity: 5 },
  },

  {
    id: 'feat-rate-limiting',
    name: 'API Rate Limiting Middleware',
    description: 'Protects REST API endpoints against denial-of-service (DoS) and brute-force attacks.',
    category: 'Security',
    tags: ['ratelimit', 'security', 'api'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-redis-cache'],
    conflictingFeatures: [],
    questions: [],
    configuration: { permitLimit: 100, windowSeconds: 60 },
    generatedFiles: [],
    generatedPackages: [],
    generatedProjects: ['API'],
    documentation: 'Restricts request rate per IP or authenticated user token.',
    aiRecommendations: ['Use sliding window algorithm for smoother traffic shaping.'],
    securityWarnings: ['Crucial protection against automated token brute-force attempts.'],
    architectureImpact: 'Edge defense against abusive traffic spikes.',
    performanceImpact: 'Minimal cache lookup time per request.',
    maintainabilityImpact: 'Configurable policies per route group.',
    bestPractices: ['Return HTTP 429 Too Many Requests with Retry-After headers.'],
    impactScores: { security: 30, architecture: 15, performance: 10, scalability: 25, maintainability: 15, complexity: 10 },
  },

  {
    id: 'feat-rabbitmq-bus',
    name: 'RabbitMQ Event Bus & MassTransit',
    description: 'Asynchronous event-driven messaging with retry policies and dead-letter queues.',
    category: 'Messaging',
    tags: ['rabbitmq', 'events', 'masstransit', 'async'],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: ['feat-docker-compose'],
    conflictingFeatures: [],
    questions: [],
    configuration: { retryCount: 3 },
    generatedFiles: [],
    generatedPackages: [{ name: 'MassTransit.RabbitMQ', version: '8.2.5', packageManager: 'nuget' }],
    generatedProjects: ['Infrastructure', 'Application'],
    documentation: 'Publishes domain events asynchronously to decoupled consumer microservices.',
    aiRecommendations: ['Combine with Outbox Pattern to guarantee message delivery with database transactions.'],
    securityWarnings: ['Encrypt sensitive payload data in message queues.'],
    architectureImpact: 'Enables event-driven, loosely-coupled microservices architecture.',
    performanceImpact: 'Offloads slow background processing from HTTP request threads.',
    maintainabilityImpact: 'Decouples producer and consumer lifecycles.',
    bestPractices: ['Ensure all event consumers are idempotent.'],
    impactScores: { security: 15, architecture: 35, performance: 25, scalability: 35, maintainability: 20, complexity: 20 },
  },
];

export const initialBlueprints: Blueprint[] = [
  {
    id: 'bp-clean-enterprise',
    name: 'Enterprise .NET 9 Clean Architecture Blueprint',
    description: 'Standard enterprise blueprint with Core Domain, Application layer, Infrastructure, and REST API',
    architectureStyle: 'CleanArchitecture',
    techStackId: 'stack-dotnet9',
    projects: [
      { id: 'proj-core', name: 'App.Core', type: 'Core', references: [], description: 'Domain entities, value objects, domain events, and core exceptions' },
      { id: 'proj-app', name: 'App.Application', type: 'Application', references: ['proj-core'], description: 'Use cases, CQRS commands/queries, interfaces, and DTOs' },
      { id: 'proj-infra', name: 'App.Infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Database EF Core, Redis caching, Auth, and External integrations' },
      { id: 'proj-api', name: 'App.Api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Controllers, middleware, Swagger, and DI composition root' },
      { id: 'proj-tests', name: 'App.UnitTests', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Unit tests with xUnit and Moq' },
    ],
    featureIds: [
      'feat-docker',
      'feat-env-vars',
      'feat-healthchecks',
      'feat-docker-compose',
      'feat-jwt-auth',
      'feat-postgres-ef',
      'feat-redis-cache',
      'feat-opentelemetry',
      'feat-mediatr-cqrs',
      'feat-fluent-validation',
      'feat-swagger',
      'feat-rate-limiting',
    ],
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
];

export const initialTemplates: Template[] = [
  {
    id: 'tmpl-clean-dotnet9',
    name: '.NET 9 Clean Architecture Enterprise Standard',
    description: 'Production-ready enterprise solution blueprint with CQRS, PostgreSQL, Redis, Docker, and OpenTelemetry',
    category: 'Enterprise Microservices',
    blueprint: initialBlueprints[0],
    version: '2.4.0',
    author: 'Software Factory Architecture Board',
    updatedAt: '2026-07-28',
    tags: ['.NET 9', 'Clean Architecture', 'CQRS', 'PostgreSQL', 'Redis', 'Docker'],
    isOfficial: true,
    downloadCount: 1420,
  },
  {
    id: 'tmpl-java-spring',
    name: 'Java 21 Spring Boot 3.3 Enterprise Blueprint',
    description: 'Enterprise Java Spring Boot microservice with Spring Security OAuth2, JPA Hibernate, PostgreSQL, and Docker',
    category: 'Enterprise Microservices',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-java-spring',
      name: 'Java Spring Boot Blueprint',
      techStackId: 'stack-java-spring',
      architectureStyle: 'Hexagonal',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-java-spring', 'Hexagonal'),
    },
    version: '3.3.0',
    author: 'Java Enterprise Guild',
    updatedAt: '2026-08-02',
    tags: ['Java 21', 'Spring Boot 3', 'Hexagonal', 'Hibernate', 'PostgreSQL', 'Maven'],
    isOfficial: true,
    downloadCount: 1850,
  },
  {
    id: 'tmpl-node-nestjs',
    name: 'Node.js 22 NestJS Modular API Architecture',
    description: 'Enterprise TypeScript API with Dependency Injection, Swagger, Prisma ORM, JWT Auth, and Redis',
    category: 'Enterprise Microservices',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-node-nestjs',
      name: 'NestJS Modular Architecture Blueprint',
      techStackId: 'stack-node-nestjs',
      architectureStyle: 'ModularMonolith',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs', 'ModularMonolith'),
    },
    version: '2.1.0',
    author: 'Node.js Core Team',
    updatedAt: '2026-08-01',
    tags: ['TypeScript', 'NestJS', 'Prisma', 'PostgreSQL', 'Swagger', 'Redis'],
    isOfficial: true,
    downloadCount: 1980,
  },
  {
    id: 'tmpl-gofiber-mesh',
    name: 'Go Fiber & gRPC High-Throughput Service',
    description: 'Ultra-low latency microservice template built with Go 1.22, Fiber, gRPC, and PostgreSQL',
    category: 'High Performance API',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-go-mesh',
      name: 'Go Fiber gRPC Blueprint',
      techStackId: 'stack-gofiber',
      architectureStyle: 'Microservices',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-gofiber', 'Microservices'),
    },
    version: '1.8.0',
    author: 'Cloud Native Engineering',
    updatedAt: '2026-07-20',
    tags: ['Go', 'gRPC', 'Fiber', 'PostgreSQL', 'Microservices'],
    isOfficial: true,
    downloadCount: 890,
  },
  {
    id: 'tmpl-python-fastapi',
    name: 'Python 3.12 FastAPI AI & Data Pipeline Microservice',
    description: 'Asynchronous Python API with Pydantic v2, Async SQLAlchemy, Gemini AI integration, and Pytest',
    category: 'AI & Data Engineering',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-python-fastapi',
      name: 'FastAPI AI Pipeline Blueprint',
      techStackId: 'stack-python-fastapi',
      architectureStyle: 'Microservices',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-python-fastapi', 'Microservices'),
    },
    version: '1.5.0',
    author: 'AI Engineering Lab',
    updatedAt: '2026-07-31',
    tags: ['Python', 'FastAPI', 'Pydantic', 'AsyncIO', 'Gemini AI', 'Poetry'],
    isOfficial: true,
    downloadCount: 1620,
  },
  {
    id: 'tmpl-rust-axum',
    name: 'Rust Axum Ultra Low-Latency Service Engine',
    description: 'Zero-cost memory safe Tokio/Axum microservice with SQLx PostgreSQL and OpenTelemetry',
    category: 'High Performance API',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-rust-axum',
      name: 'Rust Axum Engine Blueprint',
      techStackId: 'stack-rust-axum',
      architectureStyle: 'CleanArchitecture',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-rust-axum', 'CleanArchitecture'),
    },
    version: '1.2.0',
    author: 'Systems Engineering Group',
    updatedAt: '2026-07-25',
    tags: ['Rust', 'Axum', 'Tokio', 'SQLx', 'PostgreSQL', 'Cargo'],
    isOfficial: true,
    downloadCount: 1140,
  },
  {
    id: 'tmpl-nextjs-saas',
    name: 'Next.js 15 Full-Stack SaaS Blueprint',
    description: 'Modern server-first TypeScript web application with Tailwind v4, Auth, Prisma, and Gemini AI integration',
    category: 'Web & Web Apps',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-nextjs',
      name: 'Next.js 15 SaaS Blueprint',
      techStackId: 'stack-nextjs',
      architectureStyle: 'ModularMonolith',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-nextjs', 'ModularMonolith'),
    },
    version: '3.1.0',
    author: 'Frontend Platform Team',
    updatedAt: '2026-08-01',
    tags: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind', 'Prisma'],
    isOfficial: true,
    downloadCount: 2310,
  },
  {
    id: 'tmpl-kotlin-ktor',
    name: 'Kotlin Ktor Async Lightweight Service',
    description: 'Asynchronous Kotlin microservice with Coroutines, Exposed ORM, and JWT Auth',
    category: 'Enterprise Microservices',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-kotlin-ktor',
      name: 'Kotlin Ktor Blueprint',
      techStackId: 'stack-kotlin-ktor',
      architectureStyle: 'CleanArchitecture',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-kotlin-ktor', 'CleanArchitecture'),
    },
    version: '1.1.0',
    author: 'JVM Platforms Team',
    updatedAt: '2026-07-29',
    tags: ['Kotlin', 'Ktor', 'Coroutines', 'Exposed', 'Gradle'],
    isOfficial: true,
    downloadCount: 760,
  },
  {
    id: 'tmpl-flutter-client',
    name: 'Flutter 3.22 Clean Architecture Client',
    description: 'Cross-platform mobile & desktop app with BLoC state management, Dio HTTP, and Hive offline cache',
    category: 'Mobile & Desktop',
    blueprint: {
      ...initialBlueprints[0],
      id: 'bp-flutter-client',
      name: 'Flutter Clean Client Blueprint',
      techStackId: 'stack-flutter',
      architectureStyle: 'CleanArchitecture',
      projects: BlueprintService.getProjectsForTechStackAndArchStyle('stack-flutter', 'CleanArchitecture'),
    },
    version: '2.0.0',
    author: 'Mobile UI Guild',
    updatedAt: '2026-07-30',
    tags: ['Flutter', 'Dart', 'BLoC', 'Clean Architecture', 'Cross-Platform'],
    isOfficial: true,
    downloadCount: 1540,
  },
];

// Phase 1 (see PLAN.md): fabricated Project/Decision Log usage history removed.
// The app now starts genuinely empty — no invented projects/decisions are seeded.
export const initialProjects: Project[] = [];

export const initialDecisionLogs: DecisionLogItem[] = [];

export const initialAIProviders: AIProviderConfig[] = [
  {
    id: 'ai-gemini',
    name: 'Google Gemini 3.6 Flash',
    model: 'gemini-3.6-flash',
    provider: 'Google Gemini',
    status: 'active',
    costPer1k: '$0.00015',
    latency: '180ms',
  },
  {
    id: 'ai-openai',
    name: 'OpenAI GPT-4o Enterprise',
    model: 'gpt-4o',
    provider: 'OpenAI',
    status: 'configured',
    costPer1k: '$0.0025',
    latency: '320ms',
  },
  {
    id: 'ai-claude',
    name: 'Anthropic Claude 3.5 Sonnet',
    model: 'claude-3-5-sonnet-20241022',
    provider: 'Anthropic',
    status: 'configured',
    costPer1k: '$0.0030',
    latency: '290ms',
  },
  {
    id: 'ai-deepseek',
    name: 'DeepSeek V3 Architect',
    model: 'deepseek-chat',
    provider: 'DeepSeek',
    status: 'configured',
    costPer1k: '$0.00014',
    latency: '210ms',
  },
];

export const initialPromptTemplates: PromptTemplate[] = [
  {
    id: 'prompt-arch-review',
    name: 'Software Architecture & Tradeoff Reviewer',
    role: 'System',
    category: 'Architecture',
    prompt: `You are a Principal Software Architect evaluating a software factory blueprint.
Analyze the chosen stack {{techStack}}, database {{database}}, and feature set {{features}}.
Provide concise evaluation covering: Pros, Cons, Security Risks, Performance Impact, and Architectural Recommendations.`,
    variables: ['techStack', 'database', 'features'],
    version: '1.2.0',
  },
  {
    id: 'prompt-security-audit',
    name: 'OWASP & Cloud Security Inspector',
    role: 'System',
    category: 'Security',
    prompt: `You are a Lead Security Engineer auditing security profile {{securityProfile}} and authentication {{authMethod}}.
Identify OWASP Top 10 vulnerabilities, credential leakage risks, and compliance recommendations.`,
    variables: ['securityProfile', 'authMethod'],
    version: '2.0.0',
  },
];
