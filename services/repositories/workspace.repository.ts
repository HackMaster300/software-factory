import { Workspace } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Workspace aggregate. Read-only today because
 * `StorageService` does not yet expose a save method (no create/edit
 * Workspace UI exists yet — that lands in a later phase).
 */
export interface IWorkspaceRepository {
  getWorkspaces(): Workspace[];
}

export class LocalStorageWorkspaceRepository implements IWorkspaceRepository {
  getWorkspaces(): Workspace[] {
    return StorageService.getWorkspaces();
  }
}

export const workspaceRepository: IWorkspaceRepository = new LocalStorageWorkspaceRepository();
