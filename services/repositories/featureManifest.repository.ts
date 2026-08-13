import { FeatureManifest } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Feature Manifest aggregate.
 */
export interface IFeatureManifestRepository {
  getFeatureManifests(): FeatureManifest[];
  saveFeatureManifests(features: FeatureManifest[]): void;
}

export class LocalStorageFeatureManifestRepository implements IFeatureManifestRepository {
  getFeatureManifests(): FeatureManifest[] {
    return StorageService.getFeatureManifests();
  }

  saveFeatureManifests(features: FeatureManifest[]): void {
    StorageService.saveFeatureManifests(features);
  }
}

export const featureManifestRepository: IFeatureManifestRepository = new LocalStorageFeatureManifestRepository();
