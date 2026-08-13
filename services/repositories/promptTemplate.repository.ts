import { PromptTemplate } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Prompt Template aggregate.
 */
export interface IPromptTemplateRepository {
  getPromptTemplates(): PromptTemplate[];
  savePromptTemplates(prompts: PromptTemplate[]): void;
}

export class LocalStoragePromptTemplateRepository implements IPromptTemplateRepository {
  getPromptTemplates(): PromptTemplate[] {
    return StorageService.getPromptTemplates();
  }

  savePromptTemplates(prompts: PromptTemplate[]): void {
    StorageService.savePromptTemplates(prompts);
  }
}

export const promptTemplateRepository: IPromptTemplateRepository = new LocalStoragePromptTemplateRepository();
