# Tasks: Charter Orphan Indicator & Test Fix

**Mission**: `dashboard-charter-orphan-and-test-hardening-01KT1FNE`
**Branch**: `overhaul/migrate_to_kitty`
**Generated**: 2026-06-01

---

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Add `GET /api/charter/enriched` route to `charter.routes.ts` | WP01 | — |
| T002 | Add `summary` required-field guard to `reviews.routes.ts` | WP01 | [P] |
| T003 | Add Vitest tests: missing summary → 422, empty string → 422, valid → 201 | WP01 | [P] |
| T004 | Define `EnrichedCharterEntry` type (`CharterEntry & { exists: boolean }`) in `charter.model.ts` | WP02 | — |
| T005 | Update `CharterComponent` to fetch from `/api/charter/enriched` and expose `exists` flag | WP02 | — |
| T006 | Render "Not found in pack" indicator on `exists === false` entries; keep remove action unconditional | WP02 | — |

---

## Lane A — Sequential

### WP01 — Backend: Enriched Charter Endpoint + Reviews Validation Fix

**Priority**: Must | **Estimated size**: ~280 lines
**Goal**: Add the `GET /api/charter/enriched` endpoint and fix the `summary` required-field gap in `reviews.routes.ts`.
**Independent test**: `npx vitest run charter` and `npx vitest run reviews.routes` both pass; `GET /api/charter/enriched` returns `{ entries: [{ artifact_id, artifact_kind, exists }] }`.
**Prompt**: `tasks/WP01-backend-enriched-endpoint-and-reviews-fix.md`

- [x] T001 Add `GET /api/charter/enriched` route to `charter.routes.ts`
- [x] T002 Add `summary` required-field guard to `reviews.routes.ts`
- [x] T003 Add Vitest tests for T002: missing summary → 422, empty string → 422

**Dependencies**: none
**Risks**: `findArtifact()` accepts `ArtifactKind` but charter entries store the kind as a plain string — needs a cast. Import `ArtifactKind` from the correct model file.

---

### WP02 — Frontend: Charter Orphan Indicator

**Priority**: Must | **Estimated size**: ~260 lines
**Goal**: Display "Not found in pack" badge on orphaned charter entries; preserve remove action on all entries.
**Independent test**: `npx tsc --noEmit` exits 0; charter page renders "Not found in pack" label next to orphaned entry IDs.
**Prompt**: `tasks/WP02-frontend-charter-orphan-indicator.md`

- [x] T004 Define `EnrichedCharterEntry` type in `charter.model.ts`
- [x] T005 Update `CharterComponent` to call `/api/charter/enriched` and expose `exists` per entry
- [x] T006 Render orphan indicator on `exists === false` entries; unconditional remove action

**Dependencies**: WP01 (enriched endpoint must exist before frontend can call it)
**Risks**: `CharterService` currently calls `/api/charter` directly — decide whether to add an `enrichedEntries$` observable to the service or do a one-off `HttpClient` call inside the component. Component-local approach is acceptable here.

---

## Execution Lanes

```
Lane A (sequential): WP01 → WP02
WP01 must be approved before WP02 is dispatched.
```

## Requirement Coverage

| FR | WP |
|---|---|
| FR-001 | WP01 |
| FR-002 | WP02 |
| FR-003 | WP02 |
| FR-004 | WP02 |
| FR-005 | WP01 |
| FR-006 | WP01 |
