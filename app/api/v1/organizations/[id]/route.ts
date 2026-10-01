import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/sql';
import { validateOrganization } from '../../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = validateOrganization(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const existing = getDb().prepare('SELECT id FROM organizations WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: `Organization '${id}' not found.` }, { status: 404 });
    }

    getDb()
      .prepare('UPDATE organizations SET name = ?, code = ?, plan = ? WHERE id = ?')
      .run(parsed.value.name, parsed.value.code, parsed.value.plan, id);

    return NextResponse.json({ data: { id, ...parsed.value } });
  } catch (err) {
    console.error('PATCH /api/v1/organizations/[id] failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = getDb().prepare('SELECT id FROM organizations WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: `Organization '${id}' not found.` }, { status: 404 });
    }

    // PRAGMA foreign_keys=ON (lib/sql.ts) faz o ON DELETE CASCADE do schema
    // apagar as workspaces desta organização automaticamente.
    getDb().prepare('DELETE FROM organizations WHERE id = ?').run(id);

    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error('DELETE /api/v1/organizations/[id] failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
