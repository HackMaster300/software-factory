'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Code,
  Sparkles,
  Plus,
  Power,
  Trash2,
  Edit3,
  Download,
  Upload,
  Search,
  Filter,
  Wrench,
  X,
  Play,
  Check,
  Zap,
} from 'lucide-react';
import { RuleSet, Rule, Blueprint } from '../../types/factory';
import { RuleService, RuleValidationReport, RuleViolation } from '../../services/ruleService';

interface RuleEngineViewProps {
  openAIRefactor: (prompt: string) => void;
  blueprint?: Blueprint;
  setSelectedBlueprint?: (bp: Blueprint) => void;
}

const PRESET_RULE_TEMPLATES: Array<Omit<Rule, 'id' | 'isEnabled'>> = [
  {
    name: 'Domain Cannot Reference Infrastructure',
    description: 'Domain layer must remain purely POCO/Entities without external framework dependencies.',
    category: 'dependency',
    severity: 'error',
    expression: 'Projects["Domain"].References.Includes("Infrastructure") == false',
    remediation: 'Remove ProjectReference to Infrastructure from Domain.csproj and use interfaces in Application layer.',
  },
  {
    name: 'Controllers Inherit BaseApiController',
    description: 'All API Controllers must extend the enterprise BaseApiController to enforce unified error handling and route logging.',
    category: 'code-standard',
    severity: 'error',
    expression: 'Controllers.All(c => c.BaseClass == "BaseApiController")',
    remediation: 'Inherit from BaseApiController instead of ControllerBase.',
  },
  {
    name: 'Repositories Must Be Interfaces in Application/Core',
    description: 'Data repositories must define interfaces in Core/Application and implementations in Infrastructure.',
    category: 'dependency',
    severity: 'error',
    expression: 'Repositories.InterfacesIn("Application") && Repositories.ImplementationsIn("Infrastructure")',
    remediation: 'Define IRepository<T> in Core and implement Repository<T> in Infrastructure.',
  },
  {
    name: 'Prohibit System DateTime.Now',
    description: 'System.DateTime.Now breaks unit test determinism. Mandatory use of TimeProvider or IDateTimeService.',
    category: 'code-standard',
    severity: 'warning',
    expression: 'Code.Contains("DateTime.Now") == false',
    remediation: 'Inject TimeProvider or ITimeProvider instead of calling DateTime.Now directly.',
  },
  {
    name: 'No Direct Console Output',
    description: 'Console.WriteLine bypasses structured log formatters and tracing correlation IDs.',
    category: 'security',
    severity: 'warning',
    expression: 'Code.Contains("Console.WriteLine") == false',
    remediation: 'Inject ILogger<T> and call _logger.LogInformation(...) instead.',
  },
  {
    name: 'Health Check Endpoint Mandatory for Docker',
    description: 'Containers deployed without health check probes risk silent failures in Kubernetes / Cloud Run.',
    category: 'performance',
    severity: 'error',
    expression: 'FeatureActive("feat-docker") => FeatureActive("feat-healthchecks")',
    remediation: 'Activate the Health Checks & Diagnostics feature manifest.',
  },
  {
    name: 'Mandatory Environment Variables Provider',
    description: 'Enforces Twelve-Factor configuration isolation by requiring environment variable binding.',
    category: 'security',
    severity: 'error',
    expression: 'FeatureActive("feat-env-vars")',
    remediation: 'Enable the Environment Variables Config Provider manifest.',
  },
  {
    name: 'Secrets Vault Required for Databases',
    description: 'Production database instances must retrieve credentials from HashiCorp Vault / Secrets Manager.',
    category: 'security',
    severity: 'warning',
    expression: 'FeatureActive("feat-db") => FeatureActive("feat-secrets")',
    remediation: 'Activate HashiCorp Vault / KeyVault feature manifest.',
  },
];

