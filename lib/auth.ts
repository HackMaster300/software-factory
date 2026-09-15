/**
 * Phase 8-full — auth minimal para API v1.
 * Se API_TOKEN estiver definido no env, exige `Authorization: Bearer <token>`.
 * Sem token configurado (uso solo), libera tudo — honesto para o caso solo.
 * Quando multi-user for necessário, trocar por NextAuth/Clerk sem mexer nas rotas.
 */
export function isAuthorized(req: Request): boolean {
  const token = process.env.API_TOKEN;
  if (!token) return true;
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  return header === `Bearer ${token}`;
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized — missing or invalid API_TOKEN' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
