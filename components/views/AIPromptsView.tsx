'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Code,
  Play,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Search,
  Sliders,
  Zap,
  ShieldCheck,
  Clock,
  DollarSign,
  Cpu,
  Layers,
  ArrowUpRight,
  X,
  UserCog,
  KeyRound,
  Star,
  AlertTriangle,
  Wifi,
} from 'lucide-react';
import { AIProviderConfig, PromptTemplate, AIAgent } from '../../types/factory';
import { StorageService, useAIAgents, useAIProviders } from '../../services/storageService';
import { aiAgentRepository, aiProviderRepository } from '../../services/repositories';
import { AIService } from '../../services/aiService';
import { DEFAULT_BASE_URLS, getVendorDisplayLabel } from '../../services/aiProviderRouting';
import { buildGroundedPrompt, getGroundedSystemInstruction } from '../../lib/ai-grounding';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import { showToast } from '../../hooks/use-toasts';

const MODEL_ID_PLACEHOLDERS: Record<string, string> = {
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
const PROVIDER_PRESETS: Array<{
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

export const AIPromptsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'prompts' | 'providers' | 'agents'>('playground');

  // Storage states
  const providers = useAIProviders();
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(StorageService.getPromptTemplates());
  const customAgents = useAIAgents();

  // Per-provider "Test Connection" inline results
  const [connectionTests, setConnectionTests] = useState<
    Record<string, { status: 'testing' | 'success' | 'error'; message: string }>
  >({});

  // Custom AI Agent modal state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentSystemPromptStyle, setAgentSystemPromptStyle] = useState('');

  // Playground state
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || 'ai-gemini');
  const [systemInstruction, setSystemInstruction] = useState<string>(
    'You are a Principal Software Architect enforcing Clean Architecture, SOLID principles, and enterprise security policies.'
  );
  const [userPromptText, setUserPromptText] = useState<string>(
    'Evaluate the architecture for {{projectName}} running on {{techStack}} with {{database}} database and {{features}} manifest.'
  );

  // Dynamic variable values in playground
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    projectName: 'PaymentGateway.Core',
    techStack: '.NET 9 Web API',
    database: 'PostgreSQL 16',
    features: 'Docker, JWT Auth, Redis Cache',
  });

  // Hyperparameters
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.95);

  // Playground execution output & metrics
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execMetrics, setExecMetrics] = useState<{
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: string;
  } | null>(null);

  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  // Search & Filter
  const [promptSearchQuery, setPromptSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [promptName, setPromptName] = useState<string>('');
  const [templateFormRole, setTemplateFormRole] = useState<'System' | 'Developer' | 'User'>('System');
  const [promptCategory, setPromptCategory] = useState<string>('Architecture');
  const [promptBody, setPromptBody] = useState<string>('');
  const [promptVersion, setPromptVersion] = useState<string>('1.0.0');

  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [providerName, setProviderName] = useState<string>('');
  const [providerVendor, setProviderVendor] = useState<'Google Gemini' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Azure OpenAI' | 'Ollama' | 'OpenRouter' | 'Together AI'>('Google Gemini');
  const [providerModel, setProviderModel] = useState<string>('gemini-2.5-flash');
  const [providerCost, setProviderCost] = useState<string>('$0.00015');
  const [providerLatency, setProviderLatency] = useState<string>('180ms');
  const [providerApiKey, setProviderApiKey] = useState<string>('');
  const [providerBaseUrl, setProviderBaseUrl] = useState<string>('');

  // Dynamically extract variables from prompt text
  const recognizedVariables = Array.from(
    new Set(
      Array.from(`${systemInstruction} ${userPromptText}`.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g), (m) => m[1])
    )
  );

  // Interpolates {{varName}} in text
  const getInterpolatedPrompt = (text: string): string => {
    let result = text;
    for (const key of recognizedVariables) {
      const val = variableValues[key] || `Sample ${key}`;
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, val);
    }
    return result;
  };

  const handleRunPlayground = async () => {
    if (!userPromptText.trim() || isExecuting) return;

    setIsExecuting(true);
    setExecutionOutput('');
    setExecMetrics(null);

    const startTime = performance.now();
    const finalPrompt = getInterpolatedPrompt(userPromptText);
    const finalSystem = getInterpolatedPrompt(systemInstruction);

    const selectedProv = providers.find((p) => p.id === selectedProviderId);
    // Fixed to match the "Role: System" label shown next to the System
    // Persona editor above — this used to read the Prompt Template modal's
    // `promptRole` field instead, so opening/changing that unrelated modal's
    // Role dropdown silently changed what role the next Playground
    // execution sent, even without saving the template.
    const role = 'Software Architect';
    // Phase 10 grounded playground: se houver um blueprint selecionado no storage,
    // ancora o prompt no padrão real (cite ruleId). Sem blueprint, usa o prompt cru.
    let groundedPrompt = finalPrompt;
    let groundedSystem = finalSystem;
    try {
      const { StorageService } = await import('../../services/storageService');
      const templates = StorageService.getTemplates();
      const blueprint = templates[0]?.blueprint;
      if (blueprint) {
        groundedPrompt = buildGroundedPrompt(blueprint, finalPrompt);
        groundedSystem = `${getGroundedSystemInstruction()}\n\n${finalSystem}`;
      }
    } catch {
      // storage indisponível em SSR/test — segue com prompt cru
    }

    try {
      const res = await AIService.requestAnalysis(groundedPrompt, role, groundedSystem);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const inTokens = Math.round((finalPrompt.length + finalSystem.length) / 4);
      const outTokens = Math.round(res.text.length / 4);

      // Phase 7: custo só é calculado se o provider tiver costPer1k numérico real.
      // Seed usa "n/a" (não medido) — nesse caso mostra honesto em vez de chutar $0.00015.
      let estimatedCost = 'n/a (custo não medido)';
      const rawCost = selectedProv?.costPer1k?.trim() ?? '';
      const parsedCost = parseFloat(rawCost.replace('$', ''));
      if (rawCost && rawCost !== 'n/a' && !isNaN(parsedCost)) {
        estimatedCost = `$${(((inTokens + outTokens) / 1000) * parsedCost).toFixed(5)}`;
      }

      setExecutionOutput(res.text);
      setExecMetrics({
        latencyMs: duration,
        inputTokens: inTokens,
        outputTokens: outTokens,
        estimatedCost,
      });
    } catch (err) {
      setExecutionOutput(`Execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyOutput = () => {
    if (!executionOutput) return;
    navigator.clipboard.writeText(executionOutput);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const handleInsertVariable = (varName: string) => {
    setUserPromptText((prev) => `${prev} {{${varName}}}`);
  };

  const handleLoadTemplateToPlayground = (template: PromptTemplate) => {
    if (template.role === 'System') {
      setSystemInstruction(template.prompt);
    } else {
      setUserPromptText(template.prompt);
    }
    setActiveTab('playground');
  };

  // Save/Edit Prompt Templates
  const handleOpenAddPrompt = () => {
    setEditingPrompt(null);
    setPromptName('');
    setTemplateFormRole('System');
    setPromptCategory('Architecture');
    setPromptBody('');
    setPromptVersion('1.0.0');
    setIsPromptModalOpen(true);
  };

  const handleOpenEditPrompt = (pt: PromptTemplate) => {
    setEditingPrompt(pt);
    setPromptName(pt.name);
    setTemplateFormRole(pt.role);
    setPromptCategory(pt.category);
    setPromptBody(pt.prompt);
    setPromptVersion(pt.version);
    setIsPromptModalOpen(true);
  };

  const handleSavePromptTemplate = () => {
    if (!promptName.trim() || !promptBody.trim()) {
      alert('Please fill in Template Name and Prompt text.');
      return;
    }

    // Extract variables
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const matches = Array.from(promptBody.matchAll(regex), (m) => m[1]);
    const variables = Array.from(new Set(matches));

    const id = editingPrompt ? editingPrompt.id : `prompt-${Date.now()}`;
    const newTemplate: PromptTemplate = {
      id,
      name: promptName.trim(),
      role: templateFormRole,
      category: promptCategory.trim() || 'Architecture',
      prompt: promptBody.trim(),
      variables,
      version: promptVersion.trim() || '1.0.0',
    };

    let updated: PromptTemplate[];
    if (editingPrompt) {
      updated = promptTemplates.map((t) => (t.id === id ? newTemplate : t));
    } else {
      updated = [newTemplate, ...promptTemplates];
    }

    setPromptTemplates(updated);
    StorageService.savePromptTemplates(updated);
    setIsPromptModalOpen(false);
  };

  const handleDeletePromptTemplate = (id: string) => {
    const toDelete = promptTemplates.find((t) => t.id === id);
    if (!toDelete) return;
    const updated = promptTemplates.filter((t) => t.id !== id);
    setPromptTemplates(updated);
    StorageService.savePromptTemplates(updated);
    showToast(`"${toDelete.name}" deleted.`, {
      label: 'Undo',
      onAction: () => {
        const restored = [...StorageService.getPromptTemplates(), toDelete];
        setPromptTemplates(restored);
        StorageService.savePromptTemplates(restored);
      },
    });
  };

  // Save/Edit AI Providers
  const handleOpenAddProvider = () => {
    setEditingProvider(null);
    setProviderName('');
    setProviderVendor('Google Gemini');
    setProviderModel('gemini-2.5-flash');
    setProviderCost('$0.00015');
    setProviderLatency('180ms');
    setProviderApiKey('');
    setProviderBaseUrl('');
    setIsProviderModalOpen(true);
  };

  const handleApplyPreset = (preset: (typeof PROVIDER_PRESETS)[number]) => {
    setEditingProvider(null);
    setProviderName(preset.name);
    setProviderVendor(preset.vendor);
    setProviderModel(preset.model);
    setProviderCost('$0.0000');
    setProviderLatency('250ms');
    setProviderApiKey('');
    setProviderBaseUrl(preset.baseUrl);
    setIsProviderModalOpen(true);
  };

  const handleOpenEditProvider = (pr: AIProviderConfig) => {
    setEditingProvider(pr);
    setProviderName(pr.name);
    setProviderVendor(pr.provider);
    setProviderModel(pr.model);
    setProviderCost(pr.costPer1k);
    setProviderLatency(pr.latency);
    setProviderApiKey(pr.apiKey || '');
    setProviderBaseUrl(pr.baseUrl || '');
    setIsProviderModalOpen(true);
  };

  const handleSaveProvider = () => {
    if (!providerName.trim() || !providerModel.trim()) {
      alert('Please fill in Provider Name and Model.');
      return;
    }

    const id = editingProvider ? editingProvider.id : `ai-prov-${Date.now()}`;
    const newProv: AIProviderConfig = {
      id,
      name: providerName.trim(),
      provider: providerVendor,
      model: providerModel.trim(),
      status: editingProvider ? editingProvider.status : 'active',
      costPer1k: providerCost.trim() || 'n/a',
      latency: providerLatency.trim() || 'n/a',
      apiKey: providerApiKey.trim() || undefined,
      baseUrl: providerBaseUrl.trim() || undefined,
      isActiveDefault: editingProvider ? editingProvider.isActiveDefault : false,
    };

    let updated: AIProviderConfig[];
    if (editingProvider) {
      updated = providers.map((p) => (p.id === id ? newProv : p));
    } else {
      updated = [...providers, newProv];
    }

    aiProviderRepository.saveAIProviders(updated);
    setIsProviderModalOpen(false);
  };

  const handleToggleProviderStatus = (id: string) => {
    const updated = providers.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: p.status === 'active' ? 'configured' : 'active',
        } as AIProviderConfig;
      }
      return p;
    });
    aiProviderRepository.saveAIProviders(updated);
  };

  const handleSetDefaultProvider = (id: string) => {
    const updated = providers.map((p) => ({ ...p, isActiveDefault: p.id === id }));
    aiProviderRepository.saveAIProviders(updated);
  };

  const handleTestConnection = async (provider: AIProviderConfig) => {
    setConnectionTests((prev) => ({ ...prev, [provider.id]: { status: 'testing', message: 'Testing…' } }));
    try {
      const result = await AIService.testConnection(provider);
      setConnectionTests((prev) => ({
        ...prev,
        [provider.id]: {
          status: result.success ? 'success' : 'error',
          message: result.success ? `Connected, responded in ${result.latencyMs}ms` : result.message,
        },
      }));
    } catch (err) {
      setConnectionTests((prev) => ({
        ...prev,
        [provider.id]: { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      }));
    }
  };

  // Save/Edit/Delete Custom AI Agents
  const handleOpenAddAgent = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentDescription('');
    setAgentSystemPromptStyle('');
    setIsAgentModalOpen(true);
  };

  const handleOpenEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setAgentName(agent.name);
    setAgentDescription(agent.description);
    setAgentSystemPromptStyle(agent.systemPromptStyle);
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = () => {
    if (!agentName.trim() || !agentSystemPromptStyle.trim()) {
      alert('Please fill in Agent Name and System Prompt Style.');
      return;
    }

    const id = editingAgent ? editingAgent.id : `agent-${Date.now()}`;
    const newAgent: AIAgent = {
      id,
      name: agentName.trim(),
      description: agentDescription.trim(),
      systemPromptStyle: agentSystemPromptStyle.trim(),
    };

    const updated = editingAgent
      ? customAgents.map((a) => (a.id === id ? newAgent : a))
      : [...customAgents, newAgent];

    aiAgentRepository.saveAIAgents(updated);
    setIsAgentModalOpen(false);
  };

  const handleDeleteAgent = (id: string) => {
    const toDelete = customAgents.find((a) => a.id === id);
    if (!toDelete) return;
    aiAgentRepository.saveAIAgents(customAgents.filter((a) => a.id !== id));
    showToast(`"${toDelete.name}" deleted.`, {
      label: 'Undo',
      onAction: () => aiAgentRepository.saveAIAgents([...StorageService.getAIAgents(), toDelete]),
    });
  };

  const handleExportPromptConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ providers, promptTemplates }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai-prompt-studio-config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredTemplates = promptTemplates.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
      t.prompt.toLowerCase().includes(promptSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Top Header */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">AI Platform Capability</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{providers.length} AI Providers Configured</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{promptTemplates.length} Templates</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Prompt Engineering Studio & AI Model Playground</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'prompts' && (
            <Button variant="primary" onClick={handleOpenAddPrompt}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Prompt Template
            </Button>
          )}

          {activeTab === 'providers' && (
            <Button variant="primary" onClick={handleOpenAddProvider}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Register AI Provider
            </Button>
          )}

          {activeTab === 'agents' && (
            <Button variant="primary" onClick={handleOpenAddAgent}>
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Custom Agent
            </Button>
          )}

          <Button variant="secondary" onClick={handleExportPromptConfig} title="Export Prompts & Providers JSON">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Export Config
          </Button>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2b303d] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'playground' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Interactive Playground</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'prompts' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Prompt Library ({promptTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'providers' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" aria-hidden="true" />
          <span>AI Providers ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'agents' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Custom AI Agents ({customAgents.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          {/* Model Selector & Hyperparameters Bar */}
          <Card className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Model Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-400" aria-hidden="true" /> Target AI Model Provider
              </label>
              <Select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value)} className="font-mono">
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.model}) - {p.latency}
                  </option>
                ))}
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Temperature</span>
                <span className="text-blue-300 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Max Response Tokens</span>
                <span className="text-blue-300 font-bold">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Top P */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Top-P Sampling</span>
                <span className="text-blue-300 font-bold">{topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: System & User Prompts + Variables */}
            <div className="lg:col-span-7 space-y-4">
              {/* System Instruction Editor */}
              <Card className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> System Persona & Role Prompt
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Role: System</span>
                </div>
                <Textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={3}
                  className="font-mono leading-relaxed"
                  placeholder="Define AI persona, context, and structural constraints..."
                />
              </Card>

              {/* User Prompt Editor */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> User Prompt Template
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                    <span>Quick Insert:</span>
                    {['projectName', 'techStack', 'database', 'features'].map((vName) => (
                      <button
                        key={vName}
                        onClick={() => handleInsertVariable(vName)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded cursor-pointer border border-[#2e3340]"
                      >
                        + {`{{${vName}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  value={userPromptText}
                  onChange={(e) => setUserPromptText(e.target.value)}
                  rows={6}
                  className="font-mono leading-relaxed"
                  placeholder="Enter user prompt with template interpolation variables like {{projectName}}..."
                />
              </Card>

              {/* Dynamic Variables Binding Panel */}
              {recognizedVariables.length > 0 && (
                <Card className="space-y-3">
                  <div className="font-bold text-xs text-white flex items-center justify-between border-b border-[#232838] pb-2">
                    <span>Interpolation Variables ({recognizedVariables.length})</span>
                    <span className="text-[10px] text-gray-400 font-mono">Live Value Binding</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recognizedVariables.map((varKey) => (
                      <div key={varKey} className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <span className="text-gray-200 font-bold">{`{{${varKey}}}`}</span>
                        </label>
                        <Input
                          type="text"
                          value={variableValues[varKey] || ''}
                          onChange={(e) => setVariableValues({ ...variableValues, [varKey]: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Action Button */}
              <Button
                variant="primary"
                onClick={handleRunPlayground}
                disabled={isExecuting || !userPromptText.trim()}
                className="w-full justify-center py-3"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
                <span>{isExecuting ? 'Executing AI Model Evaluation...' : 'Execute Prompt Evaluation'}</span>
              </Button>
            </div>

            {/* Right Column: Execution Output & Real-time Metrics */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="flex flex-col h-[600px]">
                <div className="flex items-center justify-between border-b border-[#232838] pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">AI Model Evaluation Output</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {executionOutput && (
                      <Button size="sm" onClick={handleCopyOutput}>
                        {copiedOutput ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                        <span>{copiedOutput ? 'Copied' : 'Copy'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Performance Metrics Header Bar */}
                {execMetrics && (
                  <Card flat className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#2b303d] mb-3 font-mono text-[10px]">
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" aria-hidden="true" /> Latency</div>
                      <div className="text-gray-100 font-bold">{execMetrics.latencyMs} ms</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5" aria-hidden="true" /> Input Tkn</div>
                      <div className="text-gray-100 font-bold">{execMetrics.inputTokens}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5" aria-hidden="true" /> Output Tkn</div>
                      <div className="text-gray-100 font-bold">{execMetrics.outputTokens}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" aria-hidden="true" /> Cost</div>
                      <div className="text-gray-100 font-bold">{execMetrics.estimatedCost}</div>
                    </div>
                  </Card>
                )}

                {/* Formatted Output Canvas */}
                <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap p-3 bg-[#13151b] rounded-lg border border-[#2b303d]">
                  {executionOutput ? (
                    executionOutput
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 py-12">
                      <Zap className="w-8 h-8 text-gray-600" aria-hidden="true" />
                      <p className="text-xs">Click &quot;Execute Prompt Evaluation&quot; to stream output.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMPT LIBRARY & VERSIONING */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          {/* Search & Category filter */}
          <Card className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'Architecture', 'Security', 'Code Refactoring', 'Rule Enforcement', 'Scaffolding'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-[#1c2029] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={promptSearchQuery}
                onChange={(e) => setPromptSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </Card>

          {/* List of prompt templates */}
          <div className="space-y-3">
            {filteredTemplates.length === 0 && (
              <Card className="text-center py-10 space-y-1 text-gray-500">
                <p className="text-xs">
                  No prompt templates match{promptSearchQuery ? ` "${promptSearchQuery}"` : ''}
                  {selectedCategory !== 'all' ? ` in this category` : ''}.
                </p>
                {(promptSearchQuery || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setPromptSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </Card>
            )}

            {filteredTemplates.map((template) => (
              <Card key={template.id} interactive className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{template.name}</span>
                      <Badge tone="brand" className="normal-case">v{template.version}</Badge>
                      <Badge tone="neutral" className="normal-case">{template.role} Prompt</Badge>
                      <Badge tone="neutral" className="normal-case">{template.category}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="primary" onClick={() => handleLoadTemplateToPlayground(template)}>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /> Load in Playground
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleOpenEditPrompt(template)}
                      title="Edit Template"
                      aria-label={`Edit template ${template.name}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleDeletePromptTemplate(template.id)}
                      title="Delete Template"
                      aria-label={`Delete template ${template.name}`}
                      className="hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <pre className="p-3 bg-[#13151b] border border-[#2b303d] rounded-lg text-gray-200 font-mono text-[11px] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {template.prompt}
                </pre>

                {template.variables.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 flex-wrap">
                    <span>Parsed Variables:</span>
                    {template.variables.map((v) => (
                      <Badge key={v} tone="neutral" className="normal-case">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI PROVIDERS MANAGEMENT */}
      {activeTab === 'providers' && (
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
                          <span>API Key: <span className="text-gray-200">{provider.apiKey ? '•••• configured' : 'not set'}</span></span>
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
      )}

      {/* TAB 4: CUSTOM AI AGENTS */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {customAgents.length === 0 ? (
            <Card className="text-center py-12 space-y-2">
              <UserCog className="w-6 h-6 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs text-gray-400">
                No custom AI agents yet. Define a persona beyond the built-in roles (Software
                Architect, Security Engineer, etc.) to use in the AI Assistant drawer.
              </p>
              <button
                onClick={handleOpenAddAgent}
                className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
              >
                Create your first custom agent
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customAgents.map((agent) => (
                <Card key={agent.id} interactive className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-blue-400" aria-hidden="true" />
                      <span className="font-bold text-sm text-white">{agent.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{agent.description}</p>
                    <pre className="p-2.5 bg-[#13151b] border border-[#2b303d] rounded text-[11px] text-gray-300 font-mono whitespace-pre-wrap">
                      {agent.systemPromptStyle}
                    </pre>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
                    <Button size="sm" onClick={() => handleOpenEditAgent(agent)} aria-label={`Edit agent ${agent.name}`}>
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => handleDeleteAgent(agent.id)} aria-label={`Delete agent ${agent.name}`} className="hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT CUSTOM AI AGENT MODAL */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <UserCog className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {editingAgent ? 'Edit Custom AI Agent' : 'Create Custom AI Agent'}
              </span>
              <button
                onClick={() => setIsAgentModalOpen(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Agent Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Compliance Reviewer"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Short Description</label>
                <Input
                  type="text"
                  placeholder="What this persona focuses on"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">System Prompt Style</label>
                <Textarea
                  rows={4}
                  placeholder="You are a meticulous Compliance Reviewer who flags regulatory risk..."
                  value={agentSystemPromptStyle}
                  onChange={(e) => setAgentSystemPromptStyle(e.target.value)}
                  className="font-mono leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsAgentModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveAgent}>Save Agent</Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROMPT TEMPLATE MODAL */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {editingPrompt ? 'Edit Prompt Template' : 'Create New Prompt Template'}
              </span>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Template Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Architecture Security Reviewer"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Role</label>
                  <Select value={templateFormRole} onChange={(e) => setTemplateFormRole(e.target.value as any)}>
                    <option value="System">System</option>
                    <option value="Developer">Developer</option>
                    <option value="User">User</option>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                  <Input
                    type="text"
                    placeholder="Architecture"
                    value={promptCategory}
                    onChange={(e) => setPromptCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Version</label>
                  <Input
                    type="text"
                    placeholder="1.0.0"
                    value={promptVersion}
                    onChange={(e) => setPromptVersion(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Prompt Body Text (Supports <span className="text-gray-300 font-mono">{`{{variable}}`}</span> tokens)
              </label>
              <Textarea
                rows={6}
                placeholder="Enter prompt text..."
                value={promptBody}
                onChange={(e) => setPromptBody(e.target.value)}
                className="font-mono leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsPromptModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSavePromptTemplate}>Save Prompt Template</Button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / EDIT AI PROVIDER MODAL */}
      {isProviderModalOpen && (
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
      )}
    </div>
  );
};
