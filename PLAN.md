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

- [x] Organization: Create + Edit + Delete UI. Added a small dedicated modal
      (`components/OrganizationWorkspaceModal.tsx`) opened via a new "Manage Organizations &
      Workspaces" gear icon next to Header's org/workspace pickers — chosen over overloading the
      `<select>` dropdown itself, since create/edit/delete needs form fields (name/code/plan) that
      don't fit in a dropdown, and a modal keeps it one click away without a new top-level nav
      item for what's fundamentally workspace-scoping metadata, not a content view.
- [x] Workspace: same pattern, scoped to the currently-selected Organization in the same modal
      (right-hand column, filtered by the organization selected in the left-hand column).
      Deletion policy: **cascade-delete** — deleting an Organization also deletes its Workspaces
      (with a confirmation that names the count), since a Workspace has no meaning without its
      parent Organization and nothing else in this app enforces referential integrity for us.
- [x] AI Agent: added `AIAgent { id, name, description, systemPromptStyle }` to `types/factory.ts`,
      `aiAgent.repository.ts` + `useAIAgents()` hook, and a "Custom AI Agents" tab in
      `AIPromptsView.tsx` (alongside the existing Prompt Library / AI Providers tabs) for
      create/edit/delete. `AIAssistantDrawer`'s role picker now appends custom agents after the 6
      hardcoded roles; selecting one passes its `systemPromptStyle` through to
      `AIService.requestAnalysis` as the `systemInstruction` param.
