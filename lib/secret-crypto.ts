import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * At-rest encryption for secrets stored in SQLite (`ai_providers.api_key`).
 *
 * - AES-256-GCM, random 96-bit IV per value, 128-bit auth tag.
 * - Stored format: `enc:v1:<iv b64>:<tag b64>:<ciphertext b64>`.
 * - Key from `SF_ENCRYPTION_KEY`: 32 bytes as 64 hex chars or base64.
 *   Generate one with:
 *     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 * - Backward compatible: values without the `enc:v1:` prefix are legacy
 *   plaintext. They are returned as-is by `decryptSecret` and re-encrypted by
 *   `migratePlaintextSecrets` / on the next write once a key is configured.
 * - Without a key: in production (`NODE_ENV=production`) writing a secret
 *   throws `MissingEncryptionKeyError`; in development/test the value is stored
 *   in plaintext with a one-time warning so local setups keep working.
 */

export const ENCRYPTED_PREFIX = 'enc:v1:';

type Env = Record<string, string | undefined>;

export class MissingEncryptionKeyError extends Error {
  constructor(message = 'SF_ENCRYPTION_KEY is not set. It is required in production to encrypt AI provider API keys at rest. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"') {
    super(message);
    this.name = 'MissingEncryptionKeyError';
  }
}

export class InvalidEncryptionKeyError extends Error {
  constructor() {
    super('SF_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters or base64.');
    this.name = 'InvalidEncryptionKeyError';
  }
}

/** Parses SF_ENCRYPTION_KEY into a 32-byte key, or null when unset. Throws if set but malformed. */
export function getEncryptionKey(env: Env = process.env): Buffer | null {
  const raw = env.SF_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) key = Buffer.from(raw, 'hex');
  else key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new InvalidEncryptionKeyError();
  return key;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_PREFIX);
}

let warnedPlaintext = false;

/**
 * Encrypts a secret for storage. null/undefined/'' pass through unchanged.
 * Already-encrypted values are returned as-is (idempotent).
 */
export function encryptSecret(plain: string | null | undefined, env: Env = process.env): string | null {
  if (plain === null || plain === undefined || plain === '') return plain ?? null;
  if (isEncrypted(plain)) return plain;
  const key = getEncryptionKey(env);
  if (!key) {
    if (env.NODE_ENV === 'production') throw new MissingEncryptionKeyError();
    if (!warnedPlaintext) {
      warnedPlaintext = true;
      console.warn('[secret-crypto] SF_ENCRYPTION_KEY is not set: storing AI provider API keys in PLAINTEXT (development only).');
    }
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Decrypts a stored secret. Legacy plaintext values are returned unchanged. */
export function decryptSecret(stored: string | null | undefined, env: Env = process.env): string | null {
  if (stored === null || stored === undefined) return null;
  if (!isEncrypted(stored)) return stored;
  const key = getEncryptionKey(env);
  if (!key) throw new MissingEncryptionKeyError('SF_ENCRYPTION_KEY is not set, but the database contains encrypted API keys.');
  const [ivB64, tagB64, ctB64] = stored.slice(ENCRYPTED_PREFIX.length).split(':');
  if (!ivB64 || !tagB64 || ctB64 === undefined) throw new Error('Malformed encrypted secret.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}

type MinimalDb = {
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): unknown;
  };
};

/**
 * Re-encrypts legacy plaintext `ai_providers.api_key` rows in place. No-op
 * (returns 0) when no key is configured. Returns the number of rows migrated.
 */
export function migratePlaintextSecrets(db: MinimalDb, env: Env = process.env): number {
  if (!getEncryptionKey(env)) return 0;
  const rows = db
    .prepare(`SELECT id, api_key FROM ai_providers WHERE api_key IS NOT NULL AND api_key <> '' AND api_key NOT LIKE '${ENCRYPTED_PREFIX}%'`)
    .all() as Array<{ id: string; api_key: string }>;
  const update = db.prepare('UPDATE ai_providers SET api_key = ? WHERE id = ?');
  for (const r of rows) update.run(encryptSecret(r.api_key, env), r.id);
  return rows.length;
}
