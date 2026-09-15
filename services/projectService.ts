import { Project, Blueprint, FeatureManifest } from '../types/factory';
import { projectRepository } from './repositories/project.repository';
import { techStackRepository } from './repositories/techStack.repository';
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
    return projectRepository.getProjects();
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
    projectRepository.saveProjects(projects);
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

    const techStacks = techStackRepository.getTechStacks();
    const selectedStack = techStacks.find((s) => s.id === blueprint.techStackId) || techStacks[0];
    const lang = selectedStack?.language || 'csharp';

    const packagesList: Array<{ name: string; version: string; packageManager: string; project: string }> = [];

    // Phase 12: pacotes das Features entram NOS manifests — por tipo de projeto
    // (feat.generatedProjects usa os mesmos tipos de BlueprintProject['type']).
    // Sem mutar o blueprint: cópia por projeto + dedupe por nome (case-insensitive).
    const manifestPackages = new Map<string, Array<{ name: string; version: string; packageManager?: string }>>();
    for (const proj of blueprint.projects) {
      manifestPackages.set(proj.id, [...(proj.packages || [])]);
    }
    const hasPackage = (list: Array<{ name: string }>, name: string): boolean =>
      list.some((p) => p.name.toLowerCase() === name.toLowerCase());

    // Collect packages from features and module-specific packages
    activeFeatures.forEach((feat) => {
      feat.generatedPackages?.forEach((pkg) => {
        packagesList.push({
          name: pkg.name,
          version: pkg.version,
          packageManager: pkg.packageManager,
          project: feat.generatedProjects?.[0] || 'Infrastructure',
        });
        // Injeção no manifest: só quando a feature declara projetos-alvo que existem.
        // Sem alvo declarado/existente, o pacote aparece na lista (display) mas não no manifest.
        for (const target of feat.generatedProjects || []) {
          for (const proj of blueprint.projects.filter((p) => p.type === target)) {
            const list = manifestPackages.get(proj.id);
            if (list && !hasPackage(list, pkg.name)) {
              list.push({ name: pkg.name, version: pkg.version, packageManager: pkg.packageManager });
            }
          }
        }
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

    // Phase 7: sem estimativa inventada — contagem real computada da árvore no final.
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

    // Generate Visual Studio Solution (.sln) content — Phase 7: GUIDs reais via
    // crypto.randomUUID() em vez do sequencial fake {0000...-000N}.
    // Phase 9: inclui ProjectConfigurationPlatforms — sem ele o `dotnet build`
    // passa com exit 0 sem compilar nenhum projeto (falso-positivo pego no E2E).
    const generateSlnContent = (): string => {
      const entries = blueprint.projects.map((proj) => ({
        name: proj.name,
        path: `src\\${proj.name}\\${proj.name}.csproj`,
        guid: crypto.randomUUID().toUpperCase(),
      }));
      let slnText = `Microsoft Visual Studio Solution File, Format Version 12.00\n# Visual Studio Version 17\nVisualStudioVersion = 17.0.31903.59\nMinimumVisualStudioVersion = 10.0.40219.1\n`;
      for (const e of entries) {
        const guid = `{${e.guid}}`;
        slnText += `Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "${e.name}", "${e.path}", "${guid}"\nEndProject\n`;
      }
      slnText += `Global\n\tGlobalSection(SolutionConfigurationPlatforms) = preSolution\n\t\tDebug|Any CPU = Debug|Any CPU\n\t\tRelease|Any CPU = Release|Any CPU\n\tEndGlobalSection\n`;
      slnText += `\tGlobalSection(ProjectConfigurationPlatforms) = postSolution\n`;
      for (const e of entries) {
        const guid = `{${e.guid}}`;
        slnText += `\t\t${guid}.Debug|Any CPU.ActiveCfg = Debug|Any CPU\n`;
        slnText += `\t\t${guid}.Debug|Any CPU.Build.0 = Debug|Any CPU\n`;
        slnText += `\t\t${guid}.Release|Any CPU.ActiveCfg = Release|Any CPU\n`;
        slnText += `\t\t${guid}.Release|Any CPU.Build.0 = Release|Any CPU\n`;
      }
      slnText += `\tEndGlobalSection\nEndGlobal\n`;
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
      // Phase 9: para C# o .sln canônico é o file-sln (conteúdo completo) — sem duplicata.
      ...(buildFileName !== `${projectName}.sln` ? [{
        id: 'file-build-root', name: buildFileName, type: 'file' as const, path: buildFileName, language: buildFileLang, contentSnippet: buildFileSnippet,
      }] : []),
      { id: 'file-editorconfig', name: '.editorconfig', type: 'file', path: '.editorconfig', language: 'ini', contentSnippet: `root = true\n\n[*]\nindent_style = space\nindent_size = 2` },
      { id: 'file-readme', name: 'README.md', type: 'file', path: 'README.md', language: 'markdown', contentSnippet: `# ${projectName}\n\nGenerated by Enterprise Software Factory Platform.\nStack: ${selectedStack?.name || lang}\nArchitecture: ${blueprint.architectureStyle}\nActive Features: ${activeFeatures.map((f) => f.name).join(', ')}\n\n## Build\n\n\`\`\`bash\ndotnet restore\ndotnet build ${projectName}.sln -c Release\ndotnet test ${projectName}.sln\n\`\`\`` },
      { id: 'file-vscode-ws', name: `${projectName}.code-workspace`, type: 'file', path: `${projectName}.code-workspace`, language: 'json', contentSnippet: vscodeWorkspaceSnippet },
      { id: 'file-sln', name: `${projectName}.sln`, type: 'file', path: `${projectName}.sln`, language: 'xml', contentSnippet: generateSlnContent() },
      { id: 'file-setup-sh', name: 'setup-ide.sh', type: 'file', path: 'setup-ide.sh', language: 'bash', contentSnippet: setupIdeScript },
      ...(lang === 'csharp' ? [
        { id: 'file-msbuild-props', name: 'Directory.Build.props', type: 'file' as const, path: 'Directory.Build.props', language: 'xml', contentSnippet: `<Project>\n  <PropertyGroup>\n    <Nullable>enable</Nullable>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <EnableNETAnalyzers>true</EnableNETAnalyzers>\n    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>\n  </PropertyGroup>\n</Project>` },
        { id: 'file-global-json', name: 'global.json', type: 'file' as const, path: 'global.json', language: 'json', contentSnippet: `{\n  "sdk": {\n    "version": "9.0.100",\n    "rollForward": "latestFeature"\n  }\n}` },
      ] : []),
    ];

    if (useEnvFile) {
      rootFiles.push(
        { id: 'file-env', name: '.env', type: 'file', path: '.env', language: 'ini', contentSnippet: envContent },
        { id: 'file-env-example', name: '.env.example', type: 'file', path: '.env.example', language: 'ini', contentSnippet: envExampleContent }
      );
    } else {
      rootFiles.push({
        id: 'file-launch-settings',
        name: 'appsettings.json',
        type: 'file',
        path: 'appsettings.json',
        language: 'json',
        contentSnippet: `{\n  "Logging": {\n    "LogLevel": {\n      "Default": "Information"\n    }\n  },\n  "AllowedHosts": "*"\n}`,
      });
    }

    // Phase 13: todos os generatedFiles das Features entram na árvore — por path real.
    // Paths hardcoded no catálogo (ex. src/Infrastructure/Diagnostics/...) são remapeados
    // para os nomes reais do blueprint (App.Infrastructure, App.Application, ...).
    const remapFeaturePath = (rawPath: string): string => {
      if (!rawPath.includes('/')) return rawPath;
      const infraName = blueprint.projects.find((p) => p.type === 'Infrastructure')?.name || 'App.Infrastructure';
      const appName = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
      const coreName = blueprint.projects.find((p) => p.type === 'Core')?.name || 'App.Core';
      let out = rawPath;
      out = out.replace(/^src\/Infrastructure\//, `src/${infraName}/`);
      out = out.replace(/^src\/Application\//, `src/${appName}/`);
      out = out.replace(/^src\/Core\//, `src/${coreName}/`);
      // Legacy fallback: src/App.Infrastructure/ já é nome real (RPA features), não remapeia.
      return out;
    };

    const insertByPath = (nodes: SolutionTreeNode[], fullPath: string, fileNode: SolutionTreeNode): void => {
      const parts = fullPath.split('/');
      const fileName = parts.pop()!;
      let cursor: SolutionTreeNode[] = nodes;
      let curPath = '';
      for (const part of parts) {
        curPath = curPath ? `${curPath}/${part}` : part;
        let folder = cursor.find((n) => n.path === curPath && (n.type === 'folder' || n.type === 'project'));
        if (!folder) {
          folder = { id: `dir-auto-${curPath}`, name: part, type: 'folder', path: curPath, children: [] };
          cursor.push(folder);
        }
        cursor = folder.children!;
      }
      // dedupe por path: feature + golden path podem colidir (ex. mesmo arquivo)
      if (!cursor.some((n) => n.path === fullPath && n.type === 'file')) {
        cursor.push(fileNode);
      }
    };

    // Primeiro, todos os arquivos de feature cujo path começa com src/ (inclui os novos de RPA)
    // — inseridos no srcFolderNode quando for src/App.*, ou em rootNodes quando for src/Infrastructure mapeado.
    const featureFilesForSrc: Array<{ gf: NonNullable<FeatureManifest['generatedFiles']>[number]; remapped: string }> = [];
    const featureFilesForRoot: Array<{ gf: NonNullable<FeatureManifest['generatedFiles']>[number]; remapped: string }> = [];

    activeFeatures.forEach((f) => {
      f.generatedFiles?.forEach((gf) => {
        const remapped = remapFeaturePath(gf.path);
        const fileNode: SolutionTreeNode = {
          id: `gf-${f.id}-${gf.path}`,
          name: remapped.split('/').pop()!,
          type: 'file',
          path: remapped,
          language: gf.language,
          contentSnippet: gf.templateSnippet,
        };
        if (remapped.includes('/')) {
          // src/... → srcFolderNode; outros com / mas não src (improvável) → rootNodes
          if (remapped.startsWith('src/')) {
            // Garante que srcFolderNode existe como raiz; inserção será após sua criação,
            // então enfileira para inserir depois. Para já, marca como pendente src.
            featureFilesForSrc.push({ gf, remapped });
            // fileNode guardado; inserção real após srcFolderNode criado
            // (usamos closure sobre fileNode derivado de gf)
            // Mantém fileNode para uso posterior — recriado no loop final
          } else {
            featureFilesForRoot.push({ gf, remapped });
            insertByPath(rootNodes, remapped, fileNode);
          }
        } else {
          rootFiles.push(fileNode);
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

    // Phase 13: insere os arquivos src/ das Features dentro de srcFolderNode (remapeados).
    // Patches namespace hardcoded (Infrastructure.*) para o nome real do projeto (App.Infrastructure.*).
    const patchSnippetNamespaces = (snippet: string): string => {
      const infraName = blueprint.projects.find((p) => p.type === 'Infrastructure')?.name || 'App.Infrastructure';
      const appName = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
      return snippet
        .replace(/namespace Infrastructure\.Persistence/g, `namespace ${infraName}.Persistence`)
        .replace(/namespace Infrastructure\.Diagnostics/g, `namespace ${infraName}.Diagnostics`)
        .replace(/namespace Infrastructure\.Security/g, `namespace ${infraName}.Security`)
        .replace(/namespace Infrastructure\.Auth/g, `namespace ${infraName}.Auth`)
        .replace(/namespace Infrastructure\.Workers/g, `namespace ${infraName}.Workers`)
        .replace(/namespace Infrastructure\.Scheduling/g, `namespace ${infraName}.Scheduling`)
        .replace(/namespace Infrastructure\.Caching/g, `namespace ${infraName}.Caching`)
        .replace(/namespace Application\.Common\.Behaviors/g, `namespace ${appName}.Common.Behaviors`);
    };

    const insertFeatureSrcFiles = (): void => {
      for (const { gf, remapped } of featureFilesForSrc) {
        const fileNode: SolutionTreeNode = {
          id: `gf-${gf.path}-${remapped}`,
          name: remapped.split('/').pop()!,
          type: 'file',
          path: remapped,
          language: gf.language,
          contentSnippet: patchSnippetNamespaces(gf.templateSnippet),
        };
        // remapped é "src/App.Infrastructure/Persistence/Foo.cs"
        // Tira o prefixo "src/" e insere relativo ao srcFolderNode.
        const rel = remapped.replace(/^src\//, '');
        const parts = rel.split('/');
        const fileName = parts.pop()!;
        let cursor: SolutionTreeNode[] = srcFolderNode.children!;
        let curPath = 'src';
        for (const part of parts) {
          curPath = `${curPath}/${part}`;
          let folder = cursor.find((n) => n.path === curPath && (n.type === 'folder' || n.type === 'project'));
          if (!folder) {
            // Se for um nome de projeto real (App.Core etc.), preserva type 'project'
            const isProject = blueprint.projects.some((p) => p.name === part);
            folder = { id: `dir-auto-${curPath}`, name: part, type: isProject ? 'project' : 'folder', path: curPath, children: [] };
            cursor.push(folder);
          }
          cursor = folder.children!;
        }
        const fullPath = remapped;
        if (!cursor.some((n) => n.path === fullPath && n.type === 'file')) {
          // Corrige o id/name já setado acima
          fileNode.name = fileName;
          fileNode.path = fullPath;
          cursor.push(fileNode);
        }
      }
    };

    blueprint.projects.forEach((proj) => {
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

      // Phase 16: Python packages need __init__.py
      if (lang === 'python') {
        projFolderNode.children?.push({
          id: `file-init-${proj.id}`,
          name: '__init__.py',
          type: 'file',
          path: `src/${proj.name}/__init__.py`,
          language: 'python',
          contentSnippet: `# ${proj.name} — package marker\n`,
        });
      }

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
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.usecase;\n\npublic record CreateTransactionCommand(double amount, String currency) {}` :
                lang === 'go' ? `package usecase\n\ntype CreateTransactionCommand struct {\n\tAmount float64\n\tCurrency string\n}` :
                lang === 'rust' ? `pub struct CreateTransactionCommand {\n    pub amount: f64,\n    pub currency: String,\n}` :
                lang === 'python' ? `class CreateTransactionCommand(BaseModel):\n    amount: float\n    currency: str` :
                lang === 'typescript' ? `export interface CreateTransactionCommand {\n  amount: number;\n  currency: string;\n}` :
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
                lang === 'java' ? `package com.acme.${projectName.toLowerCase()}.repository;\nimport org.springframework.data.jpa.repository.JpaRepository;\n\npublic interface TransactionRepository extends JpaRepository<Transaction, String> {}` :
                lang === 'go' ? `package persistence\n\ntype PostgresRepository struct {\n\tdb *sql.DB\n}` :
                lang === 'rust' ? `pub struct SqlxRepository {\n    pub pool: sqlx::PgPool,\n}` :
                lang === 'python' ? `from typing import Dict, Optional\n\nclass InMemoryRepository:\n    def __init__(self):\n        self._store: Dict[str, object] = {}\n\n    async def get_by_id(self, id: str) -> Optional[object]:\n        return self._store.get(id)\n\n    async def add(self, entity) -> None:\n        self._store[getattr(entity, 'id', str(id(entity)))] = entity\n` :
                lang === 'csharp' ? `using ${appName}.Common;\nusing ${coreName2}.Entities;\nusing System.Collections.Concurrent;\n\nnamespace ${proj.name}.Persistence;\n\npublic sealed class InMemoryRepository<T> : IRepository<T> where T : BaseEntity {\n    private readonly ConcurrentDictionary<Guid, T> _store = new();\n\n    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct) {\n        _store.TryGetValue(id, out var entity);\n        return Task.FromResult(entity);\n    }\n\n    public Task AddAsync(T entity, CancellationToken ct) {\n        _store[entity.Id] = entity;\n        return Task.CompletedTask;\n    }\n}` :
                `export class Repository {\n  async findOne(id: string) {}\n}`
            },
          ],
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
                lang === 'python' ? `from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get("/healthz")\nasync def healthz():\n    return {"status": "ok"}\n\n@router.post("/transactions")\nasync def create_transaction(payload: dict):\n    return {"id": "00000000-0000-0000-0000-000000000000"}\n` :
                lang === 'csharp' ? `using Microsoft.AspNetCore.Mvc;\n\nnamespace ${proj.name}.Controllers;\n\n[ApiController]\npublic abstract class BaseApiController : ControllerBase {\n    protected ILogger Logger { get; }\n\n    protected BaseApiController(ILogger logger) {\n        Logger = logger;\n    }\n\n    protected string TraceId => HttpContext.TraceIdentifier;\n}` :
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
        // Phase 17: TypeScript/Python main wiring (sem deps externas no base, com wiring quando feature ativa)
        if (lang === 'typescript') {
          const hasTs = (id: string): boolean => activeFeatureIds.includes(id);
          let moduleExtra = '';
          if (hasTs('feat-postgres-ef')) moduleExtra += '// PostgreSQL via TypeORM — configure DataSource with Npgsql\n';
          if (hasTs('feat-redis-cache')) moduleExtra += '// Redis cache — configure CacheModule\n';
          if (hasTs('feat-jwt-auth')) moduleExtra += '// JWT — configure JwtModule\n';
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
            contentSnippet: `${moduleExtra}export class AppModule {}\n`,
          });
        }
        if (lang === 'python') {
          const hasPy = (id: string): boolean => activeFeatureIds.includes(id);
          let extraPy = '';
          if (hasPy('feat-postgres-ef')) extraPy += '# PostgreSQL — configure SQLAlchemy async engine\n';
          if (hasPy('feat-redis-cache')) extraPy += '# Redis — configure redis.asyncio\n';
          if (hasPy('feat-jwt-auth')) extraPy += '# JWT — configure OAuth2PasswordBearer\n';
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

      // Module manifest file (e.g., .csproj, Cargo.toml, package.json)
      const refXml = proj.references.map((rId) => {
        const refProj = blueprint.projects.find((p) => p.id === rId);
        return refProj ? `    <ProjectReference Include="..\\${refProj.name}\\${refProj.name}.csproj" />` : '';
      }).filter(Boolean).join('\n');

      // Phase 12: manifest usa pacotes do módulo + injetados das Features (não só do módulo).
      const effectivePackages = manifestPackages.get(proj.id) || [];
      const pkgXml = effectivePackages.map((p) => `    <PackageReference Include="${p.name}" Version="${p.version}" />`).join('\n');
      // Phase 9: Tests C# ganham xUnit real (restore via NuGet); Api usa Sdk.Web (Program.cs).
      const testPkgs = lang === 'csharp' && proj.type === 'Tests'
        ? `\n    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.0" />\n    <PackageReference Include="xunit" Version="2.9.2" />\n    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />`
        : '';
      const allPkgs = [pkgXml, testPkgs].filter(Boolean).join('\n');

      const projManifestFileName =
        lang === 'csharp' ? `${proj.name}.csproj` :
        lang === 'python' ? 'pyproject.toml' :
        'package.json';
      const sdk = lang === 'csharp' && proj.type === 'API' ? 'Microsoft.NET.Sdk.Web' : 'Microsoft.NET.Sdk';
      const projManifestSnippet = (() => {
        if (lang === 'csharp') {
          return `<Project Sdk="${sdk}">\n  <PropertyGroup>\n    <TargetFramework>net9.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n\n  <ItemGroup>\n${refXml || '    <!-- No Outbound Project References -->'}\n  </ItemGroup>\n\n  <ItemGroup>\n${allPkgs || '    <!-- Core Packages -->'}\n  </ItemGroup>\n</Project>`;
        }
        if (lang === 'python') {
          const deps = effectivePackages.length > 0
            ? effectivePackages.map((p) => `${p.name} = "^${p.version}"`).join('\n')
            : 'fastapi = "^0.111.0"\nuvicorn = "^0.30.0"\npydantic = "^2.0.0"';
          return `[tool.poetry]\nname = "${proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}"\nversion = "0.1.0"\n\n[tool.poetry.dependencies]\npython = "^3.12"\n${deps}\n\n[build-system]\nrequires = ["poetry-core"]\nbuild-backend = "poetry.core.masonry.api"\n`;
        }
        return `{\n  "name": "${proj.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}",\n  "version": "1.0.0",\n  "type": "commonjs",\n  "scripts": {\n    "build": "tsc --noEmit",\n    "test": "echo \\"No tests specified\\" && exit 0"\n  },\n  "dependencies": {\n${effectivePackages.map((p) => `    "${p.name}": "${p.version}"`).join(',\n')}\n  },\n  "devDependencies": {\n    "typescript": "^5.9.0"\n  }\n}`;
      })();

      projFolderNode.children?.unshift({
        id: `file-proj-manifest-${proj.id}`,
        name: projManifestFileName,
        type: 'file',
        path: `src/${proj.name}/${projManifestFileName}`,
        language: lang === 'csharp' ? 'xml' : lang === 'python' ? 'toml' : 'json',
        contentSnippet: projManifestSnippet,
      });

      // Phase 15: TypeScript precisa de tsconfig.json para compilar (tsc --noEmit)
      if (lang === 'typescript') {
        projFolderNode.children?.push({
          id: `file-tsconfig-${proj.id}`,
          name: 'tsconfig.json',
          type: 'file',
          path: `src/${proj.name}/tsconfig.json`,
          language: 'json',
          contentSnippet: `{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "commonjs",\n    "moduleResolution": "node",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "jsx": "react-jsx",\n    "outDir": "dist",\n    "rootDir": ".",\n    "declaration": false\n  },\n  "include": ["**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules", "dist"]\n}`,
        });
      }

      // Phase 9/15: teste real por stack — C# usa xUnit, TypeScript usa vitest-like stub que compila com tsc
      if (proj.type === 'Tests') {
        if (lang === 'csharp') {
          const appName3 = blueprint.projects.find((p) => p.type === 'Application')?.name || 'App.Application';
          const coreName3 = blueprint.projects.find((p) => p.type === 'Core')?.name || 'App.Core';
          projFolderNode.children?.push({
            id: `dir-${proj.id}-scaffold-tests`,
            name: 'ScaffoldTests',
            type: 'folder',
            path: `src/${proj.name}/ScaffoldTests`,
            children: [
              {
                id: 'file-scaffold-tests',
                name: 'GoldenPathTests.cs',
                type: 'file',
                path: `src/${proj.name}/ScaffoldTests/GoldenPathTests.cs`,
                language: 'csharp',
                contentSnippet:
                  `using Xunit;\nusing ${appName3}.Commands;\nusing ${appName3}.Common;\nusing ${coreName3}.Entities;\n\nnamespace ${proj.name}.ScaffoldTests;\n\npublic sealed class GoldenPathTests {\n    private sealed class FakeRepository : IRepository<Transaction> {\n        private readonly Dictionary<Guid, Transaction> _store = new();\n\n        public Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct) {\n            _store.TryGetValue(id, out var entity);\n            return Task.FromResult(entity);\n        }\n\n        public Task AddAsync(Transaction entity, CancellationToken ct) {\n            _store[entity.Id] = entity;\n            return Task.CompletedTask;\n        }\n    }\n\n    [Fact]\n    public async Task CreateTransaction_ReturnsNewId_AndPersists() {\n        var handler = new CreateTransactionHandler(new FakeRepository(), TimeProvider.System);\n        var command = new CreateTransactionCommand(100m, "BRL");\n\n        var id = await handler.HandleAsync(command, CancellationToken.None);\n\n        Assert.NotEqual(Guid.Empty, id);\n    }\n\n    [Fact]\n    public async Task CreatedTransaction_CanBeReadBack() {\n        var repository = new FakeRepository();\n        var handler = new CreateTransactionHandler(repository, TimeProvider.System);\n        var id = await handler.HandleAsync(new CreateTransactionCommand(100m, "BRL"), CancellationToken.None);\n\n        var stored = await repository.GetByIdAsync(id, CancellationToken.None);\n\n        Assert.NotNull(stored);\n        Assert.Equal(100m, stored.Amount);\n    }\n}`,
              },
            ],
          });
        } else if (lang === 'typescript') {
          projFolderNode.children?.push({
            id: `file-test-${proj.id}`,
            name: 'example.test.ts',
            type: 'file',
            path: `src/${proj.name}/example.test.ts`,
            language: 'typescript',
            contentSnippet: `// Scaffold smoke test — valid TypeScript without external deps (vitest not required at tsc time)\nexport function exampleTest(): boolean {\n  return 1 + 1 === 2;\n}\n`,
          });
        }
      }

      // Phase 14/15: 20 itens de checklist web — apenas para projetos web (API/UI).
      // Refinado por framework: csharp → wwwroot/html, typescript → public + src/components/*.tsx,
      // outros → public/html genérico. Core/Application/Infrastructure/Tests/Worker não recebem.
      if (proj.type === 'API' || proj.type === 'UI') {
        const staticFolder = lang === 'csharp' ? 'wwwroot' : 'public';
        const checklist: Array<{ rel: string; language: string; snippet: string }> = (() => {
          if (lang === 'typescript') {
            // TypeScript — mantém checklist como estáticos em public (sem JSX) para compilar
            // tanto NestJS (backend) quanto Next.js (frontend) com tsc puro. TSX exigiria @types/react.
            return [
              {
                rel: `public/404.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>404 — ${projectName}</title></head><body><h1>404 — Página não encontrada</h1><a href="/">Voltar</a></body></html>`,
              },
              {
                rel: `public/seo/meta-title.html`,
                language: 'html',
                snippet: `<!-- Meta Title -->\n<title>${projectName} — Plataforma Enterprise</title>`,
              },
              {
                rel: `public/seo/meta-description.html`,
                language: 'html',
                snippet: `<meta name="description" content="${projectName}: solução padronizada com Clean Architecture.">`,
              },
              {
                rel: `public/components/cta-above-fold.html`,
                language: 'html',
                snippet: `<section><h1>${projectName}</h1><a href="#contact">Começar agora — CTA acima da dobra</a></section>`,
              },
              {
                rel: `public/favicon.svg`,
                language: 'xml',
                snippet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#2563eb"/><text x="50" y="58" text-anchor="middle" font-size="48" fill="white">${projectName.slice(0, 2).toUpperCase()}</text></svg>`,
              },
              {
                rel: `public/robots.txt`,
                language: 'plaintext',
                snippet: `User-agent: *\nAllow: /\nDisallow: /api/private/\nSitemap: /sitemap.xml`,
              },
              {
                rel: `public/sitemap.xml`,
                language: 'xml',
                snippet: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc><priority>1.0</priority></url>\n</urlset>`,
              },
              {
                rel: `public/images/og-image.svg`,
                language: 'xml',
                snippet: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0e1013"/><text x="600" y="300" text-anchor="middle" fill="white" font-size="56">${projectName}</text></svg>`,
              },
              {
                rel: `public/components/image-alt-example.html`,
                language: 'html',
                snippet: `<img src="/images/og-image.svg" alt="Banner Open Graph do ${projectName}" width="1200" height="630" loading="lazy">`,
              },
              {
                rel: `public/css/breakpoints.css`,
                language: 'css',
                snippet: `.container { max-width: 1120px; margin: 0 auto; }\n@media (min-width: 640px) { .container { padding: 0 1.5rem; } }`,
              },
              {
                rel: `public/components/fixed-cta-mobile.html`,
                language: 'html',
                snippet: `<a href="#contact" class="fixed-cta-mobile">Fale connosco — CTA fixo mobile</a>`,
              },
              {
                rel: `public/components/loading.html`,
                language: 'html',
                snippet: `<div aria-busy="true">A carregar…</div>`,
              },
              {
                rel: `public/components/error.html`,
                language: 'html',
                snippet: `<div role="alert">Erro ao carregar</div>`,
              },
              {
                rel: `public/thank-you.html`,
                language: 'html',
                snippet: `<h1>Obrigado!</h1><p>Recebemos o seu contacto.</p>`,
              },
              {
                rel: `public/privacy.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Privacidade — ${projectName}</title></head><body><h1>Política de Privacidade</h1><p>Exemplo LGPD.</p></body></html>`,
              },
              {
                rel: `public/terms.html`,
                language: 'html',
                snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termos — ${projectName}</title></head><body><h1>Termos</h1><p>Exemplo de termos.</p></body></html>`,
              },
              {
                rel: `public/components/cookie-banner.html`,
                language: 'html',
                snippet: `<div role="dialog" aria-label="cookies">Usamos cookies. <a href="/privacy.html">Saiba mais</a></div>`,
              },
              {
                rel: `public/js/analytics.js`,
                language: 'javascript',
                snippet: `var GA_ID='G-XXXXXXX';`,
              },
              {
                rel: `public/contact.html`,
                language: 'html',
                snippet: `<address>Av. Paulista, 1000 — São Paulo<br>contact@example.com</address>`,
              },
              {
                rel: `public/images/README-compressed.md`,
                language: 'markdown',
                snippet: `# Imagens comprimidas\n\nOtimize WebP/AVIF.\n`,
              },
            ];
          }
          // csharp e fallback genérico (html sob wwwroot/public)
          return [
          {
            rel: `${staticFolder}/404.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>404 — Página não encontrada | ${projectName}</title><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main style="max-width:600px;margin:4rem auto;text-align:center;font-family:system-ui"><h1>404 — Página não encontrada</h1><p>A página que procura não existe ou foi movida.</p><a href="/" style="display:inline-block;margin-top:1rem;padding:0.6rem 1.2rem;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Voltar ao início</a></main></body></html>`,
          },
          {
            rel: `${staticFolder}/seo/meta-title.html`,
            language: 'html',
            snippet: `<!-- Meta Title — inclua no <head> de cada página -->\n<title>${projectName} — Plataforma Enterprise</title>`,
          },
          {
            rel: `${staticFolder}/seo/meta-description.html`,
            language: 'html',
            snippet: `<!-- Meta Description — 150-160 chars -->\n<meta name="description" content="${projectName}: solução padronizada com Clean Architecture, observabilidade e segurança enterprise.">`,
          },
          {
            rel: `${staticFolder}/components/cta-above-fold.html`,
            language: 'html',
            snippet: `<section style="padding:3rem 1rem;text-align:center"><h1>${projectName}</h1><p>Solução padronizada pronta para produção.</p><a href="#contact" style="display:inline-block;padding:0.75rem 1.5rem;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none">Começar agora — CTA acima da dobra</a></section>`,
          },
          {
            rel: `${staticFolder}/favicon.svg`,
            language: 'xml',
            snippet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#2563eb"/><text x="50" y="58" text-anchor="middle" font-size="48" fill="white" font-family="system-ui">${projectName.slice(0, 2).toUpperCase()}</text></svg>`,
          },
          {
            rel: `${staticFolder}/robots.txt`,
            language: 'plaintext',
            snippet: `User-agent: *\nAllow: /\nDisallow: /api/private/\nSitemap: /sitemap.xml`,
          },
          {
            rel: `${staticFolder}/sitemap.xml`,
            language: 'xml',
            snippet: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc><priority>1.0</priority></url>\n  <url><loc>https://example.com/contact</loc><priority>0.8</priority></url>\n  <url><loc>https://example.com/privacy</loc><priority>0.3</priority></url>\n</urlset>`,
          },
          {
            rel: `${staticFolder}/images/og-image.svg`,
            language: 'xml',
            snippet: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0e1013"/><rect x="40" y="40" width="1120" height="550" rx="24" fill="#1a1d26" stroke="#2e3342"/><text x="600" y="300" text-anchor="middle" font-size="56" fill="white" font-family="system-ui">${projectName}</text><text x="600" y="360" text-anchor="middle" font-size="24" fill="#9aa1b8" font-family="system-ui">Open Graph • 1200×630</text></svg>`,
          },
          {
            rel: `${staticFolder}/components/image-alt-example.html`,
            language: 'html',
            snippet: `<!-- Todas as imagens com alt descritivo -->\n<img src="/images/og-image.svg" alt="Banner Open Graph do ${projectName} — ilustração da plataforma" width="1200" height="630" loading="lazy">`,
          },
          {
            rel: `${staticFolder}/css/breakpoints.css`,
            language: 'css',
            snippet: `/* Breakpoints móveis — mobile-first */\n:root { --content-max: 1120px; }\n.container { max-width: var(--content-max); margin: 0 auto; padding: 0 1rem; }\n@media (min-width: 640px) { .container { padding: 0 1.5rem; } }\n@media (min-width: 1024px) { .container { padding: 0 2rem; } }\n@media (min-width: 1280px) { .container { max-width: 1280px; } }`,
          },
          {
            rel: `${staticFolder}/components/fixed-cta-mobile.html`,
            language: 'html',
            snippet: `<!-- CTA fixo mobile — aparece só abaixo de 768px -->\n<a href="#contact" class="fixed-cta-mobile" style="position:fixed;bottom:1rem;left:1rem;right:1rem;display:block;padding:1rem;background:#2563eb;color:#fff;text-align:center;border-radius:12px;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,0.3)">Fale connosco — CTA fixo mobile</a>\n<style>@media (min-width: 768px) { .fixed-cta-mobile { display:none; } }</style>`,
          },
          {
            rel: `${staticFolder}/components/loading.html`,
            language: 'html',
            snippet: `<!-- Estados de carregamento — skeleton -->\n<div aria-busy="true" aria-label="A carregar"><div style="height:1rem;background:#e5e7eb;border-radius:4px;animation:pulse 1.5s infinite"></div><div style="height:1rem;background:#e5e7eb;border-radius:4px;margin-top:0.5rem;animation:pulse 1.5s infinite 0.2s"></div></div>\n<style>@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }</style>`,
          },
          {
            rel: `${staticFolder}/components/error.html`,
            language: 'html',
            snippet: `<!-- Estados de erro — acessível -->\n<div role="alert" style="padding:1rem;border:1px solid #fca5a5;background:#fef2f2;border-radius:8px;color:#991b1b"><strong>Erro ao carregar</strong><p>Tente novamente em alguns segundos.</p><button onclick="location.reload()" style="margin-top:0.5rem;padding:0.5rem 1rem;background:#dc2626;color:#fff;border-radius:6px;border:0">Tentar novamente</button></div>`,
          },
          {
            rel: `${staticFolder}/thank-you.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Obrigado — ${projectName}</title></head><body><main style="max-width:600px;margin:4rem auto;text-align:center"><h1>Obrigado!</h1><p>Recebemos o seu contacto. Responderemos em até 1 dia útil.</p><a href="/">Voltar ao início</a></main></body></html>`,
          },
          {
            rel: `${staticFolder}/privacy.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Política de Privacidade — ${projectName}</title><meta name="robots" content="noindex"></head><body><main style="max-width:720px;margin:2rem auto;padding:0 1rem"><h1>Política de Privacidade</h1><p>Esta é uma página de exemplo. Substitua pelo texto jurídico real conforme LGPD/GDPR.</p><p>Última atualização: ${new Date().toISOString().slice(0, 10)}</p></main></body></html>`,
          },
          {
            rel: `${staticFolder}/terms.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Termos e Condições — ${projectName}</title><meta name="robots" content="noindex"></head><body><main style="max-width:720px;margin:2rem auto;padding:0 1rem"><h1>Termos e Condições</h1><p>Exemplo de termos. Substitua pelo documento jurídico real.</p></main></body></html>`,
          },
          {
            rel: `${staticFolder}/components/cookie-banner.html`,
            language: 'html',
            snippet: `<!-- Banner de cookies — LGPD -->\n<div id="cookie-banner" role="dialog" aria-label="Consentimento de cookies" style="position:fixed;bottom:0;left:0;right:0;padding:1rem;background:#111827;color:#fff;display:flex;gap:1rem;align-items:center;justify-content:space-between"><span>Usamos cookies para analytics e melhoria contínua. <a href="/privacy.html" style="color:#93c5fd">Saiba mais</a></span><button onclick="document.getElementById('cookie-banner').remove()" style="padding:0.5rem 1rem;background:#2563eb;color:#fff;border:0;border-radius:6px">Aceitar</button></div>`,
          },
          {
            rel: `${staticFolder}/js/analytics.js`,
            language: 'javascript',
            snippet: `// Analytics — substitua GA_ID pelo ID real (ex. G-XXXX) e carregue apenas após consentimento.\n(function(){ var GA_ID = 'G-XXXXXXX'; var s=document.createElement('script'); s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID; document.head.appendChild(s); window.dataLayer=window.dataLayer||[]; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true }); })();`,
          },
          {
            rel: `${staticFolder}/contact.html`,
            language: 'html',
            snippet: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contacto — ${projectName}</title></head><body><main style="max-width:600px;margin:2rem auto;padding:0 1rem"><h1>Contacto</h1><address style="font-style:normal;line-height:1.6"><strong>${projectName}</strong><br>Av. Paulista, 1000 — São Paulo, SP — 01310-100 — Brasil<br>Email: <a href="mailto:contact@example.com">contact@example.com</a><br>Tel: +55 11 99999-0000</address></main></body></html>`,
          },
          {
            rel: `${staticFolder}/images/README-compressed.md`,
            language: 'markdown',
            snippet: `# Imagens comprimidas\n\nTodas as imagens em \`${staticFolder}/images/\` devem ser otimizadas antes do deploy:\n\n- Converta para WebP/AVIF quando possível (\`cwebp\`, \`sharp\`, \`squoosh\`).\n- Comprima SVGs com SVGO.\n- Use \`loading="lazy"\` e \`width\`/\`height\` para evitar CLS.\n- Exemplo: \`og-image.svg\` acima é vetorial (sem peso); para fotos, exporte em 1200×630 WebP &lt; 150KB.\n`,
          },
        ];
      })();
        for (const item of checklist) {
          const fullPath = `src/${proj.name}/${item.rel}`;
          const parts = item.rel.split('/');
          const fileName = parts.pop()!;
          let cursor: SolutionTreeNode[] = projFolderNode.children!;
          let curPath = `src/${proj.name}`;
          for (const part of parts) {
            curPath = `${curPath}/${part}`;
            let folder = cursor.find((n) => n.path === curPath);
            if (!folder) {
              folder = { id: `dir-${curPath}`, name: part, type: 'folder', path: curPath, children: [] };
              cursor.push(folder);
            }
            cursor = folder.children!;
          }
          if (!cursor.some((n) => n.path === fullPath)) {
            cursor.push({
              id: `checklist-${proj.id}-${item.rel}`,
              name: fileName,
              type: 'file',
              path: fullPath,
              language: item.language,
              contentSnippet: item.snippet,
            });
          }
        }
      }

      srcFolderNode.children?.push(projFolderNode);
    });

    // Phase 13: feature src files entram no srcFolderNode (após projetos base)
    insertFeatureSrcFiles();

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

    // Phase 7: contagem real da árvore (sem estimativa). Nome mantido por compatibilidade.
    let realFileCount = 0;
    let realFolderCount = 0;
    const countNodes = (nodes: SolutionTreeNode[]) => {
      for (const n of nodes) {
        if (n.type === 'file') realFileCount++;
        else { realFolderCount++; if (n.children) countNodes(n.children); }
      }
    };
    countNodes(rootNodes);

    return {
      solutionName: `${projectName}.sln`,
      estimatedFileCount: realFileCount,
      estimatedFolderCount: realFolderCount,
      projectReferencesCount,
      packageDependenciesCount: packagesList.length,
      solutionTree: rootNodes,
      allPackages: packagesList,
    };
  }

  /**
   * Strips path separators, ".." traversal segments, and leading dots from a single
   * path component so user- or import-supplied names can never escape the zip root
   * (Zip Slip) when used as a JSZip file/folder name.
   */
  private static sanitizeZipEntryName(name: string): string {
    const cleaned = name
      .replace(/[\\/]+/g, '_')
      .split('_')
      .filter((part) => part !== '' && part !== '.' && part !== '..')
      .join('_');
    return cleaned || 'unnamed';
  }

  static async downloadSolutionZip(solutionTree: SolutionTreeNode[], projectName: string): Promise<void> {
    const zip = new JSZip();

    function addNodesToZip(nodes: SolutionTreeNode[], currentFolder: JSZip) {
      for (const node of nodes) {
        const safeName = ProjectService.sanitizeZipEntryName(node.name);
        if (node.type === 'file') {
          currentFolder.file(safeName, node.contentSnippet || '');
        } else if (node.type === 'folder' || node.type === 'project') {
          const subFolder = currentFolder.folder(safeName);
          if (subFolder && node.children) {
            addNodesToZip(node.children, subFolder);
          }
        }
      }
    }

    const rootFolder = zip.folder(ProjectService.sanitizeZipEntryName(projectName)) || zip;
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
