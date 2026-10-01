'use client';

import { Loader2, Plus, Edit3, Check, X, KeyRound, Star, AlertTriangle, Wifi } from 'lucide-react';
import { getVendorDisplayLabel } from '../../../services/aiProviderRouting';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { PROVIDER_PRESETS } from './constants';
import type { AIPromptsState } from './useAIPromptsView';

/** Tab 3: AI providers management. */
export function ProvidersTab({ wizard }: { wizard: AIPromptsState }) {
  const {
    providers, connectionTests, handleApplyPreset, handleOpenEditProvider,
    handleToggleProviderStatus, handleSetDefaultProvider, handleTestConnection,
  } = wizard;
  return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs leading-relaxed">
              <span className="font-bold">API keys are stored only in this browser&apos;s localStorage</span> and are
              sent only to this app&apos;s own <span className="font-mono">/api/ai/generate</span> route, which
              forwards them to the provider you configure. This is <span className="font-bold">not a secure secret
              store</span> — do not use it for shared machines or production deployments. Anyone with access to this
              browser profile can read the stored keys.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
              Quick Add: Free / OpenAI-Compatible Gateways
            </div>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[#181a20] hover:bg-[#1f232d] text-gray-300 hover:text-white border border-[#2b303d] hover:border-blue-500/40 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-blue-400" aria-hidden="true" />
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">
              Prefills name, vendor, base URL, and model — you only need to paste an API key and save.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const test = connectionTests[provider.id];
              return (
                <Card
                  key={provider.id}
                  className={`space-y-3 flex flex-col justify-between ${provider.isActiveDefault ? 'border-emerald-500/40' : ''}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        {provider.name}
                        {provider.isActiveDefault && (
                          <Badge tone="success" title="Default provider">
                            <Star className="w-2.5 h-2.5 fill-current" aria-hidden="true" /> DEFAULT
                          </Badge>
                        )}
                      </span>
                      <button
                        onClick={() => handleToggleProviderStatus(provider.id)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer transition-colors border shrink-0 ${
                          provider.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-[#1c2029] text-gray-400 border-[#2e3340]'
                        }`}
                      >
                        {provider.status.toUpperCase()}
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 font-mono space-y-1 bg-[#13151b] p-2.5 rounded border border-[#2b303d]">
                      <div>
                        Vendor: <span className="text-gray-200">{getVendorDisplayLabel(provider)}</span>
                      </div>
                      <div>
                        Model: <span className="text-gray-200 font-bold">{provider.model}</span>
                      </div>
                      <div>
                        Cost / 1k Tokens: <span className="text-gray-200">{provider.costPer1k}</span>
                      </div>
                      <div>
                        Latency SLA: <span className="text-gray-200">{provider.latency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <KeyRound className="w-2.5 h-2.5" aria-hidden="true" />
                        {provider.provider === 'Ollama' ? (
                          <span>Base URL: <span className="text-gray-200">{provider.baseUrl || 'http://localhost:11434 (default)'}</span></span>
                        ) : (
                          <span>API Key: <span className="text-gray-200">{provider.apiKey ? (provider.persistKey === false ? '•••• session only' : '•••• configured') : provider.persistKey === false ? 'not set (session only)' : 'not set'}</span></span>
                        )}
                      </div>
                      {provider.provider !== 'Ollama' && provider.baseUrl && (
                        <div className="truncate" title={provider.baseUrl}>
                          Base URL: <span className="text-gray-200 font-mono">{provider.baseUrl}</span>
                        </div>
                      )}
                    </div>

                    {test && (
                      <div
                        role="status"
                        className={`text-[11px] font-mono px-2.5 py-1.5 rounded border flex items-center gap-1.5 ${
                          test.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : test.status === 'error'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-[#1c2029] text-gray-400 border-[#2e3340]'
                        }`}
                      >
                        {test.status === 'testing' && <Loader2 className="w-3 h-3 animate-spin shrink-0" aria-hidden="true" />}
                        {test.status === 'success' && <Check className="w-3 h-3 shrink-0" aria-hidden="true" />}
                        {test.status === 'error' && <X className="w-3 h-3 shrink-0" aria-hidden="true" />}
                        <span className="break-words">
                          {test.status === 'success' ? `✓ ${test.message}` : test.message}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#232838]">
                    {!provider.isActiveDefault && (
                      <Button size="sm" onClick={() => handleSetDefaultProvider(provider.id)}>
                        <Star className="w-3.5 h-3.5" aria-hidden="true" /> Set as Default
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleTestConnection(provider)} disabled={test?.status === 'testing'}>
                      <Wifi className="w-3.5 h-3.5" aria-hidden="true" /> Test Connection
                    </Button>
                    <Button size="sm" onClick={() => handleOpenEditProvider(provider)}>
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Configure
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
  );
}
