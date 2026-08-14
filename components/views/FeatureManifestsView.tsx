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
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { FeatureManifest, FeatureCategory, FeatureQuestion, GeneratedFile, Blueprint } from '../../types/factory';
import { FeatureService } from '../../services/featureService';
import { useFeatureManifests } from '../../services/storageService';
import { featureManifestRepository } from '../../services/repositories';

interface FeatureManifestsViewProps {
  blueprint: Blueprint;
  setBlueprint: (bp: Blueprint) => void;
  openAIRefactor: (prompt: string) => void;
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  'Infrastructure',
  'Database',
  'Security',
  'Observability',
  'API',
  'Messaging',
  'DevOps',
  'Testing',
  'Architecture',
];

const emptyImpactScores = {
  security: 0,
  architecture: 0,
  performance: 0,
  scalability: 0,
  maintainability: 0,
  complexity: 0,
};

function blankFeatureForm(): FeatureManifest {
  return {
    id: '',
    name: '',
    description: '',
    category: 'Infrastructure',
    tags: [],
    dependencies: [],
    optionalDependencies: [],
    recommendedDependencies: [],
    conflictingFeatures: [],
    questions: [],
    configuration: {},
    generatedFiles: [],
    generatedPackages: [],
    generatedProjects: [],
    documentation: '',
    aiRecommendations: [],
    securityWarnings: [],
    architectureImpact: '',
    performanceImpact: '',
    maintainabilityImpact: '',
    bestPractices: [],
    impactScores: { ...emptyImpactScores },
  };
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

  const features = useFeatureManifests();
  const categories: string[] = ['All', 'DevOps', 'Security', 'Infrastructure', 'Database', 'Observability', 'API', 'Architecture', 'Messaging'];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [form, setForm] = useState<FeatureManifest>(blankFeatureForm());

  const otherFeatures = features.filter((f) => f.id !== editingFeatureId);

  const resetForm = () => {
    setEditingFeatureId(null);
    setForm(blankFeatureForm());
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditFeature = (feat: FeatureManifest) => {
    setEditingFeatureId(feat.id);
    setForm({ ...feat, tags: [...feat.tags] });
    setIsModalOpen(true);
  };

  const handleDeleteFeature = (feat: FeatureManifest) => {
    if (!confirm(`Delete feature manifest "${feat.name}"? This cannot be undone.`)) return;
    const updated = features.filter((f) => f.id !== feat.id);
    featureManifestRepository.saveFeatureManifests(updated);
    if (selectedFeatureId === feat.id) {
      setSelectedFeatureId(updated[0]?.id || '');
    }
  };

  const toggleListValue = (key: keyof FeatureManifest, value: string) => {
    setForm((prev) => {
      const list = (prev[key] as string[]) || [];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const handleAddQuestion = () => {
    const q: FeatureQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'boolean',
      defaultValue: false,
      impactDescription: '',
    };
    setForm((prev) => ({ ...prev, questions: [...prev.questions, q] }));
  };

  const handleUpdateQuestion = (idx: number, patch: Partial<FeatureQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  };

  const handleRemoveQuestion = (idx: number) => {
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const handleAddGeneratedFile = () => {
    const gf: GeneratedFile = { path: '', language: 'plaintext', templateSnippet: '', description: '' };
    setForm((prev) => ({ ...prev, generatedFiles: [...prev.generatedFiles, gf] }));
  };

  const handleUpdateGeneratedFile = (idx: number, patch: Partial<GeneratedFile>) => {
    setForm((prev) => ({
      ...prev,
      generatedFiles: prev.generatedFiles.map((gf, i) => (i === idx ? { ...gf, ...patch } : gf)),
    }));
  };

  const handleRemoveGeneratedFile = (idx: number) => {
    setForm((prev) => ({ ...prev, generatedFiles: prev.generatedFiles.filter((_, i) => i !== idx) }));
  };

  const handleSaveFeature = () => {
    if (!form.name.trim()) {
      alert('Please provide a feature name.');
      return;
    }
    const id = editingFeatureId || `feat-custom-${Date.now()}`;
    const saved: FeatureManifest = { ...form, id };
    FeatureService.saveFeature(saved);
    setSelectedFeatureId(id);
    setIsModalOpen(false);
    resetForm();
  };

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
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Feature Manifest
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditFeature(selectedFeature)}
                    aria-label={`Edit feature manifest ${selectedFeature.name}`}
                    className="p-2 bg-[#222734] hover:bg-[#2b3142] text-gray-300 border border-[#303748] rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDeleteFeature(selectedFeature)}
                    aria-label={`Delete feature manifest ${selectedFeature.name}`}
                    className="p-2 bg-[#222734] hover:bg-red-900/40 text-red-400 border border-[#303748] hover:border-red-800/50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleToggleFeature(selectedFeature.id)}
                    className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                      activeFeatureIds.includes(selectedFeature.id)
                        ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                    }`}
                  >
                    {activeFeatureIds.includes(selectedFeature.id) ? 'Disable Feature' : 'Activate Feature'}
                  </button>
                </div>
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

              {selectedFeature.securityWarnings?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#2b303d]">
                  <div className="font-semibold text-amber-400 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Security Warnings</span>
                  </div>
                  <div className="space-y-1 text-amber-200 leading-relaxed text-[11px]">
                    {selectedFeature.securityWarnings.map((warn, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 space-y-2 text-gray-500">
              <Box className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No feature manifests yet.</p>
              <button
                onClick={handleOpenAdd}
                className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
              >
                Create your first feature manifest
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT FEATURE MANIFEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-3xl w-full p-5 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" aria-hidden="true" />
                {editingFeatureId ? 'Edit Feature Manifest' : 'Create Feature Manifest'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Feature Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Redis Distributed Caching"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as FeatureCategory }))}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    {FEATURE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What this feature manifest provides..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. cache, redis, performance"
                  value={form.tags.join(', ')}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dependency Relationships */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {([
                  ['dependencies', 'Required Dependencies'],
                  ['optionalDependencies', 'Optional Dependencies'],
                  ['recommendedDependencies', 'Recommended Dependencies (Smart)'],
                  ['conflictingFeatures', 'Conflicting Features'],
                ] as Array<[keyof FeatureManifest, string]>).map(([key, label]) => (
                  <div key={key} className="p-2.5 bg-[#12141a] border border-[#252834] rounded-lg space-y-1.5">
                    <div className="text-[10px] text-gray-400 font-semibold">{label}</div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {otherFeatures.length === 0 && (
                        <span className="text-[10px] text-gray-600 italic">No other features yet</span>
                      )}
                      {otherFeatures.map((f) => {
                        const checked = ((form[key] as string[]) || []).includes(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggleListValue(key, f.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                                : 'bg-[#1d212c] text-gray-400 border-[#2e3446] hover:text-gray-200'
                            }`}
                          >
                            {f.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Impact Scores */}
              <div className="p-3 bg-[#12141a] border border-[#252834] rounded-lg space-y-2">
                <div className="text-[10px] text-gray-400 font-semibold">Architectural Impact Scores</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.keys(form.impactScores) as Array<keyof typeof form.impactScores>).map((key) => (
                    <div key={key}>
                      <label className="text-[9px] text-gray-500 block mb-0.5 capitalize">{key}</label>
                      <input
                        type="number"
                        value={form.impactScores[key]}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            impactScores: { ...p.impactScores, [key]: Number(e.target.value) || 0 },
                          }))
                        }
                        className="w-full bg-[#1d212c] border border-[#2e3446] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div className="p-3 bg-[#12141a] border border-[#252834] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 font-semibold">Configuration Questions</div>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" /> Add Question
                  </button>
                </div>
                <div className="space-y-2">
                  {form.questions.map((q, idx) => (
                    <div key={q.id} className="p-2 bg-[#1a1e2b] border border-[#2b3142] rounded space-y-1.5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Question text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(idx, { question: e.target.value })}
                          className="md:col-span-2 bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                        <select
                          value={q.type}
                          onChange={(e) => handleUpdateQuestion(idx, { type: e.target.value as FeatureQuestion['type'] })}
                          className="bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="boolean">Boolean</option>
                          <option value="select">Select</option>
                          <option value="text">Text</option>
                        </select>
                      </div>
                      {q.type === 'select' && (
                        <input
                          type="text"
                          placeholder="Options (comma-separated)"
                          value={(q.options || []).join(', ')}
                          onChange={(e) => handleUpdateQuestion(idx, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                          className="w-full bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Impact description"
                          value={q.impactDescription}
                          onChange={(e) => handleUpdateQuestion(idx, { impactDescription: e.target.value })}
                          className="flex-1 bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          aria-label="Remove question"
                          className="p-1.5 text-red-400 hover:bg-red-900/30 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.questions.length === 0 && (
                    <div className="text-[10px] text-gray-600 italic">No configuration questions yet.</div>
                  )}
                </div>
              </div>

              {/* Generated Files */}
              <div className="p-3 bg-[#12141a] border border-[#252834] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-400 font-semibold">Generated Files Preview</div>
                  <button
                    type="button"
                    onClick={handleAddGeneratedFile}
                    className="text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" /> Add File
                  </button>
                </div>
                <div className="space-y-2">
                  {form.generatedFiles.map((gf, idx) => (
                    <div key={idx} className="p-2 bg-[#1a1e2b] border border-[#2b3142] rounded space-y-1.5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="File path"
                          value={gf.path}
                          onChange={(e) => handleUpdateGeneratedFile(idx, { path: e.target.value })}
                          className="bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Language"
                          value={gf.language}
                          onChange={(e) => handleUpdateGeneratedFile(idx, { language: e.target.value })}
                          className="bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={gf.description}
                          onChange={(e) => handleUpdateGeneratedFile(idx, { description: e.target.value })}
                          className="bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Template snippet"
                        value={gf.templateSnippet}
                        onChange={(e) => handleUpdateGeneratedFile(idx, { templateSnippet: e.target.value })}
                        className="w-full bg-[#12141a] border border-[#2b303d] rounded p-1.5 text-[11px] font-mono text-gray-200 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveGeneratedFile(idx)}
                          aria-label="Remove generated file"
                          className="p-1.5 text-red-400 hover:bg-red-900/30 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.generatedFiles.length === 0 && (
                    <div className="text-[10px] text-gray-600 italic">No generated files yet.</div>
                  )}
                </div>
              </div>

              {/* Security Warnings */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Security Warnings (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ensure secrets are not baked into the image layer history."
                  value={form.securityWarnings.join('\n')}
                  onChange={(e) => setForm((p) => ({ ...p, securityWarnings: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }))}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-amber-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFeature}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
              >
                Save Feature Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
