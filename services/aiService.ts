import { AIProviderConfig } from '../types/factory';
import { aiProviderRepository } from './repositories/aiProvider.repository';

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
   * provider is marked as active/default; falls back to Gemini with no key (today's simulated-
   * response behavior) when nothing has been configured yet, so the drawer never goes dead for a
   * user who hasn't set up bring-your-own-key.
   */
  static async requestAnalysis(
    prompt: string,
    role = 'Software Architect',
    systemInstruction?: string
  ): Promise<AIGenerateResult> {
    const active = this.getActiveProvider();

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          role,
          systemInstruction,
          provider: active?.provider || 'Google Gemini',
          apiKey: active?.apiKey,
          baseUrl: active?.baseUrl,
          model: active?.model,
        }),
      });

      const data = await response.json().catch(() => ({}) as any);

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        text: data.text || 'No output generated.',
        isSimulated: !!data.isSimulated,
      };
    } catch (err) {
      console.error('AIService request error:', err);
      return {
        text: `### ${role} Fallback Analysis

**Evaluation:**
- The requested configuration matches standard enterprise design principles.
- Ensure all dependency boundary rules are enabled in the active RuleSet.
- Maintain environment parity across local Docker and production Cloud Run targets.`,
        isSimulated: true,
      };
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Reply with the single word: OK',
          role: 'Connection Test',
          provider: provider.provider,
          apiKey: provider.apiKey,
          baseUrl: provider.baseUrl,
          model: provider.model,
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
