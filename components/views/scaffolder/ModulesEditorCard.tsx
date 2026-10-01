'use client';

import {
  Box, ArrowRight, Sparkles, Trash2, Plus, GitFork, Link2, ShieldAlert, Package,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input, Select } from '../../ui/Input';
import { checkCausesCircularDependency } from './dependencyGraph';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 2: solution modules (.csproj / crates / packages), references and per-module packages. */
export function ModulesEditorCard({ wizard }: { wizard: ScaffolderState }) {
  const {
    projectName, editableBlueprint, isAddingModule, setIsAddingModule, newModuleName,
    setNewModuleName, newModuleType, setNewModuleType, newModuleDesc, setNewModuleDesc,
    newModuleReferences, setNewModuleReferences, editingRefProjId, setEditingRefProjId,
    editingPkgProjId, setEditingPkgProjId, newPkgName, setNewPkgName, newPkgVer, setNewPkgVer,
    activeTechStack, suggestedPackages, handleApplyAllSuggestedPackages, handleAddPackageToProj,
    handleRemovePackageFromProj, handleToggleReference, handleAddCustomModule, handleRemoveModule,
    handlePresetModuleCount,
  } = wizard;
  return (
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232838] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-100 text-xs">
                    Solution Project Modules Selection ({editableBlueprint.projects.length}{' '}
                    {activeTechStack.language === 'csharp' ? '.csproj' : activeTechStack.language === 'rust' ? 'crates' : 'modules'})
                  </h3>
                  <Badge tone="brand">{editableBlueprint.projects.length} Projects</Badge>
                </div>
                <p className="text-[11px] text-gray-400">
                  Select how many project modules / .csproj files to include or add custom ones tailored to your solution domain.
                </p>
              </div>

              {/* Preset Count Quick Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 mr-1 font-mono">Preset Count:</span>
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <Button
                    key={cnt}
                    size="sm"
                    variant={editableBlueprint.projects.length === cnt ? 'primary' : 'secondary'}
                    onClick={() => handlePresetModuleCount(cnt)}
                  >
                    {cnt} {cnt === 1 ? 'Proj' : 'Projs'}
                  </Button>
                ))}
                <Button size="sm" variant="primary" onClick={() => setIsAddingModule(!isAddingModule)} className="ml-2">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Module</span>
                </Button>
              </div>
            </div>

            {/* Inline Module Adder */}
            {isAddingModule && (
              <Card className="border-blue-500/40 space-y-3 my-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 text-xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add New Solution Module / .csproj
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingModule(false)}>
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Module Name</label>
                    <Input
                      type="text"
                      placeholder={activeTechStack.language === 'csharp' ? `${projectName}.Worker` : 'src/worker'}
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Layer Type</label>
                    <Select value={newModuleType} onChange={(e) => setNewModuleType(e.target.value as any)}>
                      <option value="Core">Core (Entities & Interfaces)</option>
                      <option value="Application">Application (Use Cases)</option>
                      <option value="Infrastructure">Infrastructure (DB/Services)</option>
                      <option value="API">API (HTTP Controllers)</option>
                      <option value="Worker">Worker (Background Queue)</option>
                      <option value="Tests">Tests (Unit & Integration)</option>
                      <option value="UI">UI (Frontend App)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                    <Input
                      type="text"
                      placeholder="e.g., Background scheduled job consumer"
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                    />
                  </div>
                </div>

                {editableBlueprint.projects.length > 0 && (
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Initial Module Dependencies (References)</label>
                    <div className="flex flex-wrap gap-2 bg-[#13151b] p-2 rounded border border-[#2b303d]">
                      {editableBlueprint.projects.map((p) => {
                        const isSelected = newModuleReferences.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setNewModuleReferences((prev) =>
                                  prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              className="rounded border-gray-600 bg-gray-800 text-blue-600"
                            />
                            <span>{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button size="sm" variant="primary" onClick={handleAddCustomModule}>
                    Confirm & Add Module
                  </Button>
                </div>
              </Card>
            )}

            {/* List of Configured Project Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {editableBlueprint.projects.map((proj) => (
                <Card key={proj.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                        <span>{proj.name}</span>
                      </div>
                      <Badge tone="neutral" className="normal-case">{proj.type} Layer</Badge>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveModule(proj.id)}
                      title="Remove module"
                      aria-label={`Remove module ${proj.name}`}
                      className="hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>

                  <p className="text-gray-400 text-[11px] leading-tight">{proj.description}</p>

                  {/* Outbound Project Reference Badges */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-gray-400" aria-hidden="true" />
                      <span>Outbound References:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proj.references.map((refId) => {
                        const refP = editableBlueprint.projects.find((p) => p.id === refId);
                        return (
                          <Badge key={refId} tone="brand" className="normal-case">
                            <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
                            {refP ? refP.name.split('.').pop() : refId}
                          </Badge>
                        );
                      })}
                      {proj.references.length === 0 && (
                        <span className="text-[10px] text-gray-500 italic">No dependencies (Standalone)</span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Edit Dependencies & Package Manager Toggles */}
                  <div className="pt-2 border-t border-[#232736] flex items-center justify-between text-[10px]">
                    <button
                      onClick={() => {
                        setEditingRefProjId(editingRefProjId === proj.id ? null : proj.id);
                        setEditingPkgProjId(null);
                      }}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono cursor-pointer"
                    >
                      <GitFork className="w-3 h-3" aria-hidden="true" />
                      <span>{editingRefProjId === proj.id ? 'Close Ref Editor' : `Refs (${proj.references.length})`}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPkgProjId(editingPkgProjId === proj.id ? null : proj.id);
                        setEditingRefProjId(null);
                      }}
                      className="flex items-center gap-1 text-gray-300 hover:text-white font-mono cursor-pointer"
                    >
                      <Package className="w-3 h-3" aria-hidden="true" />
                      <span>{editingPkgProjId === proj.id ? 'Close Packages' : `Packages (${(proj.packages || []).length})`}</span>
                    </button>

                    <span className="text-gray-400 font-mono">{activeTechStack.language === 'csharp' ? '.csproj' : 'Module'}</span>
                  </div>

                  {/* Inline Reference Editor Drawer */}
                  {editingRefProjId === proj.id && (
                    <Card flat className="border border-[#2b303d] space-y-1.5">
                      <div className="font-semibold text-gray-300 text-[11px] flex items-center justify-between border-b border-[#232838] pb-1">
                        <span>Toggle Outbound References:</span>
                        <span className="text-[10px] text-gray-500 font-mono">ProjectReference</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {editableBlueprint.projects
                          .filter((p) => p.id !== proj.id)
                          .map((otherProj) => {
                            const isRef = proj.references.includes(otherProj.id);
                            const causesCycle = !isRef && checkCausesCircularDependency(editableBlueprint.projects, proj.id, otherProj.id);

                            return (
                              <label
                                key={otherProj.id}
                                className={`flex items-center justify-between p-1.5 rounded text-[11px] font-mono transition-colors ${
                                  isRef ? 'bg-blue-900/30 border border-blue-500/40 text-blue-200' : 'bg-[#13151b] border border-[#2b303d] text-gray-400 hover:text-gray-200'
                                } ${causesCycle ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="truncate mr-2">{otherProj.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {causesCycle && (
                                    <span className="text-[9px] text-amber-400 font-sans flex items-center gap-0.5" title="Adding this reference causes a circular loop">
                                      <ShieldAlert className="w-3 h-3" aria-hidden="true" /> Cycle
                                    </span>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isRef}
                                    disabled={causesCycle}
                                    onChange={() => handleToggleReference(proj.id, otherProj.id)}
                                    className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </Card>
                  )}

                  {/* Inline Package Manager Drawer (Item 4) */}
                  {editingPkgProjId === proj.id && (
                    <Card flat className="border border-[#2b303d] space-y-2">
                      <div className="font-semibold text-gray-200 text-[11px] flex items-center justify-between border-b border-[#232838] pb-1">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" aria-hidden="true" /> Module Package Dependencies
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {activeTechStack.language === 'csharp' ? 'NuGet' : activeTechStack.language === 'rust' ? 'Crates' : 'npm'}
                        </span>
                      </div>

                      {/* Current packages list */}
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {(proj.packages || []).map((pkg) => (
                          <div key={pkg.name} className="flex items-center justify-between p-1 rounded bg-[#13151b] border border-[#2b303d] text-[10px] font-mono">
                            <span className="text-gray-200 truncate">{pkg.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-gray-400">v{pkg.version}</span>
                              <button
                                onClick={() => handleRemovePackageFromProj(proj.id, pkg.name)}
                                className="text-gray-500 hover:text-red-400 p-0.5 rounded cursor-pointer"
                                title="Remove package"
                                aria-label={`Remove package ${pkg.name}`}
                              >
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {(!proj.packages || proj.packages.length === 0) && (
                          <div className="text-[10px] text-gray-500 italic p-1">No custom packages added to this module yet.</div>
                        )}
                      </div>

                      {/* Package add form */}
                      <div className="pt-1 border-t border-[#232838] space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            placeholder={activeTechStack.language === 'csharp' ? 'e.g., MediatR' : 'e.g., express'}
                            value={newPkgName}
                            onChange={(e) => setNewPkgName(e.target.value)}
                            className="flex-1 font-mono"
                          />
                          <Input
                            type="text"
                            placeholder="1.0.0"
                            value={newPkgVer}
                            onChange={(e) => setNewPkgVer(e.target.value)}
                            className="w-16 font-mono"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleAddPackageToProj(proj.id, newPkgName, newPkgVer)}>
                            Add
                          </Button>
                        </div>

                        {/* Quick Presets & Operational Suggestions for Module */}
                        <div className="space-y-1 pt-1 border-t border-[#232838]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-400" aria-hidden="true" /> Sugeridos com Base no Funcionamento para {proj.name}:
                            </span>
                            <button onClick={handleApplyAllSuggestedPackages} className="text-[9px] text-blue-400 hover:underline font-mono">
                              Aplicar Todos
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {suggestedPackages
                              .filter((s) => s.targetModuleType === proj.type || !s.targetModuleType)
                              .map((sugPkg, sIdx) => {
                                const isAdded = (proj.packages || []).some((p) => p.name.toLowerCase() === sugPkg.packageName.toLowerCase());
                                return (
                                  <button
                                    key={sIdx}
                                    disabled={isAdded}
                                    onClick={() => handleAddPackageToProj(proj.id, sugPkg.packageName, sugPkg.version)}
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                                      isAdded
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 opacity-70 cursor-default'
                                        : 'bg-[#1c2029] hover:bg-[#242a36] text-gray-300 border-[#2e3340]'
                                    }`}
                                    title={sugPkg.reason}
                                  >
                                    <span>{isAdded ? '✓' : '+'}</span>
                                    <span>{sugPkg.packageName}</span>
                                    <span className="text-[8px] text-gray-400 font-sans">({sugPkg.category})</span>
                                  </button>
                                );
                              })}

                            {suggestedPackages.filter((s) => s.targetModuleType === proj.type).length === 0 && (
                              <span className="text-[9px] text-gray-500 italic">Nenhuma sugestão específica para a camada {proj.type}.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </Card>
              ))}
            </div>
          </Card>
  );
}
