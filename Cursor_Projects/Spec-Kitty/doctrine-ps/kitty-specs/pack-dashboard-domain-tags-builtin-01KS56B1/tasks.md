# Tasks: Pack Dashboard — Domain Tags and Built-in Doctrine

**Mission**: `pack-dashboard-domain-tags-builtin-01KS56B1`
**Branch**: `overhaul/migrate_to_kitty`
**Generated**: 2026-05-21

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|---------|
| T001 | Create `docs/domain-config.yaml` with 10 starter domains | WP01 | |
| T002 | Add `DomainTagsService` to server with `getDomainConfig()` | WP01 | |
| T003 | Create `domain-config.routes.ts` with `GET /api/domain-config` | WP01 | |
| T004 | Add `getDocsRoot()` getter to `config.ts`; register route in `index.ts` | WP01 | |
| T005 | Supertest integration tests for `GET /api/domain-config` | WP01 | |
| T006 | Create `docs/artifact-tags.yaml` (empty seed file) | WP02 | |
| T007 | Add `getArtifactTags()` + `setArtifactTags()` to `DomainTagsService` | WP02 | |
| T008 | Create `artifact-tags.routes.ts` with `GET` + `PUT` endpoints | WP02 | |
| T009 | Implement 400 (bad body) + 422 (unknown domain) validation in PUT | WP02 | |
| T010 | Implement atomic file write (`.tmp` + `renameSync`) in `setArtifactTags()` | WP02 | |
| T011 | Supertest integration tests for `GET` + `PUT /api/artifact-tags` | WP02 | |
| T012 | Create `domain.model.ts` in frontend models | WP03 | [P] |
| T013 | Create `DomainService` (`getConfig`, `getTags`, `setTags`) | WP03 | [P] |
| T014 | Create `DomainChipsComponent` — read-only variant | WP03 | [P] |
| T015 | Add domain-chips column to `ArtifactListComponent` | WP03 | |
| T016 | Add domain chip CSS classes to `styles.scss` | WP03 | [P] |
| T017 | Add editable variant to `DomainChipsComponent` (multi-select) | WP04 | |
| T018 | Wire editable chip selector into `ArtifactDetailComponent` | WP04 | |
| T019 | Connect `setTags()` PUT call on selection change | WP04 | |
| T020 | Collapse YAML Content section by default via disclosure toggle (FR-018) | WP04 | |
| T021 | Verify save/revert buttons remain functional for pack artifacts (FR-016) | WP04 | |
| T022 | Load `DomainService` in `DashboardComponent` | WP05 | |
| T023 | Build "By Domain" collapsible section template | WP05 | |
| T024 | Compute artifact counts per domain from tags + config | WP05 | |
| T025 | CSS for the "By Domain" section | WP05 | [P] |
| T026 | Create `BuiltinScannerService` with `scan()` using `getSpecKittySrc()` getter | WP06 | |
| T027 | Implement graceful empty result when `SPEC_KITTY_SRC` absent or invalid | WP06 | |
| T028 | Expose `getAll()`, `getKind()`, `getDetail()` on service | WP06 | |
| T029 | Wire startup scan in `index.ts` using getter | WP06 | |
| T030 | Unit tests for `BuiltinScannerService` (normal + absent path) | WP06 | |
| T031 | Extend `ArtifactSummary` with `source?: 'pack' \| 'builtin'` | WP07 | |
| T032 | Update `PackScannerService` to emit `source: 'pack'` on all summaries | WP07 | |
| T033 | Create `builtin.routes.ts` (all / by-kind / single-artifact routes) | WP07 | |
| T034 | Register builtin routes in `index.ts` | WP07 | |
| T035 | Supertest integration tests for all three `/api/builtin` routes | WP07 | |
| T036 | Create frontend `BuiltinService` (`getAll`, `getByKind`, `getDetail`) | WP08 | [P] |
| T037 | Add collapsible "Platform Defaults" table to `ArtifactListComponent` | WP08 | |
| T038 | Add source-badge CSS (`.rn-badge--source-builtin`) to `styles.scss` | WP08 | [P] |
| T039 | Show builtin count header above the collapsible table | WP08 | |
| T040 | Create `BuiltinDetailComponent` (read-only detail view) | WP09 | |
| T041 | Register `/artifacts/builtin/:kind/:id` route FIRST in `app.routes.ts` | WP09 | |
| T042 | Wire `YamlEditorComponent` with `[readOnly]="true"` in built-in detail | WP09 | |
| T043 | Add read-only info banner to `BuiltinDetailComponent` | WP09 | |
| T044 | CSS for built-in detail banner | WP09 | [P] |
| T045 | Load built-in map via `BuiltinService.getAll()` in `StructuredViewComponent` | WP10 | |
| T046 | Extend `BuiltinRef` cell type with `builtinKind` + `refVariant` fields | WP10 | |
| T047 | Resolve built-in IDs in `strCell()` with context-aware `refVariant` | WP10 | |
| T048 | Add CSS for three built-in chip variants | WP10 | [P] |
| T049 | Load built-in summary counts from `BuiltinService` in `DashboardComponent` | WP11 | |
| T050 | Add "Platform Defaults" section template with per-kind counts | WP11 | |
| T051 | CSS for the Platform Defaults section | WP11 | [P] |

