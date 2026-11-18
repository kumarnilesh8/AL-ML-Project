---
work_package_id: WP04
title: Provenance Backend
dependencies: []
requirement_refs:
- FR-013
- FR-014
- FR-015
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X
base_commit: 2b57005fe2958cb660a26cb72cd0dc12480bbe94
created_at: '2026-06-02T09:59:38.412256+00:00'
subtasks:
- T010
- T011
- T012
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "2224261"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/services/provenance.service.ts
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/services/provenance.service.ts
- tools/pack-dashboard/server/src/services/provenance.service.test.ts
- tools/pack-dashboard/server/src/routes/builtin.routes.ts
- tools/pack-dashboard/server/src/routes/artifacts.routes.ts
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

Add server-side provenance computation so the dashboard can show, per artifact, whether it is a
spec-kitty **Built-in**, an **Org-layer** pack artifact, or an **Override** of a built-in
(FR-013, FR-014). Per C-007 the model uses an **integer `layer`** (0 = built-in, 1 = org pack),
not a hardcoded 3-value enum, so further pack layers are expressible without a schema change.

Deliverables:
- `provenance.service.ts` — `computeProvenance(packIds, builtinIds)` → per-artifact
  `{ layer, provenance }`.
- Extend `builtin.routes.ts` and `artifacts.routes.ts` responses with `{ layer, provenance }`;
  built-in `GET /` rows gain `overridden_by_pack` / `enhanced_by_pack`; add
  `GET /api/builtin/inherited` (FR-015).
- Vitest coverage.

Track C backend, independent of every other WP. WP05 (frontend) depends on this WP's contract
(`contracts/api-provenance.yaml`).

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: a worktree allocated per this WP's lane in `lanes.json` by
  `finalize-tasks`. Enter the path printed by
  `spec-kitty agent action implement WP04 --agent <your-name>`. Edit only inside that worktree.

## Context

Read these before writing any code:

- **`tools/pack-dashboard/server/src/routes/builtin.routes.ts`** already serves built-ins via
  `getAll()` / `getKind()` / `getDetail()` from `builtin-scanner.service`. Routes: `GET /`,
  `/:kind`, `/:kind/:id`. Note `/:kind` would shadow a literal route like `/inherited` if placed
  after it — **register `GET /inherited` BEFORE `GET /:kind`** (T011).
- **`tools/pack-dashboard/server/src/routes/artifacts.routes.ts`** serves pack artifacts via
  `scanKind()` / `findArtifact()` from `pack-scanner.service`, mapping each artifact and adding
  `reviewStatus`. Routes: `GET /`, `/:kind`, `/:kind/:id`, `PUT /:kind/:id`.
- **Scanner services & shapes:**
  - `builtin-scanner.service`: `getAll(): Record<ArtifactKind, ArtifactSummary[]>`,
    `getKind(kind)`, `getDetail(kind, id)`. Built-in summaries carry `source: 'builtin'`.
  - `pack-scanner.service`: `scanKind(packRoot, kind)`, `findArtifact(packRoot, kind, id)`.
  - `ArtifactSummary` (in `models/artifact.model.ts`) has `id, kind, title, filePath,
    validationStatus, source`. `ARTIFACT_KINDS` is the canonical kind list.
- **Override vs enhance:**
  - **Override** = an org-pack artifact with the *same id* as a built-in (FR-014, contract). A
    pack `agent_profiles/frontend-freddy` overriding the built-in `frontend-freddy` is the
    archetype.
  - **Enhance** = an org-pack artifact that *declares* `enhances: <built-in-id>` in its parsed
    YAML (the relationship without an id collision). Detect by reading the pack artifact's
    parsed YAML for an `enhances` field. A few pack artifacts use `enhances` (e.g. a procedure);
    not every artifact does — handle absence gracefully.
- **`layer` is an INTEGER, not an enum (C-007).** Built-in = 0, org pack = 1. Do not constrain
  the type to a 3-value union; consumers must not assume a maximum.
