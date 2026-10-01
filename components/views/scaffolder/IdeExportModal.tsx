'use client';

import {
  CheckCircle2, ShieldCheck, Code2, ShieldAlert, Download, ExternalLink, Copy, TerminalSquare,
  Laptop, Monitor, X, FolderCheck, GitBranch, Globe,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { ScaffolderState } from './useProjectScaffolder';

/** IDE export / direct-to-disk / git push modal. */
export function IdeExportModal({ wizard }: { wizard: ScaffolderState }) {
  const {
    projectName, isDownloadingZip, setShowIdeExportModal, copiedCmdText, directDiskStatus,
    writtenFilesCount, selectedFolderName, handleCopyCmd, localPathInput, setLocalPathInput,
    handleExportDirectToDisk, handleLaunchVSCodeDirectly, activeTechStack,
    handleDownloadSolutionZip,
  } = wizard;
  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#181a20] border border-[#2b303d] rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-xs text-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#262a36] pb-4">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Laptop className="w-5 h-5 text-blue-400" aria-hidden="true" />
                  <span>IDE Direct Export & Local Workspace Integration</span>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Connect your scaffolded <span className="text-white font-mono">{projectName}</span> solution directly with VS Code, Visual Studio, JetBrains Rider, or local disk.
                </p>
              </div>
              <button
                onClick={() => setShowIdeExportModal(false)}
                aria-label="Close export dialog"
                className="min-w-11 min-h-11 inline-flex items-center justify-center text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Fase 2: Direct Disk Sync (File System Access API) Section */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-100 text-xs flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-blue-400" aria-hidden="true" />
                    <span>Fase 2: Direct Local Disk Sync (Browser File System Access API)</span>
                  </div>
                  <p className="text-gray-300 text-[11px] mt-0.5">
                    Write solution files directly to a folder on your computer without zipping/unzipping.
                  </p>
                </div>
                <Button variant="primary" onClick={() => handleExportDirectToDisk(false)} disabled={directDiskStatus === 'writing'} className="shrink-0">
                  <FolderCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{directDiskStatus === 'writing' ? 'Syncing...' : 'Select Local Folder & Write Files'}</span>
                </Button>
              </div>

              {directDiskStatus === 'success' && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between font-mono text-[11px] text-emerald-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Successfully written <strong className="text-white">{writtenFilesCount} files</strong> to <code className="text-emerald-200">&quot;{selectedFolderName}&quot;</code>!
                  </span>
                  <Button size="sm" variant="primary" onClick={handleLaunchVSCodeDirectly} title={`Open ${localPathInput} in VS Code`} className="shrink-0">
                    <ExternalLink className="w-3 h-3" aria-hidden="true" /> Open in VS Code
                  </Button>
                </div>
              )}

              {directDiskStatus === 'iframe_blocked' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2 text-[11px] text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Browser Security Restriction (Iframe Preview Sandbox)</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Browsers block direct folder pickers inside sandboxed preview frames for security. To sync solution files directly to your local disk, open this app in a standalone tab, or download the compressed ZIP bundle.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.open(cleanUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open App in New Tab to Sync Disk</span>
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleDownloadSolutionZip}>
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Download Solution ZIP</span>
                    </Button>
                  </div>
                </div>
              )}

              {directDiskStatus === 'error' && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-[11px]">
                  An error occurred while writing files to disk. Ensure browser permissions are granted or use the ZIP download fallback.
                </div>
              )}
            </Card>

            {/* IDE Export Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VS Code Card */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400 text-sm flex items-center gap-2">
                    <Code2 className="w-4 h-4" aria-hidden="true" /> Visual Studio Code (Desktop & Web)
                  </span>
                  <Badge tone="brand" className="normal-case">.code-workspace</Badge>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Generates pre-configured <code className="text-blue-300">{`.vscode/launch.json`}</code>, <code className="text-blue-300">{`.vscode/tasks.json`}</code>, and workspace settings for <span className="text-white font-semibold">{activeTechStack.name}</span>.
                </p>

                <div className="space-y-2 pt-2 border-t border-[#232838]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>1) Caminho Completo da Pasta no seu PC:</span>
                      <span className="text-blue-400 text-[9px]">Onde salvou/descompactou</span>
                    </div>
                    <Input
                      type="text"
                      value={localPathInput}
                      onChange={(e) => setLocalPathInput(e.target.value)}
                      placeholder={`C:\\Projects\\${selectedFolderName || projectName}`}
                      className="font-mono"
                    />

                    {/* Quick Path Presets */}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-0.5 overflow-x-auto">
                      <span className="shrink-0 text-[9px] text-gray-500 font-medium">Atalhos de local:</span>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`C:\\Projects\\${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        C:\Projects\...
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`C:\\Users\\Downloads\\${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        C:\Users\...\Downloads\...
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocalPathInput(`~/Projects/${selectedFolderName || projectName}`)}
                        className="px-1.5 py-0.5 bg-[#1c2029] hover:bg-[#242a36] text-blue-300 rounded font-mono text-[9.5px] cursor-pointer shrink-0 border border-[#2e3340]"
                      >
                        ~/Projects/...
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      onClick={() => handleExportDirectToDisk(true)}
                      title="Select local folder on your PC, save solution files, and open in VS Code"
                      className="w-full justify-center"
                    >
                      <FolderCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Select Folder, Save Files &amp; Open in VS Code</span>
                    </Button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLaunchVSCodeDirectly}
                        title={`Direct launch: vscode://file/${localPathInput}`}
                        className="justify-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Launch vscode:// Directly</span>
                      </Button>

                      <a
                        href="https://vscode.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-xs transition-colors cursor-pointer"
                        title="Open VS Code Web directly in browser"
                      >
                        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>VS Code Web</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-[#13151b] border border-[#2b303d] rounded-lg p-2 text-[10px] text-gray-300 space-y-1">
                    <div className="font-semibold text-gray-200">Como funciona o salvamento e abertura:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                      <li><strong>Salvar primeiro:</strong> Baixe o ZIP ou use a <span className="text-gray-300">Fase 2 (Gravação Direta em Disco)</span> acima para criar os ficheiros na pasta local.</li>
                      <li><strong>Abrir no VS Code:</strong> O VS Code Desktop precisa de saber o caminho exato da pasta no seu disco rígido (<code className="text-gray-200">C:\Projetos\...</code>). Se abrir sem salvar primeiro, o VS Code exibirá &quot;Path does not exist&quot;.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px] mt-1">
                    <span className="text-gray-300">code .</span>
                    <button onClick={() => handleCopyCmd('code .')} className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer">
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === 'code .' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </Card>

              {/* Visual Studio / Rider Card */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-100 text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" aria-hidden="true" /> Visual Studio & Rider
                  </span>
                  <Badge tone="neutral" className="normal-case">.sln / .csproj</Badge>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Includes complete Microsoft Visual Studio Solution file <code className="text-gray-200">{`${projectName}.sln`}</code> with auto-wired inter-module dependencies and package references.
                </p>

                <div className="space-y-2 pt-2 border-t border-[#232838]">
                  <div className="text-[10px] text-gray-400 font-mono">Visual Studio / Rider Commands:</div>
                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="text-gray-200 truncate">devenv {projectName}.sln</span>
                    <button
                      onClick={() => handleCopyCmd(`devenv ${projectName}.sln`)}
                      className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                    >
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === `devenv ${projectName}.sln` ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="text-gray-200 truncate">rider {projectName}.sln</span>
                    <button
                      onClick={() => handleCopyCmd(`rider ${projectName}.sln`)}
                      className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 cursor-pointer ml-2"
                    >
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>{copiedCmdText === `rider ${projectName}.sln` ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Shell Setup Script Section */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-100 text-xs flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4 text-blue-400" aria-hidden="true" /> Automated Local Environment Launcher (setup-ide.sh)
                </span>
                <span className="text-gray-400 font-mono text-[10px]">Bash / PowerShell</span>
              </div>
              <p className="text-gray-300 text-[11px]">
                Run the included shell script inside your unzipped folder to automatically initialize Git, restore dependencies, and launch your preferred editor:
              </p>
              <div className="flex items-center justify-between bg-[#13151b] border border-[#2b303d] rounded-lg p-3 font-mono text-[11px] text-gray-200">
                <span>chmod +x setup-ide.sh && ./setup-ide.sh</span>
                <Button
                  size="sm"
                  onClick={() => handleCopyCmd('chmod +x setup-ide.sh && ./setup-ide.sh')}
                >
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>{copiedCmdText === 'chmod +x setup-ide.sh && ./setup-ide.sh' ? 'Copied!' : 'Copy Script Command'}</span>
                </Button>
              </div>
            </Card>

            {/* Fase 3: Git & Remote Repository Push/Sync Integration */}
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-100 text-xs flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span>Fase 3: Git & Remote Repository Push/Sync Integration</span>
                </span>
                <Badge tone="neutral" className="normal-case">GitHub / GitLab / Azure DevOps</Badge>
              </div>
              <p className="text-gray-300 text-[11px]">
                To publish this scaffolded <span className="text-white font-mono">{projectName}</span> architecture directly to GitHub or your organization&apos;s remote Git host:
              </p>

              <div className="space-y-1.5 bg-[#13151b] border border-[#2b303d] rounded-lg p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-gray-300">
                  <span>git init &amp;&amp; git add . &amp;&amp; git commit -m &quot;feat: scaffold architecture using Factory Platform&quot;</span>
                  <button
                    onClick={() => handleCopyCmd('git init && git add . && git commit -m "feat: scaffold architecture using Factory Platform"')}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-gray-300 border-t border-[#232838] pt-1.5">
                  <span>git remote add origin https://github.com/your-org/{projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git</span>
                  <button
                    onClick={() => handleCopyCmd(`git remote add origin https://github.com/your-org/${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git`)}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-emerald-300 border-t border-[#232838] pt-1.5">
                  <span>git branch -M main && git push -u origin main</span>
                  <button
                    onClick={() => handleCopyCmd('git branch -M main && git push -u origin main')}
                    className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Footer with ZIP Download Fallback */}
            <div className="flex items-center justify-between pt-4 border-t border-[#262a36]">
              <div className="text-gray-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" /> All solution files, configs & scripts are included in the downloadable ZIP bundle.
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={handleDownloadSolutionZip} disabled={isDownloadingZip}>
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isDownloadingZip ? 'Downloading...' : 'Download Solution ZIP'}</span>
                </Button>
                <Button variant="secondary" onClick={() => setShowIdeExportModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
  );
}
