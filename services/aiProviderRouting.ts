import { AIProviderConfig } from '../types/factory';

export type AIProviderName = AIProviderConfig['provider'];

export interface ProviderRequestConfig {
  provider: AIProviderName;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  prompt: string;
  systemInstruction: string;
}

export interface BuiltProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface ProviderRequestError {
  error: string;
}

/** Sensible default base URLs. Azure OpenAI has none — its endpoint is deployment-specific. */
export const DEFAULT_BASE_URLS: Partial<Record<AIProviderName, string>> = {
  OpenAI: 'https://api.openai.com/v1',
  DeepSeek: 'https://api.deepseek.com/v1',
  Ollama: 'http://localhost:11434',
  OpenRouter: 'https://openrouter.ai/api/v1',
  'Together AI': 'https://api.together.xyz/v1',
};

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

// Known OpenAI-compatible gateway hostnames, for a friendlier vendor label than the generic
// "OpenAI" bucket they're all technically stored/routed under — a provider named "Mistral
// Devstral" showing "Vendor: OpenAI" (or "(OpenAI)" in the AI Assistant drawer header) is
// exactly the confusion this exists to avoid.
const KNOWN_COMPATIBLE_HOSTS: Array<{ match: string; label: string }> = [
  { match: 'mistral.ai', label: 'Mistral (OpenAI-Compatible)' },
  { match: 'opencode.ai', label: 'opencode.ai (OpenAI-Compatible)' },
  { match: 'openrouter.ai', label: 'OpenRouter (OpenAI-Compatible)' },
];

/** User-facing vendor label for a configured provider — see KNOWN_COMPATIBLE_HOSTS above. */
export function getVendorDisplayLabel(provider: AIProviderConfig): string {
  if (provider.provider !== 'OpenAI' || !provider.baseUrl) return provider.provider;
  const known = KNOWN_COMPATIBLE_HOSTS.find((h) => provider.baseUrl!.includes(h.match));
  return known?.label || 'OpenAI-Compatible (custom endpoint)';
}

// Cloud-metadata endpoints have no legitimate use as an AI provider baseUrl —
// unlike a private/localhost address (a real, supported Ollama/Azure setup),
// there's no case where a user genuinely wants their request routed here.
// Blocking exactly this narrow set stops the classic SSRF-to-cloud-credentials
// attack without breaking self-hosted Ollama/Azure endpoints on a LAN.
const BLOCKED_BASE_URL_HOSTS = new Set([
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.internal',
  'fd00:ec2::254',
  '[fd00:ec2::254]',
]);

/**
 * Validates a user-supplied baseUrl before it's used as a server-side fetch
 * target. Returns an error message if the URL is malformed, uses a
 * non-HTTP(S) scheme, or points at a known cloud-metadata endpoint.
 */
function validateBaseUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return `"${raw}" is not a valid URL.`;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `baseUrl must use http:// or https://, got "${parsed.protocol}".`;
  }
  if (BLOCKED_BASE_URL_HOSTS.has(parsed.hostname.toLowerCase())) {
    return 'baseUrl may not point at a cloud metadata endpoint.';
  }
  return null;
}

/**
 * Builds the {url, headers, body} for a non-Gemini provider using plain fetch — no SDK.
 * Gemini is handled separately in the route handler via @google/genai.
 * Pure function: no network calls, safe to unit test directly.
 */
export function buildProviderRequest(
  config: ProviderRequestConfig
): BuiltProviderRequest | ProviderRequestError {
  const { provider, apiKey, baseUrl, model, prompt, systemInstruction } = config;

  if (!model || !model.trim()) {
    return { error: `A model must be configured for ${provider}.` };
  }

  if (provider !== 'Ollama' && (!apiKey || !apiKey.trim())) {
    return {
      error: `No API key configured for ${provider}. Add one in AI Providers before sending requests.`,
    };
  }

  if (baseUrl && baseUrl.trim()) {
    const validationError = validateBaseUrl(baseUrl.trim());
    if (validationError) {
      return { error: validationError };
    }
  }

  switch (provider) {
    case 'OpenAI':
    case 'DeepSeek':
    case 'OpenRouter':
    case 'Together AI':
    case 'Azure OpenAI': {
      const base = (baseUrl && baseUrl.trim()) || DEFAULT_BASE_URLS[provider];
      if (!base) {
        return {
          error:
            'Azure OpenAI requires a baseUrl (your deployment endpoint, e.g. https://{resource}.openai.azure.com/openai/deployments/{deployment}).',
        };
      }
      return {
        url: `${stripTrailingSlash(base)}/chat/completions`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: {
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
        },
      };
    }

    case 'Anthropic': {
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey as string,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model,
          max_tokens: 1024,
          system: systemInstruction,
          messages: [{ role: 'user', content: prompt }],
        },
      };
    }

    case 'Ollama': {
      const base = (baseUrl && baseUrl.trim()) || (DEFAULT_BASE_URLS.Ollama as string);
      return {
        url: `${stripTrailingSlash(base)}/api/generate`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          model,
          prompt,
          system: systemInstruction,
          stream: false,
        },
      };
    }

    default:
      return { error: `Unsupported provider: ${provider}` };
  }
}

/** Extracts the plain-text completion out of a provider's raw JSON response body. */
export function extractResponseText(provider: AIProviderName, json: any): string {
  switch (provider) {
    case 'OpenAI':
    case 'DeepSeek':
    case 'OpenRouter':
    case 'Together AI':
    case 'Azure OpenAI':
      return json?.choices?.[0]?.message?.content || '';
    case 'Anthropic':
      return json?.content?.[0]?.text || '';
    case 'Ollama':
      return json?.response || '';
    default:
      return '';
  }
}

/** Extracts a human-readable error message out of a non-2xx provider response body. */
export function extractProviderErrorMessage(json: any, status: number, statusText: string): string {
  return (
    json?.error?.message ||
    (typeof json?.error === 'string' ? json.error : undefined) ||
    json?.message ||
    statusText ||
    `HTTP ${status}`
  );
}

const NETWORK_ERROR_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNRESET']);

/**
 * Node's fetch collapses every low-level connection failure (DNS lookup
 * failed, connection refused, timed out...) into the same generic
 * "fetch failed" Error, with the actual reason nested in `.cause.code`.
 * Detects that class of failure so callers can show "can't reach the
 * network" instead of a cryptic "fetch failed" — distinct from a request
 * that reached the provider and got rejected (bad key, bad model, etc).
 */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as Error & { cause?: { code?: string } }).cause?.code;
  return (code !== undefined && NETWORK_ERROR_CODES.has(code)) || err.message === 'fetch failed';
}

/** Wraps a caught provider-request error into a message that tells network failures apart from provider-side rejections. */
export function friendlyProviderErrorMessage(err: unknown, providerName: string): string {
  const message = err instanceof Error ? err.message : String(err);
  if (isNetworkError(err)) {
    return `Could not reach ${providerName} — check your network/internet connection (no outbound access from a sandboxed environment counts as this too).`;
  }
  return `${providerName} request failed: ${message}`;
}
