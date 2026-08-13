import { describe, it, expect, beforeEach } from 'vitest';
import { organizationRepository } from './organization.repository';
import type { Organization } from '../../types/factory';

const sampleOrg: Organization = {
  id: 'org-test-1',
  name: 'Test Org',
  code: 'TST',
  plan: 'Team',
};

describe('organizationRepository (LocalStorageOrganizationRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty when nothing has been saved yet', () => {
    expect(organizationRepository.getOrganizations()).toEqual([]);
  });

  it('round-trips organizations through localStorage', () => {
    organizationRepository.saveOrganizations([sampleOrg]);
    const loaded = organizationRepository.getOrganizations();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sampleOrg);
  });

  it('supports deleting an organization by filtering and re-saving', () => {
    organizationRepository.saveOrganizations([sampleOrg]);
    organizationRepository.saveOrganizations(
      organizationRepository.getOrganizations().filter((o) => o.id !== sampleOrg.id)
    );
    expect(organizationRepository.getOrganizations()).toEqual([]);
  });
});
