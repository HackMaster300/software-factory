'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Cpu,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Blueprint, ArchitectureStyle } from '../../types/factory';
import { AdvisorService } from '../../services/advisorService';
import { ValidationService } from '../../services/validationService';
import { FeatureService } from '../../services/featureService';
import { BlueprintService } from '../../services/blueprintService';
import { buildGroundedPrompt } from '../../lib/ai-grounding';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

interface ImpactAnalyzerViewProps {
  blueprint: Blueprint;
  openAIRefactor: (prompt: string) => void;
}

/**
 * Phase 11 — what-if com diff REAL, não deltas inventados (+8/-4).
 * Toda mudança do target-state é mutação genuína do blueprint (estilo + toggles de
 * features do catálogo) reavaliada pelo mesmo engine; módulos vêm do layout real
 * (BlueprintService) e violações do ValidationService. Sem diff computável, vazio honesto.
 */
const TOGGLEABLE_FEATURES = [
  { id: 'feat-healthchecks', label: 'Health Checks & Diagnostics' },
  { id: 'feat-secrets', label: 'Secrets Vault Integration' },
  { id: 'feat-redis-cache', label: 'Redis Distributed Cache' },
] as const;

export const ImpactAnalyzerView: React.FC<ImpactAnalyzerViewProps> = ({ blueprint, openAIRefactor }) => {
  const [simTargetStyle, setSimTargetStyle] = useState<ArchitectureStyle>(blueprint.architectureStyle);
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const active = FeatureService.resolveBlueprintFeatures(blueprint).activeFeatureIds;
    return Object.fromEntries(TOGGLEABLE_FEATURES.map((f) => [f.id, active.includes(f.id)]));
  });

  const currentActive = FeatureService.resolveBlueprintFeatures(blueprint).activeFeatureIds;

  // Target-state = mutação real do blueprint atual.
  const toggledOn: string[] = TOGGLEABLE_FEATURES.filter((f) => toggles[f.id] && !blueprint.featureIds.includes(f.id)).map((f) => f.id);
  const toggledOff: string[] = TOGGLEABLE_FEATURES.filter((f) => !toggles[f.id]).map((f) => f.id);
  const simulated: Blueprint = {
    ...blueprint,
    architectureStyle: simTargetStyle,
    featureIds: [...blueprint.featureIds.filter((id) => !toggledOff.includes(id)), ...toggledOn],
    disabledAutoFeatures: [...new Set([...blueprint.disabledAutoFeatures, ...toggledOff])],
  };
  const simActive = FeatureService.resolveBlueprintFeatures(simulated).activeFeatureIds;

  const currentScores = AdvisorService.calculateScores(blueprint);
  const simScores = AdvisorService.calculateScores(simulated);

  // Diff de módulos — layout real para o target style vs. projetos atuais (por nome).
  const targetModules = BlueprintService.getProjectsForTechStackAndArchStyle(blueprint.techStackId, simTargetStyle);
  const currentNames = new Set(blueprint.projects.map((p) => p.name));
  const targetNames = new Set(targetModules.map((p) => p.name));
  const addedModules = targetModules.filter((p) => !currentNames.has(p.name));
  const removedModules = blueprint.projects.filter((p) => !targetNames.has(p.name));

  // Diff de features — nomes reais do catálogo.
  const addedFeatures = simActive.filter((id) => !currentActive.includes(id));
  const removedFeatures = currentActive.filter((id) => !simActive.includes(id));
  const featureName = (id: string): string => FeatureService.getFeatureById(id)?.name || id;

  // Diff de validação — códigos reais, novos vs. resolvidos.
  const currentCodes = new Set(ValidationService.validateBlueprint(blueprint).map((m) => m.code));
  const simCodes = new Set(ValidationService.validateBlueprint(simulated).map((m) => m.code));
  const newViolations = [...simCodes].filter((c) => !currentCodes.has(c) && c !== 'ALL_PASSING');
  const resolvedViolations = [...currentCodes].filter((c) => !simCodes.has(c) && c !== 'ALL_PASSING');

  const styleChanged = simTargetStyle !== blueprint.architectureStyle;
  const hasAnyChange = styleChanged || toggledOn.length > 0 || toggledOff.length > 0;
  const qualityDelta = simScores.qualityScore - currentScores.qualityScore;

  const rows = [
    { label: 'Security Score', current: currentScores.securityScore, sim: simScores.securityScore, icon: Shield },
    { label: 'Architecture Score', current: currentScores.architectureScore, sim: simScores.architectureScore, icon: Cpu },
    { label: 'Performance Score', current: currentScores.performanceScore, sim: simScores.performanceScore, icon: Zap },
    { label: 'Scalability Score', current: currentScores.scalabilityScore, sim: simScores.scalabilityScore, icon: TrendingUp },
    { label: 'Complexity Index', current: currentScores.complexityScore, sim: simScores.complexityScore, icon: Activity },
  ];

  const handleAIReport = (): void => {
    const diffSummary = [
      `Architecture: ${blueprint.architectureStyle} → ${simTargetStyle}${styleChanged ? '' : ' (unchanged)'}`,
      `Modules added: ${addedModules.map((m) => m.name).join(', ') || '(none)'}`,
      `Modules removed: ${removedModules.map((m) => m.name).join(', ') || '(none)'}`,
      `Features added: ${addedFeatures.map(featureName).join(', ') || '(none)'}`,
      `Features removed: ${removedFeatures.map(featureName).join(', ') || '(none)'}`,
      `New violations: ${newViolations.join(', ') || '(none)'}`,
      `Resolved violations: ${resolvedViolations.join(', ') || '(none)'}`,
      `Quality: ${currentScores.qualityScore} → ${simScores.qualityScore} (${qualityDelta >= 0 ? '+' : ''}${qualityDelta})`,
    ].join('\n');
    openAIRefactor(
      `${buildGroundedPrompt(simulated, 'Analyze the target-state impact below.')}\n\n## TARGET-STATE DIFF (computed, ground truth)\n${diffSummary}\n\nAnalyze refactoring cost, breaking risks, and team impact of this exact diff.`
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">What-If Analyzer</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">Target state recomputed by the real engine (heuristic)</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Setting Change Compatibility & Impact Radar</h1>
        </div>

        <Button variant="secondary" onClick={handleAIReport} className="shrink-0">
          <Sparkles className="w-3.5 h-3.5" /> AI What-If Impact Report
        </Button>
      </Card>

      <Card className="space-y-3">
        <div className="font-semibold text-gray-200 text-xs flex items-center justify-between">
          <span>Target-State Changes (applied to your real blueprint)</span>
          <span className="text-gray-400 font-mono text-[11px]">Current vs recomputed target</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-gray-400 text-[11px]">Target Architecture Pattern</label>
            <Select value={simTargetStyle} onChange={(e) => setSimTargetStyle(e.target.value as ArchitectureStyle)}>
              <option value="CleanArchitecture">Clean Architecture</option>
              <option value="Microservices">Microservices</option>
              <option value="ModularMonolith">Modular Monolith</option>
              <option value="Hexagonal">Hexagonal Ports & Adapters</option>
              <option value="CQRS">CQRS & Event Sourcing</option>
              <option value="EventDriven">Event Driven</option>
            </Select>
          </div>

          {TOGGLEABLE_FEATURES.map((f) => (
            <div key={f.id} className="space-y-1">
              <label className="text-gray-400 text-[11px]">{f.label}</label>
              <div className="flex items-center gap-2 pt-1.5">
                <button
                  role="switch"
                  aria-checked={toggles[f.id]}
                  onClick={() => setToggles((t) => ({ ...t, [f.id]: !t[f.id] }))}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${toggles[f.id] ? 'bg-blue-600' : 'bg-[#2b303d]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${toggles[f.id] ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                <span className="font-mono text-[11px] text-gray-300">{toggles[f.id] ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!hasAnyChange && (
        <Card className="border-[#2b303d]">
          <div className="text-xs text-gray-400">
            No changes vs. current blueprint — target state is identical. Change the architecture or toggle a feature to compute a diff.
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#2b303d] pb-3">
            <div>
              <div className="font-bold text-sm text-white">Quality Metric Score Shifts</div>
              <div className="text-[11px] text-gray-400">Baseline vs recomputed target delta</div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-gray-400 text-xs">Overall Shift:</span>
              <Badge tone={qualityDelta >= 0 ? 'success' : 'danger'} className="text-sm normal-case">
                {qualityDelta >= 0 ? `+${qualityDelta}%` : `${qualityDelta}%`}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((m) => {
              const Icon = m.icon;
              const diff = m.sim - m.current;
              return (
                <div key={m.label} className="p-3 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-gray-200">{m.label}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-gray-400">{m.current}/100</span>
                      <ArrowRight className="w-3 h-3 text-gray-600" />
                      <span className="text-white font-bold">{m.sim}/100</span>
                      <Badge tone={diff >= 0 ? 'success' : 'danger'}>{diff >= 0 ? `+${diff}` : diff}</Badge>
                    </div>
                  </div>

                  <div className="w-full bg-[#202432] h-1.5 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600/40" style={{ width: `${m.current}%` }} />
                    {diff > 0 && <div className="h-full bg-emerald-500" style={{ width: `${diff}%` }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="font-bold text-sm text-white border-b border-[#2b303d] pb-3">
            Real Diff: Modules, Features & Rule Violations
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-2">
              <div className="flex items-center justify-between font-semibold text-xs">
                <span className="text-gray-200">Module Layout ({blueprint.architectureStyle} → {simTargetStyle})</span>
                <span className="font-mono text-[11px] text-gray-400">
                  +{addedModules.length} / −{removedModules.length}
                </span>
              </div>
              {addedModules.length === 0 && removedModules.length === 0 ? (
                <p className="text-gray-400 text-[11px]">Module layout unchanged.</p>
              ) : (
                <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                  {addedModules.map((m) => (
                    <Badge key={m.id} tone="success" className="normal-case">+ {m.name} ({m.type})</Badge>
                  ))}
                  {removedModules.map((m) => (
                    <Badge key={m.id} tone="danger" className="normal-case">− {m.name} ({m.type})</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-2">
              <div className="flex items-center justify-between font-semibold text-xs">
                <span className="text-gray-200">Features Toggled</span>
                <span className="font-mono text-[11px] text-gray-400">
                  +{addedFeatures.length} / −{removedFeatures.length}
                </span>
              </div>
              {addedFeatures.length === 0 && removedFeatures.length === 0 ? (
                <p className="text-gray-400 text-[11px]">No feature changes.</p>
              ) : (
                <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                  {addedFeatures.map((id) => (
                    <Badge key={id} tone="success" className="normal-case">+ {featureName(id)}</Badge>
                  ))}
                  {removedFeatures.map((id) => (
                    <Badge key={id} tone="danger" className="normal-case">− {featureName(id)}</Badge>
                  ))}
                </div>
              )}
            </div>

            {newViolations.length === 0 && resolvedViolations.length === 0 ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No rule-violation change (verified, not assumed)</span>
                </div>
                <p className="text-emerald-200/80 text-[11px]">
                  Target state introduces and resolves zero rule violations vs. current blueprint.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-[#13151b] border border-amber-500/30 rounded-lg space-y-1">
                <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Rule-violation delta (real codes)</span>
                </div>
                {newViolations.length > 0 && (
                  <p className="text-[11px] text-gray-300 font-mono">New: {newViolations.join(', ')}</p>
                )}
                {resolvedViolations.length > 0 && (
                  <p className="text-[11px] text-gray-300 font-mono">Resolved: {resolvedViolations.join(', ')}</p>
                )}
              </div>
            )}

            <p className="text-gray-500 text-[11px] font-mono">
              Honest sizing: {addedModules.length + removedModules.length} module changes,{' '}
              {addedFeatures.length + removedFeatures.length} feature toggles, {newViolations.length} new
              violations — size the sprint from these counts, not from estimates.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
