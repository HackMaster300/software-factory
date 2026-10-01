import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { Agent, ProxyAgent } from 'undici';
import { aiDebug } from '../../../../lib/debug-log';
import { assertSafeOutboundUrl, createGuardedLookup, SsrfBlockedError } from '../../../../lib/ssrf';
import {
  AIProviderName,
  buildProviderRequest,
  extractProviderErrorMessage,
  extractResponseText,
  friendlyProviderErrorMessage,
} from '../../../../services/aiProviderRouting';

function getProxyDispatcher(targetUrl: string) {
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy;
  if (!proxy) return undefined;
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) return undefined;
  try {
    return new ProxyAgent(proxy);
  } catch {
    return undefined;
  }
}

// Direct (non-proxied) connections re-validate every resolved address at
// connect time, so a DNS-rebinding answer can't slip past the pre-check.
let guardedAgent: Agent | undefined;
function getGuardedAgent(): Agent {
  if (!guardedAgent) {
    guardedAgent = new Agent({ connect: { lookup: createGuardedLookup() as never } });
  }
  return guardedAgent;
}

const ALLOWED_PROVIDERS: AIProviderName[] = [
  'Google Gemini',
  'OpenAI',
  'Anthropic',
  'DeepSeek',
  'Azure OpenAI',
  'Ollama',
  'OpenRouter',
  'Together AI',
];

// Must both be real, released model ids — an invalid primary silently doubles
// latency/cost on every request (it always fails over to the fallback) until
// the fallback itself has an outage, at which point Gemini stops working
// entirely with no earlier warning signal.
const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODEL = 'gemini-2.0-flash';

function defaultSystemInstruction(role: string): string {
  // Phase 10 grounded: toda análise sem systemInstruction explícita ainda cita ruleId.
  return `You are the Software Factory Standard Consultant (${role}). Ground every finding in the provided Blueprint/RuleSet/Validation context and cite ruleId (e.g. rule-1) when flagging governance violations. Cover Pros, Cons, Risks, Alternatives, Recommendations. Final decisions belong to the human Architect.`;
}

// Phase 7 (zero simulado): nenhum texto inventado. Sem key real a rota falha alto (400/502)
// em vez de retornar análise fake. O client deve exibir o erro honestamente.

