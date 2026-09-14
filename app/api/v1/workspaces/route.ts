import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '../../../../lib/sql';
import { validateWorkspace } from '../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('organizationId');
    const rows = orgId
      ? getDb()
          .prepare('SELECT id, organization_id AS organizationId, name, description FROM workspaces WHERE organization_id = ? ORDER BY created_at ASC')
          .all(orgId)
      : getDb()
          .prepare('SELECT id, organization_id AS organizationId, name, description FROM workspaces ORDER BY created_at ASC')
          .all();
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('GET /api/v1/workspaces failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = validateWorkspace(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const org = getDb()
      .prepare('SELECT id FROM organizations WHERE id = ?')
      .get(parsed.value.organizationId) as { id: string } | undefined;
    if (!org) {
      return NextResponse.json(
        { error: 'organizationId does not reference an existing organization.' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    getDb()
      .prepare('INSERT INTO workspaces (id, organization_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, parsed.value.organizationId, parsed.value.name, parsed.value.description, createdAt);

    return NextResponse.json(
      { data: { id, ...parsed.value } },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/v1/workspaces failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
