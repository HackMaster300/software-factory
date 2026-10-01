'use client';

import { Bot, X, AlertTriangle } from 'lucide-react';
import { DEFAULT_BASE_URLS } from '../../../services/aiProviderRouting';
import { Button } from '../../ui/Button';
import { Input, Select } from '../../ui/Input';
import { MODEL_ID_PLACEHOLDERS } from './constants';
import type { AIPromptsState } from './useAIPromptsView';

/** Register / edit AI provider modal (API key, base URL, session-only key option). */
export function ProviderModal({ wizard }: { wizard: AIPromptsState }) {
  const {
    setIsProviderModalOpen, editingProvider, providerName, setProviderName, providerVendor,
    setProviderVendor, providerModel, setProviderModel, providerCost, setProviderCost,
    providerLatency, setProviderLatency, providerApiKey, setProviderApiKey, providerPersistKey,
    setProviderPersistKey, providerBaseUrl, setProviderBaseUrl, handleSaveProvider,
  } = wizard;
  return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {editingProvider ? 'Configure AI Provider' : 'Register New AI Provider'}
              </span>
              <button
                onClick={() => setIsProviderModalOpen(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Provider Display Name</label>
                <Input
                  type="text"
                  placeholder="Google Gemini 2.5 Flash"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Vendor Family</label>
                  <Select value={providerVendor} onChange={(e) => setProviderVendor(e.target.value as any)}>
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="OpenAI">OpenAI-Compatible (OpenAI, Mistral, opencode.ai, etc.)</option>
                    <option value="OpenRouter">OpenRouter</option>
                    <option value="Together AI">Together AI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Azure OpenAI">Azure OpenAI</option>
                    <option value="Ollama">Ollama</option>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Model ID</label>
                  <Input
                    type="text"
                    placeholder={MODEL_ID_PLACEHOLDERS[providerVendor] || 'model-id'}
                    value={providerModel}
                    onChange={(e) => setProviderModel(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Cost Per 1k Tokens</label>
                  <Input
                    type="text"
                    placeholder="$0.00015"
                    value={providerCost}
                    onChange={(e) => setProviderCost(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Expected Latency SLA</label>
                  <Input
                    type="text"
                    placeholder="180ms"
                    value={providerLatency}
                    onChange={(e) => setProviderLatency(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              {providerVendor === 'Ollama' ? (
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Base URL (local Ollama server)</label>
                  <Input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={providerBaseUrl}
                    onChange={(e) => setProviderBaseUrl(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Ollama runs locally and needs no API key. Defaults to http://localhost:11434 if left blank.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">API Key</label>
                  <Input
                    type="password"
                    name="sf-ai-provider-secret"
                    placeholder={providerVendor === 'Azure OpenAI' ? 'Azure OpenAI API key' : 'sk-...'}
                    value={providerApiKey}
                    onChange={(e) => setProviderApiKey(e.target.value)}
                    // A plain `type="password"` input sitting right after a URL-like text
                    // input reads to Chrome/Edge's credential manager as a login form, and
                    // it will silently autofill an unrelated saved password (and the paired
                    // saved "site" into the Base URL field) — observed live during testing.
                    // autoComplete="off" alone does not reliably stop this; "new-password"
                    // plus a non-generic `name` is the documented working combination.
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="font-mono"
                  />
                  <label className="flex items-start gap-2 mt-2 text-[10.5px] text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={providerPersistKey}
                      onChange={(e) => setProviderPersistKey(e.target.checked)}
                      className="mt-0.5"
                      aria-describedby="sf-ai-provider-persist-hint"
                    />
                    <span>
                      Remember this key in this browser (localStorage)
                      <span id="sf-ai-provider-persist-hint" className="block text-gray-500">
                        Uncheck for a session-only key: kept in sessionStorage and cleared when the tab is closed.
                      </span>
                    </span>
                  </label>
                  {providerVendor === 'Azure OpenAI' && (
                    <div className="mt-2">
                      <label className="text-[10px] text-gray-400 block mb-1">
                        Base URL (deployment endpoint, required)
                      </label>
                      <Input
                        type="text"
                        name="sf-ai-provider-base-url"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        placeholder="https://{resource}.openai.azure.com/openai/deployments/{deployment}"
                        value={providerBaseUrl}
                        onChange={(e) => setProviderBaseUrl(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                  {(providerVendor === 'OpenAI' || providerVendor === 'DeepSeek' || providerVendor === 'OpenRouter' || providerVendor === 'Together AI') && (
                    <div className="mt-2">
                      <label className="text-[10px] text-gray-400 block mb-1">
                        Base URL (optional override — set this to point at OpenRouter, Mistral,
                        opencode.ai&apos;s Zen gateway, or any other OpenAI-compatible endpoint)
                      </label>
                      <Input
                        type="text"
                        name="sf-ai-provider-base-url"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        placeholder={DEFAULT_BASE_URLS[providerVendor] || 'https://your-endpoint.example.com/v1'}
                        value={providerBaseUrl}
                        onChange={(e) => setProviderBaseUrl(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[10.5px] leading-relaxed">
                  Stored in <span className="font-bold">this browser&apos;s localStorage only</span> and sent only to
                  this app&apos;s own <span className="font-mono">/api/ai/generate</span> route. Not a secure secret
                  store — do not use on shared or production machines.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsProviderModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveProvider}>Save Provider</Button>
            </div>
          </div>
        </div>
  );
}
