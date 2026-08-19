import { describe, it, expect } from 'vitest';
import {
  buildProviderRequest,
  extractResponseText,
  extractProviderErrorMessage,
  isNetworkError,
  friendlyProviderErrorMessage,
  getVendorDisplayLabel,
  DEFAULT_BASE_URLS,
} from './aiProviderRouting';

const baseConfig = {
  model: 'test-model',
  prompt: 'Evaluate this architecture.',
  systemInstruction: 'You are a helpful assistant.',
};

describe('buildProviderRequest', () => {
  it('builds an OpenAI chat-completions request against the default base URL', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
      apiKey: 'sk-test-123',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe(`${DEFAULT_BASE_URLS.OpenAI}/chat/completions`);
    expect(result.headers.Authorization).toBe('Bearer sk-test-123');
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.body).toEqual({
      model: 'test-model',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Evaluate this architecture.' },
      ],
    });
  });

  it('builds a DeepSeek request against its own default base URL', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'DeepSeek',
      apiKey: 'ds-key',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe(`${DEFAULT_BASE_URLS.DeepSeek}/chat/completions`);
    expect(result.headers.Authorization).toBe('Bearer ds-key');
  });

  it('builds an OpenRouter request against its own default base URL', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenRouter',
      apiKey: 'or-key',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe(`${DEFAULT_BASE_URLS.OpenRouter}/chat/completions`);
    expect(result.headers.Authorization).toBe('Bearer or-key');
  });

  it('lets a custom baseUrl override the OpenAI default and strips trailing slashes', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
      apiKey: 'sk-test',
      baseUrl: 'https://my-proxy.example.com/v1/',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe('https://my-proxy.example.com/v1/chat/completions');
  });

  it('requires a baseUrl for Azure OpenAI and errors clearly without one', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Azure OpenAI',
      apiKey: 'azure-key',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/Azure OpenAI requires a baseUrl/i);
  });

  it('builds an Azure OpenAI request once a deployment baseUrl is supplied', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Azure OpenAI',
      apiKey: 'azure-key',
      baseUrl: 'https://my-resource.openai.azure.com/openai/deployments/my-deployment',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe(
      'https://my-resource.openai.azure.com/openai/deployments/my-deployment/chat/completions'
    );
    expect(result.headers.Authorization).toBe('Bearer azure-key');
  });

  it('builds an Anthropic Messages API request with x-api-key and anthropic-version headers', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Anthropic',
      apiKey: 'anthropic-key',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe('https://api.anthropic.com/v1/messages');
    expect(result.headers['x-api-key']).toBe('anthropic-key');
    expect(result.headers['anthropic-version']).toBe('2023-06-01');
    expect(result.body).toEqual({
      model: 'test-model',
      max_tokens: 1024,
      system: 'You are a helpful assistant.',
      messages: [{ role: 'user', content: 'Evaluate this architecture.' }],
    });
  });

  it('builds an Ollama request with no API key required and defaults to localhost', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Ollama',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe('http://localhost:11434/api/generate');
    expect(result.headers.Authorization).toBeUndefined();
    expect(result.body).toEqual({
      model: 'test-model',
      prompt: 'Evaluate this architecture.',
      system: 'You are a helpful assistant.',
      stream: false,
    });
  });

  it('respects a custom Ollama baseUrl', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Ollama',
      baseUrl: 'http://192.168.1.50:11434',
    });

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.url).toBe('http://192.168.1.50:11434/api/generate');
  });

  it('errors when a key-requiring provider has no apiKey', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/No API key configured for OpenAI/);
  });

  it('errors when model is missing', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      model: '',
      provider: 'OpenAI',
      apiKey: 'sk-test',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/model must be configured/i);
  });

  it('rejects a baseUrl pointing at the AWS/cloud metadata endpoint (SSRF)', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
      apiKey: 'sk-test',
      baseUrl: 'http://169.254.169.254/latest/meta-data/',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/metadata endpoint/i);
  });

  it('rejects a baseUrl pointing at the GCP metadata hostname (SSRF), for Ollama too', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Ollama',
      baseUrl: 'http://metadata.google.internal/computeMetadata/v1/',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/metadata endpoint/i);
  });

  it('rejects a non-HTTP(S) baseUrl scheme', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
      apiKey: 'sk-test',
      baseUrl: 'file:///etc/passwd',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/http:\/\/ or https:\/\//);
  });

  it('rejects a malformed baseUrl', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'OpenAI',
      apiKey: 'sk-test',
      baseUrl: 'not a url',
    });

    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toMatch(/not a valid URL/);
  });

  it('still allows a private-LAN baseUrl (legitimate self-hosted Ollama/Azure use)', () => {
    const result = buildProviderRequest({
      ...baseConfig,
      provider: 'Ollama',
      baseUrl: 'http://192.168.1.50:11434',
    });

    expect('error' in result).toBe(false);
  });
});

