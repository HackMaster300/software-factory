'use client';

import React, { useState } from 'react';
import {
  Layers,
  Box,
  Server,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  FileCode2,
  Network,
  FolderGit2,
  Save,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Blueprint, ArchitectureStyle } from '../../types/factory';
import { StorageService } from '../../services/storageService';
import { TemplateService } from '../../services/templateService';
import { BlueprintService } from '../../services/blueprintService';

function checkCausesCircularDependency(
  projects: Array<{ id: string; references: string[] }>,
  fromProjId: string,
  toProjId: string
): boolean {
  if (fromProjId === toProjId) return true;
  const visited = new Set<string>();
  const queue = [toProjId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === fromProjId) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const proj = projects.find((p) => p.id === curr);
    if (proj && proj.references) {
      for (const refId of proj.references) {
        if (!visited.has(refId)) {
          queue.push(refId);
        }
      }
    }
  }

  return false;
}

interface BlueprintsViewProps {
  blueprint: Blueprint;
  setBlueprint: (bp: Blueprint) => void;
  openAIRefactor: (prompt: string) => void;
}

export const BlueprintsView: React.FC<BlueprintsViewProps> = ({
  blueprint,
  setBlueprint,
  openAIRefactor,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'tree' | 'properties'>('graph');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(blueprint.projects[0]?.id || null);

  const techStacks = StorageService.getTechStacks();
  const dbProfiles = StorageService.getDatabaseProfiles();
  const secProfiles = StorageService.getSecurityProfiles();
  const dockerProfiles = StorageService.getDockerProfiles();
  const cacheProfiles = StorageService.getCacheProfiles();
  const loggingProfiles = StorageService.getLoggingProfiles();

  const selectedProject = blueprint.projects.find((p) => p.id === selectedProjectId);
  const activeTechStack = techStacks.find((s) => s.id === blueprint.techStackId) || techStacks[0];

  const handleTechStackChange = (techStackId: string) => {
    const newProjects = BlueprintService.getProjectsForTechStackAndArchStyle(techStackId, blueprint.architectureStyle);
    setBlueprint({
      ...blueprint,
      techStackId,
      projects: newProjects,
    });
    if (newProjects.length > 0) {
      setSelectedProjectId(newProjects[0].id);
    }
  };

  const archStyles: Array<{ id: ArchitectureStyle; name: string; desc: string }> = [
    { id: 'CleanArchitecture', name: 'Clean Architecture', desc: 'Strict domain-centric layer isolation with Dependency Inversion Principle' },
    { id: 'Microservices', name: 'Microservices', desc: 'Independently deployable bounded contexts with gRPC / event bus messaging' },
    { id: 'ModularMonolith', name: 'Modular Monolith', desc: 'Single deployment artifact with strict internal module boundary constraints' },
    { id: 'Hexagonal', name: 'Hexagonal (Ports & Adapters)', desc: 'Core logic isolated from primary HTTP ports and secondary database adapters' },
    { id: 'CQRS', name: 'CQRS & Event Sourcing', desc: 'Explicit separation of read queries and write command pipelines' },
  ];

  const handleStyleChange = (style: ArchitectureStyle) => {
    const newProjects = BlueprintService.getProjectsForTechStackAndArchStyle(blueprint.techStackId, style);
    setBlueprint({
      ...blueprint,
      architectureStyle: style,
      projects: newProjects,
    });
    if (newProjects.length > 0) {
      setSelectedProjectId(newProjects[0].id);
    }
  };

  const handleProfileChange = (key: keyof typeof blueprint.profiles, value: string) => {
    setBlueprint({
      ...blueprint,
      profiles: {
        ...blueprint.profiles,
        [key]: value,
      },
    });
  };

  const handleToggleReference = (fromProjId: string, toProjId: string) => {
    const currentProj = blueprint.projects.find((p) => p.id === fromProjId);
    const isCurrentlyReferenced = currentProj?.references.includes(toProjId);

    if (!isCurrentlyReferenced) {
      const causesCycle = checkCausesCircularDependency(blueprint.projects, fromProjId, toProjId);
      if (causesCycle) {
        const targetName = blueprint.projects.find((p) => p.id === toProjId)?.name;
        alert(`Cannot reference "${targetName}" from "${currentProj?.name}": adding this reference creates a circular dependency loop.`);
        return;
      }
    }

    const updatedProjects = blueprint.projects.map((p) => {
      if (p.id === fromProjId) {
        const refs = new Set(p.references);
        if (refs.has(toProjId)) refs.delete(toProjId);
        else refs.add(toProjId);
        return { ...p, references: Array.from(refs) };
      }
      return p;
    });
    setBlueprint({ ...blueprint, projects: updatedProjects });
  };

  const handleSaveBlueprint = () => {
    TemplateService.updateTemplateBlueprint('tmpl-clean-dotnet9', blueprint);
    alert('Blueprint changes saved to LocalStorage persistence!');
  };

  const handlePresetModuleCount = (count: number) => {
    const baseProjects = BlueprintService.getProjectsForTechStackAndArchStyle(
      blueprint.techStackId,
      blueprint.architectureStyle
    );

    let trimmed = baseProjects.slice(0, count);
    if (count > baseProjects.length) {
      const isDotnet = activeTechStack.language === 'csharp';
      const prefix = 'Acme.PaymentEngine';
      if (count >= 4 && !trimmed.some((p) => p.type === 'Worker')) {
        trimmed.push({
          id: `proj-worker-${trimmed.length + 1}`,
          name: isDotnet ? `${prefix}.Worker` : `${prefix}/worker`,
          type: 'Worker',
          description: 'Background worker and scheduled queue processor module',
          references: [trimmed[0]?.id || 'core'],
        });
      }
      if (count >= 5 && !trimmed.some((p) => p.type === 'Tests')) {
        trimmed.push({
          id: `proj-tests-${trimmed.length + 1}`,
          name: isDotnet ? `${prefix}.UnitTests` : `${prefix}/tests`,
          type: 'Tests',
          description: 'Unit and integration testing suite module',
          references: [trimmed[0]?.id || 'core'],
        });
      }
    }

    setBlueprint({
      ...blueprint,
      projects: trimmed,
    });
    if (trimmed.length > 0) {
      setSelectedProjectId(trimmed[0].id);
    }
  };

  const handleRemoveModule = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (blueprint.projects.length <= 1) {
      alert('A solution blueprint must contain at least 1 project module.');
      return;
    }
    const updated = blueprint.projects.filter((p) => p.id !== projId);
    setBlueprint({
      ...blueprint,
      projects: updated,
    });
    if (selectedProjectId === projId) {
      setSelectedProjectId(updated[0]?.id || null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold text-[10px]">
              Blueprint Designer
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{blueprint.name}</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Solution Architecture & Layer Reference Graph</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              openAIRefactor(`Review the reference graph and profile choices for blueprint '${blueprint.name}' (${blueprint.architectureStyle}). Suggest clean architecture enhancements.`)
            }
            className="px-3 py-1.5 bg-[#202430] hover:bg-[#282d3d] text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" /> AI Architecture Audit
          </button>

          <button
            onClick={handleSaveBlueprint}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save Blueprint
          </button>
        </div>
      </div>

      {/* Technology Stack Selector */}
      <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-200 text-xs">Primary Target Technology Stack</div>
          <span className="text-[11px] text-gray-400 font-mono">Active Stack: <span className="text-blue-400 font-bold">{activeTechStack?.name}</span></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {techStacks.map((stack) => {
            const isSelected = blueprint.techStackId === stack.id;
            return (
              <button
                key={stack.id}
                onClick={() => handleTechStackChange(stack.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-[#13151b] border-[#262a36] text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{stack.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-gray-400 line-clamp-1">{stack.description}</div>
                <div className="text-[10px] font-mono text-gray-500 uppercase">{stack.language} • {stack.framework}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Architecture Style Selector */}
      <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
        <div className="font-semibold text-gray-200 text-xs">Architectural Pattern & Style</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {archStyles.map((style) => {
            const isSelected = blueprint.architectureStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-[#13151b] border-[#262a36] text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span>{style.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="text-[10px] text-gray-400 leading-snug">{style.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Split: Left Graph/Tree & Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Solution Graph & Tree */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2b303d] pb-2 gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  activeTab === 'graph' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Layer Reference Graph
              </button>
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  activeTab === 'tree' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Solution Explorer Tree
              </button>
            </div>

            <div className="flex items-center gap-1 font-mono text-[11px]">
              <span className="text-gray-400 mr-1">Modules ({blueprint.projects.length}):</span>
              {[1, 2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => handlePresetModuleCount(cnt)}
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                    blueprint.projects.length === cnt
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#1f2430] text-gray-400 hover:text-white'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'graph' ? (
            /* Visual Layer Graph Diagram */
            <div className="bg-[#15171d] border border-[#2b303d] rounded-xl p-5 min-h-[380px] flex flex-col justify-between space-y-4">
              <div className="text-[11px] text-gray-400 font-mono">
                Click any project layer to inspect references or edit configuration.
              </div>

              {/* Visual Node Layer Pipeline */}
              <div className="space-y-4">
                {blueprint.projects.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  const referencedProjectNames = proj.references
                    .map((refId) => blueprint.projects.find((p) => p.id === refId)?.name)
                    .filter(Boolean);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20'
                          : 'bg-[#1a1d26] border-[#2c3140] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg font-mono text-xs font-bold ${
                            proj.type === 'Core'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : proj.type === 'Application'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : proj.type === 'Infrastructure'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : proj.type === 'API'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {proj.type}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-100 text-sm">{proj.name}</div>
                          <div className="text-[11px] text-gray-400">{proj.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                        <span>References:</span>
                        {referencedProjectNames.length > 0 ? (
                          referencedProjectNames.map((r) => (
                            <span key={r} className="px-1.5 py-0.5 rounded bg-[#252a38] text-gray-300 border border-[#353b4e]">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">None (Pure Core)</span>
                        )}

                        <button
                          onClick={(e) => handleRemoveModule(proj.id, e)}
                          className="ml-2 text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 cursor-pointer"
                          title="Remove project module"
                          aria-label={`Remove module ${proj.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-[#111318] border border-[#232733] text-[10px] text-gray-400 flex items-center justify-between">
                <span>Domain Driven Design Boundary Rule: Core & Domain entities must have ZERO outbound infrastructure references.</span>
                <span className="text-emerald-400 font-mono">Enforced</span>
              </div>
            </div>
          ) : (
            /* Solution Tree View */
            <div className="bg-[#15171d] border border-[#2b303d] rounded-xl p-4 font-mono text-xs text-gray-300 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-[#292d3b] pb-2">
                <FolderGit2 className="w-4 h-4" />
                <span>Acme.PaymentEngine.sln</span>
              </div>

              <div className="pl-3 space-y-2">
                {blueprint.projects.map((proj) => (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-200">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold">{proj.name}.csproj</span>
                      <span className="text-[10px] text-gray-500">[{proj.type}]</span>
                    </div>

                    <div className="pl-5 space-y-1 text-gray-400 border-l border-[#282d3c] ml-1.5">
                      {proj.references.map((refId) => {
                        const refProj = blueprint.projects.find((p) => p.id === refId);
                        return (
                          <div key={refId} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <ArrowRight className="w-3 h-3 text-gray-500" />
                            <span>ProjectReference -&gt; {refProj?.name || refId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Layer Inspector & Profile Bindings */}
        <div className="space-y-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
            <div className="font-semibold text-gray-200 text-xs flex items-center justify-between">
              <span>Layer Reference Inspector</span>
              {selectedProject && <span className="font-mono text-blue-400">{selectedProject.name}</span>}
            </div>

            {selectedProject ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[#13151b] border border-[#272b38] space-y-1">
                  <div className="font-medium text-gray-200">{selectedProject.name}</div>
                  <div className="text-gray-400 text-[11px]">{selectedProject.description}</div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-gray-300">Allowed Project References:</div>
                  <div className="space-y-1">
                    {blueprint.projects
                      .filter((p) => p.id !== selectedProject.id)
                      .map((otherProj) => {
                        const isReferenced = selectedProject.references.includes(otherProj.id);
                        const causesCycle = !isReferenced && checkCausesCircularDependency(blueprint.projects, selectedProject.id, otherProj.id);

                        return (
                          <label
                            key={otherProj.id}
                            className={`flex items-center justify-between p-2 rounded border font-mono text-xs transition-colors ${
                              isReferenced
                                ? 'bg-blue-900/30 border-blue-500/40 text-blue-200'
                                : 'bg-[#1f222e] hover:bg-[#252a38] border-[#2e3444] text-gray-200'
                            } ${causesCycle ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className="truncate mr-2">{otherProj.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {causesCycle && (
                                <span className="text-[9px] text-amber-400 font-sans flex items-center gap-0.5" title="Adding this reference causes a circular loop">
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Cycle
                                </span>
                              )}
                              <input
                                type="checkbox"
                                checked={isReferenced}
                                disabled={causesCycle}
                                onChange={() => handleToggleReference(selectedProject.id, otherProj.id)}
                                className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs text-center py-4">Select a project layer to inspect references.</div>
            )}
          </div>

          {/* Profile Bindings */}
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
            <div className="font-semibold text-gray-200 text-xs">Infrastructure Profiles Bindings</div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Database Profile</label>
                <select
                  value={blueprint.profiles.databaseProfileId}
                  onChange={(e) => handleProfileChange('databaseProfileId', e.target.value)}
                  className="w-full bg-[#1e222d] border border-[#2e3444] text-gray-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                >
                  {dbProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Security Profile</label>
                <select
                  value={blueprint.profiles.securityProfileId}
                  onChange={(e) => handleProfileChange('securityProfileId', e.target.value)}
                  className="w-full bg-[#1e222d] border border-[#2e3444] text-gray-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                >
                  {secProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Docker Profile</label>
                <select
                  value={blueprint.profiles.dockerProfileId}
                  onChange={(e) => handleProfileChange('dockerProfileId', e.target.value)}
                  className="w-full bg-[#1e222d] border border-[#2e3444] text-gray-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                >
                  {dockerProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Cache Profile</label>
                <select
                  value={blueprint.profiles.cacheProfileId}
                  onChange={(e) => handleProfileChange('cacheProfileId', e.target.value)}
                  className="w-full bg-[#1e222d] border border-[#2e3444] text-gray-200 rounded p-1.5 focus:outline-none focus:border-blue-500"
                >
                  {cacheProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
