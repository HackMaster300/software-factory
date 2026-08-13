'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { AIService } from '../services/aiService';
import { Blueprint } from '../types/factory';

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

  if (!isOpen) return null;

  const roles = [
    { name: 'Software Architect', icon: Cpu },
    { name: 'Security Engineer', icon: Shield },
    { name: 'Database Architect', icon: Database },
    { name: 'Cloud Architect', icon: Cloud },
    { name: 'Performance Engineer', icon: Zap },
    { name: 'DevOps Engineer', icon: Terminal },
  ];

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

    const contextPrompt = `
Context: Software Factory Blueprint '${blueprint.name}'
Architecture Style: ${blueprint.architectureStyle}
Active Feature IDs: ${blueprint.featureIds.join(', ')}

User Request: ${currentPrompt}
`;

    const response = await AIService.requestAnalysis(contextPrompt, selectedRole);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      role: selectedRole,
      text: response.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSimulated: response.isSimulated,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#14161c] border-l border-[#2e3342] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200 text-xs text-gray-200">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-[#2e3342] bg-[#1a1d26] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-600 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-xs">AI Architect Assistant</div>
            <div className="text-[10px] text-gray-400 font-mono">Server-Side Gemini 3.6 Flash Engine</div>
          </div>
        </div>

        <button onClick={onClose} aria-label="Close AI assistant" className="p-1 text-gray-400 hover:text-white rounded cursor-pointer">
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
                  {msg.isSimulated && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                      Offline Mode
                    </span>
                  )}
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
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
        <div className="flex items-center gap-2 bg-[#202430] border border-[#303648] rounded-lg p-1.5 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask ${selectedRole} for advice or review...`}
            className="flex-1 bg-transparent px-2 text-xs text-gray-100 focus:outline-none placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputPrompt.trim() || isLoading}
            aria-label="Send prompt"
            className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-gray-500 text-center font-mono">
          AI suggests architecture & trade-offs • Final decisions belong to the Architect
        </div>
      </div>
    </div>
  );
};
