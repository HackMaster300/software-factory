// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { isAuthorized } from './lib/auth';

const ORIGINAL = process.env.API_TOKEN;

function req(path: string, method = 'GET', headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { method, headers });
}

const PROTECTED: Array<[string, string]> = [
  ['POST', '/api/v1/admin/import'],
  ['GET', '/api/v1/admin/export'],
  ['POST', '/api/v1/admin/seed-catalog'],
  ['GET', '/api/v1/ai-providers'],
  ['POST', '/api/v1/ai-providers'],
  ['GET', '/api/v1/organizations'],
  ['POST', '/api/v1/organizations'],
  ['PATCH', '/api/v1/organizations/o1'],
  ['DELETE', '/api/v1/workspaces/w1'],
  ['POST', '/api/v1/workspaces'],
  ['POST', '/api/ai/generate'],
];

describe('API auth middleware', () => {
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.API_TOKEN;
    else process.env.API_TOKEN = ORIGINAL;
  });

  it('passes everything through when API_TOKEN is unset (solo mode)', () => {
    delete process.env.API_TOKEN;
    for (const [method, path] of PROTECTED) {
      const res = middleware(req(path, method));
      expect(res.status, `${method} ${path}`).not.toBe(401);
    }
  });

  it.each(PROTECTED)('returns 401 for %s %s without a token when API_TOKEN is set', async (method, path) => {
    process.env.API_TOKEN = 'secret-token';
    const res = middleware(req(path, method));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/);
  });

  it('returns 401 for a wrong token', () => {
    process.env.API_TOKEN = 'secret-token';
    expect(middleware(req('/api/v1/admin/import', 'POST', { authorization: 'Bearer nope' })).status).toBe(401);
    expect(middleware(req('/api/v1/admin/import', 'POST', { authorization: 'Bearer secret-token-x' })).status).toBe(401);
    expect(middleware(req('/api/v1/admin/import', 'POST', { authorization: 'secret-token' })).status).toBe(401);
  });

  it('lets a valid Bearer or x-api-token through', () => {
    process.env.API_TOKEN = 'secret-token';
    expect(middleware(req('/api/v1/admin/import', 'POST', { authorization: 'Bearer secret-token' })).status).not.toBe(401);
    expect(middleware(req('/api/ai/generate', 'POST', { 'x-api-token': 'secret-token' })).status).not.toBe(401);
  });

  it('keeps GET /api/v1/health public, but not other methods on it', () => {
    process.env.API_TOKEN = 'secret-token';
    expect(middleware(req('/api/v1/health')).status).not.toBe(401);
    expect(middleware(req('/api/v1/health/')).status).not.toBe(401);
    expect(middleware(req('/api/v1/health', 'POST')).status).toBe(401);
  });

  it('isAuthorized is exported and honours the env token', () => {
    process.env.API_TOKEN = 't';
    expect(isAuthorized(new Request('http://x', { headers: { Authorization: 'Bearer t' } }))).toBe(true);
    expect(isAuthorized(new Request('http://x'))).toBe(false);
  });
});
