<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Charter Orphan Indicator & Test Fix

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `dashboard-charter-orphan-and-test-hardening-01KT1FNE` |
| Mission Type | software-dev |
| Target Branch | `overhaul/migrate_to_kitty` |
| Status | In Specification |
| Parent | Post-merge follow-up from `dashboard-governance-config-01KST1YF` (mission #5) |

---

## Intent Summary

Mission #5 shipped the charter remove action for orphaned entries but left two open items:

1. **UX gap**: Charter entries whose artefact no longer exists in the pack render as plain
   links with no visual indicator that the artefact is orphaned. A curator has no way to
   distinguish a valid entry from one referencing a deleted artefact without navigating to
   the broken link.

2. **Pre-existing test failure**: `reviews.routes.test.ts:76` ("returns 422 when summary
   is missing") has been failing since before the overhaul branch. The `reviews.routes.ts`
   handler validates `status` and `reviewer` but silently defaults `summary` to `''`
   instead of rejecting a missing value with 422.

This mission closes both items with minimal scope.

---

## Scope

**In scope:**
- Backend endpoint to resolve charter entries against the pack (existence check)
- Frontend "not found" indicator badge on orphaned charter entries
- `summary` field validation in `reviews.routes.ts` (422 when absent or empty)
- Vitest tests for the `summary` validation

**Out of scope:**
- Automatic cleanup or migration of orphaned charter entries
- Showing the orphaned entry's prior content or history
- Any change to `pack/` files or `pack/org-charter.yaml`
- Bulk orphan detection across pages other than `/charter`

---

## Assumptions

1. `findArtifact(packRoot, kind, id)` in `pack-scanner.service.ts` is the authoritative
   check for whether an artefact exists in the current pack. Returning `undefined` means
   the artefact is absent.
2. `ArtifactKind` values in charter entries are always valid — the charter POST validates
   `artifact_kind` against `VALID_ARTIFACT_KINDS` (enforced by `charter.service.ts`, shipped in mission #5).
3. The "not found" indicator is a UI label only (e.g., a `<span>` or badge reading
   "Not found in pack"). It does not require the full artefact object.
4. The `reviews.routes.ts` fix is a one-guard addition; no schema migration is needed.
5. An empty string (`summary: ""`) is treated as absent for validation purposes.

---

## Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | The backend exposes `GET /api/charter/enriched` returning the full charter entry list with an `exists: boolean` field per entry. `exists` is `true` when `findArtifact(packRoot, kind, id)` returns a result, `false` when it returns `undefined`. | Approved | Must |
| FR-002 | The `/charter` page uses the enriched endpoint and displays a visible "Not found in pack" indicator on any entry where `exists === false`. The indicator must be visually distinct from the artefact name link. | Approved | Must |
| FR-003 | The remove action (delete button) is present and functional on orphaned entries (`exists === false`) — the curator can remove an orphan without navigating away. | Approved | Must |
| FR-004 | Non-orphaned entries (`exists === true`) display and link to their artefact detail page as before. No regression in the normal rendering path. | Approved | Must |
| FR-005 | `POST /api/reviews/:kind/:id` validates that `summary` is present and is a non-empty string. Returns HTTP 422 with `{ error: 'summary is required' }` when `summary` is absent or empty. | Approved | Must |
| FR-006 | A Vitest test verifies FR-005: (a) posting without `summary` returns 422; (b) posting with `summary: ""` (empty string) returns 422; (c) posting with a valid `summary` succeeds. | Approved | Must |

---

## Non-Functional Requirements

| ID | Description | Threshold | Status |
|---|---|---|---|
| NFR-001 | TypeScript compiles without errors after all changes. | `tsc --noEmit` exits 0 | Approved |
| NFR-002 | The pre-existing failing test `reviews.routes.test.ts:76` passes. The full `reviews.routes` test suite passes. | 100% pass rate | Approved |
| NFR-003 | The `GET /api/charter/enriched` endpoint responds within 200 ms for up to 50 charter entries on a developer workstation. | Under 200 ms | Approved |

---

## Constraints

| ID | Description | Status |
|---|---|---|
| C-001 | The remove action must remain functional for orphaned entries. The UI must not hide, disable, or gate the remove button on `exists === false` entries. | Approved |
| C-002 | No modification to `pack/` files or `pack/org-charter.yaml`. | Approved |
| C-003 | No new npm or pip dependencies. | Approved |
| C-004 | Existence checking must use `findArtifact()` from `pack-scanner.service.ts`. No new file-scanning logic may be introduced. | Approved |
| C-005 | `GET /api/charter/enriched` is read-only. It must not modify any config file. | Approved |

---

## Domain Language

| Term | Definition |
|---|---|
| **Orphaned entry** | A charter entry whose `artifact_id` + `artifact_kind` does not resolve to a file in the current pack via `findArtifact()`. |
| **Enriched charter entry** | A `CharterEntry` augmented with `exists: boolean` from the enriched endpoint. |
| **"Not found in pack" indicator** | A visible UI label shown on orphaned entries in the `/charter` view. |

---

## User Scenarios

### Scenario 1 — Curator views charter with an orphaned entry

1. `adr-drafting-workflow` (kind `tactics`) was previously chartered.
2. The pack is updated and that tactic is removed.
3. The curator opens `/charter`.
4. The entry shows "Not found in pack" instead of a bare artefact link.
5. The remove button is visible and working; the curator removes it in one click.

### Scenario 2 — Review submission without summary is rejected

1. A client POSTs `{ status: 'approved', reviewer: 'alice' }` to `/api/reviews/directives/REGNOLOGY_BRANDING`.
2. The server returns 422 `{ error: 'summary is required' }`.

### Scenario 3 — Normal charter entry renders correctly (no regression)

1. A chartered artefact exists in the pack.
2. The curator opens `/charter`.
3. The entry renders as a link; clicking navigates to the detail page.
4. No "not found" indicator is shown.

---

## Success Criteria

- A curator who opens `/charter` with one or more orphaned entries sees a clear "Not found in pack" label on those entries and can remove them without navigating away.
- The `reviews.routes` Vitest suite passes in full, including the previously-failing test at line 76.
- TypeScript compilation is clean after all changes.
