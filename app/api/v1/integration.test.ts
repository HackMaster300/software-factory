// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';

// Phase 21: API integration com BD real (SQLite isolado por teste).
// Cada teste usa SQLITE_PATH temporário para não sujar o DB de dev.

function isolatedDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'sf-api-int-'));
  return join(dir, 'test.db');
}

function setIsolatedDb(): string {
  const p = isolatedDbPath();
  process.env.SQLITE_PATH = p;
  // Limpa o singleton de lib/sql.ts entre testes (re-require)
  vi.resetModules();
  return p;
}

describe('API v1 integration (SQLite isolado, sem rede)', () => {
  beforeEach(() => {
    setIsolatedDb();
    vi.resetModules();
  });

  it('health retorna ok com counts zerados', async () => {
    const { GET } = await import('../../../app/api/v1/health/route');
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.db.counts.organizations).toBe(0);
  });

  it('organizations: POST cria e GET lista (FK ok)', async () => {
    const orgRoute = await import('../../../app/api/v1/organizations/route');
    const wsRoute = await import('../../../app/api/v1/workspaces/route');

    const req = new NextRequest('http://localhost/api/v1/organizations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', code: 'ACME', plan: 'Team' }),
    });
    const postRes = await orgRoute.POST(req);
    expect(postRes.status).toBe(201);
    const { data: org } = await postRes.json();
    expect(org.name).toBe('Acme');

    const getRes = await orgRoute.GET();
    const { data: list } = await getRes.json();
    expect(list).toHaveLength(1);

    // Workspace com FK válida
    const wsReq = new NextRequest('http://localhost/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'WS1', organizationId: org.id }),
    });
    const wsRes = await wsRoute.POST(wsReq);
    expect(wsRes.status).toBe(201);

    // FK inválida deve dar 400 honesto
    const badReq = new NextRequest('http://localhost/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad', organizationId: 'nope' }),
    });
    const badRes = await wsRoute.POST(badReq);
    expect(badRes.status).toBe(400);
    const badJson = await badRes.json();
    expect(badJson.error).toMatch(/organizationId/);
  });

  it('ai-providers: POST upsert com hasKey sem vazar api_key', async () => {
    const route = await import('../../../app/api/v1/ai-providers/route');
    const postReq = new NextRequest('http://localhost/api/v1/ai-providers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Gem', provider: 'Google Gemini', model: 'gemini-2.5-flash', apiKey: 'SECRET' }),
    });
    const postRes = await route.POST(postReq);
    expect([200, 201]).toContain(postRes.status);
    const { data: created } = await postRes.json();
    expect(created.hasKey).toBe(true);
    expect('api_key' in created).toBe(false);
    expect('apiKey' in created).toBe(false);

    const getRes = await route.GET();
    const { data: list } = await getRes.json();
    expect(list[0].hasKey).toBe(true);
    expect(JSON.stringify(list)).not.toContain('SECRET');
  });

  it('seed-catalog + import/export round-trip', async () => {
    const seedRoute = await import('../../../app/api/v1/admin/seed-catalog/route');
    const importRoute = await import('../../../app/api/v1/admin/import/route');
    const exportRoute = await import('../../../app/api/v1/admin/export/route');

    const seedReq = new NextRequest('http://localhost/api/v1/admin/seed-catalog', { method: 'POST' });
    const seedRes = await seedRoute.POST(seedReq);
    expect(seedRes.status).toBe(200);
    const { data: seedData } = await seedRes.json();
    expect(seedData.catalogWritten).toBeGreaterThan(0);

    // Import de um org extra via backup
    const importReq = new NextRequest('http://localhost/api/v1/admin/import', {
      method: 'POST',
      body: JSON.stringify({
        organizations: [{ id: 'o1', name: 'Acme', code: 'ACME', plan: 'Team' }],
        workspaces: [{ id: 'w1', organizationId: 'o1', name: 'WS' }],
        aiProviders: [{ id: 'a1', name: 'Gem', provider: 'Google Gemini', model: 'm', apiKey: 'SECRET-MUST-DROP' }],
      }),
    });
    const importRes = await importRoute.POST(importReq);
    expect(importRes.status).toBe(201);
    const { data: imp } = await importRes.json();
    expect(imp.inserted).toBeGreaterThan(0);

    // Re-import idempotente
    const reReq = new NextRequest('http://localhost/api/v1/admin/import', {
      method: 'POST',
      body: JSON.stringify({ organizations: [{ id: 'o1', name: 'Acme', code: 'ACME', plan: 'Team' }] }),
    });
    const reRes = await importRoute.POST(reReq);
    const { data: re } = await reRes.json();
    expect(re.inserted).toBe(0);

    const exportRes = await exportRoute.GET();
    const { data } = await exportRes.json();
    expect(data.organizations).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain('SECRET-MUST-DROP');
  });
});