describe('extractResponseText', () => {
  it('extracts OpenAI-shaped chat completion text', () => {
    const json = { choices: [{ message: { content: 'Hello there' } }] };
    expect(extractResponseText('OpenAI', json)).toBe('Hello there');
    expect(extractResponseText('DeepSeek', json)).toBe('Hello there');
    expect(extractResponseText('Azure OpenAI', json)).toBe('Hello there');
    expect(extractResponseText('OpenRouter', json)).toBe('Hello there');
  });

  it('extracts Anthropic-shaped content block text', () => {
    const json = { content: [{ type: 'text', text: 'Hi from Claude' }] };
    expect(extractResponseText('Anthropic', json)).toBe('Hi from Claude');
  });

  it('extracts Ollama-shaped response field', () => {
    const json = { response: 'Hi from Ollama' };
    expect(extractResponseText('Ollama', json)).toBe('Hi from Ollama');
  });

  it('returns empty string when the expected field is absent', () => {
    expect(extractResponseText('OpenAI', {})).toBe('');
    expect(extractResponseText('OpenAI', null)).toBe('');
  });
});

describe('extractProviderErrorMessage', () => {
  it('prefers a nested error.message', () => {
    expect(extractProviderErrorMessage({ error: { message: 'Invalid API key' } }, 401, 'Unauthorized')).toBe(
      'Invalid API key'
    );
  });

  it('falls back to a string error field', () => {
    expect(extractProviderErrorMessage({ error: 'bad request' }, 400, 'Bad Request')).toBe('bad request');
  });

  it('falls back to statusText, then a generic HTTP status message', () => {
    expect(extractProviderErrorMessage({}, 500, 'Internal Server Error')).toBe('Internal Server Error');
    expect(extractProviderErrorMessage(null, 503, '')).toBe('HTTP 503');
  });
});

describe('isNetworkError', () => {
  it('recognizes a Node fetch failure carrying a DNS-lookup cause code (e.g. sandboxed/offline environments)', () => {
    const err = new Error('fetch failed');
    (err as Error & { cause?: unknown }).cause = { code: 'ENOTFOUND' };
    expect(isNetworkError(err)).toBe(true);
  });

  it('recognizes the bare "fetch failed" message even without a structured cause', () => {
    expect(isNetworkError(new Error('fetch failed'))).toBe(true);
  });

  it('does not flag a provider-side rejection (bad key/model) as a network error', () => {
    expect(isNetworkError(new Error('404 Not Found: model not found'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isNetworkError('some string')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe('friendlyProviderErrorMessage', () => {
  it('produces a "could not reach" message for network failures, naming the provider', () => {
    const err = new Error('fetch failed');
    (err as Error & { cause?: unknown }).cause = { code: 'ENOTFOUND' };
    expect(friendlyProviderErrorMessage(err, 'Gemini')).toBe(
      'Could not reach Gemini — check your network/internet connection (no outbound access from a sandboxed environment counts as this too).'
    );
  });

  it('preserves the underlying message for a non-network provider-side error', () => {
    expect(friendlyProviderErrorMessage(new Error('Invalid API key'), 'OpenAI')).toBe(
      'OpenAI request failed: Invalid API key'
    );
  });
});

describe('getVendorDisplayLabel', () => {
  it('shows "Mistral" instead of "OpenAI" for a provider configured via the OpenAI-compatible vendor with a Mistral baseUrl', () => {
    const label = getVendorDisplayLabel({
      id: 'p1',
      name: 'Mistral Devstral',
      provider: 'OpenAI',
      model: 'devstral-2512',
      status: 'active',
      costPer1k: '$0',
      latency: '250ms',
      baseUrl: 'https://api.mistral.ai/v1',
    });
    expect(label).toContain('Mistral');
    expect(label).not.toBe('OpenAI');
  });

  it('shows "opencode.ai" for the opencode.ai Zen gateway baseUrl', () => {
    const label = getVendorDisplayLabel({
      id: 'p2',
      name: 'opencode.ai Big Pickle',
      provider: 'OpenAI',
      model: 'big-pickle',
      status: 'active',
      costPer1k: '$0',
      latency: '250ms',
      baseUrl: 'https://opencode.ai/zen/v1',
    });
    expect(label).toContain('opencode.ai');
  });

  it('falls back to a generic "OpenAI-Compatible" label for an unrecognized custom endpoint', () => {
    const label = getVendorDisplayLabel({
      id: 'p3',
      name: 'My Custom Gateway',
      provider: 'OpenAI',
      model: 'some-model',
      status: 'active',
      costPer1k: '$0',
      latency: '250ms',
      baseUrl: 'https://my-own-proxy.example.com/v1',
    });
    expect(label).toBe('OpenAI-Compatible (custom endpoint)');
  });

  it('shows plain "OpenAI" for the real OpenAI API (no baseUrl override)', () => {
    const label = getVendorDisplayLabel({
      id: 'p4',
      name: 'OpenAI GPT-4o',
      provider: 'OpenAI',
      model: 'gpt-4o',
      status: 'active',
      costPer1k: '$0',
      latency: '250ms',
    });
    expect(label).toBe('OpenAI');
  });

  it('passes through non-OpenAI vendors unchanged (e.g. Anthropic, Ollama, OpenRouter)', () => {
    const anthropic = getVendorDisplayLabel({
      id: 'p5',
      name: 'Claude',
      provider: 'Anthropic',
      model: 'claude-sonnet-5',
      status: 'active',
      costPer1k: '$0',
      latency: '250ms',
    });
    expect(anthropic).toBe('Anthropic');
  });
});
