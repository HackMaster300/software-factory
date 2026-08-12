import { DecisionLogItem } from '../types/factory';
import { StorageService } from './storageService';

export class DecisionService {
  static getDecisionLogs(projectId?: string): DecisionLogItem[] {
    const logs = StorageService.getDecisionLogs();
    if (projectId) {
      return logs.filter((l) => l.projectId === projectId);
    }
    return logs;
  }

  static addDecisionLog(log: Omit<DecisionLogItem, 'id' | 'date'>): DecisionLogItem {
    const logs = StorageService.getDecisionLogs();
    const newLog: DecisionLogItem = {
      ...log,
      id: `dec-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    logs.unshift(newLog);
    StorageService.saveDecisionLogs(logs);
    return newLog;
  }
}
