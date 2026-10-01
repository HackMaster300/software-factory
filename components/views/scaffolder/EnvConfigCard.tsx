'use client';

import { CheckCircle2, Trash2, Plus, Settings, Key, FileText } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { ScaffolderState } from './useProjectScaffolder';

/** Wizard step 2: .env file configuration. */
export function EnvConfigCard({ wizard }: { wizard: ScaffolderState }) {
  const {
    useEnvFile, setUseEnvFile, envVars, newEnvKey, setNewEnvKey, newEnvVal, setNewEnvVal,
    newEnvDesc, setNewEnvDesc, activeTechStack, handleAddEnvVar, handleRemoveEnvVar,
    handleAddPresetEnv, handleLoadStackEnvPresets,
  } = wizard;
  return (
          <Card className="space-y-4">
            <div className="space-y-1 border-b border-[#232838] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <h3 className="font-semibold text-gray-100 text-xs">
                  Environment Variable & Local Secret Configuration (.env)
                </h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Choose whether your generated project should include local <span className="text-gray-200 font-mono">.env</span> configuration files or rely purely on direct OS / Cloud environment variables.
              </p>
            </div>

            {/* Prompt Option Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card
                interactive
                onClick={() => setUseEnvFile(true)}
                className={`space-y-2 ${useEnvFile ? 'border-blue-500 bg-blue-600/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" /> Use .env Local Configuration Files
                  </span>
                  {useEnvFile && <Badge tone="success">Active</Badge>}
                </div>
                <p className="text-[11px] text-gray-300 leading-normal">
                  Generates <span className="font-mono text-gray-200 text-[10px]">.env</span> and <span className="font-mono text-gray-200 text-[10px]">.env.example</span> in solution root with customizable keys for local development.
                </p>
              </Card>

              <Card
                interactive
                onClick={() => setUseEnvFile(false)}
                className={`space-y-2 ${!useEnvFile ? 'border-blue-500 bg-blue-600/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-100 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-blue-400" aria-hidden="true" /> Do NOT Use .env Files (Direct OS / Secret Manager)
                  </span>
                  {!useEnvFile && <Badge tone="success">Active</Badge>}
                </div>
                <p className="text-[11px] text-gray-300 leading-normal">
                  No local <span className="font-mono text-gray-400 text-[10px]">.env</span> files. Configures environment setting loading via OS process environment variables, Docker secrets, or cloud vaults.
                </p>
              </Card>
            </div>

            {/* Configurable .env Variables Editor Table (Only shown if useEnvFile is true) */}
            {useEnvFile && (
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Configured .env Keys & Values ({envVars.length})
                  </span>

                  {/* Preset Quick Add Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button size="sm" variant="secondary" onClick={handleLoadStackEnvPresets} className="mr-1">
                      <Settings className="w-3 h-3" aria-hidden="true" /> Auto-Load {activeTechStack.name} Presets
                    </Button>
                    <span className="text-[10px] text-gray-400">Presets:</span>
                    <button
                      onClick={() => handleAddPresetEnv('DATABASE_URL', 'postgresql://admin:secret@localhost:5432/db', 'Primary Database Connection')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + Postgres
                    </button>
                    <button
                      onClick={() => handleAddPresetEnv('JWT_SECRET', 'super-secret-key-32-bytes-minimum!', 'Token Auth Secret')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + JWT
                    </button>
                    <button
                      onClick={() => handleAddPresetEnv('REDIS_URL', 'redis://localhost:6379', 'Redis Host')}
                      className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-gray-300 rounded text-[10px] cursor-pointer"
                    >
                      + Redis
                    </button>
                  </div>
                </div>

                {/* Variable Creation Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-[#13151b] p-2 rounded border border-[#2b303d]">
                  <Input
                    type="text"
                    placeholder="KEY (e.g., API_KEY)"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    className="font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="VALUE (e.g., secret_123)"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    className="font-mono"
                  />
                  <Input
                    type="text"
                    placeholder="Description (optional)"
                    value={newEnvDesc}
                    onChange={(e) => setNewEnvDesc(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleAddEnvVar}>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Variable
                  </Button>
                </div>

                {/* Active Key Value Table */}
                <div className="space-y-1 font-mono text-[11px]">
                  {envVars.map((v) => (
                    <div key={v.key} className="flex items-center justify-between p-2 bg-[#13151b] border border-[#2b303d] rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-200 font-bold">{v.key}</span>
                        <span className="text-gray-500">=</span>
                        <span className="text-gray-300">{v.value}</span>
                        {v.description && <span className="text-gray-500 font-sans text-[10px]">({v.description})</span>}
                      </div>

                      <button
                        onClick={() => handleRemoveEnvVar(v.key)}
                        className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                        title="Delete key"
                        aria-label={`Delete environment variable ${v.key}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Card>
  );
}