---

## Lane A — Domain Tags

### WP01 — Domain vocabulary + GET /api/domain-config

**Goal**: Create the domain-config YAML file, the server service, and the GET route.
**Priority**: High — foundational; WP02, WP03 depend on it.
**Independence**: Fully independent. Can run in parallel with WP06.
**Estimated prompt size**: ~320 lines
**Prompt file**: `tasks/WP01-domain-vocab-server-config.md`

**Subtasks**:
- [x] T001 Create `docs/domain-config.yaml` with 10 starter domains (WP01)
- [x] T002 Add `DomainTagsService` to server with `getDomainConfig()` (WP01)
- [x] T003 Create `domain-config.routes.ts` with `GET /api/domain-config` (WP01)
- [x] T004 Add `getDocsRoot()` getter to `config.ts`; register route in `index.ts` (WP01)
- [x] T005 Supertest integration tests for `GET /api/domain-config` (WP01)

**Dependencies**: none
**Risks**: `getDocsRoot()` path resolution must be correct relative to repo root. If `docs/` does not exist at startup the handler must return `{domains:[]}` not 500.

---

### WP02 — Artifact tags + GET/PUT /api/artifact-tags

**Goal**: Create the artifact-tags YAML file, extend DomainTagsService, and add the GET + PUT routes with full validation and atomic write.
**Priority**: High — WP04 depends on PUT working.
**Independence**: Depends on WP01 (needs `getDomainConfig()` for validation).
**Estimated prompt size**: ~400 lines
**Prompt file**: `tasks/WP02-artifact-tags-server.md`

**Subtasks**:
- [x] T006 Create `docs/artifact-tags.yaml` (empty seed file) (WP02)
- [x] T007 Add `getArtifactTags()` + `setArtifactTags()` to `DomainTagsService` (WP02)
- [x] T008 Create `artifact-tags.routes.ts` with `GET` + `PUT` endpoints (WP02)
- [x] T009 Implement 400 (bad body) + 422 (unknown domain) validation in PUT (WP02)
- [x] T010 Implement atomic file write (`.tmp` + `renameSync`) in `setArtifactTags()` (WP02)
- [x] T011 Supertest integration tests for `GET` + `PUT /api/artifact-tags` (WP02)

**Dependencies**: WP01
**Risks**: Atomic write must handle ENOENT if docs/ doesn't exist; idempotency must be verified by test.

---

### WP03 — DomainService + DomainChipsComponent + kind-list column

**Goal**: Create the frontend domain model, service, read-only chip component, and the domain column on kind-list pages.
**Priority**: High — WP04, WP05 depend on this.
**Independence**: Depends on WP01 (GET /api/domain-config). WP03 and WP06 can run in parallel (different files).
**Estimated prompt size**: ~370 lines
**Prompt file**: `tasks/WP03-domain-service-chips-list-column.md`

**Subtasks**:
- [x] T012 Create `domain.model.ts` in frontend models (WP03)
- [x] T013 Create `DomainService` (`getConfig`, `getTags`, `setTags`) (WP03)
- [x] T014 Create `DomainChipsComponent` — read-only variant (WP03)
- [x] T015 Add domain-chips column to `ArtifactListComponent` (WP03)
- [x] T016 Add domain chip CSS classes to `styles.scss` (WP03)

**Dependencies**: WP01
**Risks**: `DomainChipsComponent` must accept a `domains: string[]` input and resolve against the config; color mapping must follow the predefined CSS class convention, never arbitrary hex.

---

### WP04 — Editable domain chips + YAML editor state

