import type { Blueprint } from '../../types/factory';

export interface GeneratedSolutionPreview {
  solutionName: string;
  estimatedFileCount: number;
  estimatedFolderCount: number;
  projectReferencesCount: number;
  packageDependenciesCount: number;
  solutionTree: SolutionTreeNode[];
  allPackages: Array<{ name: string; version: string; packageManager: string; project: string }>;
}

export interface SolutionTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'project' | 'file';
  path: string;
  language?: string;
  contentSnippet?: string;
  children?: SolutionTreeNode[];
}

/** Per-project inputs shared by the scaffold section builders (verbatim extractions from generateSolutionPreview). */
export interface ProjectScaffoldContext {
  blueprint: Blueprint;
  proj: Blueprint['projects'][number];
  lang: string;
  projectName: string;
  javaPackageBase: string;
  activeFeatureIds: string[];
  fileExt: string;
  codeLang: string;
  projBasePath: string;
  projFolderNode: SolutionTreeNode;
  manifestPackages: Map<string, Array<{ name: string; version: string; packageManager?: string }>>;
}
