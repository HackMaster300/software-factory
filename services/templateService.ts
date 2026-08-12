import { Template, Blueprint } from '../types/factory';
import { StorageService } from './storageService';

export class TemplateService {
  static getTemplates(): Template[] {
    return StorageService.getTemplates();
  }

  static getTemplateById(id: string): Template | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }

  static saveTemplate(template: Template): void {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    StorageService.saveTemplates(templates);
  }

  static updateTemplateBlueprint(templateId: string, blueprint: Blueprint): void {
    const templates = this.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      template.blueprint = blueprint;
      template.updatedAt = new Date().toISOString().slice(0, 10);
      StorageService.saveTemplates(templates);
    }
  }
}
