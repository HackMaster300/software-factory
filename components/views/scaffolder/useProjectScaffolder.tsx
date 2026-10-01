'use client';

import React, { useState } from 'react';
import { Blueprint, Project, ArchitectureStyle } from '../../../types/factory';
import { ProjectService, SolutionTreeNode } from '../../../services/projectService';
import { ValidationService } from '../../../services/validationService';
import { StorageService } from '../../../services/storageService';
import { DecisionService } from '../../../services/decisionService';
import { AdvisorService } from '../../../services/advisorService';
import { BlueprintService } from '../../../services/blueprintService';
import { RuleService } from '../../../services/ruleService';
import { AIService } from '../../../services/aiService';

import { checkCausesCircularDependency } from './dependencyGraph';
import { SolutionTree } from './SolutionTree';
import { useScaffolderAiChat } from './useScaffolderAiChat';

export interface ProjectScaffolderViewProps {
  blueprint: Blueprint;
  setSelectedBlueprint?: (bp: Blueprint) => void;
  setActiveView: (view: string) => void;
  openAIRefactor: (prompt: string) => void;
}

/**
 * State, derived data and handlers of ProjectScaffolderView, extracted verbatim
 * from the component body so the JSX can be split into cohesive sub-components.
 */
export function useProjectScaffolder({
  blueprint: initialBlueprint,
  setSelectedBlueprint,
  setActiveView,
  openAIRefactor,
}: ProjectScaffolderViewProps) {
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

  // AI naming/structure conversation (wizard step 4)
  const { aiConversation, setAiConversation, aiInput, setAiInput, handleSendAiMessage } =
    useScaffolderAiChat(editableBlueprint);

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

  // Real-time Rule Engine Guardrails evaluation (blueprint-level)
  const defaultRuleSet = RuleService.getRuleSets()[0];
  const ruleReport = RuleService.validateBlueprint(editableBlueprint, defaultRuleSet);

  // Dynamic real-time score calculation based on current user autonomy choices
  const liveScores = AdvisorService.calculateScores(editableBlueprint);
  const solutionPreview = ProjectService.generateSolutionPreview(editableBlueprint, projectName, useEnvFile, envVars);
  // Phase 9: tree-level code-standard validation (rules 2-5) sobre o código gerado.
  const treeValidation = ValidationService.validateGeneratedTree(solutionPreview.solutionTree);

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

      const { buildGroundedPrompt, getGroundedSystemInstruction } = await import('../../../lib/ai-grounding');
      const userPrompt = `Análise de Arquitetura de Software:
Descrição do Funcionamento do Projeto: "${projectDescription}"
Linguagem / Stack Técnica: ${activeTechStack.name} (${activeTechStack.language})
Módulos da Solução Atual: ${editableBlueprint.projects.map((p) => `${p.name} (${p.type})`).join(', ')}

Por favor, forneça uma lista detalhada dos pacotes/dependências mais importantes recomendados para este funcionamento, explicando a finalidade de cada um e em qual camada da arquitetura (Core, Application, Infrastructure, API, Worker) deve ser adicionado, citando ruleId quando aplicar governança.`;
      const groundedPrompt = buildGroundedPrompt(editableBlueprint, userPrompt);
      const systemInstruction = getGroundedSystemInstruction();

      const result = await AIService.requestAnalysis(groundedPrompt, 'Software Architect & Package Advisor', systemInstruction);
      setAiPackageAnalysisText(result.text);

      // Also apply suggested packages automatically
      handleApplyAllSuggestedPackages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown AI error';
      setAiPackageAnalysisText(`Falha na análise de IA: ${message}\nConfigure uma API key válida em AI & Prompts → Providers.`);
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
      impact: `Scaffolding created ${solutionPreview.estimatedFileCount} files across ${solutionPreview.estimatedFolderCount} directories. Heuristic quality estimate: ${liveScores.qualityScore}/100 (traceable, not measured).`,
      warningsIgnored: [],
      aiRecommendations: liveScores.rationale[0]?.recommendations || [],
      userJustification: 'Validated autonomous tech stack and architecture parameters.',
      author: 'Lead Software Architect',
    });

    setIsGenerated(true);
  };

  const renderTree = (nodes: SolutionTreeNode[]) => (
    <SolutionTree nodes={nodes} selectedId={selectedFileNode?.id} onSelect={handleSelectNode} />
  );

  return {
    step, setStep, projectName, setProjectName, selectedTemplateId, setSelectedTemplateId,
    selectedFileNode, setSelectedFileNode, isGenerated, setIsGenerated, aiConversation,
    setAiConversation, aiInput, setAiInput, handleSendAiMessage, templates, techStacks,
    editableBlueprint, setEditableBlueprint, useEnvFile, setUseEnvFile, projectDescription,
    setProjectDescription, isAnalyzingAiPackages, setIsAnalyzingAiPackages, aiPackageAnalysisText,
    setAiPackageAnalysisText, envVars, setEnvVars, newEnvKey, setNewEnvKey, newEnvVal,
    setNewEnvVal, newEnvDesc, setNewEnvDesc, isAddingModule, setIsAddingModule, newModuleName,
    setNewModuleName, newModuleType, setNewModuleType, newModuleDesc, setNewModuleDesc,
    newModuleReferences, setNewModuleReferences, editingRefProjId, setEditingRefProjId,
    editingPkgProjId, setEditingPkgProjId, newPkgName, setNewPkgName, newPkgVer, setNewPkgVer,
    isDownloadingZip, setIsDownloadingZip, showIdeExportModal, setShowIdeExportModal,
    copiedCmdText, setCopiedCmdText, directDiskStatus, setDirectDiskStatus, writtenFilesCount,
    setWrittenFilesCount, selectedFolderName, setSelectedFolderName, handleCopyCmd, localPathInput,
    setLocalPathInput, formatVSCodePath, handleExportDirectToDisk, handleLaunchVSCodeDirectly,
    selectedTemplate, activeTechStack, defaultRuleSet, ruleReport, liveScores, solutionPreview,
    treeValidation, suggestedPackages, handleApplyAllSuggestedPackages,
    handleAnalyzePackagesWithAi, handleAddPackageToProj, handleRemovePackageFromProj,
    handleDownloadSolutionZip, handleAddEnvVar, handleRemoveEnvVar, handleAddPresetEnv,
    handleToggleReference, handleAddCustomModule, handleRemoveModule, handlePresetModuleCount,
    handleSelectTemplate, handleSelectTechStack, handleLoadStackEnvPresets, handleSelectArchStyle,
    handleSelectNode, handleCompleteGeneration, renderTree, initialBlueprint, setSelectedBlueprint,
    setActiveView, openAIRefactor,
  };
}

export type ScaffolderState = ReturnType<typeof useProjectScaffolder>;
