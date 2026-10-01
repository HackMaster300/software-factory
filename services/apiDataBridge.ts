import { Organization, Workspace } from '../types/factory';
import { apiOrganizationRepository } from './repositories/api/organization.repository';
import { apiWorkspaceRepository } from './repositories/api/workspace.repository';

/**
 * Phase 22 (going-home): liga de facto o seam assíncrono (Phase 8) que
 * existia mas nunca era chamado por ninguém — todos os repositórios
 * continuavam presos ao LocalStorageRepository.
 *
 * Ativado só com NEXT_PUBLIC_DATA_SOURCE=api (omisso = comportamento
 * antigo, 100% inalterado). Quando ativo, Organizations/Workspaces
 * passam a persistir no backend (SQLite/MSSQL via /api/v1/*) em vez de
 * localStorage — os outros 11 agregados continuam em localStorage,
 * ver README/PLAN.md para o que falta.
 *
 * Os hooks `useOrganizations`/`useWorkspaces` (useSyncExternalStore)
 * exigem um snapshot síncrono — por isso este módulo mantém uma cache
 * em memória, populada de forma assíncrona a partir da API, e notifica
 * os subscritores (`notifyStorageChange`) quando os dados chegam ou
 * mudam. Os componentes continuam a chamar os hooks exatamente da
 * mesma forma; não precisam de saber de onde os dados vêm.
 */

export const API_DATA_SOURCE_ENABLED = process.env.NEXT_PUBLIC_DATA_SOURCE === 'api';

let organizationsCache: Organization[] | null = null;
let workspacesCache: Workspace[] | null = null;
let organizationsFetchInFlight = false;
let workspacesFetchInFlight = false;

type NotifyFn = () => void;

function loadOrganizationsFromApi(notify: NotifyFn, fallback: Organization[]): void {
  if (organizationsFetchInFlight) return;
  organizationsFetchInFlight = true;
  apiOrganizationRepository
    .getOrganizations()
    .then((data) => {
      organizationsCache = data;
      notify();
    })
    .catch((err) => {
      console.error('Falha ao carregar organizations da API:', err);
      organizationsCache = organizationsCache ?? fallback;
    })
    .finally(() => {
      organizationsFetchInFlight = false;
    });
}

function loadWorkspacesFromApi(notify: NotifyFn, fallback: Workspace[]): void {
  if (workspacesFetchInFlight) return;
  workspacesFetchInFlight = true;
  apiWorkspaceRepository
    .getWorkspaces()
    .then((data) => {
      workspacesCache = data;
      notify();
    })
    .catch((err) => {
      console.error('Falha ao carregar workspaces da API:', err);
      workspacesCache = workspacesCache ?? fallback;
    })
    .finally(() => {
      workspacesFetchInFlight = false;
    });
}

/** Snapshot síncrono para useSyncExternalStore — dispara o fetch em
 * segundo plano na primeira leitura, mas nunca bloqueia o render. */
export function getOrganizationsBridged(notify: NotifyFn, fallback: Organization[]): Organization[] {
  if (organizationsCache === null) {
    loadOrganizationsFromApi(notify, fallback);
    return fallback;
  }
  return organizationsCache;
}

export function getWorkspacesBridged(notify: NotifyFn, fallback: Workspace[]): Workspace[] {
  if (workspacesCache === null) {
    loadWorkspacesFromApi(notify, fallback);
    return fallback;
  }
  return workspacesCache;
}

/**
 * Reconcilia a lista completa recebida de saveOrganizations(novaLista)
 * com a cache atual: cria o que é novo, atualiza o que mudou, apaga o
 * que desapareceu. Atualiza a cache de forma otimista (antes da API
 * responder) para a UI continuar instantânea; se uma chamada falhar,
 * fica registado em consola e a próxima leitura da API corrige o
 * estado (não há rollback automático nesta primeira versão).
 */
export function saveOrganizationsBridged(newList: Organization[], notify: NotifyFn): void {
  const previous = organizationsCache ?? [];
  organizationsCache = newList;
  notify();

  const previousIds = new Set(previous.map((o) => o.id));
  const newIds = new Set(newList.map((o) => o.id));

  for (const org of newList) {
    const before = previous.find((o) => o.id === org.id);
    if (!before) {
      apiOrganizationRepository
        .createOrganization(org)
        .catch((err) => console.error(`Falha ao criar organization ${org.id} na API:`, err));
    } else if (JSON.stringify(before) !== JSON.stringify(org)) {
      apiOrganizationRepository
        .updateOrganization(org.id, org)
        .catch((err) => console.error(`Falha ao atualizar organization ${org.id} na API:`, err));
    }
  }
  for (const org of previous) {
    if (!newIds.has(org.id)) {
      apiOrganizationRepository
        .deleteOrganization(org.id)
        .catch((err) => console.error(`Falha ao apagar organization ${org.id} na API:`, err));
    }
  }
  void previousIds;
}

export function saveWorkspacesBridged(newList: Workspace[], notify: NotifyFn): void {
  const previous = workspacesCache ?? [];
  workspacesCache = newList;
  notify();

  const newIds = new Set(newList.map((w) => w.id));

  for (const ws of newList) {
    const before = previous.find((w) => w.id === ws.id);
    if (!before) {
      apiWorkspaceRepository
        .createWorkspace(ws)
        .catch((err) => console.error(`Falha ao criar workspace ${ws.id} na API:`, err));
    } else if (JSON.stringify(before) !== JSON.stringify(ws)) {
      apiWorkspaceRepository
        .updateWorkspace(ws.id, ws)
        .catch((err) => console.error(`Falha ao atualizar workspace ${ws.id} na API:`, err));
    }
  }
  for (const ws of previous) {
    if (!newIds.has(ws.id)) {
      apiWorkspaceRepository
        .deleteWorkspace(ws.id)
        .catch((err) => console.error(`Falha ao apagar workspace ${ws.id} na API:`, err));
    }
  }
}

/** Só para testes: repõe as caches em memória entre casos de teste. */
export function __resetBridgeCachesForTests(): void {
  organizationsCache = null;
  workspacesCache = null;
  organizationsFetchInFlight = false;
  workspacesFetchInFlight = false;
}
