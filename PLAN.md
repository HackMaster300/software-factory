# Realignment Plan — Software Factory

Source of truth for the `going-home-front` autonomous loop. Read this file at the start of
every cycle; work through phases in order (0 → 6) unless a later phase has something trivial
and independent worth doing early. Check off items as they land, with the commit hash.

## Why this plan exists

Comparing `pipelines/context.md` (the original vision) and `pipelines/context google.md` (the
actual build log) against the current codebase surfaced real gaps:
- The most-emphasized architectural decision from the original brief (swappable repository
  interfaces so LocalStorage can later be replaced by a real API without touching the UI) was
  never implemented — services call `StorageService` (raw localStorage) directly.
- Most entities the user asked to be able to **create** (Workspace, Language, Architecture,
  Technology Stack, Packages, Plugins, Encryption/Deployment/Authentication Profiles, AI Agents)
  are actually fixed, pre-seeded catalogs with no "create new" UI. Some (Plugins, Knowledge Pack,
  Encryption Profile, Deployment Profile) don't exist in the data model at all. Cache and Logging
  Profiles exist in the data model but have zero UI.
- Seed data includes fictional organizations/workspaces/projects/decision logs presented as if
  they were real usage history ("Acme Enterprise Solutions", "Lead Architect Alex Rivers", etc.)
  — this violates "no invented data" and should be replaced with a genuinely empty starting state.
- The app only talks to Gemini via a server-side env var; there is no way for the user to bring
  their own API key for any provider from the UI.
- Visual density is high (many nested bordered boxes/badges competing for attention) and
  responsiveness below desktop width has not been verified.

## Execution mode

Runs under `/going-home-front` (already active on this repo). Auto-approved: local edits, tests,
builds, commits. Still requires explicit user approval: `git push`, and any new npm dependency —
**with one exception already granted**: adding `vitest` as a devDependency is pre-approved (the
user said to auto-approve this initiative, and Phase 0 is a refactor broad enough that test
coverage while doing it is a safety requirement, not a nice-to-have). No other new dependency
should be needed — Phase 3's multi-provider AI calls are implemented with plain `fetch` against
each provider's REST API, not new SDKs.

---

## Phase 0 — Repository pattern (architecture foundation)

- [x] Add `services/repositories/` with one interface per aggregate: `IProjectRepository`,
      `ITemplateRepository`, `IFeatureManifestRepository`, `IRuleSetRepository`,
      `ITechStackRepository`, `IProfileRepository` (security/db/docker/cache/logging — encryption/
      deployment/auth deliberately excluded, those types don't exist yet, that's Phase 2),
      `IAIProviderRepository`, `IPromptTemplateRepository`, `IDecisionLogRepository`,
      `IOrganizationRepository`, `IWorkspaceRepository`. (`1560001`)
- [x] One `LocalStorage*Repository` implementation per interface, built on top of the existing
      `StorageService` primitives. (`1560001`)
- [x] Refactor each `XService` that had a `StorageService` dependency (FeatureService,
      ProjectService, RuleService, AdvisorService, ValidationService, DecisionService,
      TemplateService) to use its repository singleton instead. `ImpactService` needed no change —
      it never depended on `StorageService` to begin with (pure canned-copy generator). Verified via
      diff review: every change is a pure dependency swap, no business logic altered. (`1560001`)
- [x] Add unit tests (Vitest) per repository and per service as they're touched, so this refactor
      can't silently change behavior. Installed `vitest`/`@vitejs/plugin-react`/`jsdom`, added
      `npm run test`, wrote regression tests for the repository round-trip, Smart Dependencies
      resolution, and the Zip Slip sanitizer. 8/8 passing. (`8322ce3`)

**Phase 0 complete.** `npm run test` now exists and should be run (alongside lint/build) as part
of verifying every subsequent phase.
- [ ] Verify: lint, build, full manual click-through of every view, Playwright smoke pass.

## Phase 1 — Remove invented data, start genuinely empty

- [x] Strip fictional Organizations/Workspaces/Projects/Decision Logs from `mockSeedData.ts`.
      (`initialOrganizations`, `initialWorkspaces`, `initialProjects`, `initialDecisionLogs` are
      now `[]`.)
