-- Software Factory — Postgres DDL (alvo Phase-8-full).
-- Aplicado automaticamente pelo compose via /docker-entrypoint-initdb.d.
-- O runtime atual (lib/sql.ts, SQLite sem novas deps) espelha estas tabelas;
-- tipos JSONB viram TEXT/JSON na camada SQLite. Mesmos nomes, mesmas colunas.

CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  plan        TEXT NOT NULL CHECK (plan IN ('Enterprise','Team','Developer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id     TEXT NOT NULL DEFAULT '',
  blueprint       JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','configuring','generated','deployed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  custom_config   JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ai_providers (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  model             TEXT NOT NULL,
  provider          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'configured',
  cost_per_1k       TEXT NOT NULL DEFAULT 'n/a',
  latency           TEXT NOT NULL DEFAULT 'n/a',
  -- Segredo server-side: NUNCA retornado pela API (só hasKey + testConnection).
  api_key           TEXT,
  base_url          TEXT,
  is_active_default BOOLEAN NOT NULL DEFAULT FALSE
);

-- Catálogo versionável (tech stacks, features, rules, templates, profiles, prompts).
-- Só conhecimento de plataforma; histórico de usuário nunca é seed (Phase 1).
CREATE TABLE IF NOT EXISTS catalog (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_logs (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL DEFAULT '',
  decision           TEXT NOT NULL,
  date               TEXT NOT NULL,
  reason             TEXT NOT NULL DEFAULT '',
  impact             TEXT NOT NULL DEFAULT '',
  warnings_ignored   JSONB NOT NULL DEFAULT '[]',
  ai_recommendations JSONB NOT NULL DEFAULT '[]',
  user_justification TEXT NOT NULL DEFAULT '',
  author             TEXT NOT NULL DEFAULT ''
);
