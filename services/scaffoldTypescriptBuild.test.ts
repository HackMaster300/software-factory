// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ProjectService, type SolutionTreeNode } from './projectService';
import { BlueprintService } from './blueprintService';
import type { Blueprint } from '../types/factory';

function hasTsc(): boolean {
  try {
    // Windows: npx is npx.cmd; use node to run tsc directly for reliability
    execFileSync('node', [join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc'), '--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function writeTree(nodes: SolutionTreeNode[], root: string): void {
  for (const n of nodes) {
    const target = join(root, ...n.path.split('/'));
    if (n.type === 'file') {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, n.contentSnippet || '');
    } else if (n.children) {
      mkdirSync(target, { recursive: true });
      writeTree(n.children, root);
    }
  }
}

function makeBlueprint(stackId: string, style: Blueprint['architectureStyle'] = 'CleanArchitecture'): Blueprint {
  return {
    id: `bp-${stackId}`,
    name: `Test ${stackId}`,
    description: '',
    architectureStyle: style,
    techStackId: stackId,
    projects: BlueprintService.getProjectsForTechStackAndArchStyle(stackId, style),
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
}

describe.skipIf(!hasTsc())('typescript scaffold compiles with tsc --noEmit (Phase 15)', () => {
  it('NestJS (stack-node-nestjs) compiles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sf-ts-nest-'));
    const bp = makeBlueprint('stack-node-nestjs', 'CleanArchitecture');
    const preview = ProjectService.generateSolutionPreview(bp, 'Acme.Nest', true);
    writeTree(preview.solutionTree, join(dir, 'Acme.Nest'));

    // Each TS project has its own tsconfig; verify each compiles
    for (const proj of bp.projects) {
      const projPath = join(dir, 'Acme.Nest', 'src', proj.name);
      // proj.name already contains src/ prefix for NestJS (e.g. src/domain), so actual is src/src/domain
      // Check both possibilities: src/<name> and <name> at root
      const tsconfig = join(projPath, 'tsconfig.json');
      const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
      try {
        execFileSync('node', [tscBin, '--noEmit', '--project', tsconfig], { cwd: dir, stdio: 'pipe', timeout: 60000 });
      } catch (e) {
        const err = e as unknown as { stdout?: Buffer; stderr?: Buffer; message?: string };
        const out = err.stdout ? err.stdout.toString() : '';
        const errOut = err.stderr ? err.stderr.toString() : '';
        console.error('tsc failed for', proj.name, out, errOut, err.message);
        throw e;
      }
    }
    expect(true).toBe(true);
  }, 120000);

  it('Next.js (stack-nextjs) compiles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sf-ts-next-'));
    const bp = makeBlueprint('stack-nextjs', 'ModularMonolith');
    const preview = ProjectService.generateSolutionPreview(bp, 'Acme.Next', true);
    writeTree(preview.solutionTree, join(dir, 'Acme.Next'));
    for (const proj of bp.projects) {
      const projPath = join(dir, 'Acme.Next', 'src', proj.name);
      const tsconfig = join(projPath, 'tsconfig.json');
      const tscBin = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
      try {
        execFileSync('node', [tscBin, '--noEmit', '--project', tsconfig], { cwd: dir, stdio: 'pipe', timeout: 60000 });
      } catch (e) {
        const err = e as unknown as { stdout?: Buffer; stderr?: Buffer; message?: string };
        console.error('tsc failed for', proj.name, err.stdout?.toString(), err.stderr?.toString(), err.message);
        throw e;
      }
    }
    expect(true).toBe(true);
  }, 120000);
});
