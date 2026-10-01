'use client';

import { X, UserCog } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/Input';
import type { AIPromptsState } from './useAIPromptsView';

/** Create / edit custom AI agent modal. */
export function AgentModal({ wizard }: { wizard: AIPromptsState }) {
  const {
    setIsAgentModalOpen, editingAgent, agentName, setAgentName, agentDescription,
    setAgentDescription, agentSystemPromptStyle, setAgentSystemPromptStyle, handleSaveAgent,
  } = wizard;
  return (
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
  );
}
