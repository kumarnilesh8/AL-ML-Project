# Implementation Plan: Doctrine Discoverability & DRG Dashboard

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)
**Mission**: `doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X`

---

## Summary

Three independent tracks make the doctrine pack discoverable:

- **Track A (docs)** — `docs/ONBOARDING.md`, authored as a worked example of the
  `user-guide-conventions` styleguide, folding in the C-001→C-010 enrollment gotchas.
- **Track B (DRG visualizer)** — a new Angular page rendering the DRG as an interactive,
  progressively-expanding force-directed graph (D3). The backend `GET /api/drg/` endpoint
  **already exists** and returns `{nodes, edges}` merging the pack fragment with built-ins;
  it needs a small enhancement (prefer compiled `graph.yaml`, add `degraded` flag) and a
  neighbourhood endpoint for fan-out. The visualizer page is net-new.
- **Track C (built-in visibility)** — provenance indicators (Built-in / Org-layer / Override,
  carrying a `layer` id) on artifact lists, plus an "inherited unchanged" view. The
  `GET /api/builtin/` endpoint **already exists**; provenance computation
  (`overridden_by_pack` / `enhanced_by_pack`) is the new backend work.

**Codebase reality check** (verified against `tools/pack-dashboard/`):
- `server/src/routes/drg.routes.ts` — `GET /api/drg/` and `GET /api/drg/coverage` exist; reads `fragment.yaml`, merges built-ins, no `degraded` flag, no neighbourhood endpoint.
- `server/src/routes/builtin.routes.ts` — `GET /api/builtin/`, `/:kind`, `/:kind/:id` exist.
- `src/app/pages/builtin-detail/` exists. No DRG visualizer page exists.

---

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend: Angular 18.2; backend: Node.js 18+ / Express 4.x)
**Primary Dependencies**: Angular 18, Express 4, js-yaml 4, D3.js 7 (NEW — force-directed graph), Vitest (dev), supertest (dev)
**Storage**: YAML files — `pack/drg/graph.yaml` (preferred) / `pack/drg/fragment.yaml` (fallback), read-only; built-ins via `builtin-scanner.service`
**Testing**: Vitest for backend routes/services; Angular `tsc --noEmit` as the frontend gate; no Angular TestBed specs in scope
**Target Platform**: Linux/macOS developer workstation; loopback-bound local dashboard (C-007 from prior mission)
**Project Type**: Web application — `tools/pack-dashboard/server/` (backend) + `tools/pack-dashboard/src/` (Angular frontend) + `docs/` (Track A)
**Performance Goals**: `/api/drg/graph` ≤ 300 ms (≤100 nodes); fan-out merge+re-render ≤ 200 ms (NFR-001/002)
**Constraints**: read-only (no writes to fragment.yaml or built-ins); D3 is the one permitted new runtime dep (C-003); reuse existing design tokens (C-006); N-layer-ready provenance model (C-007)
**Scale/Scope**: current pack DRG ≈ 40 pack nodes + built-ins; single org-layer pack + built-ins

---

## Charter Check

Charter policies applied: `MODEL_DISCIPLINE` (mid-tier — Angular/TS component work and doc authoring are routine structured work), `APPSEC_COMPLIANCE` (no new external surface; loopback only), `AUDIENCE_ORIENTED_WRITING` (Track A onboarding guide directly governed by this + `user-guide-conventions`), `TRACEABLE_DECISIONS` (D3 choice + provenance model recorded below).

**Gates**: No violations. New runtime dependency (D3) is explicitly permitted by C-003 and recorded in Decisions.

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D-1 | **D3.js v7, force-directed layout** for the DRG visualizer (not hierarchical edge bundling) | The user referenced both D3 idioms. Force-directed with curved directional links (the "mobile patent suits" idiom) is the natural fit for **progressive fan-out** — nodes can be added incrementally and the simulation re-settles. Hierarchical edge bundling is radial and assumes the full node set up front, which conflicts with incremental expansion. |
| D-2 | Enhance the existing `GET /api/drg/` rather than add a new endpoint | The endpoint already returns `{nodes, edges}` merging pack + built-ins. Add: prefer `graph.yaml` over `fragment.yaml`, add `degraded: true` + note when only fragment is available (FR-006/007). Keeps one source of truth. |
| D-3 | Add `GET /api/drg/neighbourhood/:id` for fan-out | Returns the immediate neighbours (nodes + edges) of one node. The frontend calls this on each node click and merges the result, rather than loading the whole graph and hiding parts. Keeps initial payload small (FR-009/010) and fan-out fast (NFR-002). |
| D-4 | Provenance computed server-side as `{ layer: number, provenance: 'builtin'\|'org'\|'override' }` | FR-014 + C-007: a `layer` integer (built-in=0, org=1) future-proofs multi-pack without a schema change. The string `provenance` is a derived convenience for the badge. Computed by comparing pack artifact ids against built-in ids (override = same id in both layers). |
| D-5 | Onboarding guide IS the worked example of `user-guide-conventions` | Per spec C-004. One artifact serves both onboarding and styleguide demonstration. |

---

## Project Structure

