import { RuleSet } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Rule Set aggregate.
 */
export interface IRuleSetRepository {
  getRuleSets(): RuleSet[];
  saveRuleSets(ruleSets: RuleSet[]): void;
}

export class LocalStorageRuleSetRepository implements IRuleSetRepository {
  getRuleSets(): RuleSet[] {
    return StorageService.getRuleSets();
  }

  saveRuleSets(ruleSets: RuleSet[]): void {
    StorageService.saveRuleSets(ruleSets);
  }
}

export const ruleSetRepository: IRuleSetRepository = new LocalStorageRuleSetRepository();