**Goal**: Add the editable multi-select chip selector to the artifact detail page, wire the PUT call, and collapse the YAML Content section by default.
**Priority**: High — covers FR-009, FR-016, FR-018.
**Independence**: Depends on WP02 (PUT route) and WP03 (DomainChipsComponent).
**Estimated prompt size**: ~380 lines
**Prompt file**: `tasks/WP04-editable-chips-yaml-editor.md`

**Subtasks**:
- [x] T017 Add editable variant to `DomainChipsComponent` (multi-select) (WP04)
- [x] T018 Wire editable chip selector into `ArtifactDetailComponent` (WP04)
- [x] T019 Connect `setTags()` PUT call on selection change (WP04)
- [x] T020 Collapse YAML Content section by default via disclosure toggle (WP04)
- [x] T021 Verify save/revert buttons remain functional for pack artifacts (WP04)

**Dependencies**: WP02, WP03
**Risks**: The editable variant reuses the same `DomainChipsComponent` with an `editable` input; do not create a second component. The YAML collapse must not affect the Structured View (always visible).

---

### WP05 — "By Domain" dashboard section

**Goal**: Add the collapsible "By Domain" section to the DashboardComponent showing per-domain artifact counts.
**Priority**: Medium.
**Independence**: Depends on WP03 (DomainService).
**Estimated prompt size**: ~270 lines
**Prompt file**: `tasks/WP05-by-domain-dashboard.md`

**Subtasks**:
- [x] T022 Load `DomainService` in `DashboardComponent` (WP05)
- [x] T023 Build "By Domain" collapsible section template (WP05)
- [x] T024 Compute artifact counts per domain from tags + config (WP05)
- [x] T025 CSS for the "By Domain" section (WP05)

**Dependencies**: WP03
**Risks**: Domain section must be collapsible (same toggle pattern as existing panels). Untagged artifacts do NOT produce a warning or counter (resolved decision: no warning shown).

---

## Lane B — Built-in Doctrine

### WP06 — Built-in scanner service (server)

**Goal**: Implement the server-side BuiltinScannerService that scans SPEC_KITTY_SRC/doctrine/ at startup and caches the result.
**Priority**: High — foundational; WP07 depends on it.
**Independence**: Fully independent. Can run in parallel with WP01–WP03.
**Estimated prompt size**: ~350 lines
**Prompt file**: `tasks/WP06-builtin-scanner-server.md`

**Subtasks**:
- [x] T026 Create `BuiltinScannerService` with `scan()` using `getSpecKittySrc()` getter (WP06)
- [x] T027 Implement graceful empty result when `SPEC_KITTY_SRC` absent or invalid (WP06)
- [x] T028 Expose `getAll()`, `getKind()`, `getDetail()` on service (WP06)
- [x] T029 Wire startup scan in `index.ts` using getter (WP06)
- [x] T030 Unit tests for `BuiltinScannerService` (normal + absent path) (WP06)

**Dependencies**: none
**Risks**: MUST use `getSpecKittySrc()` getter — never the frozen `SPEC_KITTY_SRC` constant — so `process.env` overrides work in tests. `getDetail()` must read the file at call time (not rely solely on scan cache) so YAML content is available.

---

### WP07 — GET /api/builtin routes + pack source field

**Goal**: Expose the three read-only `/api/builtin` routes and add `source` discriminant to `ArtifactSummary`.
**Priority**: High — WP08–WP11 all depend on this.
**Independence**: Depends on WP06 (BuiltinScannerService).
**Estimated prompt size**: ~390 lines
**Prompt file**: `tasks/WP07-builtin-routes-source-field.md`

**Subtasks**:
- [x] T031 Extend `ArtifactSummary` with `source?: 'pack' | 'builtin'` (WP07)
- [x] T032 Update `PackScannerService` to emit `source: 'pack'` on all summaries (WP07)
- [x] T033 Create `builtin.routes.ts` (all / by-kind / single-artifact routes) (WP07)
- [x] T034 Register builtin routes in `index.ts` (WP07)
- [x] T035 Supertest integration tests for all three `/api/builtin` routes (WP07)

**Dependencies**: WP06
**Risks**: The existing `PUT /api/artifacts/:kind/:id` route must never handle built-in paths. `source` field must be present (`'pack'`) on all pack summaries after this WP — not optional.

---

### WP08 — Built-in table on kind-list pages + BuiltinService

