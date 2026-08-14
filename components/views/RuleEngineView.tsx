'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Code,
  Sparkles,
  Plus,
  Power,
  Trash2,
  Edit3,
  Download,
  Search,
  Wrench,
  X,
  Play,
  Check,
  Zap,
} from 'lucide-react';
import { RuleSet, Rule, Blueprint } from '../../types/factory';
import { RuleService, RuleValidationReport, RuleViolation } from '../../services/ruleService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';

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
  const activeRuleSet =
    (blueprint && ruleSets.find((rs) => rs.id === blueprint.ruleSetId)) ||
    ruleSets[0] || { id: 'ruleset-clean-arch', name: 'Default Ruleset', description: '', rules: [] };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rule Set container management (Phase 2b, see PLAN.md)
  const [isRuleSetModalOpen, setIsRuleSetModalOpen] = useState<boolean>(false);
  const [newRuleSetName, setNewRuleSetName] = useState<string>('');
  const [newRuleSetDescription, setNewRuleSetDescription] = useState<string>('');

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

  const handleSwitchRuleSet = (ruleSetId: string) => {
    if (blueprint && setSelectedBlueprint) {
      const updatedBlueprint = { ...blueprint, ruleSetId };
      setSelectedBlueprint(updatedBlueprint);
      const rs = ruleSets.find((r) => r.id === ruleSetId);
      if (rs) {
        setValidationReport(RuleService.validateBlueprint(updatedBlueprint, rs));
      }
    }
  };

  const handleOpenCreateRuleSet = () => {
    setNewRuleSetName('');
    setNewRuleSetDescription('');
    setIsRuleSetModalOpen(true);
  };

  const handleCreateRuleSet = () => {
    if (!newRuleSetName.trim()) {
      alert('Please provide a name for the new Rule Set.');
      return;
    }
    const created = RuleService.createRuleSet(newRuleSetName, newRuleSetDescription);
    const updatedSets = RuleService.getRuleSets();
    setRuleSets(updatedSets);
    setIsRuleSetModalOpen(false);
    handleSwitchRuleSet(created.id);
  };

  const handleDeleteRuleSet = (ruleSetId: string) => {
    if (ruleSets.length <= 1) {
      alert('At least one Rule Set must remain.');
      return;
    }
    if (!confirm('Delete this Rule Set? Its rules cannot be recovered.')) return;
    RuleService.deleteRuleSet(ruleSetId);
    const updatedSets = RuleService.getRuleSets();
    setRuleSets(updatedSets);
    if (blueprint?.ruleSetId === ruleSetId && updatedSets[0]) {
      handleSwitchRuleSet(updatedSets[0].id);
    }
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
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Policy Engine</Badge>
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
          <Button onClick={handleRunValidation} className="shrink-0">
            <Play className="w-3.5 h-3.5" /> Run Real-time Validation
          </Button>
          <Button variant="primary" onClick={handleOpenAddModal} className="shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add Custom Rule
          </Button>
          <Button
            variant="secondary"
            onClick={() => openAIRefactor('Evaluate architecture rules. Suggest 3 additional enterprise security and maintainability rules.')}
            className="shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Rule Generator
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPolicy}
            title="Export Ruleset JSON"
            aria-label="Export Ruleset JSON"
            className="border border-[#2b303d]"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </Card>

      {/* Rule Set Container Switcher */}
      <Card className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] text-gray-400 font-semibold shrink-0">Active Rule Set:</span>
          <Select
            value={activeRuleSet.id}
            onChange={(e) => handleSwitchRuleSet(e.target.value)}
            disabled={!blueprint || !setSelectedBlueprint}
            className="flex-1"
          >
            {ruleSets.map((rs) => (
              <option key={rs.id} value={rs.id}>
                {rs.name} ({rs.rules.length} rules)
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleOpenCreateRuleSet}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> New Rule Set
          </Button>
          {ruleSets.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteRuleSet(activeRuleSet.id)}
              aria-label={`Delete rule set ${activeRuleSet.name}`}
              className="border border-[#2b303d] hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </Card>

      {/* Real-time Validation Report Card */}
      {validationReport && (
        <Card className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#2b303d]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${validationReport.failedCount > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {validationReport.failedCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Architecture Compliance Audit Report</span>
                  {validationReport.failedCount === 0 ? (
                    <Badge tone="success">100% Pass</Badge>
                  ) : (
                    <Badge tone="danger">{validationReport.failedCount} Violation(s)</Badge>
                  )}
                </div>
                <div className="text-gray-400 text-xs mt-0.5 font-mono">
                  Evaluated {validationReport.evaluatedCount} rules against &quot;{blueprint?.name || 'Current Solution'}&quot;
                </div>
              </div>
            </div>

            {/* Audit Score Summary Badges */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Badge tone="success" className="normal-case">
                <Check className="w-3 h-3" /> {validationReport.passedCount} Passed
              </Badge>
              {validationReport.errorCount > 0 && (
                <Badge tone="danger" className="normal-case">
                  <ShieldAlert className="w-3 h-3" /> {validationReport.errorCount} Errors
                </Badge>
              )}
              {validationReport.warningCount > 0 && (
                <Badge tone="warning" className="normal-case">
                  <AlertTriangle className="w-3 h-3" /> {validationReport.warningCount} Warnings
                </Badge>
              )}
            </div>
          </div>

          {/* List of Violations */}
          {validationReport.violations.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-gray-300">Detected Policy Violations & Recommended Remediation:</div>
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {validationReport.violations.map((violation, idx) => (
                  <div key={idx} className="p-3 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge tone={violation.severity === 'error' ? 'danger' : 'warning'}>{violation.severity}</Badge>
                          <span className="font-semibold text-white text-xs">{violation.ruleName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">[{violation.target}]</span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{violation.message}</p>
                      </div>

                      {violation.canAutoFix && (
                        <Button
                          size="sm"
                          onClick={() => handleAutoFixViolation(violation)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 shrink-0"
                        >
                          <Wrench className="w-3 h-3 text-blue-400" /> Auto-Fix Policy
                        </Button>
                      )}
                    </div>

                    <div className="p-2 bg-[#12141a] border border-[#2b303d] rounded text-[11px] text-emerald-300 font-mono">
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
        </Card>
      )}

      {/* Filter Tabs & Search Bar */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  : 'bg-[#1c2029] text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </Card>

      {/* Rules List Grid */}
      <div className="space-y-3">
        {filteredRules.length === 0 && (
          <div className="text-center py-10 space-y-1 text-gray-500">
            <p className="text-xs">No rules match &quot;{searchQuery}&quot;.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {filteredRules.map((rule) => (
          <Card key={rule.id} className={`space-y-3 ${!rule.isEnabled ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-100 text-sm">{rule.name}</span>
                  <Badge tone={rule.severity === 'error' ? 'danger' : rule.severity === 'warning' ? 'warning' : 'brand'}>
                    {rule.severity}
                  </Badge>
                  <Badge tone="neutral" className="normal-case">Category: {rule.category}</Badge>
                  <span className="text-[10px] font-mono text-gray-500">{rule.id}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{rule.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                  className={
                    rule.isEnabled
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : ''
                  }
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{rule.isEnabled ? 'Enabled' : 'Disabled'}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEditModal(rule)}
                  title="Edit Rule"
                  aria-label={`Edit rule ${rule.name}`}
                  className="border border-[#2b303d]"
                >
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete Rule"
                  aria-label={`Delete rule ${rule.name}`}
                  className="border border-[#2b303d] hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Expression Box & Remediation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#2b303d]">
              <div className="p-2.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-1 font-mono">
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Code className="w-3 h-3 text-blue-400" />
                  <span>Rule Expression (Declarative Policy)</span>
                </div>
                <div className="text-blue-300 text-[11px]">{rule.expression}</div>
              </div>

              <div className="p-2.5 bg-[#13151b] border border-[#2b303d] rounded-lg space-y-1">
                <div className="text-[10px] text-emerald-400 font-semibold">Remediation Guidance</div>
                <div className="text-gray-300 text-[11px]">{rule.remediation}</div>
              </div>
            </div>
          </Card>
        ))}

        {filteredRules.length === 0 && (
          <Card className="text-center py-12 text-gray-400">
            No architecture rules found matching your query or filter category.
          </Card>
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
                    className="px-2 py-1 bg-[#1c2029] hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-[#2e3340] rounded text-[10px] font-mono cursor-pointer transition-colors"
                  >
                    + {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Rule Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Domain Cannot Reference Infrastructure"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                  <Select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value as typeof ruleCategory)}
                  >
                    <option value="dependency">Dependency</option>
                    <option value="code-standard">Code Standard</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="naming">Naming</option>
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Severity</label>
                  <Select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as typeof ruleSeverity)}
                  >
                    <option value="error">Error (Blocking)</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Rule Expression (Declarative Policy)</label>
              <Input
                type="text"
                placeholder='e.g. Projects["Domain"].References.Includes("Infrastructure") == false'
                value={ruleExpression}
                onChange={(e) => setRuleExpression(e.target.value)}
                className="font-mono text-blue-300"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Description</label>
              <Textarea
                rows={2}
                placeholder="Explain the architectural rationale behind this rule..."
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Remediation Guidance</label>
              <Input
                type="text"
                placeholder="Steps developers must take to fix violations of this rule..."
                value={ruleRemediation}
                onChange={(e) => setRuleRemediation(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsRuleModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRule}>
                Save Policy Rule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Set Modal */}
      {isRuleSetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                Create New Rule Set
              </span>
              <button
                onClick={() => setIsRuleSetModalOpen(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Rule Set Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Fintech Compliance Policy"
                  value={newRuleSetName}
                  onChange={(e) => setNewRuleSetName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <Textarea
                  rows={2}
                  placeholder="What this rule set enforces..."
                  value={newRuleSetDescription}
                  onChange={(e) => setNewRuleSetDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsRuleSetModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateRuleSet}>
                Create Rule Set
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
