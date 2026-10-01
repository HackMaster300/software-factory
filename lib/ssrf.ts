import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { isIP } from 'node:net';

/**
 * SSRF guard for user-supplied outbound URLs (AI provider baseUrl).
 *
 * - Only http/https, no embedded credentials.
 * - The hostname is resolved via DNS and EVERY resolved address is checked
 *   against private / loopback / link-local / CGNAT / multicast / reserved /
 *   cloud-metadata ranges, IPv4 and IPv6 — including IPv4-mapped, IPv4-
 *   compatible, NAT64 (64:ff9b::/96) and 6to4 (2002::/16) embeddings.
 *   Alternate IPv4 encodings (decimal `2130706433`, hex `0x7f.1`, octal
 *   `0177.0.0.1`) are normalised by the WHATWG URL parser before the check.
 * - `createGuardedLookup()` re-applies the same check at connect time (used as
 *   the undici dispatcher's DNS lookup), so a DNS-rebinding answer that changes
 *   between the pre-check and the real connection is still refused.
 *
 * Opt-in for local/self-hosted endpoints (e.g. Ollama on localhost, a LAN
 * Azure/OpenAI-compatible gateway): set `AI_PRIVATE_HOST_ALLOWLIST` to a
 * comma-separated list of hostnames/IPs, e.g. `localhost,127.0.0.1,::1`.
 * Link-local / cloud-metadata addresses (169.254.0.0/16, fe80::/10,
 * fd00:ec2::254) are NEVER allowed, even when allowlisted.
 */

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfBlockedError';
  }
}

type LookupFn = (hostname: string) => Promise<LookupAddress[]>;

const defaultLookupAll: LookupFn = (hostname) =>
  new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses as LookupAddress[]);
    });
  });

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return bytes.every((b) => Number.isInteger(b) && b >= 0 && b <= 255) ? bytes : null;
}

/** Expands an IPv6 literal (optionally with trailing dotted IPv4 and/or %zone) to 16 bytes. */
function parseIPv6(input: string): number[] | null {
  let ip = input.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  let tail: number[] = [];
  const lastColon = ip.lastIndexOf(':');
  const maybeV4 = ip.slice(lastColon + 1);
  if (maybeV4.includes('.')) {
    const v4 = parseIPv4(maybeV4);
    if (!v4) return null;
    tail = v4;
    ip = ip.slice(0, lastColon + 1) + '0:0';
  }
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const toGroups = (s: string) => (s ? s.split(':') : []);
  const head = toGroups(halves[0]);
  const rest = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (missing < 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...rest];
  if (groups.length !== 8) return null;
  const bytes: number[] = [];
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
    const n = parseInt(g, 16);
    bytes.push(n >> 8, n & 0xff);
  }
  if (tail.length) bytes.splice(12, 4, ...tail);
  return bytes;
}

type Verdict = 'public' | 'private' | 'never';

function classifyIPv4(b: number[]): Verdict {
  const [a, c] = [b[0], b[1]];
  if (a === 169 && c === 254) return 'never'; // link-local incl. 169.254.169.254 metadata
  if (a === 0) return 'private'; // "this network"
  if (a === 10) return 'private';
  if (a === 100 && c >= 64 && c <= 127) return 'private'; // CGNAT 100.64/10
  if (a === 127) return 'private'; // loopback
  if (a === 172 && c >= 16 && c <= 31) return 'private';
  if (a === 192 && c === 168) return 'private';
  if (a === 192 && c === 0 && (b[2] === 0 || b[2] === 2)) return 'private'; // 192.0.0/24, TEST-NET-1
  if (a === 198 && (c === 18 || c === 19)) return 'private'; // benchmarking
  if (a === 198 && c === 51 && b[2] === 100) return 'private'; // TEST-NET-2
  if (a === 203 && c === 0 && b[2] === 113) return 'private'; // TEST-NET-3
  if (a >= 224) return 'private'; // multicast, reserved, broadcast
  return 'public';
}

function classifyIPv6(b: number[]): Verdict {
  const allZero = (from: number, to: number) => b.slice(from, to).every((x) => x === 0);
  // fd00:ec2::254 (AWS IMDS over IPv6) — explicit, though fc00::/7 covers it too.
  const imds = parseIPv6('fd00:ec2::254')!;
  if (b.every((x, i) => x === imds[i])) return 'never';
  if ((b[0] === 0xfe && (b[1] & 0xc0) === 0x80)) return 'never'; // fe80::/10 link-local
  if (allZero(0, 15) && (b[15] === 0 || b[15] === 1)) return 'private'; // :: and ::1
  // IPv4-mapped ::ffff:a.b.c.d and IPv4-compatible ::a.b.c.d
  if (allZero(0, 10) && ((b[10] === 0xff && b[11] === 0xff) || (b[10] === 0 && b[11] === 0))) {
    return classifyIPv4(b.slice(12));
  }
  // NAT64 64:ff9b::/96
  if (b[0] === 0x00 && b[1] === 0x64 && b[2] === 0xff && b[3] === 0x9b && allZero(4, 12)) {
    return classifyIPv4(b.slice(12));
  }
  // 6to4 2002:AABB:CCDD::/48 embeds a.b.c.d
  if (b[0] === 0x20 && b[1] === 0x02) {
    const embedded = classifyIPv4(b.slice(2, 6));
    if (embedded !== 'public') return embedded;
  }
  if ((b[0] & 0xfe) === 0xfc) return 'private'; // fc00::/7 unique-local
  if ((b[0] === 0xfe && (b[1] & 0xc0) === 0xc0)) return 'private'; // fec0::/10 site-local (deprecated)
  if (b[0] === 0xff) return 'private'; // multicast
  if (b[0] === 0x20 && b[1] === 0x01 && b[2] === 0x0d && b[3] === 0xb8) return 'private'; // documentation
  if (b[0] === 0x01 && allZero(1, 8)) return 'private'; // 100::/64 discard
  return 'public';
}

