import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Phase 8 — runtime SQL com zero novas dependências (Node 22 `node:sqlite`).
 * Espelha `db/schema.sql` (Postgres é o alvo Phase-8-full; JSONB vira TEXT/JSON aqui).
 * Arquivo em SQLITE_PATH (default `./data/factory.db`, volume no compose).
 * Singleton lazy para não abrir o arquivo durante `next build` (só em request).
 */

let db: DatabaseSync | null = null;

const SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('Enterprise','Team','Developer')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  organization_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT '',
  blueprint TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  custom_config TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'configured',
  cost_per_1k TEXT NOT NULL DEFAULT 'n/a',
  latency TEXT NOT NULL DEFAULT 'n/a',
  api_key TEXT,
  base_url TEXT,
  is_active_default INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS catalog (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS decision_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT '',
  decision TEXT NOT NULL,
  date TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  warnings_ignored TEXT NOT NULL DEFAULT '[]',
  ai_recommendations TEXT NOT NULL DEFAULT '[]',
  user_justification TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT ''
);
`;

export function getDbPath(): string {
  return resolve(process.cwd(), process.env.SQLITE_PATH || './data/factory.db');
}

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = getDbPath();
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(SQLITE_DDL);
  return db;
}

/** Para testes/smoke: quantas linhas há nas tabelas principais. */
export function getTableCounts(): Record<string, number> {
  const database = getDb();
  const tables = ['organizations', 'workspaces', 'projects', 'ai_providers', 'catalog', 'decision_logs'];
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const row = database.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number };
    counts[t] = row.n;
  }
  return counts;
}
