'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Box, Wand2, ShieldAlert, Server, Bot, FileSpreadsheet, GitCompare, ArrowRight, X } from 'lucide-react';
import { Input } from './ui/Input';
import { useFocusTrap } from '../hooks/use-focus-trap';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, setActiveView }) => {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen, onClose);

  useEffect(() => {
    // Cmd/Ctrl+K toggles closed while open; the open-from-closed case is
    // handled by the parent (it owns isOpen). Escape-to-close and Tab
    // trapping are handled by useFocusTrap above.
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dashboard', title: 'Go to Factory Overview Dashboard', icon: Layers, category: 'Navigation' },
    { id: 'blueprints', title: 'Visual Blueprint Editor & Solution Explorer', icon: Layers, category: 'Navigation' },
    { id: 'features', title: 'Browse Feature Manifests (20+ Modules)', icon: Box, category: 'Navigation' },
    { id: 'scaffolder', title: 'Open Project Scaffolding Wizard', icon: Wand2, category: 'Navigation' },
    { id: 'rules', title: 'Manage Architecture Rules & Severity Policies', icon: ShieldAlert, category: 'Navigation' },
    { id: 'stacks', title: 'Configure Tech Stacks & Profiles', icon: Server, category: 'Navigation' },
    { id: 'ai', title: 'Open AI Assistant & Prompt Engineering Library', icon: Bot, category: 'Navigation' },
    { id: 'decisions', title: 'View Decision Log & Architectural Audit', icon: FileSpreadsheet, category: 'Navigation' },
    { id: 'impact', title: 'Analyze Setting Change Impact (What-If)', icon: GitCompare, category: 'Navigation' },
  ];

  const filtered = commands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id: string) => {
    setActiveView(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="bg-[#181a20] border border-[#323745] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#2b303e] bg-[#1d2028] gap-3">
          <Search className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to module..."
            className="bg-transparent border-none text-sm p-0 focus:ring-0"
            autoFocus
          />
          <button onClick={onClose} aria-label="Close command palette" className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-500 hover:text-gray-300 rounded cursor-pointer">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#242834]">
          {filtered.length > 0 ? (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs text-gray-300 hover:text-white hover:bg-[#252a36] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-[#2a2f3d] text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-200 group-hover:text-white">{cmd.title}</div>
                      <div className="text-[10px] text-gray-400">{cmd.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">No matching commands found.</div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#262a36] bg-[#14161c] text-[11px] text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#252936] text-gray-300 rounded text-[10px] border border-[#353b4d]">↑↓</kbd> navigate
            <kbd className="px-1.5 py-0.5 bg-[#252936] text-gray-300 rounded text-[10px] border border-[#353b4d]">↵</kbd> select
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-[#252936] text-gray-300 rounded text-[10px] border border-[#353b4d]">ESC</kbd> close
          </div>
        </div>
      </div>
    </div>
  );
};
