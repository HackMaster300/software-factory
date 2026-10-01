// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { execFileSync, type ExecFileSyncOptions } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { ProjectService, type SolutionTreeNode } from './projectService';
import { BlueprintService } from './blueprintService';
import type { Blueprint } from '../types/factory';

/**
 * Native compile verification for the Java / Go / Rust / Kotlin / Dart
 * scaffolds (golden path, no features). Each suite runs only when its
 * toolchain is on PATH and is skipped otherwise — the suite title states why.
 * CI installs all of them (.github/workflows/ci.yml), so there they really
 * compile. Everything is offline: the generated code has no external deps.
 */

const isWin = process.platform === 'win32';

/** Runs a tool; on Windows, `.bat`/`.cmd` launchers (kotlinc) need cmd.exe. */
function run(cmd: string, args: string[], opts: ExecFileSyncOptions = {}): string {
  const base: ExecFileSyncOptions = { stdio: 'pipe', timeout: 300000, encoding: 'utf-8', ...opts };
  try {
    return execFileSync(cmd, args, base) as unknown as string;
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    if (isWin && e.code === 'ENOENT') {
      return execFileSync('cmd.exe', ['/d', '/s', '/c', cmd, ...args], base) as unknown as string;
    }
    // Surface compiler output in the assertion message.
    throw new Error(`${cmd} ${args.slice(0, 3).join(' ')} failed:\n${e.stdout || ''}\n${e.stderr || ''}\n${e.message}`);
  }
}

type Probe = { ok: true; version: string } | { ok: false; reason: string };

function probe(cmd: string, args: string[], check?: (out: string) => string | null): Probe {
  try {
    const out = run(cmd, args, { timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const problem = check?.(out) ?? null;
    return problem ? { ok: false, reason: problem } : { ok: true, version: out.split('\n')[0] || cmd };
  } catch {
    return { ok: false, reason: `\`${cmd}\` not found on PATH` };
  }
}

// javac prints its version on stdout (JDK >= 9). Generated code uses records -> JDK 21 (pom: release 21).
const javac = probe('javac', ['-version'], (out) => {
  const major = Number(/javac (\d+)/.exec(out)?.[1] ?? 0);
  return major >= 21 ? null : `javac ${major || '?'} found, JDK 21+ required`;
});
const go = probe('go', ['version']);
const cargo = probe('cargo', ['--version']);
const kotlinc = probe('kotlinc', ['-version']);
const dart = probe('dart', ['--version']);

const title = (lang: string, p: Probe): string =>
  p.ok ? `${lang} scaffold compiles natively (${p.version})` : `${lang} scaffold compiles natively — SKIPPED: ${p.reason}`;

function makeBlueprint(stackId: string, style: Blueprint['architectureStyle']): Blueprint {
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

function filesWithExt(root: string, ext: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (full.endsWith(ext)) out.push(full);
    }
  };
  walk(root);
  return out;
}

/** Generates the scaffold into a temp dir, runs `fn`, always cleans up. */
function withScaffold(stackId: string, style: Blueprint['architectureStyle'], name: string, fn: (root: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'sf-native-'));
  try {
    const preview = ProjectService.generateSolutionPreview(makeBlueprint(stackId, style), name, true);
    const root = join(dir, name);
    writeTree(preview.solutionTree, root);
    fn(root);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const TIMEOUT = 420000;

describe.skipIf(!javac.ok)(title('Java', javac), () => {
  it.each(['Hexagonal', 'CleanArchitecture'] as const)('stack-java-spring (%s) compiles with javac --release 21', (style) => {
    withScaffold('stack-java-spring', style, 'Acme.Java', (root) => {
      const sources = filesWithExt(root, '.java');
      expect(sources.length).toBeGreaterThan(0);
      run('javac', ['--release', '21', '-d', join(root, 'out'), ...sources]);
    });
  }, TIMEOUT);
});

describe.skipIf(!go.ok)(title('Go', go), () => {
  it.each(['Microservices', 'CleanArchitecture'] as const)('stack-gofiber (%s) passes go build + go vet', (style) => {
    withScaffold('stack-gofiber', style, 'Acme.Go', (root) => {
      const env = { ...process.env, GOTOOLCHAIN: 'local', GOFLAGS: '-mod=mod' };
      run('go', ['build', './...'], { cwd: root, env });
      run('go', ['vet', './...'], { cwd: root, env });
    });
  }, TIMEOUT);
});

describe.skipIf(!cargo.ok)(title('Rust', cargo), () => {
  it('stack-rust-axum workspace builds with cargo --offline', () => {
    withScaffold('stack-rust-axum', 'CleanArchitecture', 'Acme.Rust', (root) => {
      run('cargo', ['build', '--offline', '--workspace', '--quiet'], { cwd: root });
    });
  }, TIMEOUT);
});

describe.skipIf(!kotlinc.ok)(title('Kotlin', kotlinc), () => {
  it('stack-kotlin-ktor compiles with kotlinc', () => {
    withScaffold('stack-kotlin-ktor', 'CleanArchitecture', 'Acme.Kt', (root) => {
      const sources = filesWithExt(root, '.kt');
      expect(sources.length).toBeGreaterThan(0);
      run('kotlinc', [...sources, '-d', join(root, 'out')]);
    });
  }, TIMEOUT);
});

describe.skipIf(!dart.ok)(title('Dart', dart), () => {
  it('stack-flutter resolves (pub get --offline) and passes dart analyze', () => {
    withScaffold('stack-flutter', 'CleanArchitecture', 'Acme.Flutter', (root) => {
      expect(filesWithExt(root, '.dart').length).toBeGreaterThan(0);
      run('dart', ['pub', 'get', '--offline'], { cwd: root });
      run('dart', ['analyze', '.'], { cwd: root });
    });
  }, TIMEOUT);
});
