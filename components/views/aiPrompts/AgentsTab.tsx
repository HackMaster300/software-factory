'use client';

import { Trash2, Edit3, UserCog } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import type { AIPromptsState } from './useAIPromptsView';

/** Tab 4: custom AI agents. */
export function AgentsTab({ wizard }: { wizard: AIPromptsState }) {
  const { customAgents, handleOpenAddAgent, handleOpenEditAgent, handleDeleteAgent } = wizard;
  return (
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
  );
}
