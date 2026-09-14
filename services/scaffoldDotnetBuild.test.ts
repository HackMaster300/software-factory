// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ProjectService, type SolutionTreeNode } from './projectService';
import { initialBlueprints } from './mockSeedData';

function hasDotnetSdk(): boolean {
  try {
    execFileSync('dotnet', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Replica no disco a mesma estrutura que downloadSolutionZip colocaria no .zip. */
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

// Phase 9 acceptance: o template golden C# sai do gerador e compila de verdade.
// Pulado honestamente (não fake-pass) onde o SDK não existe.
describe.skipIf(!hasDotnetSdk())('golden path E2E: generate → dotnet build', () => {
  it('builds the generated .NET 9 solution with zero errors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sf-golden-'));
    const preview = ProjectService.generateSolutionPreview(initialBlueprints[0], 'Acme.Golden', true);
    writeTree(preview.solutionTree, join(dir, 'Acme.Golden'));
    const sln = join(dir, 'Acme.Golden', 'Acme.Golden.sln');
    // Phase 9: exit 0 sozinho não prova nada (.sln sem ProjectConfigurationPlatforms
    // "passava" sem compilar nada). Exige Build succeeded + DLLs reais no disco.
    const output = execFileSync('dotnet', ['build', sln, '-c', 'Release', '--nologo'], {
      cwd: dir,
      timeout: 240000,
      encoding: 'utf-8',
    }) as unknown as string;
    expect(output).toContain('Build succeeded.');
    for (const proj of ['App.Core', 'App.Application', 'App.Infrastructure', 'App.Api']) {
      expect(
        existsSync(join(dir, 'Acme.Golden', 'src', proj, 'bin', 'Release', 'net9.0', `${proj}.dll`)),
        `${proj}.dll should exist after build`
      ).toBe(true);
    }
  }, 280000);
});
