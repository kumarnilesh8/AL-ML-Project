# Tasks: Doctrine Discoverability & DRG Dashboard

**Mission**: `doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X`
**Branch**: `overhaul/migrate_to_kitty`
**Generated**: 2026-06-02

---

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Author `docs/ONBOARDING.md` per user-guide-conventions (persona, prerequisites, steps, troubleshooting, related resources) | WP01 | — |
| T002 | Verify the guide against the user-guide-conventions quality_test (6 checks) | WP01 | — |
| T003 | Enhance `GET /api/drg/` — prefer graph.yaml, fall back to fragment.yaml with `degraded` flag | WP02 | — |
| T004 | Add `GET /api/drg/neighbourhood/:id` returning node + neighbours + incident edges | WP02 | — |
| T005 | Vitest tests for the enhanced graph endpoint and neighbourhood endpoint | WP02 | [P] |
| T006 | Create `drg.model.ts` + `drg.service.ts` (getSeed, getNeighbourhood) | WP03 | — |
| T007 | Create `drg-graph.component.ts` — D3 force-directed renderer with node-kind colours + curved directional links | WP03 | — |
| T008 | Create `drg.component.ts` page — seed load, node-click fan-out + merge, detail panel | WP03 | — |
| T009 | Wire `/drg` route + sidebar nav link | WP03 | — |
| T010 | Create `provenance.service.ts` — compute `{layer, provenance}` from pack vs built-in ids | WP04 | — |
| T011 | Extend `builtin.routes.ts` + `artifacts.routes.ts` to include provenance; add `GET /api/builtin/inherited` | WP04 | — |
| T012 | Vitest tests for provenance computation and inherited endpoint | WP04 | [P] |
| T013 | Create `provenance-badge` component (Built-in / Org-layer / Override, layer-aware) | WP05 | — |
| T014 | Render the badge on artifact list + detail pages; add an "inherited unchanged" filter/view | WP05 | — |

---

## Phase 1: Lane A — Onboarding Documentation

### WP01 — Onboarding Guide

**Priority**: Must | **Estimated size**: ~220 lines
**Goal**: Author `docs/ONBOARDING.md` as a worked example of `user-guide-conventions`, folding in the C-001→C-010 enrollment gotchas.
**Independent test**: The guide passes all 6 user-guide-conventions quality checks; a reader can install + verify the pack from the guide alone.
**Prompt**: `tasks/WP01-onboarding-guide.md`

- [x] T001 Author `docs/ONBOARDING.md` per user-guide-conventions
- [x] T002 Verify against the quality_test (6 checks)

**Dependencies**: none
**Risks**: Drift from the live installer flags — cross-check against `dist/scripts/install-regnology-stack.sh --help` and HOW_TO_USE.md.

---

## Phase 2: Lane B — DRG Visualizer

### WP02 — DRG Backend (graph + neighbourhood)

**Priority**: Must | **Estimated size**: ~260 lines
**Goal**: Enhance the existing `GET /api/drg/` to prefer compiled graph.yaml with a degraded fallback, and add a neighbourhood endpoint for progressive fan-out.
**Independent test**: `GET /api/drg/` returns `{nodes, edges}` (degraded flag when only fragment exists); `GET /api/drg/neighbourhood/CONTEXT_AWARE_DESIGN` returns its incident edges + neighbours.
**Prompt**: `tasks/WP02-drg-backend.md`

- [x] T003 Enhance `GET /api/drg/` — graph.yaml preferred, degraded fallback
- [x] T004 Add `GET /api/drg/neighbourhood/:id`
- [x] T005 Vitest tests for both

**Dependencies**: none
**Risks**: graph.yaml and fragment.yaml node/edge shapes differ slightly — normalise to one response shape.

---

### WP03 — DRG Visualizer Frontend

**Priority**: Must | **Estimated size**: ~420 lines
**Goal**: New Angular `/drg` page rendering the graph as a D3 force-directed diagram with progressive fan-out.
**Independent test**: Navigating to `/drg` shows the seed graph; clicking a node fans out its neighbourhood without a full reload; clicking shows detail with a link to the artifact browser.
**Prompt**: `tasks/WP03-drg-visualizer-frontend.md`

- [x] T006 `drg.model.ts` + `drg.service.ts`
- [x] T007 `drg-graph.component.ts` (D3 force-directed)
- [x] T008 `drg.component.ts` page (seed, fan-out merge, detail panel)
- [x] T009 `/drg` route + sidebar nav link

**Dependencies**: WP02 (consumes the graph + neighbourhood endpoints)
**Risks**: D3/Angular change-detection conflict — D3 owns the SVG subtree, Angular owns the container. Add `d3` to package.json (C-003 permitted).

---

## Phase 3: Lane C — Built-in Doctrine Visibility

### WP04 — Provenance Backend

**Priority**: Must | **Estimated size**: ~240 lines
**Goal**: Compute artifact provenance (`layer` + `provenance`) and surface built-in relationship flags + an inherited-unchanged endpoint.
**Independent test**: Artifact responses carry `{layer, provenance}`; `GET /api/builtin/` rows carry `overridden_by_pack`/`enhanced_by_pack`; `GET /api/builtin/inherited` lists built-ins the pack leaves untouched.
**Prompt**: `tasks/WP04-provenance-backend.md`

- [x] T010 `provenance.service.ts` — layer/provenance computation
- [x] T011 Extend builtin + artifacts routes; add `/api/builtin/inherited`
- [x] T012 Vitest tests for provenance + inherited

**Dependencies**: none
**Risks**: `layer` must be an integer, not a fixed enum (C-007) — keep the model N-layer-ready.

---

### WP05 — Provenance Frontend

**Priority**: Must | **Estimated size**: ~240 lines
**Goal**: Render provenance badges on artifacts and an "inherited unchanged" view.
**Independent test**: Each artifact card/detail shows a Built-in / Org-layer / Override badge; a filter shows built-ins not overridden or enhanced.
**Prompt**: `tasks/WP05-provenance-frontend.md`

- [x] T013 `provenance-badge` component (layer-aware)
- [x] T014 Badge on artifact list + detail; inherited-unchanged filter/view

**Dependencies**: WP04 (consumes provenance fields + inherited endpoint)
**Risks**: Badge must reuse existing `ks-badge` tokens (C-006); don't introduce a new palette.

---

## Execution Lanes

```
Lane A (docs)     : WP01                          [independent]
Lane B (DRG)      : WP02 → WP03
Lane C (built-in) : WP04 → WP05
Lanes A, B, C are independent and run concurrently.
```

## Requirement Coverage

| FR | WP |
|---|---|
| FR-001 | WP01 |
| FR-002 | WP01 |
| FR-003 | WP01 |
| FR-004 | WP01 |
| FR-005 | WP01 |
| FR-006 | WP02 |
| FR-007 | WP02 |
| FR-008 | WP03 |
| FR-009 | WP03 |
| FR-010 | WP03 |
| FR-011 | WP03 |
| FR-012 | WP03 |
| FR-013 | WP04 |
| FR-014 | WP04, WP05 |
| FR-015 | WP04, WP05 |
