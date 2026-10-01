import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from './storageService';

describe('StorageService array persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('seeds default tech stacks on first read', () => {
    const stacks = StorageService.getTechStacks();
    expect(stacks.length).toBeGreaterThan(1);
  });

  it('persists a user deletion that shrinks an array below the seed count, instead of silently reseeding it', () => {
    const seeded = StorageService.getTechStacks();
    const seedCount = seeded.length;
    expect(seedCount).toBeGreaterThan(1);

    const afterDelete = seeded.slice(1); // remove one, same as a real "delete tech stack" action
    StorageService.saveTechStacks(afterDelete);

    const reread = StorageService.getTechStacks();
    expect(reread.length).toBe(seedCount - 1);
    expect(reread.map((s) => s.id)).toEqual(afterDelete.map((s) => s.id));
  });

  it('keeps a deletion down to a single remaining item persisted across repeated reads', () => {
    const seeded = StorageService.getTechStacks();
    const single = [seeded[0]];
    StorageService.saveTechStacks(single);

    expect(StorageService.getTechStacks()).toHaveLength(1);
    expect(StorageService.getTechStacks()).toHaveLength(1); // second read must not reseed either
  });

  it('still recovers gracefully from genuinely corrupted (non-JSON) localStorage', () => {
    window.localStorage.setItem('sf_tech_stacks_v2', '{not valid json');
    const stacks = StorageService.getTechStacks();
    expect(Array.isArray(stacks)).toBe(true);
  });
});

describe('StorageService session-only AI provider keys', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('keeps persistKey:false keys out of localStorage but returns them for this session', () => {
    const base = StorageService.getAIProviders();
    const [first, second] = base;
    StorageService.saveAIProviders([
      { ...first, apiKey: 'SESSION-ONLY-KEY', persistKey: false },
      { ...second, apiKey: 'PERSISTED-KEY' },
      ...base.slice(2),
    ]);

    const local = window.localStorage.getItem('sf_ai_providers_v2') || '';
    expect(local).not.toContain('SESSION-ONLY-KEY');
    expect(local).toContain('PERSISTED-KEY');

    const reread = StorageService.getAIProviders();
    expect(reread[0].apiKey).toBe('SESSION-ONLY-KEY');
    expect(reread[1].apiKey).toBe('PERSISTED-KEY');
    // stable snapshot for useSyncExternalStore
    expect(StorageService.getAIProviders()).toBe(reread);

    // closing the tab clears sessionStorage -> the key is gone
    window.sessionStorage.clear();
    expect(StorageService.getAIProviders()[0].apiKey).toBeUndefined();
  });
});