async function callGemini(
  apiKey: string,
  model: string | undefined,
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; isSimulated: boolean }> {
  const ai = new GoogleGenAI({ apiKey });

  const primaryModel = model || GEMINI_PRIMARY_MODEL;

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return { text: response.text || '', isSimulated: false };
  } catch (primaryErr) {
    console.warn(`Gemini model "${primaryModel}" unavailable, trying fallback ${GEMINI_FALLBACK_MODEL}...`, primaryErr);
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: GEMINI_FALLBACK_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return { text: fallbackResponse.text || '', isSimulated: false };
    } catch (fallbackErr) {
      console.error('All Gemini model calls failed:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const {
      prompt,
      systemInstruction,
      role = 'Software Architect',
      provider = 'Google Gemini',
      apiKey,
      baseUrl,
      model,
      providerLabel,
    } = body as {
      prompt?: unknown;
      systemInstruction?: unknown;
      role?: unknown;
      provider?: unknown;
      apiKey?: unknown;
      baseUrl?: unknown;
      model?: unknown;
      providerLabel?: unknown;
    };

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '"prompt" is required and must be a non-empty string.' }, { status: 400 });
    }
    if (systemInstruction !== undefined && typeof systemInstruction !== 'string') {
      return NextResponse.json({ error: '"systemInstruction" must be a string when provided.' }, { status: 400 });
    }
    if (typeof role !== 'string' || role.trim().length === 0) {
      return NextResponse.json({ error: '"role" must be a non-empty string when provided.' }, { status: 400 });
    }
    if (typeof provider !== 'string' || !ALLOWED_PROVIDERS.includes(provider as AIProviderName)) {
      return NextResponse.json(
        { error: `"provider" must be one of: ${ALLOWED_PROVIDERS.join(', ')}.` },
        { status: 400 }
      );
    }
    if (apiKey !== undefined && typeof apiKey !== 'string') {
      return NextResponse.json({ error: '"apiKey" must be a string when provided.' }, { status: 400 });
    }
    if (baseUrl !== undefined && typeof baseUrl !== 'string') {
      return NextResponse.json({ error: '"baseUrl" must be a string when provided.' }, { status: 400 });
    }
    if (model !== undefined && typeof model !== 'string') {
      return NextResponse.json({ error: '"model" must be a string when provided.' }, { status: 400 });
    }
    if (providerLabel !== undefined && typeof providerLabel !== 'string') {
      return NextResponse.json({ error: '"providerLabel" must be a string when provided.' }, { status: 400 });
    }

    const resolvedSystemInstruction = systemInstruction || defaultSystemInstruction(role);
    const typedProvider = provider as AIProviderName;
    // The vendor family (e.g. "OpenAI") is what the request is actually routed as — Mistral,
    // OpenRouter, and opencode.ai are all configured under that same OpenAI-compatible vendor —
    // but it's a confusing name to show the user, who configured "Mistral", not "OpenAI". Prefer
    // the provider's own display name (sent by the client as providerLabel) in user-facing error
    // text; fall back to the vendor family only when no display name was provided.
    const displayName = (providerLabel as string | undefined)?.trim() || typedProvider;
    aiDebug('[AI Generate] Incoming:', {
      provider: typedProvider,
      providerLabel: displayName,
      model: model || '(default)',
      baseUrl: (baseUrl as string) || '(default)',
      hasKey: !!(apiKey as string),
      promptLen: (prompt as string).length,
    });

    if (typedProvider === 'Google Gemini') {
      const resolvedKey = (apiKey as string | undefined) || process.env.GEMINI_API_KEY;

      if (!resolvedKey || resolvedKey === 'MY_GEMINI_API_KEY') {
        // Phase 7: sem key real não há fallback simulado. Falha alto para a UI
        // exibir "configure uma API key" em vez de análise inventada.
        return NextResponse.json(
          { error: 'Nenhuma API key configurada para Google Gemini. Configure uma key no painel AI Providers ou defina GEMINI_API_KEY no servidor.' },
          { status: 400 }
        );
      }

      try {
        const result = await callGemini(resolvedKey, model as string | undefined, prompt, resolvedSystemInstruction);
        return NextResponse.json(result);
      } catch (err) {
        return NextResponse.json({ error: friendlyProviderErrorMessage(err, displayName) }, { status: 502 });
      }
    }

    // All other providers: plain fetch against each provider's REST API, no new npm dependency.
    const built = buildProviderRequest({
      provider: typedProvider,
      apiKey: apiKey as string | undefined,
      baseUrl: baseUrl as string | undefined,
      model: (model as string | undefined) || '',
      prompt,
      systemInstruction: resolvedSystemInstruction,
    });

    if ('error' in built) {
      aiDebug('[AI Generate] Build error:', built.error);
      return NextResponse.json({ error: built.error }, { status: 400 });
    }
    aiDebug('[AI Generate] Outgoing:', { url: built.url, hasAuth: !!built.headers.Authorization, model: (built.body as Record<string, unknown>).model });

    // SSRF guard: a user-supplied baseUrl (or Ollama's localhost default) is
    // resolved and refused if it lands on a private/loopback/link-local/
    // metadata address, unless explicitly allowlisted (AI_PRIVATE_HOST_ALLOWLIST).
    const userControlledTarget = !!(baseUrl as string | undefined)?.trim() || typedProvider === 'Ollama';
    if (userControlledTarget) {
      try {
        await assertSafeOutboundUrl(built.url);
      } catch (err) {
        if (err instanceof SsrfBlockedError) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        throw err;
      }
    }

    let res: Response;
    try {
      const dispatcher = getProxyDispatcher(built.url) ?? (userControlledTarget ? getGuardedAgent() : undefined);
      aiDebug('[AI Generate] Dispatch:', dispatcher instanceof ProxyAgent ? 'via proxy' : 'direct', built.url);
      res = await fetch(built.url, {
        method: 'POST',
        headers: built.headers,
        body: JSON.stringify(built.body),
        redirect: 'error',
        ...(dispatcher ? ({ dispatcher } as unknown as Record<string, unknown>) : {}),
      } as RequestInit & { dispatcher?: unknown });
      aiDebug('[AI Generate] Response:', res.status, res.statusText);
    } catch (networkErr) {
      console.warn(
        '[AI Generate] Network error:',
        networkErr instanceof Error ? networkErr.message : String(networkErr),
        (networkErr as Error & { cause?: { code?: string } })?.cause?.code ?? ''
      );
      return NextResponse.json(
        { error: friendlyProviderErrorMessage(networkErr, displayName) },
        { status: 502 }
      );
    }

    const rawText = await res.text().catch(() => '');
    let json: unknown = null;
    try {
      json = rawText ? JSON.parse(rawText) : null;
    } catch {
      json = null;
    }
    if (!res.ok && rawText && !json) aiDebug('[AI Generate] Non-JSON error body:', rawText.slice(0, 1000));

    if (!res.ok) {
      const message = extractProviderErrorMessage(json, res.status, res.statusText);
      return NextResponse.json({ error: `${displayName} rejected the request: ${message}` }, { status: res.status });
    }

    const text = extractResponseText(typedProvider, json);
    return NextResponse.json({ text: text || 'No response generated from model.', isSimulated: false });
  } catch (err) {
    // Full detail goes to the server log only — this catch-all covers any
    // uncaught exception (not just provider errors, which are already
    // sanitized via friendlyProviderErrorMessage above), so echoing
    // err.message straight to the client risked leaking internal exception
    // details (library internals, unexpected env-derived strings, etc.).
    console.error('Error in /api/ai/generate:', err);
    return NextResponse.json(
      { error: 'Unexpected server error. Check server logs for details.' },
      { status: 500 }
    );
  }
}
