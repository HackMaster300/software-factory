'use client';

import React, { useState } from 'react';
import {
  Database,
  Shield,
  Box,
  Activity,
  Cpu,
  Plus,
  Edit3,
  Trash2,
  X,
  Zap,
  Lock,
  Rocket,
  KeyRound,
} from 'lucide-react';
import {
  TechStack,
  ProfileCache,
  ProfileLogging,
  ProfileEncryption,
  ProfileDeployment,
  ProfileAuthentication,
} from '../../types/factory';
import { StorageService, useCacheProfiles, useLoggingProfiles, useEncryptionProfiles, useDeploymentProfiles, useAuthenticationProfiles, useTechStacks } from '../../services/storageService';
import { techStackRepository, profileRepository } from '../../services/repositories';

const LANGUAGES: TechStack['language'][] = ['csharp', 'typescript', 'java', 'go', 'python', 'rust', 'kotlin', 'dart'];
const CACHE_PROVIDERS: ProfileCache['provider'][] = ['Redis', 'In-Memory', 'Memcached'];
const LOGGING_PROVIDERS: ProfileLogging['provider'][] = ['Serilog', 'OpenTelemetry', 'Winston', 'Zap'];
const LOG_LEVELS: ProfileLogging['minLevel'][] = ['Information', 'Debug', 'Warning', 'Error'];
const ENCRYPTION_ALGORITHMS: ProfileEncryption['algorithm'][] = ['AES-256-GCM', 'AES-128-CBC', 'ChaCha20-Poly1305', 'RSA-OAEP'];
const DEPLOYMENT_PLATFORMS: ProfileDeployment['targetPlatform'][] = ['Kubernetes', 'Cloud Run', 'Azure App Service', 'AWS ECS', 'Bare Metal'];
const DEPLOYMENT_STRATEGIES: ProfileDeployment['strategy'][] = ['RollingUpdate', 'BlueGreen', 'Canary'];
const AUTH_PROVIDERS: ProfileAuthentication['provider'][] = ['JWT', 'OAuth2', 'SAML', 'API Key'];

type TabId = 'stacks' | 'db' | 'security' | 'docker' | 'cache' | 'logging' | 'encryption' | 'deployment' | 'authentication';

function blankStack(): TechStack {
  return {
    id: '',
    name: '',
    language: 'typescript',
    framework: '',
    packageManager: '',
    testingFramework: '',
    targetRuntime: '',
    description: '',
  };
}

function blankCache(): ProfileCache {
  return { id: '', name: '', provider: 'Redis', defaultTtlMinutes: 30, enableDistributedLock: false };
}

function blankLogging(): ProfileLogging {
  return {
    id: '',
    name: '',
    provider: 'Serilog',
    minLevel: 'Information',
    structuredJson: true,
    sinkToConsole: true,
    sinkToSeqOrJaeger: false,
  };
}

function blankEncryption(): ProfileEncryption {
  return { id: '', name: '', algorithm: 'AES-256-GCM', keyRotationDays: 90, encryptAtRest: true, encryptInTransit: true };
}

function blankDeployment(): ProfileDeployment {
  return { id: '', name: '', targetPlatform: 'Kubernetes', replicas: 2, autoScale: true, strategy: 'RollingUpdate' };
}

function blankAuthentication(): ProfileAuthentication {
  return { id: '', name: '', provider: 'JWT', sessionTimeoutMinutes: 60, enableMfa: false };
}

