# Software Factory

![CI](https://github.com/HackMaster300/software-factory/actions/workflows/ci.yml/badge.svg)

Uma plataforma para arquitetos de software padronizarem **como** os projetos são criados — em vez de configurar arquitetura, pacotes e estrutura manualmente a cada novo projeto, você define essas decisões uma vez (como um **Template**/**Blueprint** reutilizável) e gera projetos completos e consistentes a partir daí, em 8 linguagens diferentes.

A IA tem um papel deliberadamente limitado aqui: **valida, explica, recomenda e documenta decisões de arquitetura — nunca as toma.** Quem decide é sempre a pessoa a usar a ferramenta.

## Conceitos principais

| Conceito | O que é |
|---|---|
| **Organization / Workspace** | Agrupamento de equipas e projetos |
| **Template** | Um conjunto reutilizável de decisões arquiteturais — linguagem, arquitetura, stack, perfis de segurança/BD/cache/logging/deployment |
| **Blueprint** | Um Template em aplicação concreta: módulos, pacotes e ficheiros que serão gerados |
| **Project** | O resultado final, gerado a partir de um Blueprint |
| **Feature Manifest** | Definição de uma funcionalidade reutilizável — dependências, conflitos, ficheiros/pacotes que gera, impacto em segurança/performance/manutenibilidade |
| **Rule Set** | Regras de arquitetura que o motor de validação aplica continuamente (ex: violação de camadas, dependência em falta) |
| **Tech Stack** | Combinação de framework/linguagem/ferramentas (ex: "Next.js 15 App Router Full-Stack") |
| **AI Provider / AI Agent** | Configuração de acesso a um LLM e uma "persona" para o usar |
| **Decision Log** | Registo de decisões arquiteturais tomadas ao longo do projeto, com justificação |

### Smart Dependencies e Live Validation

Ativar uma feature pode recomendar automaticamente outras (ex: Docker → variáveis de ambiente → health checks → Docker Compose → secrets). O utilizador pode sempre desativar qualquer uma — a plataforma nunca bloqueia, só avisa: desativar algo recomendado dispara imediatamente um aviso do motor de validação a explicar a consequência.

## Funcionalidades

- **Project Scaffolder** — assistente em vários passos (incluindo um passo de conversa com IA) para configurar e gerar um projeto novo
- **Blueprints** — criar/editar blueprints reutilizáveis
- **Feature Manifests** — biblioteca de funcionalidades com as suas dependências e impacto
- **Rule Engine** — regras de arquitetura, por conjunto, com duplicação de regras/conjuntos inteiros
- **Tech Stacks** — definição de stacks técnicas, com perfis de Cache/Logging/Encryption/Deployment/Authentication
- **AI Prompts** — templates de prompt reutilizáveis
- **Decision Logs** — histórico de decisões, reativo a alterações em qualquer parte da aplicação
- **What-If Impact Analyzer** — simula o impacto de uma mudança antes de a aplicar
- **Plugins** — extensões ativáveis/desativáveis
- **Command Palette** — navegação rápida por teclado
- **AI Assistant Drawer** — painel de IA contextual, disponível em qualquer ecrã

## Linguagens e exportação

Scaffolding com estrutura e ficheiros válidos (verificados automaticamente — ver secção de Testes) para:

**C# · TypeScript · Java · Go · Python · Rust · Kotlin · Dart**

O caminho do C# usa um template real do `dotnet new` (`dotnet-template/`, com `.template.config`), não apenas ficheiros estáticos. Os projetos gerados podem ser exportados como **ZIP** ou gravados **diretamente em disco** (File System Access API do navegador) com abertura automática no VS Code.

## IA — múltiplos fornecedores, chave própria

Suporta **Google Gemini, OpenAI, Anthropic, DeepSeek, Azure OpenAI, Ollama e OpenRouter** (incluindo qualquer endpoint compatível com a API da OpenAI). Cada utilizador configura a sua própria chave de API — não há uma chave partilhada forçada pela plataforma.

## Arquitetura técnica

- **Next.js 15** (App Router) + **React 19** + **TypeScript**, Tailwind v4
- **Padrão repository**: todos os serviços (`services/*.ts`) acedem aos dados através de interfaces (`services/repositories/`), nunca diretamente ao armazenamento.
- **Persistência real (SQLite por omissão, MSSQL opcional via Docker Compose)**: SQLite nativo (`node:sqlite`, sem dependências novas), com **SQL Server 2022** disponível via `docker compose up` para simulação com SSMS.
- **Estado reativo**: hooks (`useStorage`, `useDecisionLogs`, etc.) construídos sobre `useSyncExternalStore`, para que qualquer escrita em qualquer parte da aplicação atualize todos os ecrãs que dependem desse dado, sem efeitos colaterais em render.

### Organizations/Workspaces: localStorage ou API real, por flag

Por omissão, os 13 agregados (Organizations, Workspaces, TechStacks, RuleSets, ...) persistem em `localStorage` no browser — é o que torna a aplicação utilizável offline, sem backend nenhum.

**Organizations e Workspaces** já têm o caminho completo para persistência real a funcionar de ponta a ponta: rotas REST (`GET`/`POST`/`PATCH`/`DELETE` em `/api/v1/organizations` e `/api/v1/workspaces`, com SQLite por trás e `ON DELETE CASCADE` a sério — via `PRAGMA foreign_keys = ON`) e uma ponte (`services/apiDataBridge.ts`) que liga essas rotas aos mesmos hooks `useOrganizations()`/`useWorkspaces()` que os componentes já usavam — **nenhum componente precisou de ser alterado**.

Ativa-se com uma variável de ambiente:

```bash
NEXT_PUBLIC_DATA_SOURCE=api   # omisso (ou qualquer outro valor) = localStorage, como antes
```

Como funciona por dentro: os hooks usam `useSyncExternalStore`, que exige um snapshot síncrono — por isso a ponte mantém uma cache em memória, populada de forma assíncrona a partir da API, notificando os subscritores (re-render) quando os dados chegam ou mudam. Escritas (`saveOrganizations(listaCompleta)`) são comparadas contra a cache anterior para decidir, item a item, se é um `POST` (novo), `PATCH` (alterado) ou `DELETE` (removido) — e a cache é atualizada de forma otimista antes da API responder, para a UI continuar instantânea.

**Os outros 11 agregados continuam só em localStorage** — estender este padrão a eles é trabalho futuro (replicar: rota REST com GET/POST/PATCH/DELETE + classe de repositório API + branch na ponte), não uma mudança de arquitetura, já que o padrão está estabelecido e testado nestes dois.

## Testes

```bash
npm run test
```

238+ testes (Vitest) — cobrem a lógica de serviços (regras, dependências, scaffolding por linguagem, repositórios), os endpoints de API (incluindo CRUD completo + cascade de Organizations/Workspaces, com SQLite isolado por teste) e a ponte localStorage↔API (fetch mockado).

## CI

Cada push/PR corre lint + build (inclui type-check do TypeScript) + testes no GitHub Actions, com o SDK do .NET instalado (para os testes golden-path de scaffolding C#). Ver `.github/workflows/ci.yml`.

## Como correr localmente

**Pré-requisitos:** Node.js

```bash
npm install
cp .env.example .env.local   # preencha GEMINI_API_KEY (ou outro provider) se for usar IA
npm run dev
```

### Com persistência real (SQL Server, via Docker)

```bash
docker compose up
```

Sobe a aplicação + um SQL Server 2022 com o schema (`db/schema-mssql.sql`) já aplicado — útil para inspecionar os dados com o SSMS (`localhost,1434` — a porta publicada pelo compose).

## Segurança

Revisões de código já encontraram e corrigiram, entre outros:
- **Zip Slip (CWE-22)** na exportação de projetos em ZIP — nomes de ficheiro/pasta vindos de input do utilizador agora são sanitizados antes de entrar no arquivo
- **SSRF** nas chamadas à API de IA — o `baseUrl` fornecido pelo utilizador é validado no servidor antes de qualquer pedido
- Fugas de mensagens de erro de fornecedores de IA para o cliente, e um id de modelo Gemini inválido
- 2 CVEs críticas de RCE não-autenticado no Next.js (resolvidas com upgrade de patch, sem breaking changes)
- `PRAGMA foreign_keys` nunca estava ativo no SQLite — o `ON DELETE CASCADE` do schema existia só no papel

## Estado do projeto

Em desenvolvimento ativo, por ciclos de revisão/melhoria — ver `PLAN.md` (plano de realinhamento em curso, por fases) e `GOING_HOME_REPORT.md` (histórico detalhado de cada sessão de trabalho) para o estado mais aprofundado.

## Configuração de segurança (opcional)

Set `API_TOKEN` on the server to require `Authorization: Bearer <token>` on every `/api/*` route
(enforced in `middleware.ts`; `GET /api/v1/health` stays public). The UI sends the token from
`localStorage["sf.apiToken"]` or, if set at build time, `NEXT_PUBLIC_API_TOKEN` — note the latter
is visible to anyone who can load the UI. Unset `API_TOKEN` = open API (solo/local use).

`/api/ai/generate` refuses custom `baseUrl`s that resolve to private, loopback, link-local or
cloud-metadata addresses. To use a local/LAN endpoint (e.g. Ollama), opt in explicitly:
`AI_PRIVATE_HOST_ALLOWLIST=localhost,127.0.0.1`. Verbose AI request logging is off by default;
enable with `AI_DEBUG_LOGS=1` (server) / `NEXT_PUBLIC_AI_DEBUG_LOGS=1` (browser).

## Licença

MIT

---

Developed by zharak
