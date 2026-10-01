import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/sql';
import { validateWorkspaceExport } from '../../../../../lib/admin-import';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/import — recebe o JSON de `StorageService.exportFullWorkspaceState()`
 * (localStorage do browser) e grava no SQL do servidor. Idempotente (INSERT OR IGNORE):
 * re-importar é seguro. apiKey de providers é descartada na validação — segredos se
 * reconfiguram por provider na UI, nunca via backup.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = validateWorkspaceExport(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const db = getDb();
    const now = new Date().toISOString();
    let inserted = 0;
    const count = (r: { changes: number | bigint }): void => { inserted += Number(r.changes); };

    // All-or-nothing: a failure halfway through (bad row, FK, disk) must not
    // leave a partially-imported backup behind.
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const o of parsed.value.organizations) {
        count(db.prepare(
          'INSERT OR IGNORE INTO organizations (id, name, code, plan, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(o.id, o.name, o.code, o.plan, now) as unknown as { changes: number | bigint });
      }
      for (const w of parsed.value.workspaces) {
        const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(w.organizationId);
        if (!org) continue; // workspace órfão: pula honestamente em vez de quebrar FK
        count(db.prepare(
          'INSERT OR IGNORE INTO workspaces (id, organization_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)'
        ).run(w.id, w.organizationId, w.name, w.description, now) as unknown as { changes: number | bigint });
      }
      for (const p of parsed.value.projects) {
        const r = p as Record<string, unknown>;
        count(db.prepare(
          `INSERT OR IGNORE INTO projects (id, name, slug, description, organization_id, workspace_id, template_id, blueprint, status, created_at, updated_at, custom_config)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          p.id,
          typeof r.name === 'string' ? r.name : p.id,
          typeof r.slug === 'string' ? r.slug : p.id,
          typeof r.description === 'string' ? r.description : '',
          typeof r.organizationId === 'string' ? r.organizationId : '',
          typeof r.workspaceId === 'string' ? r.workspaceId : '',
          typeof r.templateId === 'string' ? r.templateId : '',
          JSON.stringify(r.blueprint ?? {}),
          typeof r.status === 'string' ? r.status : 'draft',
          typeof r.createdAt === 'string' ? r.createdAt : now,
          typeof r.updatedAt === 'string' ? r.updatedAt : now,
          JSON.stringify(r.customConfig ?? {})
        ) as unknown as { changes: number | bigint });
      }
      for (const d of parsed.value.decisionLogs) {
        const r = d as Record<string, unknown>;
        count(db.prepare(
          `INSERT OR IGNORE INTO decision_logs (id, project_id, decision, date, reason, impact, warnings_ignored, ai_recommendations, user_justification, author)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          d.id,
          typeof r.projectId === 'string' ? r.projectId : '',
          typeof r.decision === 'string' ? r.decision : '',
          typeof r.date === 'string' ? r.date : now,
          typeof r.reason === 'string' ? r.reason : '',
          typeof r.impact === 'string' ? r.impact : '',
          JSON.stringify(r.warningsIgnored ?? []),
          JSON.stringify(r.aiRecommendations ?? []),
          typeof r.userJustification === 'string' ? r.userJustification : '',
          typeof r.author === 'string' ? r.author : ''
        ) as unknown as { changes: number | bigint });
      }
      for (const p of parsed.value.providers) {
        const r = p as Record<string, unknown>;
        count(db.prepare(
          `INSERT OR IGNORE INTO ai_providers (id, name, model, provider, status, cost_per_1k, latency, api_key, base_url, is_active_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 0)`
        ).run(
          p.id,
          typeof r.name === 'string' ? r.name : p.id,
          typeof r.model === 'string' ? r.model : '',
          typeof r.provider === 'string' ? r.provider : 'Google Gemini',
          typeof r.status === 'string' ? r.status : 'configured',
          typeof r.costPer1k === 'string' ? r.costPer1k : 'n/a',
          typeof r.latency === 'string' ? r.latency : 'n/a',
          typeof r.baseUrl === 'string' ? r.baseUrl : null
        ) as unknown as { changes: number | bigint });
      }
      const upsertCatalog = db.prepare(
        'INSERT INTO catalog (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at'
      );
      for (const c of parsed.value.catalog) {
        upsertCatalog.run(c.key, JSON.stringify(c.value), now);
        inserted += 1;
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    return NextResponse.json({ data: { inserted } }, { status: 201 });
  } catch (err) {
    console.error('POST /api/v1/admin/import failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
