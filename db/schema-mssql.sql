-- Software Factory — SQL Server 2022 DDL (para SSMS).
-- Aplicado pelo compose via /docker-entrypoint-initdb.d (mssql).
-- Espelha db/schema.sql (Postgres) e lib/sql.ts (SQLite): mesmos nomes de
-- tabelas/colunas; JSONB vira NVARCHAR(MAX) com JSON; BOOLEAN vira BIT.

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'factory')
BEGIN
  CREATE DATABASE factory;
END
GO
USE factory;
GO

IF OBJECT_ID('organizations', 'U') IS NULL
BEGIN
  CREATE TABLE organizations (
    id         NVARCHAR(64)  NOT NULL PRIMARY KEY,
    name       NVARCHAR(200) NOT NULL,
    code       NVARCHAR(64)  NOT NULL,
    plan       NVARCHAR(20)  NOT NULL CHECK (plan IN ('Enterprise','Team','Developer')),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END
GO

IF OBJECT_ID('workspaces', 'U') IS NULL
BEGIN
  CREATE TABLE workspaces (
    id              NVARCHAR(64)  NOT NULL PRIMARY KEY,
    organization_id NVARCHAR(64)  NOT NULL,
    name            NVARCHAR(200) NOT NULL,
    description     NVARCHAR(1000) NOT NULL DEFAULT '',
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_workspaces_organizations FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
END
GO

IF OBJECT_ID('projects', 'U') IS NULL
BEGIN
  CREATE TABLE projects (
    id              NVARCHAR(64)  NOT NULL PRIMARY KEY,
    name            NVARCHAR(200) NOT NULL,
    slug            NVARCHAR(200) NOT NULL,
    description     NVARCHAR(1000) NOT NULL DEFAULT '',
    organization_id NVARCHAR(64)  NOT NULL,
    workspace_id    NVARCHAR(64)  NOT NULL,
    template_id     NVARCHAR(64)  NOT NULL DEFAULT '',
    blueprint       NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    status          NVARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','configuring','generated','deployed')),
    created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    custom_config   NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    CONSTRAINT FK_projects_organizations FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT FK_projects_workspaces FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
  );
END
GO

IF OBJECT_ID('ai_providers', 'U') IS NULL
BEGIN
  CREATE TABLE ai_providers (
    id                NVARCHAR(64)  NOT NULL PRIMARY KEY,
    name              NVARCHAR(200) NOT NULL,
    model             NVARCHAR(200) NOT NULL,
    provider          NVARCHAR(64)  NOT NULL,
    status            NVARCHAR(20)  NOT NULL DEFAULT 'configured',
    cost_per_1k       NVARCHAR(20)  NOT NULL DEFAULT 'n/a',
    latency           NVARCHAR(20)  NOT NULL DEFAULT 'n/a',
    api_key           NVARCHAR(500) NULL,
    base_url          NVARCHAR(500) NULL,
    is_active_default BIT NOT NULL DEFAULT 0
  );
END
GO

IF OBJECT_ID('catalog', 'U') IS NULL
BEGIN
  CREATE TABLE catalog (
    [key]      NVARCHAR(200)  NOT NULL PRIMARY KEY,
    [value]    NVARCHAR(MAX)  NOT NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END
GO

IF OBJECT_ID('decision_logs', 'U') IS NULL
BEGIN
  CREATE TABLE decision_logs (
    id                 NVARCHAR(64)   NOT NULL PRIMARY KEY,
    project_id         NVARCHAR(64)   NOT NULL DEFAULT '',
    decision           NVARCHAR(1000) NOT NULL,
    [date]             NVARCHAR(30)   NOT NULL,
    reason             NVARCHAR(1000) NOT NULL DEFAULT '',
    impact             NVARCHAR(1000) NOT NULL DEFAULT '',
    warnings_ignored   NVARCHAR(MAX)  NOT NULL DEFAULT '[]',
    ai_recommendations NVARCHAR(MAX)  NOT NULL DEFAULT '[]',
    user_justification NVARCHAR(1000) NOT NULL DEFAULT '',
    author             NVARCHAR(200)  NOT NULL DEFAULT ''
  );
END
GO
