import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from './aiService';
import { aiProviderRepository } from './repositories/aiProvider.repository';
import type { AIProviderConfig } from '../types/factory';

const activeProvider: AIProviderConfig = {
  id: 'ai-active-test',
  name: 'Active Test Provider',
  model: 'test-model',
  provider: 'OpenAI',
  status: 'configured',
  costPer1k: '$0.00',
  latency: '0ms',
  apiKey: 'sk-test-key',
  isActiveDefault: true,
};

describe('AIService.requestAnalysis', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes to Google Gemini with no key when no provider is marked active', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'simulated output', isSimulated: true }),
    });

    const result = await AIService.requestAnalysis('Design a caching layer');

    expect(result).toEqual({ text: 'simulated output', isSimulated: true });
    const [, options] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.provider).toBe('Google Gemini');
    expect(body.apiKey).toBeUndefined();
  });

  it('routes to whichever provider is marked isActiveDefault, forwarding its key/model/baseUrl', async () => {
    const existing = aiProviderRepository.getAIProviders();
    aiProviderRepository.saveAIProviders([...existing.map((p) => ({ ...p, isActiveDefault: false })), activeProvider]);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'live output', isSimulated: false }),
    });

    const result = await AIService.requestAnalysis('Design a caching layer', 'Backend Engineer');

    expect(result).toEqual({ text: 'live output', isSimulated: false });
    const [, options] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.provider).toBe('OpenAI');
    expect(body.apiKey).toBe('sk-test-key');
    expect(body.model).toBe('test-model');
    expect(body.role).toBe('Backend Engineer');
  });

  it('falls back to a canned Fallback Analysis (isSimulated: true) when the request throws', async () => {
    (global.fetch as any).mockRejectedValue(new Error('network error'));

    const result = await AIService.requestAnalysis('Design a caching layer', 'DBA');

    expect(result.isSimulated).toBe(true);
    expect(result.text).toContain('DBA Fallback Analysis');
  });

  it('falls back when the response body contains an error field even on an ok HTTP status', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'No API key configured for OpenAI.' }),
    });

    const result = await AIService.requestAnalysis('Design a caching layer');

    expect(result.isSimulated).toBe(true);
  });
});

describe('AIService.testConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports success with latency when the provider responds with a real (non-simulated) result', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'OK', isSimulated: false }),
    });

    const result = await AIService.testConnection(activeProvider);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Connected');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reports failure when the server had to fall back to a simulated response (no real key)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ text: 'simulated', isSimulated: true }),
    });

    const result = await AIService.testConnection(activeProvider);

    expect(result.success).toBe(false);
    expect(result.message).toContain('simulated response');
  });

  it('reports failure with the server-provided error message on a non-ok response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid API key.' }),
    });

    const result = await AIService.testConnection(activeProvider);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid API key.');
  });

  it('reports failure (never throws) when fetch itself rejects', async () => {
    (global.fetch as any).mockRejectedValue(new Error('fetch failed'));

    const result = await AIService.testConnection(activeProvider);

    expect(result.success).toBe(false);
    expect(result.message).toBe('fetch failed');
  });
});