- [x] Plugins: added `Plugin { id, name, description, category, isActive }` to `types/factory.ts`,
      `plugin.repository.ts` + `usePlugins()` hook, and a new `PluginsView.tsx` list view with
      create/edit/delete/toggle-active. Wired in as a new `'plugins'` Sidebar entry (between "AI &
      Prompts" and "Decision Logs") and `renderActiveView()` case in `app/page.tsx`, following the
      exact existing pattern for other views.
- [x] Vitest coverage added: `organization.repository.test.ts`, `workspace.repository.test.ts`,
      `aiAgent.repository.test.ts`, `plugin.repository.test.ts` (round-trip, empty-start,
      delete-by-filter, and — for Plugin — active-toggle). 21/21 tests passing (13 new).
- [x] Verified: lint clean (zero warnings), build clean, test 21/21 passing, and a full Playwright
      pass starting from `localStorage.clear()` — created an Organization, created a Workspace
      under it, created a custom AI Agent and confirmed it appears in the AI Assistant drawer's
      role picker (selectable with no console errors), created a Plugin and toggled it
      active/inactive, then deleted the Plugin, the Agent, and the Organization (cascade-deleting
      its Workspace) and confirmed every empty state returned correctly. No console errors beyond
      an unrelated favicon 404.

### Phase 2b — Feature Manifest, Rule Set, Technology Stack, remaining Profiles

Heavier: two of these need new domain types first.

- [x] Feature Manifest: full create/edit builder — name, category, dependencies, optional/
      recommended dependencies, conflicting features, questions, generated files preview,
      security warnings, impact scores. Reused the existing detail-view fields in
      `FeatureManifestsView` as the shape of the edit form; no new fields invented on the
      `FeatureManifest` type. Dependency lists (dependencies/optionalDependencies/
      recommendedDependencies/conflictingFeatures) are toggled via checkbox pills against the
      existing feature catalog rather than free-text IDs. Questions and Generated Files are
      fully repeatable add/edit/remove rows. Switched the view from a direct
      `FeatureService.getAllFeatures()` call to the reactive `useFeatureManifests()` hook so
      create/edit/delete reflect immediately without a manual refresh.
- [x] Rule Set: added `RuleService.createRuleSet(name, description)` (new empty-of-rules
      `RuleSet`, persisted via the existing `saveRuleSets`) and `RuleService.deleteRuleSet`
      (refuses to delete the last remaining set). `RuleEngineView` now reads its active rule set
      from `blueprint.ruleSetId` (previously always `ruleSets[0]`, ignoring the field entirely)
      and exposes a "Rule Set" switcher dropdown + "New Rule Set" / delete buttons; switching
      calls `setSelectedBlueprint` to update `ruleSetId` on the live blueprint, same mutation
      pattern already used for `techStackId`/`architectureStyle` in `BlueprintsView` (persisted
      to a Template only on explicit "Save Blueprint").
- [x] Technology Stack: user-defined language/framework/package-manager/testing-framework/
      target-runtime. Added `techStackRepository.saveTechStacks` (was read-only) and full
      create/edit/delete UI in `TechStacksView`'s "Language Stacks" tab; `language` stays
      constrained to the existing `TechStack['language']` union via a `<select>`, no free-text
      language field.
- [x] Cache Profile, Logging Profile: added `saveCacheProfiles`/`saveLoggingProfiles` to
      `StorageService` and `IProfileRepository` (same precedent as Organization/Workspace
      `save*` additions in Phase 2a) plus new `useCacheProfiles()`/`useLoggingProfiles()` hooks.
      `TechStacksView` gained `'cache'` and `'logging'` tabs with full create/edit/delete and the
      established empty-state pattern.
- [x] Encryption Profile, Deployment Profile, Authentication Profile: added as brand-new types
      to `types/factory.ts` — `ProfileEncryption { id, name, algorithm, keyRotationDays,
      encryptAtRest, encryptInTransit }`, `ProfileDeployment { id, name, targetPlatform,
      replicas, autoScale, strategy }`, `ProfileAuthentication { id, name, provider,
      sessionTimeoutMinutes, enableMfa }` — each a handful of genuinely load-bearing fields
      modeled on `ProfileSecurity`/`ProfileDatabase`, not a kitchen sink. Added storage keys +
      get/save in `StorageService`, extended `IProfileRepository`/`LocalStorageProfileRepository`
      (kept all profile types in one grouped repository file, matching the existing
      Security/Database/Docker/Cache/Logging grouping, rather than one file per type — the
      shared "Technology & Profiles" information architecture already groups them on one view),
      new `use*Profiles()` hooks, and three new `TechStacksView` tabs with full
      create/edit/delete + empty states. Start genuinely empty (no invented catalog), same as
      AI Agents/Plugins in Phase 2a.
- [x] Vitest coverage added: `profile.repository.test.ts` (cache/logging round-trip + genuinely-
      empty-start and round-trip for all 3 new profile types + delete-by-filter),
      `techStack.repository.test.ts` (seeded catalog + custom stack round-trip/delete),
      `ruleService.test.ts` (createRuleSet including untitled-name fallback, deleteRuleSet
      including the "can't delete the last one" guard), and new `FeatureService.saveFeature`
      cases appended to `featureService.test.ts` (create, in-place update, delete-by-filter).
      40/40 tests passing (19 new).
- [x] Verified: lint clean (zero warnings), build clean, test 40/40 passing, and a full
      Playwright pass starting from `localStorage.clear()` — created a Feature Manifest with a
      question and a generated file row (visible, zero console errors), created a new Rule Set
      and confirmed the Blueprint immediately switched to it (header showed "0 / 0 Active Rules"
      confirming the live rule set actually changed, not just the dropdown label), created a
      custom Technology Stack, created a Cache/Logging/Encryption/Deployment/Authentication
      profile of each type, edited the seeded Cache profile's TTL and confirmed the update
      persisted, then deleted the Encryption profile, the custom Tech Stack, the custom Rule Set,
      and the Feature Manifest — every list returned to its correct empty/remaining state with
      zero console errors throughout (only clean states observed, no pre-existing favicon 404
      even resurfaced in this run).

Backlog, not this plan: a standalone global Package catalog (packages stay scoped per-module in
the Scaffolder, which already works well and wasn't something the user asked to change).

## Phase 3 — Bring-your-own AI provider key

- [x] Extend the AI Providers manager (`AIPromptsView`) so the user can paste an API key per
      provider (Gemini, OpenAI, Anthropic, DeepSeek, Azure OpenAI; Ollama = base URL, no key) and
      mark one active/default. Added `apiKey`/`baseUrl`/`isActiveDefault` to `AIProviderConfig`
      (`isActiveDefault` kept deliberately separate from the pre-existing `status` field, which
      describes connection health/toggle state, not "is this the chosen one"). "Set as Default"
      button exclusively flips `isActiveDefault` on one provider and off on the rest.
- [x] Store keys in `localStorage` only, with a visible on-screen note that this is a local,
      single-user setting and not a secure secret store. Shown both on the Providers tab header
      and inside the create/edit modal (not a tooltip).
- [x] Generalize `app/api/gemini/generate/route.ts` into `app/api/ai/generate/route.ts`, accepting
      `{provider, apiKey, baseUrl?, model, prompt, systemInstruction, role}` and routing per
      provider using plain `fetch` — no new npm dependency. Gemini keeps `@google/genai` (key now
      sourced from the request body, falling back to `process.env.GEMINI_API_KEY`, preserving the
      old simulated-response behavior when neither is set). OpenAI/DeepSeek/Azure OpenAI share the
      OpenAI-compatible chat-completions shape (`{baseUrl||default}/chat/completions`, `Authorization:
      Bearer`); Azure OpenAI has no default base URL and errors clearly if one isn't supplied.
      Anthropic uses the Messages API (`x-api-key`, `anthropic-version: 2023-06-01`). Ollama posts
      to `{baseUrl||http://localhost:11434}/api/generate` with no key. Pure request-building logic
      extracted to `services/aiProviderRouting.ts` so it's unit-testable without mocking `fetch`.
      Non-2xx/network failures return a real `{error: string}` — no silent fallback to a fake
      response for this route, matching the "real user-provided keys" intent of this phase.
- [x] "Test connection" action per provider — one real minimal call via
      `AIService.testConnection`, inline success ("Connected, responded in Xms") or the actual
      failure message shown next to that provider (no `alert()`).
- [x] `AIService`/`AIAssistantDrawer` call whichever provider is marked `isActiveDefault` instead
      of being hardcoded to Gemini; falls back to Gemini-with-no-key (today's simulated response)
      when nothing is configured yet, so the drawer never goes dead with zero setup.
- [x] Vitest coverage: `services/aiProviderRouting.test.ts` (17 tests) covering request shape/URL/
      headers per provider, default-base-URL fallback, custom baseUrl override, Azure's required-
      baseUrl error, missing-apiKey error, missing-model error, response-text extraction, and
      error-message extraction. 57/57 tests passing (17 new).
- [x] Verified: lint clean (zero warnings), build clean, `npm run test` 57/57, and a full
      Playwright pass from `localStorage.clear()` on a production build: (a) confirmed the
      password-type API key input, the Ollama base-URL swap, the Azure OpenAI required-baseUrl
      field, and the visible security note in both the list header and the modal; (b) set OpenAI
      as default via "Set as Default", reloaded, and confirmed the "DEFAULT" badge persisted;
      (c) configured Anthropic with an obviously fake key (`sk-test-invalid`) and clicked "Test
      Connection" — it fired a real request through `/api/ai/generate`, returned HTTP 502, and
      displayed the genuine underlying error inline ("Request to Anthropic failed: fetch failed") —
      in this sandboxed environment outbound HTTPS requires a corporate proxy
      (`HTTP_PROXY`/`HTTPS_PROXY` env vars) that Node's built-in `fetch` doesn't pick up
      automatically (confirmed `curl` to the same URL succeeds via the proxy), so the actual
      provider rejection couldn't be observed end-to-end here — what's verified is that the route
      genuinely attempts the request and surfaces the real failure instead of swallowing it into a
      canned response; (d) with `localStorage` cleared again (no provider marked default), opened
      the AI Assistant drawer, sent a message, and confirmed the exact pre-Phase-3 simulated-
      response + "Offline Mode" badge behavior, zero regression. No new console errors beyond the
      pre-existing favicon 404 (plus the deliberately-triggered 502 from the Test Connection check
      above). Commits: `844c58a` (types/route/routing module), `8adb4e9` (AIPromptsView UI),
      `8111b31` (AIService/drawer wiring).

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

- 2026-08-14 — **Phase 3 complete**: bring-your-own AI provider key. `AIProviderConfig` gained
  `apiKey`/`baseUrl`/`isActiveDefault`; new `services/aiProviderRouting.ts` builds the request
  shape/URL/headers per provider (pure functions, 17 new Vitest tests); `app/api/gemini/generate`
  replaced by `app/api/ai/generate`, routing Gemini through `@google/genai` (env-var fallback kept)
  and OpenAI/DeepSeek/Azure OpenAI/Anthropic/Ollama through plain `fetch` — no new dependency.
  `AIPromptsView`'s provider form gained a password-type API key field (or base URL for Ollama), a
  visible on-screen security note, a "Set as Default" action, and a "Test Connection" button with
  inline success/failure. `AIService.requestAnalysis` now routes through the default provider,
  falling back to Gemini-with-no-key (today's simulated response) when none is set; a new
  `AIService.testConnection` never swallows errors, used solely by the Test Connection button.
  Vitest 57/57 passing (17 new), lint clean, build clean. Full Playwright pass from
  `localStorage.clear()` on a production build confirmed the new form fields, default-marking
  persistence across reload, a real (non-swallowed) failure from Test Connection against a fake
  Anthropic key, and zero-regression simulated-response behavior in the AI Assistant drawer with
  no provider configured. Commits: `844c58a`, `8adb4e9`, `8111b31`. Next: Phase 4 (visual design
  cleanup).
- 2026-08-13 — **Phase 2a complete**: Organization/Workspace CRUD via a new "Manage Organizations
  & Workspaces" modal off the Header (cascade-deletes Workspaces when their Organization is
  deleted); custom AI Agent persona (`AIAgent` type + repository + `useAIAgents()` + a "Custom AI
  Agents" tab in `AIPromptsView`, appended to `AIAssistantDrawer`'s role picker); Plugins entity
  (`Plugin` type + repository + `usePlugins()` + new `PluginsView` + Sidebar entry). Repository/
  storage foundation (`dc9859a`), Organization & Workspace UI (`7706e87`), Custom AI Agent UI
  (`27a3522`), Plugins UI (`390ebde`). Vitest 21/21 passing (13 new repository tests), lint clean,
  build clean. Full Playwright pass from `localStorage.clear()`: created Org → Workspace → custom
  AI Agent (confirmed in role picker, selectable, zero console errors) → Plugin (toggled
  active/inactive) → deleted all three (Org delete cascade-removed its Workspace) → every empty
  state returned correctly. Next: Phase 2b (Feature Manifest, Rule Set, Technology Stack, remaining
  Profiles).
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
