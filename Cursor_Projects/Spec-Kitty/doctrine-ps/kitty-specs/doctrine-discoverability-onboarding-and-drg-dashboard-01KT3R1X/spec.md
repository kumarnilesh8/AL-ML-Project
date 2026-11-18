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

# Doctrine Discoverability & DRG Dashboard

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X` |
| Mission Type | software-dev |
| Target Branch | `overhaul/migrate_to_kitty` |
| Status | In Specification |

---

## Intent Summary

The doctrine pack and its governance relationship graph (DRG) are hard to discover.
Two audiences are underserved:

1. **New engagement teams** have no single onboarding path. The knowledge of how to
   install, configure, and use the pack — and the gotchas surfaced during the
   ai-initiatives enrollment (C-001 through C-010) — lives scattered across engineering
   notes. There is no curated guide.

2. **Dashboard users** see only the flat org-layer pack. They cannot see how artifacts
   relate to each other (the DRG edges: `refines`, `delegates_to`, `suggests`, etc.), and
   they cannot see how the org-layer pack sits alongside the spec-kitty built-in artifacts
   it enhances or overrides.

This mission delivers three things:

- **Onboarding guide** — a single authoritative guide for enrolling a new project into the
  doctrine pack, authored as a **worked example of the `user-guide-conventions` styleguide**
  (persona table, prerequisites table, numbered step tables, related-resources table). It
  folds in the C-001→C-010 enrollment learnings as troubleshooting/gotcha content.

- **DRG graph visualizer** — an interactive, read-only graph view in the dashboard that
  renders the pack's DRG nodes and edges. It starts focused (one node or a small seed set)
  and supports **progressive fan-out**: clicking a node expands its immediate neighbourhood,
  iteratively deepening the visible graph. Visual style follows D3 force-directed / hierarchical
  edge-bundling idioms (curved directional edges, node-kind colour coding).

- **Built-in doctrine visibility** — the dashboard surfaces spec-kitty built-in artifacts
  alongside the org-layer pack, so a user can see what the pack enhances, overrides, or adds.

Primary actor: doctrine curator / new engagement engineer (local, authenticated-by-default
dashboard user).

---

## Scope

**In scope:**
- Onboarding guide markdown authored per `user-guide-conventions` styleguide
- Backend endpoint exposing the DRG graph (nodes + edges) for visualization
- Backend endpoint exposing built-in artifacts (kind, id, whether org-layer enhances/overrides it)
- Frontend DRG graph visualizer page with progressive fan-out interaction
- Frontend built-in doctrine visibility (a view or augmentation of existing artifact lists)
- A "Built-in / Org-layer / Override" provenance indicator on artifacts

**Out of scope:**
- Editing the DRG graph through the UI (read-only this mission; fragment.yaml stays the authoring surface)
- Editing built-in artifacts (they are spec-kitty-shipped, read-only)
- Automated DRG compilation in CI (separate distribution-hardening concern)
- Multi-pack / multi-org graph rendering (single org-layer pack + built-ins only)
- Real-time graph updates (graph is loaded per page visit; no live sync)

---

## Assumptions

1. The DRG graph data is available from `pack/drg/graph.yaml` (compiled) — the backend reads
   this file. If absent, the backend falls back to `pack/drg/fragment.yaml` and reports the
   degraded state rather than failing.
2. Built-in artifact metadata is resolvable via the spec-kitty doctrine service or by reading
   the shipped built-in directories; the backend abstracts the source.
3. The onboarding guide lives at `docs/ONBOARDING.md` (or `docs/onboarding/`) and is the
   canonical worked example referenced by `user-guide-conventions.styleguide.yaml`.
4. The DRG visualizer is a new dashboard page/route; it does not replace the existing artifact
   browser.
5. Progressive fan-out means: initial render shows a seed (e.g. org-charter directives or a
   chosen root); each node click loads and merges that node's adjacent nodes/edges into the
   visible graph without a full reload.
6. Node-kind colour coding reuses the existing dashboard design tokens (no new palette).

---

## Functional Requirements

### Track A — Onboarding Guide (docs)

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | An onboarding guide exists at `docs/ONBOARDING.md` authored per the `user-guide-conventions` styleguide: it opens with a "Who is this for?" persona table naming at least the new-engagement-engineer and team-lead personas before the first instruction. | Approved | Must |
| FR-002 | The guide presents prerequisites as a scannable table (one requirement per row with reference/description), not prose. | Approved | Must |
| FR-003 | The guide presents the install + configure + verify workflow as numbered `### Step N:` sections, each with a `Description \| Notes` table, covering: run the installer, configure `.kittify/config.yaml` (`local_path` parent rule), and verify with `spec-kitty doctor doctrine`. | Approved | Must |
| FR-004 | The guide includes a Troubleshooting section folding in the enrollment gotchas (C-001 DRG compilation, C-005/C-006 charter sync footgun, C-007 local_path parent rule, C-010 rc32 schema) with symptom → cause → workaround for each. | Approved | Must |
| FR-005 | The guide ends with a Related Resources table linking the pack README, HOW_TO_USE, Artefactory location, and the engineering-notes challenge corrections; and passes the `user-guide-conventions` quality_test (persona visible, prerequisites table, step tables, related-resources table, no placeholder tokens, branding header present). | Approved | Must |

