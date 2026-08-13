import { Project } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Project aggregate. Services depend on this
 * interface rather than on `StorageService`/localStorage directly, so the
 * persistence backend (localStorage today, a REST API later) can be swapped
 * without touching business logic in `ProjectService`.
 */
export interface IProjectRepository {
  getProjects(): Project[];
  saveProjects(projects: Project[]): void;
}

export class LocalStorageProjectRepository implements IProjectRepository {
  getProjects(): Project[] {
    return StorageService.getProjects();
  }

  saveProjects(projects: Project[]): void {
    StorageService.saveProjects(projects);
  }
}

export const projectRepository: IProjectRepository = new LocalStorageProjectRepository();