export const RuleEngineView: React.FC<RuleEngineViewProps> = ({
  openAIRefactor,
  blueprint,
  setSelectedBlueprint,
}) => {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>(RuleService.getRuleSets());
  const activeRuleSet = ruleSets[0] || { id: 'ruleset-clean-arch', name: 'Default Ruleset', description: '', rules: [] };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Form state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleName, setRuleName] = useState<string>('');
  const [ruleDescription, setRuleDescription] = useState<string>('');
  const [ruleCategory, setRuleCategory] = useState<'dependency' | 'naming' | 'security' | 'code-standard' | 'performance'>('dependency');
  const [ruleSeverity, setRuleSeverity] = useState<'error' | 'warning' | 'info'>('error');
  const [ruleExpression, setRuleExpression] = useState<string>('');
  const [ruleRemediation, setRuleRemediation] = useState<string>('');

  // Validation report state
  const [validationReport, setValidationReport] = useState<RuleValidationReport | null>(
    blueprint ? RuleService.validateBlueprint(blueprint, activeRuleSet) : null
  );

  const handleToggleRule = (ruleId: string, currentStatus: boolean) => {
    RuleService.toggleRule(activeRuleSet.id, ruleId, !currentStatus);
    const updatedSets = RuleService.getRuleSets();
    setRuleSets(updatedSets);
    if (blueprint) {
      setValidationReport(RuleService.validateBlueprint(blueprint, updatedSets[0]));
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule policy?')) {
      RuleService.deleteRule(activeRuleSet.id, ruleId);
      const updatedSets = RuleService.getRuleSets();
      setRuleSets(updatedSets);
      if (blueprint) {
        setValidationReport(RuleService.validateBlueprint(blueprint, updatedSets[0]));
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setRuleName('');
    setRuleDescription('');
    setRuleCategory('dependency');
    setRuleSeverity('error');
    setRuleExpression('');
    setRuleRemediation('');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditModal = (rule: Rule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleDescription(rule.description);
    setRuleCategory(rule.category);
    setRuleSeverity(rule.severity);
    setRuleExpression(rule.expression);
    setRuleRemediation(rule.remediation);
    setIsRuleModalOpen(true);
  };

  const handleSelectPreset = (template: Omit<Rule, 'id' | 'isEnabled'>) => {
    setRuleName(template.name);
    setRuleDescription(template.description);
    setRuleCategory(template.category);
    setRuleSeverity(template.severity);
    setRuleExpression(template.expression);
    setRuleRemediation(template.remediation);
  };

  const handleSaveRule = () => {
    if (!ruleName.trim() || !ruleExpression.trim()) {
      alert('Please fill in Rule Name and Rule Expression.');
      return;
    }

    const ruleId = editingRule ? editingRule.id : `rule-custom-${Date.now()}`;
    const ruleObj: Rule = {
      id: ruleId,
      name: ruleName.trim(),
      description: ruleDescription.trim() || 'Custom architecture rule constraint.',
      category: ruleCategory,
      severity: ruleSeverity,
      expression: ruleExpression.trim(),
      isEnabled: editingRule ? editingRule.isEnabled : true,
      remediation: ruleRemediation.trim() || 'Review solution dependencies and apply proper abstractions.',
    };

    if (editingRule) {
      RuleService.saveRule(activeRuleSet.id, ruleObj);
    } else {
      RuleService.addRule(activeRuleSet.id, ruleObj);
    }

    const updatedSets = RuleService.getRuleSets();
    setRuleSets(updatedSets);
    setIsRuleModalOpen(false);

    if (blueprint) {
      setValidationReport(RuleService.validateBlueprint(blueprint, updatedSets[0]));
    }
  };

  const handleRunValidation = () => {
    if (blueprint) {
      const report = RuleService.validateBlueprint(blueprint, activeRuleSet);
      setValidationReport(report);
    }
  };

  const handleAutoFixViolation = (violation: RuleViolation) => {
    if (!blueprint || !setSelectedBlueprint) return;

    if (violation.autoFixType === 'remove_reference' && violation.autoFixData) {
      const { fromProjectId, toProjectId } = violation.autoFixData;
      const updatedProjects = blueprint.projects.map((p) => {
        if (p.id === fromProjectId) {
          return {
            ...p,
            references: p.references.filter((r) => r !== toProjectId),
          };
        }
        return p;
      });

      const updatedBlueprint = { ...blueprint, projects: updatedProjects };
      setSelectedBlueprint(updatedBlueprint);
      setValidationReport(RuleService.validateBlueprint(updatedBlueprint, activeRuleSet));
    } else if (violation.autoFixType === 'enable_feature' && violation.autoFixData) {
      const { featureId } = violation.autoFixData;
      if (featureId && !blueprint.featureIds.includes(featureId)) {
        const updatedBlueprint = {
          ...blueprint,
          featureIds: [...blueprint.featureIds, featureId],
        };
        setSelectedBlueprint(updatedBlueprint);
        setValidationReport(RuleService.validateBlueprint(updatedBlueprint, activeRuleSet));
      }
    }
  };

  const handleExportPolicy = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeRuleSet, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `architecture-policy-${activeRuleSet.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredRules = activeRuleSet.rules.filter((rule) => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.expression.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-semibold">
              Policy Engine
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">
              {activeRuleSet.rules.filter((r) => r.isEnabled).length} / {activeRuleSet.rules.length} Active Rules
            </span>
            {blueprint && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-blue-400 font-mono text-[11px]">Evaluating: {blueprint.name}</span>
              </>
            )}
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Architecture Rule Engine & Declarative Policies</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunValidation}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Play className="w-3.5 h-3.5" /> Run Real-time Validation
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Rule
          </button>
          <button
            onClick={() => openAIRefactor('Evaluate architecture rules. Suggest 3 additional enterprise security and maintainability rules.')}
            className="px-3 py-1.5 bg-[#202430] hover:bg-[#282d3d] text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Rule Generator
          </button>
          <button
            onClick={handleExportPolicy}
            title="Export Ruleset JSON"
            aria-label="Export Ruleset JSON"
            className="p-2 bg-[#202430] hover:bg-[#282d3d] text-gray-300 border border-[#303748] rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Real-time Validation Report Card */}
      {validationReport && (
        <div className="bg-[#141720] border border-[#2b3142] rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#252b3b]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${validationReport.failedCount > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {validationReport.failedCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Architecture Compliance Audit Report</span>
                  {validationReport.failedCount === 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">100% PASS</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono">
                      {validationReport.failedCount} VIOLATION(S)
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-xs mt-0.5 font-mono">
                  Evaluated {validationReport.evaluatedCount} rules against &quot;{blueprint?.name || 'Current Solution'}&quot;
                </div>
              </div>
            </div>

            {/* Audit Score Summary Badges */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 rounded flex items-center gap-1">
                <Check className="w-3 h-3" /> {validationReport.passedCount} Passed
              </span>
              {validationReport.errorCount > 0 && (
                <span className="px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-800/50 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> {validationReport.errorCount} Errors
                </span>
              )}
              {validationReport.warningCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-950/40 text-amber-400 border border-amber-800/50 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {validationReport.warningCount} Warnings
                </span>
              )}
            </div>
          </div>

          {/* List of Violations */}
          {validationReport.violations.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-gray-300">Detected Policy Violations & Recommended Remediation:</div>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {validationReport.violations.map((violation, idx) => (
                  <div key={idx} className="p-3 bg-[#1a1e2b] border border-[#2b3142] rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded border ${
                            violation.severity === 'error' ? 'bg-red-950/50 text-red-400 border-red-800/50' : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                          }`}>
                            {violation.severity}
                          </span>
                          <span className="font-semibold text-white text-xs">{violation.ruleName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">[{violation.target}]</span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{violation.message}</p>
                      </div>

                      {violation.canAutoFix && (
                        <button
                          onClick={() => handleAutoFixViolation(violation)}
                          className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-[10px] font-mono font-medium cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Wrench className="w-3 h-3 text-blue-400" /> Auto-Fix Policy
                        </button>
                      )}
                    </div>

                    <div className="p-2 bg-[#12141c] border border-[#232736] rounded text-[11px] text-emerald-300 font-mono">
                      <strong>Remediation:</strong> {violation.remediation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-emerald-400 font-mono text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All active architecture rules pass cleanly against the current blueprint graph.
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#181a20] border border-[#2b303d] rounded-xl p-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Rules' },
            { id: 'dependency', label: 'Dependency Isolation' },
            { id: 'code-standard', label: 'Code Standards' },
            { id: 'security', label: 'Security Policies' },
            { id: 'performance', label: 'Performance' },
            { id: 'naming', label: 'Naming' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#222734] text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141a] border border-[#2b303d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Rules List Grid */}
      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-[#181a20] border rounded-xl p-4 transition-all space-y-3 ${
              rule.isEnabled ? 'border-[#2b303d] hover:border-gray-500' : 'border-[#202430] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-100 text-sm">{rule.name}</span>

                  {/* Severity Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${
                      rule.severity === 'error'
                        ? 'bg-red-950/40 text-red-400 border-red-800/50'
                        : rule.severity === 'warning'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                        : 'bg-blue-950/40 text-blue-400 border-blue-800/50'
                    }`}
                  >
                    {rule.severity}
                  </span>

                  <span className="px-2 py-0.5 rounded bg-[#232838] text-gray-300 font-mono text-[10px]">
                    Category: {rule.category}
                  </span>

                  <span className="text-[10px] font-mono text-gray-500">{rule.id}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{rule.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    rule.isEnabled
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#222734] text-gray-400 border border-[#303748]'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{rule.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(rule)}
                  title="Edit Rule"
                  aria-label={`Edit rule ${rule.name}`}
                  className="p-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 border border-[#303748] rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete Rule"
                  aria-label={`Delete rule ${rule.name}`}
                  className="p-1.5 bg-[#222734] hover:bg-red-900/40 text-red-400 border border-[#303748] hover:border-red-800/50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expression Box & Remediation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#262a36]">
              <div className="p-2.5 bg-[#12141a] border border-[#252834] rounded-lg space-y-1 font-mono">
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Code className="w-3 h-3 text-blue-400" />
                  <span>Rule Expression (Declarative Policy)</span>
                </div>
                <div className="text-blue-300 text-[11px]">{rule.expression}</div>
              </div>

              <div className="p-2.5 bg-[#12141a] border border-[#252834] rounded-lg space-y-1">
                <div className="text-[10px] text-emerald-400 font-semibold">Remediation Guidance</div>
                <div className="text-gray-300 text-[11px]">{rule.remediation}</div>
              </div>
            </div>
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="text-center py-12 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-400">
            No architecture rules found matching your query or filter category.
          </div>
        )}
      </div>

      {/* Visual Rule Builder Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{editingRule ? 'Edit Architecture Policy Rule' : 'Create Custom Architecture Rule'}</span>
              </div>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets Selector Quick-Add */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 block">Quick Preset Catalog (Click to Auto-fill):</label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {PRESET_RULE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(tmpl)}
                    className="px-2 py-1 bg-[#222734] hover:bg-blue-600/30 text-gray-300 hover:text-blue-300 border border-[#303748] rounded text-[10px] font-mono cursor-pointer transition-colors"
                  >
                    + {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Domain Cannot Reference Infrastructure"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                  <select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value as any)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="dependency">Dependency</option>
                    <option value="code-standard">Code Standard</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="naming">Naming</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Severity</label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="error">Error (Blocking)</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Rule Expression (Declarative Policy)</label>
              <input
                type="text"
                placeholder='e.g. Projects["Domain"].References.Includes("Infrastructure") == false'
                value={ruleExpression}
                onChange={(e) => setRuleExpression(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Explain the architectural rationale behind this rule..."
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Remediation Guidance</label>
              <input
                type="text"
                placeholder="Steps developers must take to fix violations of this rule..."
                value={ruleRemediation}
                onChange={(e) => setRuleRemediation(e.target.value)}
                className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
              >
                Save Policy Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

