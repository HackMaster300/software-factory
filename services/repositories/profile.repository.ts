import {
  ProfileSecurity,
  ProfileDatabase,
  ProfileDocker,
  ProfileCache,
  ProfileLogging,
} from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface covering the Security/Database/Docker/Cache/Logging
 * profile catalogs. Read-only today because `StorageService` does not yet
 * expose save methods for these (no "create/edit profile" UI exists yet —
 * that lands in a later phase). Encryption/Deployment/Authentication
 * profiles are intentionally NOT included here: they don't exist in
 * `types/factory.ts` yet, and Phase 0 must not invent new domain types.
 */
export interface IProfileRepository {
  getSecurityProfiles(): ProfileSecurity[];
  getDatabaseProfiles(): ProfileDatabase[];
  getDockerProfiles(): ProfileDocker[];
  getCacheProfiles(): ProfileCache[];
  getLoggingProfiles(): ProfileLogging[];
}

export class LocalStorageProfileRepository implements IProfileRepository {
  getSecurityProfiles(): ProfileSecurity[] {
    return StorageService.getSecurityProfiles();
  }

  getDatabaseProfiles(): ProfileDatabase[] {
    return StorageService.getDatabaseProfiles();
  }

  getDockerProfiles(): ProfileDocker[] {
    return StorageService.getDockerProfiles();
  }

  getCacheProfiles(): ProfileCache[] {
    return StorageService.getCacheProfiles();
  }

  getLoggingProfiles(): ProfileLogging[] {
    return StorageService.getLoggingProfiles();
  }
}

export const profileRepository: IProfileRepository = new LocalStorageProfileRepository();
