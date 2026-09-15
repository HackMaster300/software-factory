// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ProjectService, type SolutionTreeNode } from './projectService';
import { BlueprintService } from './blueprintService';
import type { Blueprint } from '../types/factory';

function hasPython(): boolean {
  try {
    execFileSync('python', ['--version'], { stdio: 'ignore' });
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

function collectPyFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith('.py')) out.push(full);
    }
  };
  walk(root);
  return out;
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

describe.skipIf(!hasPython())('python scaffold compiles with py_compile (Phase 16)', () => {
  it('Python FastAPI (stack-python-fastapi) compiles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sf-py-'));
    const bp = makeBlueprint('stack-python-fastapi', 'CleanArchitecture');
    const preview = ProjectService.generateSolutionPreview(bp, 'Acme.Py', true);
    writeTree(preview.solutionTree, join(dir, 'Acme.Py'));
    const pyFiles = collectPyFiles(join(dir, 'Acme.Py'));
    expect(pyFiles.length).toBeGreaterThan(0);
    for (const file of pyFiles) {
      execFileSync('python', ['-m', 'py_compile', file], { stdio: 'pipe', timeout: 60000 });
    }
    expect(true).toBe(true);
  }, 120000);
});
