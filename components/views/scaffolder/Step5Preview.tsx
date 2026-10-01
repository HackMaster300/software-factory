'use client';

import Editor from '@monaco-editor/react';
import {
  FolderGit2, CheckCircle2, ArrowLeft, Play, ShieldAlert, Download, Laptop,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 5: solution explorer, code inspector and generate actions. */
export function Step5Preview({ wizard }: { wizard: ScaffolderState }) {
  const {
    setStep, selectedFileNode, isGenerated, isDownloadingZip, setShowIdeExportModal,
    solutionPreview, treeValidation, handleDownloadSolutionZip, handleCompleteGeneration,
    renderTree, setActiveView,
  } = wizard;
  return (
        <div className="space-y-5">
          {/* Solution Estimates Bar — Phase 9: contagem real da árvore, não estimativa */}
          <Card className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Files (real count)</div>
              <div className="text-lg font-bold text-blue-400 font-mono">{solutionPreview.estimatedFileCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Directories (real)</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.estimatedFolderCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Project References</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.projectReferencesCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Package Dependencies</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.packageDependenciesCount}</div>
            </div>
          </Card>

          {/* Tree validation (Phase 9) — honesto, sem fake-pass */}
          {treeValidation.length > 0 ? (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>Tree validation: {treeValidation.length} issue(s) in generated code</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-gray-300">
                {treeValidation.map((m) => (
                  <li key={m.id} className="flex gap-2">
                    <Badge tone={m.type === 'error' ? 'danger' : 'warning'} className="shrink-0">{m.code}</Badge>
                    <span><span className="text-gray-100">{m.title}</span> — {m.description} {m.ruleId && <span className="font-mono text-[11px] text-gray-400">({m.ruleId})</span>}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Generated code: no rule 2-5 violations detected</span>
              </div>
            </Card>
          )}

          {/* Main Solution Explorer & Monaco Code Inspector */}
          <Card className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: Virtual Solution Tree */}
            <Card flat className="lg:col-span-4 border border-[#2b303d] space-y-2 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#232838] pb-2 text-xs font-semibold text-gray-200">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                  <span>{solutionPreview.solutionName}</span>
                </div>
              </div>

              {renderTree(solutionPreview.solutionTree)}
            </Card>

            {/* Right 8 Cols: Monaco Code Inspector */}
            <Card flat className="lg:col-span-8 border border-[#2b303d] overflow-hidden flex flex-col h-[500px] p-0">
              <div className="px-4 py-2 bg-[#13151b] border-b border-[#2b303d] flex items-center justify-between text-xs font-mono text-gray-300">
                <span>{selectedFileNode ? selectedFileNode.path : 'Select a file from the tree to inspect code'}</span>
                {selectedFileNode?.language && (
                  <Badge tone="brand" className="normal-case">{selectedFileNode.language}</Badge>
                )}
              </div>

              <div className="flex-1 bg-[#1e1e1e]">
                {selectedFileNode ? (
                  <Editor
                    height="100%"
                    language={selectedFileNode.language || 'plaintext'}
                    theme="vs-dark"
                    value={selectedFileNode.contentSnippet || '// Empty file'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                    Click any generated file to preview code.
                  </div>
                )}
              </div>
            </Card>
          </Card>

          {/* Action Bar */}
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>

            <div className="flex items-center gap-3">
              {/* IDE Export & Direct Launch Button */}
              <Button
                variant="secondary"
                onClick={() => setShowIdeExportModal(true)}
                title="Open in VS Code, Visual Studio, JetBrains Rider, or launch CLI"
              >
                <Laptop className="w-4 h-4" aria-hidden="true" />
                <span>IDE Export & Launch</span>
              </Button>

              {/* Download ZIP Button (Item 5 - Always Preserved) */}
              <Button
                variant="primary"
                onClick={handleDownloadSolutionZip}
                disabled={isDownloadingZip}
                title="Export complete solution as a compressed .ZIP file containing all projects, manifests, Dockerfile & .env"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{isDownloadingZip ? 'Zipping...' : 'Download Solution ZIP'}</span>
              </Button>

              {isGenerated ? (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Saved to LocalStorage!
                  </span>
                  <Button variant="primary" onClick={() => setActiveView('dashboard')}>
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={handleCompleteGeneration}>
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>Generate & Instantiate Solution</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
  );
}
