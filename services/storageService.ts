import { useSyncExternalStore } from 'react';
import {
  Organization,
  Workspace,
  TechStack,
  ProfileSecurity,
  ProfileDatabase,
  ProfileDocker,
  ProfileCache,
  ProfileLogging,
  RuleSet,
  FeatureManifest,
  Template,
  Project,
  DecisionLogItem,
  AIProviderConfig,
  PromptTemplate,
} from '../types/factory';

import {
  initialOrganizations,
  initialWorkspaces,
  initialTechStacks,
  initialSecurityProfiles,
  initialDatabaseProfiles,
  initialDockerProfiles,
  initialCacheProfiles,
  initialLoggingProfiles,
  initialRuleSets,
  initialFeatureManifests,
  initialTemplates,
  initialProjects,
  initialDecisionLogs,
  initialAIProviders,
  initialPromptTemplates,
} from './mockSeedData';

const STORAGE_KEYS = {
  ORGANIZATIONS: 'sf_organizations_v2',
  WORKSPACES: 'sf_workspaces_v2',
  TECH_STACKS: 'sf_tech_stacks_v2',
  PROFILES_SECURITY: 'sf_profiles_sec_v2',
  PROFILES_DATABASE: 'sf_profiles_db_v2',
  PROFILES_DOCKER: 'sf_profiles_docker_v2',
  PROFILES_CACHE: 'sf_profiles_cache_v2',
  PROFILES_LOGGING: 'sf_profiles_logging_v2',
  RULE_SETS: 'sf_rule_sets_v2',
  FEATURE_MANIFESTS: 'sf_feature_manifests_v2',
  TEMPLATES: 'sf_templates_v2',
  PROJECTS: 'sf_projects_v2',
  DECISION_LOGS: 'sf_decision_logs_v2',
  AI_PROVIDERS: 'sf_ai_providers_v2',
  PROMPT_TEMPLATES: 'sf_prompt_templates_v2',
};

type StorageListener = () => void;
const listeners = new Set<StorageListener>();

export const notifyStorageChange = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToStorage = (listener: StorageListener) => {
  listeners.add(listener);
  if (typeof window !== 'undefined') {
    const handleStorage = () => listener();
    window.addEventListener('storage', handleStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', handleStorage);
    };
  }
  return () => {
    listeners.delete(listener);
  };
};

export function useStorage<T>(getSnapshot: () => T, serverDefault: T): T {
  return useSyncExternalStore(
    subscribeToStorage,
    getSnapshot,
    () => serverDefault
  );
}

export function useOrganizations() {
  return useStorage(() => StorageService.getOrganizations(), initialOrganizations);
}

export function useWorkspaces() {
  return useStorage(() => StorageService.getWorkspaces(), initialWorkspaces);
}

export function useTechStacks() {
  return useStorage(() => StorageService.getTechStacks(), initialTechStacks);
}

export function useRuleSets() {
  return useStorage(() => StorageService.getRuleSets(), initialRuleSets);
}

export function useFeatureManifests() {
  return useStorage(() => StorageService.getFeatureManifests(), initialFeatureManifests);
}

export function useTemplates() {
  return useStorage(() => StorageService.getTemplates(), initialTemplates);
}

export function useProjects() {
  return useStorage(() => StorageService.getProjects(), initialProjects);
}

export function useDecisionLogs() {
  return useStorage(() => StorageService.getDecisionLogs(), initialDecisionLogs);
}

export function useAIProviders() {
  return useStorage(() => StorageService.getAIProviders(), initialAIProviders);
}

export function usePromptTemplates() {
  return useStorage(() => StorageService.getPromptTemplates(), initialPromptTemplates);
}

const memoryCache: Record<string, { raw: string | null; parsed: any }> = {};

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const serialized = JSON.stringify(defaultValue);
      localStorage.setItem(key, serialized);
      memoryCache[key] = { raw: serialized, parsed: defaultValue };
      return defaultValue;
    }
    if (memoryCache[key] && memoryCache[key].raw === raw) {
      return memoryCache[key].parsed as T;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(defaultValue) && Array.isArray(parsed) && parsed.length < defaultValue.length) {
      const serialized = JSON.stringify(defaultValue);
      localStorage.setItem(key, serialized);
      memoryCache[key] = { raw: serialized, parsed: defaultValue };
      return defaultValue;
    }
    memoryCache[key] = { raw, parsed };
    return parsed as T;
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(key, raw);
    memoryCache[key] = { raw, parsed: value };
    notifyStorageChange();
  } catch (err) {
    console.error(`Error writing ${key} to LocalStorage`, err);
  }
}

