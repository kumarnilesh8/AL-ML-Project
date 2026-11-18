# Implementation Plan: Charter Orphan Indicator & Test Fix

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-06-01 | **Spec**: [spec.md](spec.md)
**Mission**: `dashboard-charter-orphan-and-test-hardening-01KT1FNE`

---

## Summary

Add a "Not found in pack" indicator to the `/charter` page for artefacts that no
longer exist in the pack, and fix the pre-existing `reviews.routes.ts` validation
gap where a missing `summary` field was silently defaulted to an empty string instead
of returning HTTP 422.

**Technical approach**:

1. **Backend (WP01)**: New `GET /api/charter/enriched` endpoint in `charter.routes.ts`
   that cross-references each charter entry against `findArtifact()` from the existing
   `pack-scanner.service.ts`. Also adds the `summary` required-field guard to
   `reviews.routes.ts` and a covering Vitest test.

2. **Frontend (WP02)**: Update `charter.component.ts` to call `/api/charter/enriched`
   (replacing the existing `/api/charter` call) and render a "Not found in pack" badge
   on entries where `exists === false`. Remove action remains unconditional.

Both WPs are independently testable: WP01 is fully exercisable via curl/Vitest; WP02
depends on WP01's endpoint.

---

## Technical Context

**Language/Version**: TypeScript 5.x (backend: Node.js 18+/Express 4.x; frontend: Angular 17+)
**Primary Dependencies**: Express 4.x, Angular 17, Vitest 1.x, js-yaml 4.x, supertest (dev, testing)
**Storage**: YAML files in `config/` (read/write via existing atomic-write pattern); pack YAML files scanned by `pack-scanner.service.ts` (read-only)
**Testing**: Vitest for backend unit/route tests; Angular TypeScript compilation as frontend gate (no Angular TestBed specs in this mission scope)
**Target Platform**: Linux/macOS developer workstation (local single-user tool, loopback-bound per C-007)
**Project Type**: Web application — `tools/pack-dashboard/server/` (backend) + `tools/pack-dashboard/src/` (frontend Angular)
**Performance Goals**: Enriched endpoint ≤ 200 ms for up to 50 charter entries (NFR-003)
**Constraints**: No new npm dependencies (C-003); enriched endpoint read-only (C-005); `findArtifact()` is the sole existence check (C-004)

---

## Charter Check

Charter policies applied: `MODEL_DISCIPLINE` (mid-tier model — TypeScript service methods are routine structured work), `APPSEC_COMPLIANCE` (no SAST tooling required for local dashboard), `CORPORATE_TOOLING` (no external API calls introduced), `TRACEABLE_DECISIONS` (design decisions below).

**Gates**: No violations. WP scope is narrowly bounded within the existing `charter.routes.ts` and `charter.component.ts` surfaces.

---

## Project Structure

```
tools/pack-dashboard/
├── server/src/
│   ├── routes/
│   │   ├── charter.routes.ts        ← WP01: add GET /api/charter/enriched
│   │   └── reviews.routes.ts        ← WP01: add summary required-field guard
│   └── services/
│       └── pack-scanner.service.ts  ← read-only; findArtifact() used by WP01
└── src/app/
    └── pages/charter/
        └── charter.component.ts     ← WP02: use enriched endpoint, render indicator
```

**No new files added.** All changes are targeted edits to existing files.

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D-1 | Backend enriched endpoint rather than per-entry frontend API calls | One HTTP request vs N parallel requests. N can be 50+ for large charters. The backend has direct filesystem access via `findArtifact()` which is synchronous and cheap. |
| D-2 | Frontend renders `exists` flag from enriched response, not a secondary call | Avoids a race between the charter list load and per-entry existence checks. Simpler reactive model: single BehaviorSubject update. |
| D-3 | `GET /api/charter/enriched` returns the same shape as `GET /api/charter` plus `exists: boolean` per entry | Minimal contract extension. The frontend only needs to swap the endpoint URL; all other charter logic is unchanged. |
| D-4 | Empty string (`summary: ""`) treated as absent in the reviews validation | FR-005 spec says "non-empty string"; FR-006 test explicitly covers the empty-string case. Consistent with the reviewer-as-human authoring contract. |

---

## Phase 0: Research

No open unknowns. All facts are verifiable from the existing codebase:

- `findArtifact(packRoot, kind, id)` at `tools/pack-dashboard/server/src/services/pack-scanner.service.ts:76` returns `ArtifactSummary | undefined`.
- `charter.routes.ts` already has the `list()` helper; enriched endpoint wraps it.
- `reviews.routes.ts` missing guard is at line ~18 (after reviewer check, before `Review` object construction).
- The failing test is at `reviews.routes.test.ts:76`.

