import type { Workspace } from '../../../types/factory';

export interface IWorkspaceRepositoryAsync {
  getWorkspaces(organizationId?: string): Promise<Workspace[]>;
  createWorkspace(input: { name: string; organizationId: string; description?: string; id?: string }): Promise<Workspace>;
  updateWorkspace(id: string, input: { name: string; organizationId: string; description?: string }): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;
}

export class ApiWorkspaceRepository implements IWorkspaceRepositoryAsync {
  async getWorkspaces(organizationId?: string): Promise<Workspace[]> {
    const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    const res = await fetch(`/api/v1/workspaces${qs}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Workspace[] };
    return data;
  }

  async createWorkspace(
    input: { name: string; organizationId: string; description?: string; id?: string }
  ): Promise<Workspace> {
    const res = await fetch('/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Workspace };
    return data;
  }

  async updateWorkspace(
    id: string,
    input: { name: string; organizationId: string; description?: string }
  ): Promise<Workspace> {
    const res = await fetch(`/api/v1/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Workspace };
    return data;
  }

  async deleteWorkspace(id: string): Promise<void> {
    const res = await fetch(`/api/v1/workspaces/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
  }
}

export const apiWorkspaceRepository = new ApiWorkspaceRepository();
