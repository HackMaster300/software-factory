'use client';

import React, { useState } from 'react';
import { Building2, FolderGit2, Plus, Edit3, Trash2, X } from 'lucide-react';
import { Organization, Workspace } from '../types/factory';
import { useOrganizations, useWorkspaces } from '../services/storageService';
import { organizationRepository, workspaceRepository } from '../services/repositories';

interface OrganizationWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_OPTIONS: Organization['plan'][] = ['Enterprise', 'Team', 'Developer'];

export const OrganizationWorkspaceModal: React.FC<OrganizationWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const organizations = useOrganizations();
  const workspaces = useWorkspaces();

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgPlan, setOrgPlan] = useState<Organization['plan']>('Team');
  const [isOrgFormOpen, setIsOrgFormOpen] = useState(false);

  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [isWsFormOpen, setIsWsFormOpen] = useState(false);

  if (!isOpen) return null;

  const activeOrgId = selectedOrgId || organizations[0]?.id || '';
  const scopedWorkspaces = workspaces.filter((w) => w.organizationId === activeOrgId);

  const resetOrgForm = () => {
    setEditingOrg(null);
    setOrgName('');
    setOrgCode('');
    setOrgPlan('Team');
  };

  const resetWsForm = () => {
    setEditingWs(null);
    setWsName('');
    setWsDescription('');
  };

  const handleOpenAddOrg = () => {
    resetOrgForm();
    setIsOrgFormOpen(true);
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgCode(org.code);
    setOrgPlan(org.plan);
    setIsOrgFormOpen(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgCode.trim()) return;

    const id = editingOrg ? editingOrg.id : `org-${Date.now()}`;
    const newOrg: Organization = {
      id,
      name: orgName.trim(),
      code: orgCode.trim(),
      plan: orgPlan,
    };

    const updated = editingOrg
      ? organizations.map((o) => (o.id === id ? newOrg : o))
      : [...organizations, newOrg];

    organizationRepository.saveOrganizations(updated);
    setSelectedOrgId(id);
    setIsOrgFormOpen(false);
    resetOrgForm();
  };

  const handleDeleteOrg = (org: Organization) => {
    const orgWorkspaces = workspaces.filter((w) => w.organizationId === org.id);
    const confirmMsg =
      orgWorkspaces.length > 0
        ? `Delete "${org.name}" and its ${orgWorkspaces.length} workspace(s)? This cannot be undone.`
        : `Delete organization "${org.name}"? This cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    // Cascade-delete: removing an Organization also removes its Workspaces,
    // since a Workspace has no meaning without its parent Organization and
    // nothing else in this app enforces referential integrity for us.
    organizationRepository.saveOrganizations(organizations.filter((o) => o.id !== org.id));
    workspaceRepository.saveWorkspaces(workspaces.filter((w) => w.organizationId !== org.id));

    if (selectedOrgId === org.id) setSelectedOrgId('');
  };

  const handleOpenAddWs = () => {
    resetWsForm();
    setIsWsFormOpen(true);
  };

  const handleOpenEditWs = (ws: Workspace) => {
    setEditingWs(ws);
    setWsName(ws.name);
    setWsDescription(ws.description);
    setIsWsFormOpen(true);
  };

  const handleSaveWs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !activeOrgId) return;

    const id = editingWs ? editingWs.id : `ws-${Date.now()}`;
    const newWs: Workspace = {
      id,
      organizationId: activeOrgId,
      name: wsName.trim(),
      description: wsDescription.trim(),
    };

    const updated = editingWs
      ? workspaces.map((w) => (w.id === id ? newWs : w))
      : [...workspaces, newWs];

    workspaceRepository.saveWorkspaces(updated);
    setIsWsFormOpen(false);
    resetWsForm();
  };

  const handleDeleteWs = (ws: Workspace) => {
    if (!confirm(`Delete workspace "${ws.name}"? This cannot be undone.`)) return;
    workspaceRepository.saveWorkspaces(workspaces.filter((w) => w.id !== ws.id));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2b303d] w-full max-w-3xl rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#2b303d] p-4 shrink-0">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" aria-hidden="true" />
            Organizations &amp; Workspaces
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          {/* Organizations column */}
          <div className="p-4 border-r border-[#2b303d] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">Organizations ({organizations.length})</span>
              <button
                onClick={handleOpenAddOrg}
                aria-label="New Organization"
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {organizations.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-gray-500">
                <Building2 className="w-6 h-6 mx-auto text-gray-600" aria-hidden="true" />
                <p className="text-xs">No organizations yet.</p>
                <button
                  onClick={handleOpenAddOrg}
                  className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                >
                  Create your first organization
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => {
                  const isSelected = activeOrgId === org.id;
                  return (
                    <div
                      key={org.id}
                      onClick={() => setSelectedOrgId(org.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'bg-[#13151c] border-[#262a36] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-100 text-xs">{org.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {org.code} • {org.plan}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditOrg(org);
                            }}
                            aria-label={`Edit organization ${org.name}`}
                            className="p-1 text-gray-400 hover:text-white rounded cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrg(org);
                            }}
                            aria-label={`Delete organization ${org.name}`}
                            className="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isOrgFormOpen && (
              <form
                onSubmit={handleSaveOrg}
                className="p-3 bg-[#13151c] border border-[#2e3446] rounded-lg space-y-2"
              >
                <div className="text-xs font-semibold text-gray-200">
                  {editingOrg ? 'Edit Organization' : 'New Organization'}
                </div>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name"
                  className="w-full bg-[#0f1115] border border-[#2e3446] text-white rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  placeholder="Short code (e.g. ACME)"
                  className="w-full bg-[#0f1115] border border-[#2e3446] text-white rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                  required
                />
                <select
                  value={orgPlan}
                  onChange={(e) => setOrgPlan(e.target.value as Organization['plan'])}
                  className="w-full bg-[#0f1115] border border-[#2e3446] text-white rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgFormOpen(false);
                      resetOrgForm();
                    }}
                    className="px-3 py-1.5 bg-[#202430] text-gray-300 hover:text-white rounded cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold cursor-pointer text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Workspaces column */}
          <div className="p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                Workspaces ({scopedWorkspaces.length})
              </span>
              <button
                onClick={handleOpenAddWs}
                disabled={!activeOrgId}
                aria-label="New Workspace"
                className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {!activeOrgId ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                Create or select an organization first.
              </div>
            ) : scopedWorkspaces.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-gray-500">
                <FolderGit2 className="w-6 h-6 mx-auto text-gray-600" aria-hidden="true" />
                <p className="text-xs">No workspaces yet for this organization.</p>
                <button
                  onClick={handleOpenAddWs}
                  className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium"
                >
                  Create your first workspace
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {scopedWorkspaces.map((ws) => (
                  <div key={ws.id} className="p-3 rounded-lg border bg-[#13151c] border-[#262a36]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-100 text-xs">{ws.name}</div>
                        {ws.description && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{ws.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditWs(ws)}
                          aria-label={`Edit workspace ${ws.name}`}
                          className="p-1 text-gray-400 hover:text-white rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteWs(ws)}
                          aria-label={`Delete workspace ${ws.name}`}
                          className="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isWsFormOpen && activeOrgId && (
              <form
                onSubmit={handleSaveWs}
                className="p-3 bg-[#13151c] border border-[#2e3446] rounded-lg space-y-2"
              >
                <div className="text-xs font-semibold text-gray-200">
                  {editingWs ? 'Edit Workspace' : 'New Workspace'}
                </div>
                <input
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full bg-[#0f1115] border border-[#2e3446] text-white rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                  required
                />
                <textarea
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-[#0f1115] border border-[#2e3446] text-white rounded p-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWsFormOpen(false);
                      resetWsForm();
                    }}
                    className="px-3 py-1.5 bg-[#202430] text-gray-300 hover:text-white rounded cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold cursor-pointer text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
