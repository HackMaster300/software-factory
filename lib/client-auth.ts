/**
 * Browser-side half of the API_TOKEN scheme (see lib/auth.ts + middleware.ts).
 *
 * When the server has API_TOKEN set, every `/api/*` call from the UI must carry
 * `Authorization: Bearer <token>`. The UI resolves the token from, in order:
 *   1. `localStorage["sf.apiToken"]` — set per browser, never shipped in the bundle;
 *   2. `NEXT_PUBLIC_API_TOKEN` — inlined at build time. Convenient, but anyone who
 *      can load the UI can read it, so only use it when the UI itself is behind
 *      a trusted network/reverse-proxy auth.
 * With neither set, no header is sent (matches the solo/no-token server mode).
 */
export const API_TOKEN_STORAGE_KEY = 'sf.apiToken';

export function getClientApiToken(): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(API_TOKEN_STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    }
  } catch {
    // localStorage unavailable (privacy mode, SSR) — fall through.
  }
  const fromEnv = process.env.NEXT_PUBLIC_API_TOKEN;
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : undefined;
}

/** Headers to merge into any same-origin `/api/*` fetch. */
export function apiAuthHeaders(): Record<string, string> {
  const token = getClientApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
