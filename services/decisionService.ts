import { DecisionLogItem } from '../types/factory';
import { decisionLogRepository } from './repositories/decisionLog.repository';

export class DecisionService {
  static getDecisionLogs(projectId?: string): DecisionLogItem[] {
    const logs = decisionLogRepository.getDecisionLogs();
    if (projectId) {
      return logs.filter((l) => l.projectId === projectId);
    }
    return logs;
  }

  static addDecisionLog(log: Omit<DecisionLogItem, 'id' | 'date'>): DecisionLogItem {
    const logs = decisionLogRepository.getDecisionLogs();
    const newLog: DecisionLogItem = {
      ...log,
      id: `dec-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    logs.unshift(newLog);
    decisionLogRepository.saveDecisionLogs(logs);
    return newLog;
  }
}
