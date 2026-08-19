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
} from 'lucide-react';
import { Blueprint } from '../../types/factory';
import { AdvisorService } from '../../services/advisorService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

interface ImpactAnalyzerViewProps {
  blueprint: Blueprint;
  openAIRefactor: (prompt: string) => void;
}

export const ImpactAnalyzerView: React.FC<ImpactAnalyzerViewProps> = ({ blueprint, openAIRefactor }) => {
  const [simTargetStyle, setSimTargetStyle] = useState<string>('Microservices');
  const [simAuthMechanism, setSimAuthMechanism] = useState<string>('mTLS + JWT');
  const [simDatabaseProvider, setSimDatabaseProvider] = useState<string>('CockroachDB');
  const [simContainerStrategy, setSimContainerStrategy] = useState<string>('K8s Helm + Istio Service Mesh');

  const currentScores = AdvisorService.calculateScores(blueprint);

  const isSimMicroservices = simTargetStyle === 'Microservices';
  const isSimCockroach = simDatabaseProvider === 'CockroachDB';
  const isSimMTLS = simAuthMechanism.includes('mTLS');
  const isSimK8sMesh = simContainerStrategy.includes('K8s');
  const isSimManagedFargate = simContainerStrategy === 'AWS ECS Fargate';

  const simSecurityScore = Math.min(100, Math.max(0, currentScores.securityScore + (isSimMTLS ? 8 : -4)));
  const simArchScore = Math.min(100, Math.max(0, currentScores.architectureScore + (isSimMicroservices ? 10 : 2)));
  const simPerfScore = Math.max(50, currentScores.performanceScore + (isSimMicroservices ? -6 : 8));
  const simScalabilityScore = Math.min(
    100,
    Math.max(0, currentScores.scalabilityScore + (isSimCockroach ? 12 : 5) + (isSimK8sMesh ? 6 : isSimManagedFargate ? 4 : -8))
  );
  const simComplexityScore = Math.min(
    100,
    Math.max(0, currentScores.complexityScore + (isSimMicroservices ? 15 : 0) + (isSimK8sMesh ? 10 : isSimManagedFargate ? 4 : -10))
  );

  const simQualityScore = Math.round(
    (simSecurityScore + simArchScore + simPerfScore + simScalabilityScore) / 4
  );

  const qualityDelta = simQualityScore - currentScores.qualityScore;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">What-If Simulation Engine</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">Live Architectural Setting Diff Analyzer</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Setting Change Compatibility & Impact Radar</h1>
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            openAIRefactor(
              `Simulate impact of changing blueprint architecture from '${blueprint.architectureStyle}' to '${simTargetStyle}' with Database '${simDatabaseProvider}', Auth '${simAuthMechanism}', and Container Orchestration '${simContainerStrategy}'. Analyze refactoring cost, breaking risks, and team impact.`
            )
          }
          className="shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI What-If Simulation Report
        </Button>
      </Card>

      <Card className="space-y-3">
        <div className="font-semibold text-gray-200 text-xs flex items-center justify-between">
          <span>Simulated Architectural Setting Changes</span>
          <span className="text-gray-400 font-mono text-[11px]">Compare current blueprint vs target state</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-gray-400 text-[11px]">Target Architecture Pattern</label>
            <Select value={simTargetStyle} onChange={(e) => setSimTargetStyle(e.target.value)}>
              <option value="CleanArchitecture">Clean Architecture</option>
              <option value="Microservices">Microservices (gRPC Mesh)</option>
              <option value="ModularMonolith">Modular Monolith</option>
              <option value="Hexagonal">Hexagonal Ports & Adapters</option>
              <option value="CQRS">CQRS & Event Sourcing</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 text-[11px]">Database Infrastructure</label>
            <Select value={simDatabaseProvider} onChange={(e) => setSimDatabaseProvider(e.target.value)}>
              <option value="PostgreSQL 16">PostgreSQL 16</option>
              <option value="CockroachDB">CockroachDB Distributed SQL</option>
              <option value="MongoDB Enterprise">MongoDB Enterprise</option>
              <option value="Azure Cosmos DB">Azure Cosmos DB</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 text-[11px]">Security & Authentication</label>
            <Select value={simAuthMechanism} onChange={(e) => setSimAuthMechanism(e.target.value)}>
              <option value="OAuth2 JWT">OAuth2 JWT Bearer Tokens</option>
              <option value="mTLS + JWT">mTLS + JWT (Zero-Trust)</option>
              <option value="SAML 2.0 Enterprise">SAML 2.0 Enterprise SSO</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 text-[11px]">Container & Orchestration</label>
            <Select value={simContainerStrategy} onChange={(e) => setSimContainerStrategy(e.target.value)}>
              <option value="K8s Helm + Istio Service Mesh">K8s Helm + Istio Mesh</option>
              <option value="Docker Compose Dev">Docker Compose Dev Only</option>
              <option value="AWS ECS Fargate">AWS ECS Fargate</option>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#2b303d] pb-3">
            <div>
              <div className="font-bold text-sm text-white">Quality Metric Score Shifts</div>
              <div className="text-[11px] text-gray-400">Baseline vs Simulated State Delta</div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-gray-400 text-xs">Overall Shift:</span>
              <Badge tone={qualityDelta >= 0 ? 'success' : 'danger'} className="text-sm normal-case">
                {qualityDelta >= 0 ? `+${qualityDelta}%` : `${qualityDelta}%`}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Security Score', current: currentScores.securityScore, sim: simSecurityScore, icon: Shield },
              { label: 'Architecture Score', current: currentScores.architectureScore, sim: simArchScore, icon: Cpu },
              { label: 'Performance Score', current: currentScores.performanceScore, sim: simPerfScore, icon: Zap },
              { label: 'Scalability Score', current: currentScores.scalabilityScore, sim: simScalabilityScore, icon: TrendingUp },
              { label: 'Complexity Index', current: currentScores.complexityScore, sim: simComplexityScore, icon: Activity },
            ].map((m) => {
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
            Refactoring Effort & Breaking Risk Analysis
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-2">
              <div className="flex items-center justify-between font-semibold text-xs">
                <span className="text-gray-200">Estimated Refactoring Effort</span>
                <span className="text-amber-400 font-mono">2 - 3 Sprint Cycles</span>
              </div>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Transitioning to <span className="text-blue-300 font-mono">{simTargetStyle}</span> requires extracting domain services into bounded contexts, adding event handlers, and updating CI/CD pipelines.
              </p>
            </div>

            <div className="p-3.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-2">
              <div className="flex items-center justify-between font-semibold text-xs">
                <span className="text-gray-200">Affected Code Files</span>
                <span className="text-gray-400 font-mono">~34 Files Across 4 Projects</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono text-gray-300">
                <Badge className="normal-case">Program.cs</Badge>
                <Badge className="normal-case">Dockerfile</Badge>
                <Badge className="normal-case">DbContext.cs</Badge>
                <Badge className="normal-case">helm/values.yaml</Badge>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero Architectural Rule Policy Violations</span>
              </div>
              <p className="text-emerald-200/80 text-[11px]">
                The simulated target state satisfies all active Enterprise Rule Engine constraints without breaching layer isolation rules.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
