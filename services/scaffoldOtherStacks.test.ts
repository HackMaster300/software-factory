import { describe, it, expect } from 'vitest';
import { ProjectService, type SolutionTreeNode } from './projectService';
import { BlueprintService } from './blueprintService';
import type { Blueprint } from '../types/factory';

/**
 * Phase 19 — Java/Go/Rust/Kotlin/Dart sem toolchain nativo neste runner
 * (só JRE 8, sem javac/mvn/go/cargo). Estes testes garantem o nível honesto
 * alcançável: manifests corretos por linguagem + bootstraps válidos sem deps
 * externas + zero fallback TypeScript em arquivos .java/.go/.rs/.kt/.dart.
 * Quando JDK/Go/Rust forem instalados, viram E2E nativos como os de C#/TS/Python.
 */

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

function collectFiles(tree: SolutionTreeNode[]): SolutionTreeNode[] {
  const out: SolutionTreeNode[] = [];
  const walk = (nodes: SolutionTreeNode[]): void => {
    for (const n of nodes) {
      if (n.type === 'file') out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(tree);
  return out;
}

describe('other stacks presence + validity (Phase 19, sem toolchain nativo)', () => {
  it('Java: pom.xml por módulo + Application.java bootstrap, sem Spring obrigatório', () => {
    const preview = ProjectService.generateSolutionPreview(makeBlueprint('stack-java-spring', 'Hexagonal'), 'Acme.Java');
    const files = collectFiles(preview.solutionTree);
    const poms = files.filter((f) => f.name === 'pom.xml');
    expect(poms.length).toBeGreaterThan(0);
    expect(poms[0].contentSnippet).toContain('maven.compiler.source>21');
    const app = files.find((f) => f.name === 'Application.java');
    expect(app?.contentSnippet).toContain('public static void main');
    // Nenhum fallback TypeScript em .java
    for (const f of files.filter((f) => f.name.endsWith('.java'))) {
      expect(f.contentSnippet).not.toContain('export class');
      expect(f.contentSnippet).not.toContain('from \'@nestjs');
    }
  });

  it('Go: main.go stdlib + handler sem fiber, sem package.json por módulo', () => {
    const preview = ProjectService.generateSolutionPreview(makeBlueprint('stack-gofiber', 'Microservices'), 'Acme.Go');
    const files = collectFiles(preview.solutionTree);
    const main = files.find((f) => f.name === 'main.go');
    expect(main?.contentSnippet).toContain('package main');
    expect(main?.contentSnippet).toContain('net/http');
    expect(main?.contentSnippet).not.toContain('fiber');
    const handler = files.find((f) => f.path.includes('handler') || f.name.endsWith('.go') && f.name !== 'main.go' && f.name !== 'go.mod');
    if (handler) expect(handler.contentSnippet).not.toContain('fiber');
    // go.mod fica na raiz (build file), não package.json por módulo
    expect(files.filter((f) => f.name === 'package.json')).toHaveLength(0);
    expect(files.some((f) => f.name === 'go.mod')).toBe(true);
  });

  it('Rust: typo `pub font` eliminado + Cargo.toml por crate', () => {
    const preview = ProjectService.generateSolutionPreview(makeBlueprint('stack-rust-axum'), 'Acme.Rust');
    const files = collectFiles(preview.solutionTree);
    for (const f of files.filter((f) => f.name.endsWith('.rs'))) {
      expect(f.contentSnippet).not.toContain('pub font');
      expect(f.contentSnippet).not.toContain('export class');
    }
    const cargos = files.filter((f) => f.name === 'Cargo.toml');
    // raiz + por crate
    expect(cargos.length).toBeGreaterThan(1);
    expect(files.filter((f) => f.name === 'package.json')).toHaveLength(0);
  });

  it('Kotlin: build.gradle.kts + Application.kt por projeto', () => {
    const preview = ProjectService.generateSolutionPreview(makeBlueprint('stack-kotlin-ktor'), 'Acme.Kt');
    const files = collectFiles(preview.solutionTree);
    expect(files.filter((f) => f.name === 'build.gradle.kts').length).toBeGreaterThan(0);
    const app = files.find((f) => f.name === 'Application.kt');
    expect(app?.contentSnippet).toContain('fun main()');
    expect(files.filter((f) => f.name === 'package.json')).toHaveLength(0);
  });

  it('Dart: main.dart por projeto, pubspec na raiz', () => {
    const bp = makeBlueprint('stack-flutter');
    const preview = ProjectService.generateSolutionPreview(bp, 'Acme.Flutter');
    const files = collectFiles(preview.solutionTree);
    const mains = files.filter((f) => f.name === 'main.dart');
    // Projetos Dart usam path relativo (lib/presentation/main.dart, sem prefixo src/)
    expect(mains.map((f) => f.path)).toContain('lib/presentation/main.dart');
    expect(mains.length).toBeGreaterThan(0);
    expect(mains[0].contentSnippet).toContain('void main()');
    expect(files.some((f) => f.name === 'pubspec.yaml')).toBe(true);
    expect(files.filter((f) => f.name === 'package.json')).toHaveLength(0);
  });
});
