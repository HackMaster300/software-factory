import { describe, it, expect } from 'vitest';
import { BlueprintService } from './blueprintService';

describe('BlueprintService.getProjectsForTechStackAndArchStyle', () => {
  it('returns a distinct module layout for CleanArchitecture (default) per tech stack', () => {
    const dotnet = BlueprintService.getProjectsForTechStackAndArchStyle('stack-dotnet9');
    const node = BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs');
    expect(dotnet.map((p) => p.name)).not.toEqual(node.map((p) => p.name));
    expect(dotnet.length).toBeGreaterThan(0);
    expect(node.length).toBeGreaterThan(0);
  });

  it('switches to a Hexagonal-specific module layout for stacks that support it', () => {
    const clean = BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs', 'CleanArchitecture');
    const hex = BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs', 'Hexagonal');
    expect(hex.map((p) => p.name)).not.toEqual(clean.map((p) => p.name));
    expect(hex.some((p) => p.name.includes('ports'))).toBe(true);
  });

  it('produces a Microservices-specific layout distinct from CQRS for a stack supporting both', () => {
    const micro = BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs', 'Microservices');
    const cqrs = BlueprintService.getProjectsForTechStackAndArchStyle('stack-node-nestjs', 'CQRS');
    expect(micro.map((p) => p.name)).not.toEqual(cqrs.map((p) => p.name));
    expect(cqrs.some((p) => p.name.includes('commands'))).toBe(true);
    expect(cqrs.some((p) => p.name.includes('queries'))).toBe(true);
  });

  it('falls back to the same Hexagonal-aware layout for Java Spring but has no Microservices/CQRS branch (returns its plain default)', () => {
    const hex = BlueprintService.getProjectsForTechStackAndArchStyle('stack-java-spring', 'Hexagonal');
    const micro = BlueprintService.getProjectsForTechStackAndArchStyle('stack-java-spring', 'Microservices');
    expect(hex.some((p) => p.name.includes('ports'))).toBe(true);
    // No dedicated Microservices branch for this stack — should equal the plain default layout.
    const plain = BlueprintService.getProjectsForTechStackAndArchStyle('stack-java-spring');
    expect(micro.map((p) => p.name)).toEqual(plain.map((p) => p.name));
  });

  it('ignores architecture style entirely for stacks with a single fixed layout (e.g. Rust Axum, Next.js, Kotlin Ktor, Flutter)', () => {
    for (const stackId of ['stack-rust-axum', 'stack-nextjs', 'stack-kotlin-ktor', 'stack-flutter']) {
      const clean = BlueprintService.getProjectsForTechStackAndArchStyle(stackId, 'CleanArchitecture');
      const cqrs = BlueprintService.getProjectsForTechStackAndArchStyle(stackId, 'CQRS');
      expect(clean.map((p) => p.name)).toEqual(cqrs.map((p) => p.name));
    }
  });

  it('falls back to the .NET default layout for an unrecognized tech stack id', () => {
    const unknown = BlueprintService.getProjectsForTechStackAndArchStyle('stack-does-not-exist');
    const dotnet = BlueprintService.getProjectsForTechStackAndArchStyle('stack-dotnet9');
    expect(unknown.map((p) => p.name)).toEqual(dotnet.map((p) => p.name));
  });

  it('supports every documented architecture style for the .NET default fallback (Hexagonal/Microservices/CQRS/ModularMonolith/plain)', () => {
    const styles = ['Hexagonal', 'Microservices', 'CQRS', 'ModularMonolith', 'CleanArchitecture'] as const;
    const layouts = styles.map((s) => BlueprintService.getProjectsForTechStackAndArchStyle('stack-dotnet9', s).map((p) => p.name).join(','));
    // Every style should produce a genuinely different layout string.
    expect(new Set(layouts).size).toBe(styles.length);
  });
});