*(No research.md required — no unknowns to resolve.)*

---

## Phase 1: Design

### WP01 — Backend (charter enriched endpoint + reviews summary validation)

**File**: `tools/pack-dashboard/server/src/routes/charter.routes.ts`

Add route immediately after the existing `GET /`:

```typescript
router.get('/enriched', (_req, res) => {
  const entries = list();
  const packRoot = getPackRoot();
  const enriched = entries.map(e => ({
    ...e,
    exists: findArtifact(packRoot, e.artifact_kind as ArtifactKind, e.artifact_id) !== undefined,
  }));
  res.json({ entries: enriched });
});
```

Import additions needed: `findArtifact` from `../services/pack-scanner.service`, `getPackRoot` from `../config`, `ArtifactKind` from `../models/artifact.model`.

---

**File**: `tools/pack-dashboard/server/src/routes/reviews.routes.ts`

Add after the existing `reviewer` check (line ~18):

```typescript
if (!body.summary || typeof body.summary !== 'string' || body.summary.trim() === '') {
  res.status(422).json({ error: 'summary is required' });
  return;
}
```

---

**Tests**: `tools/pack-dashboard/server/src/routes/reviews.routes.test.ts`

The existing test at line 76 already tests the missing-summary case. After the fix it will pass. Add the empty-string case (FR-006):

```typescript
it('returns 422 when summary is empty string', async () => {
  const res = await request(app)
    .post('/api/reviews/directives/TEST')
    .send({ status: 'approved', reviewer: 'alice', summary: '' });
  expect(res.status).toBe(422);
});
```

---

### WP02 — Frontend (charter component orphan indicator)

**File**: `tools/pack-dashboard/src/app/pages/charter/charter.component.ts`

Changes:
1. Add `EnrichedCharterEntry` interface: `CharterEntry & { exists: boolean }`
2. Change `CharterService.entries$` subscription to call `GET /api/charter/enriched` instead of `GET /api/charter` — either by adding a new `CharterService.enrichedEntries$` or a one-off HTTP call in the component (component-local `HttpClient` injection is acceptable for this single call)
3. In the `@for` template loop, add an `@if (!entry.exists)` block rendering the "Not found in pack" indicator, and wrap the existing link in `@if (entry.exists)`.

**Template change (charter.component.html or inline)**:

```html
@if (entry.exists) {
  <a [routerLink]="['/artifacts', entry.artifact_kind, entry.artifact_id]">
    {{ entry.artifact_id }}
  </a>
} @else {
  <span class="charter-orphan-indicator">{{ entry.artifact_id }}</span>
  <span class="ks-badge ks-badge--warning charter-orphan-badge">Not found in pack</span>
}
<!-- Remove button is always shown, regardless of exists -->
<button class="ks-btn ks-btn--icon" (click)="removeFromCharter(entry.artifact_id)">
  Remove
</button>
```

**Styling**: Use existing design token classes (`ks-badge`, `ks-badge--warning`) — no new CSS required.

---

### API Contract (enriched endpoint)

```yaml
# contracts/api-charter-enriched.yaml

endpoint: GET /api/charter/enriched
description: >
  Returns the charter entry list with an `exists` boolean per entry.
  `exists` is true when the artefact is found in the current pack via
  findArtifact(packRoot, kind, id); false when the artefact is absent.
  This is a read-only endpoint; it does not modify charter-config.yaml.

responses:
  200:
    description: Enriched charter entries
    body: |
      {
        entries: Array<{
          artifact_id: string,   // lowercase-normalised (per FR-010, mission #5)
          artifact_kind: ArtifactKind,
          exists: boolean
        }>
      }
  500:
    description: File read failure
    body: "{ error: string }"

invariants:
  - All entries from charter-config.yaml are returned (no filtering by exists)
  - exists check uses findArtifact() exclusively (C-004)
  - Response is computed per-request; no caching
```

---

## Validation Commands

```bash
# After WP01: backend compilation + test
cd tools/pack-dashboard && npx tsc --noEmit
cd tools/pack-dashboard && npx vitest run reviews.routes

# After WP02: full TypeScript check
cd tools/pack-dashboard && npx tsc --noEmit
```

---

## Execution Lanes

```
Lane A (sequential): WP01 → WP02
WP01 must be approved before WP02 dispatches (WP02 depends on the enriched endpoint contract).
```