- **`provenance` is a derived convenience string** for the badge: `'builtin' | 'org' |
  'override'` (contract `provenance_shape`). It is derived from layer membership + id collision —
  never authored by hand.
- **Read-only (NFR-005, C-002):** no writes. Do not touch the existing `PUT /:kind/:id` in
  `artifacts.routes.ts` beyond adding read-side provenance fields to GET responses.
- **Test runner:** Vitest. `cd tools/pack-dashboard && npx vitest run provenance` and `npx tsc
  --noEmit`. Note `builtin-scanner.service` caches at module level and resets via
  `vi.resetModules()` — relevant if you exercise it in tests.

---

## Subtask Guidance

### Subtask T010 — `provenance.service.ts` (`computeProvenance`)

**Purpose**: A pure-ish function that, given the set of pack artifact ids and built-in artifact
ids (and the pack artifacts' `enhances` declarations), returns per-artifact
`{ layer, provenance }` plus the override/enhance flags built-in rows need.

**Steps**:

1. Create `tools/pack-dashboard/server/src/services/provenance.service.ts`.
2. Define the shape (export it for the routes and the frontend contract):
   ```ts
   export interface Provenance { layer: number; provenance: 'builtin' | 'org' | 'override'; }
   ```
3. Implement the core derivation. Prefer keying by id **within a kind** to avoid cross-kind id
   collisions (a directive and a tactic could in principle share an id). A clean signature:
   ```ts
   // builtinIds: ids present in layer 0 for the kind under consideration
   // packIds:    ids present in layer 1 (the org pack) for that kind
   export function provenanceFor(id: string, layer: number, builtinIds: Set<string>): Provenance
   ```
   - For a **built-in** artifact (layer 0): `{ layer: 0, provenance: 'builtin' }`.
   - For an **org-pack** artifact (layer 1): if `builtinIds.has(id)` → `{ layer: 1, provenance:
     'override' }`, else `{ layer: 1, provenance: 'org' }`.
4. Add a convenience that computes, for built-in rows, whether the pack overrides/enhances them:
   ```ts
   export interface PackRelationFlags { overridden_by_pack: boolean; enhanced_by_pack: boolean; }
   // packIdsByKind: org ids per kind; packEnhancesByKind: set of built-in ids the pack 'enhances'
   export function packRelationFor(id: string, kind, packIdsForKind: Set<string>, enhancedIds: Set<string>): PackRelationFlags
   ```
   - `overridden_by_pack` = a pack artifact of the same id exists for that kind.
   - `enhanced_by_pack` = a pack artifact declares `enhances: <id>`.
5. Add a top-level `computeProvenance(packIds, builtinIds)` (the contract's named entry point)
   that takes the two id collections and returns the per-artifact `{ layer, provenance }` map,
   delegating to `provenanceFor`. Keep the kind-awareness (the simplest correct form is a map
   keyed by `${kind}/${id}`).
6. Keep this module free of Express types so it is unit-testable in isolation.

**Files**:
- `tools/pack-dashboard/server/src/services/provenance.service.ts` (new)

**Validation**:
- [ ] `Provenance.layer` is `number` (not a 1|2|3 union) — C-007 honoured
- [ ] Built-in artifact → `{ layer: 0, provenance: 'builtin' }`
- [ ] Org artifact with no built-in twin → `{ layer: 1, provenance: 'org' }`
- [ ] Org artifact whose id matches a built-in → `{ layer: 1, provenance: 'override' }`
- [ ] `overridden_by_pack` / `enhanced_by_pack` computed per built-in id (within kind)
- [ ] No Express imports; `npx tsc --noEmit` clean

---

### Subtask T011 — Extend built-in + artifact responses; add `GET /api/builtin/inherited`

**Purpose**: Surface provenance on the wire so the frontend badge has data, and add the
"inherited unchanged" endpoint (FR-013, FR-014, FR-015).

**Steps**:

1. **`artifacts.routes.ts`** — for `GET /`, `GET /:kind`, `GET /:kind/:id`, attach
   `{ layer, provenance }` to each artifact in the response. Pack artifacts are layer 1; resolve
   `provenance` via `provenanceFor(id, 1, builtinIdsForKind)` where `builtinIdsForKind` comes
   from `getAll()`/`getKind()` of the built-in scanner. Do not alter `PUT /:kind/:id`. Keep the
   existing `reviewStatus` enrichment.
2. **`builtin.routes.ts`**:
   - `GET /` — each row gains `overridden_by_pack` and `enhanced_by_pack` (from
     `packRelationFor`, using pack ids via `scanKind(getPackRoot(), kind)` and pack `enhances`
     declarations) **and** `{ layer: 0, provenance: 'builtin' }`.
   - `GET /:kind` and `GET /:kind/:id` — also carry `{ layer: 0, provenance: 'builtin' }` (and
     the relation flags where it makes sense).
   - **Add `GET /inherited`** — returns, per kind, the built-in artifacts the pack does NOT
     override or enhance: `{ <kind>: Array<{ id, title }> }` (FR-015, contract). **Register this
     route before `GET /:kind`** so `inherited` is not captured as a `:kind` param.
3. To detect `enhances`: read each pack artifact's parsed YAML (the pack-scanner gives
   `filePath`; load + `yaml.load`) and collect any `enhances` value(s) into a set of built-in
   ids. Handle artifacts without an `enhances` field. If parsing the whole pack per request is
   too costly, compute the override/enhance/inherited sets once per request from `getAll()` +
   `scanKind` and reuse.
4. Keep everything read-only.

**Files**:
- `tools/pack-dashboard/server/src/routes/builtin.routes.ts` (extend)
- `tools/pack-dashboard/server/src/routes/artifacts.routes.ts` (extend GET responses)

**Validation**:
- [ ] Pack artifact GET responses carry `{ layer: 1, provenance }`
- [ ] Built-in `GET /` rows carry `overridden_by_pack`, `enhanced_by_pack`, and `{ layer: 0, provenance: 'builtin' }`
- [ ] `GET /api/builtin/inherited` returns per-kind built-ins not overridden or enhanced
- [ ] `/inherited` is registered before `/:kind` (not shadowed)
- [ ] `PUT /:kind/:id` untouched; all additions are read-only
- [ ] `npx tsc --noEmit` clean

---

### Subtask T012 — Vitest tests (provenance + inherited)

**Purpose**: Lock the provenance derivation and the inherited endpoint behaviour.

**Steps**:

1. Create `tools/pack-dashboard/server/src/services/provenance.service.test.ts`.
2. **Unit tests for the service** (no HTTP needed):
   - builtin case: layer 0 → `provenance: 'builtin'`.
   - org case: layer 1, id not in built-ins → `'org'`.
   - override case: layer 1, id in built-ins → `'override'`.
   - `overridden_by_pack` true when a pack id matches a built-in id; false otherwise.
   - `enhanced_by_pack` true when the pack declares `enhances: <id>`; false otherwise.
   - `layer` is a number and the function does not reject layer values ≥ 2 (C-007 future-proofing).
3. **Inherited endpoint test** (optional HTTP test if a route test harness is easy; otherwise a
   unit test of the inherited-set computation): given built-ins {A, B, C}, pack overrides {A},
   pack enhances {B}, the inherited set is {C} for that kind. Mock the scanners (`getAll`,
   `scanKind`) to deterministic fixtures; remember the built-in scanner caches at module level —
   use `vi.resetModules()` / `vi.mock` as the existing tests do.
4. Run `npx vitest run provenance` until green; `npx tsc --noEmit`.

**Files**:
- `tools/pack-dashboard/server/src/services/provenance.service.test.ts` (new)

**Validation**:
- [ ] Tests cover builtin / org / override derivation
- [ ] Tests cover `overridden_by_pack` and `enhanced_by_pack`
- [ ] Test asserts `layer` accepts integer values (no 3-value cap)
- [ ] Inherited-set computation tested (A overridden, B enhanced → only C inherited)
- [ ] `npx vitest run provenance` green; `npx tsc --noEmit` clean

---

## Definition of Done

- `provenance.service.ts` computes `{ layer, provenance }` (layer integer, C-007) and the
  override/enhance relation flags; free of Express types.
- `artifacts.routes.ts` GET responses carry `{ layer: 1, provenance }`; `PUT` untouched.
- `builtin.routes.ts` `GET /` rows carry `overridden_by_pack`, `enhanced_by_pack`, and
  `{ layer: 0, provenance: 'builtin' }`; `GET /api/builtin/inherited` returns the inherited-unchanged
  built-ins and is registered before `/:kind`.
- All additions are read-only (NFR-005, C-002).
- Vitest tests cover builtin/org/override derivation, the relation flags, and the inherited set.
- `npx vitest run provenance` green; `npx tsc --noEmit` clean.

## Risks

| Risk | Mitigation in this WP |
|---|---|
| `layer` typed as a 3-value enum, blocking future pack layers | T010 types `layer` as `number`; T012 asserts ≥2 accepted (C-007) |
| `/inherited` shadowed by `/:kind` | T011 registers `/inherited` before `/:kind` |
| Cross-kind id collisions mislabelling provenance | T010 keys derivation by kind (e.g. `${kind}/${id}`) |
| Accidentally writing files | T011 leaves `PUT /:kind/:id` untouched; all new code is read-only |
| Scanner module cache leaking between tests | T012 uses `vi.resetModules()` / `vi.mock` per existing convention |
| Re-parsing the whole pack per request being slow | T011 computes override/enhance/inherited sets once per request from `getAll` + `scanKind` |

## Reviewer Guidance

Review priorities (in order):

1. **Integer `layer` (C-007)** — confirm `layer` is `number`, not a fixed union, and nothing
   assumes a maximum. This is the headline FR-014 requirement.
2. **Provenance correctness** — builtin→`builtin`, org-only→`org`, id-collision→`override`.
   Cross-check against `contracts/api-provenance.yaml`.
3. **Override vs enhance** — `overridden_by_pack` (same id) vs `enhanced_by_pack` (declared
   `enhances`) are distinct and not conflated.
4. **`/inherited` route ordering** — registered before `/:kind`; returns per-kind built-ins not
   overridden or enhanced (FR-015).
5. **Read-only** — no `fs.write*`; `PUT /:kind/:id` unchanged.
6. **Tests** — derivation, relation flags, future-layer acceptance, and the inherited set all
   covered and green.
7. **No regressions** — diff stays within the four owned files; existing `reviewStatus`
   enrichment preserved.

## Activity Log

- 2026-06-02T09:59:40Z – claude:sonnet:node-norris:implementer – shell_pid=2185471 – Started implementation via action command
- 2026-06-02T10:05:43Z – claude:sonnet:node-norris:implementer – shell_pid=2185471 – Ready for review: provenance.service.ts (computeProvenance/provenanceFor/packRelationFor/extractEnhances, integer layer per C-007, no Express types); builtin.routes adds overridden_by_pack/enhanced_by_pack + layer-0 provenance on all GETs and new GET /inherited registered BEFORE /:kind; artifacts.routes GETs carry {layer:1,provenance}, PUT untouched (read-only). Validation: tsc --noEmit exit 0; vitest run provenance 17/17 exit 0; existing builtin.routes tests 10/10 (no regression); no server-side ESLint configured (ng lint is frontend-only) so diff lint sweep is a no-op/vacuous exit 0; dead-code grep confirms provenance.service imported+called by both routes (zero unused).
- 2026-06-02T10:06:13Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=2224261 – Started review via action command
