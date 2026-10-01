import { describe, it, expect, afterEach } from 'vitest';
import { apiAuthHeaders, API_TOKEN_STORAGE_KEY } from './client-auth';

describe('client-auth', () => {
  afterEach(() => {
    window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
    delete process.env.NEXT_PUBLIC_API_TOKEN;
  });

  it('sends no header when no token is configured', () => {
    expect(apiAuthHeaders()).toEqual({});
  });

  it('prefers the per-browser localStorage token over the build-time env one', () => {
    process.env.NEXT_PUBLIC_API_TOKEN = 'from-env';
    expect(apiAuthHeaders()).toEqual({ Authorization: 'Bearer from-env' });
    window.localStorage.setItem(API_TOKEN_STORAGE_KEY, 'from-storage');
    expect(apiAuthHeaders()).toEqual({ Authorization: 'Bearer from-storage' });
  });
});
