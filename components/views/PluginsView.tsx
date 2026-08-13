'use client';

import React, { useState } from 'react';
import { Puzzle, Plus, Edit3, Trash2, X, Search } from 'lucide-react';
import { Plugin } from '../../types/factory';
import { usePlugins } from '../../services/storageService';
import { pluginRepository } from '../../services/repositories';

const CATEGORY_SUGGESTIONS = ['Quality', 'Security', 'Observability', 'Productivity', 'Integration'];

export const PluginsView: React.FC = () => {
  const plugins = usePlugins();
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Quality');

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setEditingPlugin(null);
    setName('');
    setDescription('');
    setCategory('Quality');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setName(plugin.name);
    setDescription(plugin.description);
    setCategory(plugin.category);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please provide a plugin name.');
      return;
    }

    const id = editingPlugin ? editingPlugin.id : `plugin-${Date.now()}`;
    const newPlugin: Plugin = {
      id,
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || 'Quality',
      isActive: editingPlugin ? editingPlugin.isActive : true,
    };

    const updated = editingPlugin
      ? plugins.map((p) => (p.id === id ? newPlugin : p))
      : [...plugins, newPlugin];

    pluginRepository.savePlugins(updated);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this plugin?')) {
      pluginRepository.savePlugins(plugins.filter((p) => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = plugins.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    pluginRepository.savePlugins(updated);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-semibold">
              Extensibility
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{plugins.length} Plugins Registered</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Plugins</h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Plugin
        </button>
      </div>

      {plugins.length > 0 && (
        <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b303d] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins by name or category..."
            className="w-full bg-transparent text-gray-100 focus:outline-none text-xs placeholder-gray-500"
          />
        </div>
      )}

      {plugins.length === 0 ? (
        <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
          <Puzzle className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
          <p className="text-xs">No plugins registered yet.</p>
          <p className="text-[11px] text-gray-600">
            Plugins simulate optional extensions to the factory pipeline (linters, scanners,
            integrations) — nothing here actually executes code.
          </p>
          <button
            onClick={handleOpenAdd}
            className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
          >
            Add your first plugin
          </button>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-10 space-y-1 text-gray-500">
          <p className="text-xs">No plugins match &quot;{searchQuery}&quot;.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Puzzle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    {plugin.name}
                  </span>
                  <button
                    onClick={() => handleToggleActive(plugin.id)}
                    aria-label={`${plugin.isActive ? 'Deactivate' : 'Activate'} plugin ${plugin.name}`}
                    className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer transition-colors border ${
                      plugin.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}
                  >
                    {plugin.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <span className="inline-block px-2 py-0.5 rounded bg-[#222734] text-gray-300 font-mono text-[10px]">
                  {plugin.category}
                </span>

                {plugin.description && (
                  <p className="text-xs text-gray-400 leading-relaxed">{plugin.description}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                <button
                  onClick={() => handleOpenEdit(plugin)}
                  aria-label={`Edit plugin ${plugin.name}`}
                  className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]"
                >
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plugin.id)}
                  aria-label={`Delete plugin ${plugin.name}`}
                  className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PLUGIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                {editingPlugin ? 'Edit Plugin' : 'Add Plugin'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
                className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Plugin Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dependency Vulnerability Scanner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                <input
                  type="text"
                  list="plugin-category-suggestions"
                  placeholder="Quality"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
                />
                <datalist id="plugin-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="What this plugin simulates doing in the pipeline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer"
              >
                Save Plugin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
