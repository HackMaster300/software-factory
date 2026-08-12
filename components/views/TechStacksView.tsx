'use client';

import React, { useState } from 'react';
import { Server, Database, Shield, Box, Activity, Cpu } from 'lucide-react';
import { StorageService } from '../../services/storageService';

export const TechStacksView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stacks' | 'db' | 'security' | 'docker'>('stacks');

  const stacks = StorageService.getTechStacks();
  const dbProfiles = StorageService.getDatabaseProfiles();
  const secProfiles = StorageService.getSecurityProfiles();
  const dockerProfiles = StorageService.getDockerProfiles();

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
      <div className="flex items-center gap-2 border-b border-[#2b303d] pb-2">
        <button
          onClick={() => setActiveTab('stacks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'stacks' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Language Stacks ({stacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('db')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'db' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database Profiles ({dbProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'security' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security Profiles ({secProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docker')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
            activeTab === 'docker' ? 'bg-blue-600 text-white' : 'bg-[#181a20] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Docker Profiles ({dockerProfiles.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'stacks' && (
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
            </div>
          ))}
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
    </div>
  );
};
