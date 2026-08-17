'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
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
import { PluginsView } from '../components/views/PluginsView';
import { DecisionLogsView } from '../components/views/DecisionLogsView';
import { ImpactAnalyzerView } from '../components/views/ImpactAnalyzerView';

import { StorageService, useTemplates } from '../services/storageService';
import { initialTemplates } from '../services/mockSeedData';
import { Blueprint } from '../types/factory';
import { SlidersHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';

const ACTIVE_VIEW_STORAGE_KEY = 'sf_active_view_v1';
const VALID_VIEWS = ['dashboard', 'blueprints', 'features', 'scaffolder', 'rules', 'stacks', 'ai', 'plugins', 'decisions', 'impact'];
const activeViewListeners = new Set<() => void>();

function getActiveViewSnapshot(): string {
  const stored = window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
  return stored && VALID_VIEWS.includes(stored) ? stored : 'dashboard';
}

function getActiveViewServerSnapshot(): string {
  return 'dashboard';
}

function subscribeActiveView(callback: () => void): () => void {
  activeViewListeners.add(callback);
  return () => activeViewListeners.delete(callback);
}

function persistActiveView(view: string): void {
  window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, view);
  activeViewListeners.forEach((listener) => listener());
}

// Desktop-width detection for the Advisor panel's default open/closed state,
// via useSyncExternalStore rather than a setState-in-effect (same pattern as
// activeView above): server snapshot is always "not desktop" (closed), the
// client re-syncs to the real viewport post-hydration with no mismatch, and
// stays in sync across resizes via the matchMedia change listener.
const ADVISOR_DESKTOP_QUERY = '(min-width: 1024px)';

function getIsDesktopSnapshot(): boolean {
  return window.matchMedia(ADVISOR_DESKTOP_QUERY).matches;
}

function getIsDesktopServerSnapshot(): boolean {
  return false;
}

function subscribeIsDesktop(callback: () => void): () => void {
  const mql = window.matchMedia(ADVISOR_DESKTOP_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

export default function SoftwareFactoryPage() {
  const activeView = useSyncExternalStore(subscribeActiveView, getActiveViewSnapshot, getActiveViewServerSnapshot);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState<boolean>(false);
  const [aiDrawerPrompt, setAiDrawerPrompt] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Advisor panel: hidden by default below desktop width, visible by default
  // at desktop width (lg breakpoint, matching Sidebar/Header's convention) —
  // unless the user has explicitly toggled it, in which case that choice
  // wins regardless of viewport.
  const isDesktop = useSyncExternalStore(subscribeIsDesktop, getIsDesktopSnapshot, getIsDesktopServerSnapshot);
  const [advisorManualOverride, setAdvisorManualOverride] = useState<boolean | null>(null);
  const isAdvisorOpen = advisorManualOverride ?? isDesktop;
  const setIsAdvisorOpen = (open: boolean) => setAdvisorManualOverride(open);

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

  const setActiveView = persistActiveView;

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

      case 'plugins':
        return <PluginsView />;

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
      {/* Skip link: invisible until keyboard-focused, jumps straight to the main
          content landmark so keyboard users don't have to tab through the
          header/nav on every page load. */}
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-[100] -translate-y-16 focus:translate-y-0 transition-transform duration-150 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to main content
      </a>

      {/* Top Fixed IDE Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
        toggleAIDrawer={() => setIsAIDrawerOpen((prev) => !prev)}
        isAIDrawerOpen={isAIDrawerOpen}
        selectedBlueprint={selectedBlueprint}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Viewport Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Explorer Sidebar (off-canvas drawer below lg, static above) */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center Main Workspace Content Viewport */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto bg-[#0f1115] relative focus:outline-none">
          {renderActiveView()}
        </main>

        {/* Right Collapsible Project Advisor Panel: inline sidebar at lg+,
            a bottom-sheet overlay with a backdrop below lg */}
        {isAdvisorOpen ? (
          <>
            <div
              onClick={() => setIsAdvisorOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            />
            <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center lg:static lg:z-auto lg:block">
              <div className="relative flex w-full lg:w-auto">
                <button
                  onClick={() => setIsAdvisorOpen(false)}
                  title="Collapse Advisor Panel"
                  aria-label="Collapse Advisor Panel"
                  className="absolute right-2 top-2 z-20 min-w-11 min-h-11 inline-flex items-center justify-center rounded-full bg-[#1e222d] border border-[#2e3444] text-gray-400 hover:text-white cursor-pointer shadow-md lg:right-auto lg:left-[-12px] lg:top-4 lg:min-w-0 lg:min-h-0 lg:p-1"
                >
                  <PanelRightClose className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <ProjectAdvisorPanel
                  blueprint={selectedBlueprint}
                  openAIRefactor={openAIRefactor}
                />
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsAdvisorOpen(true)}
            title="Expand Advisor Panel"
            aria-label="Expand Advisor Panel"
            className="fixed bottom-4 right-4 z-30 min-w-11 min-h-11 lg:absolute lg:top-3 lg:right-3 lg:bottom-auto lg:min-w-0 lg:min-h-0 p-2 rounded-lg bg-[#1a1d24] border border-[#2e3340] text-gray-400 hover:text-blue-400 cursor-pointer shadow-lg flex items-center justify-center gap-1.5 text-xs font-medium"
          >
            <PanelRightOpen className="w-4 h-4 text-blue-400" aria-hidden="true" />
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
