# Tasks: Dashboard Domain & Charter Governance

**Mission**: `dashboard-governance-config-01KST1YF`
**Branch**: `overhaul/migrate_to_kitty`
**Generated**: 2026-05-29

---

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Add ALLOWED_COLORS constant + color validation helper to domain-tags.service.ts | WP01 | — |
| T002 | Implement `addDomain(input)`: unique ID check, atomic write to domain-config.yaml | WP01 | — |
| T003 | Implement `updateDomain(id, patch)`: ID immutability enforced, atomic write | WP01 | — |
| T004 | Implement `deleteDomain(id)`: single-file atomic remove from domain-config.yaml | WP01 | — |
| T005 | Implement `removeTagDomainFromAll(domainId)`: bulk remove from artifact-tags.yaml, clear primary_domain | WP01 | — |
| T006 | Vitest unit tests for T001–T005 | WP01 | [P] |
| T007 | Implement `cascadePreview(domainId)`: read-only counts (artifactTagCount, primaryDomainLossCount, orgBindingCount) | WP02 | — |
| T008 | Implement `cascadeDelete(domainId)`: sequential cascade via existing per-file service functions | WP02 | — |
| T009 | Add POST + PUT /:id routes to domain-config.routes.ts (uses WP01 service methods) | WP02 | — |
| T010 | Add GET /:id/cascade-preview + DELETE /:id routes (route ordering: preview before delete) | WP02 | — |
| T011 | Vitest tests for cascadePreview and cascadeDelete | WP02 | [P] |
| T012 | Extend frontend domain.service.ts: addDomain, updateDomain, deleteDomain, getCascadePreview | WP03 | — |
| T013 | Create DomainVocabularyPanelComponent: collapsible domain list, inline Add form | WP03 | — |
| T014 | Add edit mode to DomainVocabularyPanelComponent: ID read-only, label/description/color editable | WP03 | — |
| T015 | Delete flow: cascade-preview dialog with counts, confirmed cascade delete | WP03 | — |
| T016 | Integrate panel into OrgBindingsComponent; reload domain dropdown on domain changes | WP03 | — |
| T017 | Create server models/charter.model.ts: CharterEntry, CharterConfigFile, VALID_ARTIFACT_KINDS | WP04 | — |
| T018 | Create server services/charter.service.ts: list(), add(), remove(); atomic write; file init on first write | WP04 | — |
| T019 | Create server routes/charter.routes.ts: GET /, POST /, DELETE /:artifactId | WP04 | — |
| T020 | Register charterRouter at /api/charter in server/src/index.ts | WP04 | — |
| T021 | Vitest unit tests for CharterService (list, add, duplicate, remove, missing, first-write) | WP04 | [P] |
| T022 | Create frontend models/charter.model.ts: CharterEntry, ArtifactKind | WP05 | — |
| T023 | Create frontend services/charter.service.ts: BehaviorSubject, get/add/remove, eager init | WP05 | — |
| T024 | Create CharterBadgeComponent: [artifactId] input, null-safe BehaviorSubject subscription | WP05 | — |
| T025 | Add charter badge to ArtifactListComponent rows and PlatformDefaultsSectionComponent | WP05 | — |
| T026 | Add charter toggle to ArtifactDetailComponent + BuiltinDetailComponent header | WP05 | — |
| T027 | Audit DashboardComponent + DomainArtifactsComponent for FR-007 artefact row coverage | WP05 | [P] |
| T028 | Create CharterComponent page: group by kind, empty state, unknown artefact handling | WP06 | — |
| T029 | Add /charter route to app.routes.ts | WP06 | — |
| T030 | Add Charter nav link to sidebar.component.ts | WP06 | — |
| T031 | Connect CharterComponent to CharterService; wire remove action; verify empty state | WP06 | — |
| T032 | Remove `ARTEFACTORY_PATH` env var; update 4 URL construction sites to `${params.ARTEFACTORY_REPO}/${filename}` (FR-015) | WP07 | — |
| T033 | Add `set +x` before curl in Smoke Check stage sh block (FR-016) | WP07 | [P] |
| T034 | Restore `which zip || apt-get install -y zip` guard in Package stage, or document hard-fail deviation in header (FR-017) | WP07 | [P] |
| T035 | Harden Security Scan: `withCredentials` for SonarQube token + remove `catchError` once agent toolchain confirmed (FR-018) | WP07 | — |
| T036 | Run `spec-kitty retrospect create --mission regnology-stack-distribution-pipeline-01KSWHFT` and `spec-kitty retrospect summary` (FR-019) | WP07 | [P] |

---

## Phase 1: Lane A — Domain Vocabulary

### WP01 — Domain Config Service Methods

