'use client';

import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Sparkles,
  Search,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FolderGit2,
  ChevronRight,
  ShieldCheck,
  Plus,
  Wand2,
  Settings2,
  Menu,
} from 'lucide-react';
import { StorageService, useOrganizations, useWorkspaces } from '../services/storageService';
import { ValidationService } from '../services/validationService';
import { AdvisorService } from '../services/advisorService';
import { Blueprint } from '../types/factory';
import { OrganizationWorkspaceModal } from './OrganizationWorkspaceModal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  openCommandPalette: () => void;
  toggleAIDrawer: () => void;
  isAIDrawerOpen: boolean;
  selectedBlueprint: Blueprint;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  openCommandPalette,
  toggleAIDrawer,
  isAIDrawerOpen,
  selectedBlueprint,
  toggleSidebar,
}) => {
  const orgs = useOrganizations();
  const workspaces = useWorkspaces();
  const [selectedOrgIdOverride, setSelectedOrgIdOverride] = useState('');
  const [selectedWsIdOverride, setSelectedWsIdOverride] = useState('');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);

  // Derive the effective selection instead of syncing it via an effect: fall
  // back to the first available entity whenever the explicit selection no
  // longer points at something real (e.g. it was deleted, or nothing has
  // been picked yet). This keeps the pickers pointed at a real entity as the
  // underlying lists change (created/deleted via the management modal).
  const selectedOrgId = orgs.some((o) => o.id === selectedOrgIdOverride)
    ? selectedOrgIdOverride
    : orgs[0]?.id || '';

  const scopedWorkspaces = workspaces.filter((w) => w.organizationId === selectedOrgId);

  const selectedWsId = scopedWorkspaces.some((w) => w.id === selectedWsIdOverride)
    ? selectedWsIdOverride
    : scopedWorkspaces[0]?.id || '';

  const setSelectedOrgId = setSelectedOrgIdOverride;
  const setSelectedWsId = setSelectedWsIdOverride;

  const validationMsgs = ValidationService.validateBlueprint(selectedBlueprint);
  const scores = AdvisorService.calculateScores(selectedBlueprint);

  const errorCount = validationMsgs.filter((m) => m.type === 'error').length;
  const warningCount = validationMsgs.filter((m) => m.type === 'warning').length;

  const handleResetData = () => {
    if (confirm('Reset Software Factory data to default enterprise seed dataset?')) {
      StorageService.initializeSeedData(true);
      window.location.reload();
    }
  };

  const handleExportState = () => {
    const json = StorageService.exportFullWorkspaceState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `software-factory-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && StorageService.importWorkspaceState(content)) {
        alert('Workspace state restored successfully!');
        window.location.reload();
      } else {
        alert('Failed to import workspace JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const viewTitles: Record<string, string> = {
    dashboard: 'Factory Overview',
    blueprints: 'Blueprints & Solution Architectures',
    features: 'Feature Manifests Library',
    scaffolder: 'Project Scaffolding & Solution Builder',
    rules: 'Architecture Rules & Policy Engine',
    stacks: 'Technology Stacks & Infrastructure Profiles',
    ai: 'AI Providers & Prompt Engineering',
    plugins: 'Plugins & Extensibility',
    decisions: 'Decision Logs & Audit History',
    impact: 'Compatibility & Setting Change Analyzer',
  };

  return (
    <header className="h-14 bg-[#14161b] border-b border-[#2a2e39] flex items-center justify-between px-4 text-sm text-gray-200 select-none z-30 sticky top-0">
      {/* Left branding & Workspace selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden min-w-11 min-h-11 -ml-2 inline-flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 pr-3 border-r border-[#2b303c]">
          <div className="p-1.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white tracking-tight mono-font hidden sm:inline">SoftwareFactory</span>
          <Badge tone="brand" className="normal-case hidden sm:inline-flex">IDE v2.5</Badge>
        </div>

        {/* Org & Workspace Picker */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400 bg-[#1c1f26] px-2.5 py-1 rounded border border-[#2e3340]">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {orgs.length > 0 ? (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id} className="bg-[#1c1f26] text-gray-200">
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-500 italic">No organization yet</span>
            )}
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />

          <div className="flex items-center gap-1.5 text-gray-400 bg-[#1c1f26] px-2.5 py-1 rounded border border-[#2e3340]">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
            {scopedWorkspaces.length > 0 ? (
              <select
                value={selectedWsId}
                onChange={(e) => setSelectedWsId(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
              >
                {scopedWorkspaces.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#1c1f26] text-gray-200">
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-500 italic">No workspace yet</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOrgModalOpen(true)}
            title="Manage Organizations & Workspaces"
            aria-label="Manage Organizations & Workspaces"
            className="hover:text-blue-400"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Active View Title */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 ml-2">
          <span className="text-gray-600">/</span>
          <span className="text-gray-200 font-medium">{viewTitles[activeView] || activeView}</span>
        </div>
      </div>

      {/* Center Search / Command Palette Bar */}
      <button
        onClick={openCommandPalette}
        aria-label="Open command palette"
        className="flex items-center gap-3 min-h-11 min-w-11 bg-[#1a1d24] hover:bg-[#222630] border border-[#2e3340] hover:border-gray-600 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer justify-center sm:w-48 md:w-64 lg:w-80 sm:justify-between"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="hidden sm:inline truncate">Search blueprints, rules, features...</span>
        </div>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#282d38] border border-[#373e4f] text-gray-300 rounded font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right Action Items & Validation Badge */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Validation Status Pill */}
        <button
          onClick={() => setActiveView('rules')}
          className="flex items-center gap-2 px-2.5 py-1 min-h-11 sm:min-h-0 rounded-md text-xs border bg-[#1a1d24] hover:bg-[#222630] transition-colors cursor-pointer"
        >
          {errorCount > 0 ? (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">{errorCount} Error{errorCount > 1 ? 's' : ''}</span>
            </span>
          ) : warningCount > 0 ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{warningCount} Warning{warningCount > 1 ? 's' : ''}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Valid Architecture</span>
            </span>
          )}

          <div className="hidden sm:block w-px h-3 bg-[#2e3340]" />

          <div className="flex items-center gap-1 text-blue-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{scores.qualityScore}%<span className="hidden sm:inline"> Quality</span></span>
          </div>
        </button>

        {/* + New Project Quick Action Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setActiveView('scaffolder')}
          aria-label="New Project"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New Project</span>
        </Button>

        {/* AI Architect Assistant Button */}
        <Button
          size="sm"
          onClick={toggleAIDrawer}
          aria-label="AI Architect"
          aria-pressed={isAIDrawerOpen}
          className={
            isAIDrawerOpen
              ? 'bg-blue-600 text-white border border-blue-500 shadow-sm shadow-blue-500/30 hover:bg-blue-500'
              : 'bg-[#1c2230] text-blue-300 border border-blue-500/30 hover:bg-blue-900/30'
          }
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">AI Architect</span>
        </Button>

        {/* Reset Data & JSON Backup */}
        <div className="flex items-center gap-1 pl-2 border-l border-[#2b303c]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportState}
            title="Export Workspace JSON"
            aria-label="Export Workspace JSON"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>

          <label title="Import Workspace JSON" aria-label="Import Workspace JSON" className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#1c2029] rounded-md cursor-pointer">
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <input type="file" accept=".json" onChange={handleImportState} className="hidden" />
          </label>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetData}
            title="Reset to Factory Seed Data"
            aria-label="Reset to Factory Seed Data"
            className="hover:text-amber-400"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <OrganizationWorkspaceModal isOpen={isOrgModalOpen} onClose={() => setIsOrgModalOpen(false)} />
    </header>
  );
};
