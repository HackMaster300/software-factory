import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectService } from './projectService';
import type { Project, Blueprint } from '../types/factory';

// Access the private static sanitizer directly — it's the exact regression guard
// for the Zip Slip fix (CWE-22) made earlier: node names from user-editable module
// names or imported workspace JSON must never be able to escape the zip root.
const sanitize = (ProjectService as unknown as { sanitizeZipEntryName: (name: string) => string }).sanitizeZipEntryName;

describe('ProjectService.sanitizeZipEntryName (Zip Slip regression guard)', () => {
  it('leaves a normal name untouched', () => {
    expect(sanitize('App.Core')).toBe('App.Core');
  });

  it('strips parent-directory traversal segments', () => {
    expect(sanitize('../../etc/passwd')).not.toContain('..');
  });

  it('strips path separators so no nested path can be smuggled in', () => {
    const result = sanitize('foo/bar\\baz');
    expect(result).not.toMatch(/[\\/]/);
  });

  it('never returns an empty string', () => {
    expect(sanitize('..')).not.toBe('');
    expect(sanitize('')).not.toBe('');
  });
});

const baseBlueprint: Blueprint = {
  id: 'bp-project-test',
  name: 'Project Test Blueprint',
  description: '',
  architectureStyle: 'CleanArchitecture',
  techStackId: 'stack-dotnet9',
  projects: [],
  featureIds: [],
  disabledAutoFeatures: [],
  ruleSetId: 'ruleset-clean-arch',
  profiles: {
    securityProfileId: 'sec-prof-jwt',
    databaseProfileId: 'db-prof-pg',
    dockerProfileId: 'docker-prof-prod',
    cacheProfileId: 'cache-prof-redis',
    loggingProfileId: 'log-prof-opentelemetry',
  },
};

const makeProject = (id: string, name: string): Project => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  description: '',
  organizationId: 'org-1',
  workspaceId: 'ws-1',
  templateId: 'tmpl-1',
  blueprint: baseBlueprint,
  status: 'draft',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  customConfig: {},
});

describe('ProjectService CRUD', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty', () => {
    expect(ProjectService.getProjects()).toEqual([]);
  });

  it('saveProject creates a new project when its id is not already present', () => {
    ProjectService.saveProject(makeProject('proj-a', 'Project A'));
    expect(ProjectService.getProjects()).toHaveLength(1);
    expect(ProjectService.getProjectById('proj-a')?.name).toBe('Project A');
  });

  it('saveProject updates in place rather than duplicating when the id already exists', () => {
    ProjectService.saveProject(makeProject('proj-a', 'Project A'));
    const updated = { ...makeProject('proj-a', 'Project A'), name: 'Project A Renamed' };
    ProjectService.saveProject(updated);

    const all = ProjectService.getProjects();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Project A Renamed');
  });

  it('getProjectById returns undefined for an id that does not exist', () => {
    expect(ProjectService.getProjectById('does-not-exist')).toBeUndefined();
  });
});

describe('ProjectService.getEnvPresetsForStack', () => {
  it('returns C#-specific env vars for the csharp language', () => {
    const vars = ProjectService.getEnvPresetsForStack('stack-dotnet9', 'csharp');
    expect(vars.some((v) => v.key === 'ASPNETCORE_ENVIRONMENT')).toBe(true);
  });

  it('returns Node/TypeScript-specific env vars for the typescript language', () => {
    const vars = ProjectService.getEnvPresetsForStack('stack-nextjs', 'typescript');
    expect(vars.some((v) => v.key === 'NODE_ENV')).toBe(true);
    expect(vars.some((v) => v.key === 'ASPNETCORE_ENVIRONMENT')).toBe(false);
  });

  it('returns Python-specific env vars for the python language', () => {
    const vars = ProjectService.getEnvPresetsForStack('stack-python-fastapi', 'python');
    expect(vars.some((v) => v.key === 'FASTAPI_ENV')).toBe(true);
  });

  it('returns a generic fallback preset for an unrecognized language', () => {
    const vars = ProjectService.getEnvPresetsForStack('stack-does-not-exist', 'cobol');
    expect(vars.some((v) => v.key === 'PORT')).toBe(true);
    expect(vars.some((v) => v.key === 'DATABASE_URL')).toBe(true);
  });
});

