'use client';

import {
  Play, Loader2, Copy, Check, Sliders, Zap, ShieldCheck, Clock, DollarSign, Cpu, Layers,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input, Textarea, Select } from '../../ui/Input';
import type { AIPromptsState } from './useAIPromptsView';

/** Tab 1: interactive prompt playground. */
export function PlaygroundTab({ wizard }: { wizard: AIPromptsState }) {
  const {
    providers, selectedProviderId, setSelectedProviderId, systemInstruction, setSystemInstruction,
    userPromptText, setUserPromptText, variableValues, setVariableValues, temperature,
    setTemperature, maxTokens, setMaxTokens, topP, setTopP, executionOutput, isExecuting,
    execMetrics, copiedOutput, recognizedVariables, handleRunPlayground, handleCopyOutput,
    handleInsertVariable,
  } = wizard;
  return (
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
  );
}