- [x] Keep legitimate reference/catalog data (Tech Stack definitions, Feature Manifest library,
      Rule presets, supported AI provider list) — that's platform knowledge, not fabricated user
      history. Left `initialTechStacks`, `initialFeatureManifests`, `initialRuleSets`,
      `initialTemplates`, `initialBlueprints`, `initialAIProviders`, `initialPromptTemplates`, and
      the profile catalogs untouched, per explicit scope. (Note: `initialAIProviders`'
      `costPer1k`/`latency` fields are still illustrative placeholder numbers, not measured
      benchmarks — flagged here for a future pass; out of scope to alter in this phase per the
      explicit "keep exactly as-is" instruction.)
- [x] Add a first-run empty state / onboarding prompt wherever the org/workspace/project/decision
      lists are now empty by default: Header's org/workspace dropdowns now show "No organization
      yet" / "No workspace yet" instead of an empty `<select>`; DashboardView's decision-log panel
      and hero subtitle no longer assume seeded data (`{organizations[0]?.name || 'No organization
      yet'}`); DecisionLogsView now distinguishes a true first-run empty state ("Log your first
      decision") from a search-with-no-matches state.
- [x] Confirm every list view has the empty-state pattern already established this session — audited
      Header, DashboardView, DecisionLogsView, and ProjectScaffolderView (the latter had no list to
      empty, only a wizard default that referenced hardcoded `'org-1'`/`'ws-1'` — switched to
      `StorageService.getOrganizations()[0]?.id || ''` so it degrades honestly instead of pointing
      at a non-existent org).

## Phase 2 — Close CRUD gaps (the original "create everything" list)

Split into two sub-phases so each lands as its own reviewable, independently-committed chunk
rather than one giant change touching every view and `types/factory.ts` at once. Do 2a before 2b.

### Phase 2a — Organization, Workspace, AI Agent, Plugins

No new types needed for Organization/Workspace (already in `types/factory.ts`, just missing
create/edit/delete UI). AI Agent and Plugins are net-new, but intentionally simple (no execution
engine, consistent with how the rest of the app already "simulates" rather than actually runs
things).

- [ ] Organization: Create + Edit + Delete UI (a place to do this doesn't exist yet — Header's
      org dropdown only *selects*; add it there or in a small dedicated Settings/Org area,
      whichever fits existing navigation conventions better).
- [ ] Workspace: same, scoped to the selected Organization.
- [ ] AI Agent: let the user define a custom persona (name, role description, system-prompt
      style) beyond the 6 hardcoded roles in `AIAssistantDrawer`; new agents should appear
      alongside the hardcoded ones in the role picker.
- [ ] Plugins: minimal viable entity — name, description, category, active toggle. Add the type
      to `types/factory.ts`, a repository (following the Phase 0 pattern — interface +
      `LocalStorage*Repository` + singleton, not raw `StorageService` calls), and a simple
      list+create+edit+delete view (new sidebar entry, or a tab on an existing view — use
      judgment based on where it fits).
- [ ] Vitest coverage for whatever new service/repository logic this adds (validation rules,
      default-value handling, etc. — not UI rendering, that's what Playwright is for).
- [ ] Verify: lint, build, test, and a Playwright pass with `localStorage.clear()` first (the
      empty-state work in Phase 1 only shows correctly from a truly empty state — clear storage
      before checking, like Phase 1's own verification had to).

### Phase 2b — Feature Manifest, Rule Set, Technology Stack, remaining Profiles

Heavier: two of these need new domain types first.

- [ ] Feature Manifest: full create/edit builder — name, category, dependencies, optional/
      recommended dependencies, conflicting features, questions, generated files preview,
      security warnings, impact scores. Reuse the existing detail-view fields in
      `FeatureManifestsView` as the shape of the edit form; don't invent new fields.
- [ ] Rule Set: today only individual rules within one fixed, pre-seeded rule set are editable.
      Add the ability to create a whole new Rule Set (name, description) and switch a Blueprint's
      active rule set between them.
- [ ] Technology Stack: user-defined language/framework/package-manager/testing-framework/
      target-runtime — currently `TechStacksView` is read-only display of the seeded catalog only.
- [ ] Cache Profile, Logging Profile: these exist in `types/factory.ts` and `StorageService`
      already but have **zero UI** — `TechStacksView`'s tabs only cover stacks/db/security/docker.
      Add the missing tabs, plus create/edit/delete.
- [ ] Encryption Profile, Deployment Profile, Authentication Profile: **don't exist in
      `types/factory.ts` at all yet.** Add minimal but real types (look at the shape of
      `ProfileSecurity`/`ProfileDatabase` for the pattern — id/name plus a handful of
      domain-relevant fields, not a kitchen sink), a repository each (Phase 0 pattern), storage
      keys in `StorageService`, and list+create+edit+delete UI (extend `TechStacksView`'s tabs
      again, keeping one consistent "Technology & Profiles" surface rather than scattering these
      across unrelated views).
- [ ] Vitest coverage for new services/repositories/validation logic.
- [ ] Verify: lint, build, test, Playwright pass (cleared `localStorage`) confirming every new
      entity type can actually be created, edited, and deleted from the UI — not just that the
      code compiles.

Backlog, not this plan: a standalone global Package catalog (packages stay scoped per-module in
the Scaffolder, which already works well and wasn't something the user asked to change).

## Phase 3 — Bring-your-own AI provider key

- [ ] Extend the AI Providers manager (`AIPromptsView`) so the user can paste an API key per
      provider (Gemini, OpenAI, Anthropic, DeepSeek, Azure OpenAI; Ollama = base URL, no key) and
      mark one active/default.
- [ ] Store keys in `localStorage` only, with a visible on-screen note that this is a local,
      single-user setting and not a secure secret store.
- [ ] Generalize `app/api/gemini/generate/route.ts` into `app/api/ai/generate/route.ts`, accepting
      `{provider, apiKey, baseUrl?, model, prompt, systemInstruction}` and routing per provider
      using plain `fetch` (OpenAI-compatible chat-completions shape covers OpenAI/DeepSeek/Azure
      OpenAI/Ollama; Anthropic's REST shape is a small variant) — no new npm dependency.
- [ ] "Test connection" action per provider — one real minimal call, inline success/failure.
- [ ] `AIService`/`AIAssistantDrawer` call whichever provider is active instead of being hardcoded
      to Gemini.

## Phase 4 — Visual design cleanup

- [ ] Reduce badge/border/box density; establish a clearer spacing/type scale (use the
      `frontend-design` skill for this pass).
- [ ] Extract shared primitives (Button, Badge, Card, Input) to replace repeated one-off Tailwind
      class strings — fixes visual inconsistency and code duplication together.
- [ ] Limit simultaneous accent colors per screen; reserve color for status/severity meaning, not
      decoration.

## Phase 5 — Structure & responsiveness

- [ ] Audit every view at mobile/tablet/desktop breakpoints; collapse Sidebar to a drawer, stack
      multi-column grids to one column, make the Advisor panel a bottom sheet or hidden-by-default
      below desktop width.
- [ ] Confirm Command Palette / AI Drawer / modals have no horizontal overflow and tap targets
      ≥44px on small viewports.
- [ ] Playwright verification at 3 breakpoints, not just desktop.

## Phase 6 — Verification & regression safety

- [ ] Vitest coverage for every repository/service touched in Phase 0, plus the provider-routing
      logic from Phase 3.
- [ ] Full lint + build + Playwright pass at the end of *each* phase, not only at the end of the
      whole plan — commit each phase independently so work stays reversible and reviewable.

---

## Progress log

(Newest entry on top. One line per phase milestone, with commit hash.)

- 2026-08-13 — **Phase 1 complete**: `initialOrganizations`/`initialWorkspaces`/`initialProjects`/
  `initialDecisionLogs` emptied to `[]` in `mockSeedData.ts`; catalog data (tech stacks, feature
  manifests, rule presets, AI providers, templates, blueprints) left untouched. Added first-run
  empty states to Header (org/workspace pickers), DashboardView (hero subtitle + decision log
  panel), and DecisionLogsView (true empty state vs. no-search-matches state). Fixed
  ProjectScaffolderView's hardcoded `'org-1'`/`'ws-1'` wizard defaults to degrade honestly.
  Updated `project.repository.test.ts`'s stale fallback-to-seed-data assertion. Lint, build, and
  Vitest (8/8) all green. (`0475221`) Next: Phase 2 (close CRUD gaps).
- 2026-08-13 — **Phase 0 complete**: repository pattern in place across 7 services + 11 new
  repositories (`1560001`), Vitest installed with regression tests for the repository swap, Smart
  Dependencies, and the Zip Slip fix (`8322ce3`). Lint/build/test all green. Next: Phase 1 (remove
  invented seed data).
