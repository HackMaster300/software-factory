/**
 * Phase 8 (backup) — validação pura do formato de export do client
 * (`StorageService.exportFullWorkspaceState()`) para import no servidor.
 * Puro (sem imports Node) para Vitest jsdom. Regra de segurança: apiKey de
 * providers NUNCA é importada — mesmo que o JSON traga, é descartada.
 */

export interface NormalizedExport {
  organizations: Array<{ id: string; name: string; code: string; plan: string }>;
  workspaces: Array<{ id: string; organizationId: string; name: string; description: string }>;
  projects: Array<Record<string, unknown> & { id: string }>;
  decisionLogs: Array<Record<string, unknown> & { id: string }>;
  providers: Array<Record<string, unknown> & { id: string }>;
  catalog: Array<{ key: string; value: unknown }>;
}

export type ImportValidation = { ok: true; value: NormalizedExport } | { ok: false; error: string };

const CATALOG_KEYS = [
  'techStacks', 'featureManifests', 'ruleSets', 'templates',
  'cacheProfiles', 'loggingProfiles', 'encryptionProfiles', 'deploymentProfiles',
  'authenticationProfiles', 'promptTemplates', 'aiAgents', 'plugins',
] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asArray(v: unknown): Record<string, unknown>[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v)) return null;
  if (!v.every(isRecord)) return null;
  return v;
}

function requireId(row: Record<string, unknown>, section: string, index: number): string | null {
  return typeof row.id === 'string' && row.id.trim() ? row.id.trim() : null;
}

export function validateWorkspaceExport(body: unknown): ImportValidation {
  if (!isRecord(body)) return { ok: false, error: 'Body must be a JSON object.' };

  const get = (key: string): Record<string, unknown>[] | { error: string } => {
    const arr = asArray(body[key]);
    if (arr === null) return { error: `"${key}" must be an array of objects when present.` };
    return arr;
  };

  const sections: Record<string, Record<string, unknown>[] | { error: string }> = {
    organizations: get('organizations'),
    workspaces: get('workspaces'),
    projects: get('projects'),
    decisionLogs: get('decisionLogs'),
    aiProviders: get('aiProviders'),
  };
  for (const [key, val] of Object.entries(sections)) {
    if (!Array.isArray(val)) return { ok: false, error: (val as { error: string }).error };
  }

  const fail = (section: string, i: number): ImportValidation => ({
    ok: false, error: `"${section}[${i}].id" is required (string).`,
  });

  type PickResult = { fail: ImportValidation } | { rows: Array<Record<string, unknown> & { id: string }> };
  const pick = (arr: Record<string, unknown>[], section: string): PickResult => {
    const out: Array<Record<string, unknown> & { id: string }> = [];
    for (let i = 0; i < arr.length; i++) {
      const id = requireId(arr[i], section, i);
      if (!id) return { fail: fail(section, i) };
      out.push({ ...arr[i], id });
    }
    return { rows: out };
  };

  const orgs = pick(sections.organizations as Record<string, unknown>[], 'organizations');
  if ('fail' in orgs) return orgs.fail;
  const wss = pick(sections.workspaces as Record<string, unknown>[], 'workspaces');
  if ('fail' in wss) return wss.fail;
  const projs = pick(sections.projects as Record<string, unknown>[], 'projects');
  if ('fail' in projs) return projs.fail;
  const logs = pick(sections.decisionLogs as Record<string, unknown>[], 'decisionLogs');
  if ('fail' in logs) return logs.fail;
  const provs = pick(sections.aiProviders as Record<string, unknown>[], 'aiProviders');
  if ('fail' in provs) return provs.fail;

  const catalog: Array<{ key: string; value: unknown }> = [];
  for (const key of CATALOG_KEYS) {
    if (body[key] !== undefined) catalog.push({ key, value: body[key] });
  }

  return {
    ok: true,
    value: {
      organizations: (orgs as { rows: Array<Record<string, unknown> & { id: string }> }).rows.map((r) => ({
        id: r.id,
        name: typeof r.name === 'string' ? r.name : '',
        code: typeof r.code === 'string' ? r.code : '',
        plan: typeof r.plan === 'string' ? r.plan : 'Team',
      })),
      workspaces: (wss as { rows: Array<Record<string, unknown> & { id: string }> }).rows.map((r) => ({
        id: r.id,
        organizationId: typeof r.organizationId === 'string' ? r.organizationId : '',
        name: typeof r.name === 'string' ? r.name : '',
        description: typeof r.description === 'string' ? r.description : '',
      })),
      projects: (projs as { rows: Array<Record<string, unknown> & { id: string }> }).rows,
      decisionLogs: (logs as { rows: Array<Record<string, unknown> & { id: string }> }).rows,
      // apiKey descartado aqui por construção (nunca chega ao INSERT).
      providers: (provs as { rows: Array<Record<string, unknown> & { id: string }> }).rows.map((r) => {
        const { apiKey: _dropped, ...rest } = r;
        void _dropped;
        return rest;
      }),
      catalog,
    },
  };
}
