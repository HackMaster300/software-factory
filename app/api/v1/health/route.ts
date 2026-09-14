import { NextResponse } from 'next/server';
import { getDb, getDbPath, getTableCounts } from '../../../../lib/sql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const counts = getTableCounts();
    return NextResponse.json({
      status: 'ok',
      db: { engine: 'sqlite', path: getDbPath(), counts },
    });
  } catch (err) {
    console.error('GET /api/v1/health failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
