import { useSyncExternalStore } from 'react';
import {
  API_DATA_SOURCE_ENABLED,
  getOrganizationsBridged,
  getWorkspacesBridged,
  saveOrganizationsBridged,
  saveWorkspacesBridged,
} from './apiDataBridge';
import {
  Organization,
  Workspace,
  TechStack,
  ProfileSecurity,
  ProfileDatabase,
  ProfileDocker,
  ProfileCache,
  ProfileLogging,
  ProfileEncryption,
  ProfileDeployment,
  ProfileAuthentication,
  RuleSet,
  FeatureManifest,
  Template,
  Project,
  DecisionLogItem,
  AIProviderConfig,
  PromptTemplate,
  AIAgent,
  Plugin,
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
  initialEncryptionProfiles,
  initialDeploymentProfiles,
  initialAuthenticationProfiles,
  initialRuleSets,
  initialFeatureManifests,
  initialTemplates,
  initialProjects,
  initialDecisionLogs,
  initialAIProviders,
  initialPromptTemplates,
  initialAIAgents,
  initialPlugins,
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
  PROFILES_ENCRYPTION: 'sf_profiles_encryption_v2',
  PROFILES_DEPLOYMENT: 'sf_profiles_deployment_v2',
  PROFILES_AUTHENTICATION: 'sf_profiles_authentication_v2',
  RULE_SETS: 'sf_rule_sets_v2',
  FEATURE_MANIFESTS: 'sf_feature_manifests_v2',
  TEMPLATES: 'sf_templates_v2',
  PROJECTS: 'sf_projects_v2',
  DECISION_LOGS: 'sf_decision_logs_v2',
  AI_PROVIDERS: 'sf_ai_providers_v2',
  PROMPT_TEMPLATES: 'sf_prompt_templates_v2',
  AI_AGENTS: 'sf_ai_agents_v2',
  PLUGINS: 'sf_plugins_v2',
};

/** sessionStorage key for session-only (non-persisted) AI provider API keys, by provider id. */
const SESSION_API_KEYS = 'sf_ai_provider_session_keys_v1';
let providersSnapshot: { base: AIProviderConfig[]; sessionRaw: string | null; merged: AIProviderConfig[] } | null = null;

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

export function useCacheProfiles() {
  return useStorage(() => StorageService.getCacheProfiles(), initialCacheProfiles);
}

export function useLoggingProfiles() {
  return useStorage(() => StorageService.getLoggingProfiles(), initialLoggingProfiles);
}

export function useEncryptionProfiles() {
  return useStorage(() => StorageService.getEncryptionProfiles(), initialEncryptionProfiles);
}

export function useDeploymentProfiles() {
  return useStorage(() => StorageService.getDeploymentProfiles(), initialDeploymentProfiles);
}

