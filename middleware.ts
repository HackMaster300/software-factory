import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized, isPublicApiRoute, unauthorizedResponse } from './lib/auth';

/**
 * Enforces API_TOKEN (see lib/auth.ts) on every `/api/*` route — admin
 * import/export/seed-catalog, ai-providers, organizations, workspaces,
 * ai/generate, and any route added later. `GET /api/v1/health` stays public.
 * When API_TOKEN is unset (solo/local use) everything passes through.
 */
export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') return NextResponse.next();
  if (isPublicApiRoute(req.method, req.nextUrl.pathname)) return NextResponse.next();
  if (!isAuthorized(req)) return unauthorizedResponse();
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
