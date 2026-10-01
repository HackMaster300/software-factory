// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';

describe('POST /api/v1/admin/import — transactional', () => {
  beforeEach(() => {
    process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), 'sf-import-tx-')), 'test.db');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  const backup = {
    organizations: [{ id: 'o1', name: 'Acme', code: 'ACME', plan: 'Team' }],
    workspaces: [{ id: 'w1', organizationId: 'o1', name: 'WS' }],
    techStacks: [{ id: 'ts1' }],
  };

  it('rolls back every insert when a later statement fails', async () => {
    const sql = await import('../../../../../lib/sql');
    const { POST } = await import('./route');
    const db = sql.getDb();
    const realPrepare = db.prepare.bind(db);
    vi.spyOn(db, 'prepare').mockImplementation(((query: string) => {
      if (query.includes('INSERT INTO catalog')) throw new Error('disk full (simulated)');
      return realPrepare(query);
    }) as typeof db.prepare);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(new NextRequest('http://localhost/api/v1/admin/import', { method: 'POST', body: JSON.stringify(backup) }));
    expect(res.status).toBe(500);

    vi.mocked(db.prepare).mockRestore();
    const orgs = db.prepare('SELECT COUNT(*) AS n FROM organizations').get() as { n: number };
    const wss = db.prepare('SELECT COUNT(*) AS n FROM workspaces').get() as { n: number };
    expect(Number(orgs.n)).toBe(0);
    expect(Number(wss.n)).toBe(0);
  });

  it('commits everything on success', async () => {
    const sql = await import('../../../../../lib/sql');
    const { POST } = await import('./route');
    const res = await POST(new NextRequest('http://localhost/api/v1/admin/import', { method: 'POST', body: JSON.stringify(backup) }));
    expect(res.status).toBe(201);
    const db = sql.getDb();
    expect(Number((db.prepare('SELECT COUNT(*) AS n FROM organizations').get() as { n: number }).n)).toBe(1);
    expect(Number((db.prepare('SELECT COUNT(*) AS n FROM catalog').get() as { n: number }).n)).toBe(1);
  });
});
