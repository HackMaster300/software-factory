export const MODEL_ID_PLACEHOLDERS: Record<string, string> = {
  'Google Gemini': 'gemini-2.5-flash',
  OpenAI: 'gpt-4o-mini',
  OpenRouter: 'google/gemma-3-27b-it:free',
  Anthropic: 'claude-sonnet-5',
  DeepSeek: 'deepseek-chat',
  'Azure OpenAI': 'your-deployment-name',
  Ollama: 'llama3.1',
  'Together AI': 'Prism-ML/Ternary-Bonsai-27B',
};

/**
 * One-click starting points for the most common OpenAI-compatible gateways
 * beyond the built-in vendor list — everything here reuses the generic
 * 'OpenAI' vendor request path (chat/completions + Bearer auth) with a
 * custom baseUrl, since that's exactly what these gateways speak too. Only
 * the API key needs to be filled in after applying a preset.
 */
export const PROVIDER_PRESETS: Array<{
  label: string;
  name: string;
  vendor: 'OpenAI' | 'OpenRouter';
  baseUrl: string;
  model: string;
}> = [
  { label: 'OpenRouter (free Gemma)', name: 'OpenRouter Gemma 3 27B (free)', vendor: 'OpenRouter', baseUrl: '', model: 'google/gemma-3-27b-it:free' },
  { label: 'Mistral (Devstral)', name: 'Mistral Devstral (Agentic Coding)', vendor: 'OpenAI', baseUrl: 'https://api.mistral.ai/v1', model: 'devstral-2512' },
  { label: 'Mistral (Codestral)', name: 'Mistral Codestral (Pure Code)', vendor: 'OpenAI', baseUrl: 'https://api.mistral.ai/v1', model: 'codestral-2508' },
  { label: 'opencode.ai Zen (free)', name: 'opencode.ai Big Pickle (free)', vendor: 'OpenAI', baseUrl: 'https://opencode.ai/zen/v1', model: 'big-pickle' },
];
