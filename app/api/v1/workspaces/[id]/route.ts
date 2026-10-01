import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/sql';
import { validateWorkspace } from '../../../../../lib/api-validation';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = validateWorkspace(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const existing = getDb().prepare('SELECT id FROM workspaces WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: `Workspace '${id}' not found.` }, { status: 404 });
    }

    const org = getDb().prepare('SELECT id FROM organizations WHERE id = ?').get(parsed.value.organizationId);
    if (!org) {
      return NextResponse.json(
        { error: 'organizationId does not reference an existing organization.' },
        { status: 400 }
      );
    }

    getDb()
      .prepare('UPDATE workspaces SET name = ?, organization_id = ?, description = ? WHERE id = ?')
      .run(parsed.value.name, parsed.value.organizationId, parsed.value.description, id);

    return NextResponse.json({ data: { id, ...parsed.value } });
  } catch (err) {
    console.error('PATCH /api/v1/workspaces/[id] failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = getDb().prepare('SELECT id FROM workspaces WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: `Workspace '${id}' not found.` }, { status: 404 });
    }

    getDb().prepare('DELETE FROM workspaces WHERE id = ?').run(id);

    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error('DELETE /api/v1/workspaces/[id] failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
