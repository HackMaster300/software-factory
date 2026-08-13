import { describe, it, expect, beforeEach } from 'vitest';
import { pluginRepository } from './plugin.repository';
import type { Plugin } from '../../types/factory';

const samplePlugin: Plugin = {
  id: 'plugin-test-1',
  name: 'Static Analysis Bot',
  description: 'Simulates a static analysis pass over generated code.',
  category: 'Quality',
  isActive: true,
};

describe('pluginRepository (LocalStoragePluginRepository)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts genuinely empty when nothing has been saved yet', () => {
    expect(pluginRepository.getPlugins()).toEqual([]);
  });

  it('round-trips plugins through localStorage', () => {
    pluginRepository.savePlugins([samplePlugin]);
    const loaded = pluginRepository.getPlugins();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(samplePlugin);
  });

  it('supports toggling isActive', () => {
    pluginRepository.savePlugins([samplePlugin]);
    const toggled = pluginRepository.getPlugins().map((p) => ({ ...p, isActive: !p.isActive }));
    pluginRepository.savePlugins(toggled);
    expect(pluginRepository.getPlugins()[0].isActive).toBe(false);
  });

  it('supports deleting a plugin by filtering and re-saving', () => {
    pluginRepository.savePlugins([samplePlugin]);
    pluginRepository.savePlugins(
      pluginRepository.getPlugins().filter((p) => p.id !== samplePlugin.id)
    );
    expect(pluginRepository.getPlugins()).toEqual([]);
  });
});
