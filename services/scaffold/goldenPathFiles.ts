import type { ProjectScaffoldContext } from './types';

/**
 * Golden-path source files per project type (Core / Application / Infrastructure / UI / API) for every language.
 * Extracted verbatim from ProjectService.generateSolutionPreview (indentation kept
 * so multi-line template literals stay byte-identical).
 */
export function addGoldenPathFiles(ctx: ProjectScaffoldContext): void {
  const { blueprint, proj, lang, projectName, javaPackageBase, activeFeatureIds, fileExt, codeLang, projBasePath, projFolderNode } = ctx;
      if (proj.type === 'Core') {
        projFolderNode.children?.push({
          id: `dir-${proj.id}-entities`,
          name: lang === 'go' ? 'domain' : 'Entities',
          type: 'folder',
          path: `src/${proj.name}/Entities`,
          children: [
            {
              id: 'file-base-entity',
              name: `BaseEntity.${fileExt}`,
              type: 'file',
              path: `src/${proj.name}/Entities/BaseEntity.${fileExt}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${javaPackageBase}.domain;\n\npublic abstract class BaseEntity {\n    private String id;\n    private long createdAt;\n}` :
                lang === 'go' ? `package domain\n\ntype BaseEntity struct {\n\tID string\n\tCreatedAt int64\n}` :
                lang === 'rust' ? `pub struct BaseEntity {\n    pub id: String,\n    pub created_at: i64,\n}` :
                lang === 'python' ? `from pydantic import BaseModel\nfrom datetime import datetime\n\nclass BaseEntity(BaseModel):\n    id: str\n    created_at: datetime` :
                lang === 'typescript' ? `export abstract class BaseEntity {\n  id!: string;\n  createdAt!: Date;\n}` :
                lang === 'kotlin' ? `abstract class BaseEntity {\n    var id: String = ""\n}` :
                lang === 'dart' ? `abstract class BaseEntity {\n  String id = '';\n}` :
                `namespace ${proj.name}.Entities;\n\npublic abstract class BaseEntity {\n    public Guid Id { get; set; }\n}`
            },
            // Phase 9 golden path: entidade concreta para o handler/template compilarem.
            // DateTimeOffset.UtcNow (nunca DateTime.Now — rule-4) e sem Console (rule-5).
            ...(lang === 'csharp' ? [{
              id: 'file-transaction',
              name: 'Transaction.cs',
              type: 'file' as const,
              path: `src/${proj.name}/Entities/Transaction.cs`,
              language: 'csharp',
              contentSnippet:
                `namespace ${proj.name}.Entities;\n\npublic sealed class Transaction : BaseEntity {\n    public decimal Amount { get; set; }\n    public string Currency { get; set; } = "BRL";\n    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;\n}`,
            }] : []),
          ],
        });
      }

      if (proj.type === 'Application') {
        // Phase 9: sem MediatR no template base (pacote não vai ao manifest) — contrato próprio
        // sem dependências externas para o golden path compilar com `dotnet build` limpo.
        const coreName = blueprint.projects.find((p) => p.type === 'Core')?.name || 'App.Core';
        projFolderNode.children?.push({
          id: `dir-${proj.id}-commands`,
          name: 'Commands',
          type: 'folder',
          path: `src/${proj.name}/Commands`,
          children: [
            {
              id: 'file-create-cmd',
              name: `CreateTransactionCommand.${fileExt}`,
              type: 'file',
              path: `src/${proj.name}/Commands/CreateTransactionCommand.${fileExt}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${javaPackageBase}.usecase;\n\npublic record CreateTransactionCommand(double amount, String currency) {}` :
                lang === 'go' ? `package usecase\n\ntype CreateTransactionCommand struct {\n\tAmount float64\n\tCurrency string\n}` :
                lang === 'rust' ? `pub struct CreateTransactionCommand {\n    pub amount: f64,\n    pub currency: String,\n}` :
                lang === 'python' ? `class CreateTransactionCommand(BaseModel):\n    amount: float\n    currency: str` :
                lang === 'typescript' ? `export interface CreateTransactionCommand {\n  amount: number;\n  currency: string;\n}` :
                lang === 'kotlin' ? `data class CreateTransactionCommand(val amount: Double, val currency: String)\n\nclass CreateTransactionHandler {\n    private val store = mutableMapOf<String, CreateTransactionCommand>()\n\n    fun handle(command: CreateTransactionCommand): String {\n        val id = java.util.UUID.randomUUID().toString()\n        store[id] = command\n        return id\n    }\n\n    fun findById(id: String): CreateTransactionCommand? = store[id]\n}` :
                lang === 'dart' ? `class CreateTransactionCommand {\n  final double amount;\n  final String currency;\n  const CreateTransactionCommand({required this.amount, required this.currency});\n}\n\nclass CreateTransactionHandler {\n  final Map<String, CreateTransactionCommand> _store = {};\n\n  String handle(CreateTransactionCommand command) {\n    final id = DateTime.now().microsecondsSinceEpoch.toString();\n    _store[id] = command;\n    return id;\n  }\n\n  CreateTransactionCommand? findById(String id) => _store[id];\n}` :
                `namespace ${proj.name}.Commands;\n\npublic sealed record CreateTransactionCommand(decimal Amount, string Currency);`
            },
            ...(lang === 'csharp' ? [{
              id: 'file-create-handler',
              name: 'CreateTransactionHandler.cs',
              type: 'file' as const,
              path: `src/${proj.name}/Commands/CreateTransactionHandler.cs`,
              language: 'csharp',
              contentSnippet:
                `using ${coreName}.Entities;\nusing ${proj.name}.Common;\n\nnamespace ${proj.name}.Commands;\n\npublic sealed class CreateTransactionHandler : ICommandHandler<CreateTransactionCommand, Guid> {\n    private readonly IRepository<Transaction> _repository;\n    private readonly TimeProvider _time;\n\n    public CreateTransactionHandler(IRepository<Transaction> repository, TimeProvider time) {\n        _repository = repository;\n        _time = time;\n    }\n\n    public async Task<Guid> HandleAsync(CreateTransactionCommand command, CancellationToken ct) {\n        var entity = new Transaction {\n            Id = Guid.NewGuid(),\n            Amount = command.Amount,\n            Currency = command.Currency,\n            CreatedAt = _time.GetUtcNow(),\n        };\n        await _repository.AddAsync(entity, ct);\n        return entity.Id;\n    }\n}`,
            }] : []),
          ],
        });
        if (lang === 'csharp') {
          projFolderNode.children?.push({
            id: `dir-${proj.id}-common`,
            name: 'Common',
            type: 'folder',
            path: `src/${proj.name}/Common`,
            children: [
              {
                id: 'file-irepository',
                name: 'IRepository.cs',
                type: 'file',
                path: `src/${proj.name}/Common/IRepository.cs`,
                language: 'csharp',
                contentSnippet:
                  `using ${coreName}.Entities;\n\nnamespace ${proj.name}.Common;\n\npublic interface IRepository<T> where T : BaseEntity {\n    Task<T?> GetByIdAsync(Guid id, CancellationToken ct);\n    Task AddAsync(T entity, CancellationToken ct);\n}`,
              },
              {
                id: 'file-icommandhandler',
                name: 'ICommandHandler.cs',
                type: 'file',
                path: `src/${proj.name}/Common/ICommandHandler.cs`,
                language: 'csharp',
                contentSnippet:
                  `namespace ${proj.name}.Common;\n\npublic interface ICommandHandler<TCommand, TResult> {\n    Task<TResult> HandleAsync(TCommand command, CancellationToken ct);\n}`,
              },
            ],
          });
        }
      }

      if (proj.type === 'Infrastructure') {
        // Phase 9: implementação em Infrastructure da interface de Application/Core (rule-3).
        const appName = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
        const coreName2 = blueprint.projects.find((p) => p.type === 'Core')?.name || 'App.Core';
        projFolderNode.children?.push({
          id: `dir-${proj.id}-persistence`,
          name: 'Persistence',
          type: 'folder',
          path: `src/${proj.name}/Persistence`,
          children: [
            {
              id: 'file-dbcontext',
              name: lang === 'csharp' ? 'InMemoryRepository.cs' : `Repository.${fileExt}`,
              type: 'file',
              path: `src/${proj.name}/Persistence/${lang === 'csharp' ? 'InMemoryRepository.cs' : `Repository.${fileExt}`}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${javaPackageBase}.repository;\n\nimport java.util.HashMap;\nimport java.util.Map;\n\npublic class Repository {\n    private final Map<String, Object> store = new HashMap<>();\n\n    public Object findById(String id) {\n        return store.get(id);\n    }\n\n    public void save(String id, Object entity) {\n        store.put(id, entity);\n    }\n}` :
                lang === 'go' ? `package persistence\n\ntype InMemoryRepository struct {\n\tstore map[string]interface{}\n}\n\nfunc NewInMemoryRepository() *InMemoryRepository {\n\treturn &InMemoryRepository{store: make(map[string]interface{})}\n}\n\nfunc (r *InMemoryRepository) FindByID(id string) interface{} {\n\treturn r.store[id]\n}\n\nfunc (r *InMemoryRepository) Save(id string, entity interface{}) {\n\tr.store[id] = entity\n}\n` :
                lang === 'rust' ? `use std::collections::HashMap;\n\npub struct InMemoryRepository {\n    store: HashMap<String, String>,\n}\n\nimpl InMemoryRepository {\n    pub fn new() -> Self {\n        Self { store: HashMap::new() }\n    }\n\n    pub fn find_by_id(&self, id: &str) -> Option<&String> {\n        self.store.get(id)\n    }\n\n    pub fn save(&mut self, id: String, entity: String) {\n        self.store.insert(id, entity);\n    }\n}\n` :
                lang === 'python' ? `from typing import Dict, Optional\n\nclass InMemoryRepository:\n    def __init__(self):\n        self._store: Dict[str, object] = {}\n\n    async def get_by_id(self, id: str) -> Optional[object]:\n        return self._store.get(id)\n\n    async def add(self, entity) -> None:\n        self._store[getattr(entity, 'id', str(id(entity)))] = entity\n` :
                lang === 'kotlin' ? `class InMemoryRepository {\n    private val store = mutableMapOf<String, Any>()\n\n    fun findById(id: String): Any? = store[id]\n\n    fun save(id: String, entity: Any) {\n        store[id] = entity\n    }\n}` :
                lang === 'dart' ? `class InMemoryRepository {\n  final Map<String, Object> _store = {};\n\n  Object? findById(String id) => _store[id];\n\n  void save(String id, Object entity) {\n    _store[id] = entity;\n  }\n}` :
                lang === 'csharp' ? `using ${appName}.Common;\nusing ${coreName2}.Entities;\nusing System.Collections.Concurrent;\n\nnamespace ${proj.name}.Persistence;\n\npublic sealed class InMemoryRepository<T> : IRepository<T> where T : BaseEntity {\n    private readonly ConcurrentDictionary<Guid, T> _store = new();\n\n    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct) {\n        _store.TryGetValue(id, out var entity);\n        return Task.FromResult(entity);\n    }\n\n    public Task AddAsync(T entity, CancellationToken ct) {\n        _store[entity.Id] = entity;\n        return Task.CompletedTask;\n    }\n}` :
                `export class Repository {\n  async findOne(id: string) {}\n}`
            },
          ],
        });
      }

      // Phase 19: main.dart do UI-Dart ANTES do bloco API (UI nunca entra no if abaixo).
      if (proj.type === 'UI' && lang === 'dart') {
        projFolderNode.children?.push({
          id: `file-main-dart-${proj.id}`,
          name: 'main.dart',
          type: 'file',
          path: `${projBasePath.replace(/\\/g, '/')}/main.dart`,
          language: 'dart',
          contentSnippet: `void main() {\n  print('${projectName} — ${proj.name} (${proj.type}) started');\n}\n`,
        });
      }

      if (proj.type === 'API') {
        // Phase 9: controllers C# reais herdando BaseApiController (rule-2) + Program.cs
        // composition root + appsettings. Sem Console/DateTime.Now (rules 4-5).
        const appName2 = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
        const infraName = blueprint.projects.find((p) => p.type === 'Infrastructure')?.name || 'App.Infrastructure';
        projFolderNode.children?.push({
          id: `dir-${proj.id}-controllers`,
          name: 'Controllers',
          type: 'folder',
          path: `${projBasePath}/Controllers`,
          children: [
            {
              id: 'file-base-ctrl',
              name: `ApiController.${fileExt}`,
              type: 'file',
              path: `${projBasePath}/Controllers/ApiController.${fileExt}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${javaPackageBase}.api;\n\npublic class ApiController {\n    public String healthz() {\n        return "ok";\n    }\n}` :
                lang === 'go' ? `package handler\n\nimport "net/http"\n\nfunc HealthCheck(w http.ResponseWriter, r *http.Request) {\n\tw.Header().Set("Content-Type", "application/json")\n\tw.Write([]byte("{\\"status\\":\\"ok\\"}"))\n}\n` :
                lang === 'rust' ? `pub fn health_check() -> &'static str {\n    "ok"\n}\n` :
                lang === 'python' ? `from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/healthz")\nasync def healthz():\n    return {"status": "ok"}\n\n@router.post("/transactions")\nasync def create_transaction(payload: dict):\n    return {"id": "00000000-0000-0000-0000-000000000000"}\n` :
                lang === 'csharp' ? `using Microsoft.AspNetCore.Mvc;\n\nnamespace ${proj.name}.Controllers;\n\n[ApiController]\npublic abstract class BaseApiController : ControllerBase {\n    protected ILogger Logger { get; }\n\n    protected BaseApiController(ILogger logger) {\n        Logger = logger;\n    }\n\n    protected string TraceId => HttpContext.TraceIdentifier;\n}` :
                lang === 'kotlin' ? `class ApiController {\n    fun healthz(): String = "ok"\n}` :
                lang === 'dart' ? `class ApiController {\n  String healthz() => 'ok';\n}` :
                // Phase 15: TypeScript base sem deps externas — compila com tsc puro
                `export class ApiController {\n  handle(): string {\n    return 'ok';\n  }\n}`
            },
            ...(lang === 'csharp' ? [{
              id: 'file-transactions-ctrl',
              name: 'TransactionsController.cs',
              type: 'file' as const,
              path: `src/${proj.name}/Controllers/TransactionsController.cs`,
              language: 'csharp',
              contentSnippet:
                `using Microsoft.AspNetCore.Mvc;\nusing ${appName2}.Commands;\nusing ${appName2}.Common;\n\nnamespace ${proj.name}.Controllers;\n\n[Route("api/v1/transactions")]\npublic sealed class TransactionsController : BaseApiController {\n    private readonly ICommandHandler<CreateTransactionCommand, Guid> _handler;\n\n    public TransactionsController(ICommandHandler<CreateTransactionCommand, Guid> handler, ILogger<TransactionsController> logger) : base(logger) {\n        _handler = handler;\n    }\n\n    [HttpPost]\n    [ProducesResponseType(StatusCodes.Status201Created)]\n    public async Task<ActionResult<Guid>> Create([FromBody] CreateTransactionCommand command, CancellationToken ct) {\n        Logger.LogInformation("Creating transaction {TraceId}", TraceId);\n        var id = await _handler.HandleAsync(command, ct);\n        return CreatedAtAction(nameof(Create), new { id }, id);\n    }\n}`,
            }] : []),
          ],
        });
        // Phase 19: bootstrap por linguagem sem deps externas (Go stdlib, Kotlin/Dart plain,
        // Java plain). Cada arquivo compila com a toolchain padrão quando instalada.
        if (lang === 'go' && proj.type === 'API') {
          projFolderNode.children?.push({
            id: `file-main-go-${proj.id}`,
            name: 'main.go',
            type: 'file',
            path: `src/${proj.name}/main.go`,
            language: 'go',
            contentSnippet: `package main\n\nimport (\n\t"net/http"\n)\n\nfunc main() {\n\thttp.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {\n\t\tw.Header().Set("Content-Type", "application/json")\n\t\tw.Write([]byte("{\\"status\\":\\"ok\\"}"))\n\t})\n\thttp.ListenAndServe(":8080", nil)\n}\n`,
          });
        }
        if (lang === 'kotlin') {
          projFolderNode.children?.push({
            id: `file-app-kt-${proj.id}`,
            name: 'Application.kt',
            type: 'file',
            path: `src/${proj.name}/Application.kt`,
            language: 'kotlin',
            contentSnippet: `fun main() {\n    println("${projectName} — ${proj.name} (${proj.type}) started")\n}\n`,
          });
        }
        // (main.dart do UI-Dart inserido antes do bloco API acima)
        if (lang === 'java' && proj.type === 'API') {
          projFolderNode.children?.push({
            id: `file-app-java-${proj.id}`,
            name: 'Application.java',
            type: 'file',
            path: `src/${proj.name}/Application.java`,
            language: 'java',
            contentSnippet: `package com.acme.${javaPackageBase}.api;\n\npublic class Application {\n    public static void main(String[] args) {\n        System.out.println("${projectName} — ${proj.name} started");\n    }\n}\n`,
          });
        }

        // Phase 17/18: TypeScript/Python main wiring — 100% (com wiring real, mas ainda compilável sem deps via @ts-ignore / comentários)
        if (lang === 'typescript') {
          const hasTs = (id: string): boolean => activeFeatureIds.includes(id);
          const isNestJs = blueprint.techStackId === 'stack-node-nestjs';
          if (isNestJs) {
            // NestJS — main.ts + app.module com wiring real (com @ts-ignore para compilar sem npm install)
            const appModuleImports: string[] = ['// @ts-ignore\nimport { Module } from \'@nestjs/common\';'];
            const appModuleExtra: string[] = [];
            if (hasTs('feat-postgres-ef')) {
              appModuleImports.push('// @ts-ignore\nimport { TypeOrmModule } from \'@nestjs/typeorm\';');
              appModuleExtra.push('    // @ts-ignore\n    TypeOrmModule.forRoot({ type: \'postgres\', host: \'localhost\', database: \'appdb\' }),');
            }
            if (hasTs('feat-redis-cache')) {
              appModuleImports.push('// @ts-ignore\nimport { CacheModule } from \'@nestjs/cache-manager\';');
              appModuleExtra.push('    // @ts-ignore\n    CacheModule.register({ ttl: 30 }),');
            }
            if (hasTs('feat-jwt-auth')) {
              appModuleImports.push('// @ts-ignore\nimport { JwtModule } from \'@nestjs/jwt\';');
              appModuleExtra.push('    // @ts-ignore\n    JwtModule.register({ secret: \'secret\' }),');
            }
            projFolderNode.children?.push({
              id: `file-main-ts-${proj.id}`,
              name: 'main.ts',
              type: 'file',
              path: `src/${proj.name}/main.ts`,
              language: 'typescript',
              contentSnippet: `// @ts-ignore\nimport { NestFactory } from '@nestjs/core';\nimport { AppModule } from './app.module';\n\nasync function bootstrap(): Promise<void> {\n  // @ts-ignore\n  const app = await NestFactory.create(AppModule);\n  // @ts-ignore\n  await app.listen(3000);\n  console.log('Bootstrapping ${projectName}');\n}\nbootstrap();\n`,
            });
            projFolderNode.children?.push({
              id: `file-appmodule-ts-${proj.id}`,
              name: 'app.module.ts',
              type: 'file',
              path: `src/${proj.name}/app.module.ts`,
              language: 'typescript',
              contentSnippet: `${appModuleImports.join('\n')}\n\n// @ts-ignore\n@Module({\n  imports: [\n${appModuleExtra.join('\n')}\n  ],\n})\nexport class AppModule {}\n`,
            });
          } else {
            // Next.js e outros TS — mantém bootstrap simples sem @nestjs
            projFolderNode.children?.push({
              id: `file-main-ts-${proj.id}`,
              name: 'main.ts',
              type: 'file',
              path: `src/${proj.name}/main.ts`,
              language: 'typescript',
              contentSnippet: `import { ApiController } from './Controllers/ApiController';\n\nexport async function bootstrap(): Promise<void> {\n  const controller = new ApiController();\n  console.log('Bootstrapping ${projectName} — ApiController:', controller.handle());\n}\nbootstrap();\n`,
            });
            projFolderNode.children?.push({
              id: `file-appmodule-ts-${proj.id}`,
              name: 'app.module.ts',
              type: 'file',
              path: `src/${proj.name}/app.module.ts`,
              language: 'typescript',
              contentSnippet: `export class AppModule {}\n`,
            });
          }
        }
        if (lang === 'python') {
          const hasPy = (id: string): boolean => activeFeatureIds.includes(id);
          let extraPy = '';
          if (hasPy('feat-postgres-ef')) extraPy += 'from sqlalchemy.ext.asyncio import create_async_engine  # pyproject: sqlalchemy\n';
          if (hasPy('feat-redis-cache')) extraPy += 'import redis.asyncio as redis  # pyproject: redis\n';
          if (hasPy('feat-jwt-auth')) extraPy += 'from fastapi.security import OAuth2PasswordBearer  # pyproject: python-jose\n';
          // Wiring real mas ainda py_compile válido (imports podem falhar em runtime sem pip install, mas sintaxe ok)
          projFolderNode.children?.push({
            id: `file-main-py-${proj.id}`,
            name: 'main.py',
            type: 'file',
            path: `src/${proj.name}/main.py`,
            language: 'python',
            contentSnippet: `from fastapi import FastAPI\nfrom .Controllers.ApiController import router\n${extraPy}\napp = FastAPI(title="${projectName}")\napp.include_router(router)\n\n@app.get("/healthz")\nasync def healthz():\n    return {"status": "ok"}\n`,
          });
        }

        if (lang === 'csharp') {
          // Phase 13: Program.cs wiring real das Features ativas (pacotes viram código).
          const has = (id: string): boolean => activeFeatureIds.includes(id);
          const programUsings: string[] = [
            `using ${appName2}.Commands;`,
            `using ${appName2}.Common;`,
            `using ${infraName}.Persistence;`,
          ];
          const programServices: string[] = [
            'builder.Services.AddControllers();',
            'builder.Services.AddHealthChecks().AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy());',
            'builder.Services.AddSingleton(TimeProvider.System);',
            'builder.Services.AddScoped(typeof(IRepository<>), typeof(InMemoryRepository<>));',
            'builder.Services.AddScoped<ICommandHandler<CreateTransactionCommand, Guid>, CreateTransactionHandler>();',
          ];
          const programExtras: string[] = [];
          if (has('feat-postgres-ef')) {
            programUsings.push('using Microsoft.EntityFrameworkCore;');
            programServices.push('builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=appdb;Username=appuser;Password=appsecret"));');
          }
          if (has('feat-redis-cache')) {
            programServices.push('builder.Services.AddStackExchangeRedisCache(o => o.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");');
          }
          if (has('feat-jwt-auth')) {
            programUsings.push('using Microsoft.AspNetCore.Authentication.JwtBearer;');
            programUsings.push('using Microsoft.IdentityModel.Tokens;');
            programServices.push('builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();');
            programServices.push('builder.Services.AddAuthorization();');
            programExtras.push('app.UseAuthentication();', 'app.UseAuthorization();');
          }
          if (has('feat-mediatr-cqrs')) {
            programServices.push('builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<CreateTransactionCommand>());');
          }
          if (has('feat-fluent-validation')) {
            programUsings.push('using FluentValidation;');
            programServices.push('builder.Services.AddValidatorsFromAssemblyContaining<CreateTransactionCommand>();');
          }
          if (has('feat-opentelemetry')) {
            // Minimal wiring — WithTracing+Instrumentation requires the instrumentation package
            // plus an extra using. Keep it simple to stay compilable across package versions.
            programServices.push('builder.Services.AddOpenTelemetry();');
          }
          if (has('feat-worker-service')) {
            programUsings.push(`using ${infraName}.Workers;`);
            programServices.push('builder.Services.AddHostedService<RpaWorker>();');
          }
          if (has('feat-quartz-scheduler')) {
            programUsings.push('using Quartz;');
            programServices.push('builder.Services.AddQuartz(q => {});', 'builder.Services.AddQuartzHostedService(o => o.WaitForJobsToComplete = true);');
          }
          const programContent = [
            ...programUsings,
            '',
            'var builder = WebApplication.CreateBuilder(args);',
            ...programServices.map((s) => s),
            '',
            'var app = builder.Build();',
            ...programExtras,
            'app.MapControllers();',
            'app.MapHealthChecks("/healthz");',
            'app.Run();',
          ].join('\n');

          projFolderNode.children?.push({
            id: 'file-program',
            name: 'Program.cs',
            type: 'file',
            path: `src/${proj.name}/Program.cs`,
            language: 'csharp',
            contentSnippet: programContent,
          });
          projFolderNode.children?.push({
            id: 'file-appsettings',
            name: 'appsettings.json',
            type: 'file',
            path: `src/${proj.name}/appsettings.json`,
            language: 'json',
            contentSnippet:
              `{\n  "Logging": {\n    "LogLevel": {\n      "Default": "Information",\n      "Microsoft.AspNetCore": "Warning"\n    }\n  },\n  "AllowedHosts": "*",\n  "ConnectionStrings": {}\n}`,
          });
          projFolderNode.children?.push({
            id: 'file-appsettings-dev',
            name: 'appsettings.Development.json',
            type: 'file',
            path: `src/${proj.name}/appsettings.Development.json`,
            language: 'json',
            contentSnippet:
              `{\n  "Logging": {\n    "LogLevel": {\n      "Default": "Debug",\n      "Microsoft.AspNetCore": "Information"\n    }\n  },\n  "DetailedErrors": true\n}`,
          });
        }
      }

}
