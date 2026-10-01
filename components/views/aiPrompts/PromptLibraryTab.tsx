'use client';

import { Trash2, Edit3, Search, ArrowUpRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { AIPromptsState } from './useAIPromptsView';

/** Tab 2: prompt library and versioning. */
export function PromptLibraryTab({ wizard }: { wizard: AIPromptsState }) {
  const {
    promptSearchQuery, setPromptSearchQuery, selectedCategory, setSelectedCategory,
    handleLoadTemplateToPlayground, handleOpenEditPrompt, handleDeletePromptTemplate,
    filteredTemplates,
  } = wizard;
  return (
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
  );
}
