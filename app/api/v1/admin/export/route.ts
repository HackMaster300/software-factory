import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/sql';
import { redactProvider, type ProviderRow } from '../../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/export — dump completo do SQL no MESMO shape do
 * `StorageService.exportFullWorkspaceState()` (round-trip com POST import).
 * api_keys NUNCA saem (providers vêm redigidos com hasKey).
 */
export async function GET() {
  try {
    const db = getDb();
    const organizations = db.prepare('SELECT id, name, code, plan FROM organizations').all();
    const workspaces = db.prepare(
      'SELECT id, organization_id AS organizationId, name, description FROM workspaces'
    ).all();
    const projectRows = db.prepare(
      'SELECT id, name, slug, description, organization_id AS organizationId, workspace_id AS workspaceId, template_id AS templateId, blueprint, status, created_at AS createdAt, updated_at AS updatedAt, custom_config AS customConfig FROM projects'
    ).all() as Array<Record<string, unknown>>;
    const projects = projectRows.map((p) => ({
      ...p,
      blueprint: safeJson(p.blueprint, {}),
      customConfig: safeJson(p.customConfig, {}),
    }));
    const logRows = db.prepare(
      'SELECT id, project_id AS projectId, decision, date, reason, impact, warnings_ignored AS warningsIgnored, ai_recommendations AS aiRecommendations, user_justification AS userJustification, author FROM decision_logs'
    ).all() as Array<Record<string, unknown>>;
    const decisionLogs = logRows.map((d) => ({
      ...d,
      warningsIgnored: safeJson(d.warningsIgnored, []),
      aiRecommendations: safeJson(d.aiRecommendations, []),
    }));
    const providerRows = db.prepare(
      'SELECT id, name, model, provider, status, cost_per_1k, latency, api_key, base_url, is_active_default FROM ai_providers'
    ).all() as ProviderRow[];
    const catalogRows = db.prepare('SELECT key, value FROM catalog').all() as Array<{ key: string; value: string }>;
    const catalog: Record<string, unknown> = {};
    for (const c of catalogRows) catalog[c.key] = safeJson(c.value, []);

    return NextResponse.json({
      data: {
        organizations, workspaces, projects, decisionLogs,
        aiProviders: providerRows.map(redactProvider),
        ...catalog,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('GET /api/v1/admin/export failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

function safeJson(v: unknown, fallback: unknown): unknown {
  if (typeof v !== 'string') return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}
