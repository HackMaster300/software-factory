import { describe, it, expect, beforeEach } from 'vitest';
import { workspaceRepository } from './workspace.repository';
import type { Workspace } from '../../types/factory';

const sampleWorkspace: Workspace = {
  id: 'ws-test-1',
  organizationId: 'org-test-1',
  name: 'Test Workspace',
  description: 'A workspace used in tests',
};

describe('workspaceRepository (LocalStorageWorkspaceRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty when nothing has been saved yet', () => {
    expect(workspaceRepository.getWorkspaces()).toEqual([]);
  });

  it('round-trips workspaces through localStorage', () => {
    workspaceRepository.saveWorkspaces([sampleWorkspace]);
    const loaded = workspaceRepository.getWorkspaces();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sampleWorkspace);
  });

  it('cascade-delete scenario: removing an organization also drops its workspaces', () => {
    workspaceRepository.saveWorkspaces([sampleWorkspace]);
    const remaining = workspaceRepository
      .getWorkspaces()
      .filter((w) => w.organizationId !== sampleWorkspace.organizationId);
    workspaceRepository.saveWorkspaces(remaining);
    expect(workspaceRepository.getWorkspaces()).toEqual([]);
  });
});