/** Classifies a literal IP address. Unparseable input is treated as private (fail closed). */
export function classifyIp(address: string): Verdict {
  const v = isIP(address.replace(/^\[|\]$/g, '').split('%')[0]);
  if (v === 4) {
    const b = parseIPv4(address);
    return b ? classifyIPv4(b) : 'private';
  }
  if (v === 6) {
    const b = parseIPv6(address);
    return b ? classifyIPv6(b) : 'private';
  }
  return 'private';
}

export function getPrivateHostAllowlist(): Set<string> {
  return new Set(
    (process.env.AI_PRIVATE_HOST_ALLOWLIST || '')
      .split(',')
      .map((s) => s.trim().toLowerCase().replace(/^\[|\]$/g, ''))
      .filter(Boolean)
  );
}

function normaliseHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
}

function checkAddress(host: string, address: string, allowlist: Set<string>): void {
  const verdict = classifyIp(address);
  if (verdict === 'public') return;
  if (verdict === 'never') {
    throw new SsrfBlockedError(`baseUrl host "${host}" resolves to a link-local/cloud-metadata address, which is never allowed.`);
  }
  if (allowlist.has(host) || allowlist.has(normaliseHost(address))) return;
  throw new SsrfBlockedError(
    `baseUrl host "${host}" resolves to a private/loopback address (${address}). ` +
      `To allow a local or LAN endpoint (e.g. Ollama on localhost), add it to AI_PRIVATE_HOST_ALLOWLIST on the server.`
  );
}

/**
 * Validates a URL as a safe server-side fetch target. Resolves the hostname
 * and throws SsrfBlockedError if it (or any resolved address) is not allowed.
 */
export async function assertSafeOutboundUrl(
  raw: string,
  opts: { lookupAll?: LookupFn; allowlist?: Set<string> } = {}
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfBlockedError(`"${raw}" is not a valid URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfBlockedError(`baseUrl must use http:// or https://, got "${url.protocol}".`);
  }
  if (url.username || url.password) {
    throw new SsrfBlockedError('baseUrl must not contain embedded credentials.');
  }
  const host = normaliseHost(url.hostname);
  if (!host) throw new SsrfBlockedError('baseUrl has no host.');
  if (host === 'metadata.google.internal' || host === 'metadata.internal' || host.endsWith('.metadata.google.internal')) {
    throw new SsrfBlockedError('baseUrl may not point at a cloud metadata endpoint.');
  }
  const allowlist = opts.allowlist ?? getPrivateHostAllowlist();

  // Explicitly allowlisted hostnames are trusted as-is (no DNS needed — useful
  // behind a corporate proxy where the host doesn't resolve locally).
  if (!isIP(host) && allowlist.has(host)) return url;

  if (isIP(host)) {
    checkAddress(host, host, allowlist);
    return url;
  }

  let addresses: LookupAddress[];
  try {
    addresses = await (opts.lookupAll ?? defaultLookupAll)(host);
  } catch {
    throw new SsrfBlockedError(`Could not resolve baseUrl host "${host}".`);
  }
  if (!addresses.length) throw new SsrfBlockedError(`Could not resolve baseUrl host "${host}".`);
  for (const a of addresses) checkAddress(host, a.address, allowlist);
  return url;
}

/**
 * A `dns.lookup`-compatible function for undici's `connect.lookup` that
 * refuses to hand back a blocked address — closes the DNS-rebinding gap
 * between assertSafeOutboundUrl() and the actual TCP connect.
 */
export function createGuardedLookup(allowlist: Set<string> = getPrivateHostAllowlist()) {
  return (
    hostname: string,
    options: Record<string, unknown>,
    callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void
  ) => {
    dnsLookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
      if (err) return callback(err, '', 0);
      const list = addresses as LookupAddress[];
      try {
        for (const a of list) checkAddress(normaliseHost(hostname), a.address, allowlist);
      } catch (blocked) {
        return callback(blocked as NodeJS.ErrnoException, '', 0);
      }
      if (options && options.all) return callback(null, list);
      const first = list[0];
      return callback(null, first.address, first.family);
    });
  };
}
