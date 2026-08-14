import { TechStack } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Tech Stack catalog. Phase 2b adds `saveTechStacks`
 * so users can define custom stacks alongside the seeded catalog (see
 * `plugin.repository.ts` / `aiAgent.repository.ts` for the precedent of adding a
 * save method once "create" UI lands).
 */
export interface ITechStackRepository {
  getTechStacks(): TechStack[];
  saveTechStacks(stacks: TechStack[]): void;
}

export class LocalStorageTechStackRepository implements ITechStackRepository {
  getTechStacks(): TechStack[] {
    return StorageService.getTechStacks();
  }

  saveTechStacks(stacks: TechStack[]): void {
    StorageService.saveTechStacks(stacks);
  }
}

export const techStackRepository: ITechStackRepository = new LocalStorageTechStackRepository();