describe('BlueprintService.suggestPackagesFromDescription', () => {
  it('recommends PostgreSQL EF Core package when the description mentions postgres (C#)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('Uses PostgreSQL for storage', 'csharp');
    expect(suggestions.some((s) => s.packageName.includes('Npgsql'))).toBe(true);
  });

  it('recommends Dapper over EF Core when the description mentions dapper (C#)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('Lightweight Dapper queries', 'csharp');
    expect(suggestions.some((s) => s.packageName === 'Dapper')).toBe(true);
    expect(suggestions.some((s) => s.packageName.includes('SqlServer'))).toBe(false);
  });

  it('falls back to SQL Server EF Core when no database keyword is present (C#)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('A generic backend service', 'csharp');
    expect(suggestions.some((s) => s.packageName.includes('SqlServer'))).toBe(true);
  });

  it('adds JWT, Redis, and MediatR suggestions together when the description mentions all three (C#)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription(
      'JWT authentication with Redis caching and a MediatR CQRS pipeline',
      'csharp'
    );
    expect(suggestions.some((s) => s.packageName.includes('JwtBearer'))).toBe(true);
    expect(suggestions.some((s) => s.packageName.includes('Redis'))).toBe(true);
    expect(suggestions.some((s) => s.packageName === 'MediatR')).toBe(true);
  });

  it('targets the correct module id for a package category using the provided projects list', () => {
    const projects = [
      { id: 'p-infra', name: 'App.Infrastructure', type: 'Infrastructure' as const, references: [], description: '' },
      { id: 'p-api', name: 'App.Api', type: 'API' as const, references: [], description: '' },
    ];
    const suggestions = BlueprintService.suggestPackagesFromDescription('JWT auth with postgres', 'csharp', projects);
    const jwtSuggestion = suggestions.find((s) => s.packageName.includes('JwtBearer'));
    const dbSuggestion = suggestions.find((s) => s.packageName.includes('Npgsql'));
    expect(jwtSuggestion?.targetModuleId).toBe('p-api');
    expect(dbSuggestion?.targetModuleId).toBe('p-infra');
  });

  it('recommends the TypeScript-specific package set (Prisma, jsonwebtoken, ioredis) for the typescript language', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('Prisma postgres JWT redis cache', 'typescript');
    expect(suggestions.some((s) => s.packageName === '@prisma/client')).toBe(true);
    expect(suggestions.some((s) => s.packageName === 'jsonwebtoken')).toBe(true);
    expect(suggestions.some((s) => s.packageName === 'ioredis')).toBe(true);
  });

  it('routes queue/messaging suggestions to a Worker module when one exists (typescript)', () => {
    const projects = [
      { id: 'p-worker', name: 'App.Worker', type: 'Worker' as const, references: [], description: '' },
      { id: 'p-infra', name: 'App.Infrastructure', type: 'Infrastructure' as const, references: [], description: '' },
    ];
    const suggestions = BlueprintService.suggestPackagesFromDescription('Uses a BullMQ queue for background jobs', 'typescript', projects);
    const bullSuggestion = suggestions.find((s) => s.packageName === 'bullmq');
    expect(bullSuggestion?.targetModuleId).toBe('p-worker');
  });

  it('recommends the Python-specific package set (sqlalchemy, python-jose, redis)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('SQLAlchemy models, JWT auth, redis cache', 'python');
    expect(suggestions.some((s) => s.packageName === 'sqlalchemy')).toBe(true);
    expect(suggestions.some((s) => s.packageName.startsWith('python-jose'))).toBe(true);
    expect(suggestions.some((s) => s.packageName === 'redis')).toBe(true);
  });

  it('recommends the Java-specific package set (Spring Data JPA, Spring Security)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('JPA postgres with Spring Security JWT', 'java');
    expect(suggestions.some((s) => s.packageName.includes('data-jpa'))).toBe(true);
    expect(suggestions.some((s) => s.packageName.includes('security'))).toBe(true);
  });

  it('recommends the Go-specific package set (GORM, golang-jwt)', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('GORM postgres with JWT auth', 'go');
    expect(suggestions.some((s) => s.packageName === 'gorm.io/gorm')).toBe(true);
    expect(suggestions.some((s) => s.packageName.includes('golang-jwt'))).toBe(true);
  });

  it('returns no suggestions for a language with no dedicated branch and an empty description', () => {
    const suggestions = BlueprintService.suggestPackagesFromDescription('', 'rust');
    expect(suggestions).toEqual([]);
  });
});
