import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '../../../../lib/sql';
import { encryptSecret, InvalidEncryptionKeyError, MissingEncryptionKeyError } from '../../../../lib/secret-crypto';
import {
  redactProvider,
  validateProviderUpsert,
  type ProviderRow,
} from '../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

const PUBLIC_COLUMNS =
  'id, name, model, provider, status, cost_per_1k, latency, api_key, base_url, is_active_default';

/** GET retorna providers com a key redigida (hasKey). Segredo nunca sai do servidor. */
export async function GET() {
  try {
    const rows = getDb().prepare(`SELECT ${PUBLIC_COLUMNS} FROM ai_providers ORDER BY name ASC`).all() as ProviderRow[];
    return NextResponse.json({ data: rows.map(redactProvider) });
  } catch (err) {
    console.error('GET /api/v1/ai-providers failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

/**
 * POST upsert (create ou replace por id). Aceita apiKey para gravar, mas a resposta
 * é sempre redigida. isActiveDefault=true desmarca os demais (exclusivo, como na UI).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = validateProviderUpsert(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const v = parsed.value;
    const id = v.id || randomUUID();
    // Encrypted at rest (AES-256-GCM); throws in production without SF_ENCRYPTION_KEY.
    const storedKey = encryptSecret(v.apiKey ?? null);
    const db = getDb();

    if (v.isActiveDefault) {
      db.prepare('UPDATE ai_providers SET is_active_default = 0').run();
    }

    const existing = db.prepare('SELECT id FROM ai_providers WHERE id = ?').get(id) as
      | { id: string }
      | undefined;

    if (existing) {
      db.prepare(
        `UPDATE ai_providers SET name=?, model=?, provider=?, status=?, cost_per_1k=?, latency=?,
         api_key=COALESCE(?, api_key), base_url=?, is_active_default=? WHERE id=?`
      ).run(
        v.name, v.model, v.provider, v.status || 'configured', v.costPer1k || 'n/a',
        v.latency || 'n/a', storedKey, v.baseUrl ?? null, v.isActiveDefault ? 1 : 0, id
      );
    } else {
      db.prepare(
        `INSERT INTO ai_providers (id, name, model, provider, status, cost_per_1k, latency, api_key, base_url, is_active_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, v.name, v.model, v.provider, v.status || 'configured', v.costPer1k || 'n/a',
        v.latency || 'n/a', storedKey, v.baseUrl ?? null, v.isActiveDefault ? 1 : 0
      );
    }

    const row = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM ai_providers WHERE id = ?`).get(id) as ProviderRow;
    return NextResponse.json({ data: redactProvider(row) }, { status: existing ? 200 : 201 });
  } catch (err) {
    if (err instanceof MissingEncryptionKeyError || err instanceof InvalidEncryptionKeyError) {
      console.error('POST /api/v1/ai-providers: encryption misconfigured:', err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error('POST /api/v1/ai-providers failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
