'use client';

import React from 'react';
import {
  Layers,
  Box,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Server,
  ArrowRight,
  Sparkles,
  GitCommit,
  Clock,
  Building2,
  Zap,
} from 'lucide-react';
import {
  StorageService,
  useTemplates,
  useFeatureManifests,
  useProjects,
  useRuleSets,
  useDecisionLogs,
} from '../../services/storageService';
import { AdvisorService } from '../../services/advisorService';
import { ValidationService } from '../../services/validationService';
import { Blueprint } from '../../types/factory';

interface DashboardViewProps {
  setActiveView: (view: string) => void;
  selectedBlueprint: Blueprint;
  setSelectedBlueprint: (bp: Blueprint) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveView,
  selectedBlueprint,
}) => {
  const templates = useTemplates();
  const features = useFeatureManifests();
  const projects = useProjects();
  const ruleSets = useRuleSets();
  const decisionLogs = useDecisionLogs();

  const scores = AdvisorService.calculateScores(selectedBlueprint);
  const validationMsgs = ValidationService.validateBlueprint(selectedBlueprint);
  const errorCount = validationMsgs.filter((m) => m.type === 'error').length;
  const warningCount = validationMsgs.filter((m) => m.type === 'warning').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-semibold uppercase">
              Factory Operating System
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-xs text-gray-400 font-mono">Acme Enterprise Workspaces</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Software Factory Engineering Control Plane</h1>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Standardize software architectures, blueprints, feature manifests, and AI compliance policies across all enterprise projects.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveView('scaffolder')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Launch Solution Wizard</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#181a20] border border-[#2b303d] rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium">Quality Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{scores.qualityScore}%</div>
          <div className="text-[10px] text-gray-500">Real-time score</div>
        </div>

        <div className="bg-[#181a20] border border-[#2b303d] rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium">Active Templates</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{templates.length}</div>
          <div className="text-[10px] text-blue-400 font-mono">Enterprise Standard</div>
        </div>

        <div className="bg-[#181a20] border border-[#2b303d] rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium">Feature Manifests</span>
            <Box className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{features.length}</div>
          <div className="text-[10px] text-purple-400 font-mono">Smart Modules</div>
        </div>

        <div className="bg-[#181a20] border border-[#2b303d] rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium">Rule Policies</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{ruleSets[0]?.rules.length || 6}</div>
          <div className="text-[10px] text-amber-400 font-mono">Enforced</div>
        </div>

        <div
          onClick={() => setActiveView('scaffolder')}
          className="bg-[#181a20] border border-[#2b303d] hover:border-cyan-500/50 cursor-pointer transition-all rounded-lg p-3.5 space-y-1 group"
        >
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium group-hover:text-cyan-300">Active Projects</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{projects.length}</div>
          <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
            <span>+ Create Project</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div className="bg-[#181a20] border border-[#2b303d] rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-medium">Validation Status</span>
            {errorCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xl font-bold font-mono">
            {errorCount > 0 ? (
              <span className="text-red-400">{errorCount} Err</span>
            ) : (
              <span className="text-emerald-400">Passing</span>
            )}
          </div>
          <div className="text-[10px] text-gray-500">{warningCount} Warnings</div>
        </div>
      </div>

      {/* Main Grid: Active Templates & Recent Decision Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Factory Blueprints & Templates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Standard Enterprise Templates</span>
            </h2>
            <button
              onClick={() => setActiveView('blueprints')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-[#181a20] border border-[#2b303d] hover:border-blue-500/50 rounded-xl p-4 transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-100 text-sm group-hover:text-blue-300 transition-colors">
                        {tmpl.name}
                      </span>
                      {tmpl.isOfficial && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                          Official
                        </span>
                      )}
                      <span className="text-xs font-mono text-gray-500">v{tmpl.version}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{tmpl.description}</p>
                  </div>

                  <button
                    onClick={() => setActiveView('scaffolder')}
                    className="px-3 py-1.5 bg-[#222733] hover:bg-blue-600 text-gray-300 hover:text-white rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    Use Template
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#262a36] text-[11px] text-gray-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tmpl.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-[#202430] border border-[#2e3444] text-gray-300 text-[10px] font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[10px] text-gray-500">
                    <span>{tmpl.blueprint.projects.length} Projects</span>
                    <span>•</span>
                    <span>{tmpl.blueprint.featureIds.length} Features</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Decision Log & Active Workspaces */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-purple-400" />
              <span>Architectural Decision Log</span>
            </h2>
            <button
              onClick={() => setActiveView('decisions')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
            {decisionLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-3 bg-[#13151b] border border-[#262934] rounded-lg space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-gray-200 text-xs">{log.decision}</div>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">{log.date}</span>
                </div>
                <div className="text-[11px] text-gray-400 leading-normal">{log.reason}</div>
                <div className="text-[10px] font-mono text-blue-400">{log.author}</div>
              </div>
            ))}
          </div>

          {/* Quick Tools */}
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
            <div className="font-semibold text-xs text-gray-200">Architectural Tools</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveView('impact')}
                className="p-2.5 bg-[#202430] hover:bg-[#282e3d] border border-[#2e3444] rounded-lg text-left text-gray-300 hover:text-white transition-colors cursor-pointer space-y-1"
              >
                <div className="font-medium text-blue-400">Impact Analyzer</div>
                <div className="text-[10px] text-gray-400">What-if setting change</div>
              </button>

              <button
                onClick={() => setActiveView('features')}
                className="p-2.5 bg-[#202430] hover:bg-[#282e3d] border border-[#2e3444] rounded-lg text-left text-gray-300 hover:text-white transition-colors cursor-pointer space-y-1"
              >
                <div className="font-medium text-purple-400">Feature Manifests</div>
                <div className="text-[10px] text-gray-400">Smart dependencies</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
