import { BlueprintProject, ArchitectureStyle } from '../types/factory';

export class BlueprintService {
  /**
   * Generates a context-aware list of project modules matching the chosen programming language / tech stack
   * and architectural pattern style.
   */
  static getProjectsForTechStackAndArchStyle(
    techStackId: string,
    style: ArchitectureStyle = 'CleanArchitecture'
  ): BlueprintProject[] {
    // 1. Node.js NestJS
    if (techStackId === 'stack-node-nestjs') {
      if (style === 'Hexagonal') {
        return [
          { id: 'proj-domain', name: 'src/core', type: 'Core', references: [], description: 'Decoupled domain models and core business rules' },
          { id: 'proj-ports', name: 'src/ports', type: 'Application', references: ['proj-domain'], description: 'Inbound driver ports and outbound driven interface tokens' },
          { id: 'proj-adapters-db', name: 'src/adapters/persistence', type: 'Infrastructure', references: ['proj-ports', 'proj-domain'], description: 'Prisma PostgreSQL & Redis cache adapters' },
          { id: 'proj-adapters-http', name: 'src/adapters/http', type: 'API', references: ['proj-adapters-db', 'proj-ports'], description: 'NestJS REST Controllers & Fastify adapter' },
          { id: 'proj-tests', name: 'test/hexagonal', type: 'Tests', references: ['proj-ports', 'proj-domain'], description: 'Jest adapter mock verification & contract tests' },
        ];
      }
      if (style === 'Microservices') {
        return [
          { id: 'proj-domain', name: 'src/domain', type: 'Core', references: [], description: 'Bounded context domain logic and events' },
          { id: 'proj-messaging', name: 'src/transports', type: 'Infrastructure', references: ['proj-domain'], description: 'NestJS Microservice TCP/NATS/RabbitMQ transports' },
          { id: 'proj-service', name: 'src/app', type: 'API', references: ['proj-messaging', 'proj-domain'], description: 'Microservice controllers & gRPC proto definitions' },
          { id: 'proj-tests', name: 'test/microservice', type: 'Tests', references: ['proj-domain'], description: 'Jest integration & microservice transport tests' },
        ];
      }
      if (style === 'CQRS') {
        return [
          { id: 'proj-domain', name: 'src/domain', type: 'Core', references: [], description: 'Domain aggregates and event handlers' },
          { id: 'proj-commands', name: 'src/commands', type: 'Application', references: ['proj-domain'], description: '@nestjs/cqrs Command handlers & write models' },
          { id: 'proj-queries', name: 'src/queries', type: 'Application', references: ['proj-domain'], description: 'Read query handlers & Redis projections' },
          { id: 'proj-api', name: 'src/controllers', type: 'API', references: ['proj-commands', 'proj-queries'], description: 'REST Endpoints & CommandBus execution' },
          { id: 'proj-tests', name: 'test/cqrs', type: 'Tests', references: ['proj-domain'], description: 'Command & query handler unit tests' },
        ];
      }
      if (style === 'ModularMonolith') {
        return [
          { id: 'proj-core', name: 'src/common', type: 'Core', references: [], description: 'Shared decorators, guards, and domain primitives' },
          { id: 'proj-mod-payments', name: 'src/modules/payments', type: 'Application', references: ['proj-core'], description: 'Encapsulated Payment NestJS module' },
          { id: 'proj-mod-auth', name: 'src/modules/auth', type: 'Application', references: ['proj-core'], description: 'Encapsulated Auth NestJS module' },
          { id: 'proj-host', name: 'src/main', type: 'API', references: ['proj-mod-payments', 'proj-mod-auth'], description: 'NestJS Root AppModule & Fastify HTTP Server' },
          { id: 'proj-tests', name: 'test/e2e', type: 'Tests', references: ['proj-core'], description: 'Modular boundary & Supertest e2e suite' },
        ];
      }
      return [
        { id: 'proj-core', name: 'src/domain', type: 'Core', references: [], description: 'Domain entities, value objects, and domain event interfaces' },
        { id: 'proj-app', name: 'src/application', type: 'Application', references: ['proj-core'], description: 'CQRS command/query handlers, use cases, and DTOs' },
        { id: 'proj-infra', name: 'src/infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Prisma ORM repositories, Redis cache, Passport JWT, and Winston logger' },
        { id: 'proj-api', name: 'src/api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'NestJS REST Controllers, Swagger OpenAPI decorators, and exception filters' },
        { id: 'proj-tests', name: 'test/unit', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Jest unit tests, mocks, and Supertest e2e specs' },
      ];
    }

    // 2. Java Spring Boot
    if (techStackId === 'stack-java-spring') {
      if (style === 'Hexagonal') {
        return [
          { id: 'proj-domain', name: 'com.acme.core.domain', type: 'Core', references: [], description: 'Pure Java domain entities without framework dependencies' },
          { id: 'proj-ports', name: 'com.acme.core.ports', type: 'Application', references: ['proj-domain'], description: 'Inbound use case ports and outbound repository ports' },
          { id: 'proj-adapters-db', name: 'com.acme.adapters.jpa', type: 'Infrastructure', references: ['proj-ports', 'proj-domain'], description: 'Spring Data JPA & PostgreSQL adapters' },
          { id: 'proj-adapters-http', name: 'com.acme.adapters.rest', type: 'API', references: ['proj-adapters-db', 'proj-ports'], description: 'Spring Web REST Controllers & Spring Security' },
          { id: 'proj-tests', name: 'com.acme.tests', type: 'Tests', references: ['proj-ports', 'proj-domain'], description: 'JUnit 5 & Mockito hexagonal tests' },
        ];
      }
      return [
        { id: 'proj-core', name: 'com.acme.domain', type: 'Core', references: [], description: 'Domain entities, value objects, domain events, and repository interfaces' },
        { id: 'proj-app', name: 'com.acme.application', type: 'Application', references: ['proj-core'], description: 'Use cases, application services, DTOs, and MapStruct mappers' },
        { id: 'proj-infra', name: 'com.acme.infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Spring Data JPA, Hibernate, Redis, Security OAuth2, and Kafka adapters' },
        { id: 'proj-api', name: 'com.acme.web', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Spring REST Controllers, OpenAPI Swagger, and RestControllerAdvice' },
        { id: 'proj-tests', name: 'com.acme.tests', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'JUnit 5, Mockito, and Testcontainers integration tests' },
      ];
    }

    // 3. Go Fiber / gRPC
    if (techStackId === 'stack-gofiber') {
      if (style === 'Hexagonal') {
        return [
          { id: 'proj-domain', name: 'internal/core/domain', type: 'Core', references: [], description: 'Go domain structs and core business rules' },
          { id: 'proj-ports', name: 'internal/core/ports', type: 'Application', references: ['proj-domain'], description: 'Go interfaces for inbound driving and outbound driven adapters' },
          { id: 'proj-adapters-db', name: 'internal/adapters/postgres', type: 'Infrastructure', references: ['proj-ports', 'proj-domain'], description: 'SQLx database adapter and Redis cache' },
          { id: 'proj-adapters-http', name: 'internal/adapters/http', type: 'API', references: ['proj-adapters-db', 'proj-ports'], description: 'Go Fiber HTTP router & middleware' },
          { id: 'proj-tests', name: 'internal/tests', type: 'Tests', references: ['proj-ports', 'proj-domain'], description: 'Go testify unit & mock tests' },
        ];
      }
      return [
        { id: 'proj-core', name: 'pkg/domain', type: 'Core', references: [], description: 'Pure Go domain structs, domain events, and repository interface contracts' },
        { id: 'proj-app', name: 'pkg/usecase', type: 'Application', references: ['proj-core'], description: 'Application use cases, business validation, and DTO structs' },
        { id: 'proj-infra', name: 'pkg/repository', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'SQLx / GORM PostgreSQL adapters, Redis cache client, and gRPC clients' },
        { id: 'proj-api', name: 'cmd/server', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Fiber REST HTTP handlers, middleware, Swagger docs, and gRPC endpoints' },
        { id: 'proj-tests', name: 'test/unit', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Go unit tests with testify, mockgen, and integration suites' },
      ];
    }

    // 4. Python FastAPI
    if (techStackId === 'stack-python-fastapi') {
      if (style === 'Hexagonal') {
        return [
          { id: 'proj-domain', name: 'app/core/domain', type: 'Core', references: [], description: 'Pure Python domain dataclasses without framework dependencies' },
          { id: 'proj-ports', name: 'app/core/ports', type: 'Application', references: ['proj-domain'], description: 'Abstract Base Classes (ABC) for repository & notification ports' },
          { id: 'proj-adapters-db', name: 'app/adapters/db', type: 'Infrastructure', references: ['proj-ports', 'proj-domain'], description: 'Async SQLAlchemy & Redis repository adapters' },
          { id: 'proj-adapters-http', name: 'app/adapters/web', type: 'API', references: ['proj-adapters-db', 'proj-ports'], description: 'FastAPI routes & CORS middleware' },
          { id: 'proj-tests', name: 'tests/hexagonal', type: 'Tests', references: ['proj-ports', 'proj-domain'], description: 'Pytest async adapter tests' },
        ];
      }
      return [
        { id: 'proj-core', name: 'app/domain', type: 'Core', references: [], description: 'Domain dataclasses, value objects, and domain exceptions' },
        { id: 'proj-app', name: 'app/use_cases', type: 'Application', references: ['proj-core'], description: 'Application logic, Pydantic v2 schemas, and service protocols' },
        { id: 'proj-infra', name: 'app/infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Async SQLAlchemy ORM models, Alembic migrations, Redis client, and HTTPX' },
        { id: 'proj-api', name: 'app/api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'FastAPI APIRouter endpoints, OAuth2 Bearer security, and OpenAPI metadata' },
        { id: 'proj-tests', name: 'tests/unit', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Pytest test cases, AsyncIO fixtures, and HTTPX mock responses' },
      ];
    }

    // 5. Rust Axum
    if (techStackId === 'stack-rust-axum') {
      return [
        { id: 'proj-core', name: 'crates/domain', type: 'Core', references: [], description: 'Domain structs, enums, domain errors, and trait definitions' },
        { id: 'proj-app', name: 'crates/application', type: 'Application', references: ['proj-core'], description: 'Command/query handlers, use case execution, and validation' },
        { id: 'proj-infra', name: 'crates/infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'SQLx PostgreSQL connection pool, Redis cache layer, and reqwest adapters' },
        { id: 'proj-api', name: 'crates/api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Axum routes, handlers, Tower middleware, tracing OpenTelemetry, and OpenAPI utoipa' },
        { id: 'proj-tests', name: 'tests/integration', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Cargo integration tests, nextest suites, and mock traits' },
      ];
    }

    // 6. Next.js 15
    if (techStackId === 'stack-nextjs') {
      return [
        { id: 'proj-core', name: 'lib/domain', type: 'Core', references: [], description: 'TypeScript domain models, Zod validation schemas, and core business rules' },
        { id: 'proj-app', name: 'lib/services', type: 'Application', references: ['proj-core'], description: 'Server actions, API data fetchers, and application state managers' },
        { id: 'proj-infra', name: 'lib/db', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Prisma ORM schema, PostgreSQL database client, Auth.js, and Redis client' },
        { id: 'proj-api', name: 'app', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Next.js 15 App Router pages, Server Components, and API route handlers (/api/*)' },
        { id: 'proj-tests', name: 'tests', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Vitest unit tests, React Testing Library, and Playwright E2E tests' },
      ];
    }

    // 7. Kotlin Ktor
    if (techStackId === 'stack-kotlin-ktor') {
      return [
        { id: 'proj-core', name: 'src/main/domain', type: 'Core', references: [], description: 'Kotlin data classes, domain value objects, and interface abstractions' },
        { id: 'proj-app', name: 'src/main/application', type: 'Application', references: ['proj-core'], description: 'Coroutines use cases, CQRS execution, and DTO serializers' },
        { id: 'proj-infra', name: 'src/main/infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Exposed ORM database repositories, Redis cache, and Ktor HTTP client' },
        { id: 'proj-api', name: 'src/main/api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Ktor Routing handlers, JWT Auth feature plugins, and OpenAPI documentation' },
        { id: 'proj-tests', name: 'src/test/unit', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Kotest specifications, Mockk mocks, and Ktor test ApplicationHost' },
      ];
    }

    // 8. Flutter
    if (techStackId === 'stack-flutter') {
      return [
        { id: 'proj-core', name: 'lib/domain', type: 'Core', references: [], description: 'Dart domain entities, value objects, and repository contracts' },
        { id: 'proj-app', name: 'lib/application', type: 'Application', references: ['proj-core'], description: 'BLoC / Riverpod state managers, event handlers, and view models' },
        { id: 'proj-infra', name: 'lib/infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Dio HTTP client, Hive / Isar local database cache, and OAuth2 adapters' },
        { id: 'proj-api', name: 'lib/presentation', type: 'UI', references: ['proj-infra', 'proj-app'], description: 'Flutter Responsive Widgets, UI pages, themes, and navigation routing' },
        { id: 'proj-tests', name: 'test/unit', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Widget tests, BLoC tests, and mocktail HTTP test fixtures' },
      ];
    }

    // 9. Default / .NET 9
    if (style === 'Hexagonal') {
      return [
        { id: 'proj-domain', name: 'App.Domain', type: 'Core', references: [], description: 'Domain models and enterprise business logic' },
        { id: 'proj-ports', name: 'App.Ports', type: 'Application', references: ['proj-domain'], description: 'Primary input ports and secondary output interfaces' },
        { id: 'proj-adapters-db', name: 'App.Adapters.Persistence', type: 'Infrastructure', references: ['proj-ports', 'proj-domain'], description: 'EF Core PostgreSQL database adapters' },
        { id: 'proj-adapters-http', name: 'App.Adapters.Http', type: 'API', references: ['proj-adapters-db', 'proj-ports'], description: 'ASP.NET Core REST API controllers & OpenAPI' },
        { id: 'proj-tests', name: 'App.Tests', type: 'Tests', references: ['proj-ports', 'proj-domain'], description: 'xUnit ports & adapters test suite' },
      ];
    }
    if (style === 'Microservices') {
      return [
        { id: 'proj-domain', name: 'App.Domain', type: 'Core', references: [], description: 'Domain entities & event definitions' },
        { id: 'proj-messaging', name: 'App.Messaging', type: 'Infrastructure', references: ['proj-domain'], description: 'MassTransit RabbitMQ & gRPC contracts' },
        { id: 'proj-service', name: 'App.Service', type: 'API', references: ['proj-messaging', 'proj-domain'], description: 'Lightweight Web API & gRPC endpoints' },
        { id: 'proj-tests', name: 'App.Tests', type: 'Tests', references: ['proj-domain'], description: 'Integration tests & wiremock' },
      ];
    }
    if (style === 'CQRS') {
      return [
        { id: 'proj-domain', name: 'App.Domain', type: 'Core', references: [], description: 'Domain entities and Aggregate Roots' },
        { id: 'proj-commands', name: 'App.Commands', type: 'Application', references: ['proj-domain'], description: 'MediatR Command handlers & write models' },
        { id: 'proj-queries', name: 'App.Queries', type: 'Application', references: ['proj-domain'], description: 'Dapper read queries & projections' },
        { id: 'proj-api', name: 'App.Api', type: 'API', references: ['proj-commands', 'proj-queries'], description: 'REST Endpoints & Command Dispatcher' },
        { id: 'proj-tests', name: 'App.Tests', type: 'Tests', references: ['proj-domain'], description: 'xUnit handler tests' },
      ];
    }
    if (style === 'ModularMonolith') {
      return [
        { id: 'proj-core', name: 'App.Core', type: 'Core', references: [], description: 'Shared kernel and domain primitives' },
        { id: 'proj-mod-payments', name: 'App.Modules.Payments', type: 'Application', references: ['proj-core'], description: 'Payment processing module with internal boundaries' },
        { id: 'proj-mod-users', name: 'App.Modules.Users', type: 'Application', references: ['proj-core'], description: 'Identity and user management module' },
        { id: 'proj-host', name: 'App.Host', type: 'API', references: ['proj-mod-payments', 'proj-mod-users'], description: 'Modular monolith HTTP host and module bootstrapper' },
        { id: 'proj-tests', name: 'App.Tests', type: 'Tests', references: ['proj-core'], description: 'Module boundary verification and unit tests' },
      ];
    }

    return [
      { id: 'proj-core', name: 'App.Core', type: 'Core', references: [], description: 'Domain entities, value objects, domain events, and core exceptions' },
      { id: 'proj-app', name: 'App.Application', type: 'Application', references: ['proj-core'], description: 'Use cases, CQRS commands/queries, interfaces, and DTOs' },
      { id: 'proj-infra', name: 'App.Infrastructure', type: 'Infrastructure', references: ['proj-app', 'proj-core'], description: 'Database EF Core, Redis caching, Auth, and External integrations' },
      { id: 'proj-api', name: 'App.Api', type: 'API', references: ['proj-infra', 'proj-app'], description: 'Controllers, middleware, Swagger, and DI composition root' },
      { id: 'proj-tests', name: 'App.UnitTests', type: 'Tests', references: ['proj-app', 'proj-core'], description: 'Unit tests with xUnit and Moq' },
    ];
  }

  /**
   * Analyzes the project's operational text description and active tech stack
   * to automatically recommend the exact required dependencies and packages for each module.
   */
  static suggestPackagesFromDescription(
    descriptionText: string,
    techStackLanguage: string = 'csharp',
    projects: BlueprintProject[] = []
  ): Array<{
    packageName: string;
    version: string;
    category: string;
    reason: string;
    targetModuleType: 'Core' | 'Application' | 'Infrastructure' | 'API' | 'Worker' | 'Tests' | 'UI';
    targetModuleId?: string;
  }> {
    const text = (descriptionText || '').toLowerCase();
    const suggestions: Array<{
      packageName: string;
      version: string;
      category: string;
      reason: string;
      targetModuleType: 'Core' | 'Application' | 'Infrastructure' | 'API' | 'Worker' | 'Tests' | 'UI';
      targetModuleId?: string;
    }> = [];

    const findTargetProjId = (type: string) => {
      const match = projects.find((p) => p.type === type);
      return match ? match.id : undefined;
    };

    if (techStackLanguage === 'csharp') {
      // 1. Database / ORM
      if (text.includes('postgres') || text.includes('postgresql') || text.includes('npgsql')) {
        suggestions.push({
          packageName: 'Npgsql.EntityFrameworkCore.PostgreSQL',
          version: '9.0.0',
          category: 'Database / ORM',
          reason: "Identificado no funcionamento: 'PostgreSQL'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      } else if (text.includes('dapper')) {
        suggestions.push({
          packageName: 'Dapper',
          version: '2.1.35',
          category: 'Database / ORM',
          reason: "Identificado no funcionamento: 'Dapper'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      } else {
        suggestions.push({
          packageName: 'Microsoft.EntityFrameworkCore.SqlServer',
          version: '9.0.0',
          category: 'Database / ORM',
          reason: 'Padrão recomendado para persistência relacional',
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }

      // 2. Authentication & JWT
      if (text.includes('jwt') || text.includes('auth') || text.includes('login') || text.includes('token') || text.includes('autentic')) {
        suggestions.push({
          packageName: 'Microsoft.AspNetCore.Authentication.JwtBearer',
          version: '9.0.0',
          category: 'Security & Auth',
          reason: "Identificado no funcionamento: 'JWT / Autenticação'",
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }

      // 3. Caching
      if (text.includes('redis') || text.includes('cache') || text.includes('memoria')) {
        suggestions.push({
          packageName: 'Microsoft.Extensions.Caching.StackExchangeRedis',
          version: '9.0.0',
          category: 'Caching',
          reason: "Identificado no funcionamento: 'Redis / Cache'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }

      // 4. Messaging / Queues
      if (text.includes('rabbitmq') || text.includes('queue') || text.includes('fila') || text.includes('masstransit') || text.includes('kafka') || text.includes('mensageria')) {
        suggestions.push({
          packageName: 'MassTransit.RabbitMQ',
          version: '8.3.0',
          category: 'Messaging & Queues',
          reason: "Identificado no funcionamento: 'RabbitMQ / Mensageria'",
          targetModuleType: projects.some((p) => p.type === 'Worker') ? 'Worker' : 'Infrastructure',
          targetModuleId: findTargetProjId('Worker') || findTargetProjId('Infrastructure'),
        });
      }

      // 5. Logging / Serilog
      if (text.includes('serilog') || text.includes('log') || text.includes('telemetria') || text.includes('observa')) {
        suggestions.push({
          packageName: 'Serilog.AspNetCore',
          version: '9.0.0',
          category: 'Observability & Logs',
          reason: "Identificado no funcionamento: 'Serilog / Telemetria'",
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }

      // 6. CQRS & MediatR
      if (text.includes('mediatr') || text.includes('cqrs') || text.includes('bus') || text.includes('comando') || text.includes('query')) {
        suggestions.push({
          packageName: 'MediatR',
          version: '12.4.1',
          category: 'Architecture & CQRS',
          reason: "Identificado no funcionamento: 'MediatR / CQRS'",
          targetModuleType: 'Application',
          targetModuleId: findTargetProjId('Application'),
        });
      }

      // 7. Validation
      if (text.includes('validation') || text.includes('validac') || text.includes('fluent')) {
        suggestions.push({
          packageName: 'FluentValidation.AspNetCore',
          version: '11.3.0',
          category: 'Validation & DTOs',
          reason: "Identificado no funcionamento: 'Validação DTO'",
          targetModuleType: 'Application',
          targetModuleId: findTargetProjId('Application'),
        });
      }

      // 8. Swagger / OpenAPI
      if (text.includes('swagger') || text.includes('openapi') || text.includes('api') || text.includes('doc')) {
        suggestions.push({
          packageName: 'Swashbuckle.AspNetCore',
          version: '7.2.0',
          category: 'API Documentation',
          reason: 'Documentação automática de rotas OpenAPI/Swagger',
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }

      // 9. Stripe / Payments
      if (text.includes('stripe') || text.includes('pagamento') || text.includes('payment') || text.includes('checkout') || text.includes('finance')) {
        suggestions.push({
          packageName: 'Stripe.net',
          version: '47.2.0',
          category: 'Payments',
          reason: "Identificado no funcionamento: 'Pagamentos / Stripe'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
    } else if (techStackLanguage === 'typescript') {
      if (text.includes('prisma') || text.includes('postgres') || text.includes('sql') || text.includes('banco')) {
        suggestions.push({
          packageName: '@prisma/client',
          version: '6.0.0',
          category: 'Database / ORM',
          reason: "Identificado no funcionamento: 'Prisma / Database'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }

      if (text.includes('jwt') || text.includes('auth') || text.includes('token') || text.includes('login')) {
        suggestions.push({
          packageName: 'jsonwebtoken',
          version: '9.0.2',
          category: 'Security & Auth',
          reason: "Identificado no funcionamento: 'JWT Autenticação'",
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }

      if (text.includes('redis') || text.includes('cache')) {
        suggestions.push({
          packageName: 'ioredis',
          version: '5.4.1',
          category: 'Caching',
          reason: "Identificado no funcionamento: 'Redis Cache'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }

      if (text.includes('queue') || text.includes('bull') || text.includes('rabbitmq') || text.includes('fila')) {
        suggestions.push({
          packageName: 'bullmq',
          version: '5.30.0',
          category: 'Messaging & Queues',
          reason: "Identificado no funcionamento: 'BullMQ Filas Assíncronas'",
          targetModuleType: 'Worker',
          targetModuleId: findTargetProjId('Worker') || findTargetProjId('Infrastructure'),
        });
      }

      if (text.includes('zod') || text.includes('validac') || text.includes('validation')) {
        suggestions.push({
          packageName: 'zod',
          version: '3.24.1',
          category: 'Validation',
          reason: "Identificado no funcionamento: 'Zod Schemas'",
          targetModuleType: 'Application',
          targetModuleId: findTargetProjId('Application'),
        });
      }

      if (text.includes('log') || text.includes('winston') || text.includes('pino')) {
        suggestions.push({
          packageName: 'winston',
          version: '3.17.0',
          category: 'Observability',
          reason: "Identificado no funcionamento: 'Winston Structured Logging'",
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
    } else if (techStackLanguage === 'python') {
      if (text.includes('postgres') || text.includes('sql') || text.includes('sqlalchemy')) {
        suggestions.push({
          packageName: 'sqlalchemy',
          version: '2.0.36',
          category: 'Database',
          reason: 'SQLAlchemy Async ORM',
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
      if (text.includes('jwt') || text.includes('auth')) {
        suggestions.push({
          packageName: 'python-jose[cryptography]',
          version: '3.3.0',
          category: 'Security',
          reason: 'FastAPI JWT Auth',
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }
      if (text.includes('redis') || text.includes('cache')) {
        suggestions.push({
          packageName: 'redis',
          version: '5.2.0',
          category: 'Caching',
          reason: 'Redis Python Client',
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
    } else if (techStackLanguage === 'java') {
      if (text.includes('jpa') || text.includes('postgres') || text.includes('sql')) {
        suggestions.push({
          packageName: 'org.springframework.boot:spring-boot-starter-data-jpa',
          version: '3.4.0',
          category: 'Database',
          reason: 'Spring Data JPA ORM',
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
      if (text.includes('jwt') || text.includes('security') || text.includes('auth')) {
        suggestions.push({
          packageName: 'org.springframework.boot:spring-boot-starter-security',
          version: '3.4.0',
          category: 'Security',
          reason: 'Spring Security OAuth2/JWT',
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }
    } else if (techStackLanguage === 'go') {
      if (text.includes('gorm') || text.includes('postgres') || text.includes('sql')) {
        suggestions.push({
          packageName: 'gorm.io/gorm',
          version: '1.25.12',
          category: 'Database',
          reason: 'GORM Go Database ORM',
          targetModuleType: 'Infrastructure',
          targetModuleId: findTargetProjId('Infrastructure'),
        });
      }
      if (text.includes('jwt') || text.includes('auth')) {
        suggestions.push({
          packageName: 'github.com/golang-jwt/jwt/v5',
          version: '5.2.1',
          category: 'Security',
          reason: 'Go JWT Token Claims',
          targetModuleType: 'API',
          targetModuleId: findTargetProjId('API'),
        });
      }
    }

    return suggestions;
  }
}

