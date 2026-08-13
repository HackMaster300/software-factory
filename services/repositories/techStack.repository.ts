import { TechStack } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Tech Stack catalog. Read-only today because
 * `StorageService` does not yet expose a save method for tech stacks (there
 * is no "create custom tech stack" UI feature until a later phase).
 */
export interface ITechStackRepository {
  getTechStacks(): TechStack[];
}

export class LocalStorageTechStackRepository implements ITechStackRepository {
  getTechStacks(): TechStack[] {
    return StorageService.getTechStacks();
  }
}

export const techStackRepository: ITechStackRepository = new LocalStorageTechStackRepository();
