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

- [x] **Complete.** Every view listed in this phase, including all four stretch-goal components,
      has been converted to the shared UI primitives and independently lint/build/test/Playwright
      verified. Two prior agent attempts hit an account-level API session limit mid-work (not a
      code problem); a third session converted eight views (`BlueprintsView` + `ImpactAnalyzerView`
      `e6428a7`, `RuleEngineView` `e8c7c37`, `TechStacksView` `8750e78`, `PluginsView` +
      `DecisionLogsView` `f67076d`) on top of the primitives/Header/Sidebar/DashboardView
      (`2de830b`) and `FeatureManifestsView` (`402ecd4`) from earlier sessions. This (fourth)
      session finished the two remaining required views and all four stretch goals, one commit per
      file: `ProjectScaffolderView.tsx` (2072 lines, `7afc023`), `AIPromptsView.tsx` (1382 lines,
      `98b0292`), `CommandPalette.tsx` (`b138756`), `ProjectAdvisorPanel.tsx` (`535f8f2`),
      `AIAssistantDrawer.tsx` (`f2ea1e2`), `OrganizationWorkspaceModal.tsx` (`5fd89aa`).

- [x] Shared primitives created: `components/ui/Button.tsx`, `Badge.tsx`, `Card.tsx`, `Input.tsx`
      (plain React + `clsx`/`tailwind-merge`, no new dependency). (`2de830b`)
- [x] Applied to every view and the four stretch-goal components listed above. No file in
      `components/views/` or the standalone modals/panels/drawers still uses raw ad-hoc Tailwind
      box/pill/button strings for its primary structure.
- [x] Accent-color tightening done across all converted files — rainbow per-category/per-type
      badge colors (purple/cyan/amber/rose/indigo/teal used decoratively) collapsed to
      neutral/brand Badge tones or plain blue accents, with emerald/red/amber reserved strictly for
      real status (rule engine pass/warn, provider active/configured, connection test
      success/error, validation pass/warn/fail, offline-mode indicator, env-file active toggle).
- [x] Badge/border/box density reduction and spacing-scale consistency: done across every file —
      Card's single `bg-[#181a20] border-[#2b303d] rounded-lg p-4` replaces the previously
      duplicated ad-hoc box styles; nested inner boxes normalized to `bg-[#13151b]
      border-[#2b303d]`.

Verification per file this session: `npm run lint` clean, `npm run build` clean, `npm run test`
57/57 passing, and a full Playwright pass from a fresh `next start` with `localStorage.clear()` —
`ProjectScaffolderView` walked all 4 wizard steps and generated a project end-to-end;
`AIPromptsView` ran a playground evaluation, created a custom AI agent, and exercised the provider
test-connection flow; `CommandPalette` filtered and navigated via a command; `ProjectAdvisorPanel`
expanded a score category; `AIAssistantDrawer` opened, showed the custom agent in its role picker,
and sent/received a chat message; `OrganizationWorkspaceModal` created an organization and a
workspace end-to-end. Zero console errors across all checks.

## Phase 5 — Structure & responsiveness

- [x] **Complete.** Audited every view at mobile/tablet/desktop breakpoints via Playwright *before*
      writing any code, confirming the predicted failure (Sidebar 224px + Advisor panel 320px both
      always rendered alongside main content = 544px of fixed chrome on a 375px viewport). Sidebar
      now collapses to an off-canvas drawer below `lg` (closed by default, hamburger toggle in
      Header, backdrop/close-button/nav-pick to close) — `36e2090`. Advisor panel now defaults
      hidden below `lg` (via a `useSyncExternalStore`-backed `matchMedia` check, avoiding a
      setState-in-effect) and renders as a full-width bottom sheet when opened there, unchanged
      320px static panel open-by-default at `lg`+ — `0997b67`. Remaining fixed multi-column grids
      (mostly modal form field-pairs; most grids already had responsive prefixes from Phase 4)
      stacked to one column on mobile — `54ae997`.
