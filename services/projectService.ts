import { Project, Blueprint, FeatureManifest } from '../types/factory';
import { StorageService } from './storageService';
import { FeatureService } from './featureService';
import JSZip from 'jszip';

export interface GeneratedSolutionPreview {
  solutionName: string;
  estimatedFileCount: number;
  estimatedFolderCount: number;
  projectReferencesCount: number;
  packageDependenciesCount: number;
  solutionTree: SolutionTreeNode[];
  allPackages: Array<{ name: string; version: string; packageManager: string; project: string }>;
}

export interface SolutionTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'project' | 'file';
  path: string;
  language?: string;
  contentSnippet?: string;
  children?: SolutionTreeNode[];
}

export class ProjectService {
  static getProjects(): Project[] {
    return StorageService.getProjects();
  }

  static getProjectById(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  static saveProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.push(project);
    }
    StorageService.saveProjects(projects);
  }

  /**
   * Returns tech-stack specific .env variable presets.
   */
  static getEnvPresetsForStack(techStackId: string, language: string): Array<{ key: string; value: string; description: string }> {
    const lang = (language || '').toLowerCase();
    if (lang === 'csharp') {
      return [
        { key: 'ASPNETCORE_ENVIRONMENT', value: 'Development', description: 'ASP.NET Core Runtime Environment Mode' },
        { key: 'ASPNETCORE_URLS', value: 'http://+:5000;https://+:5001', description: 'Kestrel HTTP & HTTPS Endpoints' },
        { key: 'ConnectionStrings__DefaultConnection', value: 'Server=localhost;Database=FactoryDb;User Id=sa;Password=Secret123!;TrustServerCertificate=True;', description: 'Entity Framework Core Connection String' },
        { key: 'JwtSettings__SecretKey', value: 'super-secret-jwt-key-minimum-256-bits-long!!', description: 'JWT Authentication Signing Key' },
        { key: 'JwtSettings__Issuer', value: 'Acme.PaymentEngine', description: 'Token Issuer Authority' },
        { key: 'Redis__ConnectionString', value: 'localhost:6379,abortConnect=false', description: 'IDistributedCache Redis Connection' },
        { key: 'Serilog__MinimumLevel', value: 'Information', description: 'Structured Logging Threshold' },
      ];
    } else if (lang === 'typescript' || lang === 'javascript') {
      return [
        { key: 'PORT', value: '3000', description: 'Node.js Express / Next.js Server Port' },
        { key: 'NODE_ENV', value: 'development', description: 'Node Runtime Environment' },
        { key: 'DATABASE_URL', value: 'postgresql://postgres:secret@localhost:5432/factory_db?schema=public', description: 'Prisma / Drizzle ORM Connection URI' },
        { key: 'JWT_SECRET', value: 'super-secret-jwt-key-32-chars-long!', description: 'JWT HMAC Signing Key' },
        { key: 'REDIS_URL', value: 'redis://localhost:6379', description: 'ioredis Client Connection Endpoint' },
        { key: 'NEXT_PUBLIC_API_URL', value: 'http://localhost:3000/api', description: 'Public Client API Base URL' },
        { key: 'LOG_LEVEL', value: 'debug', description: 'Pino / Winston Logger Verbosity' },
      ];
    } else if (lang === 'python') {
      return [
        { key: 'FASTAPI_ENV', value: 'development', description: 'FastAPI / Uvicorn Execution Mode' },
        { key: 'PORT', value: '8000', description: 'Uvicorn ASGI Listener Port' },
        { key: 'DATABASE_URL', value: 'postgresql+asyncpg://admin:secret@localhost:5432/factory_db', description: 'SQLAlchemy Async Connection String' },
        { key: 'SECRET_KEY', value: 'py-super-secret-key-9021840912', description: 'Application Encryption & Token Secret' },
        { key: 'CELERY_BROKER_URL', value: 'redis://localhost:6379/0', description: 'Celery Distributed Task Queue Broker' },
        { key: 'LOG_LEVEL', value: 'INFO', description: 'Python Logging Threshold' },
      ];
    } else if (lang === 'go') {
      return [
        { key: 'APP_ENV', value: 'local', description: 'Go Fiber / Gin Application Environment' },
        { key: 'PORT', value: '8080', description: 'HTTP Listener Port' },
        { key: 'DB_DSN', value: 'host=localhost user=admin password=secret dbname=factory_db port=5432 sslmode=disable', description: 'GORM PostgreSQL Data Source Name' },
        { key: 'JWT_SECRET', value: 'go-jwt-secret-key-32-bytes-minimum', description: 'Go-JWT Signing Key' },
        { key: 'REDIS_ADDR', value: 'localhost:6379', description: 'Go-Redis Cache Address' },
      ];
    } else if (lang === 'rust') {
      return [
        { key: 'RUST_LOG', value: 'info,actix_web=debug,sqlx=info', description: 'Tracing & Log Filtering Directives' },
        { key: 'SERVER_PORT', value: '8080', description: 'Axum / Actix Web Server Listener Port' },
        { key: 'DATABASE_URL', value: 'postgres://postgres:secret@localhost:5432/factory_db', description: 'SQLx Compile-time Database URL' },
        { key: 'JWT_SECRET', value: 'rust-jwt-secret-key-32-bytes', description: 'Token Signature Secret' },
      ];
    } else if (lang === 'java' || lang === 'kotlin') {
      return [
        { key: 'SPRING_PROFILES_ACTIVE', value: 'dev', description: 'Spring Boot Active Profile' },
        { key: 'SERVER_PORT', value: '8080', description: 'Embedded Tomcat Server Port' },
        { key: 'SPRING_DATASOURCE_URL', value: 'jdbc:postgresql://localhost:5432/factory_db', description: 'HikariCP JDBC Connection String' },
        { key: 'SPRING_DATASOURCE_USERNAME', value: 'admin', description: 'Database Username' },
        { key: 'SPRING_DATASOURCE_PASSWORD', value: 'secret', description: 'Database Authentication Password' },
      ];
    }
    return [
      { key: 'PORT', value: '5000', description: 'HTTP Listening Port' },
      { key: 'DATABASE_URL', value: 'postgresql://admin:secret@localhost:5432/factory_db', description: 'Primary DB Connection String' },
      { key: 'JWT_SECRET', value: 'super-secret-jwt-key-32-chars-long!', description: 'Auth Signing Key' },
      { key: 'LOG_LEVEL', value: 'Information', description: 'Log Verbosity Threshold' },
    ];
  }

  /**
   * Generates a virtual Solution Scaffolding Tree Preview for a given blueprint or project.
   */
  static generateSolutionPreview(
    blueprint: Blueprint,
    projectName = 'Acme.PaymentEngine',
    useEnvFile = true,
    customEnvVars?: Array<{ key: string; value: string; description?: string }>
  ): GeneratedSolutionPreview {
    const allFeatures = FeatureService.getAllFeatures();
    const { activeFeatureIds } = FeatureService.resolveBlueprintFeatures(blueprint);
    const activeFeatures = allFeatures.filter((f) => activeFeatureIds.includes(f.id));

    const techStacks = StorageService.getTechStacks();
    const selectedStack = techStacks.find((s) => s.id === blueprint.techStackId) || techStacks[0];
    const lang = selectedStack?.language || 'csharp';

    const packagesList: Array<{ name: string; version: string; packageManager: string; project: string }> = [];

    // Collect packages from features and module-specific packages
    activeFeatures.forEach((feat) => {
      feat.generatedPackages?.forEach((pkg) => {
        packagesList.push({
          name: pkg.name,
          version: pkg.version,
          packageManager: pkg.packageManager,
          project: feat.generatedProjects?.[0] || 'Infrastructure',
        });
      });
    });

    blueprint.projects.forEach((proj) => {
      proj.packages?.forEach((pkg) => {
        packagesList.push({
          name: pkg.name,
          version: pkg.version,
          packageManager: pkg.packageManager || (lang === 'csharp' ? 'nuget' : lang === 'typescript' ? 'npm' : 'cargo'),
          project: proj.name,
        });
      });
    });

    let totalFiles = 24;
    let totalFolders = 12;

    const rootNodes: SolutionTreeNode[] = [];

    // Language-specific root files
    let buildFileName = `${projectName}.sln`;
    let buildFileSnippet = `Microsoft Visual Studio Solution File, Format Version 12.00`;
    let buildFileLang = 'plaintext';

    if (lang === 'java') {
      buildFileName = 'pom.xml';
      buildFileSnippet = `<project xmlns="http://maven.apache.org/POM/4.0.0">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.acme</groupId>\n  <artifactId>${projectName.toLowerCase()}</artifactId>\n  <version>1.0.0-SNAPSHOT</version>\n</project>`;
      buildFileLang = 'xml';
    } else if (lang === 'go') {
      buildFileName = 'go.mod';
      buildFileSnippet = `module github.com/acme/${projectName.toLowerCase()}\n\ngo 1.22`;
      buildFileLang = 'plaintext';
    } else if (lang === 'rust') {
      buildFileName = 'Cargo.toml';
      buildFileSnippet = `[package]\nname = "${projectName.toLowerCase()}"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\ntokio = { version = "1.38", features = ["full"] }\naxum = "0.7"`;
      buildFileLang = 'toml';
    } else if (lang === 'python') {
      buildFileName = 'pyproject.toml';
      buildFileSnippet = `[tool.poetry]\nname = "${projectName.toLowerCase()}"\nversion = "0.1.0"\ndescription = "Generated by Software Factory"\n\n[tool.poetry.dependencies]\npython = "^3.12"\nfastapi = "^0.111.0"`;
      buildFileLang = 'toml';
    } else if (lang === 'typescript') {
      buildFileName = 'package.json';
      buildFileSnippet = `{\n  "name": "${projectName.toLowerCase()}",\n  "version": "1.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build"\n  }\n}`;
      buildFileLang = 'json';
    } else if (lang === 'kotlin') {
      buildFileName = 'build.gradle.kts';
      buildFileSnippet = `plugins {\n    kotlin("jvm") version "2.0.0"\n    id("io.ktor.plugin") version "2.3.11"\n}`;
      buildFileLang = 'kotlin';
    } else if (lang === 'dart') {
      buildFileName = 'pubspec.yaml';
      buildFileSnippet = `name: ${projectName.toLowerCase()}\ndescription: Flutter Multiplatform Application\nversion: 1.0.0+1\nenvironment:\n  sdk: '>=3.4.0 <4.0.0'`;
      buildFileLang = 'yaml';
    }

    const defaultVars = customEnvVars && customEnvVars.length > 0 ? customEnvVars : [
      { key: 'PORT', value: '5000', description: 'HTTP Server Listening Port' },
      { key: 'DATABASE_URL', value: 'postgresql://admin:secret@localhost:5432/factory_db', description: 'Primary Database Connection String' },
      { key: 'JWT_SECRET', value: 'super-secret-jwt-key-32-chars-long!', description: 'HMAC SHA256 Token Signing Secret' },
      { key: 'REDIS_URL', value: 'redis://localhost:6379', description: 'Distributed Caching Host' },
      { key: 'LOG_LEVEL', value: 'Information', description: 'Logging Verbosity Threshold' },
    ];

    const envContent = defaultVars.map((v) => `# ${v.description || ''}\n${v.key}=${v.value}`).join('\n\n');
    const envExampleContent = defaultVars.map((v) => `# ${v.description || ''}\n${v.key}=<YOUR_${v.key}_HERE>`).join('\n\n');

    // Generate Visual Studio Solution (.sln) content
    const generateSlnContent = (): string => {
      let slnText = `Microsoft Visual Studio Solution File, Format Version 12.00\n# Visual Studio Version 17\nVisualStudioVersion = 17.0.31903.59\nMinimumVisualStudioVersion = 10.0.40219.1\n`;
      blueprint.projects.forEach((proj, idx) => {
        const guid = `{00000000-0000-0000-0000-00000000000${idx + 1}}`;
        slnText += `Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "${proj.name}", "src\\${proj.name}\\${proj.name}.csproj", "${guid}"\nEndProject\n`;
      });
      slnText += `Global\n\tGlobalSection(SolutionConfigurationPlatforms) = preSolution\n\t\tDebug|Any CPU = Debug|Any CPU\n\t\tRelease|Any CPU = Release|Any CPU\n\tEndGlobalSection\nEndGlobal\n`;
      return slnText;
    };

    // Generate VS Code Workspace configuration
    const vscodeWorkspaceSnippet = JSON.stringify({
      folders: [
        { name: `${projectName} (Root)`, path: "." },
        { name: "Source Code", path: "src" }
      ],
      settings: {
        "files.exclude": { "**/bin": true, "**/obj": true, "**/node_modules": true, "**/.git": true },
        "editor.formatOnSave": true,
        "editor.tabSize": 2
      },
      extensions: {
        recommendations: [
          lang === 'csharp' ? "ms-dotnettools.csharp" : lang === 'rust' ? "rust-lang.rust-analyzer" : "dbaeumer.vscode-eslint",
          "esbenp.prettier-vscode",
          "ms-azuretools.vscode-docker",
          "eamodio.gitlens"
        ]
      }
    }, null, 2);

    // Generate .vscode/tasks.json
    const vscodeTasksSnippet = JSON.stringify({
      version: "2.0.0",
      tasks: [
        {
          label: "build",
          command: lang === 'csharp' ? "dotnet build" : lang === 'rust' ? "cargo build" : "npm run build",
          type: "shell",
          group: { kind: "build", isDefault: true },
          problemMatcher: lang === 'csharp' ? "$msCompile" : "$tsc"
        },
        {
          label: "test",
          command: lang === 'csharp' ? "dotnet test" : lang === 'rust' ? "cargo test" : "npm test",
          type: "shell",
          group: { kind: "test", isDefault: true }
        }
      ]
    }, null, 2);

    // Generate .vscode/launch.json
    const vscodeLaunchSnippet = JSON.stringify({
      version: "0.2.0",
      configurations: [
        {
          name: `Launch ${projectName} API`,
          type: lang === 'csharp' ? "coreclr" : "node",
          request: "launch",
          preLaunchTask: "build",
          program: lang === 'csharp' ? `\${workspaceFolder}/src/${projectName}.Api/bin/Debug/net9.0/${projectName}.Api.dll` : "\${workspaceFolder}/src/index.ts",
          args: [],
          cwd: "\${workspaceFolder}",
          stopAtEntry: false,
          env: { "ASPNETCORE_ENVIRONMENT": "Development", "NODE_ENV": "development" }
        }
      ]
    }, null, 2);

    // Shell script to setup & open IDE
    const setupIdeScript = `#!/usr/bin/env bash
# Automatically generated IDE environment launcher script for ${projectName}
echo "🚀 Initializing ${projectName} IDE workspace..."
git init
echo "✅ Git repository initialized."
${lang === 'csharp' ? 'dotnet restore' : lang === 'rust' ? 'cargo fetch' : 'npm install'}
echo "✅ Dependencies restored."
echo ""
echo "Open in your preferred IDE:"
echo " 1) VS Code:        code ."
echo " 2) VS Code Space:  code ${projectName}.code-workspace"
echo " 3) Visual Studio:  devenv ${projectName}.sln"
echo " 4) JetBrains:      rider ${projectName}.sln"
`;

    const rootFiles: SolutionTreeNode[] = [
      { id: 'file-build-root', name: buildFileName, type: 'file', path: buildFileName, language: buildFileLang, contentSnippet: buildFileSnippet },
      { id: 'file-editorconfig', name: '.editorconfig', type: 'file', path: '.editorconfig', language: 'ini', contentSnippet: `root = true\n\n[*]\nindent_style = space\nindent_size = 2` },
      { id: 'file-readme', name: 'README.md', type: 'file', path: 'README.md', language: 'markdown', contentSnippet: `# ${projectName}\n\nGenerated by Enterprise Software Factory Platform.\nStack: ${selectedStack?.name || lang}\nArchitecture: ${blueprint.architectureStyle}\nActive Features: ${activeFeatures.map((f) => f.name).join(', ')}` },
      { id: 'file-vscode-ws', name: `${projectName}.code-workspace`, type: 'file', path: `${projectName}.code-workspace`, language: 'json', contentSnippet: vscodeWorkspaceSnippet },
      { id: 'file-sln', name: `${projectName}.sln`, type: 'file', path: `${projectName}.sln`, language: 'xml', contentSnippet: generateSlnContent() },
      { id: 'file-setup-sh', name: 'setup-ide.sh', type: 'file', path: 'setup-ide.sh', language: 'bash', contentSnippet: setupIdeScript },
    ];

    if (useEnvFile) {
      rootFiles.push(
        { id: 'file-env', name: '.env', type: 'file', path: '.env', language: 'ini', contentSnippet: envContent },
        { id: 'file-env-example', name: '.env.example', type: 'file', path: '.env.example', language: 'ini', contentSnippet: envExampleContent }
      );
      totalFiles += 2;
    } else {
      rootFiles.push({
        id: 'file-launch-settings',
        name: 'appsettings.json',
        type: 'file',
        path: 'appsettings.json',
        language: 'json',
        contentSnippet: `{\n  "Logging": {\n    "LogLevel": {\n      "Default": "Information"\n    }\n  },\n  "AllowedHosts": "*"\n}`,
      });
      totalFiles += 1;
    }

    // Check Docker feature files
    activeFeatures.forEach((f) => {
      f.generatedFiles?.forEach((gf) => {
        if (!gf.path.includes('/')) {
          rootFiles.push({
            id: `gf-${gf.path}`,
            name: gf.path,
            type: 'file',
            path: gf.path,
            language: gf.language,
            contentSnippet: gf.templateSnippet,
          });
          totalFiles++;
        }
      });
    });

    // 2. Process Solution Projects/Modules
    const srcFolderNode: SolutionTreeNode = {
      id: 'dir-src',
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [],
    };

    blueprint.projects.forEach((proj) => {
      totalFolders += 3;
      totalFiles += 5;

      const fileExt =
        lang === 'java' ? 'java' :
        lang === 'go' ? 'go' :
        lang === 'rust' ? 'rs' :
        lang === 'python' ? 'py' :
        lang === 'typescript' ? 'ts' :
        lang === 'kotlin' ? 'kt' :
        lang === 'dart' ? 'dart' : 'cs';

      const codeLang =
        lang === 'java' ? 'java' :
        lang === 'go' ? 'go' :
        lang === 'rust' ? 'rust' :
        lang === 'python' ? 'python' :
        lang === 'typescript' ? 'typescript' :
        lang === 'kotlin' ? 'kotlin' :
        lang === 'dart' ? 'dart' : 'csharp';

      const projFolderNode: SolutionTreeNode = {
        id: `dir-${proj.id}`,
        name: proj.name,
        type: 'project',
        path: `src/${proj.name}`,
        children: [],
      };

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
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.domain;\n\npublic abstract class BaseEntity {\n    private String id;\n    private long createdAt;\n}` :
                lang === 'go' ? `package domain\n\ntype BaseEntity struct {\n\tID string\n\tCreatedAt int64\n}` :
                lang === 'rust' ? `pub struct BaseEntity {\n    pub id: String,\n    pub created_at: i64,\n}` :
                lang === 'python' ? `from pydantic import BaseModel\nfrom datetime import datetime\n\nclass BaseEntity(BaseModel):\n    id: str\n    created_at: datetime` :
                lang === 'typescript' ? `export abstract class BaseEntity {\n  id!: string;\n  createdAt!: Date;\n}` :
                `namespace ${proj.name}.Entities;\n\npublic abstract class BaseEntity {\n    public Guid Id { get; set; }\n}`
            },
          ],
        });
      }

      if (proj.type === 'Application') {
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
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.usecase;\n\npublic record CreateTransactionCommand(double amount, String currency) {}` :
                lang === 'go' ? `package usecase\n\ntype CreateTransactionCommand struct {\n\tAmount float64\n\tCurrency string\n}` :
                lang === 'rust' ? `pub struct CreateTransactionCommand {\n    pub amount: f64,\n    pub currency: String,\n}` :
                lang === 'python' ? `class CreateTransactionCommand(BaseModel):\n    amount: float\n    currency: str` :
                lang === 'typescript' ? `export interface CreateTransactionCommand {\n  amount: number;\n  currency: string;\n}` :
                `using MediatR;\n\nnamespace ${proj.name}.Commands;\n\npublic record CreateTransactionCommand(decimal Amount, string Currency) : IRequest<Guid>;`
            },
          ],
        });
      }

      if (proj.type === 'Infrastructure') {
        projFolderNode.children?.push({
          id: `dir-${proj.id}-persistence`,
          name: 'Persistence',
          type: 'folder',
          path: `src/${proj.name}/Persistence`,
          children: [
            {
              id: 'file-dbcontext',
              name: `Repository.${fileExt}`,
              type: 'file',
              path: `src/${proj.name}/Persistence/Repository.${fileExt}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.repository;\nimport org.springframework.data.jpa.repository.JpaRepository;\n\npublic interface TransactionRepository extends JpaRepository<Transaction, String> {}` :
                lang === 'go' ? `package persistence\n\ntype PostgresRepository struct {\n\tdb *sql.DB\n}` :
                lang === 'rust' ? `pub struct SqlxRepository {\n    pub pool: sqlx::PgPool,\n}` :
                `export class Repository {\n  async findOne(id: string) {}\n}`
            },
          ],
        });
      }

      if (proj.type === 'API') {
        projFolderNode.children?.push({
          id: `dir-${proj.id}-controllers`,
          name: 'Controllers',
          type: 'folder',
          path: `src/${proj.name}/Controllers`,
          children: [
            {
              id: 'file-base-ctrl',
              name: `ApiController.${fileExt}`,
              type: 'file',
              path: `src/${proj.name}/Controllers/ApiController.${fileExt}`,
              language: codeLang,
              contentSnippet:
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.api;\nimport org.springframework.web.bind.annotation.*;\n\n@RestController\n@RequestMapping("/api/v1")\npublic class ApiController {}` :
                lang === 'go' ? `package handler\n\nfunc RegisterRoutes(app *fiber.App) {\n\tapp.Get("/healthz", HealthCheck)\n}` :
                lang === 'rust' ? `use axum::{routing::get, Router};\n\npub font router() -> Router {\n    Router::new().route("/healthz", get(health_check))\n}` :
                `import { Controller, Get } from '@nestjs/common';\n\n@Controller('api/v1')\nexport class ApiController {}`
            },
          ],
        });
      }

      // Module manifest file (e.g., .csproj, Cargo.toml, package.json)
      const refXml = proj.references.map((rId) => {
        const refProj = blueprint.projects.find((p) => p.id === rId);
        return refProj ? `    <ProjectReference Include="..\\${refProj.name}\\${refProj.name}.csproj" />` : '';
      }).filter(Boolean).join('\n');

      const pkgXml = (proj.packages || []).map((p) => `    <PackageReference Include="${p.name}" Version="${p.version}" />`).join('\n');

      const projManifestFileName = lang === 'csharp' ? `${proj.name}.csproj` : 'package.json';
      const projManifestSnippet = lang === 'csharp'
        ? `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <TargetFramework>net9.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n\n  <ItemGroup>\n${refXml || '    <!-- No Outbound Project References -->'}\n  </ItemGroup>\n\n  <ItemGroup>\n${pkgXml || '    <!-- Core Packages -->'}\n  </ItemGroup>\n</Project>`
        : `{\n  "name": "${proj.name.toLowerCase()}",\n  "version": "1.0.0",\n  "dependencies": {\n${(proj.packages || []).map((p) => `    "${p.name}": "${p.version}"`).join(',\n')}\n  }\n}`;

      projFolderNode.children?.unshift({
        id: `file-proj-manifest-${proj.id}`,
        name: projManifestFileName,
        type: 'file',
        path: `src/${proj.name}/${projManifestFileName}`,
        language: lang === 'csharp' ? 'xml' : 'json',
        contentSnippet: projManifestSnippet,
      });

      srcFolderNode.children?.push(projFolderNode);
    });

    const vscodeFolderNode: SolutionTreeNode = {
      id: 'dir-vscode',
      name: '.vscode',
      type: 'folder',
      path: '.vscode',
      children: [
        { id: 'file-vscode-tasks', name: 'tasks.json', type: 'file', path: '.vscode/tasks.json', language: 'json', contentSnippet: vscodeTasksSnippet },
        { id: 'file-vscode-launch', name: 'launch.json', type: 'file', path: '.vscode/launch.json', language: 'json', contentSnippet: vscodeLaunchSnippet },
      ],
    };

    rootNodes.push(vscodeFolderNode);
    rootNodes.push(srcFolderNode);
    rootNodes.push(...rootFiles);

    let projectReferencesCount = 0;
    blueprint.projects.forEach((p) => {
      projectReferencesCount += p.references.length;
    });

    return {
      solutionName: `${projectName}.sln`,
      estimatedFileCount: totalFiles,
      estimatedFolderCount: totalFolders,
      projectReferencesCount,
      packageDependenciesCount: packagesList.length,
      solutionTree: rootNodes,
      allPackages: packagesList,
    };
  }

  static async downloadSolutionZip(solutionTree: SolutionTreeNode[], projectName: string): Promise<void> {
    const zip = new JSZip();

    function addNodesToZip(nodes: SolutionTreeNode[], currentFolder: JSZip) {
      for (const node of nodes) {
        if (node.type === 'file') {
          currentFolder.file(node.name, node.contentSnippet || '');
        } else if (node.type === 'folder' || node.type === 'project') {
          const subFolder = currentFolder.folder(node.name);
          if (subFolder && node.children) {
            addNodesToZip(node.children, subFolder);
          }
        }
      }
    }

    const rootFolder = zip.folder(projectName) || zip;
    addNodesToZip(solutionTree, rootFolder);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-solution.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async exportDirectToDisk(solutionTree: SolutionTreeNode[], dirHandle: any): Promise<number> {
    let filesWritten = 0;

    async function writeNodes(nodes: SolutionTreeNode[], parentHandle: any) {
      for (const node of nodes) {
        if (node.type === 'file') {
          const fileHandle = await parentHandle.getFileHandle(node.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(node.contentSnippet || '');
          await writable.close();
          filesWritten++;
        } else if (node.type === 'folder' || node.type === 'project') {
          const subDirHandle = await parentHandle.getDirectoryHandle(node.name, { create: true });
          if (node.children) {
            await writeNodes(node.children, subDirHandle);
          }
        }
      }
    }

    await writeNodes(solutionTree, dirHandle);
    return filesWritten;
  }
}
