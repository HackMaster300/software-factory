'use client';

import React, { useState } from 'react';
import { Puzzle, Plus, Edit3, Trash2, X, Search } from 'lucide-react';
import { Plugin } from '../../types/factory';
import { StorageService, usePlugins } from '../../services/storageService';
import { pluginRepository } from '../../services/repositories';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { showToast } from '../../hooks/use-toasts';

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
    const toDelete = plugins.find((p) => p.id === id);
    if (!toDelete) return;
    pluginRepository.savePlugins(plugins.filter((p) => p.id !== id));
    showToast(`"${toDelete.name}" deleted.`, {
      label: 'Undo',
      onAction: () => pluginRepository.savePlugins([...StorageService.getPlugins(), toDelete]),
    });
  };

  const handleToggleActive = (id: string) => {
    const updated = plugins.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    pluginRepository.savePlugins(updated);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">Extensibility</Badge>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{plugins.length} Plugins Registered</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Plugins</h1>
        </div>

        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Plugin
        </Button>
      </Card>

      {plugins.length > 0 && (
        <div className="flex items-center gap-2 bg-[#181a20] border border-[#2b303d] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins by name or category..."
            className="w-full bg-transparent text-gray-100 focus:outline-none text-xs placeholder-gray-400"
          />
        </div>
      )}

      {plugins.length === 0 ? (
        <Card className="text-center py-16 space-y-2 text-gray-500">
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
        </Card>
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
            <Card key={plugin.id} interactive className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Puzzle className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    {plugin.name}
                  </span>
                  <button
                    onClick={() => handleToggleActive(plugin.id)}
                    aria-label={`${plugin.isActive ? 'Deactivate' : 'Activate'} plugin ${plugin.name}`}
                    className="cursor-pointer"
                  >
                    <Badge tone={plugin.isActive ? 'success' : 'neutral'}>
                      {plugin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </div>

                <Badge tone="neutral" className="normal-case">{plugin.category}</Badge>

                {plugin.description && (
                  <p className="text-xs text-gray-400 leading-relaxed">{plugin.description}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2b303d]">
                <Button size="sm" onClick={() => handleOpenEdit(plugin)} aria-label={`Edit plugin ${plugin.name}`}>
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" onClick={() => handleDelete(plugin.id)} aria-label={`Delete plugin ${plugin.name}`} className="hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PLUGIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {editingPlugin ? 'Edit Plugin' : 'Add Plugin'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Plugin Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Dependency Vulnerability Scanner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Category</label>
                <Input
                  type="text"
                  list="plugin-category-suggestions"
                  placeholder="Quality"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="plugin-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <Textarea
                  rows={3}
                  placeholder="What this plugin simulates doing in the pipeline..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Plugin
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
