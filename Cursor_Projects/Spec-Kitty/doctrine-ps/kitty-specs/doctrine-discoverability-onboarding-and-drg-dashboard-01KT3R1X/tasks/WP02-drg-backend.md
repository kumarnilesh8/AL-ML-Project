---
work_package_id: WP02
title: DRG Backend (graph + neighbourhood)
dependencies: []
requirement_refs:
- FR-006
- FR-007
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X
base_commit: 2b57005fe2958cb660a26cb72cd0dc12480bbe94
created_at: '2026-06-02T09:59:26.542748+00:00'
subtasks:
- T003
- T004
- T005
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "2209142"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/routes/drg.routes.ts
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/routes/drg.routes.ts
- tools/pack-dashboard/server/src/routes/drg.routes.test.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load node-norris
```

Wait for the profile confirmation, then continue with this work package.

---

## Objective

Enhance the existing DRG backend (`tools/pack-dashboard/server/src/routes/drg.routes.ts`)
so the visualizer (WP03) has the data it needs:

- `GET /api/drg/` prefers the compiled `pack/drg/graph.yaml`, falls back to
  `fragment.yaml` with a `degraded: true` flag + human-readable `note`, and **never** 500s
  solely because `graph.yaml` is missing (FR-006, FR-007, D-2).
- A new `GET /api/drg/neighbourhood/:id` returns `{ node, neighbours, edges }` for one node,
  powering progressive fan-out (FR-010, D-3).
- Vitest coverage in `drg.routes.test.ts`.

This is Track B backend. It is independent of every other WP. WP03 (frontend) depends on the
**contract** this WP establishes (`contracts/api-drg-neighbourhood.yaml`), so honour the
contract field names exactly.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: a worktree allocated per this WP's lane in `lanes.json` by
  `finalize-tasks`. Enter the path printed by
  `spec-kitty agent action implement WP02 --agent <your-name>`. Edit only inside that worktree.

## Context

Read these before writing any code — the existing file already does more than the contract
summary implies, and there is a **field-naming nuance you must resolve**:

- **`tools/pack-dashboard/server/src/routes/drg.routes.ts` already exists** and currently:
  - `GET /coverage` — computes unlinked nodes from `fragment.yaml`.
  - `GET /` — reads `fragment.yaml` only, parses `nodes`/`edges`, merges built-in scanner
    artifacts (via `getAll` from `builtin-scanner.service`) as extra nodes carrying
    `source: 'builtin'`, returns `{ nodes, edges }`. It already 500s on parse failure but
    returns empty arrays when the file is simply absent.
- **Internal edge shape is `{ source, target, relation }`** (see the `DRGEdge` interface in
  the file and the same shape in `src/app/services/drg.service.ts`). The contract
  `contracts/api-drg-neighbourhood.yaml` documents edges as `{ from, to, relation }` and nodes
  as `{ id, kind, label, layer? }`. **The existing wire shape uses `source`/`target` and
  `title`/`body_path`.** Do NOT rename existing fields and break the live
  `getRelated()` consumer in `drg.service.ts` (which reads `edge.source`/`edge.target`). Keep
  the existing `{ source, target, relation }` edge shape and `{ id, kind, title, body_path }`
  node shape on the wire; the WP03 model layer adapts `from`/`to`/`label` on the frontend.
  If you add `from`/`to` aliases, add them additively — never remove `source`/`target`.
  Record this contract-vs-implementation reconciliation in your activity log.
- **`pack/drg/graph.yaml`** is the compiled distribution artifact;
  **`pack/drg/fragment.yaml`** is the authored source. Per the 2026-06-01 engineering note
  (A-1), authors edit `fragment.yaml`; `graph.yaml` is generated and committed. Prefer
  `graph.yaml` when present; it has the same `nodes`/`edges` structure.
- **Config** — `getPackRoot()` from `../config` gives the pack root; DRG files live under
  `<packRoot>/drg/`. Built-ins come from `getAll()` in
  `../services/builtin-scanner.service`.
- **Read-only (NFR-005, C-001)** — no writes to `graph.yaml` or `fragment.yaml`.
- **Test runner** — Vitest. Look for an existing `*.routes.test.ts` (e.g. another route's test)
  to copy the supertest + express app bootstrap pattern. Validation commands:
  `cd tools/pack-dashboard && npx vitest run drg.routes` and `npx tsc --noEmit`.

---

## Subtask Guidance

### Subtask T003 — Prefer `graph.yaml`, add `degraded` fallback to `GET /`

**Purpose**: Make `GET /api/drg/` serve the compiled graph when available and degrade
gracefully (not fatally) to the fragment, so the visualizer always has data and can show a
"compiled graph missing" banner (FR-006, FR-007, D-2).

**Steps**:

1. Extract the file-read into a small helper that, given a path, reads and parses a DRG YAML
   file into `{ nodes, edges }`. Reuse the existing parse logic (`yaml.load`, cast `nodes`/`edges`
   with `?? []`).
2. In the `GET /` handler, implement this resolution order:
   - Compute `graphPath = path.join(getPackRoot(), 'drg', 'graph.yaml')` and
     `fragmentPath = path.join(getPackRoot(), 'drg', 'fragment.yaml')`.
   - If `graph.yaml` exists → read it; `degraded` is `false` (omit the flag or set `false`).
   - Else if `fragment.yaml` exists → read it; set `degraded: true` and
     `note: 'Served from fragment.yaml — compiled graph.yaml not found. Relations are authored, not compiled.'`
   - Else → return `{ nodes: [], edges: [], degraded: true, note: 'No DRG source found.' }`
     (still 200, not 500).
3. Keep the built-in merge exactly as it is today: after loading pack nodes, append built-in
   scanner artifacts not already present (by id) as nodes carrying `source: 'builtin'`. The
   merge must run regardless of which source file was used.
4. **Never 500 because `graph.yaml` is missing** (contract invariant). A 500 is only acceptable
   on an actual YAML *parse* failure of whichever file was read. Preserve the existing
   `try/catch → 500 { error }` for parse failures.
5. Response shape (200):
   ```ts
   { nodes: DRGNode[], edges: DRGEdge[], degraded?: boolean, note?: string }
   ```
   where `DRGNode` and `DRGEdge` keep their **existing** field names (`id/kind/title/body_path`
   and `source/target/relation`). Do not rename.

**Files**:
- `tools/pack-dashboard/server/src/routes/drg.routes.ts` (modify `GET /`)

**Validation**:
- [ ] `graph.yaml` is read in preference to `fragment.yaml` when both exist
- [ ] Falling back to `fragment.yaml` sets `degraded: true` and a `note`
- [ ] Missing `graph.yaml` never produces a 500
- [ ] An actual YAML parse error still produces `500 { error }`
- [ ] Built-in node merge behaviour is unchanged
- [ ] Existing `{ source, target, relation }` / `{ id, kind, title, body_path }` shapes preserved
- [ ] `npx tsc --noEmit` clean

---

### Subtask T004 — Add `GET /api/drg/neighbourhood/:id`

**Purpose**: Provide a small, fast endpoint returning just the immediate neighbourhood of one
node so the frontend can fan out a node click without reloading the whole graph (FR-010,
NFR-002, D-3).

**Steps**:

1. Add `router.get('/neighbourhood/:id', ...)`. Register it **before** any wildcard route that
   could shadow it (the existing routes are `/coverage` and `/`, so ordering is fine, but place
   the new route alongside `/coverage`).
2. Load the full node+edge set using the **same resolution helper from T003** (graph.yaml
   preferred, fragment fallback, plus the built-in merge) so neighbourhood lookups see the same
   node universe as `GET /`.
3. Resolve the target node:
   - Look up `:id` in the merged node list. If not found → `404 { error: 'Node <id> not found in DRG' }`.
4. Compute the neighbourhood:
   - `incidentEdges` = all edges where `edge.source === id || edge.target === id`.
   - `neighbourIds` = the set of the *other* endpoint of each incident edge, excluding `id`
     itself, **deduplicated**.
   - `neighbours` = the node objects for those ids (skip any id that has no matching node).
5. Response shape (200) — match the contract semantics while preserving internal field names:
   ```ts
   {
     node: DRGNode,            // the :id node
     neighbours: DRGNode[],    // deduped, excludes :id
     edges: DRGEdge[]          // only edges incident to :id ({ source, target, relation })
   }
   ```
6. **Invariants** (from the contract): edges returned are only those incident to `:id`;
   `neighbours` excludes `:id` and contains no duplicates; read-only.

**Files**:
- `tools/pack-dashboard/server/src/routes/drg.routes.ts` (add neighbourhood route)

**Validation**:
- [ ] `GET /neighbourhood/:id` returns `{ node, neighbours, edges }`
- [ ] `edges` contains only edges with `source===id` or `target===id`
- [ ] `neighbours` excludes `:id` and is deduplicated
- [ ] Unknown id → `404 { error }`
- [ ] Uses the same source-resolution + built-in merge as `GET /`
- [ ] `npx tsc --noEmit` clean

---

### Subtask T005 — Vitest tests in `drg.routes.test.ts`

**Purpose**: Lock the new behaviour with tests that survive refactors: graph-vs-fragment
preference, the degraded flag, neighbourhood incidence, and the 404 path.

**Steps**:

1. Create `tools/pack-dashboard/server/src/routes/drg.routes.test.ts`. Copy the express-app
   bootstrap + supertest pattern from an existing `*.routes.test.ts` (if none exists in this
   server, mount the `drg` router on a fresh `express()` app inside the test).
2. **Fixture strategy**: the routes read real files via `getPackRoot()`. Drive the source by
   pointing the pack root at a temp directory with controlled `drg/graph.yaml` / `drg/fragment.yaml`
   fixtures (set whatever env/config `getPackRoot()` honours, or `vi.mock('../config')` to return
   a temp dir). Inspect `../config` to find the cleanest seam, and mock `builtin-scanner.service`'s
   `getAll` to return a deterministic (or empty) built-in set so assertions are stable.
3. Tests to write:
   - **graph.yaml preferred**: temp dir has both `graph.yaml` and `fragment.yaml` with
     distinguishable nodes; `GET /` returns the graph.yaml nodes and `degraded` is falsy.
   - **degraded fallback**: temp dir has only `fragment.yaml`; `GET /` returns its nodes with
     `degraded: true` and a non-empty `note`.
   - **no source**: temp dir has neither; `GET /` returns 200 with empty nodes/edges and
     `degraded: true` (never 500).
   - **neighbourhood incident edges**: with a small fixture (A—B, A—C, B—D), `GET /neighbourhood/A`
     returns edges A—B and A—C only, neighbours `[B, C]` (deduped, no A), and `node` = A.
   - **neighbourhood 404**: `GET /neighbourhood/NOPE` → 404.
4. Run `npx vitest run drg.routes` until green; run `npx tsc --noEmit`.

**Files**:
- `tools/pack-dashboard/server/src/routes/drg.routes.test.ts` (new)

**Validation**:
- [ ] Test: graph.yaml preferred when both present
- [ ] Test: degraded flag set when only fragment present
- [ ] Test: missing both sources → 200 empty + degraded, not 500
- [ ] Test: neighbourhood returns only incident edges, deduped neighbours, excludes self
- [ ] Test: neighbourhood 404 for unknown id
- [ ] `npx vitest run drg.routes` green; `npx tsc --noEmit` clean

---

## Definition of Done

- `GET /api/drg/` prefers `graph.yaml`, falls back to `fragment.yaml` with `degraded: true` +
  `note`, and never 500s solely for a missing `graph.yaml`.
- `GET /api/drg/neighbourhood/:id` returns `{ node, neighbours, edges }` with only incident
  edges, deduped neighbours excluding self, and 404 on unknown id.
- Existing edge/node wire shapes (`source`/`target`, `title`/`body_path`) are preserved; the
  live `drg.service.ts` `getRelated()` consumer is not broken.
- The built-in merge behaviour from the original `GET /` is preserved in both endpoints.
- Endpoints are read-only (zero writes — NFR-005, C-001).
- Vitest tests cover graph preference, degraded fallback, neighbourhood incidence, and 404.
- `npx vitest run drg.routes` green and `npx tsc --noEmit` clean.

## Risks

| Risk | Mitigation in this WP |
|---|---|
| Renaming `source`/`target` to `from`/`to` breaks the live `getRelated()` consumer | Keep existing field names; only add aliases additively; reconciliation noted in activity log |
| Missing `graph.yaml` causing a 500 | T003 explicitly returns 200 + degraded; T005 asserts no-500 |
| Neighbourhood seeing a different node universe than `GET /` | Both share the same resolution helper + built-in merge (T004 step 2) |
| Duplicate neighbours when a node is connected by multiple edges | T004 dedupes neighbourIds via a Set; T005 asserts dedup |
| Test fixtures coupling to a real pack on disk | T005 drives `getPackRoot()` at a temp dir and mocks `getAll` |

## Reviewer Guidance

Review priorities (in order):

1. **No-500 invariant** — confirm a missing `graph.yaml` yields 200 + `degraded`, and only a
   real parse error yields 500. This is the headline FR-007 contract invariant.
2. **Field-shape preservation** — confirm `source`/`target`/`relation` and
   `id`/`kind`/`title`/`body_path` are intact on the wire and `drg.service.ts` is untouched and
   still compiles against the response.
3. **Neighbourhood correctness** — incident-only edges, deduped neighbours, self excluded,
   404 on unknown id. Cross-check against `contracts/api-drg-neighbourhood.yaml` invariants.
4. **Shared resolution** — `GET /` and `/neighbourhood/:id` use the same source-resolution +
   built-in merge so they agree on the node set.
5. **Read-only** — no `fs.write*` anywhere in the diff.
6. **Tests** — all five test cases present and green; fixtures isolated from the real pack.
7. **No regressions** — diff touches only the two owned files.

## Activity Log

- 2026-06-02T09:59:28Z – claude:sonnet:node-norris:implementer – shell_pid=2183367 – Started implementation via action command
- 2026-06-02T10:03:17Z – claude:sonnet:node-norris:implementer – shell_pid=2183367 – Ready for review: GET /api/drg/ now prefers pack/drg/graph.yaml, falls back to fragment.yaml with degraded:true + note, and returns 200 empty+degraded (never 500) when neither exists; only a real YAML parse error yields 500. Added GET /api/drg/neighbourhood/:id returning {node, neighbours(deduped, self-excluded), edges(incident-only)} with 404 on unknown id. Both endpoints share resolveDrgSource()+mergeBuiltins() so they see the same node universe. Internal wire shapes {source,target,relation} and {id,kind,title,body_path} preserved (no rename) so drg.service.ts getRelated() is unaffected. Read-only. Validation: tsc --noEmit exit 0; vitest run drg.routes 5/5 passed. Lint: no linter configured for server/ package (only frontend ng lint exists, scoped to src/app/; no eslint config/binary covers server/src), so no diff-scoped linter to run.
- 2026-06-02T10:03:49Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=2209142 – Started review via action command
