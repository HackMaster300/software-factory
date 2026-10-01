/**
 * Phase 8-full — auth minimal para API.
 * Se API_TOKEN estiver definido no env, exige `Authorization: Bearer <token>`
 * (ou o header alternativo `x-api-token: <token>`).
 * Sem token configurado (uso solo), libera tudo — honesto para o caso solo.
 * Quando multi-user for necessário, trocar por NextAuth/Clerk sem mexer nas rotas.
 *
 * Aplicado a todo `/api/*` via `middleware.ts` (exceto `GET /api/v1/health`).
 * Edge-safe: sem `node:crypto` (o middleware corre no edge runtime).
 */

/** Rotas que ficam abertas mesmo com API_TOKEN definido (probes de liveness). */
const PUBLIC_API_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'GET', path: '/api/v1/health' },
  { method: 'HEAD', path: '/api/v1/health' },
];

/** Comparação em tempo constante (independente de onde a primeira diferença ocorre). */
function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function extractToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (header && /^Bearer\s+/i.test(header)) return header.replace(/^Bearer\s+/i, '').trim();
  const alt = req.headers.get('x-api-token');
  return alt ? alt.trim() : null;
}

export function isAuthorized(req: Request): boolean {
  const token = process.env.API_TOKEN;
  if (!token) return true;
  const provided = extractToken(req);
  return provided !== null && constantTimeEqual(provided, token);
}

export function isPublicApiRoute(method: string, pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return PUBLIC_API_ROUTES.some((r) => r.method === method.toUpperCase() && r.path === normalized);
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized — missing or invalid API_TOKEN' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' },
  });
}
