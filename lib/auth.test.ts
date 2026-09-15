import { describe, it, expect, beforeEach } from 'vitest';
import { isAuthorized } from './auth';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('lib/auth', () => {
  const orig = process.env.API_TOKEN;

  beforeEach(() => {
    delete process.env.API_TOKEN;
  });

  it('libera tudo quando API_TOKEN não está configurado (uso solo honesto)', () => {
    delete process.env.API_TOKEN;
    expect(isAuthorized(new Request('http://localhost/api/v1/health'))).toBe(true);
  });

  it('exige Bearer <token> quando API_TOKEN está configurado', () => {
    process.env.API_TOKEN = 'secret123';
    expect(isAuthorized(new Request('http://localhost/api', { headers: { Authorization: 'Bearer secret123' } }))).toBe(true);
    expect(isAuthorized(new Request('http://localhost/api'))).toBe(false);
    expect(isAuthorized(new Request('http://localhost/api', { headers: { Authorization: 'Bearer wrong' } }))).toBe(false);
    process.env.API_TOKEN = orig;
  });
});

describe('db/schema-mssql.sql', () => {
  it('contém as 6 tabelas com tipos T-SQL (NVARCHAR, BIT, DATETIME2) e FKs', () => {
    const sql = readFileSync(join(process.cwd(), 'db', 'schema-mssql.sql'), 'utf-8');
    for (const tbl of ['organizations', 'workspaces', 'projects', 'ai_providers', 'catalog', 'decision_logs']) {
      expect(sql).toContain(`CREATE TABLE ${tbl}`);
    }
    expect(sql).toContain('NVARCHAR');
    expect(sql).toContain('BIT');
    expect(sql).toContain('DATETIME2');
    expect(sql).toContain('FOREIGN KEY');
  });
});

describe('services/repositories/api seam', () => {
  it('existe e expõe métodos async via fetch (sem quebrar I*Repository síncrono)', async () => {
    const orgMod = await import('../services/repositories/api/organization.repository');
    const wsMod = await import('../services/repositories/api/workspace.repository');
    expect(typeof orgMod.ApiOrganizationRepository).toBe('function');
    expect(typeof wsMod.ApiWorkspaceRepository).toBe('function');
    expect(typeof orgMod.apiOrganizationRepository.getOrganizations).toBe('function');
    expect(typeof wsMod.apiWorkspaceRepository.getWorkspaces).toBe('function');
  });
});