export class StorageService {
  static initializeSeedData(forceReset = false) {
    if (typeof window === 'undefined') return;
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ORGANIZATIONS)) {
      setItem(STORAGE_KEYS.ORGANIZATIONS, initialOrganizations);
      setItem(STORAGE_KEYS.WORKSPACES, initialWorkspaces);
      setItem(STORAGE_KEYS.TECH_STACKS, initialTechStacks);
      setItem(STORAGE_KEYS.PROFILES_SECURITY, initialSecurityProfiles);
      setItem(STORAGE_KEYS.PROFILES_DATABASE, initialDatabaseProfiles);
      setItem(STORAGE_KEYS.PROFILES_DOCKER, initialDockerProfiles);
      setItem(STORAGE_KEYS.PROFILES_CACHE, initialCacheProfiles);
      setItem(STORAGE_KEYS.PROFILES_LOGGING, initialLoggingProfiles);
      setItem(STORAGE_KEYS.RULE_SETS, initialRuleSets);
      setItem(STORAGE_KEYS.FEATURE_MANIFESTS, initialFeatureManifests);
      setItem(STORAGE_KEYS.TEMPLATES, initialTemplates);
      setItem(STORAGE_KEYS.PROJECTS, initialProjects);
      setItem(STORAGE_KEYS.DECISION_LOGS, initialDecisionLogs);
      setItem(STORAGE_KEYS.AI_PROVIDERS, initialAIProviders);
      setItem(STORAGE_KEYS.PROMPT_TEMPLATES, initialPromptTemplates);
    }
  }

  static getOrganizations(): Organization[] {
    return getItem(STORAGE_KEYS.ORGANIZATIONS, initialOrganizations);
  }

  static getWorkspaces(): Workspace[] {
    return getItem(STORAGE_KEYS.WORKSPACES, initialWorkspaces);
  }

  static getTechStacks(): TechStack[] {
    return getItem(STORAGE_KEYS.TECH_STACKS, initialTechStacks);
  }

  static getSecurityProfiles(): ProfileSecurity[] {
    return getItem(STORAGE_KEYS.PROFILES_SECURITY, initialSecurityProfiles);
  }

  static getDatabaseProfiles(): ProfileDatabase[] {
    return getItem(STORAGE_KEYS.PROFILES_DATABASE, initialDatabaseProfiles);
  }

  static getDockerProfiles(): ProfileDocker[] {
    return getItem(STORAGE_KEYS.PROFILES_DOCKER, initialDockerProfiles);
  }

  static getCacheProfiles(): ProfileCache[] {
    return getItem(STORAGE_KEYS.PROFILES_CACHE, initialCacheProfiles);
  }

  static getLoggingProfiles(): ProfileLogging[] {
    return getItem(STORAGE_KEYS.PROFILES_LOGGING, initialLoggingProfiles);
  }

  static getRuleSets(): RuleSet[] {
    return getItem(STORAGE_KEYS.RULE_SETS, initialRuleSets);
  }

  static saveRuleSets(ruleSets: RuleSet[]): void {
    setItem(STORAGE_KEYS.RULE_SETS, ruleSets);
  }

  static getFeatureManifests(): FeatureManifest[] {
    return getItem(STORAGE_KEYS.FEATURE_MANIFESTS, initialFeatureManifests);
  }

  static saveFeatureManifests(features: FeatureManifest[]): void {
    setItem(STORAGE_KEYS.FEATURE_MANIFESTS, features);
  }

  static getTemplates(): Template[] {
    return getItem(STORAGE_KEYS.TEMPLATES, initialTemplates);
  }

  static saveTemplates(templates: Template[]): void {
    setItem(STORAGE_KEYS.TEMPLATES, templates);
  }

  static getProjects(): Project[] {
    return getItem(STORAGE_KEYS.PROJECTS, initialProjects);
  }

  static saveProjects(projects: Project[]): void {
    setItem(STORAGE_KEYS.PROJECTS, projects);
  }

  static getDecisionLogs(): DecisionLogItem[] {
    return getItem(STORAGE_KEYS.DECISION_LOGS, initialDecisionLogs);
  }

  static saveDecisionLogs(logs: DecisionLogItem[]): void {
    setItem(STORAGE_KEYS.DECISION_LOGS, logs);
  }

  static getAIProviders(): AIProviderConfig[] {
    return getItem(STORAGE_KEYS.AI_PROVIDERS, initialAIProviders);
  }

  static saveAIProviders(providers: AIProviderConfig[]): void {
    setItem(STORAGE_KEYS.AI_PROVIDERS, providers);
  }

  static getPromptTemplates(): PromptTemplate[] {
    return getItem(STORAGE_KEYS.PROMPT_TEMPLATES, initialPromptTemplates);
  }

  static savePromptTemplates(prompts: PromptTemplate[]): void {
    setItem(STORAGE_KEYS.PROMPT_TEMPLATES, prompts);
  }

  static exportFullWorkspaceState(): string {
    const data = {
      organizations: this.getOrganizations(),
      workspaces: this.getWorkspaces(),
      techStacks: this.getTechStacks(),
      ruleSets: this.getRuleSets(),
      featureManifests: this.getFeatureManifests(),
      templates: this.getTemplates(),
      projects: this.getProjects(),
      decisionLogs: this.getDecisionLogs(),
      aiProviders: this.getAIProviders(),
      promptTemplates: this.getPromptTemplates(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importWorkspaceState(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.featureManifests) setItem(STORAGE_KEYS.FEATURE_MANIFESTS, data.featureManifests);
      if (data.templates) setItem(STORAGE_KEYS.TEMPLATES, data.templates);
      if (data.projects) setItem(STORAGE_KEYS.PROJECTS, data.projects);
      if (data.ruleSets) setItem(STORAGE_KEYS.RULE_SETS, data.ruleSets);
      if (data.decisionLogs) setItem(STORAGE_KEYS.DECISION_LOGS, data.decisionLogs);
      notifyStorageChange();
      return true;
    } catch (e) {
      console.error('Failed to import workspace state', e);
      return false;
    }
  }
}
