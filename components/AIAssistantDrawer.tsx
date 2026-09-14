'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Shield,
  Database,
  Cloud,
  Cpu,
  Zap,
  Terminal,
  Loader2,
  Copy,
  Check,
  UserCog,
} from 'lucide-react';
import { AIService } from '../services/aiService';
import { getVendorDisplayLabel } from '../services/aiProviderRouting';
import { Blueprint } from '../types/factory';
import { useAIAgents, useAIProviders } from '../services/storageService';
import { buildGroundedPrompt, getGroundedSystemInstruction } from '../lib/ai-grounding';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { useFocusTrap } from '../hooks/use-focus-trap';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: Blueprint;
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  role?: string;
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  blueprint,
  initialPrompt,
}) => {
  const customAgents = useAIAgents();
  const providers = useAIProviders();
  const activeProvider = providers.find((p) => p.isActiveDefault);
  const [selectedRole, setSelectedRole] = useState('Software Architect');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      role: 'Software Architect',
      text: `Greetings! I am your AI Software Architect. I evaluate blueprints, review rule violations, analyze tradeoffs (Pros, Cons, Risks, Alternatives), and recommend cloud-native optimizations. AI never forces decisions; you remain the final decision maker.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen, onClose);

  if (!isOpen) return null;

  const roles = [
    { name: 'Software Architect', icon: Cpu },
    { name: 'Security Engineer', icon: Shield },
    { name: 'Database Architect', icon: Database },
    { name: 'Cloud Architect', icon: Cloud },
    { name: 'Performance Engineer', icon: Zap },
    { name: 'DevOps Engineer', icon: Terminal },
    ...customAgents.map((agent) => ({ name: agent.name, icon: UserCog })),
  ];

  const selectedCustomAgent = customAgents.find((a) => a.name === selectedRole);

  const handleSend = async () => {
    if (!inputPrompt.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: inputPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentPrompt = inputPrompt;
    setInputPrompt('');
    setIsLoading(true);

    // Phase 10 grounded: blueprint + ruleSet + validation (com ruleId) sempre enviados.
    const contextPrompt = buildGroundedPrompt(blueprint, currentPrompt);
    const systemInstruction = getGroundedSystemInstruction(selectedCustomAgent?.systemPromptStyle);

    try {
      const response = await AIService.requestAnalysis(
        contextPrompt,
        selectedRole,
        systemInstruction
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        role: selectedRole,
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSimulated: response.isSimulated,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          role: selectedRole,
          text: `Falha na análise de IA: ${message}\n\nConfigure uma API key válida em AI & Prompts → Providers e tente novamente.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSimulated: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="AI Architect Assistant"
      className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#14161c] border-l border-[#2e3342] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 text-xs text-gray-200"
    >
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-[#2e3342] bg-[#1a1d26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-xs">AI Architect Assistant</div>
            <div className="text-[10px] text-gray-400 font-mono">
              {activeProvider ? `${activeProvider.name} (${getVendorDisplayLabel(activeProvider)})` : 'No provider key configured — set one in AI & Prompts → Providers'}
            </div>
          </div>
        </div>

        <button onClick={onClose} aria-label="Close AI assistant" className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-400 hover:text-white rounded cursor-pointer">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Role Switcher Chips */}
      <div className="px-3 py-2 bg-[#181a22] border-b border-[#2a2f3d] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {roles.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.name;
          return (
            <button
              key={r.name}
              onClick={() => setSelectedRole(r.name)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-medium'
                  : 'bg-[#20232d] text-gray-400 border-[#2e3342] hover:text-gray-200'
              }`}
            >
              <Icon className="w-3 h-3 text-blue-400" />
              <span>{r.name}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-gray-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-blue-400" />
                  <span className="font-semibold text-blue-300">{msg.role}</span>
                  {msg.id.startsWith('ai-err-') && <Badge tone="warning">Offline — configure a key</Badge>}
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-lg max-w-[92%] leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-[#1e222d] border border-[#2e3342] text-gray-200 rounded-bl-none font-mono text-[11px]'
              }`}
            >
              {msg.text}

              {msg.sender === 'ai' && (
                <div className="mt-2 pt-2 border-t border-[#2d3242] flex items-center justify-end">
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy Response'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-blue-400 p-2 bg-[#1b1f2b] rounded-lg border border-[#2d3345] w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs font-mono">{selectedRole} is analyzing architecture...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-[#2e3342] bg-[#181a22]">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask ${selectedRole} for advice or review...`}
            className="flex-1"
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={!inputPrompt.trim() || isLoading}
            aria-label="Send prompt"
            className="min-w-11 min-h-11"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-1.5 text-[10px] text-gray-500 text-center font-mono">
          AI suggests architecture & trade-offs • Final decisions belong to the Architect
        </div>
      </div>
    </div>
  );
};
