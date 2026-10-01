// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { assertSafeOutboundUrl, classifyIp, SsrfBlockedError } from './ssrf';

const resolvesTo = (...addresses: string[]) => async () =>
  addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));

const publicDns = resolvesTo('104.18.2.3');

describe('classifyIp', () => {
  it.each([
    '127.0.0.1', '127.255.255.254', '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '198.18.0.1',
    '::1', '::', 'fc00::1', 'fd12:3456::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::127.0.0.1',
    '64:ff9b::7f00:1', '2002:7f00:1::', '2002:c0a8:101::1',
  ])('%s is private', (ip) => {
    expect(classifyIp(ip)).toBe('private');
  });

  it.each(['169.254.169.254', '169.254.1.1', 'fe80::1', 'fd00:ec2::254', '::ffff:169.254.169.254', '::ffff:a9fe:a9fe', '64:ff9b::a9fe:a9fe'])(
    '%s is never allowed',
    (ip) => {
      expect(classifyIp(ip)).toBe('never');
    }
  );

  it.each(['8.8.8.8', '104.18.2.3', '172.32.0.1', '2606:4700::1111', '::ffff:8.8.8.8'])('%s is public', (ip) => {
    expect(classifyIp(ip)).toBe('public');
  });

  it('treats garbage as private (fail closed)', () => {
    expect(classifyIp('not-an-ip')).toBe('private');
  });
});

describe('assertSafeOutboundUrl', () => {
  afterEach(() => {
    delete process.env.AI_PRIVATE_HOST_ALLOWLIST;
  });

  it('accepts a public https host', async () => {
    await expect(assertSafeOutboundUrl('https://api.example.com/v1', { lookupAll: publicDns })).resolves.toBeInstanceOf(URL);
  });

  it.each(['file:///etc/passwd', 'ftp://example.com', 'gopher://x', 'javascript:alert(1)'])('rejects scheme %s', async (u) => {
    await expect(assertSafeOutboundUrl(u, { lookupAll: publicDns })).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it('rejects embedded credentials', async () => {
    await expect(assertSafeOutboundUrl('https://u:p@api.example.com', { lookupAll: publicDns })).rejects.toThrow(/credentials/);
  });

  it.each([
    'http://127.0.0.1:11434',
    'http://localhost:11434',
    'http://2130706433/',          // decimal 127.0.0.1
    'http://0x7f.0.0.1/',          // hex
    'http://0177.0.0.1/',          // octal
    'http://127.1/',               // short form
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[0:0:0:0:0:ffff:7f00:1]/',
    'http://10.0.0.5/',
    'http://192.168.0.10:8080/',
  ])('blocks loopback/private target %s', async (u) => {
    await expect(assertSafeOutboundUrl(u, { lookupAll: resolvesTo('127.0.0.1') })).rejects.toThrow(/private\/loopback/);
  });

  it.each(['http://169.254.169.254/latest/meta-data/', 'http://[fd00:ec2::254]/', 'http://metadata.google.internal/', 'http://0xa9fea9fe/'])(
    'blocks metadata target %s',
    async (u) => {
      await expect(assertSafeOutboundUrl(u, { lookupAll: publicDns })).rejects.toBeInstanceOf(SsrfBlockedError);
    }
  );

  it('blocks a public-looking hostname that resolves to a private address (DNS)', async () => {
    await expect(
      assertSafeOutboundUrl('https://evil.example.com', { lookupAll: resolvesTo('104.18.2.3', '10.1.2.3') })
    ).rejects.toThrow(/10\.1\.2\.3/);
  });

  it('blocks a hostname resolving to metadata even when allowlisted', async () => {
    process.env.AI_PRIVATE_HOST_ALLOWLIST = '169.254.169.254';
    await expect(assertSafeOutboundUrl('http://169.254.169.254/')).rejects.toThrow(/never allowed/);
  });

  it('fails closed when DNS resolution fails', async () => {
    const failing = async () => {
      throw Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND' });
    };
    await expect(assertSafeOutboundUrl('https://nope.invalid', { lookupAll: failing })).rejects.toThrow(/Could not resolve/);
  });

  it('allows localhost Ollama only when explicitly allowlisted', async () => {
    process.env.AI_PRIVATE_HOST_ALLOWLIST = 'localhost, 127.0.0.1';
    const lookupAll = vi.fn(resolvesTo('127.0.0.1'));
    await expect(assertSafeOutboundUrl('http://localhost:11434/api/generate', { lookupAll })).resolves.toBeInstanceOf(URL);
    await expect(assertSafeOutboundUrl('http://127.0.0.1:11434/api/generate', { lookupAll })).resolves.toBeInstanceOf(URL);
    await expect(assertSafeOutboundUrl('http://10.0.0.1/', { lookupAll })).rejects.toBeInstanceOf(SsrfBlockedError);
  });
});

describe('/api/ai/generate SSRF guard', () => {
  afterEach(() => {
    delete process.env.AI_PRIVATE_HOST_ALLOWLIST;
    vi.unstubAllGlobals();
  });

  async function post(body: Record<string, unknown>) {
    const { NextRequest } = await import('next/server');
    const { POST } = await import('../app/api/ai/generate/route');
    return POST(
      new NextRequest('http://localhost/api/ai/generate', { method: 'POST', body: JSON.stringify({ prompt: 'hi', ...body }) })
    );
  }

  it('returns 400 and never fetches for a loopback baseUrl', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await post({ provider: 'OpenAI', apiKey: 'k', model: 'm', baseUrl: 'http://127.0.0.1:8080/v1' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/private\/loopback/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 400 for the default Ollama localhost URL unless allowlisted', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ response: 'OK' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const blocked = await post({ provider: 'Ollama', model: 'llama3' });
    expect(blocked.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();

    process.env.AI_PRIVATE_HOST_ALLOWLIST = 'localhost';
    const allowed = await post({ provider: 'Ollama', model: 'llama3' });
    expect(allowed.status).toBe(200);
    expect((await allowed.json()).text).toBe('OK');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
