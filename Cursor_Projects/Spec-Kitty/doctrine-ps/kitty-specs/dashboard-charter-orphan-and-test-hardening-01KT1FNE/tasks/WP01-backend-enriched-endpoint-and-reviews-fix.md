---
work_package_id: WP01
title: Backend — Enriched Charter Endpoint + Reviews Validation Fix
dependencies: []
requirement_refs:
- FR-001
- FR-005
- FR-006
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-charter-orphan-and-test-hardening-01KT1FNE
base_commit: 023783f897faba14491afba38ff28b1b76546331
created_at: '2026-06-01T11:52:27.519129+00:00'
subtasks:
- T001
- T002
- T003
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1208808"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/routes/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/routes/charter.routes.ts
- tools/pack-dashboard/server/src/routes/reviews.routes.ts
- tools/pack-dashboard/server/src/routes/reviews.routes.test.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load node-norris
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Two targeted backend changes:

1. **T001**: Add `GET /api/charter/enriched` — cross-references charter entries against
   the pack via `findArtifact()` and returns each entry with an `exists: boolean` field.
   This is the endpoint the `/charter` frontend page will call to detect orphaned entries.

2. **T002 + T003**: Fix the pre-existing validation gap in `reviews.routes.ts` where a
   missing or empty `summary` field was silently defaulted to `''` instead of returning
   422. Add Vitest tests to cover the fix.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: Enter the worktree path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`.

## Context

### Enriched endpoint (T001)

`charter.routes.ts` lives at `tools/pack-dashboard/server/src/routes/charter.routes.ts`.
It already exports a `GET /` route using `charter.service.list()`. Read the current file
before writing — don't overwrite existing routes.

The enriched endpoint uses:
- `list()` from `charter.service.ts` — returns `CharterEntry[]` (`{ artifact_id, artifact_kind }`)
- `findArtifact(packRoot, kind, id)` from `../services/pack-scanner.service` — returns
  `ArtifactSummary | undefined`
- `getPackRoot()` from `../config` (already imported in other routes — check existing imports)
- `ArtifactKind` from `../models/artifact.model` — `artifact_kind` in charter entries is
  stored as a string; cast it as `ArtifactKind` when calling `findArtifact`

### Reviews validation gap (T002)

`reviews.routes.ts` currently validates `status` (line ~7) and `reviewer` (line ~18) but then
constructs the `Review` object with:
```typescript
summary: typeof body.summary === 'string' ? body.summary : '',
```
This silently accepts a missing `summary`. The fix is to add a guard immediately after the
reviewer check.

### Failing test (T003)

`reviews.routes.test.ts:76` already has:
```typescript
it('returns 422 when summary is missing', async () => {
  const res = await request(app)
    .post('/api/reviews/directives/TEST')
    .send({ status: 'approved', reviewer: 'alice' });
  expect(res.status).toBe(422);
});
```
This test passes after T002. You also need to add the empty-string case (FR-006).

---

## Subtask Guidance

### T001 — Add `GET /api/charter/enriched`

**Purpose**: Provide the frontend with a single endpoint that returns charter entries
augmented with existence data from the pack.

**Steps**:

1. Open `tools/pack-dashboard/server/src/routes/charter.routes.ts`.
2. Add the following imports at the top (after existing imports):
   ```typescript
   import { findArtifact } from '../services/pack-scanner.service';
   import { getPackRoot } from '../config';
   import type { ArtifactKind } from '../models/artifact.model';
   ```
   Check which imports are already present before adding — do not duplicate.

3. Add the route **before the existing `GET /`** (or after — Express route order only
   matters for overlapping patterns; `/enriched` and `/` do not overlap):
   ```typescript
   router.get('/enriched', (_req, res) => {
     try {
       const entries = list();
       const packRoot = getPackRoot();
       const enriched = entries.map(e => ({
         ...e,
         exists: findArtifact(packRoot, e.artifact_kind as ArtifactKind, e.artifact_id) !== undefined,
       }));
       res.json({ entries: enriched });
     } catch (err) {
       res.status(500).json({ error: String(err) });
     }
   });
   ```

4. Verify the route path is exactly `/enriched` (no leading `/api` — the router is mounted
   at `/api/charter` in `index.ts`).

**Files**: `tools/pack-dashboard/server/src/routes/charter.routes.ts`

**Validation**:
- [ ] `GET /api/charter/enriched` returns `{ entries: [{ artifact_id, artifact_kind, exists }] }`
- [ ] `exists` is `true` for a known pack artefact (e.g., any ID from `pack/directives/`)
- [ ] `exists` is `false` for a fake ID (e.g., `nonexistent-artifact-xyz`)
- [ ] The existing `GET /api/charter` route is unmodified

---

### T002 — Add `summary` required-field guard to `reviews.routes.ts`

**Purpose**: Reject review submissions that omit or empty-string the summary field (FR-005).

**Steps**:

1. Open `tools/pack-dashboard/server/src/routes/reviews.routes.ts`.
2. Locate the reviewer check (around line 14–18):
   ```typescript
   if (!body.reviewer || typeof body.reviewer !== 'string') {
     res.status(422).json({ error: 'reviewer is required' });
     return;
   }
   ```
3. Add the `summary` guard immediately after it:
   ```typescript
   if (!body.summary || typeof body.summary !== 'string' || body.summary.trim() === '') {
     res.status(422).json({ error: 'summary is required' });
     return;
   }
   ```
4. The existing `summary: typeof body.summary === 'string' ? body.summary : ''` line in the
   `Review` object construction can now be simplified to `summary: body.summary` (it is
   guaranteed non-empty at that point). Update it.

**Files**: `tools/pack-dashboard/server/src/routes/reviews.routes.ts`

**Validation**:
- [ ] `POST /api/reviews/:kind/:id` with no `summary` → 422 `{ error: 'summary is required' }`
- [ ] `POST /api/reviews/:kind/:id` with `summary: ""` → 422
- [ ] `POST /api/reviews/:kind/:id` with `summary: "  "` (whitespace only) → 422
- [ ] `POST /api/reviews/:kind/:id` with valid `summary` → 201

---

### T003 — Add Vitest tests for summary validation

**Purpose**: Cover FR-006 — the pre-existing test at line 76 will now pass after T002;
add the empty-string case explicitly.

**Steps**:

1. Open `tools/pack-dashboard/server/src/routes/reviews.routes.test.ts`.
2. After the existing "returns 422 when summary is missing" test, add:
   ```typescript
   it('returns 422 when summary is empty string', async () => {
     const res = await request(app)
       .post('/api/reviews/directives/TEST')
       .send({ status: 'approved', reviewer: 'alice', summary: '' });
     expect(res.status).toBe(422);
   });

   it('returns 422 when summary is whitespace only', async () => {
     const res = await request(app)
       .post('/api/reviews/directives/TEST')
       .send({ status: 'approved', reviewer: 'alice', summary: '   ' });
     expect(res.status).toBe(422);
   });
   ```

3. Run the test suite:
   ```bash
   cd tools/pack-dashboard && npx vitest run reviews.routes
   ```
   All tests must pass, including the previously-failing test at line 76.

**Files**: `tools/pack-dashboard/server/src/routes/reviews.routes.test.ts`

**Validation**:
- [ ] `npx vitest run reviews.routes` exits 0
- [ ] Previously-failing test at line 76 now passes
- [ ] New empty-string and whitespace tests pass

---

## Definition of Done

- [ ] `GET /api/charter/enriched` exists and returns `{ entries: [...] }` with `exists` per entry
- [ ] `exists` uses `findArtifact()` exclusively (C-004)
- [ ] `POST /api/reviews/:kind/:id` returns 422 when `summary` is missing, empty, or whitespace-only
- [ ] `npx vitest run reviews.routes` exits 0 (including the previously-failing test)
- [ ] `npx tsc --noEmit` exits 0 from `tools/pack-dashboard/`
- [ ] Diff touches only the three owned files

## Risks

| Risk | Mitigation |
|---|---|
| `ArtifactKind` import path differs between route files | Check existing imports in `artifacts.routes.ts` for the correct path |
| `getPackRoot()` not exported from `config` | Check `config.ts` exports; use `getConfigRoot()` if that's the actual export name |
| `findArtifact` slow on large packs | For ≤50 entries this is synchronous and O(N×M) where N=entries, M=files per kind — acceptable |

## Reviewer Guidance

1. Verify `GET /api/charter/enriched` is read-only — no writes to any file
2. Confirm `findArtifact()` is the only existence-check mechanism used (C-004)
3. Confirm `summary` guard fires on empty string and whitespace — not just on `undefined`
4. Verify diff touches only the three owned files

## Activity Log

- 2026-06-01T11:52:29Z – claude:sonnet:node-norris:implementer – shell_pid=1197035 – Assigned agent via action command
- 2026-06-01T11:55:04Z – claude:sonnet:node-norris:implementer – shell_pid=1197035 – Enriched endpoint, summary validation fix, Vitest tests pass (incl. previously-failing test at line 76)
- 2026-06-01T11:56:12Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1208808 – Started review via action command
- 2026-06-01T11:58:26Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1208808 – Review passed: enriched endpoint, summary validation, all tests pass
