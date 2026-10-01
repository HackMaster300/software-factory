'use client';

import { Code, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input, Textarea, Select } from '../../ui/Input';
import type { AIPromptsState } from './useAIPromptsView';

/** Create / edit prompt template modal. */
export function PromptTemplateModal({ wizard }: { wizard: AIPromptsState }) {
  const {
    setIsPromptModalOpen, editingPrompt, promptName, setPromptName, templateFormRole,
    setTemplateFormRole, promptCategory, setPromptCategory, promptBody, setPromptBody,
    promptVersion, setPromptVersion, handleSavePromptTemplate,
  } = wizard;
  return (
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
  );
}