### Track B — DRG Graph Visualizer (dashboard)

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-006 | The backend exposes `GET /api/drg/graph` returning the pack DRG as `{ nodes: [{ id, kind, label }], edges: [{ from, to, relation }] }`, read from `pack/drg/graph.yaml`. | Approved | Must |
| FR-007 | If `graph.yaml` is absent, `GET /api/drg/graph` falls back to compiling/reading `fragment.yaml` and includes a `degraded: true` flag plus a human-readable note in the response; it never returns 500 solely because the compiled graph is missing. | Approved | Must |
| FR-008 | The dashboard exposes a **DRG** navigation tab/route rendering the graph as an interactive node-link diagram with node-kind colour coding (directives, tactics, styleguides, toolguides, paradigms, procedures, agent_profiles) and directional edges labelled by relation. | Approved | Must |
| FR-009 | The graph starts focused on a seed set (org-charter required directives, or a configurable root) rather than rendering all nodes at once. | Approved | Must |
| FR-010 | Clicking a node performs **progressive fan-out**: the node's immediate neighbours (along any edge) are merged into the visible graph without a full page reload; already-visible nodes are not duplicated. | Approved | Must |
| FR-011 | Clicking a node also surfaces its detail (id, kind, body path) and provides a link to open the artifact in the existing artifact browser. | Approved | Should |
| FR-012 | The visualizer is read-only: no node or edge can be created, edited, or deleted through the UI. | Approved | Must |

### Track C — Built-in Doctrine Visibility (dashboard)

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-013 | The backend exposes `GET /api/builtin-artifacts` returning spec-kitty built-in artifacts as `{ kind, id, title, overridden_by_pack: boolean, enhanced_by_pack: boolean }`. | Approved | Must |
| FR-014 | Each artifact rendered in the dashboard carries a provenance indicator: **Built-in**, **Org-layer** (pack-only), or **Override** (pack overrides a built-in of the same id). The indicator carries a `layer` identifier (built-in = layer 0, org pack = layer 1), not a hardcoded 3-value enum, so additional pack layers can be expressed later without a schema change. | Approved | Must |
| FR-015 | The dashboard provides a view (filter or dedicated list) that shows built-in artifacts the org-layer pack does NOT override or enhance — i.e. what a project inherits unchanged from spec-kitty. | Approved | Should |

---

## Non-Functional Requirements

| ID | Description | Threshold | Status |
|---|---|---|---|
| NFR-001 | `GET /api/drg/graph` responds within 300 ms for the current pack graph (≤ 100 nodes, ≤ 200 edges) on a developer workstation. | Under 300 ms | Approved |
| NFR-002 | Progressive fan-out merges a node's neighbourhood and re-renders within 200 ms of the click for graphs up to 100 visible nodes. | Under 200 ms | Approved |
| NFR-003 | TypeScript compiles without errors; Angular production build succeeds after all changes. | Zero compilation errors | Approved |
| NFR-004 | The onboarding guide passes the `user-guide-conventions` quality_test (6 checks) on review. | All 6 checks pass | Approved |
| NFR-005 | The DRG and built-in endpoints are read-only and bind to the same loopback-only server (C-007); they perform no writes to any config or pack file. | Zero writes | Approved |