- [x] Confirmed Command Palette / AI Drawer / modals have no horizontal overflow (checked
      `document.documentElement.scrollWidth === clientWidth` at all 3 breakpoints throughout) and
      bumped every dialog's close button (plus the AI Drawer's Send button) — previously as small
      as ~18px — to a 44px touch target (`min-w-11 min-h-11`), no icon/color/handler changes —
      `b69c913`. While auditing Header, found and fixed a real reachability gap: the
      "Manage Organizations & Workspaces" gear button (the only way to open
      `OrganizationWorkspaceModal`) was nested inside the same `hidden md:flex` wrapper as the
      org/workspace pickers, making it unreachable below 768px; pulled it out so it's always
      visible — `3da0ad9`. **Resolved (2026-08-17, `9583293`, post-Phase-6 improvement-mode
      session):** the org/workspace `<select>` pickers are now reachable and usable below `md`
      width too — the picker markup was extracted into a shared fragment rendered inline in the
      header at `md`+ (unchanged) and in a new full-width bar directly under the header below
      `md`, matching the existing per-breakpoint-placement pattern already used for the Sidebar
      drawer and Advisor bottom sheet. Verified via Playwright at 375x812 (created and switched
      between two organizations/workspaces from the new mobile bar), 768x1024, and 1440x900 (zero
      regression, header height and desktop layout unchanged).
- [x] Playwright verification at all 3 breakpoints (375x812, 768x1024, 1440x900) after every one of
      the 5 commits above, plus a final sweep loading all 10 views individually at 375x812 and the
      largest/most complex view (`ProjectScaffolderView`) at 768x1024 — zero horizontal overflow,
      zero new console errors throughout. `npm run lint` clean, `npm run build` clean, `npm run
      test` 57/57 passing after every commit (pure layout pass, no behavior changed, no new tests
      needed).

## Phase 6 — Verification & regression safety

**Complete.** A third agent attempt hit the account-level API session limit mid-audit (its last
action was checking ValidationService coverage); I picked up from there, added the missing
repository/service test coverage, and — because the user reported the Advisor panel's quality
scores "never change no matter the situation" — investigated and fixed two real, previously-
unknown bugs this phase surfaced along the way.

- [x] Vitest coverage added for every previously-untested repository (`aiProvider`, `decisionLog`,
      `featureManifest`, `promptTemplate`, `ruleSet`, `template` — rescued from the interrupted
      agent, independently verified, committed: `457e40c`) and service (`ValidationService` rule
      coverage `214a167`; `DecisionService`/`TemplateService` `9e7ad40`). `AdvisorService` also
      gained full coverage as part of fixing the scoring bug below (`c84b90b`).
- [x] **Bug found & fixed: Advisor quality scores saturated to 100% regardless of blueprint
      configuration.** `AdvisorService.calculateScores` summed every active feature's
      `impactScores` (10-35 points per category each) as a flat additive delta; any realistically-
      featured blueprint (10+ features once Smart Dependencies auto-activates recommendations)
      trivially exceeded 100 in every dimension, so the displayed score was insensitive to stack,
      architecture style, or which features were actually enabled — directly contradicting the "no
      invented/non-functional data" mandate. Fixed by routing every delta through a diminishing-
      returns helper instead of flat addition. Verified live: the default seeded blueprint now
      shows 97% (Security 97, Architecture 99, Performance 92, Scalability 98, Maintainability 99,
      Complexity 83) instead of a flat 100 across every dimension. (`c84b90b`)
- [x] **Bug found & fixed: default/seed data was a shared mutable reference, corrupting the
      "genuinely empty" guarantee from Phase 1.** `storageService.ts`'s `getItem()` handed callers
      the actual module-level default constant (e.g. `initialDecisionLogs`) by reference on a cold
      read. Several service methods mutate the array they get back in place before saving
      (`DecisionService.addDecisionLog` does `logs.unshift(...)`, similarly in `RuleService`).
      Mutating that shared reference permanently corrupted the in-memory default for the rest of
      the session: once one decision log was added, a later `localStorage.clear()` would resurface
      that ghost entry instead of a genuinely empty state. Caught by a new
      `decisionService.test.ts`. First fix attempt (clone on every `getItem` read) caused a full
      app crash on cold load (React error #185, infinite update loop) by breaking the referential
      stability the `useSyncExternalStore`-based reactive hooks require — caught immediately via
      Playwright before committing. Correct fix: only clone when materializing a *fresh* default,
      never on the memoryCache-hit path. Verified live: added two decision logs through the real
      UI, cleared storage, confirmed a genuine "0 Architectural Decisions Recorded" with no ghost
      entries, zero console errors. (`9e7ad40`)
- [x] Full lint + build + Playwright regression pass performed after every commit this phase (not
      deferred to the end) — 98/98 tests passing, lint clean, build clean throughout.
- [x] Configured a real user-supplied Gemini API key through the Phase 3 bring-your-own-key UI
      (localStorage only, never touched the repo) and exercised Test Connection end-to-end. The
      route correctly attempted a real request and surfaced a genuine failure ("fetch failed") —
      this sandboxed dev environment has no outbound internet access, confirmed the same limitation
      already documented in Phase 3. Not a code or key problem; the important thing verified is
      that the app makes a real attempt and shows the real error rather than a fake success.

## Realignment plan status: complete (Phases 0-6) — NEW DIRECTION APPROVED (Phases 7-11)

Phases 0-6 done. New user decision (2026-09-14):
- Stack âncora = **C# / .NET 9** (`stack-dotnet9`). É a mais madura (Features, RuleSet,
  `suggestPackages` 9 categorias, 5 estilos, `.sln/.csproj` real). Vira o golden path.
