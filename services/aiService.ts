import { AIProviderConfig } from '../types/factory';
import { aiProviderRepository } from './repositories/aiProvider.repository';
import { apiAuthHeaders } from '../lib/client-auth';

export interface AIGenerateResult {
  text: string;
  isSimulated: boolean;
}

export interface AITestConnectionResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

export class AIService {
  /** The provider the user has explicitly marked as default, if any. */
  private static getActiveProvider(): AIProviderConfig | undefined {
    return aiProviderRepository.getAIProviders().find((p) => p.isActiveDefault);
  }

  /**
   * Used by the AI Assistant drawer and the Prompt Studio playground. Routes to whichever
   * provider is marked as active/default. Phase 7 (zero simulado): nunca retorna análise
   * inventada — em falha (rede, key ausente/inválida, provider rejeitou) LANÇA Error com a
   * mensagem real para a UI exibir honestamente. Callers devem usar try/catch.
   */
  static async requestAnalysis(
    prompt: string,
    role = 'Software Architect',
    systemInstruction?: string
  ): Promise<AIGenerateResult> {
    const active = this.getActiveProvider();

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiAuthHeaders() },
      body: JSON.stringify({
        prompt,
        role,
        systemInstruction,
        provider: active?.provider || 'Google Gemini',
        apiKey: active?.apiKey,
        baseUrl: active?.baseUrl,
        model: active?.model,
        providerLabel: active?.name,
      }),
    });

    const data = await response.json().catch(() => ({}) as any);

    if (!response.ok || data.error) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return {
      text: data.text || 'No output generated.',
      isSimulated: false,
    };
  }

  /**
   * Fires one real minimal request through /api/ai/generate for the given provider config and
   * reports back success/failure honestly — unlike requestAnalysis, this never swallows an
   * error into a canned simulated response, since the whole point is to surface whether the
   * user's key/base URL actually works.
   */
  static async testConnection(provider: AIProviderConfig): Promise<AITestConnectionResult> {
    const start = performance.now();

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiAuthHeaders() },
        body: JSON.stringify({
          prompt: 'Reply with the single word: OK',
          role: 'Connection Test',
          provider: provider.provider,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: provider.model,
          providerLabel: provider.name,
        }),
      });

      const latencyMs = Math.round(performance.now() - start);
      const data = await response.json().catch(() => ({}) as any);

      if (!response.ok || data.error) {
        return {
          success: false,
          message: data.error || `HTTP ${response.status}`,
          latencyMs,
        };
      }

      if (data.isSimulated) {
        return {
          success: false,
          message: 'No real API key configured — the server returned a simulated response, not a live connection.',
          latencyMs,
        };
      }

      return {
        success: true,
        message: `Connected, responded in ${latencyMs}ms`,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message, latencyMs };
    }
  }
}
