'use client';

import React, { useState } from 'react';
import {
  Box,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Layers,
  FileCode,
  Package,
  Bot,
  Info,
  ChevronRight,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { FeatureManifest, FeatureCategory, Blueprint } from '../../types/factory';
import { FeatureService } from '../../services/featureService';
import { StorageService } from '../../services/storageService';

interface FeatureManifestsViewProps {
  blueprint: Blueprint;
  setBlueprint: (bp: Blueprint) => void;
  openAIRefactor: (prompt: string) => void;
}

export const FeatureManifestsView: React.FC<FeatureManifestsViewProps> = ({
  blueprint,
  setBlueprint,
  openAIRefactor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('feat-docker');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const features = FeatureService.getAllFeatures();
  const categories: string[] = ['All', 'DevOps', 'Security', 'Infrastructure', 'Database', 'Observability', 'API', 'Architecture', 'Messaging'];

  const { activeFeatureIds, autoActivatedFeatures, disabledRecommendedFeatures } = FeatureService.resolveBlueprintFeatures(blueprint);

  const filteredFeatures = features.filter((f) => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const selectedFeature = features.find((f) => f.id === selectedFeatureId) || features[0];

  const handleToggleFeature = (featId: string) => {
    const isActive = activeFeatureIds.includes(featId);
    const updatedBp = FeatureService.toggleFeatureInBlueprint(blueprint, featId, !isActive);
    setBlueprint(updatedBp);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-semibold text-[10px]">
              Core Architecture Engine
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{activeFeatureIds.length} Active Modules</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Feature Manifest Library & Smart Dependency Resolver</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAIRefactor(`Analyze feature configuration for blueprint '${blueprint.name}'. Review active features: ${activeFeatureIds.join(', ')}.`)}
            className="px-3 py-1.5 bg-[#202430] hover:bg-[#282d3d] text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Feature Advisor
          </button>
        </div>
      </div>

      {/* Smart Dependency Alert Banner if user explicitly disabled recommended features */}
      {disabledRecommendedFeatures.length > 0 && (
        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Smart Dependency Notification: Explicitly Disabled Recommendations</span>
          </div>
          <div className="text-gray-300 text-[11px] leading-relaxed">
            The architect explicitly disabled features recommended by active parent modules. The Live Validation Engine guides but never forces:
            {disabledRecommendedFeatures.map((d) => (
              <span key={d.id} className="ml-1 font-mono font-medium text-amber-300">
                [{d.id}]
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left Feature List & Right Feature Inspector/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Feature Search & Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Category Pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b303d] rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features by name or tag (docker, jwt, redis...)"
                className="w-full bg-transparent text-gray-100 focus:outline-none text-xs placeholder-gray-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                      : 'bg-[#181a20] text-gray-400 border-[#2b303d] hover:text-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredFeatures.length === 0 && (
              <div className="text-center py-10 space-y-1 text-gray-500">
                <Search className="w-5 h-5 mx-auto text-gray-600" aria-hidden="true" />
                <p className="text-xs">
                  No features match{searchQuery ? ` "${searchQuery}"` : ''}
                  {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}.
                </p>
                {(searchQuery || selectedCategory !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {filteredFeatures.map((feat) => {
              const isActive = activeFeatureIds.includes(feat.id);
              const isSelected = selectedFeatureId === feat.id;
              const isAuto = autoActivatedFeatures.some((a) => a.id === feat.id);

              return (
                <div
                  key={feat.id}
                  onClick={() => setSelectedFeatureId(feat.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-[#181a20] border-[#2b303d] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-100 text-xs">{feat.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#252a38] text-gray-400 text-[9px] font-mono">
                          {feat.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{feat.description}</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeature(feat.id);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors shrink-0 ${
                        isActive
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#222734] text-gray-400 hover:text-gray-200 border border-[#303748]'
                      }`}
                    >
                      {isActive ? 'Active' : 'Enable'}
                    </button>
                  </div>

                  {/* Badges / Smart Dependency Tag */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <div className="flex items-center gap-1.5">
                      {isAuto && <span className="text-blue-400">⚡ Auto-Activated</span>}
                      {feat.dependencies.length > 0 && <span>Deps: {feat.dependencies.length}</span>}
                    </div>

                    <span>{feat.generatedPackages?.length || 0} Packages</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Feature Inspector & Manifest Detail View */}
        <div className="lg:col-span-7 bg-[#181a20] border border-[#2b303d] rounded-xl p-5 space-y-5">
          {selectedFeature ? (
            <>
              {/* Feature Title & Action Bar */}
              <div className="flex items-start justify-between pb-3 border-b border-[#2b303d]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono text-[10px] font-semibold">
                      {selectedFeature.category} Manifest
                    </span>
                    <span className="text-gray-500 font-mono text-[10px]">{selectedFeature.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-white">{selectedFeature.name}</h2>
                  <p className="text-xs text-gray-400 leading-relaxed">{selectedFeature.description}</p>
                </div>

                <button
                  onClick={() => handleToggleFeature(selectedFeature.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer shrink-0 ${
                    activeFeatureIds.includes(selectedFeature.id)
                      ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                  }`}
                >
                  {activeFeatureIds.includes(selectedFeature.id) ? 'Disable Feature' : 'Activate Feature'}
                </button>
              </div>

              {/* Dependencies & Conflicts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#13151b] border border-[#262a36] rounded-lg space-y-1.5">
                  <div className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recommended Smart Dependencies</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono text-gray-300">
                    {selectedFeature.recommendedDependencies?.length ? (
                      selectedFeature.recommendedDependencies.map((rec) => (
                        <span key={rec} className="px-2 py-0.5 rounded bg-[#202533] border border-[#2f3649]">
                          {rec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#13151b] border border-[#262a36] rounded-lg space-y-1.5">
                  <div className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conflicting Features</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono text-gray-300">
                    {selectedFeature.conflictingFeatures?.length ? (
                      selectedFeature.conflictingFeatures.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-800/40">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Impact Scores Bar */}
              <div className="p-3.5 bg-[#13151b] border border-[#262a36] rounded-lg space-y-2">
                <div className="font-semibold text-gray-200 text-xs">Architectural Impact Ratings</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-[10px]">
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Security</div>
                    <div className="text-emerald-400 font-bold text-xs">+{selectedFeature.impactScores?.security || 0}</div>
                  </div>
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Architecture</div>
                    <div className="text-blue-400 font-bold text-xs">+{selectedFeature.impactScores?.architecture || 0}</div>
                  </div>
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Performance</div>
                    <div className="text-amber-400 font-bold text-xs">+{selectedFeature.impactScores?.performance || 0}</div>
                  </div>
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Scalability</div>
                    <div className="text-purple-400 font-bold text-xs">+{selectedFeature.impactScores?.scalability || 0}</div>
                  </div>
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Maintainability</div>
                    <div className="text-cyan-400 font-bold text-xs">+{selectedFeature.impactScores?.maintainability || 0}</div>
                  </div>
                  <div className="bg-[#1d212c] p-1.5 rounded border border-[#2e3446]">
                    <div className="text-gray-400">Complexity</div>
                    <div className="text-rose-400 font-bold text-xs">+{selectedFeature.impactScores?.complexity || 0}</div>
                  </div>
                </div>
              </div>

              {/* Generated Files & Packages Preview */}
              <div className="space-y-3">
                <div className="font-semibold text-gray-200 text-xs">Generated Code Files & Package Manifests</div>

                {selectedFeature.generatedFiles?.map((gf, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#12141a] border border-[#282c38] font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-blue-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{gf.path}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase">{gf.language}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-sans">{gf.description}</p>
                    <pre className="p-2 bg-[#0a0c0e] rounded text-gray-300 text-[10px] overflow-x-auto leading-relaxed border border-[#1e222e]">
                      {gf.templateSnippet}
                    </pre>
                  </div>
                ))}

                {selectedFeature.generatedPackages?.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#12141a] border border-[#282c38] space-y-2">
                    <div className="font-semibold text-gray-300 text-xs flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-400" />
                      <span>Required Package Dependencies</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                      {selectedFeature.generatedPackages.map((pkg, idx) => (
                        <div key={idx} className="px-2.5 py-1 rounded bg-[#202534] border border-[#30374a] text-purple-300">
                          {pkg.name} <span className="text-gray-400">v{pkg.version}</span> [{pkg.packageManager}]
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Recommendations & Security Warnings */}
              <div className="space-y-2 pt-2 border-t border-[#2b303d]">
                <div className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>AI Architectural Recommendations</span>
                </div>

                <div className="space-y-1 text-gray-300 leading-relaxed text-[11px]">
                  {selectedFeature.aiRecommendations?.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-10">Select a feature manifest to inspect its details.</div>
          )}
        </div>
      </div>
    </div>
  );
};