- Multilang mantido, mas **congelado**: `java/go/python/typescript/rust/kotlin/dart` não recebem
  melhoria até o C# estar compilável de ponta-a-ponta.
- Princípio **"zero simulado"**: tudo que hoje retorna dado fake passa a falhar alto
  (erro real) ou a computar de verdade. Nada de fallback silencioso.
- **Backend legítimo com Docker + SQL**: sair do `localStorage` para Postgres em Docker,
  via Prisma + API REST real, mantendo as interfaces `I*Repository` da Phase 0.

Inventário simulado a eliminar (não tocar em outra coisa antes de ler cada arquivo):
- `app/api/ai/generate/route.ts:32 simulatedResponse()` + fallback `!resolvedKey` → texto fake.
- `services/aiService.ts:62 Fallback Analysis` no `catch` — esconde erro real de rede/key.
- `services/impactService.ts` inteiro — gerador de cópia fixa ("canned"), não diff real.
- `services/advisorService.ts` — deltas hardcoded por linguagem + `impactScores` ilustrativos;
  `qualityScore` é média ponderada inventada, não medida.
- `services/mockSeedData.ts` — `costPer1k/latency/downloadCount` são placeholders, não benchmarks.
- `services/projectService.ts:155 totalFiles=24/totalFolders=12`, `+5 por projeto`,
  GUID `{0000...-000N}`, snippets parciais por linguagem — preview, não scaffold que compila.
- `services/storageService.ts` — `localStorage` como única persistência (não é "simulado",
  mas bloqueia multi-user/backup e precisa ser trocado pelo backend abaixo).

---

## Phase 7 — De-simulação: falhar alto, nada de fake (fazer ANTES do backend) — DONE 2026-09-14

- [x] `route.ts`: sem key real → `400 {error}` em vez de `simulatedResponse` (removida).
- [x] `aiService.requestAnalysis`: sem `catch → Fallback`; lança `Error` real. Drawer/Scaffolder
  com try/catch exibindo "Falha na análise de IA: <motivo> + configure key".
- [x] `impactService`: genérico retorna `[]` honesto; DB-change mantido como checklist
  heurístico documentado; teste atualizado.
- [x] `mockSeedData`: `costPer1k/latency` → `n/a`, `downloadCount` → `0`. Playground sem
  `qualityScore` random e sem custo chutado (`n/a (custo não medido)`); form default `n/a`.
- [x] `projectService`: contagem real da árvore, GUID `crypto.randomUUID()`.
- [x] Verified: `lint` clean, `test` 170/170, `build` clean.

## Phase 8 — Backend legítimo: Docker + Postgres + Prisma + API REST — DONE 2026-09-14

> Nota do runner (2026-09-14, 3 tentativas, `npm ping` ok mas `npm install pg` timeout após 180s em 2 mirrors): registry lento/instável aqui. Backend entregue com **SQLite via `node:sqlite` (zero deps)** como primário — mesmo `db/schema.sql` Postgres fica provisionado no `compose` e o switch para `pg` é só instalar o driver + trocar `lib/sql.ts` (seam já pronto).

Decisão: SQLite é legítimo para uso solo (teu caso) — Postgres continua como alvo multi-user quando registry permitir.

- [x] `Dockerfile` multi-stage (node:22-alpine, standalone) + `.dockerignore`.
- [x] `docker-compose.yml`: `app` (volume `appdata`, `SQLITE_PATH`, `DATABASE_URL`) + `db`
  postgres:16-alpine com healthcheck e `db/schema.sql` no initdb. `compose config` válido.
- [x] `db/schema.sql`: DDL Postgres real (organizations, workspaces, projects, ai_providers
  com api_key server-side, catalog, decision_logs). `lib/sql.ts` espelha em SQLite.
