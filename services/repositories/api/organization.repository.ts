import type { Organization } from '../../../types/factory';

/**
 * Phase 8-full — API repository (async) para Organizations.
 * Usa o mesmo contrato de dados do LocalStorage, mas via REST.
 * Mantém IOrganizationRepository síncrono intacto; este é o seam async
 * para quando NEXT_PUBLIC_DATA_SOURCE=api.
 */
export interface IOrganizationRepositoryAsync {
  getOrganizations(): Promise<Organization[]>;
  createOrganization(input: Omit<Organization, 'id'> & { id?: string }): Promise<Organization>;
  updateOrganization(id: string, input: Omit<Organization, 'id'>): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
}

export class ApiOrganizationRepository implements IOrganizationRepositoryAsync {
  async getOrganizations(): Promise<Organization[]> {
    const res = await fetch('/api/v1/organizations');
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Organization[] };
    return data;
  }

  async createOrganization(input: Omit<Organization, 'id'> & { id?: string }): Promise<Organization> {
    const res = await fetch('/api/v1/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Organization };
    return data;
  }

  async updateOrganization(id: string, input: Omit<Organization, 'id'>): Promise<Organization> {
    const res = await fetch(`/api/v1/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Organization };
    return data;
  }

  async deleteOrganization(id: string): Promise<void> {
    const res = await fetch(`/api/v1/organizations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({} as Record<string, string>))).error || `HTTP ${res.status}`);
  }
}

export const apiOrganizationRepository = new ApiOrganizationRepository();
