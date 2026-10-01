'use client';

import { CheckCircle2, ArrowRight, Sparkles, Plus, Package } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input, Textarea } from '../../ui/Input';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 1: solution name, template and primary tech stack. */
export function Step1TechStack({ wizard }: { wizard: ScaffolderState }) {
  const {
    setStep, projectName, setProjectName, selectedTemplateId, templates, techStacks,
    editableBlueprint, setEditableBlueprint, projectDescription, setProjectDescription,
    isAnalyzingAiPackages, aiPackageAnalysisText, activeTechStack, suggestedPackages,
    handleApplyAllSuggestedPackages, handleAnalyzePackagesWithAi, handleAddPackageToProj,
    handleSelectTemplate, handleSelectTechStack,
  } = wizard;
  return (
        <Card className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Step 1: Solution Identifier & Primary Tech Stack Selection</h2>
            <p className="text-gray-400 text-xs">
              Provide full architectural autonomy to choose among .NET 9, Java Spring Boot, Go Fiber, Python FastAPI, Node.js NestJS, Rust Axum, Next.js, Kotlin Ktor, or Flutter.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 block mb-1 font-medium">Solution Namespace / Project Identifier</label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="max-w-xl font-mono"
              />
            </div>

            {/* Functional Description & Smart Package Suggester Section */}
            <Card className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#252a38] pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <h3 className="font-bold text-gray-100 text-xs">Descrição do Funcionamento do Projecto & Sugestão de Pacotes</h3>
                    <Badge tone="brand">AI & Keyword Engine</Badge>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Descreva o funcionamento do projecto para sugerir e incluir automaticamente os pacotes e bibliotecas ideais para cada módulo da arquitetura.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleAnalyzePackagesWithAi} disabled={isAnalyzingAiPackages}>
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAnalyzingAiPackages ? 'Analisando...' : 'Analisar Funcionamento via AI'}</span>
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleApplyAllSuggestedPackages}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Aplicar {suggestedPackages.length} Pacotes Sugeridos</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-medium text-[11px]">Descrição do Funcionamento e Requisitos Operacionais:</label>
                <Textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => {
                    setProjectDescription(e.target.value);
                    setEditableBlueprint((prev) => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder="Ex: API de pagamento com autenticação JWT, banco de dados PostgreSQL com EF Core/Prisma, cache Redis, fila RabbitMQ para eventos, logs com Serilog e Swagger..."
                />
              </div>

              {/* Quick Preset Description Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-gray-400 font-mono">Exemplos de Funcionamento:</span>
                {[
                  'API FinTech & Pagamentos com JWT, PostgreSQL, Redis, RabbitMQ, Serilog, FluentValidation e Swagger',
                  'E-Commerce Microservices com OAuth, Redis, MassTransit, EF Core, Stripe e Kafka',
                  'SaaS Backend NestJS com JWT, Prisma, PostgreSQL, BullMQ, Winston e Zod',
                  'Worker & Async Queue Processor em C# com MassTransit, Dapper e PostgreSQL',
                ].map((presetDesc, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setProjectDescription(presetDesc);
                      setEditableBlueprint((prev) => ({ ...prev, description: presetDesc }));
                    }}
                    className="px-2 py-0.5 rounded bg-[#1c2029] hover:bg-[#242a36] text-gray-300 border border-[#2e3340] font-mono cursor-pointer transition-colors"
                  >
                    {presetDesc.split(' ')[0]} {presetDesc.split(' ')[1]}...
                  </button>
                ))}
              </div>

              {/* Display Auto-Suggested Packages Chips */}
              <div className="pt-2 border-t border-[#232838] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-gray-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Pacotes Sugeridos Automaticamente ({suggestedPackages.length} Identificados)
                  </span>
                  <span className="text-gray-400 font-mono text-[10px]">
                    Stack: <strong className="text-blue-300">{activeTechStack.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {suggestedPackages.map((sug, idx) => (
                    <Card key={idx} flat className="border border-[#2b303d] flex items-start justify-between space-x-2 p-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[11px] font-bold text-gray-100 font-mono truncate">{sug.packageName}</div>
                        <div className="text-[10px] text-gray-400 truncate">{sug.reason}</div>
                        <div className="flex items-center gap-1 pt-0.5 font-mono text-[9px]">
                          <Badge tone="neutral" className="normal-case">v{sug.version}</Badge>
                          <Badge tone="brand" className="normal-case">{sug.targetModuleType}</Badge>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          const targetProj = editableBlueprint.projects.find((p) => p.type === sug.targetModuleType) || editableBlueprint.projects[0];
                          if (targetProj) {
                            handleAddPackageToProj(targetProj.id, sug.packageName, sug.version);
                          }
                        }}
                        title={`Adicionar ao módulo ${sug.targetModuleType}`}
                        className="shrink-0"
                      >
                        + Add
                      </Button>
                    </Card>
                  ))}

                  {suggestedPackages.length === 0 && (
                    <div className="col-span-full text-[11px] text-gray-500 italic p-2 bg-[#13151b] rounded border border-[#2b303d]">
                      Digite os requisitos do funcionamento do projecto no campo acima para visualizar e sugerir pacotes automaticamente.
                    </div>
                  )}
                </div>
              </div>

              {/* AI Output Result Box if invoked */}
              {aiPackageAnalysisText && (
                <Card flat className="border border-[#2b303d] space-y-2">
                  <div className="flex items-center gap-1.5 text-gray-200 font-bold text-xs border-b border-[#232838] pb-1">
                    <Sparkles className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span>Parecer do Arquiteto de Software AI sobre os Pacotes Sugeridos:</span>
                  </div>
                  <div className="text-[11px] text-gray-300 whitespace-pre-line leading-relaxed font-mono">
                    {aiPackageAnalysisText}
                  </div>
                </Card>
              )}
            </Card>

            <div>
              <label className="text-gray-300 block mb-2 font-medium">Choose Programming Language & Framework Stack</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {techStacks.map((st) => {
                  const isSelected = editableBlueprint.techStackId === st.id;
                  return (
                    <Card
                      key={st.id}
                      interactive
                      onClick={() => handleSelectTechStack(st.id)}
                      className={`space-y-2 ${isSelected ? 'border-blue-500 bg-blue-600/10' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-100">{st.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" />}
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-2">{st.description}</div>
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-gray-400">
                        <Badge tone="neutral" className="normal-case">{st.language}</Badge>
                        <span>{st.framework}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-gray-300 block mb-2 font-medium">Or Select a Preconfigured Standard Template</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <Card
                      key={tmpl.id}
                      interactive
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`flex items-start justify-between ${isSelected ? 'border-blue-500 bg-blue-600/10' : ''}`}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-200 text-xs">{tmpl.name}</div>
                        <div className="text-[11px] text-gray-400">{tmpl.description}</div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tmpl.tags.map((tag) => (
                            <Badge key={tag} tone="neutral" className="normal-case">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-1" aria-hidden="true" />}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#2b303d]">
            <Button variant="primary" onClick={() => setStep(2)}>
              <span>Next: Architecture Style</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
  );
}