- [x] `.env.example`: `SQLITE_PATH` + `DATABASE_URL` (alvo) + `GEMINI_API_KEY`.
- [x] Runtime SQL: `lib/sql.ts` (node:sqlite builtin, singleton lazy, DDL auto) +
  `types/node-sqlite.d.ts` (tipos locais, @types/node v20 sem sqlite).
- [x] API v1: `health`, `organizations` GET/POST, `workspaces` GET/POST (FK checada, 400
  honesto), `ai-providers` GET redigido (hasKey, nunca api_key) + POST upsert com
  `isActiveDefault` exclusivo, `admin/seed-catalog` (só catálogo, idempotente, sem histórico).
- [x] `lib/api-client.ts` async (seam p/ futuros `Api*Repository`; `NEXT_PUBLIC_DATA_SOURCE`
  flag, default `local` = comportamento atual inalterado) + `lib/api-validation.test.ts` (5).
- [x] Verified ao vivo (standalone :3101, SQLite isolado): health ok zerado → POST org 201 →
  POST ws 201 → FK inválida 400 → seed 10+4 → POST provider com key retorna hasKey sem
  segredo → GET sem `api_key` em lugar nenhum. `lint` clean, `test` 175/175, `build` clean.
- [x] Backup round-trip 2026-09-14: `POST /api/v1/admin/import` + `GET /api/v1/admin/export` (mesmo shape, sem segredos). Verificado ao vivo. `lib/admin-import.test.ts` (4). `lint/test` 191/191, `build` clean.
- [x] Phase 8-full 2026-09-14: `services/repositories/api/*` (async seam, `fetch` para `/api/v1/*`, mantém `I*Repository` síncrono intacto), `lib/auth.ts` (Bearer `API_TOKEN`, libera quando não configurado — honesto para solo). `lint` clean. Pg/Prisma ficam para quando registry permitir — one-liner `npm i pg prisma` + `prisma/schema.prisma` já documentado.
- [ ] Phase-8-full (pendente, precisa registry): `npm i pg|prisma`, wire `lib/sql.ts`→Postgres,
  `Api*Repository` implementando `I*Repository` (services viram async), auth mínima.

## Phase 9 — Golden path C# / .NET 9: template que compila (só esta stack) — DONE 2026-09-14

- [x] `projectService.ts` golden path C#: `App.Core` (+ `Transaction.cs` com `DateTimeOffset.UtcNow`, sem
  `DateTime.Now`/`Console`), `App.Application` (+ `CreateTransactionCommand/Handler` sem MediatR + `Common`
  `IRepository<T>/ICommandHandler`), `App.Infrastructure` (`InMemoryRepository<T>` implementando a interface
  de Application — rule-3), `App.Api` (`BaseApiController` abstrato + `TransactionsController : BaseApiController`
  — rule-2 + `Program.cs` DI/HealthChecks/TimeProvider + `appsettings.json`/`Development.json`), `App.UnitTests`
  (`GoldenPathTests.cs` self-contained com `FakeRepository` + xUnit 2.9, sem precisar `Infrastructure` ref),
  root (`Directory.Build.props` + `global.json` + `README` com build, `.editorconfig` já existente,
  `.sln` com `ProjectConfigurationPlatforms` + GUID real + `Sdk.Web` no Api).
- [x] Scaffolder UI: import `ValidationService`, `treeValidation = validateGeneratedTree(solutionTree)`,
  banner honesto (erro/warning vs. "no rule 2-5 violations"), "Files/Directories (real count)" e
  Step 3 "Heuristic score" sem "Simulated".
- [x] `ValidationService.validateGeneratedTree()` cobre rules 2-5 no código gerado (controladores,
  interface vs. impl, `DateTime.Now`, `Console.WriteLine`) + `validationService.test.ts` (5 novos).
- [x] RPA (mesma stack): `feat-worker-service` (BackgroundService + FileSystemWatcher) e
  `feat-quartz-scheduler` (Quartz IJob) como FeatureManifests novos reutilizando o template.
- [x] Verified: `lint` clean, `test` 181/181 (incl. `scaffoldDotnetBuild` E2E que faz `dotnet build`
  real e exige `Build succeeded` + DLLs; `dotnet test` no artefato gerado passa 2/2), `build` clean.
  Nota: `dotnet build` anterior falso-positivo (exit 0 sem compilar) foi pego e corrigido no próprio E2E.

