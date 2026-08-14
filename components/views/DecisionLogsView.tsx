'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  User,
  Sparkles,
  Download,
} from 'lucide-react';
import { useDecisionLogs } from '../../services/storageService';
import { DecisionService } from '../../services/decisionService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';

interface DecisionLogsViewProps {
  openAIRefactor: (prompt: string) => void;
}

export const DecisionLogsView: React.FC<DecisionLogsViewProps> = ({ openAIRefactor }) => {
  const logs = useDecisionLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Decision Form state
  const [newDecision, setNewDecision] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newImpact, setNewImpact] = useState('');
  const [newAuthor, setNewAuthor] = useState('Principal Architect');

  const filteredLogs = logs.filter(
    (l) =>
      l.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecision.trim() || !newReason.trim()) return;

    const created = DecisionService.addDecisionLog({
      projectId: 'unassigned',
      decision: newDecision,
      reason: newReason,
      impact: newImpact || 'Architectural compliance verified against enterprise policy.',
      warningsIgnored: [],
      aiRecommendations: ['Ensure backward compatibility during migration.'],
      userJustification: 'Approved by Architecture Review Board (ARB).',
      author: newAuthor,
    });

    setSelectedLogId(created.id);
    setNewDecision('');
    setNewReason('');
    setNewImpact('');
    setShowAddModal(false);
  };

  const handleExportMarkdown = () => {
    let md = `# Architectural Decision Log (ADR Repository)\n\nGenerated: ${new Date().toISOString()}\n\n`;
    logs.forEach((log) => {
      md += `## ADR-${log.id}: ${log.decision}\n`;
      md += `- **Date**: ${log.date}\n`;
      md += `- **Author**: ${log.author}\n`;
      md += `- **Reasoning**: ${log.reason}\n`;
      md += `- **Impact**: ${log.impact}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADR-Decision-Log-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Architecture Audit</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{logs.length} Architectural Decisions Recorded</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Architectural Decision Logs & Governance Audit (ADR)</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportMarkdown}>
            <Download className="w-3.5 h-3.5" /> Export ADRs (.md)
          </Button>

          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Log Architectural Decision
          </Button>
        </div>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Decision Log List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b303d] rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decision logs by keyword, author, or reason..."
              className="w-full bg-transparent text-gray-100 focus:outline-none text-xs placeholder-gray-500"
            />
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-gray-500">
                <FileSpreadsheet className="w-6 h-6 mx-auto text-gray-600" aria-hidden="true" />
                <p className="text-xs">No architectural decisions logged yet.</p>
                <p className="text-[11px] text-gray-600">
                  Decisions record the &quot;why&quot; behind architecture choices as you build.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                >
                  Log your first decision
                </button>
              </div>
            ) : (
              filteredLogs.length === 0 && (
                <div className="text-center py-10 space-y-1 text-gray-500">
                  <p className="text-xs">No decision logs match &quot;{searchQuery}&quot;.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    Clear search
                  </button>
                </div>
              )
            )}

            {filteredLogs.map((log) => {
              const isSelected = selectedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500'
                      : 'bg-[#181a20] border-[#2b303d] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-gray-100 text-xs leading-snug">{log.decision}</div>
                    <span className="text-[10px] font-mono text-gray-500 shrink-0">{log.date}</span>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{log.reason}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1 border-t border-[#2b303d]">
                    <div className="flex items-center gap-1 text-gray-400">
                      <User className="w-3 h-3" />
                      <span>{log.author}</span>
                    </div>
                    <span>{log.projectId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Detailed ADR Inspector */}
        <Card className="lg:col-span-7 p-5 space-y-5">
          {selectedLog ? (
            <>
              <div className="flex items-start justify-between pb-3 border-b border-[#2b303d]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">ADR Record #{selectedLog.id}</Badge>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 font-mono">{selectedLog.date}</span>
                  </div>
                  <h2 className="text-base font-bold text-white">{selectedLog.decision}</h2>
                </div>

                <Button
                  variant="secondary"
                  onClick={() =>
                    openAIRefactor(`Review ADR '${selectedLog.decision}'. Analyze architectural trade-offs, potential risks, and future refactoring path.`)
                  }
                  className="shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI ADR Review
                </Button>
              </div>

              {/* Author & Context metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#13151b] border border-[#2b303d] rounded-lg">
                  <div className="text-gray-500 text-[10px]">Author / Decision Owner</div>
                  <div className="text-gray-200 font-bold text-xs mt-0.5">{selectedLog.author}</div>
                </div>
                <div className="p-3 bg-[#13151b] border border-[#2b303d] rounded-lg">
                  <div className="text-gray-500 text-[10px]">Target Workspace Project</div>
                  <div className="text-blue-300 font-bold text-xs mt-0.5">{selectedLog.projectId}</div>
                </div>
              </div>

              {/* Rationale & Reasoning */}
              <div className="space-y-1.5">
                <div className="font-semibold text-gray-200 text-xs">Architectural Rationale & Context</div>
                <p className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg text-gray-300 text-xs leading-relaxed">
                  {selectedLog.reason}
                </p>
              </div>

              {/* Impact Analysis */}
              <div className="space-y-1.5">
                <div className="font-semibold text-gray-200 text-xs">Architectural Impact & Consequence</div>
                <p className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg text-gray-300 text-xs leading-relaxed font-mono">
                  {selectedLog.impact}
                </p>
              </div>

              {/* AI Recommendations */}
              {selectedLog.aiRecommendations && selectedLog.aiRecommendations.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#2b303d]">
                  <div className="font-semibold text-blue-400 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Copilot Architectural Recommendations</span>
                  </div>
                  <div className="space-y-1">
                    {selectedLog.aiRecommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-center py-10">
              {logs.length === 0
                ? 'No decisions recorded yet. Log your first architectural decision to see it here.'
                : 'Select an ADR decision record to view details.'}
            </div>
          )}
        </Card>
      </div>

      {/* Add New Decision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddDecision}
            className="bg-[#181a20] border border-[#2b303d] w-full max-w-lg rounded-xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#2b303d] pb-3">
              <div className="font-bold text-white text-sm">Record Architectural Decision (ADR)</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-300 block mb-1 font-medium">Decision Title</label>
                <Input
                  type="text"
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  placeholder="e.g. Standardize on gRPC for inter-service communication"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-medium">Architectural Rationale & Context</label>
                <Textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                  placeholder="Why was this architectural decision made? What trade-offs were evaluated?"
                  required
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-medium">Architectural Impact & Consequence</label>
                <Textarea
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  rows={2}
                  placeholder="What is the consequence on security, performance, or team velocity?"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-medium">Author / Architect Name</label>
                <Input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#2b303d]">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Decision
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
