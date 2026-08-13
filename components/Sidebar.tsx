'use client';

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Box,
  Wand2,
  ShieldAlert,
  Server,
  Bot,
  FileSpreadsheet,
  GitCompare,
  Settings,
  HelpCircle,
  Puzzle,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'blueprints', label: 'Blueprints', icon: Layers, badge: 'Visual' },
    { id: 'features', label: 'Feature Manifests', icon: Box, badge: '20+' },
    { id: 'scaffolder', label: 'Scaffolding Wizard', icon: Wand2, badge: 'Builder' },
    { id: 'rules', label: 'Architecture Rules', icon: ShieldAlert, badge: '6' },
    { id: 'stacks', label: 'Tech Stacks & Profiles', icon: Server, badge: null },
    { id: 'ai', label: 'AI & Prompts', icon: Bot, badge: 'Gemini' },
    { id: 'plugins', label: 'Plugins', icon: Puzzle, badge: null },
    { id: 'decisions', label: 'Decision Logs', icon: FileSpreadsheet, badge: null },
    { id: 'impact', label: 'Impact Analyzer', icon: GitCompare, badge: 'What-If' },
  ];

  return (
    <aside className="w-56 bg-[#121418] border-r border-[#262933] flex flex-col justify-between select-none shrink-0">
      <div className="py-2">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400">
            Software Factory IDE
          </span>
        </div>

        <div className="px-2 mb-2">
          <button
            onClick={() => setActiveView('scaffolder')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>+ New Project</span>
          </button>
        </div>

        <nav className="mt-1 space-y-0.5 px-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d24]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-blue-500/30 text-blue-200' : 'bg-[#222630] text-gray-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#262933] bg-[#0e1013]/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Engine Status</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LocalStorage Persistent
          </span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono">
          Ready for REST API Handshake
        </div>
      </div>
    </aside>
  );
};
