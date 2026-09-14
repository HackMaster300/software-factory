import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '../../../../lib/sql';
import { validateOrganization } from '../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = getDb()
      .prepare('SELECT id, name, code, plan FROM organizations ORDER BY created_at ASC')
      .all();
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('GET /api/v1/organizations failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = validateOrganization(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    getDb()
      .prepare('INSERT INTO organizations (id, name, code, plan, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, parsed.value.name, parsed.value.code, parsed.value.plan, createdAt);

    return NextResponse.json(
      { data: { id, ...parsed.value } },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/v1/organizations failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
