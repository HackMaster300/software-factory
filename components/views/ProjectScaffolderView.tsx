'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  FolderGit2,
  Folder,
  File,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  ShieldCheck,
  Sparkles,
  Code2,
  Trash2,
  Plus,
  Settings,
  Key,
  FileText,
  GitFork,
  Link2,
  ShieldAlert,
  Download,
  Package,
  ExternalLink,
  Copy,
  TerminalSquare,
  Laptop,
  Monitor,
  X,
  FolderCheck,
  GitBranch,
  Globe,
} from 'lucide-react';
import { Blueprint, Project, ArchitectureStyle } from '../../types/factory';
import { ProjectService, SolutionTreeNode } from '../../services/projectService';
import { StorageService } from '../../services/storageService';
import { DecisionService } from '../../services/decisionService';
import { AdvisorService } from '../../services/advisorService';
import { BlueprintService } from '../../services/blueprintService';
import { RuleService } from '../../services/ruleService';
import { AIService } from '../../services/aiService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';

function checkCausesCircularDependency(
  projects: Array<{ id: string; references: string[] }>,
  fromProjId: string,
  toProjId: string
): boolean {
  if (fromProjId === toProjId) return true;
  const visited = new Set<string>();
  const queue = [toProjId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === fromProjId) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const proj = projects.find((p) => p.id === curr);
    if (proj && proj.references) {
      for (const refId of proj.references) {
        if (!visited.has(refId)) {
          queue.push(refId);
        }
      }
    }
  }

  return false;
}

interface ProjectScaffolderViewProps {
  blueprint: Blueprint;
  setSelectedBlueprint?: (bp: Blueprint) => void;
  setActiveView: (view: string) => void;
  openAIRefactor: (prompt: string) => void;
}

