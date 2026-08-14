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
};

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

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

  switch (provider) {
    case 'OpenAI':
    case 'DeepSeek':
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
