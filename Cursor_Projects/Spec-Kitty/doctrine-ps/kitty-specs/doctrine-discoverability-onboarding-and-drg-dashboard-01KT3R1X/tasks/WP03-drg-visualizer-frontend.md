---
work_package_id: WP03
title: DRG Visualizer Frontend
dependencies:
- WP02
requirement_refs:
- FR-008
- FR-009
- FR-010
- FR-011
- FR-012
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X
base_commit: 91825394247acae68f9ee956c180a65dc2d1d030
created_at: '2026-06-02T10:06:43.227657+00:00'
subtasks:
- T006
- T007
- T008
- T009
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "2264673"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/pages/drg/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/pages/drg/**
- tools/pack-dashboard/src/app/services/drg.service.ts
- tools/pack-dashboard/src/app/models/drg.model.ts
- tools/pack-dashboard/src/app/app.routes.ts
- tools/pack-dashboard/src/app/layout/sidebar.component.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load frontend-freddy
```

Wait for the profile confirmation, then continue with this work package.

---

## Objective

Build the read-only DRG visualizer page in the Angular dashboard: a D3 force-directed graph
that starts on a seed set (org-charter directives) and supports **progressive fan-out** —
clicking a node fetches its neighbourhood (via WP02's `GET /api/drg/neighbourhood/:id`) and
merges it into the visible graph without a full reload (FR-008, FR-009, FR-010, FR-011, FR-012).

Deliverables: a DRG model + service layer, a reusable D3 graph component, the page shell with a
detail panel, and the `/drg` route + sidebar nav link.

This is Track B frontend. It **depends on WP02** for the `GET /api/drg/` `degraded` enhancement
and the new `/neighbourhood/:id` endpoint. Honour the wire shapes WP02 actually ships
(`source`/`target`, `title`/`body_path`) and adapt to your model's `from`/`to`/`label` at the
service boundary.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: a worktree allocated per this WP's lane in `lanes.json` by
  `finalize-tasks`. Enter the path printed by
  `spec-kitty agent action implement WP03 --agent <your-name>`. Edit only inside that worktree.

## Context

Read these before writing any code:

- **Angular 18 standalone components.** `app.routes.ts` uses lazy `loadComponent`. Components
  are standalone (`standalone: true`, explicit `imports`). See
  `src/app/pages/charter/charter.component.ts` and `src/app/layout/sidebar.component.ts` for the
  house style.
- **D3 is a NEW dependency (C-003 permits it).** Add `d3` (v7) to
  `tools/pack-dashboard/package.json` dependencies and `@types/d3` to devDependencies, then
  `npm install`. D3 is the only permitted new runtime dep (C-003); record it in your activity
  log. Reference idiom: D3 "mobile patent suits" force-directed example (curved directional
  links with arrowhead markers).
- **D3 ↔ Angular boundary (Phase 0 of plan.md):** Angular owns the container element; D3 owns
  the SVG subtree. Get the SVG via `@ViewChild`, run D3 in `ngAfterViewInit` and re-run on
  `@Input` change (`ngOnChanges`). Do NOT put D3-managed SVG children in the Angular template —
  D3 mutates them directly, and Angular change detection must not fight it.
- **⚠ Wire shape vs model (from WP02):** the backend `GET /api/drg/` and `/neighbourhood/:id`
  return edges as `{ source, target, relation }` and nodes as `{ id, kind, title, body_path,
  source?: 'builtin' }`. Your `drg.model.ts` uses `DRGEdge { from, to, relation }` and
  `DRGNode { id, kind, label, layer? }`. Map at the service boundary: `from = wire.source`,
  `to = wire.target`, `label = wire.title ?? wire.id`. Note D3 also uses `source`/`target` for
  links — keep the *wire* `source`/`target` and your *model* `from`/`to` clearly separate, and
  build D3 link objects from `from`/`to`.
- **There is already a `src/app/services/drg.service.ts`** with `getRelated()` used by the
  artifact-detail "Related Artifacts" view. You own this file — **extend it, do not delete
  `getRelated()`** (it has a live consumer). Add `getSeed()` and `getNeighbourhood(id)`.
- **Design tokens (C-006):** node-kind colours reuse existing dashboard tokens. Look at the
  badge/colour usage in `src/app/components/charter-badge/charter-badge.component.ts` and the
  global styles for `--rn-color-*` custom properties. Do NOT introduce a new palette; map each
  artifact kind (directives, tactics, styleguides, toolguides, paradigms, procedures,
  agent_profiles) to an existing token.
- **Routing ordering caution:** `app.routes.ts` has a comment warning that route order is
  load-bearing (the `artifacts/builtin/...` route must precede `artifacts/:kind`). Add `/drg`
  as a sibling top-level route; do not reorder the existing artifact routes.
- **Validation:** `cd tools/pack-dashboard && npx tsc --noEmit` is the frontend gate (NFR-003).
  No Angular TestBed specs are in scope for this WP.

---

## Subtask Guidance

### Subtask T006 — DRG model + service layer

**Purpose**: Define the frontend types and the fetch layer that adapts the WP02 wire shape into
the model the components consume, including the seed-set filter and neighbourhood fetch.

**Steps**:

1. Create `src/app/models/drg.model.ts`:
   ```ts
   export interface DRGNode { id: string; kind: string; label: string; layer?: number; }
   export interface DRGEdge { from: string; to: string; relation: string; }
   export interface Neighbourhood { node: DRGNode; neighbours: DRGNode[]; edges: DRGEdge[]; }
   export interface DRGGraph { nodes: DRGNode[]; edges: DRGEdge[]; degraded?: boolean; note?: string; }
   ```
2. Extend `src/app/services/drg.service.ts` (keep the existing `getRelated()` and its
   interfaces — they have a live consumer; you may re-export or alias as needed):
   - A private adapter mapping wire `{ source, target, relation }` → model `{ from, to, relation }`
     and wire node `{ id, kind, title, body_path }` → model `{ id, kind, label: title ?? id, layer }`.
   - `getSeed(): Observable<DRGGraph>` — fetch `GET /api/drg/`, adapt, then **filter to the seed
     set**: the org-charter required directives. Resolve the seed by intersecting graph nodes
     with the charter directive ids. If a charter source is not readily available, fall back to
     filtering `kind === 'directives'` as the seed and leave a clearly-commented TODO to refine
     to charter-required directives. Preserve `degraded`/`note` on the returned `DRGGraph`.
   - `getNeighbourhood(id: string): Observable<Neighbourhood>` — fetch
     `GET /api/drg/neighbourhood/:id`, adapt node + neighbours + edges into the model shape.
3. Use `HttpClient` and `rxjs` `map`, matching the existing service style (`private readonly
   base = '/api'`).

**Files**:
- `src/app/models/drg.model.ts` (new)
- `src/app/services/drg.service.ts` (extend)

**Validation**:
- [ ] `drg.model.ts` exports `DRGNode`, `DRGEdge`, `Neighbourhood`, `DRGGraph`
- [ ] `getSeed()` returns charter-directive (or directives-kind) seed nodes + their edges
- [ ] `getNeighbourhood(id)` calls `/api/drg/neighbourhood/:id` and adapts to the model
- [ ] Wire `source`/`target`/`title` mapped to model `from`/`to`/`label`
- [ ] Existing `getRelated()` is preserved and still compiles
- [ ] `npx tsc --noEmit` clean

---

### Subtask T007 — `drg-graph.component.ts` (D3 force-directed renderer)

**Purpose**: A reusable, read-only D3 force-directed graph component that renders `@Input` nodes
and edges with node-kind colour coding and curved directional links, and emits a `(nodeClick)`
event. It owns the SVG; the page (T008) owns data and interaction.

**Steps**:

1. Create `src/app/pages/drg/drg-graph.component.ts` (standalone). Template is a single
   container with an `<svg>` referenced via `@ViewChild`:
   ```ts
   @Input() nodes: DRGNode[] = [];
   @Input() edges: DRGEdge[] = [];
   @Output() nodeClick = new EventEmitter<DRGNode>();
   @ViewChild('svgRef', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
   ```
2. **Lifecycle / boundary:** build the D3 simulation in `ngAfterViewInit`; on `ngOnChanges`
   (when `nodes`/`edges` change) re-bind the data and restart/re-heat the simulation. Keep all
   SVG children D3-managed — the Angular template must not declare `<circle>`/`<line>` nodes.
3. **Force simulation:** `d3.forceSimulation(nodes)` with `forceLink(edges).id(d => d.id)`,
   `forceManyBody()`, `forceCenter()`. D3 link objects reference nodes by `from`/`to`; map them
   to D3's expected `source`/`target` when constructing the link force (D3 mutates these into
   node references). Keep the model's `from`/`to` as the canonical identifiers.
4. **Curved directional links** (the "mobile patent suits" idiom): draw each edge as an SVG
   `path` with an arc (`A`) curve, and define `<marker>` arrowheads in `<defs>` so direction is
   visible. Relation can label the edge (optional title/tooltip).
5. **Node-kind colour (C-006):** map `node.kind` → an existing `--rn-color-*` design token. Read
   the tokens from the global stylesheet; do not introduce new colours. Provide a small,
   documented kind→token lookup.
6. **Interaction:** drag behaviour (`d3.drag`) for repositioning; on node click call
   `this.nodeClick.emit(node)` inside `this.ngZone.run(...)` (or via a bound handler) so Angular
   notices the event. **Read-only** — no add/edit/delete affordances (FR-012).
7. **Cleanup:** stop the simulation in `ngOnDestroy`.

**Files**:
- `src/app/pages/drg/drg-graph.component.ts` (new)

**Validation**:
- [ ] Standalone component with `@Input() nodes/edges`, `@Output() nodeClick`
- [ ] D3 runs in `ngAfterViewInit`; re-binds on `ngOnChanges`; SVG children are D3-managed only
- [ ] Force simulation with link/charge/center forces; links reference nodes correctly
- [ ] Curved directional links with `<marker>` arrowheads
- [ ] Node colour comes from existing `--rn-color-*` tokens (no new palette)
- [ ] `nodeClick` emits inside Angular's zone; no edit controls present
- [ ] Simulation stopped in `ngOnDestroy`; `npx tsc --noEmit` clean

---

### Subtask T008 — `drg.component.ts` page (seed load, fan-out merge, detail panel)

**Purpose**: The page shell that loads the seed graph, handles node clicks by fetching and
**merging** the neighbourhood (deduped, no full reload), and shows a read-only detail panel with
a link into the artifact browser.

**Steps**:

1. Create `src/app/pages/drg/drg.component.ts` (standalone). It hosts `<app-drg-graph>` and a
   detail panel, plus a degraded-state banner.
2. **On init:** call `drgService.getSeed()`. Store `nodes`/`edges` in component state. If the
   response is `degraded`, render a non-blocking banner showing the `note` (FR-007 surfaced to
   the user).
3. **On `(nodeClick)`:**
   - Set the clicked node as the detail-panel selection.
   - Call `drgService.getNeighbourhood(node.id)`.
   - **Merge** the returned `neighbours` into `nodes` deduped by `id` (skip any already present),
     and merge `edges` deduped by an `(from,to,relation)` key. Reassign the arrays (new array
     references) so the `drg-graph` component's `ngOnChanges` fires and the simulation re-heats —
     **do not** reload the whole graph (FR-010, NFR-002).
4. **Detail panel (FR-011):** show the selected node's `id`, `kind`, and `body_path`/label, plus
   a link to open the artifact in the existing browser. Build the link to match the existing
   routes: `['/artifacts', kind, id]` for pack artifacts, or `['/artifacts','builtin', kind, id]`
   for built-in nodes (check how the node distinguishes built-in — WP02 carries `source:
   'builtin'` on the wire; preserve that hint through the service if you need it for routing).
5. **Read-only (FR-012):** no controls to create/edit/delete nodes or edges anywhere on the page.
6. Keep DOM/CSS consistent with the dashboard shell (reuse `rn-*` classes seen in
   `charter.component.ts`).

**Files**:
- `src/app/pages/drg/drg.component.ts` (new)

**Validation**:
- [ ] Page loads the seed via `getSeed()` and renders `<app-drg-graph>`
- [ ] Degraded `note` is surfaced as a non-blocking banner
- [ ] Node click fetches neighbourhood and merges nodes/edges deduped, without full reload
- [ ] Merge reassigns array references so the graph component re-renders
- [ ] Detail panel shows id/kind/body_path + a working link to the artifact browser
- [ ] No create/edit/delete controls anywhere (read-only)
- [ ] `npx tsc --noEmit` clean

---

### Subtask T009 — `/drg` route + sidebar nav link

**Purpose**: Make the visualizer reachable: a lazy `/drg` route and a Charter-style nav link in
the sidebar (FR-008).

**Steps**:

1. In `src/app/app.routes.ts`, add a top-level route as a sibling of the existing ones (do NOT
   reorder the artifact routes guarded by the ordering comment):
   ```ts
   {
     path: 'drg',
     loadComponent: () =>
       import('./pages/drg/drg.component').then(m => m.DrgComponent)
   },
   ```
2. In `src/app/layout/sidebar.component.ts`, add a nav link in the top "Navigation" section,
   styled exactly like the existing Charter / Organisational Bindings links:
   ```html
   <a class="rn-sidebar__nav-item"
      [routerLink]="['/drg']"
      routerLinkActive="active">
     DRG Graph
   </a>
   ```
3. Confirm `provideHttpClient` is already wired (the existing services use `HttpClient`, so it
   is). Build the app to confirm the lazy route resolves.

**Files**:
- `src/app/app.routes.ts` (add `/drg` route)
- `src/app/layout/sidebar.component.ts` (add nav link)

**Validation**:
- [ ] `/drg` lazy route added without reordering the artifact routes
- [ ] Sidebar shows a "DRG Graph" link in the Navigation section, matching existing link style
- [ ] `routerLinkActive="active"` applied
- [ ] `npx tsc --noEmit` clean and the app builds

---

## Definition of Done

- D3 v7 (+ `@types/d3`) added to `package.json` and installed (the one permitted new dep, C-003).
- `drg.model.ts` and an extended `drg.service.ts` (`getSeed`, `getNeighbourhood`,
  `getRelated` preserved) exist; the wire shape is adapted to the model at the service boundary.
- `drg-graph.component.ts` renders a D3 force-directed graph with node-kind colours from existing
  tokens, curved directional links, drag, and a `(nodeClick)` output; SVG is D3-managed.
- `drg.component.ts` loads the seed, surfaces the degraded note, and performs deduped fan-out
  merges on node click without a full reload; the detail panel links into the artifact browser.
- `/drg` route + sidebar link added without breaking existing route ordering.
- The visualizer is entirely read-only (FR-012).
- `npx tsc --noEmit` clean; the Angular build succeeds (NFR-003).

## Risks

| Risk | Mitigation in this WP |
|---|---|
| D3 and Angular change detection fighting over the SVG | T007 boundary rule: Angular owns the container, D3 owns the SVG subtree; run D3 in lifecycle hooks |
| Confusing wire `source`/`target` with D3 link `source`/`target` and model `from`/`to` | T006 adapter maps wire→model at the boundary; T007 builds D3 links from model `from`/`to` |
| Deleting `getRelated()` and breaking the artifact-detail Related view | T006 preserves `getRelated()`; it is a live consumer |
| Fan-out reloading the whole graph (NFR-002 miss) | T008 merges deduped neighbourhood and reassigns arrays; no full reload |
| New colour palette violating C-006 | T007 maps kinds to existing `--rn-color-*` tokens only |
| Reordering artifact routes and breaking `artifacts/builtin/...` matching | T009 adds `/drg` as a sibling; does not touch artifact route order |
| `nodeClick` not detected by Angular | T007 emits inside the Angular zone |

## Reviewer Guidance

Review priorities (in order):

1. **Read-only** (FR-012) — confirm there is no UI affordance to create, edit, or delete any
   node or edge anywhere in the page or graph component.
2. **Fan-out without reload** (FR-010) — confirm node click calls `getNeighbourhood` and merges
   deduped into existing state; confirm it does NOT re-fetch the whole graph.
3. **D3/Angular boundary** — D3 work in lifecycle hooks; no D3-managed SVG elements declared in
   the Angular template; simulation cleaned up in `ngOnDestroy`.
4. **Wire/model adaptation** — service maps `source/target/title` → `from/to/label`; existing
   `getRelated()` untouched and still used by artifact-detail.
5. **Design tokens** (C-006) — node colours come only from existing `--rn-color-*` tokens.
6. **Routing** — `/drg` added without reordering the ordering-sensitive artifact routes; sidebar
   link matches existing style.
7. **Build gates** — `npx tsc --noEmit` clean and the app builds (NFR-003); D3 recorded as the
   single new dependency (C-003).
8. **No regressions** — diff stays within the owned files.

## Activity Log

- 2026-06-02T10:06:44Z – claude:sonnet:frontend-freddy:implementer – shell_pid=2226210 – Started implementation via action command
- 2026-06-02T10:13:04Z – claude:sonnet:frontend-freddy:implementer – shell_pid=2226210 – Ready for review: D3 v7 force-directed DRG visualizer. drg.model.ts (DRGNode/DRGEdge/Neighbourhood/DRGGraph) + drg.service.ts extended with getSeed()/getNeighbourhood() (getRelated preserved). Service boundary adapts wire {source,target,relation}->model {from,to,relation} and node title->label. drg-graph.component.ts: D3 owns SVG subtree (ngAfterViewInit/ngOnChanges, runOutsideAngular, ngOnDestroy stops sim), curved directional links with arrowhead marker, node-kind colours from existing --rn-color-* tokens (C-006), drag, (nodeClick) emitted inside ngZone.run. drg.component.ts: seed load, deduped fan-out merge with new array refs (no full reload), degraded banner, read-only detail panel linking to artifact browser. /drg route added as sibling (artifact route order untouched) + sidebar nav link. d3@^7.9.0 + @types/d3 added (C-003). VALIDATION: npx tsc --noEmit exit 0; ng build (development) succeeded with drg-component lazy chunk. No lint target configured in this project (ng lint -> 'Cannot find lint target'), so no linter covers the diff.
- 2026-06-02T10:13:43Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=2264673 – Started review via action command
