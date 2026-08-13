import { AIAgent } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the AIAgent aggregate (Phase 2a): user-defined
 * custom personas that appear alongside the hardcoded roles in
 * `AIAssistantDrawer`'s role picker.
 */
export interface IAIAgentRepository {
  getAIAgents(): AIAgent[];
  saveAIAgents(agents: AIAgent[]): void;
}

export class LocalStorageAIAgentRepository implements IAIAgentRepository {
  getAIAgents(): AIAgent[] {
    return StorageService.getAIAgents();
  }

  saveAIAgents(agents: AIAgent[]): void {
    StorageService.saveAIAgents(agents);
  }
}

export const aiAgentRepository: IAIAgentRepository = new LocalStorageAIAgentRepository();
