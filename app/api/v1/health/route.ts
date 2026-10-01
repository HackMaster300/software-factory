import { NextResponse } from 'next/server';
import { getTableCounts } from '../../../../lib/sql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const counts = getTableCounts();
    return NextResponse.json({
      status: 'ok',
      // Never expose the server filesystem path of the DB file.
      db: { engine: 'sqlite', counts },
    });
  } catch (err) {
    console.error('GET /api/v1/health failed:', err);
    return NextResponse.json({ error: 'Database unavailable. Check server logs.' }, { status: 500 });
  }
}
