/**
 * Opt-in verbose AI diagnostics. Off by default so request metadata never
 * lands in server logs / the browser console unless explicitly enabled:
 *   - server (route handlers): AI_DEBUG_LOGS=1
 *   - browser (components):    NEXT_PUBLIC_AI_DEBUG_LOGS=1 (inlined at build time)
 * Never pass secrets (API keys, tokens, proxy credentials) to aiDebug().
 */
const truthy = (v: string | undefined) => v === '1' || v === 'true';

export function isAiDebugEnabled(): boolean {
  return truthy(process.env.AI_DEBUG_LOGS) || truthy(process.env.NEXT_PUBLIC_AI_DEBUG_LOGS);
}

export function aiDebug(...args: unknown[]): void {
  if (isAiDebugEnabled()) console.debug(...args);
}
