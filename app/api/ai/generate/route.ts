import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  AIProviderName,
  buildProviderRequest,
  extractProviderErrorMessage,
  extractResponseText,
  friendlyProviderErrorMessage,
} from '../../../../services/aiProviderRouting';

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
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

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
      return NextResponse.json({ error: built.error }, { status: 400 });
    }

    let res: Response;
    try {
      res = await fetch(built.url, {
        method: 'POST',
        headers: built.headers,
        body: JSON.stringify(built.body),
      });
    } catch (networkErr) {
      return NextResponse.json(
        { error: friendlyProviderErrorMessage(networkErr, displayName) },
        { status: 502 }
      );
    }

    const json = await res.json().catch(() => null);

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
