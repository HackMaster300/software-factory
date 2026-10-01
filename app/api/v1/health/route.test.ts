// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('GET /api/v1/health', () => {
  it('does not leak the DB file path', async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), 'sf-health-')), 'secret-location.db');
    process.env.SQLITE_PATH = dbPath;
    vi.resetModules();
    const { GET } = await import('./route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.db.path).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain('secret-location');
  });
});
