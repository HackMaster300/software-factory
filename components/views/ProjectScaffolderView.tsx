'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ShieldAlert } from 'lucide-react';
import { ArchitectureStyle } from '../../types/factory';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useProjectScaffolder, type ProjectScaffolderViewProps } from './scaffolder/useProjectScaffolder';
import { Step1TechStack } from './scaffolder/Step1TechStack';
import { ModulesEditorCard } from './scaffolder/ModulesEditorCard';
import { EnvConfigCard } from './scaffolder/EnvConfigCard';
import { Step3Scores } from './scaffolder/Step3Scores';
import { Step4AiConversation } from './scaffolder/Step4AiConversation';
import { Step5Preview } from './scaffolder/Step5Preview';
import { IdeExportModal } from './scaffolder/IdeExportModal';

export const ProjectScaffolderView: React.FC<ProjectScaffolderViewProps> = (props) => {
  const wizard = useProjectScaffolder(props);
  const {
    step, setStep, editableBlueprint, showIdeExportModal, activeTechStack, ruleReport, liveScores,
    handleSelectArchStyle,
  } = wizard;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Wizard Header Bar */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Autonomous Engineering Flow</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">Step {step} of 5</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Project Scaffolding & Solution Builder Wizard</h1>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { num: 1, name: 'Tech Stack & Name' },
            { num: 2, name: 'Architecture & Rules' },
            { num: 3, name: 'Scores & Profiles' },
            { num: 4, name: 'AI Suggestions' },
            { num: 5, name: 'Preview & Generate' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-colors ${
                step === s.num
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                  : 'bg-[#1e222d] text-gray-400 border-[#2f3547]'
              }`}
            >
              <span className="font-mono">{s.num}.</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Live Quality Score Badge Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono font-bold text-base">
            {liveScores.qualityScore}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Heuristic Estimate <span className="font-normal text-gray-400">(traceable, not measured)</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Active Stack: <span className="text-blue-300 font-mono">{activeTechStack.name}</span> | Arch:{' '}
              <span className="text-gray-200 font-mono">{editableBlueprint.architectureStyle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-center">
            <div className="text-gray-400 text-[10px]">SECURITY</div>
            <div className="text-gray-100 font-bold">{liveScores.securityScore}/100</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-[10px]">ARCH</div>
            <div className="text-gray-100 font-bold">{liveScores.architectureScore}/100</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-[10px]">PERF</div>
            <div className="text-gray-100 font-bold">{liveScores.performanceScore}/100</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-[10px]">SCALE</div>
            <div className="text-gray-100 font-bold">{liveScores.scalabilityScore}/100</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-[10px]">MAINTAIN</div>
            <div className="text-gray-100 font-bold">{liveScores.maintainabilityScore}/100</div>
          </div>
          {/* Rule Guardrail Status Badge */}
          <div className="text-center border-l border-[#2e3446] pl-4">
            <div className="text-gray-400 text-[10px]">RULE ENGINE</div>
            {ruleReport.failedCount === 0 ? (
              <Badge tone="success" className="text-[11px] normal-case">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> PASSED
              </Badge>
            ) : (
              <Badge tone="warning" className="text-[11px] normal-case">
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> {ruleReport.failedCount} WARN
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Step Content Panels */}
      {step === 1 && (
        <Step1TechStack wizard={wizard} />
      )}

      {step === 2 && (
        <Card className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Step 2: Custom Architectural Pattern & Component Hierarchy</h2>
            <p className="text-gray-400 text-xs">
              Select the pattern style for <span className="font-mono text-blue-400">{activeTechStack.name}</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { id: 'CleanArchitecture', title: 'Clean Architecture', desc: 'Domain core isolation with Application, Infrastructure, and API layers' },
              { id: 'Hexagonal', title: 'Hexagonal (Ports & Adapters)', desc: 'Decoupled domain ports with pluggable HTTP and DB adapters' },
              { id: 'Microservices', title: 'Microservices', desc: 'Independently deployable lightweight services with REST/gRPC' },
              { id: 'CQRS', title: 'CQRS / Event Sourcing', desc: 'Separated write command handlers and read query models' },
              { id: 'ModularMonolith', title: 'Modular Monolith', desc: 'High-speed single process with strict internal domain module boundaries' },
            ].map((arch) => {
              const isSelected = editableBlueprint.architectureStyle === arch.id;
              return (
                <Card
                  key={arch.id}
                  interactive
                  onClick={() => handleSelectArchStyle(arch.id as ArchitectureStyle)}
                  className={`space-y-2 ${isSelected ? 'border-blue-500 bg-blue-600/10' : ''}`}
                >
                  <div className="font-bold text-xs text-gray-100">{arch.title}</div>
                  <div className="text-[11px] text-gray-400">{arch.desc}</div>
                </Card>
              );
            })}
          </div>

          {/* Solution Project Modules (.csproj / Crates / Packages) Customization */}
          <ModulesEditorCard wizard={wizard} />

          {/* Environment File (.env) Configuration Choice */}
          <EnvConfigCard wizard={wizard} />

          <div className="flex justify-between pt-3 border-t border-[#2b303d]">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>

            <Button variant="primary" onClick={() => setStep(3)}>
              <span>Next: Live Score Rationale</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Step3Scores wizard={wizard} />
      )}

      {step === 4 && (
        <Step4AiConversation wizard={wizard} />
      )}

      {step === 5 && (
        <Step5Preview wizard={wizard} />
      )}

      {/* IDE Export & Direct Launch Modal */}
      {showIdeExportModal && (
        <IdeExportModal wizard={wizard} />
      )}
    </div>
  );
};
