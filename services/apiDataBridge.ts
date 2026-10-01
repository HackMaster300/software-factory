import { Organization, Workspace } from '../types/factory';
import { apiOrganizationRepository } from './repositories/api/organization.repository';
import { apiWorkspaceRepository } from './repositories/api/workspace.repository';
import { showToast } from '../hooks/use-toasts';

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
 * responder) para a UI continuar instantânea. Se alguma chamada falhar,
 * a cache é reposta a partir da API (fonte de verdade) — ou, se nem isso
 * for possível, volta à lista anterior — e o utilizador é avisado por toast.
 */
function syncListWithApi<T extends { id: string }>(
  label: string,
  previous: T[],
  newList: T[],
  ops: {
    create: (item: T) => Promise<unknown>;
    update: (item: T) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
    reload: () => Promise<T[]>;
    setCache: (list: T[]) => void;
  },
  notify: NotifyFn
): Promise<void> {
  const newIds = new Set(newList.map((item) => item.id));
  const calls: Promise<unknown>[] = [];

  for (const item of newList) {
    const before = previous.find((p) => p.id === item.id);
    if (!before) calls.push(ops.create(item));
    else if (JSON.stringify(before) !== JSON.stringify(item)) calls.push(ops.update(item));
  }
  for (const item of previous) {
    if (!newIds.has(item.id)) calls.push(ops.remove(item.id));
  }

  return Promise.allSettled(calls).then(async (results) => {
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length === 0) return;

    console.error(`Falha ao sincronizar ${label} com a API:`, failures.map((f) => f.reason));
    try {
      ops.setCache(await ops.reload());
    } catch {
      ops.setCache(previous);
    }
    notify();
    showToast(`Não foi possível guardar ${label} no servidor — as alterações foram revertidas.`);
  });
}

export function saveOrganizationsBridged(newList: Organization[], notify: NotifyFn): Promise<void> {
  const previous = organizationsCache ?? [];
  organizationsCache = newList;
  notify();

  return syncListWithApi(
    'organizations',
    previous,
    newList,
    {
      create: (org) => apiOrganizationRepository.createOrganization(org),
      update: (org) => apiOrganizationRepository.updateOrganization(org.id, org),
      remove: (id) => apiOrganizationRepository.deleteOrganization(id),
      reload: () => apiOrganizationRepository.getOrganizations(),
      setCache: (list) => {
        organizationsCache = list;
      },
    },
    notify
  );
}

export function saveWorkspacesBridged(newList: Workspace[], notify: NotifyFn): Promise<void> {
  const previous = workspacesCache ?? [];
  workspacesCache = newList;
  notify();

  return syncListWithApi(
    'workspaces',
    previous,
    newList,
    {
      create: (ws) => apiWorkspaceRepository.createWorkspace(ws),
      update: (ws) => apiWorkspaceRepository.updateWorkspace(ws.id, ws),
      remove: (id) => apiWorkspaceRepository.deleteWorkspace(id),
      reload: () => apiWorkspaceRepository.getWorkspaces(),
      setCache: (list) => {
        workspacesCache = list;
      },
    },
    notify
  );
}

/** Só para testes: repõe as caches em memória entre casos de teste. */
export function __resetBridgeCachesForTests(): void {
  organizationsCache = null;
  workspacesCache = null;
  organizationsFetchInFlight = false;
  workspacesFetchInFlight = false;
}