export const ProjectScaffolderView: React.FC<ProjectScaffolderViewProps> = ({
  blueprint: initialBlueprint,
  setSelectedBlueprint,
  setActiveView,
  openAIRefactor,
}) => {
  const [step, setStep] = useState<number>(1);
  const [projectName, setProjectName] = useState<string>('Acme.PaymentEngine');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-clean-dotnet9');
  const [selectedFileNode, setSelectedFileNode] = useState<SolutionTreeNode | null>(null);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  const templates = StorageService.getTemplates();
  const techStacks = StorageService.getTechStacks();

  // User-modifiable blueprint state for complete autonomy
  const [editableBlueprint, setEditableBlueprint] = useState<Blueprint>(() => {
    const stackId = initialBlueprint.techStackId || 'stack-dotnet9';
    const style = initialBlueprint.architectureStyle || 'CleanArchitecture';
    const projects =
      initialBlueprint.projects &&
      initialBlueprint.projects.length > 0 &&
      (stackId === 'stack-dotnet9' || !initialBlueprint.projects.some((p) => p.name.startsWith('App.')))
        ? initialBlueprint.projects
        : BlueprintService.getProjectsForTechStackAndArchStyle(stackId, style);

    return {
      ...initialBlueprint,
      projects,
    };
  });

  // Environment configuration state
  const [useEnvFile, setUseEnvFile] = useState<boolean>(true);
  const [projectDescription, setProjectDescription] = useState<string>(
    editableBlueprint.description ||
      'Sistema de Pagamentos e Gateway Financeiro com Autenticação JWT, Persistência PostgreSQL/EF Core, Caching Redis, Filas Assíncronas RabbitMQ, Serilog e Swagger.'
  );
  const [isAnalyzingAiPackages, setIsAnalyzingAiPackages] = useState<boolean>(false);
  const [aiPackageAnalysisText, setAiPackageAnalysisText] = useState<string | null>(null);

  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string; description: string }>>([
    { key: 'PORT', value: '5000', description: 'HTTP Server Listening Port' },
    { key: 'DATABASE_URL', value: 'postgresql://admin:secret@localhost:5432/factory_db', description: 'Primary Database Connection' },
    { key: 'JWT_SECRET', value: 'super-secret-jwt-key-32-chars-long!', description: 'Token Signing Secret' },
    { key: 'REDIS_URL', value: 'redis://localhost:6379', description: 'Cache Host' },
    { key: 'LOG_LEVEL', value: 'Information', description: 'Logging Verbosity' },
  ]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [newEnvDesc, setNewEnvDesc] = useState('');

  // Module / .csproj creation state
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleType, setNewModuleType] = useState<'Core' | 'Application' | 'Infrastructure' | 'API' | 'Worker' | 'Tests' | 'UI'>('Worker');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModuleReferences, setNewModuleReferences] = useState<string[]>([]);
  const [editingRefProjId, setEditingRefProjId] = useState<string | null>(null);

  // Package Manager per module state (NuGet / npm / Crates)
  const [editingPkgProjId, setEditingPkgProjId] = useState<string | null>(null);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgVer, setNewPkgVer] = useState('');

  // ZIP Download state
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // IDE Direct Export & Integration Modal state
  const [showIdeExportModal, setShowIdeExportModal] = useState(false);
  const [copiedCmdText, setCopiedCmdText] = useState<string | null>(null);
  const [directDiskStatus, setDirectDiskStatus] = useState<'idle' | 'writing' | 'success' | 'iframe_blocked' | 'error'>('idle');
  const [writtenFilesCount, setWrittenFilesCount] = useState<number>(0);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmdText(text);
    setTimeout(() => setCopiedCmdText(null), 2000);
  };

  const [localPathInput, setLocalPathInput] = useState<string>(`C:\\Projects\\${projectName}`);

  const formatVSCodePath = (rawPath: string) => {
    let clean = rawPath.trim();
    if (!clean) return '';
    // Replace backslashes with forward slashes
    clean = clean.replace(/\\/g, '/');
    // Remove leading slashes if Windows path like /C:/
    if (/^\/[a-zA-Z]:/.test(clean)) {
      clean = clean.substring(1);
    }
    // Encode spaces and special chars
    return encodeURI(clean);
  };

  const handleExportDirectToDisk = async (autoLaunchVSCode: boolean = false) => {
    try {
      if (window.self !== window.top) {
        // If embedded in preview iframe, show directory picker explanation & new tab button
        setDirectDiskStatus('iframe_blocked');
        return;
      }

      if (!('showDirectoryPicker' in window)) {
        alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or Brave, or use the ZIP download option.');
        return;
      }
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folderName = dirHandle.name;
      setSelectedFolderName(folderName);
      setDirectDiskStatus('writing');

      const count = await ProjectService.exportDirectToDisk(solutionPreview.solutionTree, dirHandle);
      setWrittenFilesCount(count);
      setDirectDiskStatus('success');

      // Update localPathInput with the selected folder name so it matches user choice
      let currentPath = localPathInput.trim();
      let updatedPath = currentPath;

      if (!currentPath || (!currentPath.includes(':') && !currentPath.startsWith('/'))) {
        updatedPath = `C:\\Projects\\${folderName}`;
      } else {
        const cleanPath = currentPath.replace(/[\\/]+$/, '');
        const sep = cleanPath.includes('/') ? '/' : '\\';
        const parts = cleanPath.split(/[\\/]/);
        if (parts.length > 0) {
          parts[parts.length - 1] = folderName;
          updatedPath = parts.join(sep);
        } else {
          updatedPath = `C:\\${folderName}`;
        }
      }
      setLocalPathInput(updatedPath);

      if (autoLaunchVSCode) {
        const formattedPath = formatVSCodePath(updatedPath);
        if (formattedPath) {
          window.open(`vscode://file/${formattedPath}`, '_self');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setDirectDiskStatus('idle');
      } else if (err.name === 'SecurityError' || err.message?.includes('sub frames') || err.message?.includes('Cross origin')) {
        setDirectDiskStatus('iframe_blocked');
      } else {
        console.error(err);
        setDirectDiskStatus('error');
      }
    }
  };

  const handleLaunchVSCodeDirectly = () => {
    let path = localPathInput.trim();
    if (!path) {
      path = `C:\\Projects\\${selectedFolderName || projectName}`;
      setLocalPathInput(path);
    }
    const formattedPath = formatVSCodePath(path);
    if (formattedPath) {
      window.open(`vscode://file/${formattedPath}`, '_self');
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const activeTechStack = techStacks.find((s) => s.id === editableBlueprint.techStackId) || techStacks[0];

  // Real-time Rule Engine Guardrails evaluation
  const defaultRuleSet = RuleService.getRuleSets()[0];
  const ruleReport = RuleService.validateBlueprint(editableBlueprint, defaultRuleSet);

  // Dynamic real-time score calculation based on current user autonomy choices
  const liveScores = AdvisorService.calculateScores(editableBlueprint);
  const solutionPreview = ProjectService.generateSolutionPreview(editableBlueprint, projectName, useEnvFile, envVars);

  // Dynamic calculation of suggested packages based on project operational description
  const suggestedPackages = BlueprintService.suggestPackagesFromDescription(
    projectDescription,
    activeTechStack.language,
    editableBlueprint.projects
  );

  const handleApplyAllSuggestedPackages = () => {
    if (suggestedPackages.length === 0) return;

    let updatedProjects = [...editableBlueprint.projects];

    suggestedPackages.forEach((sug) => {
      // Find target project module by ID or Type
      let targetProj =
        updatedProjects.find((p) => p.id === sug.targetModuleId) ||
        updatedProjects.find((p) => p.type === sug.targetModuleType) ||
        updatedProjects[0];

      if (targetProj) {
        const existingPkgs = targetProj.packages || [];
        if (!existingPkgs.some((pkg) => pkg.name.toLowerCase() === sug.packageName.toLowerCase())) {
          const nextPkgs = [
            ...existingPkgs,
            { name: sug.packageName, version: sug.version, packageManager: activeTechStack.packageManager },
          ];
          updatedProjects = updatedProjects.map((p) => (p.id === targetProj.id ? { ...p, packages: nextPkgs } : p));
        }
      }
    });

    const updated = {
      ...editableBlueprint,
      description: projectDescription,
      projects: updatedProjects,
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handleAnalyzePackagesWithAi = async () => {
    try {
      setIsAnalyzingAiPackages(true);
      setAiPackageAnalysisText(null);

      const prompt = `Análise de Arquitetura de Software:
Descrição do Funcionamento do Projeto: "${projectDescription}"
Linguagem / Stack Técnica: ${activeTechStack.name} (${activeTechStack.language})
Módulos da Solução Atual: ${editableBlueprint.projects.map((p) => `${p.name} (${p.type})`).join(', ')}

Por favor, forneça uma lista detalhada dos pacotes/dependências mais importantes recomendados para este funcionamento, explicando a finalidade de cada um e em qual camada da arquitetura (Core, Application, Infrastructure, API, Worker) deve ser adicionado.`;

      const result = await AIService.requestAnalysis(prompt, 'Software Architect & Package Advisor');
      setAiPackageAnalysisText(result.text);

      // Also apply suggested packages automatically
      handleApplyAllSuggestedPackages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingAiPackages(false);
    }
  };

  const handleAddPackageToProj = (projId: string, pkgName: string, pkgVer: string) => {
    if (!pkgName.trim()) return;
    const updatedProjects = editableBlueprint.projects.map((p) => {
      if (p.id === projId) {
        const existing = p.packages || [];
        const nextPkgs = [...existing.filter((x) => x.name !== pkgName.trim()), { name: pkgName.trim(), version: pkgVer.trim() || '1.0.0' }];
        return { ...p, packages: nextPkgs };
      }
      return p;
    });
    const updated = { ...editableBlueprint, projects: updatedProjects };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
    setNewPkgName('');
    setNewPkgVer('');
  };

  const handleRemovePackageFromProj = (projId: string, pkgName: string) => {
    const updatedProjects = editableBlueprint.projects.map((p) => {
      if (p.id === projId) {
        return { ...p, packages: (p.packages || []).filter((x) => x.name !== pkgName) };
      }
      return p;
    });
    const updated = { ...editableBlueprint, projects: updatedProjects };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handleDownloadSolutionZip = async () => {
    try {
      setIsDownloadingZip(true);
      await ProjectService.downloadSolutionZip(solutionPreview.solutionTree, projectName);
    } catch (err) {
      console.error(err);
      alert('Failed to generate solution ZIP file.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) return;
    const formattedKey = newEnvKey.toUpperCase().trim().replace(/[^A-Z0-9_]/g, '_');
    setEnvVars((prev) => [
      ...prev.filter((v) => v.key !== formattedKey),
      { key: formattedKey, value: newEnvVal || 'default_value', description: newEnvDesc || 'Custom environment variable' },
    ]);
    setNewEnvKey('');
    setNewEnvVal('');
    setNewEnvDesc('');
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars((prev) => prev.filter((v) => v.key !== key));
  };

  const handleAddPresetEnv = (presetKey: string, defaultValue: string, desc: string) => {
    setEnvVars((prev) => [
      ...prev.filter((v) => v.key !== presetKey),
      { key: presetKey, value: defaultValue, description: desc },
    ]);
  };

  const handleToggleReference = (fromProjId: string, toProjId: string) => {
    const currentProj = editableBlueprint.projects.find((p) => p.id === fromProjId);
    const isCurrentlyReferenced = currentProj?.references.includes(toProjId);

    if (!isCurrentlyReferenced) {
      const causesCycle = checkCausesCircularDependency(editableBlueprint.projects, fromProjId, toProjId);
      if (causesCycle) {
        const targetName = editableBlueprint.projects.find((p) => p.id === toProjId)?.name;
        alert(`Cannot reference "${targetName}" from "${currentProj?.name}": adding this reference creates a circular dependency loop.`);
        return;
      }
    }

    const updatedProjects = editableBlueprint.projects.map((p) => {
      if (p.id === fromProjId) {
        const refs = new Set(p.references);
        if (refs.has(toProjId)) refs.delete(toProjId);
        else refs.add(toProjId);
        return { ...p, references: Array.from(refs) };
      }
      return p;
    });

    const updated = {
      ...editableBlueprint,
      projects: updatedProjects,
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handleAddCustomModule = () => {
    if (!newModuleName.trim()) return;
    // Module names are stored without a file extension everywhere in this
    // app (BlueprintsView's Solution Tree appends ".csproj" itself only at
    // render time), so no extension normalization belongs here.
    const nameWithExt = newModuleName.trim();

    const uniqueSuffix = editableBlueprint.projects.length + 1;
    const initialRefs = newModuleReferences.length > 0
      ? newModuleReferences
      : editableBlueprint.projects.length > 0 ? [editableBlueprint.projects[0].id] : [];

    const newModule = {
      id: `proj-custom-${uniqueSuffix}`,
      name: nameWithExt,
      type: newModuleType,
      description: newModuleDesc || `Custom ${newModuleType} module`,
      references: initialRefs,
    };

    const updated = {
      ...editableBlueprint,
      projects: [...editableBlueprint.projects, newModule],
    };

    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);

    setNewModuleName('');
    setNewModuleDesc('');
    setNewModuleReferences([]);
    setIsAddingModule(false);
  };

  const handleRemoveModule = (projId: string) => {
    if (editableBlueprint.projects.length <= 1) {
      alert('A solution must contain at least 1 project module.');
      return;
    }
    const updated = {
      ...editableBlueprint,
      projects: editableBlueprint.projects.filter((p) => p.id !== projId),
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handlePresetModuleCount = (count: number) => {
    const baseProjects = BlueprintService.getProjectsForTechStackAndArchStyle(
      editableBlueprint.techStackId,
      editableBlueprint.architectureStyle
    );

    let trimmed = baseProjects.slice(0, count);
    if (count > baseProjects.length) {
      const isDotnet = activeTechStack.language === 'csharp';
      const prefix = isDotnet ? projectName : 'src';
      if (count >= 4 && !trimmed.some((p) => p.type === 'Worker')) {
        trimmed.push({
          id: `proj-worker-${trimmed.length + 1}`,
          name: isDotnet ? `${prefix}.Worker` : `${prefix}/worker`,
          type: 'Worker',
          description: 'Background worker and scheduled queue processor module',
          references: [trimmed[0]?.id || 'core'],
        });
      }
      if (count >= 5 && !trimmed.some((p) => p.type === 'Tests')) {
        trimmed.push({
          id: `proj-tests-${trimmed.length + 1}`,
          name: isDotnet ? `${prefix}.UnitTests` : `${prefix}/tests`,
          type: 'Tests',
          description: 'Unit and integration testing suite module',
          references: [trimmed[0]?.id || 'core'],
        });
      }
    }

    const updated = {
      ...editableBlueprint,
      projects: trimmed,
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl && tmpl.blueprint) {
      const targetStackId = tmpl.blueprint.techStackId || 'stack-dotnet9';
      const targetStyle = tmpl.blueprint.architectureStyle || 'CleanArchitecture';
      const projects = tmpl.blueprint.projects && tmpl.blueprint.projects.length > 0
        ? tmpl.blueprint.projects
        : BlueprintService.getProjectsForTechStackAndArchStyle(targetStackId, targetStyle);

      const updated = {
        ...tmpl.blueprint,
        id: `bp-custom-${tmplId}`,
        projects,
      };
      setEditableBlueprint(updated);
      setSelectedBlueprint?.(updated);
    }
  };

  const handleSelectTechStack = (stackId: string) => {
    const stack = techStacks.find((s) => s.id === stackId);
    const newProjects = BlueprintService.getProjectsForTechStackAndArchStyle(
      stackId,
      editableBlueprint.architectureStyle
    );
    const updated: Blueprint = {
      ...editableBlueprint,
      techStackId: stackId,
      projects: newProjects,
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);

    if (stack) {
      const presets = ProjectService.getEnvPresetsForStack(stack.id, stack.language);
      setEnvVars(presets);
    }
  };

  const handleLoadStackEnvPresets = () => {
    const presets = ProjectService.getEnvPresetsForStack(activeTechStack.id, activeTechStack.language);
    setEnvVars(presets);
  };

  const handleSelectArchStyle = (style: ArchitectureStyle) => {
    const newProjects = BlueprintService.getProjectsForTechStackAndArchStyle(
      editableBlueprint.techStackId,
      style
    );
    const updated: Blueprint = {
      ...editableBlueprint,
      architectureStyle: style,
      projects: newProjects,
    };
    setEditableBlueprint(updated);
    setSelectedBlueprint?.(updated);
  };

  const handleSelectNode = (node: SolutionTreeNode) => {
    if (node.type === 'file') {
      setSelectedFileNode(node);
    }
  };

  const handleCompleteGeneration = () => {
    const slugStr = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProject: Project = {
      id: `proj-${slugStr}`,
      name: projectName,
      slug: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `Generated from ${activeTechStack.name} (${editableBlueprint.architectureStyle})`,
      organizationId: StorageService.getOrganizations()[0]?.id || '',
      workspaceId: StorageService.getWorkspaces()[0]?.id || '',
      templateId: selectedTemplateId,
      blueprint: editableBlueprint,
      status: 'generated',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      customConfig: {},
    };

    ProjectService.saveProject(newProject);

    DecisionService.addDecisionLog({
      projectId: newProject.id,
      decision: `Generated Production Solution '${projectName}' with ${activeTechStack.name}`,
      reason: `Custom autonomous architecture scaffolding using ${editableBlueprint.architectureStyle} and ${activeTechStack.framework}`,
      impact: `Scaffolding created ${solutionPreview.estimatedFileCount} files across ${solutionPreview.estimatedFolderCount} directories. Final Simulated Quality Score: ${liveScores.qualityScore}/100.`,
      warningsIgnored: [],
      aiRecommendations: liveScores.rationale[0]?.recommendations || [],
      userJustification: 'Validated autonomous tech stack and architecture parameters.',
      author: 'Lead Software Architect',
    });

    setIsGenerated(true);
  };

  const renderTree = (nodes: SolutionTreeNode[]) => {
    return (
      <div className="space-y-1 font-mono text-[11px]">
        {nodes.map((node) => {
          const isSelected = selectedFileNode?.id === node.id;
          return (
            <div key={node.id} className="pl-3">
              <div
                onClick={() => handleSelectNode(node)}
                className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-[#232836] hover:text-white'
                }`}
              >
                {node.type === 'folder' || node.type === 'project' ? (
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
              </div>

              {node.children && node.children.length > 0 && (
                <div className="border-l border-[#2e3446] ml-2 font-mono">
                  {renderTree(node.children)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Wizard Header Bar */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Autonomous Engineering Flow</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">Step {step} of 4</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Project Scaffolding & Solution Builder Wizard</h1>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { num: 1, name: 'Tech Stack & Name' },
            { num: 2, name: 'Architecture & Rules' },
            { num: 3, name: 'Scores & Profiles' },
            { num: 4, name: 'Preview & Generate' },
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
              <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Live Score Simulator
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
          <Card className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232838] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-100 text-xs">
                    Solution Project Modules Selection ({editableBlueprint.projects.length}{' '}
                    {activeTechStack.language === 'csharp' ? '.csproj' : activeTechStack.language === 'rust' ? 'crates' : 'modules'})
                  </h3>
                  <Badge tone="brand">{editableBlueprint.projects.length} Projects</Badge>
                </div>
                <p className="text-[11px] text-gray-400">
                  Select how many project modules / .csproj files to include or add custom ones tailored to your solution domain.
                </p>
              </div>

              {/* Preset Count Quick Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 mr-1 font-mono">Preset Count:</span>
                {[1, 2, 3, 4, 5].map((cnt) => (
                  <Button
                    key={cnt}
                    size="sm"
                    variant={editableBlueprint.projects.length === cnt ? 'primary' : 'secondary'}
                    onClick={() => handlePresetModuleCount(cnt)}
                  >
                    {cnt} {cnt === 1 ? 'Proj' : 'Projs'}
                  </Button>
                ))}
                <Button size="sm" variant="primary" onClick={() => setIsAddingModule(!isAddingModule)} className="ml-2">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Module</span>
                </Button>
              </div>
            </div>

            {/* Inline Module Adder */}
            {isAddingModule && (
              <Card className="border-blue-500/40 space-y-3 my-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 text-xs flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add New Solution Module / .csproj
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingModule(false)}>
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Module Name</label>
                    <Input
                      type="text"
                      placeholder={activeTechStack.language === 'csharp' ? `${projectName}.Worker` : 'src/worker'}
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Layer Type</label>
                    <Select value={newModuleType} onChange={(e) => setNewModuleType(e.target.value as any)}>
                      <option value="Core">Core (Entities & Interfaces)</option>
                      <option value="Application">Application (Use Cases)</option>
                      <option value="Infrastructure">Infrastructure (DB/Services)</option>
                      <option value="API">API (HTTP Controllers)</option>
                      <option value="Worker">Worker (Background Queue)</option>
                      <option value="Tests">Tests (Unit & Integration)</option>
                      <option value="UI">UI (Frontend App)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                    <Input
                      type="text"
                      placeholder="e.g., Background scheduled job consumer"
                      value={newModuleDesc}
                      onChange={(e) => setNewModuleDesc(e.target.value)}
                    />
                  </div>
                </div>

                {editableBlueprint.projects.length > 0 && (
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Initial Module Dependencies (References)</label>
                    <div className="flex flex-wrap gap-2 bg-[#13151b] p-2 rounded border border-[#2b303d]">
                      {editableBlueprint.projects.map((p) => {
                        const isSelected = newModuleReferences.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setNewModuleReferences((prev) =>
                                  prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                );
                              }}
                              className="rounded border-gray-600 bg-gray-800 text-blue-600"
                            />
                            <span>{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button size="sm" variant="primary" onClick={handleAddCustomModule}>
                    Confirm & Add Module
                  </Button>
                </div>
              </Card>
            )}

            {/* List of Configured Project Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {editableBlueprint.projects.map((proj) => (
                <Card key={proj.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
                        <span>{proj.name}</span>
                      </div>
                      <Badge tone="neutral" className="normal-case">{proj.type} Layer</Badge>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveModule(proj.id)}
                      title="Remove module"
                      aria-label={`Remove module ${proj.name}`}
                      className="hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>

                  <p className="text-gray-400 text-[11px] leading-tight">{proj.description}</p>

                  {/* Outbound Project Reference Badges */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-gray-400" aria-hidden="true" />
                      <span>Outbound References:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proj.references.map((refId) => {
                        const refP = editableBlueprint.projects.find((p) => p.id === refId);
                        return (
                          <Badge key={refId} tone="brand" className="normal-case">
                            <ArrowRight className="w-2.5 h-2.5" aria-hidden="true" />
                            {refP ? refP.name.split('.').pop() : refId}
                          </Badge>
                        );
                      })}
                      {proj.references.length === 0 && (
                        <span className="text-[10px] text-gray-500 italic">No dependencies (Standalone)</span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Edit Dependencies & Package Manager Toggles */}
                  <div className="pt-2 border-t border-[#232736] flex items-center justify-between text-[10px]">
                    <button
                      onClick={() => {
                        setEditingRefProjId(editingRefProjId === proj.id ? null : proj.id);
                        setEditingPkgProjId(null);
                      }}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono cursor-pointer"
                    >
                      <GitFork className="w-3 h-3" aria-hidden="true" />
                      <span>{editingRefProjId === proj.id ? 'Close Ref Editor' : `Refs (${proj.references.length})`}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPkgProjId(editingPkgProjId === proj.id ? null : proj.id);
                        setEditingRefProjId(null);
                      }}
                      className="flex items-center gap-1 text-gray-300 hover:text-white font-mono cursor-pointer"
                    >
                      <Package className="w-3 h-3" aria-hidden="true" />
                      <span>{editingPkgProjId === proj.id ? 'Close Packages' : `Packages (${(proj.packages || []).length})`}</span>
                    </button>

                    <span className="text-gray-400 font-mono">{activeTechStack.language === 'csharp' ? '.csproj' : 'Module'}</span>
                  </div>

                  {/* Inline Reference Editor Drawer */}
                  {editingRefProjId === proj.id && (
                    <Card flat className="border border-[#2b303d] space-y-1.5">
                      <div className="font-semibold text-gray-300 text-[11px] flex items-center justify-between border-b border-[#232838] pb-1">
                        <span>Toggle Outbound References:</span>
                        <span className="text-[10px] text-gray-500 font-mono">ProjectReference</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {editableBlueprint.projects
                          .filter((p) => p.id !== proj.id)
                          .map((otherProj) => {
                            const isRef = proj.references.includes(otherProj.id);
                            const causesCycle = !isRef && checkCausesCircularDependency(editableBlueprint.projects, proj.id, otherProj.id);

                            return (
                              <label
                                key={otherProj.id}
                                className={`flex items-center justify-between p-1.5 rounded text-[11px] font-mono transition-colors ${
                                  isRef ? 'bg-blue-900/30 border border-blue-500/40 text-blue-200' : 'bg-[#13151b] border border-[#2b303d] text-gray-400 hover:text-gray-200'
                                } ${causesCycle ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="truncate mr-2">{otherProj.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  {causesCycle && (
                                    <span className="text-[9px] text-amber-400 font-sans flex items-center gap-0.5" title="Adding this reference causes a circular loop">
                                      <ShieldAlert className="w-3 h-3" aria-hidden="true" /> Cycle
                                    </span>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isRef}
                                    disabled={causesCycle}
                                    onChange={() => handleToggleReference(proj.id, otherProj.id)}
                                    className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </Card>
                  )}

                  {/* Inline Package Manager Drawer (Item 4) */}
                  {editingPkgProjId === proj.id && (
                    <Card flat className="border border-[#2b303d] space-y-2">
                      <div className="font-semibold text-gray-200 text-[11px] flex items-center justify-between border-b border-[#232838] pb-1">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" aria-hidden="true" /> Module Package Dependencies
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {activeTechStack.language === 'csharp' ? 'NuGet' : activeTechStack.language === 'rust' ? 'Crates' : 'npm'}
                        </span>
                      </div>

                      {/* Current packages list */}
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {(proj.packages || []).map((pkg) => (
                          <div key={pkg.name} className="flex items-center justify-between p-1 rounded bg-[#13151b] border border-[#2b303d] text-[10px] font-mono">
                            <span className="text-gray-200 truncate">{pkg.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-gray-400">v{pkg.version}</span>
                              <button
                                onClick={() => handleRemovePackageFromProj(proj.id, pkg.name)}
                                className="text-gray-500 hover:text-red-400 p-0.5 rounded cursor-pointer"
                                title="Remove package"
                                aria-label={`Remove package ${pkg.name}`}
                              >
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {(!proj.packages || proj.packages.length === 0) && (
                          <div className="text-[10px] text-gray-500 italic p-1">No custom packages added to this module yet.</div>
                        )}
                      </div>

                      {/* Package add form */}
                      <div className="pt-1 border-t border-[#232838] space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            placeholder={activeTechStack.language === 'csharp' ? 'e.g., MediatR' : 'e.g., express'}
                            value={newPkgName}
                            onChange={(e) => setNewPkgName(e.target.value)}
                            className="flex-1 font-mono"
                          />
                          <Input
                            type="text"
                            placeholder="1.0.0"
                            value={newPkgVer}
                            onChange={(e) => setNewPkgVer(e.target.value)}
                            className="w-16 font-mono"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleAddPackageToProj(proj.id, newPkgName, newPkgVer)}>
                            Add
                          </Button>
                        </div>

                        {/* Quick Presets & Operational Suggestions for Module */}
                        <div className="space-y-1 pt-1 border-t border-[#232838]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-300 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-400" aria-hidden="true" /> Sugeridos com Base no Funcionamento para {proj.name}:
                            </span>
                            <button onClick={handleApplyAllSuggestedPackages} className="text-[9px] text-blue-400 hover:underline font-mono">
                              Aplicar Todos
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {suggestedPackages
                              .filter((s) => s.targetModuleType === proj.type || !s.targetModuleType)
                              .map((sugPkg, sIdx) => {
                                const isAdded = (proj.packages || []).some((p) => p.name.toLowerCase() === sugPkg.packageName.toLowerCase());
                                return (
                                  <button
                                    key={sIdx}
                                    disabled={isAdded}
                                    onClick={() => handleAddPackageToProj(proj.id, sugPkg.packageName, sugPkg.version)}
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                                      isAdded
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 opacity-70 cursor-default'
                                        : 'bg-[#1c2029] hover:bg-[#242a36] text-gray-300 border-[#2e3340]'
                                    }`}
                                    title={sugPkg.reason}
                                  >
                                    <span>{isAdded ? '✓' : '+'}</span>
                                    <span>{sugPkg.packageName}</span>
                                    <span className="text-[8px] text-gray-400 font-sans">({sugPkg.category})</span>
                                  </button>
                                );
                              })}

                            {suggestedPackages.filter((s) => s.targetModuleType === proj.type).length === 0 && (
                              <span className="text-[9px] text-gray-500 italic">Nenhuma sugestão específica para a camada {proj.type}.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </Card>
              ))}
            </div>
          </Card>

          {/* Environment File (.env) Configuration Choice */}
          <Card className="space-y-4">
            <div className="space-y-1 border-b border-[#232838] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <h3 className="font-semibold text-gray-100 text-xs">
                  Environment Variable & Local Secret Configuration (.env)
                </h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Choose whether your generated project should include local <span className="text-gray-200 font-mono">.env</span> configuration files or rely purely on direct OS / Cloud environment variables.
              </p>
            </div>

            {/* Prompt Option Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                interactive
                onClick={() => setUseEnvFile(true)}
                className={`space-y-2 ${useEnvFile ? 'border-blue-500 bg-blue-600/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" /> Use .env Local Configuration Files
                  </span>
                  {useEnvFile && <Badge tone="success">Active</Badge>}
                </div>
                <p className="text-[11px] text-gray-300 leading-normal">
                  Generates <span className="font-mono text-gray-200 text-[10px]">.env</span> and <span className="font-mono text-gray-200 text-[10px]">.env.example</span> in solution root with customizable keys for local development.
                </p>
              </Card>

              <Card
                interactive
                onClick={() => setUseEnvFile(false)}
                className={`space-y-2 ${!useEnvFile ? 'border-blue-500 bg-blue-600/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-100 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-400" aria-hidden="true" /> Do NOT Use .env Files (Direct OS / Secret Manager)
                  </span>
                  {!useEnvFile && <Badge tone="success">Active</Badge>}
                </div>
                <p className="text-[11px] text-gray-300 leading-normal">
                  No local <span className="font-mono text-gray-400 text-[10px]">.env</span> files. Configures environment setting loading via OS process environment variables, Docker secrets, or cloud vaults.
                </p>
              </Card>
            </div>

            {/* Configurable .env Variables Editor Table (Only shown if useEnvFile is true) */}
            {useEnvFile && (
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Configured .env Keys & Values ({envVars.length})
                  </span>

                  {/* Preset Quick Add Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="secondary" onClick={handleLoadStackEnvPresets} className="mr-1">
                      <Settings className="w-3 h-3" aria-hidden="true" /> Auto-Load {activeTechStack.name} Presets
                    </Button>
                    <span className="text-[10px] text-gray-400">Presets:</span>
                    <button
                      onClick={() => handleAddPresetEnv('DATABASE_URL', 'postgresql://admin:secret@localhost:5432/db', 'Primary Database Connection')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + Postgres
                    </button>
                    <button
                      onClick={() => handleAddPresetEnv('JWT_SECRET', 'super-secret-key-32-bytes-minimum!', 'Token Auth Secret')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + JWT
                    </button>
                    <button
                      onClick={() => handleAddPresetEnv('REDIS_URL', 'redis://localhost:6379', 'Redis Host')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + Redis
                    </button>
                  </div>
                </div>

                {/* Variable Creation Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-[#13151b] p-2 rounded border border-[#2b303d]">
                  <Input
                    type="text"
                    placeholder="KEY (e.g., API_KEY)"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    className="font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="VALUE (e.g., secret_123)"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    className="font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="Description (optional)"
                    value={newEnvDesc}
                    onChange={(e) => setNewEnvDesc(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleAddEnvVar}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Variable
                  </Button>
                </div>

                {/* Active Key Value Table */}
                <div className="space-y-1 font-mono text-[11px]">
                  {envVars.map((v) => (
                    <div key={v.key} className="flex items-center justify-between p-2 bg-[#13151b] border border-[#2b303d] rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-200 font-bold">{v.key}</span>
                        <span className="text-gray-500">=</span>
                        <span className="text-gray-300">{v.value}</span>
                        {v.description && <span className="text-gray-500 font-sans text-[10px]">({v.description})</span>}
                      </div>

                      <button
                        onClick={() => handleRemoveEnvVar(v.key)}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Delete key"
                        aria-label={`Delete environment variable ${v.key}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Card>

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
        <Card className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">Step 3: Quality Score Rationale & Recommendation Analysis</h2>
            <p className="text-gray-400 text-xs">
              Simulated score evaluation based on stack capabilities, active features, and security parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveScores.rationale.map((rat) => (
              <Card key={rat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200 text-xs">{rat.category}</span>
                  <span className="font-mono text-xs font-bold text-blue-400">{rat.score}/100</span>
                </div>
                <div className="text-xs text-gray-300">{rat.reason}</div>
                <div className="pt-2 border-t border-[#232838]">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase">Recommendations:</div>
                  <ul className="list-disc list-inside text-[11px] text-amber-300/80 space-y-0.5 mt-1">
                    {rat.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-3 border-t border-[#2b303d]">
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>

            <Button variant="primary" onClick={() => setStep(4)}>
              <span>Next: Live Code & Solution Preview</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-5">
          {/* Solution Estimates Bar */}
          <Card className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Estimated Files</div>
              <div className="text-lg font-bold text-blue-400 font-mono">{solutionPreview.estimatedFileCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Directories</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.estimatedFolderCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Project References</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.projectReferencesCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-mono">Package Dependencies</div>
              <div className="text-lg font-bold text-gray-100 font-mono">{solutionPreview.packageDependenciesCount}</div>
            </div>
          </Card>

          {/* Main Solution Explorer & Monaco Code Inspector */}
          <Card className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 Cols: Virtual Solution Tree */}
            <Card flat className="lg:col-span-4 border border-[#2b303d] space-y-2 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#232838] pb-2 text-xs font-semibold text-gray-200">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                  <span>{solutionPreview.solutionName}</span>
                </div>
              </div>

              {renderTree(solutionPreview.solutionTree)}
            </Card>

            {/* Right 8 Cols: Monaco Code Inspector */}
            <Card flat className="lg:col-span-8 border border-[#2b303d] overflow-hidden flex flex-col h-[500px] p-0">
              <div className="px-4 py-2 bg-[#13151b] border-b border-[#2b303d] flex items-center justify-between text-xs font-mono text-gray-300">
                <span>{selectedFileNode ? selectedFileNode.path : 'Select a file from the tree to inspect code'}</span>
                {selectedFileNode?.language && (
                  <Badge tone="brand" className="normal-case">{selectedFileNode.language}</Badge>
                )}
              </div>

              <div className="flex-1 bg-[#1e1e1e]">
                {selectedFileNode ? (
                  <Editor
                    height="100%"
                    language={selectedFileNode.language || 'plaintext'}
                    theme="vs-dark"
                    value={selectedFileNode.contentSnippet || '// Empty file'}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                    Click any generated file to preview code.
                  </div>
                )}
              </div>
            </Card>
          </Card>

          {/* Action Bar */}
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setStep(3)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>

            <div className="flex items-center gap-3">
              {/* IDE Export & Direct Launch Button */}
              <Button
                variant="secondary"
                onClick={() => setShowIdeExportModal(true)}
                title="Open in VS Code, Visual Studio, JetBrains Rider, or launch CLI"
              >
                <Laptop className="w-4 h-4" aria-hidden="true" />
                <span>IDE Export & Launch</span>
              </Button>

              {/* Download ZIP Button (Item 5 - Always Preserved) */}
              <Button
                variant="primary"
                onClick={handleDownloadSolutionZip}
                disabled={isDownloadingZip}
                title="Export complete solution as a compressed .ZIP file containing all projects, manifests, Dockerfile & .env"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{isDownloadingZip ? 'Zipping...' : 'Download Solution ZIP'}</span>
              </Button>

              {isGenerated ? (
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Saved to LocalStorage!
                  </span>
                  <Button variant="primary" onClick={() => setActiveView('dashboard')}>
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <Button variant="primary" onClick={handleCompleteGeneration}>
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>Generate & Instantiate Solution</span>
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* IDE Export & Direct Launch Modal */}
      {showIdeExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-xs text-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#262a36] pb-4">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Laptop className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  <span>IDE Direct Export & Local Workspace Integration</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Connect your scaffolded <span className="text-white font-mono">{projectName}</span> solution directly with VS Code, Visual Studio, JetBrains Rider, or local disk.
                </p>
              </div>
              <button
                onClick={() => setShowIdeExportModal(false)}
                aria-label="Close export dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Fase 2: Direct Disk Sync (File System Access API) Section */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-100 text-xs flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span>Fase 2: Direct Local Disk Sync (Browser File System Access API)</span>
                  </div>
                  <p className="text-gray-300 text-[11px] mt-0.5">
                    Write solution files directly to a folder on your computer without zipping/unzipping.
                  </p>
                </div>
                <Button variant="primary" onClick={() => handleExportDirectToDisk(false)} disabled={directDiskStatus === 'writing'} className="shrink-0">
                  <FolderCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{directDiskStatus === 'writing' ? 'Syncing...' : 'Select Local Folder & Write Files'}</span>
                </Button>
              </div>

              {directDiskStatus === 'success' && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between font-mono text-[11px] text-emerald-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Successfully written <strong className="text-white">{writtenFilesCount} files</strong> to <code className="text-emerald-200">&quot;{selectedFolderName}&quot;</code>!
                  </span>
                  <Button size="sm" variant="primary" onClick={handleLaunchVSCodeDirectly} title={`Open ${localPathInput} in VS Code`} className="shrink-0">
                    <ExternalLink className="w-3 h-3" aria-hidden="true" /> Open in VS Code
                  </Button>
                </div>
              )}

              {directDiskStatus === 'iframe_blocked' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2 text-[11px] text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Browser Security Restriction (Iframe Preview Sandbox)</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Browsers block direct folder pickers inside sandboxed preview frames for security. To sync solution files directly to your local disk, open this app in a standalone tab, or download the compressed ZIP bundle.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.open(cleanUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open App in New Tab to Sync Disk</span>
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleDownloadSolutionZip}>
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download Solution ZIP</span>
                    </Button>
                  </div>
                </div>
              )}

              {directDiskStatus === 'error' && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-[11px]">
                  An error occurred while writing files to disk. Ensure browser permissions are granted or use the ZIP download fallback.
                </div>
              )}
            </Card>

            {/* IDE Export Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VS Code Card */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 text-sm flex items-center gap-2">
                    <Code2 className="w-4 h-4" aria-hidden="true" /> Visual Studio Code (Desktop & Web)
                  </span>
                  <Badge tone="brand" className="normal-case">.code-workspace</Badge>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Generates pre-configured <code className="text-blue-300">{`.vscode/launch.json`}</code>, <code className="text-blue-300">{`.vscode/tasks.json`}</code>, and workspace settings for <span className="text-white font-semibold">{activeTechStack.name}</span>.
                </p>

                <div className="space-y-2 pt-2 border-t border-[#232838]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>1) Caminho Completo da Pasta no seu PC:</span>
                      <span className="text-blue-400 text-[9px]">Onde salvou/descompactou</span>
                    </div>
                    <Input
                      type="text"
                      value={localPathInput}
                      onChange={(e) => setLocalPathInput(e.target.value)}
                      placeholder={`C:\\Projects\\${selectedFolderName || projectName}`}
                      className="font-mono"
                    />

                    {/* Quick Path Presets */}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-0.5 overflow-x-auto">
                      <span className="shrink-0 text-[9px] text-gray-500 font-medium">Atalhos de local:</span>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`C:\\Projects\\${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        C:\Projects\...
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`C:\\Users\\Downloads\\${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        C:\Users\...\Downloads\...
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`~/Projects/${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        ~/Projects/...
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={() => handleExportDirectToDisk(true)}
                      title="Select local folder on your PC, save solution files, and open in VS Code"
                      className="w-full justify-center"
                    >
                      <FolderCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Select Folder, Save Files &amp; Open in VS Code</span>
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLaunchVSCodeDirectly}
                        title={`Direct launch: vscode://file/${localPathInput}`}
                        className="justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Launch vscode:// Directly</span>
                      </Button>

                      <a
                        href="https://vscode.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-xs transition-colors cursor-pointer"
                        title="Open VS Code Web directly in browser"
                      >
                        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>VS Code Web</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-[#13151b] border border-[#2b303d] rounded-lg p-2 text-[10px] text-gray-300 space-y-1">
                    <div className="font-semibold text-gray-200">Como funciona o salvamento e abertura:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                      <li><strong>Salvar primeiro:</strong> Baixe o ZIP ou use a <span className="text-gray-300">Fase 2 (Gravação Direta em Disco)</span> acima para criar os ficheiros na pasta local.</li>
                      <li><strong>Abrir no VS Code:</strong> O VS Code Desktop precisa de saber o caminho exato da pasta no seu disco rígido (<code className="text-gray-200">C:\Projetos\...</code>). Se abrir sem salvar primeiro, o VS Code exibirá &quot;Path does not exist&quot;.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px] mt-1">
                    <span className="text-gray-300">code .</span>
                    <button onClick={() => handleCopyCmd('code .')} className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer">
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === 'code .' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </Card>

              {/* Visual Studio / Rider Card */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-100 text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" aria-hidden="true" /> Visual Studio & Rider
                  </span>
                  <Badge tone="neutral" className="normal-case">.sln / .csproj</Badge>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Includes complete Microsoft Visual Studio Solution file <code className="text-gray-200">{`${projectName}.sln`}</code> with auto-wired inter-module dependencies and package references.
                </p>

                <div className="space-y-2 pt-2 border-t border-[#232838]">
                  <div className="text-[10px] text-gray-400 font-mono">Visual Studio / Rider Commands:</div>
                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="text-gray-200 truncate">devenv {projectName}.sln</span>
                    <button
                      onClick={() => handleCopyCmd(`devenv ${projectName}.sln`)}
                      className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                    >
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === `devenv ${projectName}.sln` ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="text-gray-200 truncate">rider {projectName}.sln</span>
                    <button
                      onClick={() => handleCopyCmd(`rider ${projectName}.sln`)}
                      className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                    >
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === `rider ${projectName}.sln` ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Shell Setup Script Section */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-100 text-xs flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4 text-blue-400" aria-hidden="true" /> Automated Local Environment Launcher (setup-ide.sh)
                </span>
                <span className="text-gray-400 font-mono text-[10px]">Bash / PowerShell</span>
              </div>
              <p className="text-gray-300 text-[11px]">
                Run the included shell script inside your unzipped folder to automatically initialize Git, restore dependencies, and launch your preferred editor:
              </p>
              <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded-lg p-3 font-mono text-[11px] text-gray-200">
                <span>chmod +x setup-ide.sh && ./setup-ide.sh</span>
                <Button
                  size="sm"
                  onClick={() => handleCopyCmd('chmod +x setup-ide.sh && ./setup-ide.sh')}
                >
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>{copiedCmdText === 'chmod +x setup-ide.sh && ./setup-ide.sh' ? 'Copied!' : 'Copy Script Command'}</span>
                </Button>
              </div>
            </Card>

            {/* Fase 3: Git & Remote Repository Push/Sync Integration */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-100 text-xs flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span>Fase 3: Git & Remote Repository Push/Sync Integration</span>
                </span>
                <Badge tone="neutral" className="normal-case">GitHub / GitLab / Azure DevOps</Badge>
              </div>
              <p className="text-gray-300 text-[11px]">
                To publish this scaffolded <span className="text-white font-mono">{projectName}</span> architecture directly to GitHub or your organization&apos;s remote Git host:
              </p>

              <div className="space-y-1.5 bg-[#13151b] border border-[#2b303d] rounded-lg p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-gray-300">
                  <span>git init &amp;&amp; git add . &amp;&amp; git commit -m &quot;feat: scaffold architecture using Factory Platform&quot;</span>
                  <button
                    onClick={() => handleCopyCmd('git init && git add . && git commit -m "feat: scaffold architecture using Factory Platform"')}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-gray-300 border-t border-[#232838] pt-1.5">
                  <span>git remote add origin https://github.com/your-org/{projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git</span>
                  <button
                    onClick={() => handleCopyCmd(`git remote add origin https://github.com/your-org/${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git`)}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-emerald-300 border-t border-[#232838] pt-1.5">
                  <span>git branch -M main && git push -u origin main</span>
                  <button
                    onClick={() => handleCopyCmd('git branch -M main && git push -u origin main')}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Footer with ZIP Download Fallback */}
            <div className="flex items-center justify-between pt-4 border-t border-[#262a36]">
              <div className="text-gray-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" /> All solution files, configs & scripts are included in the downloadable ZIP bundle.
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={handleDownloadSolutionZip} disabled={isDownloadingZip}>
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isDownloadingZip ? 'Downloading...' : 'Download Solution ZIP'}</span>
                </Button>
                <Button variant="secondary" onClick={() => setShowIdeExportModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
