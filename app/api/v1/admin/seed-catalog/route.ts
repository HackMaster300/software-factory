import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/sql';
import {
  initialTechStacks,
  initialSecurityProfiles,
  initialDatabaseProfiles,
  initialDockerProfiles,
  initialCacheProfiles,
  initialLoggingProfiles,
  initialRuleSets,
  initialFeatureManifests,
  initialTemplates,
  initialPromptTemplates,
  initialAIProviders,
} from '../../../../../services/mockSeedData';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/seed-catalog — importa SÓ o catálogo de plataforma
 * (tech stacks, features, rules, templates, profiles, prompts, providers sem key).
 * Histórico de usuário (orgs/workspaces/projects/decisions) nunca é seed — Phase 1.
 * Idempotente por padrão: só escreve quando a tabela está vazia; ?force=1 reescreve.
 */
export async function POST(req: NextRequest) {
  try {
    const force = req.nextUrl.searchParams.get('force') === '1';
    const db = getDb();
    const now = new Date().toISOString();

    const catalogEntries: Array<[string, unknown]> = [
      ['techStacks', initialTechStacks],
      ['featureManifests', initialFeatureManifests],
      ['ruleSets', initialRuleSets],
      ['templates', initialTemplates],
      ['securityProfiles', initialSecurityProfiles],
      ['databaseProfiles', initialDatabaseProfiles],
      ['dockerProfiles', initialDockerProfiles],
      ['cacheProfiles', initialCacheProfiles],
      ['loggingProfiles', initialLoggingProfiles],
      ['promptTemplates', initialPromptTemplates],
    ];

    const catalogEmpty =
      (db.prepare('SELECT COUNT(*) AS n FROM catalog').get() as { n: number }).n === 0;

    let catalogWritten = 0;
    if (catalogEmpty || force) {
      const upsert = db.prepare(
        'INSERT INTO catalog (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at'
      );
      for (const [key, value] of catalogEntries) {
        upsert.run(key, JSON.stringify(value), now);
        catalogWritten++;
      }
    }

    const providersEmpty =
      (db.prepare('SELECT COUNT(*) AS n FROM ai_providers').get() as { n: number }).n === 0;

    let providersWritten = 0;
    if (providersEmpty || force) {
      const upsert = db.prepare(
        `INSERT INTO ai_providers (id, name, model, provider, status, cost_per_1k, latency, api_key, base_url, is_active_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 0)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, model=excluded.model, provider=excluded.provider,
         status=excluded.status, cost_per_1k=excluded.cost_per_1k, latency=excluded.latency`
      );
      for (const p of initialAIProviders) {
        upsert.run(p.id, p.name, p.model, p.provider, p.status, p.costPer1k, p.latency);
        providersWritten++;
      }
    }

    return NextResponse.json({
      data: { catalogWritten, providersWritten, forced: force },
    });
  } catch (err) {
    console.error('POST /api/v1/admin/seed-catalog failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