**Priority**: Must | **Estimated size**: ~350 lines
**Goal**: Implement write operations in `domain-tags.service.ts` for all domain CRUD operations.
**Independent test**: After this WP, `npx vitest run` on the service test passes for all five functions.
**Prompt**: `tasks/WP01-domain-config-service-methods.md`

- [x] T001 ALLOWED_COLORS constant + color validation helper (domain-tags.service.ts)
- [x] T002 addDomain(input): unique ID check, atomic write to domain-config.yaml
- [x] T003 updateDomain(id, patch): ID immutability enforced, atomic write
- [x] T004 deleteDomain(id): single-file atomic remove
- [x] T005 removeTagDomainFromAll(domainId): bulk remove from artifact-tags.yaml
- [x] T006 Vitest unit tests for T001–T005

**Parallel opportunities**: T006 can start once T001–T005 are drafted.
**Dependencies**: none
**Risks**: setArtifactTags() validates domain IDs against getDomainConfig() — removeTagDomainFromAll() must bypass this validation (it's removing the domain, not adding it).

---

### WP02 — Cascade Service + Domain Config Routes

**Priority**: Must | **Estimated size**: ~380 lines
**Goal**: New `domain-cascade.service.ts` orchestrating the multi-file cascade, plus all HTTP route extensions on `domain-config.routes.ts`.
**Independent test**: `curl POST /api/domain-config` creates domain; `GET /cascade-preview` returns counts; `DELETE` cascades all three files.
**Prompt**: `tasks/WP02-cascade-service-and-routes.md`

- [x] T007 cascadePreview(domainId): read-only counts
- [x] T008 cascadeDelete(domainId): sequential cascade via existing per-file service functions
- [x] T009 POST + PUT /:id routes (reuse WP01 service methods)
- [x] T010 GET /:id/cascade-preview + DELETE /:id routes (route ordering enforced)
- [x] T011 Vitest tests for cascadePreview + cascadeDelete

**Dependencies**: WP01 (requires addDomain, updateDomain, deleteDomain, removeTagDomainFromAll)
**Risks**: Route ordering — cascade-preview must be registered before the DELETE /:id handler.

---

### WP03 — Domain Vocabulary Panel Frontend

**Priority**: Must | **Estimated size**: ~420 lines
**Goal**: New `DomainVocabularyPanelComponent` on the Org Bindings page with inline add/edit/delete and cascade confirmation dialog.
**Independent test**: User can create "test-domain", rename it, and delete it with cascade on the Org Bindings page without page reload.
**Prompt**: `tasks/WP03-domain-vocabulary-panel.md`

- [x] T012 Extend frontend domain.service.ts with CRUD + getCascadePreview
- [x] T013 DomainVocabularyPanelComponent: domain list, collapsible, inline Add form
- [x] T014 Edit mode: ID read-only, label/description/color editable inline
- [x] T015 Delete flow: cascade-preview dialog with counts + confirmed cascade delete
- [x] T016 Integrate into OrgBindingsComponent; reload bindings domain dropdown on change

**Dependencies**: WP01, WP02 (all domain API endpoints)
**Risks**: Color dropdown must use brand token names (not hex); domain.service.ts already serves the domain list from GET /api/domain-config — new CRUD methods extend the same service.

---

## Phase 2: Lane B — Charter Management

### WP04 — Charter Backend

**Priority**: Must | **Estimated size**: ~340 lines
**Goal**: Charter persistence model, CharterService, and HTTP routes; `config/charter-config.yaml` created on first write.
**Independent test**: `curl GET /api/charter` returns `{entries:[]}` before any writes; POST adds entry; duplicate POST returns 409; DELETE removes entry; DELETE non-existent returns 404.
**Prompt**: `tasks/WP04-charter-backend.md`

- [x] T017 Server charter.model.ts: CharterEntry, CharterConfigFile, VALID_ARTIFACT_KINDS
- [x] T018 charter.service.ts: list/add/remove, 409/404 logic, atomic write, file init
- [x] T019 charter.routes.ts: GET /, POST /, DELETE /:artifactId
- [x] T020 Register /api/charter in index.ts
- [x] T021 Vitest unit tests (list, add, duplicate, remove, missing, first-write)

**Dependencies**: none (independent of Lane A)
**Risks**: charter-config.yaml must NOT be created inside pack/; path must resolve via getConfigRoot() to config/.

---

### WP05 — Charter Badge + Toggle Frontend

**Priority**: Must | **Estimated size**: ~430 lines
**Goal**: `CharterBadgeComponent`, `CharterService` (frontend), charter toggle on both detail pages, badge on list pages and platform-defaults section, FR-007 audit.
**Independent test**: Adding artefact from detail page updates badge on list page without reload. Badge renders correctly on initial load for pre-chartered artefacts.
**Prompt**: `tasks/WP05-charter-badge-and-toggle.md`

- [x] T022 Frontend charter.model.ts: CharterEntry, ArtifactKind
- [x] T023 Frontend charter.service.ts: BehaviorSubject cache, get/add/remove, eager init
- [x] T024 CharterBadgeComponent: [artifactId] input, null-safe rendering
- [x] T025 Charter badge on ArtifactListComponent + PlatformDefaultsSectionComponent
- [x] T026 Charter toggle on ArtifactDetailComponent + BuiltinDetailComponent
- [x] T027 FR-007 audit: DashboardComponent + DomainArtifactsComponent

**Dependencies**: WP04 (charter API endpoints)
**Risks**: BehaviorSubject race condition on initial load — badge must render "no badge" (not error) when charter state is null. Eager initialization approach (APP_INITIALIZER or first-service-injection) must be chosen explicitly.

---

### WP06 — Charter Tab View

**Priority**: Must | **Estimated size**: ~260 lines
**Goal**: `/charter` page, sidebar nav link, app routing — fully functional charter curation view.
**Independent test**: Navigate to /charter from sidebar → see grouped artefact list; remove one → list updates; navigate to /charter with empty config → see empty state message.
**Prompt**: `tasks/WP06-charter-tab-view.md`

- [x] T028 CharterComponent: group by ARTIFACT_KINDS order, empty state, unknown-artefact handling
- [x] T029 Add /charter route to app.routes.ts
- [x] T030 Add Charter nav link to sidebar.component.ts
- [x] T031 Wire CharterComponent to CharterService; remove action; FR-013 empty state

**Dependencies**: WP04, WP05
**Risks**: ARTIFACT_KINDS order must match the constant in artifact.model.ts (don't hardcode a new array).

---

### WP07 — Distribution Pipeline Remediation

**Priority**: Must (FR-015) / Should (FR-016, FR-017) / Could (FR-018, FR-019) | **Estimated size**: ~50 lines
**Goal**: Fix the URL path duplication blocker (F-001) found in the post-merge review of mission `regnology-stack-distribution-pipeline-01KSWHFT`, and address the remaining hardening findings.
**Independent test**: After T032, constructing the Artefactory URL from default parameters produces `.../spec-kitty-packs/regnology-default-1.0.0.tar.gz` (single repo-key segment). Verify with `grep -n "ARTEFACTORY_PATH" Jenkinsfile` returning zero hits.
**Tracker refs**: [MIGRATION-2576](https://jira.regnology.net/browse/MIGRATION-2576), [MIGRATION-2577](https://jira.regnology.net/browse/MIGRATION-2577), [MIGRATION-2578](https://jira.regnology.net/browse/MIGRATION-2578), [MIGRATION-2579](https://jira.regnology.net/browse/MIGRATION-2579), [MIGRATION-2580](https://jira.regnology.net/browse/MIGRATION-2580)
**Prompt**: `tasks/WP07-distribution-pipeline-remediation.md`

- [x] T032 Remove `ARTEFACTORY_PATH` env var; fix 4 URL construction sites (Validate, Publish, Smoke Check, Rollback)
- [x] T033 Add `set +x` before curl in Smoke Check stage sh block
- [x] T034 Restore `which zip || apt-get install -y zip` guard, or document hard-fail deviation
- [x] T035 Harden Security Scan: `withCredentials` for SonarQube token + remove `catchError` (post-toolchain-confirmation)
- [x] T036 Run `spec-kitty retrospect create` + `spec-kitty retrospect summary` for mission #4

**Dependencies**: none (operates on `Jenkinsfile` and spec-kitty CLI only; independent of Lanes A and B)
**Risks**: T032 is a blocker — the pipeline must not be run against a live Artefactory instance until the URL is corrected. T035 is conditional on Jenkins agent toolchain confirmation.

---

## Execution Lanes

```
Lane A (sequential): WP01 → WP02 → WP03
Lane B (sequential): WP04 → WP05 → WP06
Lane C (independent): WP07
Lane A, Lane B, and Lane C are independent and can run concurrently.
```

## Requirement Coverage

| FR | WP |
|---|---|
| FR-001 | WP03 |
| FR-002 | WP01, WP02, WP03 |
| FR-003 | WP01, WP02, WP03 |
| FR-004 | WP02, WP03 |
| FR-005 | WP02, WP03 |
| FR-006 | WP06 |
| FR-007 | WP05 |
| FR-008 | WP05 |
| FR-009 | WP04 |
| FR-010 | WP04 |
| FR-011 | WP04 |
| FR-012 | WP04 |
| FR-013 | WP06 |
| FR-014 | WP05 |
| FR-015 | WP07 |
| FR-016 | WP07 |
| FR-017 | WP07 |
| FR-018 | WP07 |
| FR-019 | WP07 |
