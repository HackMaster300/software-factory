'use client';

import { File, Folder } from 'lucide-react';
import type { SolutionTreeNode } from '../../../services/projectService';

/** Recursive solution explorer tree (wizard step 5). */
export function SolutionTree({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: SolutionTreeNode[];
  selectedId: string | undefined;
  onSelect: (node: SolutionTreeNode) => void;
}) {
  return (
      <div className="space-y-1 font-mono text-[11px]">
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          return (
            <div key={node.id} className="pl-3">
              <div
                onClick={() => onSelect(node)}
                className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-[#232836] hover:text-white'
                }`}
              >
                {node.type === 'folder' || node.type === 'project' ? (
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <span className="truncate">{node.name}</span>
              </div>

              {node.children && node.children.length > 0 && (
                <div className="border-l border-[#2e3446] ml-2 font-mono">
                  <SolutionTree nodes={node.children} selectedId={selectedId} onSelect={onSelect} />
                </div>
              )}
            </div>
          );
        })}
      </div>
  );
}