**Goal**: Create the frontend BuiltinService and add the collapsible "Platform Defaults" table to the kind-list page.
**Priority**: Medium.
**Independence**: Depends on WP07.
**Estimated prompt size**: ~310 lines
**Prompt file**: `tasks/WP08-builtin-table-kind-list.md`

**Subtasks**:
- [x] T036 Create frontend `BuiltinService` (`getAll`, `getByKind`, `getDetail`) (WP08)
- [x] T037 Add collapsible "Platform Defaults" table to `ArtifactListComponent` (WP08)
- [x] T038 Add source-badge CSS (`.rn-badge--source-builtin`) to `styles.scss` (WP08)
- [x] T039 Show builtin count header above the collapsible table (WP08)

**Dependencies**: WP07
**Risks**: Built-in rows must NOT have edit links. Table is collapsed by default. The source badge must be visually distinct from validation badges already on the page.

---

### WP09 — Read-only built-in detail view

**Goal**: Create `BuiltinDetailComponent` at `/artifacts/builtin/:kind/:id` with a read-only YAML editor and info banner.
**Priority**: Medium.
**Independence**: Depends on WP08 (BuiltinService available in frontend).
**Estimated prompt size**: ~340 lines
**Prompt file**: `tasks/WP09-builtin-detail-view.md`

**Subtasks**:
- [x] T040 Create `BuiltinDetailComponent` (read-only detail view) (WP09)
- [x] T041 Register `/artifacts/builtin/:kind/:id` route FIRST in `app.routes.ts` (WP09)
- [x] T042 Wire `YamlEditorComponent` with `[readOnly]="true"` in built-in detail (WP09)
- [x] T043 Add read-only info banner to `BuiltinDetailComponent` (WP09)
- [x] T044 CSS for built-in detail banner (WP09)

**Dependencies**: WP08
**Risks**: Route ordering is CRITICAL — `/artifacts/builtin/:kind/:id` must be the first entry in the artifacts route group, placed BEFORE both `/artifacts/:kind` and `/artifacts/:kind/:id`. Failure to do so causes Angular to match `builtin` as the `:kind` parameter.

---

### WP10 — Built-in chip resolution in StructuredViewComponent

**Goal**: Wire the StructuredViewComponent to resolve `specializes_from`, `enhances`, and `overrides` values against the built-in artifact map and render them as linked chips.
**Priority**: Medium.
**Independence**: Depends on WP09 (BuiltinDetailComponent route must exist for the links to be valid).
**Estimated prompt size**: ~330 lines
**Prompt file**: `tasks/WP10-builtin-chip-resolution.md`

**Subtasks**:
- [x] T045 Load built-in map via `BuiltinService.getAll()` in `StructuredViewComponent` (WP10)
- [x] T046 Extend `BuiltinRef` cell type with `builtinKind` + `refVariant` fields (WP10)
- [x] T047 Resolve built-in IDs in `strCell()` with context-aware `refVariant` (WP10)
- [x] T048 Add CSS for three built-in chip variants (WP10)

**Dependencies**: WP09
**Risks**: Must not break existing pack-ref resolution. Context (`specializes_from` / `enhances` / `overrides`) must flow from `buildSections()` down to `strCell()` so the correct chip variant is chosen.

---

### WP11 — Platform Defaults section on dashboard

**Goal**: Add the "Platform Defaults" section to the DashboardComponent showing per-kind built-in counts. No coverage ratio shown.
**Priority**: Low — additive only; does not block any other WP.
**Independence**: Depends on WP07 (GET /api/builtin available).
**Estimated prompt size**: ~220 lines
**Prompt file**: `tasks/WP11-platform-defaults-dashboard.md`

**Subtasks**:
- [x] T049 Load built-in summary counts from `BuiltinService` in `DashboardComponent` (WP11)
- [x] T050 Add "Platform Defaults" section template with per-kind counts (WP11)
- [x] T051 CSS for the Platform Defaults section (WP11)

**Dependencies**: WP07
**Risks**: Must NOT show a pack-coverage ratio (C-004). Section should be visually subordinate to the "By Kind" section.

---

## Dependency Graph

```
WP01 ──► WP02 ──► WP04
     └──► WP03 ──► WP04
               └──► WP05

WP06 ──► WP07 ──► WP08 ──► WP09 ──► WP10
               └──► WP11
```

**Parallel start points**: WP01 and WP06 can start simultaneously.
**Earliest completion path**: WP01 → WP02 → WP04 (Lane A) | WP06 → WP07 → WP09 → WP10 (Lane B)
