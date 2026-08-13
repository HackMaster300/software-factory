import { Template } from '../../types/factory';
import { StorageService } from '../storageService';

/**
 * Repository interface for the Template aggregate.
 */
export interface ITemplateRepository {
  getTemplates(): Template[];
  saveTemplates(templates: Template[]): void;
}

export class LocalStorageTemplateRepository implements ITemplateRepository {
  getTemplates(): Template[] {
    return StorageService.getTemplates();
  }

  saveTemplates(templates: Template[]): void {
    StorageService.saveTemplates(templates);
  }
}

export const templateRepository: ITemplateRepository = new LocalStorageTemplateRepository();
