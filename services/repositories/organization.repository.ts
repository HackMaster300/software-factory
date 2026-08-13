import { Organization } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Organization aggregate. Now read/write
 * (Phase 2a): Header exposes Create/Edit/Delete UI for Organizations.
 */
export interface IOrganizationRepository {
  getOrganizations(): Organization[];
  saveOrganizations(organizations: Organization[]): void;
}

export class LocalStorageOrganizationRepository implements IOrganizationRepository {
  getOrganizations(): Organization[] {
    return StorageService.getOrganizations();
  }

  saveOrganizations(organizations: Organization[]): void {
    StorageService.saveOrganizations(organizations);
  }
}

export const organizationRepository: IOrganizationRepository = new LocalStorageOrganizationRepository();
