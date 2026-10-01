import { Project, Blueprint, FeatureManifest } from '../types/factory';
import { projectRepository } from './repositories/project.repository';
import { techStackRepository } from './repositories/techStack.repository';
import { FeatureService } from './featureService';
import JSZip from 'jszip';

export type { GeneratedSolutionPreview, SolutionTreeNode } from './scaffold/types';
import type { GeneratedSolutionPreview, SolutionTreeNode, ProjectScaffoldContext } from './scaffold/types';
import { addGoldenPathFiles } from './scaffold/goldenPathFiles';
import { addProjectManifestAndTests } from './scaffold/projectManifest';
import { addWebAssets } from './scaffold/webAssets';
import { buildRootFiles } from './scaffold/rootFiles';


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

    const { javaPackageBase, vscodeTasksSnippet, vscodeLaunchSnippet, rootFiles } = buildRootFiles({
      blueprint, projectName, lang, useEnvFile, customEnvVars, activeFeatures, selectedStack,
    });

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

      // Phase 19: Dart usa path relativo (lib/..., test/...) sem prefixo src/.
      // Normaliza separadores (blueprint pode trazer backslash em Windows).
      const normalizedProjName = proj.name.replace(/\\/g, '/');
      const projBasePath =
        lang === 'dart' && (normalizedProjName.startsWith('lib/') || normalizedProjName.startsWith('test/'))
          ? normalizedProjName
          : `src/${proj.name}`;
      const projFolderNode: SolutionTreeNode = {
        id: `dir-${proj.id}`,
        name: proj.name,
        type: 'project',
        path: projBasePath,
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

      const projectCtx: ProjectScaffoldContext = { blueprint, proj, lang, projectName, javaPackageBase, activeFeatureIds, fileExt, codeLang, projBasePath, projFolderNode, manifestPackages };
      addGoldenPathFiles(projectCtx);
      addProjectManifestAndTests(projectCtx);
      addWebAssets(projectCtx);

      srcFolderNode.children?.push(projFolderNode);
    });

    // Phase 13: feature src files entram no srcFolderNode (após projetos base)
    insertFeatureSrcFiles();

    // Phase 20: cada crate Rust ganha src/lib.rs com include! de TODOS os .rs do crate
    // (golden path + features, por isso roda após insertFeatureSrcFiles). Sem isso o
    // cargo ignora os arquivos (só compila src/lib.rs).
    if (lang === 'rust') {
      for (const proj of blueprint.projects) {
        const crateFolder = srcFolderNode.children?.find(
          (n) => (n.type === 'project' || n.type === 'folder') && n.path === `src/${proj.name}`
        );
        if (!crateFolder?.children) continue;
        const rsFiles: string[] = [];
        const collectRs = (nodes: SolutionTreeNode[] | undefined, prefix: string): void => {
          for (const n of nodes || []) {
            if (n.type === 'file' && n.name.endsWith('.rs') && n.name !== 'lib.rs') {
              rsFiles.push(`${prefix}${n.name}`);
            }
            if (n.children) {
              const rel = n.path.startsWith(`src/${proj.name}/`)
                ? n.path.slice(`src/${proj.name}/`.length)
                : n.name;
              // rel is already relative to the crate root — don't prepend prefix again
              // (otherwise nested folders become "A/A/B/x.rs").
              collectRs(n.children, n.path.startsWith(`src/${proj.name}/`) ? `${rel}/` : `${prefix}${rel}/`);
            }
          }
        };
        collectRs(crateFolder.children, '');
        // Every workspace member needs a target, otherwise `cargo build` fails with
        // "no targets specified in the manifest" for source-less crates (e.g. tests).
        const libContent = rsFiles.length
          ? rsFiles.map((f) => `include!("../${f}");`).join('\n') + '\n'
          : '// No sources generated for this crate yet.\n';
        let srcFolder = crateFolder.children?.find((n) => n.name === 'src');
        if (!srcFolder) {
          srcFolder = {
            id: `dir-${proj.id}-src`, name: 'src', type: 'folder',
            path: `src/${proj.name}/src`, children: [],
          };
          crateFolder.children?.push(srcFolder);
        }
        srcFolder.children?.push({
          id: `file-lib-${proj.id}`,
          name: 'lib.rs',
          type: 'file',
          path: `src/${proj.name}/src/lib.rs`,
          language: 'rust',
          contentSnippet: libContent,
        });
      }
    }

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
