import { DecisionLogItem } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Decision Log aggregate.
 */
export interface IDecisionLogRepository {
  getDecisionLogs(): DecisionLogItem[];
  saveDecisionLogs(logs: DecisionLogItem[]): void;
}

export class LocalStorageDecisionLogRepository implements IDecisionLogRepository {
  getDecisionLogs(): DecisionLogItem[] {
    return StorageService.getDecisionLogs();
  }

  saveDecisionLogs(logs: DecisionLogItem[]): void {
    StorageService.saveDecisionLogs(logs);
  }
}

export const decisionLogRepository: IDecisionLogRepository = new LocalStorageDecisionLogRepository();
