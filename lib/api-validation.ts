/**
 * Phase 8 — validação hand-rolled da API v1 (sem novas deps; sem zod neste ambiente).
 * Pura (sem imports Node) para ser testável no Vitest jsdom.
 */

export const PLANS = ['Enterprise', 'Team', 'Developer'] as const;
export const PROVIDERS = [
  'Google Gemini',
  'OpenAI',
  'Anthropic',
  'DeepSeek',
  'Azure OpenAI',
  'Ollama',
  'OpenRouter',
] as const;

export interface ValidationOk<T> { ok: true; value: T }
export interface ValidationErr { ok: false; error: string }
export type Validation<T> = ValidationOk<T> | ValidationErr;

export interface OrganizationInput { name: string; code: string; plan: string }
export interface WorkspaceInput { name: string; organizationId: string; description: string }
export interface ProviderUpsertInput {
  id?: string;
  name: string;
  provider: string;
  model: string;
  status?: string;
  costPer1k?: string;
  latency?: string;
  apiKey?: string;
  baseUrl?: string;
  isActiveDefault?: boolean;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function validateOrganization(input: unknown): Validation<OrganizationInput> {
  if (!isRecord(input)) return { ok: false, error: 'Body must be a JSON object.' };
  if (!nonEmptyString(input.name)) return { ok: false, error: '"name" is required.' };
  if (!nonEmptyString(input.code)) return { ok: false, error: '"code" is required.' };
  const plan = typeof input.plan === 'string' ? input.plan : 'Team';
  if (!(PLANS as readonly string[]).includes(plan)) {
    return { ok: false, error: `"plan" must be one of: ${PLANS.join(', ')}.` };
  }
  return { ok: true, value: { name: input.name.trim(), code: input.code.trim(), plan } };
}

export function validateWorkspace(input: unknown): Validation<WorkspaceInput> {
  if (!isRecord(input)) return { ok: false, error: 'Body must be a JSON object.' };
  if (!nonEmptyString(input.name)) return { ok: false, error: '"name" is required.' };
  if (!nonEmptyString(input.organizationId)) {
    return { ok: false, error: '"organizationId" is required and must reference an existing organization.' };
  }
  const description = typeof input.description === 'string' ? input.description : '';
  return {
    ok: true,
    value: { name: input.name.trim(), organizationId: input.organizationId, description },
  };
}

export function validateProviderUpsert(input: unknown): Validation<ProviderUpsertInput> {
  if (!isRecord(input)) return { ok: false, error: 'Body must be a JSON object.' };
  if (!nonEmptyString(input.name)) return { ok: false, error: '"name" is required.' };
  if (!nonEmptyString(input.model)) return { ok: false, error: '"model" is required.' };
  if (typeof input.provider !== 'string' || !(PROVIDERS as readonly string[]).includes(input.provider)) {
    return { ok: false, error: `"provider" must be one of: ${PROVIDERS.join(', ')}.` };
  }
  return {
    ok: true,
    value: {
      id: typeof input.id === 'string' && input.id.trim() ? input.id.trim() : undefined,
      name: input.name.trim(),
      provider: input.provider,
      model: input.model.trim(),
      status: typeof input.status === 'string' ? input.status : 'configured',
      costPer1k: typeof input.costPer1k === 'string' && input.costPer1k.trim() ? input.costPer1k.trim() : 'n/a',
      latency: typeof input.latency === 'string' && input.latency.trim() ? input.latency.trim() : 'n/a',
      apiKey: typeof input.apiKey === 'string' && input.apiKey.trim() ? input.apiKey.trim() : undefined,
      baseUrl: typeof input.baseUrl === 'string' && input.baseUrl.trim() ? input.baseUrl.trim() : undefined,
      isActiveDefault: input.isActiveDefault === true,
    },
  };
}

export interface ProviderRow {
  id: string; name: string; model: string; provider: string; status: string;
  cost_per_1k: string; latency: string; api_key: string | null; base_url: string | null;
  is_active_default: number;
}

export interface RedactedProvider {
  id: string; name: string; model: string; provider: string; status: string;
  costPer1k: string; latency: string; baseUrl?: string;
  isActiveDefault: boolean; hasKey: boolean;
}

/** Segredo nunca volta ao client: api_key vira hasKey booleano. */
export function redactProvider(row: ProviderRow): RedactedProvider {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    provider: row.provider,
    status: row.status,
    costPer1k: row.cost_per_1k,
    latency: row.latency,
    ...(row.base_url ? { baseUrl: row.base_url } : {}),
    isActiveDefault: row.is_active_default === 1,
    hasKey: !!row.api_key,
  };
}
