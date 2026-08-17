'use client';

import React, { useState } from 'react';
import {
  Gauge,
  ShieldCheck,
  Cpu,
  Zap,
  TrendingUp,
  FileCode,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { AdvisorService } from '../services/advisorService';
import { ValidationService } from '../services/validationService';
import { Blueprint } from '../types/factory';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface ProjectAdvisorPanelProps {
  blueprint: Blueprint;
  openAIRefactor: (prompt: string) => void;
}

export const ProjectAdvisorPanel: React.FC<ProjectAdvisorPanelProps> = ({ blueprint, openAIRefactor }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Security Score');

  const scores = AdvisorService.calculateScores(blueprint);
  const validationMsgs = ValidationService.validateBlueprint(blueprint);

  const scoreMeters = [
    { label: 'Security Score', value: scores.securityScore, icon: ShieldCheck },
    { label: 'Architecture Score', value: scores.architectureScore, icon: Cpu },
    { label: 'Performance Score', value: scores.performanceScore, icon: Zap },
    { label: 'Scalability Score', value: scores.scalabilityScore, icon: TrendingUp },
    { label: 'Maintainability Score', value: scores.maintainabilityScore, icon: FileCode },
    { label: 'Complexity Score', value: scores.complexityScore, icon: Activity },
  ];

  return (
    <aside className="w-full xl:w-80 max-h-[75vh] xl:max-h-none xl:h-full bg-[#121418] border-t xl:border-t-0 border-l-0 xl:border-l border-[#262933] rounded-t-2xl xl:rounded-none flex flex-col overflow-y-auto select-none shrink-0 text-xs text-gray-200">
      {/* Advisor Header */}
      <div className="p-3.5 border-b border-[#262933] bg-[#16181f] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Gauge className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-gray-100 tracking-tight">Project Advisor</div>
            <div className="text-[10px] text-gray-400 font-mono">Real-time Architecture Auditor</div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-base font-bold font-mono text-blue-400">{scores.qualityScore}%</div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-mono">Quality Index</div>
        </div>
      </div>

      {/* Scores Grid */}
      <div className="p-3 space-y-2 border-b border-[#262933]">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400 mb-1">
          Quality Dimensions
        </div>

        {scoreMeters.map((meter) => {
          const Icon = meter.icon;
          const rationale = scores.rationale.find((r) => r.category === meter.label);
          const isExpanded = expandedCategory === meter.label;

          return (
            <Card key={meter.label} interactive className="p-2.5">
              <div
                onClick={() => setExpandedCategory(isExpanded ? null : meter.label)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                  <span className="font-medium text-gray-200 text-xs">{meter.label}</span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-gray-100">{meter.value}/100</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#242834] h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${meter.value}%` }}
                />
              </div>

              {/* Collapsible Rationale Explanation */}
              {isExpanded && rationale && (
                <div className="mt-2.5 pt-2 border-t border-[#232838] text-[11px] text-gray-300 space-y-1.5">
                  <div className="text-gray-400 leading-normal">{rationale.reason}</div>
                  {rationale.recommendations.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-mono text-blue-400 uppercase font-semibold">Recommendations:</div>
                      {rationale.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-300">
                          <span className="text-blue-400 font-bold">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Live Validation Feed */}
      <div className="p-3 space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400">
            Live Validation Engine
          </div>
          <span className="text-[10px] font-mono text-gray-500">{validationMsgs.length} Rules Evaluated</span>
        </div>

        <div className="space-y-2">
          {validationMsgs.map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                msg.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-200'
                  : msg.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  {msg.type === 'error' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                  ) : msg.type === 'warning' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-xs">{msg.title}</span>
                </div>
                <Badge tone="neutral" className="normal-case shrink-0">{msg.code}</Badge>
              </div>

              <div className="text-gray-300 leading-relaxed text-[11px]">{msg.description}</div>

              {msg.consequenceIfIgnored && (
                <div className="text-[10px] text-amber-300/80 italic pt-0.5 border-t border-amber-800/20">
                  Consequence if ignored: {msg.consequenceIfIgnored}
                </div>
              )}

              {msg.affectedComponent && (
                <div className="text-[10px] font-mono text-gray-400">Target: {msg.affectedComponent}</div>
              )}

              <div className="pt-1.5 flex items-center justify-between">
                <button
                  onClick={() =>
                    openAIRefactor(`Analyze validation issue '${msg.title}' (${msg.code}) and suggest an architectural fix.`)
                  }
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Ask AI Architect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
