'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { ProjectAdvisorPanel } from '../components/ProjectAdvisorPanel';
import { AIAssistantDrawer } from '../components/AIAssistantDrawer';
import { CommandPalette } from '../components/CommandPalette';

import { DashboardView } from '../components/views/DashboardView';
import { BlueprintsView } from '../components/views/BlueprintsView';
import { FeatureManifestsView } from '../components/views/FeatureManifestsView';
import { ProjectScaffolderView } from '../components/views/ProjectScaffolderView';
import { RuleEngineView } from '../components/views/RuleEngineView';
import { TechStacksView } from '../components/views/TechStacksView';
import { AIPromptsView } from '../components/views/AIPromptsView';
import { DecisionLogsView } from '../components/views/DecisionLogsView';
import { ImpactAnalyzerView } from '../components/views/ImpactAnalyzerView';

import { StorageService, useTemplates } from '../services/storageService';
import { initialTemplates } from '../services/mockSeedData';
import { Blueprint } from '../types/factory';
import { SlidersHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function SoftwareFactoryPage() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState<string>('');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(true);

  const templates = useTemplates();
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint>(
    initialTemplates[0]?.blueprint || {
      id: 'bp-clean-dotnet9',
      name: 'Clean Architecture .NET 9 Standard',
      description: 'Default enterprise solution blueprint',
      architectureStyle: 'CleanArchitecture',
      projects: [],
      featureIds: ['feat-docker', 'feat-jwt'],
      profiles: {
        databaseProfileId: 'db-postgres',
        securityProfileId: 'sec-jwt',
        dockerProfileId: 'doc-multistage',
        cacheProfileId: 'cache-redis',
        loggingProfileId: 'log-serilog',
      },
      tags: ['.NET 9', 'Clean Architecture'],
      version: '2.5.0',
    }
  );

  // Keyboard shortcuts (Cmd+K for command palette, Cmd+B for sidebar, Cmd+J for AI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsAIDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openAIRefactor = (prompt: string) => {
    setAiDrawerPrompt(prompt);
    setIsAIDrawerOpen(true);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            setActiveView={setActiveView}
            selectedBlueprint={selectedBlueprint}
            setSelectedBlueprint={setSelectedBlueprint}
          />
        );

      case 'blueprints':
        return (
          <BlueprintsView
            blueprint={selectedBlueprint}
            setBlueprint={setSelectedBlueprint}
            openAIRefactor={openAIRefactor}
          />
        );

      case 'features':
        return (
          <FeatureManifestsView
            blueprint={selectedBlueprint}
            setBlueprint={setSelectedBlueprint}
            openAIRefactor={openAIRefactor}
          />
        );

      case 'scaffolder':
        return (
          <ProjectScaffolderView
            blueprint={selectedBlueprint}
            setSelectedBlueprint={setSelectedBlueprint}
            setActiveView={setActiveView}
            openAIRefactor={openAIRefactor}
          />
        );

      case 'rules':
        return (
          <RuleEngineView
            openAIRefactor={openAIRefactor}
            blueprint={selectedBlueprint}
            setSelectedBlueprint={setSelectedBlueprint}
          />
        );

      case 'stacks':
        return <TechStacksView />;

      case 'ai':
        return <AIPromptsView />;

      case 'decisions':
        return <DecisionLogsView openAIRefactor={openAIRefactor} />;

      case 'impact':
        return (
          <ImpactAnalyzerView
            blueprint={selectedBlueprint}
            openAIRefactor={openAIRefactor}
          />
        );

      default:
        return (
          <DashboardView
            setActiveView={setActiveView}
            selectedBlueprint={selectedBlueprint}
            setSelectedBlueprint={setSelectedBlueprint}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0e1013] text-gray-100 font-sans antialiased select-none">
      {/* Top Fixed IDE Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        toggleAIDrawer={() => setIsAIDrawerOpen((prev) => !prev)}
        isAIDrawerOpen={isAIDrawerOpen}
        selectedBlueprint={selectedBlueprint}
      />

      {/* Main Viewport Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Explorer Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Center Main Workspace Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0f1115] relative">
          {renderActiveView()}
        </main>

        {/* Right Collapsible Project Advisor Panel */}
        {isAdvisorOpen ? (
          <div className="relative flex">
            <button
              onClick={() => setIsAdvisorOpen(false)}
              title="Collapse Advisor Panel"
              className="absolute left-[-12px] top-4 z-20 p-1 rounded-full bg-[#1e222d] border border-[#2e3444] text-gray-400 hover:text-white cursor-pointer shadow-md"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
            <ProjectAdvisorPanel
              blueprint={selectedBlueprint}
              openAIRefactor={openAIRefactor}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdvisorOpen(true)}
            title="Expand Advisor Panel"
            className="absolute right-3 top-3 z-20 p-2 rounded-lg bg-[#1a1d24] border border-[#2e3340] text-gray-400 hover:text-blue-400 cursor-pointer shadow-lg flex items-center gap-1.5 text-xs font-medium"
          >
            <PanelRightOpen className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline">Advisor ({selectedBlueprint.name.split(' ')[0]})</span>
          </button>
        )}
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveView={setActiveView}
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        blueprint={selectedBlueprint}
        initialPrompt={aiDrawerPrompt}
      />
    </div>
  );
}
