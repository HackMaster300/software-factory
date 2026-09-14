/**
 * Phase 8 — client async da API v1 (browser → same-origin `/api/v1/*`).
 * É o seam da troca futura LocalStorage → API: os `Api*Repository` da Phase-8-full
 * implementarão as `I*Repository` sobre estas funções (services viram async então).
 * Erros do servidor propagam como throw — nunca fallback silencioso (Phase 7).
 */

import type { Organization, Workspace } from '../types/factory';
import type { RedactedProvider } from './api-validation';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok || (data as { error?: string }).error) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return (data as { data: T }).data;
}

export function checkHealth(): Promise<{ status: string; db: unknown }> {
  return request('/api/v1/health').then((d) => d as { status: string; db: unknown });
}

export function listOrganizations(): Promise<Organization[]> {
  return request('/api/v1/organizations');
}

export function createOrganization(input: { name: string; code: string; plan?: string }): Promise<Organization> {
  return request('/api/v1/organizations', { method: 'POST', body: JSON.stringify(input) });
}

export function listWorkspaces(organizationId?: string): Promise<Workspace[]> {
  const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  return request(`/api/v1/workspaces${qs}`);
}

export function createWorkspace(input: { name: string; organizationId: string; description?: string }): Promise<Workspace> {
  return request('/api/v1/workspaces', { method: 'POST', body: JSON.stringify(input) });
}

export function listProviders(): Promise<RedactedProvider[]> {
  return request('/api/v1/ai-providers');
}

export function seedCatalog(force = false): Promise<{ catalogWritten: number; providersWritten: number }> {
  return request(`/api/v1/admin/seed-catalog${force ? '?force=1' : ''}`, { method: 'POST' }) as Promise<{
    catalogWritten: number; providersWritten: number;
  }>;
}

/** Fonte de dados ativa. `local` (default, comportamento atual) ou `api` (Phase-8-full). */
export function getDataSource(): 'local' | 'api' {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === 'api' ? 'api' : 'local';
}
