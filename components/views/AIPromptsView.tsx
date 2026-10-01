'use client';

import React from 'react';
import { Bot, Sparkles, Code, Plus, Download, UserCog } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAIPromptsView } from './aiPrompts/useAIPromptsView';
import { PlaygroundTab } from './aiPrompts/PlaygroundTab';
import { PromptLibraryTab } from './aiPrompts/PromptLibraryTab';
import { ProvidersTab } from './aiPrompts/ProvidersTab';
import { AgentsTab } from './aiPrompts/AgentsTab';
import { AgentModal } from './aiPrompts/AgentModal';
import { PromptTemplateModal } from './aiPrompts/PromptTemplateModal';
import { ProviderModal } from './aiPrompts/ProviderModal';

export const AIPromptsView: React.FC = () => {
  const wizard = useAIPromptsView();
  const {
    activeTab, setActiveTab, providers, promptTemplates, customAgents, isAgentModalOpen,
    isPromptModalOpen, isProviderModalOpen, handleOpenAddPrompt, handleOpenAddProvider,
    handleOpenAddAgent, handleExportPromptConfig,
  } = wizard;

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
        <PlaygroundTab wizard={wizard} />
      )}

      {/* TAB 2: PROMPT LIBRARY & VERSIONING */}
      {activeTab === 'prompts' && (
        <PromptLibraryTab wizard={wizard} />
      )}

      {/* TAB 3: AI PROVIDERS MANAGEMENT */}
      {activeTab === 'providers' && (
        <ProvidersTab wizard={wizard} />
      )}

      {/* TAB 4: CUSTOM AI AGENTS */}
      {activeTab === 'agents' && (
        <AgentsTab wizard={wizard} />
      )}

      {/* CREATE / EDIT CUSTOM AI AGENT MODAL */}
      {isAgentModalOpen && (
        <AgentModal wizard={wizard} />
      )}

      {/* CREATE / EDIT PROMPT TEMPLATE MODAL */}
      {isPromptModalOpen && (
        <PromptTemplateModal wizard={wizard} />
      )}

      {/* REGISTER / EDIT AI PROVIDER MODAL */}
      {isProviderModalOpen && (
        <ProviderModal wizard={wizard} />
      )}
    </div>
  );
};
