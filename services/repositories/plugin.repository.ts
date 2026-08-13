import { Plugin } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Plugin aggregate (Phase 2a): a minimal
 * simulated entity, consistent with how the rest of the app "simulates"
 * rather than actually executes things (e.g. Feature Manifests).
 */
export interface IPluginRepository {
  getPlugins(): Plugin[];
  savePlugins(plugins: Plugin[]): void;
}

export class LocalStoragePluginRepository implements IPluginRepository {
  getPlugins(): Plugin[] {
    return StorageService.getPlugins();
  }

  savePlugins(plugins: Plugin[]): void {
    StorageService.savePlugins(plugins);
  }
}

export const pluginRepository: IPluginRepository = new LocalStoragePluginRepository();