export function useAuthenticationProfiles() {
  return useStorage(() => StorageService.getAuthenticationProfiles(), initialAuthenticationProfiles);
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

export function useAIAgents() {
  return useStorage(() => StorageService.getAIAgents(), initialAIAgents);
}

export function usePlugins() {
  return useStorage(() => StorageService.getPlugins(), initialPlugins);
}

const memoryCache: Record<string, { raw: string | null; parsed: any }> = {};

// `defaultValue` is a module-level singleton (e.g. `initialDecisionLogs`) shared across every
// call. Several service methods mutate the array/object they get back in place (`arr.unshift(x)`)
// before saving. Handing out that singleton directly means such a mutation permanently corrupts
// the "empty/default" seed for the rest of the session -- so a later reset-to-empty (or a fresh
// call that falls back to defaultValue again) resurfaces stale leftover data instead of a genuine
// empty state. Cloning only in the branch that materializes a *fresh* default (never in the
// memoryCache-hit branch) fixes that while preserving the referential stability the
// useSyncExternalStore-based hooks in this file require -- returning a new object on every call
// there would make React think the store changes on every render (infinite update loop).
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return clone(defaultValue);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const seeded = clone(defaultValue);
      const serialized = JSON.stringify(seeded);
      localStorage.setItem(key, serialized);
      memoryCache[key] = { raw: serialized, parsed: seeded };
      return seeded;
    }
    if (memoryCache[key] && memoryCache[key].raw === raw) {
      return memoryCache[key].parsed as T;
    }
    const parsed = JSON.parse(raw);
    memoryCache[key] = { raw, parsed };
    return parsed as T;
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage`, err);
    return clone(defaultValue);
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
      setItem(STORAGE_KEYS.PROFILES_ENCRYPTION, initialEncryptionProfiles);
      setItem(STORAGE_KEYS.PROFILES_DEPLOYMENT, initialDeploymentProfiles);
      setItem(STORAGE_KEYS.PROFILES_AUTHENTICATION, initialAuthenticationProfiles);
      setItem(STORAGE_KEYS.RULE_SETS, initialRuleSets);
      setItem(STORAGE_KEYS.FEATURE_MANIFESTS, initialFeatureManifests);
      setItem(STORAGE_KEYS.TEMPLATES, initialTemplates);
      setItem(STORAGE_KEYS.PROJECTS, initialProjects);
      setItem(STORAGE_KEYS.DECISION_LOGS, initialDecisionLogs);
      setItem(STORAGE_KEYS.AI_PROVIDERS, initialAIProviders);
      setItem(STORAGE_KEYS.PROMPT_TEMPLATES, initialPromptTemplates);
      setItem(STORAGE_KEYS.AI_AGENTS, initialAIAgents);
      setItem(STORAGE_KEYS.PLUGINS, initialPlugins);
    }
  }

  static getOrganizations(): Organization[] {
    if (API_DATA_SOURCE_ENABLED) {
      return getOrganizationsBridged(notifyStorageChange, initialOrganizations);
    }
    return getItem(STORAGE_KEYS.ORGANIZATIONS, initialOrganizations);
  }

  static saveOrganizations(organizations: Organization[]): void {
    if (API_DATA_SOURCE_ENABLED) {
      void saveOrganizationsBridged(organizations, notifyStorageChange);
      return;
    }
    setItem(STORAGE_KEYS.ORGANIZATIONS, organizations);
  }

  static getWorkspaces(): Workspace[] {
    if (API_DATA_SOURCE_ENABLED) {
      return getWorkspacesBridged(notifyStorageChange, initialWorkspaces);
    }
    return getItem(STORAGE_KEYS.WORKSPACES, initialWorkspaces);
  }

  static saveWorkspaces(workspaces: Workspace[]): void {
    if (API_DATA_SOURCE_ENABLED) {
      void saveWorkspacesBridged(workspaces, notifyStorageChange);
      return;
    }
    setItem(STORAGE_KEYS.WORKSPACES, workspaces);
  }

  static getTechStacks(): TechStack[] {
    return getItem(STORAGE_KEYS.TECH_STACKS, initialTechStacks);
  }

  static saveTechStacks(stacks: TechStack[]): void {
    setItem(STORAGE_KEYS.TECH_STACKS, stacks);
  }

  static getSecurityProfiles(): ProfileSecurity[] {
    return getItem(STORAGE_KEYS.PROFILES_SECURITY, initialSecurityProfiles);
  }

  static saveSecurityProfiles(profiles: ProfileSecurity[]): void {
    setItem(STORAGE_KEYS.PROFILES_SECURITY, profiles);
  }

  static getDatabaseProfiles(): ProfileDatabase[] {
    return getItem(STORAGE_KEYS.PROFILES_DATABASE, initialDatabaseProfiles);
  }

  static saveDatabaseProfiles(profiles: ProfileDatabase[]): void {
    setItem(STORAGE_KEYS.PROFILES_DATABASE, profiles);
  }

  static getDockerProfiles(): ProfileDocker[] {
    return getItem(STORAGE_KEYS.PROFILES_DOCKER, initialDockerProfiles);
  }

  static saveDockerProfiles(profiles: ProfileDocker[]): void {
    setItem(STORAGE_KEYS.PROFILES_DOCKER, profiles);
  }

  static getCacheProfiles(): ProfileCache[] {
    return getItem(STORAGE_KEYS.PROFILES_CACHE, initialCacheProfiles);
  }

  static saveCacheProfiles(profiles: ProfileCache[]): void {
    setItem(STORAGE_KEYS.PROFILES_CACHE, profiles);
  }

  static getLoggingProfiles(): ProfileLogging[] {
    return getItem(STORAGE_KEYS.PROFILES_LOGGING, initialLoggingProfiles);
  }

  static saveLoggingProfiles(profiles: ProfileLogging[]): void {
    setItem(STORAGE_KEYS.PROFILES_LOGGING, profiles);
  }

  static getEncryptionProfiles(): ProfileEncryption[] {
    return getItem(STORAGE_KEYS.PROFILES_ENCRYPTION, initialEncryptionProfiles);
  }

  static saveEncryptionProfiles(profiles: ProfileEncryption[]): void {
    setItem(STORAGE_KEYS.PROFILES_ENCRYPTION, profiles);
  }

  static getDeploymentProfiles(): ProfileDeployment[] {
    return getItem(STORAGE_KEYS.PROFILES_DEPLOYMENT, initialDeploymentProfiles);
  }

  static saveDeploymentProfiles(profiles: ProfileDeployment[]): void {
    setItem(STORAGE_KEYS.PROFILES_DEPLOYMENT, profiles);
  }

  static getAuthenticationProfiles(): ProfileAuthentication[] {
    return getItem(STORAGE_KEYS.PROFILES_AUTHENTICATION, initialAuthenticationProfiles);
  }

  static saveAuthenticationProfiles(profiles: ProfileAuthentication[]): void {
    setItem(STORAGE_KEYS.PROFILES_AUTHENTICATION, profiles);
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
    const base = getItem(STORAGE_KEYS.AI_PROVIDERS, initialAIProviders);
    if (typeof window === 'undefined') return base;
    let sessionRaw: string | null = null;
    try {
      sessionRaw = window.sessionStorage.getItem(SESSION_API_KEYS);
    } catch {
      sessionRaw = null;
    }
    // Stable reference for useSyncExternalStore: only re-merge when either source changed.
    if (providersSnapshot && providersSnapshot.base === base && providersSnapshot.sessionRaw === sessionRaw) {
      return providersSnapshot.merged;
    }
    let sessionKeys: Record<string, string> = {};
    try {
      sessionKeys = sessionRaw ? (JSON.parse(sessionRaw) as Record<string, string>) : {};
    } catch {
      sessionKeys = {};
    }
    const needsMerge = base.some((p) => p.persistKey === false && sessionKeys[p.id]);
    const merged = needsMerge
      ? base.map((p) => (p.persistKey === false && sessionKeys[p.id] ? { ...p, apiKey: sessionKeys[p.id] } : p))
      : base;
    providersSnapshot = { base, sessionRaw, merged };
    return merged;
  }

  /**
   * Providers with `persistKey: false` have their apiKey stripped from the
   * localStorage payload and kept only in sessionStorage (session-only key).
   */
  static saveAIProviders(providers: AIProviderConfig[]): void {
    const sessionKeys: Record<string, string> = {};
    const persisted = providers.map((p) => {
      if (p.persistKey !== false) return p;
      if (p.apiKey) sessionKeys[p.id] = p.apiKey;
      const { apiKey: _sessionOnly, ...rest } = p;
      return rest;
    });
    if (typeof window !== 'undefined') {
      try {
        if (Object.keys(sessionKeys).length) window.sessionStorage.setItem(SESSION_API_KEYS, JSON.stringify(sessionKeys));
        else window.sessionStorage.removeItem(SESSION_API_KEYS);
      } catch (err) {
        console.error('Error writing session-only API keys to sessionStorage', err);
      }
    }
    setItem(STORAGE_KEYS.AI_PROVIDERS, persisted);
  }

  static getPromptTemplates(): PromptTemplate[] {
    return getItem(STORAGE_KEYS.PROMPT_TEMPLATES, initialPromptTemplates);
  }

  static savePromptTemplates(prompts: PromptTemplate[]): void {
    setItem(STORAGE_KEYS.PROMPT_TEMPLATES, prompts);
  }

  static getAIAgents(): AIAgent[] {
    return getItem(STORAGE_KEYS.AI_AGENTS, initialAIAgents);
  }

  static saveAIAgents(agents: AIAgent[]): void {
    setItem(STORAGE_KEYS.AI_AGENTS, agents);
  }

  static getPlugins(): Plugin[] {
    return getItem(STORAGE_KEYS.PLUGINS, initialPlugins);
  }

  static savePlugins(plugins: Plugin[]): void {
    setItem(STORAGE_KEYS.PLUGINS, plugins);
  }

  static exportFullWorkspaceState(): string {
    const data = {
      organizations: this.getOrganizations(),
      workspaces: this.getWorkspaces(),
      techStacks: this.getTechStacks(),
      cacheProfiles: this.getCacheProfiles(),
      loggingProfiles: this.getLoggingProfiles(),
      encryptionProfiles: this.getEncryptionProfiles(),
      deploymentProfiles: this.getDeploymentProfiles(),
      authenticationProfiles: this.getAuthenticationProfiles(),
      ruleSets: this.getRuleSets(),
      featureManifests: this.getFeatureManifests(),
      templates: this.getTemplates(),
      projects: this.getProjects(),
      decisionLogs: this.getDecisionLogs(),
      aiProviders: this.getAIProviders(),
      promptTemplates: this.getPromptTemplates(),
      aiAgents: this.getAIAgents(),
      plugins: this.getPlugins(),
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
      if (data.organizations) setItem(STORAGE_KEYS.ORGANIZATIONS, data.organizations);
      if (data.workspaces) setItem(STORAGE_KEYS.WORKSPACES, data.workspaces);
      if (data.aiAgents) setItem(STORAGE_KEYS.AI_AGENTS, data.aiAgents);
      if (data.plugins) setItem(STORAGE_KEYS.PLUGINS, data.plugins);
      if (data.techStacks) setItem(STORAGE_KEYS.TECH_STACKS, data.techStacks);
      if (data.cacheProfiles) setItem(STORAGE_KEYS.PROFILES_CACHE, data.cacheProfiles);
      if (data.loggingProfiles) setItem(STORAGE_KEYS.PROFILES_LOGGING, data.loggingProfiles);
      if (data.encryptionProfiles) setItem(STORAGE_KEYS.PROFILES_ENCRYPTION, data.encryptionProfiles);
      if (data.deploymentProfiles) setItem(STORAGE_KEYS.PROFILES_DEPLOYMENT, data.deploymentProfiles);
      if (data.authenticationProfiles) setItem(STORAGE_KEYS.PROFILES_AUTHENTICATION, data.authenticationProfiles);
      notifyStorageChange();
      return true;
    } catch (e) {
      console.error('Failed to import workspace state', e);
      return false;
    }
  }
}
