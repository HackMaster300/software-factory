'use client';

import { useState } from 'react';
import { AIProviderConfig, PromptTemplate, AIAgent } from '../../../types/factory';
import { StorageService, useAIAgents, useAIProviders } from '../../../services/storageService';
import { aiAgentRepository, aiProviderRepository } from '../../../services/repositories';
import { AIService } from '../../../services/aiService';
import { aiDebug } from '../../../lib/debug-log';
import { buildGroundedPrompt, getGroundedSystemInstruction } from '../../../lib/ai-grounding';
import { showToast } from '../../../hooks/use-toasts';
import { PROVIDER_PRESETS } from './constants';

/**
 * State, derived data and handlers of AIPromptsView, extracted verbatim
 * from the component body so the JSX can be split into cohesive sub-components.
 */
export function useAIPromptsView() {
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
  const [providerPersistKey, setProviderPersistKey] = useState<boolean>(true);
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
      const { StorageService } = await import('../../../services/storageService');
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
    setProviderPersistKey(true);
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
    setProviderPersistKey(true);
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
    setProviderPersistKey(pr.persistKey !== false);
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
      ...(providerPersistKey ? {} : { persistKey: false }),
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
    aiDebug('[TestConnection] Sending:', {
      id: provider.id,
      name: provider.name,
      provider: provider.provider,
      model: provider.model,
      baseUrl: provider.baseUrl || '(default)',
      hasKey: !!provider.apiKey,
    });
    setConnectionTests((prev) => ({ ...prev, [provider.id]: { status: 'testing', message: 'Testing…' } }));
    try {
      const result = await AIService.testConnection(provider);
      aiDebug('[TestConnection] Result:', result);
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

  return {
    activeTab, setActiveTab, providers, promptTemplates, setPromptTemplates, customAgents,
    connectionTests, setConnectionTests, isAgentModalOpen, setIsAgentModalOpen, editingAgent,
    setEditingAgent, agentName, setAgentName, agentDescription, setAgentDescription,
    agentSystemPromptStyle, setAgentSystemPromptStyle, selectedProviderId, setSelectedProviderId,
    systemInstruction, setSystemInstruction, userPromptText, setUserPromptText, variableValues,
    setVariableValues, temperature, setTemperature, maxTokens, setMaxTokens, topP, setTopP,
    executionOutput, setExecutionOutput, isExecuting, setIsExecuting, execMetrics, setExecMetrics,
    copiedOutput, setCopiedOutput, promptSearchQuery, setPromptSearchQuery, selectedCategory,
    setSelectedCategory, isPromptModalOpen, setIsPromptModalOpen, editingPrompt, setEditingPrompt,
    promptName, setPromptName, templateFormRole, setTemplateFormRole, promptCategory,
    setPromptCategory, promptBody, setPromptBody, promptVersion, setPromptVersion,
    isProviderModalOpen, setIsProviderModalOpen, editingProvider, setEditingProvider, providerName,
    setProviderName, providerVendor, setProviderVendor, providerModel, setProviderModel,
    providerCost, setProviderCost, providerLatency, setProviderLatency, providerApiKey,
    setProviderApiKey, providerPersistKey, setProviderPersistKey, providerBaseUrl,
    setProviderBaseUrl, recognizedVariables, getInterpolatedPrompt, handleRunPlayground,
    handleCopyOutput, handleInsertVariable, handleLoadTemplateToPlayground, handleOpenAddPrompt,
    handleOpenEditPrompt, handleSavePromptTemplate, handleDeletePromptTemplate,
    handleOpenAddProvider, handleApplyPreset, handleOpenEditProvider, handleSaveProvider,
    handleToggleProviderStatus, handleSetDefaultProvider, handleTestConnection, handleOpenAddAgent,
    handleOpenEditAgent, handleSaveAgent, handleDeleteAgent, handleExportPromptConfig,
    filteredTemplates,
  };
}

export type AIPromptsState = ReturnType<typeof useAIPromptsView>;