```
docs/
└── ONBOARDING.md                         ← Track A (new)

tools/pack-dashboard/
├── server/src/
│   ├── routes/
│   │   ├── drg.routes.ts                 ← Track B: prefer graph.yaml, add degraded flag,
│   │   │                                    add GET /neighbourhood/:id
│   │   ├── drg.routes.test.ts            ← Track B: tests (new)
│   │   ├── builtin.routes.ts             ← Track C: add provenance to listing (extend)
│   │   └── artifacts.routes.ts           ← Track C: include provenance in artifact responses
│   └── services/
│       └── provenance.service.ts         ← Track C: compute layer/provenance (new)
└── src/app/
    ├── pages/
    │   └── drg/                          ← Track B: DRG visualizer page (new)
    │       ├── drg.component.ts
    │       └── drg-graph.component.ts    ← D3 force-directed renderer
    ├── components/
    │   └── provenance-badge/             ← Track C: Built-in/Org/Override badge (new)
    ├── services/
    │   └── drg.service.ts                ← Track B: graph + neighbourhood fetch (new)
    ├── models/
    │   └── drg.model.ts                  ← Track B: DRGNode, DRGEdge, Neighbourhood types (new)
    ├── app.routes.ts                     ← Track B: add /drg route
    └── layout/sidebar.component.ts       ← Track B: add DRG nav link
```

---

## Phase 0: Research

One genuine unknown — confirmed by reading the codebase, not external research:

- **D3 + Angular 18 integration**: D3 manipulates the DOM directly; Angular's change detection must not fight it. Standard resolution: render the D3 graph inside a dedicated component with an `@ViewChild` SVG element ref, run D3 in `ngAfterViewInit` / on data change, and keep the D3 subtree outside Angular's template bindings (Angular owns the container, D3 owns the SVG internals). No `research.md` required — this is established practice.

All other facts verified directly from `tools/pack-dashboard/` source (see Summary codebase reality check).

---

## Phase 1: Design

### Track A — Onboarding guide (`docs/ONBOARDING.md`)

Author per `user-guide-conventions.styleguide.yaml`:
- Branding header (HTML comment) + draft-token check
- "Who is this for?" persona table (new-engagement-engineer, team-lead)
- Prerequisites table (Artefactory access, API key, Python 3, shell, network)
- `### Step N:` sections with `Description | Notes` tables: installer one-liner → configure `.kittify/config.yaml` (`local_path` = `packs/` parent) → verify with `spec-kitty doctor doctrine`
- Troubleshooting section: C-001 (DRG compile), C-005/C-006 (charter sync footgun), C-007 (local_path parent), C-010 (rc32 ContextSources)
- Related Resources table: pack README, HOW_TO_USE, Artefactory URL, engineering-notes corrections

### Track B — DRG visualizer

**Backend** (`drg.routes.ts`):
```typescript
// GET /api/drg/  — enhance: prefer graph.yaml, add degraded flag
//   if pack/drg/graph.yaml exists → read it
//   else if fragment.yaml exists → read it, set degraded: true + note
//   response: { nodes, edges, degraded?: boolean, note?: string }

// GET /api/drg/neighbourhood/:id  — new
//   returns { node, neighbours: DRGNode[], edges: DRGEdge[] }
//   edges = all edges with from===id OR to===id; neighbours = the other endpoints
```

**Frontend**:
- `drg.model.ts`: `DRGNode { id, kind, label, layer? }`, `DRGEdge { from, to, relation }`, `Neighbourhood`
- `drg.service.ts`: `getSeed()` (graph filtered to org-charter directives), `getNeighbourhood(id)`
- `drg-graph.component.ts`: D3 force simulation; `@Input() nodes/edges`; node-kind colour from design tokens; curved directional links; `(nodeClick)` output
- `drg.component.ts`: page shell — loads seed, handles `nodeClick` → fetch neighbourhood → merge (dedupe by id) → re-render; detail panel with link to artifact browser
- `app.routes.ts` + sidebar: `/drg` route and nav link

### Track C — Built-in visibility

**Backend**:
- `provenance.service.ts`: `computeProvenance(packIds, builtinIds)` → for each artifact returns `{ layer, provenance }` (builtin=0, org=1, override=org id matching a builtin id)
- `builtin.routes.ts` / `artifacts.routes.ts`: include `provenance` + `layer` in responses; `GET /api/builtin/` rows gain `overridden_by_pack` / `enhanced_by_pack`
- `GET /api/builtin/inherited` (or query flag) → built-ins not overridden/enhanced by the pack (FR-015)

**Frontend**:
- `provenance-badge/`: input `layer` + `provenance` → renders Built-in / Org-layer / Override badge using existing `ks-badge` tokens
- Artifact list + detail pages: render the badge per artifact
- A filter/view for "inherited unchanged" built-ins

### Contract (new endpoints)

See `contracts/api-drg-neighbourhood.yaml` and `contracts/api-provenance.yaml`.

---

## Execution Lanes

```
Lane A (docs)        : WP-A  ONBOARDING.md                          [independent]
Lane B (DRG)         : WP-B1 backend (graph.yaml + degraded + neighbourhood)
                       WP-B2 frontend visualizer (depends on B1 contract)
Lane C (built-in)    : WP-C1 backend provenance service + endpoints
                       WP-C2 frontend provenance badges + inherited view (depends on C1)
```

Lane A is fully independent. Lanes B and C are independent of each other; within each lane the frontend WP depends on its backend WP's contract. ~5 WPs total.

---

## Validation Commands

```bash
cd tools/pack-dashboard && npx tsc --noEmit
cd tools/pack-dashboard && npx vitest run drg.routes
cd tools/pack-dashboard && npx vitest run provenance
# Track A: manual review against user-guide-conventions quality_test (6 checks)
```