export const TechStacksView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('stacks');

  const stacks = useTechStacks();
  const dbProfiles = StorageService.getDatabaseProfiles();
  const secProfiles = StorageService.getSecurityProfiles();
  const dockerProfiles = StorageService.getDockerProfiles();
  const cacheProfiles = useCacheProfiles();
  const loggingProfiles = useLoggingProfiles();
  const encryptionProfiles = useEncryptionProfiles();
  const deploymentProfiles = useDeploymentProfiles();
  const authenticationProfiles = useAuthenticationProfiles();

  // Tech Stack modal state
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  const [editingStackId, setEditingStackId] = useState<string | null>(null);
  const [stackForm, setStackForm] = useState<TechStack>(blankStack());

  // Cache modal state
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [editingCacheId, setEditingCacheId] = useState<string | null>(null);
  const [cacheForm, setCacheForm] = useState<ProfileCache>(blankCache());

  // Logging modal state
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [editingLoggingId, setEditingLoggingId] = useState<string | null>(null);
  const [loggingForm, setLoggingForm] = useState<ProfileLogging>(blankLogging());

  // Encryption modal state
  const [isEncryptionModalOpen, setIsEncryptionModalOpen] = useState(false);
  const [editingEncryptionId, setEditingEncryptionId] = useState<string | null>(null);
  const [encryptionForm, setEncryptionForm] = useState<ProfileEncryption>(blankEncryption());

  // Deployment modal state
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [editingDeploymentId, setEditingDeploymentId] = useState<string | null>(null);
  const [deploymentForm, setDeploymentForm] = useState<ProfileDeployment>(blankDeployment());

  // Authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingAuthId, setEditingAuthId] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState<ProfileAuthentication>(blankAuthentication());

  // --- Tech Stack handlers ---
  const handleOpenAddStack = () => {
    setEditingStackId(null);
    setStackForm(blankStack());
    setIsStackModalOpen(true);
  };
  const handleOpenEditStack = (s: TechStack) => {
    setEditingStackId(s.id);
    setStackForm({ ...s });
    setIsStackModalOpen(true);
  };
  const handleSaveStack = () => {
    if (!stackForm.name.trim() || !stackForm.framework.trim()) {
      alert('Please provide a stack name and framework.');
      return;
    }
    const id = editingStackId || `stack-custom-${Date.now()}`;
    const saved: TechStack = { ...stackForm, id };
    const updated = editingStackId ? stacks.map((s) => (s.id === id ? saved : s)) : [...stacks, saved];
    techStackRepository.saveTechStacks(updated);
    setIsStackModalOpen(false);
  };
  const handleDeleteStack = (id: string) => {
    if (!confirm('Delete this technology stack?')) return;
    techStackRepository.saveTechStacks(stacks.filter((s) => s.id !== id));
  };

  // --- Cache handlers ---
  const handleOpenAddCache = () => {
    setEditingCacheId(null);
    setCacheForm(blankCache());
    setIsCacheModalOpen(true);
  };
  const handleOpenEditCache = (p: ProfileCache) => {
    setEditingCacheId(p.id);
    setCacheForm({ ...p });
    setIsCacheModalOpen(true);
  };
  const handleSaveCache = () => {
    if (!cacheForm.name.trim()) {
      alert('Please provide a profile name.');
      return;
    }
    const id = editingCacheId || `cache-prof-custom-${Date.now()}`;
    const saved: ProfileCache = { ...cacheForm, id };
    const updated = editingCacheId ? cacheProfiles.map((p) => (p.id === id ? saved : p)) : [...cacheProfiles, saved];
    profileRepository.saveCacheProfiles(updated);
    setIsCacheModalOpen(false);
  };
  const handleDeleteCache = (id: string) => {
    if (!confirm('Delete this cache profile?')) return;
    profileRepository.saveCacheProfiles(cacheProfiles.filter((p) => p.id !== id));
  };

  // --- Logging handlers ---
  const handleOpenAddLogging = () => {
    setEditingLoggingId(null);
    setLoggingForm(blankLogging());
    setIsLoggingModalOpen(true);
  };
  const handleOpenEditLogging = (p: ProfileLogging) => {
    setEditingLoggingId(p.id);
    setLoggingForm({ ...p });
    setIsLoggingModalOpen(true);
  };
  const handleSaveLogging = () => {
    if (!loggingForm.name.trim()) {
      alert('Please provide a profile name.');
      return;
    }
    const id = editingLoggingId || `log-prof-custom-${Date.now()}`;
    const saved: ProfileLogging = { ...loggingForm, id };
    const updated = editingLoggingId ? loggingProfiles.map((p) => (p.id === id ? saved : p)) : [...loggingProfiles, saved];
    profileRepository.saveLoggingProfiles(updated);
    setIsLoggingModalOpen(false);
  };
  const handleDeleteLogging = (id: string) => {
    if (!confirm('Delete this logging profile?')) return;
    profileRepository.saveLoggingProfiles(loggingProfiles.filter((p) => p.id !== id));
  };

  // --- Encryption handlers ---
  const handleOpenAddEncryption = () => {
    setEditingEncryptionId(null);
    setEncryptionForm(blankEncryption());
    setIsEncryptionModalOpen(true);
  };
  const handleOpenEditEncryption = (p: ProfileEncryption) => {
    setEditingEncryptionId(p.id);
    setEncryptionForm({ ...p });
    setIsEncryptionModalOpen(true);
  };
  const handleSaveEncryption = () => {
    if (!encryptionForm.name.trim()) {
      alert('Please provide a profile name.');
      return;
    }
    const id = editingEncryptionId || `enc-prof-${Date.now()}`;
    const saved: ProfileEncryption = { ...encryptionForm, id };
    const updated = editingEncryptionId
      ? encryptionProfiles.map((p) => (p.id === id ? saved : p))
      : [...encryptionProfiles, saved];
    profileRepository.saveEncryptionProfiles(updated);
    setIsEncryptionModalOpen(false);
  };
  const handleDeleteEncryption = (id: string) => {
    if (!confirm('Delete this encryption profile?')) return;
    profileRepository.saveEncryptionProfiles(encryptionProfiles.filter((p) => p.id !== id));
  };

  // --- Deployment handlers ---
  const handleOpenAddDeployment = () => {
    setEditingDeploymentId(null);
    setDeploymentForm(blankDeployment());
    setIsDeploymentModalOpen(true);
  };
  const handleOpenEditDeployment = (p: ProfileDeployment) => {
    setEditingDeploymentId(p.id);
    setDeploymentForm({ ...p });
    setIsDeploymentModalOpen(true);
  };
  const handleSaveDeployment = () => {
    if (!deploymentForm.name.trim()) {
      alert('Please provide a profile name.');
      return;
    }
    const id = editingDeploymentId || `deploy-prof-${Date.now()}`;
    const saved: ProfileDeployment = { ...deploymentForm, id };
    const updated = editingDeploymentId
      ? deploymentProfiles.map((p) => (p.id === id ? saved : p))
      : [...deploymentProfiles, saved];
    profileRepository.saveDeploymentProfiles(updated);
    setIsDeploymentModalOpen(false);
  };
  const handleDeleteDeployment = (id: string) => {
    if (!confirm('Delete this deployment profile?')) return;
    profileRepository.saveDeploymentProfiles(deploymentProfiles.filter((p) => p.id !== id));
  };

  // --- Authentication handlers ---
  const handleOpenAddAuth = () => {
    setEditingAuthId(null);
    setAuthForm(blankAuthentication());
    setIsAuthModalOpen(true);
  };
  const handleOpenEditAuth = (p: ProfileAuthentication) => {
    setEditingAuthId(p.id);
    setAuthForm({ ...p });
    setIsAuthModalOpen(true);
  };
  const handleSaveAuth = () => {
    if (!authForm.name.trim()) {
      alert('Please provide a profile name.');
      return;
    }
    const id = editingAuthId || `auth-prof-${Date.now()}`;
    const saved: ProfileAuthentication = { ...authForm, id };
    const updated = editingAuthId ? authenticationProfiles.map((p) => (p.id === id ? saved : p)) : [...authenticationProfiles, saved];
    profileRepository.saveAuthenticationProfiles(updated);
    setIsAuthModalOpen(false);
  };
  const handleDeleteAuth = (id: string) => {
    if (!confirm('Delete this authentication profile?')) return;
    profileRepository.saveAuthenticationProfiles(authenticationProfiles.filter((p) => p.id !== id));
  };

  const tabs: Array<{ id: TabId; label: string; count: number; icon: React.ReactNode }> = [
    { id: 'stacks', label: 'Language Stacks', count: stacks.length, icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'db', label: 'Database Profiles', count: dbProfiles.length, icon: <Database className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Security Profiles', count: secProfiles.length, icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'docker', label: 'Docker Profiles', count: dockerProfiles.length, icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'cache', label: 'Cache Profiles', count: cacheProfiles.length, icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'logging', label: 'Logging Profiles', count: loggingProfiles.length, icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'encryption', label: 'Encryption Profiles', count: encryptionProfiles.length, icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'deployment', label: 'Deployment Profiles', count: deploymentProfiles.length, icon: <Rocket className="w-3.5 h-3.5" /> },
    { id: 'authentication', label: 'Authentication Profiles', count: authenticationProfiles.length, icon: <KeyRound className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs text-gray-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b303d] rounded-xl p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px] font-semibold">
              Platform Registry
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-mono">{stacks.length} Supported Frameworks</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Technology Stacks & Infrastructure Profiles</h1>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#2b303d] pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label} ({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'stacks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddStack}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Tech Stack
            </button>
          </div>
          {stacks.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <Cpu className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No technology stacks yet.</p>
              <button onClick={handleOpenAddStack} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first tech stack
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stacks.map((st) => (
                <div key={st.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{st.name}</div>
                      <div className="text-[11px] font-mono text-blue-400">{st.language} • {st.framework}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#222734] border border-[#303748] text-gray-300 font-mono text-[10px]">
                      {st.targetRuntime}
                    </span>
                  </div>

                  <div className="text-gray-400 text-xs">{st.description}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400 pt-2 border-t border-[#262a36]">
                    <div>Package Mgr: <span className="text-gray-200">{st.packageManager}</span></div>
                    <div>Testing: <span className="text-gray-200">{st.testingFramework}</span></div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button
                      onClick={() => handleOpenEditStack(st)}
                      aria-label={`Edit tech stack ${st.name}`}
                      className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteStack(st.id)}
                      aria-label={`Delete tech stack ${st.name}`}
                      className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'db' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dbProfiles.map((db) => (
            <div key={db.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-white">{db.name}</div>
              <div className="text-xs text-gray-400">Provider: <span className="font-mono text-blue-400">{db.provider}</span> • ORM: <span className="font-mono text-purple-400">{db.orm}</span></div>
              <div className="p-2 bg-[#12141a] border border-[#252834] rounded font-mono text-[10px] text-gray-300 truncate">
                Connection Key: {db.connectionStringName} (Migrations: {db.enableMigrations ? 'Enabled' : 'Disabled'})
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secProfiles.map((sec) => (
            <div key={sec.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-white">{sec.name}</div>
              <div className="text-xs text-gray-400">JWT Issuer: <span className="font-mono text-emerald-400">{sec.jwtIssuer}</span></div>
              <div className="text-[11px] text-gray-400 font-mono">
                Lifetime: {sec.tokenLifetimeMinutes}m • CORS: {sec.enableCors ? 'Active' : 'Off'} • Rate Limit: {sec.enableRateLimiting ? `${sec.rateLimitPermitLimit} reqs` : 'Disabled'}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dockerProfiles.map((doc) => (
            <div key={doc.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-white">{doc.name}</div>
              <div className="text-xs text-gray-400">Base Image: <span className="font-mono text-purple-400">{doc.baseImage}</span></div>
              <div className="text-[11px] text-gray-400 font-mono">
                Multi-Stage: {doc.multiStage ? 'Enabled' : 'Disabled'} • Ports: {doc.exposePorts.join(', ')} • Compose: {doc.includeDockerCompose ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cache' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddCache}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Cache Profile
            </button>
          </div>
          {cacheProfiles.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <Zap className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No cache profiles yet.</p>
              <button onClick={handleOpenAddCache} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first cache profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cacheProfiles.map((p) => (
                <div key={p.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">Provider: <span className="font-mono text-blue-400">{p.provider}</span></div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Default TTL: {p.defaultTtlMinutes}m • Distributed Lock: {p.enableDistributedLock ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button onClick={() => handleOpenEditCache(p)} aria-label={`Edit cache profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]">
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button onClick={() => handleDeleteCache(p.id)} aria-label={`Delete cache profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logging' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddLogging}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Logging Profile
            </button>
          </div>
          {loggingProfiles.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <Activity className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No logging profiles yet.</p>
              <button onClick={handleOpenAddLogging} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first logging profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loggingProfiles.map((p) => (
                <div key={p.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">Provider: <span className="font-mono text-blue-400">{p.provider}</span> • Min Level: <span className="font-mono text-purple-400">{p.minLevel}</span></div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    JSON: {p.structuredJson ? 'Yes' : 'No'} • Console: {p.sinkToConsole ? 'Yes' : 'No'} • Seq/Jaeger: {p.sinkToSeqOrJaeger ? 'Yes' : 'No'}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button onClick={() => handleOpenEditLogging(p)} aria-label={`Edit logging profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]">
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button onClick={() => handleDeleteLogging(p.id)} aria-label={`Delete logging profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'encryption' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddEncryption}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Encryption Profile
            </button>
          </div>
          {encryptionProfiles.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <Lock className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No encryption profiles yet.</p>
              <button onClick={handleOpenAddEncryption} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first encryption profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {encryptionProfiles.map((p) => (
                <div key={p.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">Algorithm: <span className="font-mono text-blue-400">{p.algorithm}</span></div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Key Rotation: {p.keyRotationDays}d • At Rest: {p.encryptAtRest ? 'Yes' : 'No'} • In Transit: {p.encryptInTransit ? 'Yes' : 'No'}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button onClick={() => handleOpenEditEncryption(p)} aria-label={`Edit encryption profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]">
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button onClick={() => handleDeleteEncryption(p.id)} aria-label={`Delete encryption profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'deployment' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddDeployment}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Deployment Profile
            </button>
          </div>
          {deploymentProfiles.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <Rocket className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No deployment profiles yet.</p>
              <button onClick={handleOpenAddDeployment} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first deployment profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deploymentProfiles.map((p) => (
                <div key={p.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">Target: <span className="font-mono text-blue-400">{p.targetPlatform}</span> • Strategy: <span className="font-mono text-purple-400">{p.strategy}</span></div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Replicas: {p.replicas} • Auto-Scale: {p.autoScale ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button onClick={() => handleOpenEditDeployment(p)} aria-label={`Edit deployment profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]">
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button onClick={() => handleDeleteDeployment(p.id)} aria-label={`Delete deployment profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'authentication' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddAuth}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Create Authentication Profile
            </button>
          </div>
          {authenticationProfiles.length === 0 ? (
            <div className="text-center py-16 space-y-2 bg-[#181a20] border border-[#2b303d] rounded-xl text-gray-500">
              <KeyRound className="w-8 h-8 mx-auto text-gray-600" aria-hidden="true" />
              <p className="text-xs">No authentication profiles yet.</p>
              <button onClick={handleOpenAddAuth} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                Create your first authentication profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authenticationProfiles.map((p) => (
                <div key={p.id} className="bg-[#181a20] border border-[#2b303d] rounded-xl p-4 space-y-2">
                  <div className="font-bold text-sm text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">Provider: <span className="font-mono text-blue-400">{p.provider}</span></div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Session Timeout: {p.sessionTimeoutMinutes}m • MFA: {p.enableMfa ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262a36]">
                    <button onClick={() => handleOpenEditAuth(p)} aria-label={`Edit authentication profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748]">
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button onClick={() => handleDeleteAuth(p.id)} aria-label={`Delete authentication profile ${p.name}`} className="px-2.5 py-1 bg-[#222734] hover:bg-red-900/40 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1 border border-[#303748] hover:border-red-800/50">
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT TECH STACK MODAL */}
      {isStackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                {editingStackId ? 'Edit Technology Stack' : 'Create Technology Stack'}
              </span>
              <button onClick={() => setIsStackModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Stack Name</label>
                <input type="text" placeholder="e.g. Bun + Elysia Edge API" value={stackForm.name} onChange={(e) => setStackForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Language</label>
                  <select value={stackForm.language} onChange={(e) => setStackForm((p) => ({ ...p, language: e.target.value as TechStack['language'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Framework</label>
                  <input type="text" placeholder="e.g. Elysia" value={stackForm.framework} onChange={(e) => setStackForm((p) => ({ ...p, framework: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Package Manager</label>
                  <input type="text" placeholder="e.g. bun" value={stackForm.packageManager} onChange={(e) => setStackForm((p) => ({ ...p, packageManager: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Testing Framework</label>
                  <input type="text" placeholder="e.g. bun:test" value={stackForm.testingFramework} onChange={(e) => setStackForm((p) => ({ ...p, testingFramework: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Target Runtime</label>
                <input type="text" placeholder="e.g. Bun 1.x Container" value={stackForm.targetRuntime} onChange={(e) => setStackForm((p) => ({ ...p, targetRuntime: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <textarea rows={2} placeholder="What this stack is optimized for..." value={stackForm.description} onChange={(e) => setStackForm((p) => ({ ...p, description: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 leading-relaxed" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsStackModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveStack} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Tech Stack</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CACHE PROFILE MODAL */}
      {isCacheModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                {editingCacheId ? 'Edit Cache Profile' : 'Create Cache Profile'}
              </span>
              <button onClick={() => setIsCacheModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Profile Name</label>
                <input type="text" placeholder="e.g. Redis Sentinel HA Cache" value={cacheForm.name} onChange={(e) => setCacheForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Provider</label>
                  <select value={cacheForm.provider} onChange={(e) => setCacheForm((p) => ({ ...p, provider: e.target.value as ProfileCache['provider'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {CACHE_PROVIDERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Default TTL (minutes)</label>
                  <input type="number" value={cacheForm.defaultTtlMinutes} onChange={(e) => setCacheForm((p) => ({ ...p, defaultTtlMinutes: Number(e.target.value) || 0 }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={cacheForm.enableDistributedLock} onChange={(e) => setCacheForm((p) => ({ ...p, enableDistributedLock: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                Enable Distributed Lock
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsCacheModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveCache} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Cache Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT LOGGING PROFILE MODAL */}
      {isLoggingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                {editingLoggingId ? 'Edit Logging Profile' : 'Create Logging Profile'}
              </span>
              <button onClick={() => setIsLoggingModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Profile Name</label>
                <input type="text" placeholder="e.g. Winston + Console + Loki" value={loggingForm.name} onChange={(e) => setLoggingForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Provider</label>
                  <select value={loggingForm.provider} onChange={(e) => setLoggingForm((p) => ({ ...p, provider: e.target.value as ProfileLogging['provider'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {LOGGING_PROVIDERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Minimum Level</label>
                  <select value={loggingForm.minLevel} onChange={(e) => setLoggingForm((p) => ({ ...p, minLevel: e.target.value as ProfileLogging['minLevel'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {LOG_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={loggingForm.structuredJson} onChange={(e) => setLoggingForm((p) => ({ ...p, structuredJson: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  Structured JSON Output
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={loggingForm.sinkToConsole} onChange={(e) => setLoggingForm((p) => ({ ...p, sinkToConsole: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  Sink to Console
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={loggingForm.sinkToSeqOrJaeger} onChange={(e) => setLoggingForm((p) => ({ ...p, sinkToSeqOrJaeger: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  Sink to Seq / Jaeger
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsLoggingModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveLogging} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Logging Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ENCRYPTION PROFILE MODAL */}
      {isEncryptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" aria-hidden="true" />
                {editingEncryptionId ? 'Edit Encryption Profile' : 'Create Encryption Profile'}
              </span>
              <button onClick={() => setIsEncryptionModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Profile Name</label>
                <input type="text" placeholder="e.g. Enterprise At-Rest AES-256" value={encryptionForm.name} onChange={(e) => setEncryptionForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Algorithm</label>
                  <select value={encryptionForm.algorithm} onChange={(e) => setEncryptionForm((p) => ({ ...p, algorithm: e.target.value as ProfileEncryption['algorithm'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {ENCRYPTION_ALGORITHMS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Key Rotation (days)</label>
                  <input type="number" value={encryptionForm.keyRotationDays} onChange={(e) => setEncryptionForm((p) => ({ ...p, keyRotationDays: Number(e.target.value) || 0 }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={encryptionForm.encryptAtRest} onChange={(e) => setEncryptionForm((p) => ({ ...p, encryptAtRest: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  Encrypt Data At Rest
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={encryptionForm.encryptInTransit} onChange={(e) => setEncryptionForm((p) => ({ ...p, encryptInTransit: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  Encrypt Data In Transit
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsEncryptionModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveEncryption} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Encryption Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DEPLOYMENT PROFILE MODAL */}
      {isDeploymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-400" aria-hidden="true" />
                {editingDeploymentId ? 'Edit Deployment Profile' : 'Create Deployment Profile'}
              </span>
              <button onClick={() => setIsDeploymentModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Profile Name</label>
                <input type="text" placeholder="e.g. Production Kubernetes Cluster" value={deploymentForm.name} onChange={(e) => setDeploymentForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Target Platform</label>
                  <select value={deploymentForm.targetPlatform} onChange={(e) => setDeploymentForm((p) => ({ ...p, targetPlatform: e.target.value as ProfileDeployment['targetPlatform'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {DEPLOYMENT_PLATFORMS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Strategy</label>
                  <select value={deploymentForm.strategy} onChange={(e) => setDeploymentForm((p) => ({ ...p, strategy: e.target.value as ProfileDeployment['strategy'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {DEPLOYMENT_STRATEGIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Replicas</label>
                <input type="number" min={1} value={deploymentForm.replicas} onChange={(e) => setDeploymentForm((p) => ({ ...p, replicas: Number(e.target.value) || 1 }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={deploymentForm.autoScale} onChange={(e) => setDeploymentForm((p) => ({ ...p, autoScale: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                Enable Auto-Scaling
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsDeploymentModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveDeployment} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Deployment Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT AUTHENTICATION PROFILE MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262a36] pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" aria-hidden="true" />
                {editingAuthId ? 'Edit Authentication Profile' : 'Create Authentication Profile'}
              </span>
              <button onClick={() => setIsAuthModalOpen(false)} aria-label="Close dialog" className="p-1 rounded text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Profile Name</label>
                <input type="text" placeholder="e.g. Enterprise SSO SAML" value={authForm.name} onChange={(e) => setAuthForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Provider</label>
                  <select value={authForm.provider} onChange={(e) => setAuthForm((p) => ({ ...p, provider: e.target.value as ProfileAuthentication['provider'] }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500">
                    {AUTH_PROVIDERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Session Timeout (minutes)</label>
                  <input type="number" value={authForm.sessionTimeoutMinutes} onChange={(e) => setAuthForm((p) => ({ ...p, sessionTimeoutMinutes: Number(e.target.value) || 0 }))} className="w-full bg-[#12141a] border border-[#2b303d] rounded p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={authForm.enableMfa} onChange={(e) => setAuthForm((p) => ({ ...p, enableMfa: e.target.checked }))} className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                Require Multi-Factor Authentication
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#262a36]">
              <button type="button" onClick={() => setIsAuthModalOpen(false)} className="px-3 py-1.5 bg-[#222734] hover:bg-[#2b3142] text-gray-300 rounded font-medium cursor-pointer">Cancel</button>
              <button type="button" onClick={handleSaveAuth} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium cursor-pointer">Save Authentication Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
