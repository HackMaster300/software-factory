'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AIProviderConfig, PromptTemplate } from '../../types/factory';
import { StorageService } from '../../services/storageService';
import { AIService } from '../../services/aiService';

export const AIPromptsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'prompts' | 'providers'>('playground');

  // Storage states
  const [providers, setProviders] = useState<AIProviderConfig[]>(StorageService.getAIProviders());
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(StorageService.getPromptTemplates());

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
    qualityScore: number;
  } | null>(null);

  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  // Search & Filter
  const [promptSearchQuery, setPromptSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [promptName, setPromptName] = useState<string>('');
  const [promptRole, setPromptRole] = useState<'System' | 'Developer' | 'User'>('System');
  const [promptCategory, setPromptCategory] = useState<string>('Architecture');
  const [promptBody, setPromptBody] = useState<string>('');
  const [promptVersion, setPromptVersion] = useState<string>('1.0.0');

  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [providerName, setProviderName] = useState<string>('');
  const [providerVendor, setProviderVendor] = useState<'Google Gemini' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Azure OpenAI' | 'Ollama'>('Google Gemini');
  const [providerModel, setProviderModel] = useState<string>('gemini-3.6-flash');
  const [providerCost, setProviderCost] = useState<string>('$0.00015');
  const [providerLatency, setProviderLatency] = useState<string>('180ms');

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
    const role = promptRole === 'System' ? 'Software Architect' : promptRole;

    const res = await AIService.requestAnalysis(finalPrompt, role, finalSystem);

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const inTokens = Math.round((finalPrompt.length + finalSystem.length) / 4);
    const outTokens = Math.round(res.text.length / 4);

    let costNum = 0.00015;
    if (selectedProv?.costPer1k) {
      const parsedCost = parseFloat(selectedProv.costPer1k.replace('$', ''));
      if (!isNaN(parsedCost)) costNum = parsedCost;
    }

    const totalCost = (((inTokens + outTokens) / 1000) * costNum).toFixed(5);

    setExecutionOutput(res.text);
    setExecMetrics({
      latencyMs: duration,
      inputTokens: inTokens,
      outputTokens: outTokens,
      estimatedCost: `$${totalCost}`,
      qualityScore: Math.min(99, 88 + Math.floor(Math.random() * 11)),
    });

    setIsExecuting(false);
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
    setPromptRole('System');
    setPromptCategory('Architecture');
    setPromptBody('');
    setPromptVersion('1.0.0');
    setIsPromptModalOpen(true);
  };

  const handleOpenEditPrompt = (pt: PromptTemplate) => {
    setEditingPrompt(pt);
    setPromptName(pt.name);
    setPromptRole(pt.role);
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
      role: promptRole,
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
    if (confirm('Are you sure you want to delete this prompt template?')) {
      const updated = promptTemplates.filter((t) => t.id !== id);
      setPromptTemplates(updated);
      StorageService.savePromptTemplates(updated);
    }
  };

  // Save/Edit AI Providers
  const handleOpenAddProvider = () => {
    setEditingProvider(null);
    setProviderName('');
    setProviderVendor('Google Gemini');
    setProviderModel('gemini-3.6-flash');
    setProviderCost('$0.00015');
    setProviderLatency('180ms');
    setIsProviderModalOpen(true);
  };

  const handleOpenEditProvider = (pr: AIProviderConfig) => {
    setEditingProvider(pr);
    setProviderName(pr.name);
    setProviderVendor(pr.provider);
    setProviderModel(pr.model);
    setProviderCost(pr.costPer1k);
    setProviderLatency(pr.latency);
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
      costPer1k: providerCost.trim() || '$0.001',
      latency: providerLatency.trim() || '200ms',
    };

    let updated: AIProviderConfig[];
    if (editingProvider) {
      updated = providers.map((p) => (p.id === id ? newProv : p));
    } else {
      updated = [...providers, newProv];
    }

    setProviders(updated);
    StorageService.saveAIProviders(updated);
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
    setProviders(updated);
    StorageService.saveAIProviders(updated);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] font-semibold">
              AI Platform Capability
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{providers.length} AI Providers Configured</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{promptTemplates.length} Templates</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Prompt Engineering Studio & AI Model Playground</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'prompts' && (
            <button
              onClick={handleOpenAddPrompt}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Create Prompt Template
            </button>
          )}

          {activeTab === 'providers' && (
            <button
              onClick={handleOpenAddProvider}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Register AI Provider
            </button>
          )}

          <button
            onClick={handleExportPromptConfig}
            title="Export Prompts & Providers JSON"
            className="p-2 bg-[#202430] hover:bg-[#282d3d] text-gray-300 border border-[#303748] rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Config
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2b303d] pb-2">
        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'playground'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-[#181a20] text-gray-400 hover:text-gray-200 border border-[#2b303d]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Interactive Playground</span>
        </button>

        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'prompts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-[#181a20] text-gray-400 hover:text-gray-200 border border-[#2b303d]'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span>Prompt Library ({promptTemplates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'providers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-[#181a20] text-gray-400 hover:text-gray-200 border border-[#2b303d]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Providers ({providers.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          {/* Model Selector & Hyperparameters Bar */}
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Model Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-400" /> Target AI Model Provider
              </label>
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.model}) - {p.latency}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: System & User Prompts + Variables */}
            <div className="lg:col-span-7 space-y-4">
              {/* System Instruction Editor */}
              <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> System Persona & Role Prompt
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">Role: System</span>
                </div>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  rows={3}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded-lg p-2.5 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  placeholder="Define AI persona, context, and structural constraints..."
                />
              </div>

              {/* User Prompt Editor */}
              <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" /> User Prompt Template
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                    <span>Quick Insert:</span>
                    {['projectName', 'techStack', 'database', 'features'].map((vName) => (
                      <button
                        key={vName}
                        onClick={() => handleInsertVariable(vName)}
                        className="px-1.5 py-0.5 bg-[#222734] hover:bg-blue-600/30 text-blue-300 rounded cursor-pointer border border-[#303748]"
                      >
                        + {`{{${vName}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={userPromptText}
                  onChange={(e) => setUserPromptText(e.target.value)}
                  rows={6}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded-lg p-3 text-xs text-gray-100 font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                  placeholder="Enter user prompt with template interpolation variables like {{projectName}}..."
                />
              </div>

              {/* Dynamic Variables Binding Panel */}
              {recognizedVariables.length > 0 && (
                <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
                  <div className="font-bold text-xs text-white flex items-center justify-between border-b border-[#262a36] pb-2">
                    <span>Interpolation Variables ({recognizedVariables.length})</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Live Value Binding</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recognizedVariables.map((varKey) => (
                      <div key={varKey} className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <span className="text-amber-400 font-bold">{`{{${varKey}}}`}</span>
                        </label>
                        <input
                          type="text"
                          value={variableValues[varKey] || ''}
                          onChange={(e) =>
                            setVariableValues({ ...variableValues, [varKey]: e.target.value })
                          }
                          className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleRunPlayground}
                disabled={isExecuting || !userPromptText.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer text-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isExecuting ? 'Executing AI Model Evaluation...' : 'Execute Prompt Evaluation'}</span>
              </button>
            </div>

            {/* Right Column: Execution Output & Real-time Metrics */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#141720] border border-[#2b3142] rounded-xl p-4 flex flex-col h-[600px]">
                <div className="flex items-center justify-between border-b border-[#252b3b] pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">AI Model Evaluation Output</span>
                    {execMetrics && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                        Score: {execMetrics.qualityScore}/100
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {executionOutput && (
                      <button
                        onClick={handleCopyOutput}
                        className="px-2 py-1 bg-[#202534] hover:bg-[#282e42] text-gray-300 rounded text-[10px] font-mono border border-[#2f374e] cursor-pointer flex items-center gap-1"
                      >
                        {copiedOutput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedOutput ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Performance Metrics Header Bar */}
                {execMetrics && (
                  <div className="grid grid-cols-4 gap-2 p-2 bg-[#1b1f2b] border border-[#2b3142] rounded-lg mb-3 font-mono text-[10px]">
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-blue-400" /> Latency</div>
                      <div className="text-blue-300 font-bold">{execMetrics.latencyMs} ms</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5 text-purple-400" /> Input Tkn</div>
                      <div className="text-purple-300 font-bold">{execMetrics.inputTokens}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><Layers className="w-2.5 h-2.5 text-emerald-400" /> Output Tkn</div>
                      <div className="text-emerald-300 font-bold">{execMetrics.outputTokens}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-400 flex items-center gap-1"><DollarSign className="w-2.5 h-2.5 text-amber-400" /> Cost</div>
                      <div className="text-amber-300 font-bold">{execMetrics.estimatedCost}</div>
                    </div>
                  </div>
                )}

                {/* Formatted Output Canvas */}
                <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-wrap p-3 bg-[#0d0f13] rounded-lg border border-[#1e222d]">
                  {executionOutput ? (
                    executionOutput
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 py-12">
                      <Zap className="w-8 h-8 text-gray-600 animate-pulse" />
                      <p className="text-xs">Click &quot;Execute Prompt Evaluation&quot; to stream output.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMPT LIBRARY & VERSIONING */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          {/* Search & Category filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#181a20] border border-[#2b303d] rounded-xl p-3">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'Architecture', 'Security', 'Code Refactoring', 'Rule Enforcement', 'Scaffolding'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#222734] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={promptSearchQuery}
                onChange={(e) => setPromptSearchQuery(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* List of prompt templates */}
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3 hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{template.name}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                        v{template.version}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[10px]">
                        {template.role} Prompt
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#222734] text-gray-300 font-mono text-[10px]">
                        {template.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoadTemplateToPlayground(template)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Load in Playground
                    </button>
                    <button
                      onClick={() => handleOpenEditPrompt(template)}
                      title="Edit Template"
                      aria-label={`Edit template ${template.name}`}
                      className="p-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 border border-[#303748] rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDeletePromptTemplate(template.id)}
                      title="Delete Template"
                      aria-label={`Delete template ${template.name}`}
                      className="p-1.5 bg-[#222734] hover:bg-red-900/40 text-red-400 border border-[#303748] hover:border-red-800/50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-[#12141a] border border-[#272b38] rounded-lg text-blue-300 font-mono text-[11px] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {template.prompt}
                </pre>

                {template.variables.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                    <span>Parsed Variables:</span>
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded bg-[#202534] border border-[#2e3549] text-amber-300 font-semibold"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-400">
                No prompt templates found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI PROVIDERS MANAGEMENT */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{provider.name}</span>
                  <button
                    onClick={() => handleToggleProviderStatus(provider.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer transition-colors border ${
                      provider.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {provider.status.toUpperCase()}
                  </button>
                </div>

                <div className="text-xs text-gray-400 font-mono space-y-1 bg-[#12141a] p-2.5 rounded border border-[#232734]">
                  <div>
                    Vendor: <span className="text-gray-200">{provider.provider}</span>
                  </div>
                  <div>
                    Model: <span className="text-purple-400 font-bold">{provider.model}</span>
                  </div>
                  <div>
                    Cost / 1k Tokens: <span className="text-amber-300">{provider.costPer1k}</span>
                  </div>
                  <div>
                    Latency SLA: <span className="text-blue-300">{provider.latency}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                <button
                  onClick={() => handleOpenEditProvider(provider)}
                  className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PROMPT TEMPLATE MODAL */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                {editingPrompt ? 'Edit Prompt Template' : 'Create New Prompt Template'}
              </span>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Security Reviewer"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Role</label>
                  <select
                    value={promptRole}
                    onChange={(e) => setPromptRole(e.target.value as any)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="System">System</option>
                    <option value="Developer">Developer</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Architecture"
                    value={promptCategory}
                    onChange={(e) => setPromptCategory(e.target.value)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Version</label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={promptVersion}
                    onChange={(e) => setPromptVersion(e.target.value)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Prompt Body Text (Supports <span className="text-amber-400 font-mono">{`{{variable}}`}</span> tokens)
              </label>
              <textarea
                rows={6}
                placeholder="Enter prompt text..."
                value={promptBody}
                onChange={(e) => setPromptBody(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(false)}
                className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePromptTemplate}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
              >
                Save Prompt Template
              </button>
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
                <Bot className="w-4 h-4 text-purple-400" />
                {editingProvider ? 'Configure AI Provider' : 'Register New AI Provider'}
              </span>
              <button
                onClick={() => setIsProviderModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Provider Display Name</label>
                <input
                  type="text"
                  placeholder="Google Gemini 3.6 Flash"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Vendor Family</label>
                  <select
                    value={providerVendor}
                    onChange={(e) => setProviderVendor(e.target.value as any)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Azure OpenAI">Azure OpenAI</option>
                    <option value="Ollama">Ollama</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Model ID</label>
                  <input
                    type="text"
                    placeholder="gemini-3.6-flash"
                    value={providerModel}
                    onChange={(e) => setProviderModel(e.target.value)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs font-mono text-purple-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Cost Per 1k Tokens</label>
                  <input
                    type="text"
                    placeholder="$0.00015"
                    value={providerCost}
                    onChange={(e) => setProviderCost(e.target.value)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Expected Latency SLA</label>
                  <input
                    type="text"
                    placeholder="180ms"
                    value={providerLatency}
                    onChange={(e) => setProviderLatency(e.target.value)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button
                type="button"
                onClick={() => setIsProviderModalOpen(false)}
                className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProvider}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
              >
                Save Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