---

## Constraints

| ID | Description | Status |
|---|---|---|
| C-001 | The DRG visualizer is read-only. `pack/drg/fragment.yaml` remains the sole authoring surface for the graph; the UI must not write to it. | Approved |
| C-002 | Built-in artifacts are spec-kitty-shipped and read-only; the dashboard must not modify them. | Approved |
| C-003 | No new runtime npm dependencies without justification. A D3 (or equivalent) graph library is permitted as it is the standard tool for this visualization class; record the choice in the plan. | Approved |
| C-004 | The onboarding guide must be authored per `user-guide-conventions.styleguide.yaml` — it is the canonical worked example of that styleguide, not an ad-hoc document. | Approved |
| C-005 | DRG and built-in endpoints reuse the existing Express server and its loopback binding; no new server process or port. | Approved |
| C-006 | Node-kind colours reuse existing dashboard design tokens; no new colour palette is introduced. | Approved |
| C-007 | The provenance / layer model must not assume exactly one org layer. Built-in (layer 0) and the org pack (layer 1) are the only layers rendered this mission, but additional pack layers must be expressible without a schema change. Full multi-charter / multi-pack composition and rendering remains out of scope (tracked under MIGRATION-1952). | Approved |

---

## Domain Language

| Term | Definition |
|---|---|
| **DRG** | Doctrine Relationship Graph — the node/edge graph of doctrine artifacts and their relationships (`refines`, `delegates_to`, `suggests`, `requires`, `enhances`, `overrides`, etc.), authored in `pack/drg/fragment.yaml` and compiled to `pack/drg/graph.yaml`. |
| **Progressive fan-out** | An interaction where the graph starts at a focused seed and each node click expands that node's immediate neighbourhood into the visible graph, iteratively deepening. |
| **Provenance** | Whether an artifact is a spec-kitty **Built-in**, an **Org-layer** pack artifact with no built-in counterpart, or an **Override** of a built-in of the same id. |
| **Built-in artifact** | A doctrine artifact shipped with spec-kitty (not authored in this pack). |
| **Seed set** | The initial set of nodes rendered before any fan-out — defaults to org-charter required directives. |

---

## User Scenarios

### Scenario 1 — New engineer onboards a project

1. A new engagement engineer needs to install the doctrine pack into their repo.
2. They open `docs/ONBOARDING.md`.
3. The persona table confirms the guide is for them; prerequisites are scannable in a table.
4. They follow the numbered steps (install → configure `local_path` parent → verify).
5. They hit the charter-sync footgun; the Troubleshooting section explains it and the workaround.
6. They finish with a working pack install and `spec-kitty doctor doctrine` reporting the expected counts.

### Scenario 2 — Curator explores artifact relationships

1. A curator opens the **DRG** tab in the dashboard.
2. The graph renders focused on the org-charter directives (seed set).
3. They click `CONTEXT_AWARE_DESIGN`; its neighbours (`cloud-native-design-review` tactic,
   `c4-cloud-native-mapping` styleguide) fan out and merge into the view.
4. They click the tactic node; its detail panel shows kind and body path with a link to open it.
5. No edit controls are present — the view is read-only.

### Scenario 3 — Curator checks what a project inherits unchanged

1. A curator wants to know which spec-kitty built-ins the pack leaves untouched.
2. They open the built-in visibility view.
3. Each artifact shows a provenance badge: Built-in, Org-layer, or Override.
4. They filter to "Built-in, not overridden or enhanced" to see the inherited baseline.

---

## Success Criteria

- A new engineer can install and verify the pack end-to-end by following `docs/ONBOARDING.md` alone, without consulting scattered engineering notes.
- The onboarding guide passes all six `user-guide-conventions` quality checks on review.
- A curator can start from the org-charter directives in the DRG tab and reach any related artifact by progressively clicking through the graph, with each expansion completing in under 200 ms.
- Every artifact in the dashboard displays a correct provenance indicator (Built-in / Org-layer / Override).
- A curator can identify, in one view, which spec-kitty built-ins the pack does not modify.
- TypeScript compiles clean and the DRG/built-in endpoints perform zero writes.