describe('ProjectService.generateSolutionPreview', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('builds a solution tree with root files, a src folder, and a .vscode folder', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'p-core', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'p-api', name: 'App.Api', type: 'API', references: ['p-core'], description: '' },
      ],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');

    expect(preview.solutionName).toBe('Acme.Test.sln');
    expect(preview.solutionTree.some((n) => n.name === 'src')).toBe(true);
    expect(preview.solutionTree.some((n) => n.name === '.vscode')).toBe(true);
    expect(preview.solutionTree.some((n) => n.name === 'README.md')).toBe(true);
    expect(preview.projectReferencesCount).toBe(1);
  });

  it('adds .env / .env.example when useEnvFile is true, and appsettings.json instead when false', () => {
    const blueprint: Blueprint = { ...baseBlueprint, projects: [] };

    const withEnv = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test', true);
    const withoutEnv = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test', false);

    expect(withEnv.solutionTree.some((n) => n.name === '.env')).toBe(true);
    expect(withEnv.solutionTree.some((n) => n.name === '.env.example')).toBe(true);
    expect(withoutEnv.solutionTree.some((n) => n.name === '.env')).toBe(false);
    expect(withoutEnv.solutionTree.some((n) => n.name === 'appsettings.json')).toBe(true);
    // The env-file variant has 2 more root files than the appsettings-only variant.
    expect(withEnv.estimatedFileCount).toBeGreaterThan(withoutEnv.estimatedFileCount);
  });

  it('collects package dependencies from both blueprint module packages and active feature-generated packages', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'p-infra', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '', packages: [{ name: 'Serilog', version: '3.0.0' }] },
      ],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    expect(preview.allPackages.some((p) => p.name === 'Serilog')).toBe(true);
    expect(preview.packageDependenciesCount).toBe(preview.allPackages.length);
  });

  it('injects active feature packages into matching project manifests by type (Phase 12)', () => {
    // feat-postgres-ef targets Infrastructure+Core; feat-jwt-auth targets Infrastructure+API.
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: ['c'], description: '' },
        { id: 'a', name: 'App.Api', type: 'API', references: ['i'], description: '' },
      ],
      featureIds: ['feat-postgres-ef', 'feat-jwt-auth'],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    const findManifest = (projName: string): string => {
      const folder = preview.solutionTree
        .find((n) => n.name === 'src')
        ?.children?.find((n) => n.name === projName);
      const manifest = folder?.children?.find((n) => n.name === `${projName}.csproj`);
      return manifest?.contentSnippet || '';
    };

    // Npgsql vai para Infrastructure e Core; JwtBearer para Infrastructure e API — nunca para Core.
    expect(findManifest('App.Infrastructure')).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
    expect(findManifest('App.Infrastructure')).toContain('Microsoft.AspNetCore.Authentication.JwtBearer');
    expect(findManifest('App.Core')).toContain('Npgsql.EntityFrameworkCore.PostgreSQL');
    expect(findManifest('App.Core')).not.toContain('Microsoft.AspNetCore.Authentication.JwtBearer');
    expect(findManifest('App.Api')).toContain('Microsoft.AspNetCore.Authentication.JwtBearer');
  });

  it('does not duplicate a feature package already present on the module (Phase 12)', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '', packages: [{ name: 'Npgsql.EntityFrameworkCore.PostgreSQL', version: '9.0.0' }] },
      ],
      featureIds: ['feat-postgres-ef'],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    const folder = preview.solutionTree.find((n) => n.name === 'src')
      ?.children?.find((n) => n.name === 'App.Infrastructure');
    const manifest = folder?.children?.find((n) => n.name === 'App.Infrastructure.csproj')?.contentSnippet || '';
    expect(manifest.match(/Npgsql\.EntityFrameworkCore\.PostgreSQL/g)?.length).toBe(1);
  });

  it('does not mutate the input blueprint when injecting feature packages (Phase 12)', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: [], description: '' },
      ],
      featureIds: ['feat-postgres-ef'],
    };

    ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    expect(blueprint.projects[0].packages).toBeUndefined();
  });

  it('injects active feature generatedFiles by real path per Phase 13 (remapped)', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: ['c'], description: '' },
        { id: 'a', name: 'App.Api', type: 'API', references: ['i'], description: '' },
      ],
      featureIds: ['feat-postgres-ef', 'feat-healthchecks', 'feat-jwt-auth'],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    const allFiles = (nodes: typeof preview.solutionTree): string[] => {
      const out: string[] = [];
      const walk = (ns: typeof preview.solutionTree): void => {
        for (const n of ns) {
          if (n.type === 'file') out.push(n.path);
          if (n.children) walk(n.children);
        }
      };
      walk(nodes);
      return out;
    };
    const files = allFiles(preview.solutionTree);
    // Remap: src/Infrastructure/Persistence/ApplicationDbContext.cs → src/App.Infrastructure/Persistence/...
    expect(files).toContain('src/App.Infrastructure/Persistence/ApplicationDbContext.cs');
    expect(files).toContain('src/App.Infrastructure/Diagnostics/HealthCheckExtensions.cs');
    expect(files).toContain('src/App.Infrastructure/Auth/JwtTokenGenerator.cs');
    // Program.cs deve ter wiring dos pacotes ativos
    const apiProgram = preview.solutionTree
      .find((n) => n.name === 'src')
      ?.children?.find((n) => n.name === 'App.Api')
      ?.children?.find((n) => n.name === 'Program.cs')?.contentSnippet || '';
    expect(apiProgram).toContain('AddDbContext<ApplicationDbContext>');
    expect(apiProgram).toContain('AddJwtBearer');
  });

  it('injects RPA Worker+Quartz files and Program wiring when those features are active', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'i', name: 'App.Infrastructure', type: 'Infrastructure', references: ['c'], description: '' },
        { id: 'a', name: 'App.Api', type: 'API', references: ['i'], description: '' },
      ],
      featureIds: ['feat-worker-service', 'feat-quartz-scheduler'],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    const allFiles = (nodes: typeof preview.solutionTree): string[] => {
      const out: string[] = [];
      const walk = (ns: typeof preview.solutionTree): void => {
        for (const n of ns) {
          if (n.type === 'file') out.push(n.path);
          if (n.children) walk(n.children);
        }
      };
      walk(nodes);
      return out;
    };
    const files = allFiles(preview.solutionTree);
    expect(files).toContain('src/App.Infrastructure/Workers/RpaWorker.cs');
    expect(files).toContain('src/App.Infrastructure/Scheduling/RpaJob.cs');
    const apiProgram = preview.solutionTree
      .find((n) => n.name === 'src')
      ?.children?.find((n) => n.name === 'App.Api')
      ?.children?.find((n) => n.name === 'Program.cs')?.contentSnippet || '';
    expect(apiProgram).toContain('AddHostedService<RpaWorker>');
    expect(apiProgram).toContain('AddQuartz');
  });

  it('injects the 20-item web checklist only into API/UI projects (Phase 14)', () => {
    const blueprint: Blueprint = {
      ...baseBlueprint,
      projects: [
        { id: 'c', name: 'App.Core', type: 'Core', references: [], description: '' },
        { id: 'a', name: 'App.Api', type: 'API', references: ['c'], description: '' },
        { id: 't', name: 'App.Tests', type: 'Tests', references: ['c'], description: '' },
      ],
      featureIds: [],
    };

    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test');
    const allFiles = (nodes: typeof preview.solutionTree): string[] => {
      const out: string[] = [];
      const walk = (ns: typeof preview.solutionTree): void => {
        for (const n of ns) {
          if (n.type === 'file') out.push(n.path);
          if (n.children) walk(n.children);
        }
      };
      walk(nodes);
      return out;
    };
    const files = allFiles(preview.solutionTree);
    // API deve ter os 20 checklist files sob wwwroot
    expect(files.filter((p) => p.includes('App.Api/wwwroot/'))).toHaveLength(20);
    expect(files).toContain('src/App.Api/wwwroot/404.html');
    expect(files).toContain('src/App.Api/wwwroot/robots.txt');
    expect(files).toContain('src/App.Api/wwwroot/sitemap.xml');
    expect(files).toContain('src/App.Api/wwwroot/privacy.html');
    // Core e Tests não devem ter checklist
    expect(files.filter((p) => p.includes('App.Core/wwwroot/'))).toHaveLength(0);
    expect(files.filter((p) => p.includes('App.Tests/wwwroot/'))).toHaveLength(0);
  });

  it('uses custom env vars over the language defaults when provided', () => {
    const blueprint: Blueprint = { ...baseBlueprint, projects: [] };
    const preview = ProjectService.generateSolutionPreview(blueprint, 'Acme.Test', true, [
      { key: 'CUSTOM_FLAG', value: 'on', description: 'A custom test flag' },
    ]);
    const envFile = preview.solutionTree.find((n) => n.name === '.env');
    expect(envFile?.contentSnippet).toContain('CUSTOM_FLAG');
    expect(envFile?.contentSnippet).not.toContain('DATABASE_URL');
  });
});
