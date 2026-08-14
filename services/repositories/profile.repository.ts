import {
  ProfileSecurity,
  ProfileDatabase,
  ProfileDocker,
  ProfileCache,
  ProfileLogging,
  ProfileEncryption,
  ProfileDeployment,
  ProfileAuthentication,
} from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface covering all Technology & Infrastructure profile catalogs,
 * kept as one grouped repository (rather than one file per type) because they are
 * all surfaced together as tabs on a single `TechStacksView` "Technology & Profiles"
 * surface — see PLAN.md Phase 2b. Security/Database/Docker save methods were added
 * for interface symmetry; Cache/Logging save methods are the ones Phase 2b actually
 * wires up UI for. Encryption/Deployment/Authentication are brand-new Phase 2b
 * types with full get/save support and UI from day one.
 */
export interface IProfileRepository {
  getSecurityProfiles(): ProfileSecurity[];
  saveSecurityProfiles(profiles: ProfileSecurity[]): void;
  getDatabaseProfiles(): ProfileDatabase[];
  saveDatabaseProfiles(profiles: ProfileDatabase[]): void;
  getDockerProfiles(): ProfileDocker[];
  saveDockerProfiles(profiles: ProfileDocker[]): void;
  getCacheProfiles(): ProfileCache[];
  saveCacheProfiles(profiles: ProfileCache[]): void;
  getLoggingProfiles(): ProfileLogging[];
  saveLoggingProfiles(profiles: ProfileLogging[]): void;
  getEncryptionProfiles(): ProfileEncryption[];
  saveEncryptionProfiles(profiles: ProfileEncryption[]): void;
  getDeploymentProfiles(): ProfileDeployment[];
  saveDeploymentProfiles(profiles: ProfileDeployment[]): void;
  getAuthenticationProfiles(): ProfileAuthentication[];
  saveAuthenticationProfiles(profiles: ProfileAuthentication[]): void;
}

export class LocalStorageProfileRepository implements IProfileRepository {
  getSecurityProfiles(): ProfileSecurity[] {
    return StorageService.getSecurityProfiles();
  }

  saveSecurityProfiles(profiles: ProfileSecurity[]): void {
    StorageService.saveSecurityProfiles(profiles);
  }

  getDatabaseProfiles(): ProfileDatabase[] {
    return StorageService.getDatabaseProfiles();
  }

  saveDatabaseProfiles(profiles: ProfileDatabase[]): void {
    StorageService.saveDatabaseProfiles(profiles);
  }

  getDockerProfiles(): ProfileDocker[] {
    return StorageService.getDockerProfiles();
  }

  saveDockerProfiles(profiles: ProfileDocker[]): void {
    StorageService.saveDockerProfiles(profiles);
  }

  getCacheProfiles(): ProfileCache[] {
    return StorageService.getCacheProfiles();
  }

  saveCacheProfiles(profiles: ProfileCache[]): void {
    StorageService.saveCacheProfiles(profiles);
  }

  getLoggingProfiles(): ProfileLogging[] {
    return StorageService.getLoggingProfiles();
  }

  saveLoggingProfiles(profiles: ProfileLogging[]): void {
    StorageService.saveLoggingProfiles(profiles);
  }

  getEncryptionProfiles(): ProfileEncryption[] {
    return StorageService.getEncryptionProfiles();
  }

  saveEncryptionProfiles(profiles: ProfileEncryption[]): void {
    StorageService.saveEncryptionProfiles(profiles);
  }

  getDeploymentProfiles(): ProfileDeployment[] {
    return StorageService.getDeploymentProfiles();
  }

  saveDeploymentProfiles(profiles: ProfileDeployment[]): void {
    StorageService.saveDeploymentProfiles(profiles);
  }

  getAuthenticationProfiles(): ProfileAuthentication[] {
    return StorageService.getAuthenticationProfiles();
  }

  saveAuthenticationProfiles(profiles: ProfileAuthentication[]): void {
    StorageService.saveAuthenticationProfiles(profiles);
  }
}

export const profileRepository: IProfileRepository = new LocalStorageProfileRepository();
