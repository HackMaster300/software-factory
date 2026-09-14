import { Template, Blueprint } from '../types/factory';
import { templateRepository } from './repositories/template.repository';

export type VersionBump = 'major' | 'minor' | 'patch';

export interface BlueprintChange {
  kind: 'project-added' | 'project-removed' | 'references-changed' | 'feature-added' | 'feature-removed' | 'stack-changed' | 'style-changed' | 'ruleset-changed' | 'profile-changed';
  detail: string;
}

export interface MigrationPreview {
  blueprint: Blueprint;
  changes: BlueprintChange[];
  preservedCustomConfigKeys: string[];
}

export class TemplateService {
  static getTemplates(): Template[] {
    return templateRepository.getTemplates();
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
    templateRepository.saveTemplates(templates);
  }

  static updateTemplateBlueprint(templateId: string, blueprint: Blueprint): void {
    const templates = this.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      template.blueprint = blueprint;
      template.updatedAt = new Date().toISOString().slice(0, 10);
      templateRepository.saveTemplates(templates);
    }
  }

  /**
   * Phase 12 — versionamento: clona o template com bump semver e snapshot do blueprint.
   * O original é preservado (histórico); o clone ganha id `${baseId}-v${version}`.
   * Versão inválida → 400 honesto via throw (callers exibem a mensagem).
   */
  static bumpVersion(version: string, bump: VersionBump): string {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
    if (!match) throw new Error(`Invalid semver version "${version}" — expected X.Y.Z.`);
    let [, major, minor, patch] = match.map(Number);
    if (bump === 'major') { major += 1; minor = 0; patch = 0; }
    else if (bump === 'minor') { minor += 1; patch = 0; }
    else { patch += 1; }
    return `${major}.${minor}.${patch}`;
  }

  static createNewVersion(templateId: string, bump: VersionBump, changelog = ''): Template {
    const source = this.getTemplateById(templateId);
    if (!source) throw new Error(`Template "${templateId}" not found.`);
    const version = this.bumpVersion(source.version, bump);
    const clone: Template = {
      ...source,
      id: `${source.id}-v${version}`,
      version,
      blueprint: JSON.parse(JSON.stringify(source.blueprint)) as Blueprint,
      description: changelog ? `${source.description}\n\n[${version}] ${changelog}` : source.description,
      updatedAt: new Date().toISOString().slice(0, 10),
      isOfficial: false,
      downloadCount: 0,
    };
    this.saveTemplate(clone);
    return clone;
  }

  /** Todas as versões de uma linha (mesmo id base), ordenadas por semver ascendente. */
  static getVersionHistory(templateId: string): Template[] {
    const base = templateId.replace(/-v\d+\.\d+\.\d+$/, '');
    const matches = this.getTemplates().filter(
      (t) => t.id === base || t.id.startsWith(`${base}-v`)
    );
    const weight = (v: string): number[] =>
      v.split('.').map((n) => (Number.isNaN(Number(n)) ? 0 : Number(n)));
    return matches.sort((a, b) => {
      const [aM, am, ap] = weight(a.version);
      const [bM, bm, bp] = weight(b.version);
      return aM - bM || am - bm || ap - bp;
    });
  }

  /**
   * Diff real entre dois blueprints (projetos por nome, refs, features, stack, estilo,
   * ruleset, profiles). Sem diff → [] honesto.
   */
  static diffBlueprints(from: Blueprint, to: Blueprint): BlueprintChange[] {
    const changes: BlueprintChange[] = [];
    const fromNames = new Set(from.projects.map((p) => p.name));
    const toNames = new Set(to.projects.map((p) => p.name));
    for (const p of to.projects) {
      if (!fromNames.has(p.name)) changes.push({ kind: 'project-added', detail: `Project added: ${p.name} (${p.type})` });
    }
    for (const p of from.projects) {
      if (!toNames.has(p.name)) changes.push({ kind: 'project-removed', detail: `Project removed: ${p.name} (${p.type})` });
    }
    const fromByName = new Map(from.projects.map((p) => [p.name, p]));
    for (const p of to.projects) {
      const prev = fromByName.get(p.name);
      if (prev && JSON.stringify([...prev.references].sort()) !== JSON.stringify([...p.references].sort())) {
        changes.push({ kind: 'references-changed', detail: `References changed: ${p.name} [${prev.references.join(', ') || 'none'}] → [${p.references.join(', ') || 'none'}]` });
      }
    }
    for (const f of to.featureIds) {
      if (!from.featureIds.includes(f)) changes.push({ kind: 'feature-added', detail: `Feature enabled: ${f}` });
    }
    for (const f of from.featureIds) {
      if (!to.featureIds.includes(f)) changes.push({ kind: 'feature-removed', detail: `Feature disabled: ${f}` });
    }
    if (from.techStackId !== to.techStackId) {
      changes.push({ kind: 'stack-changed', detail: `Tech stack changed: ${from.techStackId} → ${to.techStackId}` });
    }
    if (from.architectureStyle !== to.architectureStyle) {
      changes.push({ kind: 'style-changed', detail: `Architecture style changed: ${from.architectureStyle} → ${to.architectureStyle}` });
    }
    if (from.ruleSetId !== to.ruleSetId) {
      changes.push({ kind: 'ruleset-changed', detail: `Rule set changed: ${from.ruleSetId} → ${to.ruleSetId}` });
    }
    const profileKeys = Object.keys(from.profiles) as Array<keyof Blueprint['profiles']>;
    for (const key of profileKeys) {
      if (from.profiles[key] !== to.profiles[key]) {
        changes.push({ kind: 'profile-changed', detail: `Profile ${key} changed: ${from.profiles[key]} → ${to.profiles[key]}` });
      }
    }
    return changes;
  }

  /**
   * Preview de migração NÃO-destrutivo: blueprint do template alvo + customConfig do
   * projeto preservado + lista do que mudou. Quem aplica é o caller (nada é salvo aqui).
   */
  static previewMigration(
    projectBlueprint: Blueprint,
    projectCustomConfig: Record<string, unknown>,
    targetTemplateId: string
  ): MigrationPreview {
    const target = this.getTemplateById(targetTemplateId);
    if (!target) throw new Error(`Template "${targetTemplateId}" not found.`);
    const blueprint = JSON.parse(JSON.stringify(target.blueprint)) as Blueprint;
    return {
      blueprint,
      changes: this.diffBlueprints(projectBlueprint, blueprint),
      preservedCustomConfigKeys: Object.keys(projectCustomConfig || {}),
    };
  }
}
