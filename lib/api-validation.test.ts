import { describe, it, expect } from 'vitest';
import {
  validateOrganization,
  validateWorkspace,
  validateProviderUpsert,
  redactProvider,
} from './api-validation';

describe('validateOrganization', () => {
  it('rejects non-objects and missing fields with honest errors', () => {
    expect(validateOrganization(null)).toEqual({ ok: false, error: 'Body must be a JSON object.' });
    expect(validateOrganization({})).toEqual({ ok: false, error: '"name" is required.' });
    expect(validateOrganization({ name: 'Acme' })).toEqual({ ok: false, error: '"code" is required.' });
  });

  it('rejects unknown plans and defaults to Team when omitted', () => {
    expect(validateOrganization({ name: 'A', code: 'a', plan: 'Gold' }).ok).toBe(false);
    const res = validateOrganization({ name: ' A ', code: ' a ' });
    expect(res).toEqual({ ok: true, value: { name: 'A', code: 'a', plan: 'Team' } });
  });
});

describe('validateWorkspace', () => {
  it('requires name and an existing organizationId reference', () => {
    expect(validateWorkspace({ name: 'WS' })).toEqual({
      ok: false,
      error: '"organizationId" is required and must reference an existing organization.',
    });
    expect(validateWorkspace({ name: ' WS ', organizationId: 'org-1' })).toEqual({
      ok: true,
      value: { name: 'WS', organizationId: 'org-1', description: '' },
    });
  });
});

describe('validateProviderUpsert', () => {
  it('rejects unknown vendors and requires name/model', () => {
    expect(validateProviderUpsert({ name: 'X', model: 'm', provider: 'Nope' }).ok).toBe(false);
    const res = validateProviderUpsert({ name: 'Gem', provider: 'Google Gemini', model: 'gemini-2.5-flash' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Phase 7: sem custo chutado — vazio vira 'n/a'.
      expect(res.value.costPer1k).toBe('n/a');
      expect(res.value.latency).toBe('n/a');
    }
  });
});

describe('redactProvider', () => {
  it('never exposes api_key — surfaces hasKey instead', () => {
    const redacted = redactProvider({
      id: 'p1', name: 'Gem', model: 'm', provider: 'Google Gemini', status: 'active',
      cost_per_1k: 'n/a', latency: 'n/a', api_key: 'SECRET', base_url: null, is_active_default: 1,
    });
    expect(redacted).toEqual({
      id: 'p1', name: 'Gem', model: 'm', provider: 'Google Gemini', status: 'active',
      costPer1k: 'n/a', latency: 'n/a', isActiveDefault: true, hasKey: true,
    });
    expect('api_key' in redacted).toBe(false);
    expect('apiKey' in redacted).toBe(false);
  });
});
