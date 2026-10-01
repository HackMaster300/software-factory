// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  decryptSecret,
  encryptSecret,
  getEncryptionKey,
  InvalidEncryptionKeyError,
  isEncrypted,
  MissingEncryptionKeyError,
} from './secret-crypto';

const hexKey = { SF_ENCRYPTION_KEY: '0123456789abcdef'.repeat(4) };
const b64Key = { SF_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64') };

describe('secret-crypto', () => {
  it('round-trips with a hex or base64 key and uses a fresh IV each time', () => {
    for (const env of [hexKey, b64Key]) {
      const a = encryptSecret('sk-live-123', env)!;
      const b = encryptSecret('sk-live-123', env)!;
      expect(isEncrypted(a)).toBe(true);
      expect(a).not.toContain('sk-live-123');
      expect(a).not.toBe(b);
      expect(decryptSecret(a, env)).toBe('sk-live-123');
    }
  });

  it('is idempotent and passes null/empty through', () => {
    const enc = encryptSecret('x', hexKey)!;
    expect(encryptSecret(enc, hexKey)).toBe(enc);
    expect(encryptSecret(null, hexKey)).toBeNull();
    expect(encryptSecret('', hexKey)).toBe('');
    expect(decryptSecret(null, hexKey)).toBeNull();
  });

  it('returns legacy plaintext values unchanged on read', () => {
    expect(decryptSecret('legacy-plain', hexKey)).toBe('legacy-plain');
    expect(decryptSecret('legacy-plain', {})).toBe('legacy-plain');
  });

  it('detects tampering (GCM auth tag) and wrong keys', () => {
    const enc = encryptSecret('secret', hexKey)!;
    const parts = enc.split(':');
    const ct = Buffer.from(parts[4], 'base64');
    ct[0] ^= 0xff;
    parts[4] = ct.toString('base64');
    expect(() => decryptSecret(parts.join(':'), hexKey)).toThrow();
    expect(() => decryptSecret(enc, b64Key)).toThrow();
  });

  it('throws a clear error in production when the key is missing', () => {
    const env = { NODE_ENV: 'production' };
    expect(() => encryptSecret('k', env)).toThrow(MissingEncryptionKeyError);
    expect(() => encryptSecret('k', env)).toThrow(/SF_ENCRYPTION_KEY/);
  });

  it('falls back to plaintext with a warning outside production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(encryptSecret('k', { NODE_ENV: 'development' })).toBe('k');
    warn.mockRestore();
  });

  it('refuses to decrypt encrypted data without a key', () => {
    const enc = encryptSecret('k', hexKey)!;
    expect(() => decryptSecret(enc, {})).toThrow(MissingEncryptionKeyError);
  });

  it('rejects malformed keys', () => {
    expect(() => getEncryptionKey({ SF_ENCRYPTION_KEY: 'too-short' })).toThrow(InvalidEncryptionKeyError);
    expect(getEncryptionKey({})).toBeNull();
  });
});
