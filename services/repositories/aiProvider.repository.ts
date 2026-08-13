import { AIProviderConfig } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the AI Provider configuration aggregate.
 */
export interface IAIProviderRepository {
  getAIProviders(): AIProviderConfig[];
  saveAIProviders(providers: AIProviderConfig[]): void;
}

export class LocalStorageAIProviderRepository implements IAIProviderRepository {
  getAIProviders(): AIProviderConfig[] {
    return StorageService.getAIProviders();
  }

  saveAIProviders(providers: AIProviderConfig[]): void {
    StorageService.saveAIProviders(providers);
  }
}

export const aiProviderRepository: IAIProviderRepository = new LocalStorageAIProviderRepository();
