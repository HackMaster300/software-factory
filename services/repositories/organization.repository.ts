import { Organization } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Organization aggregate. Read-only today
 * because `StorageService` does not yet expose a save method (no
 * create/edit Organization UI exists yet — that lands in a later phase).
 */
export interface IOrganizationRepository {
  getOrganizations(): Organization[];
}

export class LocalStorageOrganizationRepository implements IOrganizationRepository {
  getOrganizations(): Organization[] {
    return StorageService.getOrganizations();
  }
}

export const organizationRepository: IOrganizationRepository = new LocalStorageOrganizationRepository();
