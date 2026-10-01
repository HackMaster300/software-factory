import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Organization, Workspace } from '../types/factory';

const sampleOrg: Organization = { id: 'org-1', name: 'Acme', code: 'ACME', plan: 'Team' };
const sampleWs: Workspace = { id: 'ws-1', organizationId: 'org-1', name: 'WS1', description: '' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiDataBridge', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getOrganizationsBridged devolve o fallback de imediato e dispara o fetch em segundo plano', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [sampleOrg] }));
    const { getOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();

    const notify = vi.fn();
    const fallback: Organization[] = [];

    const first = getOrganizationsBridged(notify, fallback);
    expect(first).toBe(fallback); // cache ainda null -> devolve o fallback na hora

    await vi.waitFor(() => expect(notify).toHaveBeenCalled());

    const second = getOrganizationsBridged(notify, fallback);
    expect(second).toEqual([sampleOrg]);
  });

  it('não dispara dois fetches em paralelo se a cache ainda não chegou', async () => {
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );
    const { getOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();

    const notify = vi.fn();
    getOrganizationsBridged(notify, []);
    getOrganizationsBridged(notify, []);
    getOrganizationsBridged(notify, []);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch(jsonResponse({ data: [] }));
    await vi.waitFor(() => expect(notify).toHaveBeenCalled());
  });

  it('saveOrganizationsBridged atualiza a cache de forma otimista antes da API responder', async () => {
    const { getOrganizationsBridged, saveOrganizationsBridged, __resetBridgeCachesForTests } = await import(
      './apiDataBridge'
    );
    __resetBridgeCachesForTests();

    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleOrg }, 201));

    const notify = vi.fn();
    saveOrganizationsBridged([sampleOrg], notify);

    expect(notify).toHaveBeenCalled();
    expect(getOrganizationsBridged(notify, [])).toEqual([sampleOrg]);
  });

  it('saveOrganizationsBridged: item novo gera POST /api/v1/organizations', async () => {
    const { saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleOrg }, 201));

    saveOrganizationsBridged([sampleOrg], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/organizations');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(sampleOrg);
  });

  it('saveOrganizationsBridged: item alterado gera PATCH /api/v1/organizations/:id', async () => {
    const { saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleOrg }, 201));

    saveOrganizationsBridged([sampleOrg], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const updated = { ...sampleOrg, name: 'Acme Corp' };
    saveOrganizationsBridged([updated], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(`/api/v1/organizations/${sampleOrg.id}`);
    expect(options.method).toBe('PATCH');
  });

  it('saveOrganizationsBridged: item removido gera DELETE /api/v1/organizations/:id', async () => {
    const { saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleOrg }, 201));

    saveOrganizationsBridged([sampleOrg], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    saveOrganizationsBridged([], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(`/api/v1/organizations/${sampleOrg.id}`);
    expect(options.method).toBe('DELETE');
  });

  it('saveOrganizationsBridged: item sem alteração não gera chamada nenhuma', async () => {
    const { saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleOrg }, 201));

    saveOrganizationsBridged([sampleOrg], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    saveOrganizationsBridged([sampleOrg], vi.fn());
    // dá tempo a um eventual (indevido) segundo fetch de disparar
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getOrganizationsBridged mantém o erro silencioso (cache fica no fallback) se a API falhar', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'offline' }, 500));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();

    const notify = vi.fn();
    const fallback = [sampleOrg];
    getOrganizationsBridged(notify, fallback);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(getOrganizationsBridged(notify, fallback)).toEqual(fallback);
    consoleSpy.mockRestore();
  });

  it('workspaces: mesmo comportamento de criar/atualizar/apagar via diff', async () => {
    const { saveWorkspacesBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    fetchMock.mockImplementation(async () => jsonResponse({ data: sampleWs }, 201));

    saveWorkspacesBridged([sampleWs], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/workspaces');
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');

    saveWorkspacesBridged([], vi.fn());
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe(`/api/v1/workspaces/${sampleWs.id}`);
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });

  it('reverte a cache para o estado do servidor e avisa quando uma escrita falha', async () => {
    const showToast = vi.fn();
    vi.doMock('../hooks/use-toasts', () => ({ showToast }));
    const { getOrganizationsBridged, saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    const notify = vi.fn();

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [sampleOrg] }));
    getOrganizationsBridged(notify, []);
    await vi.waitFor(() => expect(getOrganizationsBridged(notify, [])).toEqual([sampleOrg]));

    const renamed = { ...sampleOrg, name: 'Acme 2' };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500)) // PATCH falha
      .mockResolvedValueOnce(jsonResponse({ data: [sampleOrg] })); // reload do servidor
    await saveOrganizationsBridged([renamed], notify);

    expect(getOrganizationsBridged(notify, [])).toEqual([sampleOrg]);
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('revertidas'));
    vi.doUnmock('../hooks/use-toasts');
  });

  it('volta à lista anterior se a escrita e o reload falharem', async () => {
    const { getOrganizationsBridged, saveOrganizationsBridged, __resetBridgeCachesForTests } = await import('./apiDataBridge');
    __resetBridgeCachesForTests();
    const notify = vi.fn();

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [sampleOrg] }));
    getOrganizationsBridged(notify, []);
    await vi.waitFor(() => expect(getOrganizationsBridged(notify, [])).toEqual([sampleOrg]));

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'boom' }, 500)) // DELETE falha
      .mockRejectedValueOnce(new Error('offline')); // reload falha
    await saveOrganizationsBridged([], notify);

    expect(getOrganizationsBridged(notify, [])).toEqual([sampleOrg]);
  });
});