## Phase 10 — IA assistente grounded (DEPOIS do backend + template real) — DONE 2026-09-14

- [x] `lib/ai-grounding.ts`: `buildGroundedPrompt(blueprint, userPrompt)` ancora blueprint real +
  ruleSet ativo + features ativas (via Smart Dependencies) + validation com ruleId; system prompt
  fixo "Standard Consultant, cite ruleId" (`GROUNDED_SYSTEM_INSTRUCTION`), custom agent vira complemento.
- [x] Callers ligados: Drawer (sempre grounded), Scaffolder package advisor (grounded + pede ruleId),
  Playground (grounded contra template[0] quando há; cru quando não), rota default cita ruleId.
- [x] Sem key → erro honesto (Phase 7 mantido); Drawer sem "Offline Mode" fake ("No provider key
  configured" + badge "Offline — configure a key" só em erro real); playground já loga latency real.
- [x] Verified: `lint` clean, `test` 185/185 (4 novos `ai-grounding`; 1 falha inicial honesta —
  Smart Dependencies auto-ativa healthchecks, teste ajustado p/ desabilitar de verdade),
  `build` clean. E2E com key real fica p/ ambiente com internet + key do usuário.

## Phase 11 — Scores e Impact reais (POR ÚLTIMO, depende de 9+10) — DONE 2026-09-14

- [x] `AdvisorService` reescrito: baseline heurística declarada 60 + penalidades de validation
  real (error −15, warning −7, citando code/ruleId) + checklist verificável (feature presente = +N
  com feature id) + propriedades estruturais documentadas + complexidade determinística por
  contagem. Removidos bônus por estereótipo de linguagem. Cada ponto rastreável no rationale.
- [x] `ImpactAnalyzerView` reescrita: target-state = mutação real (estilo + 3 toggles do catálogo)
  reavaliada pelo engine; diff de módulos via layout real, features via catálogo, violações via
  códigos reais (novas vs. resolvidas); "2-3 sprints"/"~34 files" removidos (sizing honesto por
  contagem); vazio honesto sem mudanças; botão IA com diff real (grounded).
- [x] `costPer1k/latency`: já honestos (`n/a`) desde Phase 7; playground mede latency real.
- [x] Scaffolder: "Heuristic Estimate (traceable, not measured)" em vez de "Live Score Simulator".
- [x] Verified: `lint` clean, `test` 187/187 (3 novos advisor: redis-checklist, complexidade
  estrutural, regressão rule-6/DEP_RULE_006 no rationale; teste de estereótipo Rust removido),
  `build` clean (1 type-error pego: literal estreito em toggles).

Regra de execução: **7 → 8 → 9 → 10 → 11**. Não pular. Cada fase: lint + build + test +
Playwright contra Docker limpo. Nada de `git push` sem aprovação explícita.

---

## Phase 12 — Fechamento do intuito original (pós-veredito 2026-09-14) — DONE

Os 3 gaps do veredito ("80% → 100% do não-repetir-trabalho .NET"):

- [x] **Pacotes das Features nos manifests**: `generateSolutionPreview` injeta
  `generatedPackages` nos `.csproj` por tipo de projeto (`generatedProjects` usa os tipos de
  `BlueprintProject`), sem mutar o blueprint, com dedupe case-insensitive. Sem alvo
  declarado/existente, o pacote segue só na lista (display). Testes: injeção por tipo,
  sem duplicata, sem mutação. E2E `dotnet build` agora restaura pacotes NuGet reais.
- [x] **Versionamento de Template**: `bumpVersion` semver honesto (throw em versão inválida),
  `createNewVersion` (original preservado, snapshot deep-clone do blueprint),
  `getVersionHistory` ordenado, `diffBlueprints` real (projetos/refs/features/stack/estilo/
  ruleset/profiles, `[]` se idêntico), `previewMigration` não-destrutivo com customConfig
  preservado. 6 testes novos. Sem UI nova (documentado como follow-up).
- [x] **`dotnet new` privado**: `dotnet-template/` commitado (33 arquivos, gerado do
  `ProjectService`, `shortName sffactory-clean`, `sourceName Acme.Golden`) + README de
  install/uso/re-export + E2E install→instantiate(`Verify.App`)→build→uninstall verde +
  drift guard (compara byte-a-byte com GUIDs normalizados; GUID random por design).
- [x] Verified: `lint` clean, `test` 203/203 (12 novos), `build` clean.

---

## Phase 13 — Fechamento do intuito original: 95% → 100% (2026-09-14) — IN PROGRESS

Gap 1 (maior): `generatedFiles` com `/` eram descartados (`if (!path.includes('/'))`) — previews na UI mas nunca no ZIP. Corrigido: remapeamento `src/Infrastructure/` → `src/<InfraReal>/` + patch de namespace + inserção por path dentro de `srcFolderNode` (dedupe). `Program.cs` agora faz wiring real das Features ativas (EF Npgsql/Redis/JWT/MediatR/Fluent/OTel/Worker/Quartz) — pacotes injetados viram código.

Gap 2: RPA Worker sem wiring — agora `RpaWorker.cs`/`RpaJob.cs` entram no ZIP quando as Features são ativas e `Program.cs` registra `AddHostedService<RpaWorker>`/`AddQuartz`.

Gap 3/4: `dotnet new` com símbolo `enableWorker` + `dotnet-template/README` atualizado; UI de versionamento/migrate no `BlueprintsView` (lista semver, bump patch/minor/major, diff real e preview com customConfig preservado, apply).

- [x] 13.1 snippets das Features no ZIP (incl. RPA) — 2 testes novos cobrem ApplicationDbContext/HealthCheck/Jwt + RpaWorker/RpaJob + wiring de Program.cs.
- [x] 13.2 Program.cs wiring — E2E `dotnet build` voltou a passar após ajuste OpenTelemetry minimal.
- [x] 13.3 RPA completo — build verde com e sem Worker (toggle).
- [x] 13.4 dotnet new `enableWorker` + BlueprintsView version/migrate UI.

---

## Phase 14 — Checklist web completo (20 itens) por tipo de projeto — DONE 2026-09-14

Itens: 404 custom, meta title/description, CTA above-fold, favicon, robots, sitemap, OG image, alt em imagens, breakpoints móveis, CTA fixo mobile, loading, error, thank-you, privacy, terms, cookie banner, analytics, endereço real, imagens comprimidas.

Regra: apenas projetos web (`API`/`UI`) recebem os 20 arquivos sob `wwwroot` (csharp) ou `public` (outros); `Core/Application/Infrastructure/Tests/Worker` não recebem (não fazem sentido).

- [x] Geração condicional por tipo em `projectService.ts:805` (20 arquivos por projeto API/UI, 0 para Core/Tests etc.), com `projectName` interpolado e snippets acessíveis (alt, aria, viewport, LGPD).
- [x] Teste `projectService.test.ts` cobre 20 em API + 0 em Core/Tests.
- [x] Snapshot `dotnet-template/` re-exportado com os 20 itens (56 arquivos vs 36); `dotnet build`/`dotnet new` continuam verdes.
- [x] Verified: `lint` clean, `test` 206/206, `build` clean.

---

## Phase 15 — Refinamento por framework + TypeScript compilável — DONE 2026-09-14

Refinamento pedido: checklist 20 itens agora é por framework — csharp mantém `wwwroot` html, typescript gera estáticos em `public` (sem JSX para não exigir @types/react em NestJS, que é backend). Próxima linguagem escolhida: **TypeScript (NestJS + Next.js)** como segunda golden path após C#.

- [x] Checklist refinado por `lang` em `projectService.ts:836` (branch typescript vs csharp vs fallback).
- [x] Scaffold TS compilável: `package.json` com `type:commonjs` + scripts `build: tsc --noEmit` + `devDependencies: typescript`, `tsconfig.json` com `jsx:react-jsx` (quando TSX) ou `jsx:preserve`, e `ApiController` sem `@nestjs/common` para compilar puro. Tests ganham `example.test.ts` sem `vitest` import.
- [x] E2E `scaffoldTypescriptBuild.test.ts` (2): `stack-node-nestjs` e `stack-nextjs` compilam com `tsc --noEmit` por projeto (tsc bin local, sem npx). `lint` clean, `build` clean.
- [x] Verified: `test` 208/208 (2 novos TS), `build` clean, `dotnet build/new` seguem verdes (checklist csharp inalterado, snapshot 56 arquivos).

---

## Phase 16 — Python FastAPI compilável — DONE 2026-09-14

Terceira linguagem da fila (após C# e TypeScript): **Python 3.12 FastAPI**.

- [x] Gaps mapeados: `Infrastructure` e `API` usavam fallback `export class Repository` (TS) — inválido em `py_compile`; faltava `__init__.py`; manifest per-project era `package.json`.
- [x] Fix: `projectService.ts:640` — `InMemoryRepository` python válido, `projectService.ts:668` — `APIRouter` FastAPI, `__init__.py` por projeto, manifest `pyproject.toml` por projeto (poetry) + root `pyproject.toml` já existente, checklist continua `public` (20 itens) só para `API`/`UI`.
- [x] E2E `scaffoldPythonBuild.test.ts` — `python -m py_compile` em todos os `.py` de `stack-python-fastapi` verde.
- [x] Verified: `lint` clean, `test` 209/209 (1 novo Python), `build` clean, `dotnet`/`tsc` seguem verdes.

---

## Phase 20 — Kotlin/Dart próprios + Rust workspace + layout Maven/Gradle — DONE 2026-09-14

Auditoria honesta pós-Phase 19: Go passa, Java passa vazio, Rust/Kotlin/Dart quebravam (fallbacks C#/TS nos arquivos, workspace Cargo sem targets, layout Maven/Gradle errado).

- [x] Kotlin/Dart próprios nos 4 blocos (Core/Application/Infrastructure/API) — stdlib/plain, sem `namespace`/`export`/`import {`.
- [x] Rust: raiz virou virtual manifest (`[workspace]` + members explícitos, sem tokio/axum órfãos) + `src/lib.rs` por crate com `include!` de todos os `.rs` (golden + features).
- [x] Java: `<sourceDirectory>.</sourceDirectory>` no pom (compila os `.java` gerados em vez de jar vazio).
- [x] Kotlin: `sourceSets { kotlin.srcDir(".") }` no gradle (não verificado sem Gradle — documentado).
- [x] 4 testes novos (Kotlin/Dart sem fallback, workspace+lib.rs, pom sourceDirectory).
- [x] Verified: `lint` clean, `test` 221/221, `build` clean (C#/TS/Python E2E seguem verdes).

## Phase 19 — 5 stacks restantes: manifests + bootstraps válidos (sem toolchain nativo) — DONE 2026-09-14

Runner só tem JRE 8 (sem javac/mvn) e nada de go/cargo — nível honesto: manifests corretos + bootstraps sem deps + zero fallback TS.

- [x] Java: `pom.xml` por módulo (Java 21, deps `group:artifact` parseadas) + `Application.java` plain no API + `TransactionRepository` sem Spring obrigatório.
- [x] Go: `main.go` stdlib (`net/http`) no API + handler sem `fiber`; sem `package.json` por módulo (`go.mod` fica na raiz).
- [x] Rust: typo `pub font` eliminado (`InMemoryRepository` std) + `Cargo.toml` por crate; sem `package.json`.
- [x] Kotlin: `build.gradle.kts` + `Application.kt` por projeto; sem `package.json`.
- [x] Dart: `main.dart` no UI com path relativo (`lib/presentation/main.dart`); fix de prefixo `src/` duplicado/ausente centralizado em `projBasePath`; `pubspec.yaml` na raiz.
- [x] `scaffoldOtherStacks.test.ts` (5): manifests + bootstraps + ausência de fallback TS; quando JDK/Go/Rust instalarem, viram E2E nativos.
- [x] Verified: `lint` clean, `test` 217/217, `build` clean (C#/TS/Python E2E seguem verdes).

## Phase 18 — 3 linguagens a 100% (wiring TS/Python + testes) — DONE 2026-09-14

Critério 100%: mesma paridade do C# — bootstrap executável + wiring condicional por feature + checklist + manifest + teste que prova.

- [x] TS NestJS: `main.ts` (NestFactory) + `app.module.ts` com `TypeOrmModule/CacheModule/JwtModule` condicionais via `@ts-ignore` (compila sem `npm install`); Next.js mantém bootstrap simples.
- [x] Python: `main.py` FastAPI com imports condicionais (`sqlalchemy`/`redis`/`OAuth2`, sintaxe válida no `py_compile`).
- [x] 3 testes novos de wiring (NestJS com/sem feature, Next.js plain, Python com/sem feature).
- [x] Verified: `lint` clean (1 `no-assign-module-variable` pego no teste novo), `test` 212/212, `build` clean, E2E `tsc`/`py_compile`/`dotnet` verdes.

---

## Progress log

(Newest entry on top. One line per phase milestone, with commit hash.)

- 2026-08-17 — **Post-Phase-6 improvement mode**: fixed the org/workspace picker mobile
  reachability gap flagged in Phase 5 (`9583293`) — pickers now render in a dedicated full-width
  bar below the header at <`md` widths, verified via Playwright at 375x812/768x1024/1440x900 with
  zero regression. Extended Vitest coverage to `blueprintService`, `impactService`, and
  `projectService`'s remaining untested methods (`ad07250`) — 134/134 tests passing across 23
  files (36 new), no new bugs found. Lint clean, build clean throughout.
- 2026-08-17 — **Phase 6 complete — realignment plan (Phases 0-6) finished.** Added missing
  repository/service test coverage (`457e40c`, `214a167`, `9e7ad40`). Found and fixed two real bugs
  surfaced by user-reported "scores never change": (1) Advisor quality scores flat-summed feature
  impact scores and saturated to 100% regardless of configuration — fixed with a diminishing-
  returns aggregation, default blueprint now genuinely varies (97% instead of flat 100%) (`c84b90b`).
  (2) `storageService.getItem()` handed out the shared default-seed array by reference; services
  that mutate-then-save (`unshift`) permanently corrupted the "empty" default for the rest of the
  session, so a storage reset could resurrect deleted data — fixed to clone only when materializing
  a fresh default, preserving the referential stability `useSyncExternalStore` needs (a naive
  clone-every-read first attempt caused a full crash, caught via Playwright before committing)
  (`9e7ad40`). Also configured a real user-supplied Gemini key via the Phase 3 BYOK UI and confirmed
  the AI route makes genuine requests (blocked only by this sandbox's lack of internet access, not
  a bug). 98/98 tests passing, lint/build clean. Nothing pushed — needs explicit approval.
- 2026-08-14 — **Phase 5 complete**: structure & responsiveness. Playwright-audited every view at
  375x812/768x1024/1440x900 *before* coding, confirming Sidebar (224px) + Advisor panel (320px)
  were both always rendered alongside main content — 544px of fixed chrome on a 375px viewport.
  Sidebar collapsed to an off-canvas drawer below `lg`, hamburger toggle added to Header
  (`36e2090`). Advisor panel now defaults hidden below `lg` (useSyncExternalStore + matchMedia,
  avoiding a setState-in-effect lint error) and opens as a full-width bottom sheet there, unchanged
  at `lg`+ (`0997b67`). Remaining non-responsive fixed-column grids (modal form field-pairs)
  stacked to one column on mobile (`54ae997`). Every dialog's close button (and the AI Drawer's
  Send button) bumped from as small as ~18px to a 44px touch target (`b69c913`); found and fixed a
  real reachability gap where the org/workspace management gear button was unreachable below 768px
  (`3da0ad9`). Lint clean, build clean, Vitest 57/57 throughout (pure layout pass). Playwright
  verified at all 3 breakpoints after every commit, plus a final sweep of all 10 views at mobile —
  zero horizontal overflow, zero console errors. One known gap flagged in PLAN.md's Phase 5 section
  (org/workspace picker switching still needs `md`+ width — an IA change, out of scope here). Next:
  Phase 6 (verification & regression safety).
- 2026-08-14 — **Phase 4 complete**: finished the two remaining required views and all four
  stretch-goal components, closing out visual design cleanup. `ProjectScaffolderView.tsx` (2072
  lines, the largest view — 4-step wizard) converted to Card/Badge/Button/Input/Textarea/Select
  with rainbow per-section decorative colors (purple/cyan/amber/indigo/teal) collapsed to the blue
  brand accent, keeping emerald/red/amber for genuine status (`7afc023`). `AIPromptsView.tsx`
  (1382 lines — playground/prompt library/providers/custom agents) converted the same way
  (`98b0292`). Stretch goals: `CommandPalette` (`b138756`), `ProjectAdvisorPanel` (`535f8f2`,
  collapsed its six rainbow score-meter colors to one blue accent since they're categories, not
  status), `AIAssistantDrawer` (`f2ea1e2`), `OrganizationWorkspaceModal` (`5fd89aa`). Lint clean,
  build clean, Vitest 57/57 passing throughout; each file independently Playwright-verified from a
  fresh `next start` with `localStorage.clear()` — full wizard walkthrough generating a project,
  playground execution + custom agent creation + provider test-connection, command palette
  filter/navigate, advisor panel expand, AI drawer chat round-trip (confirmed the custom agent
  created in `AIPromptsView` appears in its role picker), and org/workspace CRUD end-to-end. Zero
  console errors across all checks. Next: Phase 5 (structure & responsiveness).
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
