import { describe, it, expect, beforeEach } from 'vitest';
import { profileRepository } from './profile.repository';
import type { ProfileCache, ProfileLogging, ProfileEncryption, ProfileDeployment, ProfileAuthentication } from '../../types/factory';

const sampleCache: ProfileCache = {
  id: 'cache-test-1',
  name: 'Test Cache',
  provider: 'Redis',
  defaultTtlMinutes: 15,
  enableDistributedLock: false,
};

const sampleLogging: ProfileLogging = {
  id: 'log-test-1',
  name: 'Test Logging',
  provider: 'Winston',
  minLevel: 'Debug',
  structuredJson: false,
  sinkToConsole: true,
  sinkToSeqOrJaeger: false,
};

const sampleEncryption: ProfileEncryption = {
  id: 'enc-test-1',
  name: 'Test Encryption',
  algorithm: 'AES-256-GCM',
  keyRotationDays: 90,
  encryptAtRest: true,
  encryptInTransit: true,
};

const sampleDeployment: ProfileDeployment = {
  id: 'deploy-test-1',
  name: 'Test Deployment',
  targetPlatform: 'Kubernetes',
  replicas: 3,
  autoScale: true,
  strategy: 'RollingUpdate',
};

const sampleAuth: ProfileAuthentication = {
  id: 'auth-test-1',
  name: 'Test Auth',
  provider: 'JWT',
  sessionTimeoutMinutes: 30,
  enableMfa: true,
};

describe('profileRepository (LocalStorageProfileRepository) — Phase 2b additions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips cache profiles through localStorage', () => {
    profileRepository.saveCacheProfiles([sampleCache]);
    const loaded = profileRepository.getCacheProfiles();
    expect(loaded.some((p) => p.id === sampleCache.id)).toBe(true);
  });

  it('round-trips logging profiles through localStorage', () => {
    profileRepository.saveLoggingProfiles([sampleLogging]);
    const loaded = profileRepository.getLoggingProfiles();
    expect(loaded.some((p) => p.id === sampleLogging.id)).toBe(true);
  });

  it('starts genuinely empty for encryption profiles (brand-new type, no seed catalog)', () => {
    expect(profileRepository.getEncryptionProfiles()).toEqual([]);
  });

  it('round-trips encryption profiles through localStorage', () => {
    profileRepository.saveEncryptionProfiles([sampleEncryption]);
    expect(profileRepository.getEncryptionProfiles()).toEqual([sampleEncryption]);
  });

  it('starts genuinely empty for deployment profiles (brand-new type, no seed catalog)', () => {
    expect(profileRepository.getDeploymentProfiles()).toEqual([]);
  });

  it('round-trips deployment profiles through localStorage', () => {
    profileRepository.saveDeploymentProfiles([sampleDeployment]);
    expect(profileRepository.getDeploymentProfiles()).toEqual([sampleDeployment]);
  });

  it('starts genuinely empty for authentication profiles (brand-new type, no seed catalog)', () => {
    expect(profileRepository.getAuthenticationProfiles()).toEqual([]);
  });

  it('round-trips authentication profiles through localStorage', () => {
    profileRepository.saveAuthenticationProfiles([sampleAuth]);
    expect(profileRepository.getAuthenticationProfiles()).toEqual([sampleAuth]);
  });

  it('supports deleting a profile of any new type by filtering and re-saving', () => {
    profileRepository.saveEncryptionProfiles([sampleEncryption]);
    profileRepository.saveEncryptionProfiles(
      profileRepository.getEncryptionProfiles().filter((p) => p.id !== sampleEncryption.id)
    );
    expect(profileRepository.getEncryptionProfiles()).toEqual([]);
  });
});
