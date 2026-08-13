import { Workspace } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Workspace aggregate. Now read/write
 * (Phase 2a): Header exposes Create/Edit/Delete UI for Workspaces, scoped
 * to the currently-selected Organization.
 */
export interface IWorkspaceRepository {
  getWorkspaces(): Workspace[];
  saveWorkspaces(workspaces: Workspace[]): void;
}

export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
  getWorkspaces(): Workspace[] {
    return StorageService.getWorkspaces();
  }

  saveWorkspaces(workspaces: Workspace[]): void {
    StorageService.saveWorkspaces(workspaces);
  }
}

export const workspaceRepository: IWorkspaceRepository = new LocalStorageWorkspaceRepository();
