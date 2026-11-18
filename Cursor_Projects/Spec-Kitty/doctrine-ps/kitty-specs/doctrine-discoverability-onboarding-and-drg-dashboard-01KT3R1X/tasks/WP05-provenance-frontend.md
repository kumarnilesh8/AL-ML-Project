---
work_package_id: WP05
title: Provenance Frontend
dependencies:
- WP04
requirement_refs:
- FR-014
- FR-015
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X
base_commit: 91825394247acae68f9ee956c180a65dc2d1d030
created_at: '2026-06-02T10:08:26.851424+00:00'
subtasks:
- T013
- T014
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "2279810"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/components/provenance-badge/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/components/provenance-badge/**
- tools/pack-dashboard/src/app/pages/artifact-list/**
- tools/pack-dashboard/src/app/pages/artifact-detail/**
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

Surface artifact provenance in the dashboard UI (FR-014, FR-015):

- A `provenance-badge` component that renders **Built-in / Org-layer / Override** from the
  `{ layer, provenance }` shape WP04 puts on every artifact.
- The badge rendered on artifact-list rows and the artifact-detail header.
- An "inherited unchanged" filter/view consuming `GET /api/builtin/inherited`.

Track C frontend. **Depends on WP04** for the `{ layer, provenance }` fields, the built-in
`overridden_by_pack`/`enhanced_by_pack` flags, and the `/api/builtin/inherited` endpoint
(`contracts/api-provenance.yaml`).

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: a worktree allocated per this WP's lane in `lanes.json` by
  `finalize-tasks`. Enter the path printed by
  `spec-kitty agent action implement WP05 --agent <your-name>`. Edit only inside that worktree.

## Context

Read these before writing any code:

- **⚠ Badge convention is `rn-badge`, not `ks-badge`.** The task brief said "reuse existing
  ks-badge design tokens (C-006)", but the actual codebase uses `rn-badge` with modifier classes.
  Read `src/app/components/validation-badge/validation-badge.component.ts` — it is the canonical
  badge pattern:
  ```html
  <span class="rn-badge" [ngClass]="badgeClass">{{ label }}</span>
  ```
  with `badgeClass` returning `rn-badge--success` / `rn-badge--danger` / `rn-badge--neutral`
  etc. Reuse this existing `rn-badge` token family (C-006 — no new palette). Note the
  discrepancy in your activity log; follow the codebase, not the brief's `ks-badge` wording.
- **Existing badge usages** to copy from: `validation-badge.component.ts` (variant switch) and
  `charter-badge.component.ts` (null-safe conditional render). Both are standalone components
  importing `CommonModule`.
- **`artifact-list.component.ts`** renders a pack table (rows over `artifacts`, with
  `app-validation-badge`, an `rn-badge` for reviewStatus, and `app-charter-badge`) and a
  separate built-in table (rows over `builtinArtifacts`). It already imports the badge
  components in its `imports: [...]` array — add `ProvenanceBadgeComponent` there too. After
  WP04, each artifact object carries `layer` and `provenance`.
- **`artifact-detail.component.ts`** renders a single artifact header; add the badge there.
- **WP04 data contract:** pack artifacts arrive as `{ ..., layer: 1, provenance: 'org' |
  'override' }`; built-ins as `{ ..., layer: 0, provenance: 'builtin', overridden_by_pack,
  enhanced_by_pack }`. The "inherited" view consumes `GET /api/builtin/inherited` →
  `{ <kind>: Array<{ id, title }> }`.
- **Standalone Angular 18**, lazy routes. The frontend gate is `cd tools/pack-dashboard && npx
  tsc --noEmit` (NFR-003). No TestBed specs in scope.

---

## Subtask Guidance

### Subtask T013 — `provenance-badge` component

**Purpose**: A small, null-safe, reusable badge that turns `{ layer, provenance }` into a
labelled `rn-badge`, reusing existing badge tokens.

**Steps**:

1. Create `src/app/components/provenance-badge/provenance-badge.component.ts` (standalone,
   imports `CommonModule`), modelled on `validation-badge.component.ts`.
2. Inputs:
   ```ts
   @Input() layer?: number;                                   // 0 = builtin, 1 = org
   @Input() provenance?: 'builtin' | 'org' | 'override';      // derived string from WP04
   ```
3. Template — render an `rn-badge` only when provenance is known (null-safe like
   `charter-badge`):
   ```html
   @if (provenance) {
     <span class="rn-badge" [ngClass]="badgeClass" [title]="tooltip">{{ label }}</span>
   }
   ```
4. Label / variant mapping (reuse existing `rn-badge--*` variants — do NOT invent new colours):
   - `'builtin'` → label **Built-in**, e.g. `rn-badge--neutral`.
   - `'org'` → label **Org-layer**, e.g. `rn-badge--info` (or another existing variant; verify
     which `rn-badge--*` classes exist in the global styles and pick from those).
   - `'override'` → label **Override**, e.g. `rn-badge--success` or `rn-badge--warning` —
     whichever existing variant best reads as "pack changed this".
   - unknown / missing → render nothing.
5. **Layer-future-proofing (C-007):** the label logic keys on `provenance` for the three known
   cases but must not crash for an unexpected `layer` value (≥2). For an unknown provenance,
   render nothing rather than throwing. Optionally include the numeric `layer` in the `title`
   tooltip so future layers are at least visible on hover.
6. Confirm only existing `rn-badge--*` classes are used; if none of the existing variants fit a
   case, fall back to base `rn-badge` rather than adding a new class to the global stylesheet.

**Files**:
- `src/app/components/provenance-badge/provenance-badge.component.ts` (new)

**Validation**:
- [ ] Standalone component, inputs `layer?: number` and `provenance?: 'builtin'|'org'|'override'`
- [ ] Renders **Built-in / Org-layer / Override** via existing `rn-badge--*` variants
- [ ] Null-safe: missing/unknown provenance renders nothing, no throw
- [ ] Does not introduce a new colour/class to global styles (C-006)
- [ ] Tolerates `layer` ≥ 2 without crashing (C-007)
- [ ] `npx tsc --noEmit` clean

---

### Subtask T014 — Render the badge + add the "inherited unchanged" view

**Purpose**: Put the badge in front of users on lists and detail, and give curators the
"what does the project inherit unchanged?" view (FR-014, FR-015, Scenario 3).

**Steps**:

1. **Artifact-list rows** (`artifact-list.component.ts`):
   - Add `ProvenanceBadgeComponent` to the component `imports` array.
   - Add a column/cell rendering `<app-provenance-badge [layer]="artifact.layer"
     [provenance]="artifact.provenance">` in the pack table rows and in the built-in table rows.
   - Update the local artifact type so `layer`/`provenance` are recognised (extend the
     `ArtifactSummary`-shaped model the component consumes, or read from the response object).
2. **Artifact-detail header** (`artifact-detail.component.ts`):
   - Add `ProvenanceBadgeComponent` to `imports` and render the badge in the header next to the
     title, bound to the detail artifact's `layer`/`provenance`.
3. **"Inherited unchanged" view (FR-015):** within the artifact-list built-in section, add a
   filter or toggle ("Inherited unchanged only") that consumes `GET /api/builtin/inherited`.
   - Add the fetch to the relevant service (the built-in service the page already uses) returning
     the `{ <kind>: Array<{ id, title }> }` shape, or filter the existing built-in rows client-side
     to those with `overridden_by_pack === false && enhanced_by_pack === false`. Prefer the
     dedicated endpoint per the contract, but client-side filtering of the WP04 flags is an
     acceptable equivalent — pick one and keep it consistent.
   - The view/toggle should clearly show only the built-ins the pack neither overrides nor
     enhances (i.e. provenance stays `builtin` with both flags false).
4. Keep all changes read-only and consistent with the existing table styling (`rn-*` classes).
5. Run `npx tsc --noEmit` and build the app.

**Files**:
- `src/app/pages/artifact-list/artifact-list.component.ts` (render badge + inherited toggle)
- `src/app/pages/artifact-detail/artifact-detail.component.ts` (render badge in header)

**Validation**:
- [ ] `app-provenance-badge` rendered on pack-list rows and built-in-list rows
- [ ] `app-provenance-badge` rendered in the artifact-detail header
- [ ] `ProvenanceBadgeComponent` added to both components' `imports`
- [ ] An "inherited unchanged" filter/view shows only built-ins with no override/enhance
- [ ] The view sources data from `/api/builtin/inherited` or the WP04 flags (consistent choice)
- [ ] `npx tsc --noEmit` clean and the app builds (NFR-003)

---

## Definition of Done

- `provenance-badge` component renders Built-in / Org-layer / Override from `{ layer, provenance }`
  using existing `rn-badge` tokens; null-safe and tolerant of layer ≥ 2 (C-006, C-007).
- The badge is rendered on artifact-list rows (pack + built-in) and the artifact-detail header.
- An "inherited unchanged" filter/view shows the built-ins the pack neither overrides nor
  enhances, sourced from `/api/builtin/inherited` or the WP04 flags.
- No new colour palette introduced (C-006); all changes read-only.
- `npx tsc --noEmit` clean and the Angular build succeeds (NFR-003).

## Risks

| Risk | Mitigation in this WP |
|---|---|
| Using non-existent `ks-badge` classes from the brief | Context flags the discrepancy; T013 uses the codebase's `rn-badge`/`rn-badge--*` family |
| Introducing a new colour/class to global styles (C-006 breach) | T013 reuses existing `rn-badge--*` variants only; falls back to base `rn-badge` if none fit |
| Badge throwing on missing/unknown provenance | T013 is null-safe (renders nothing) like `charter-badge` |
| Hardcoding a 3-value assumption that breaks future layers | T013 keys on `provenance`, tolerates `layer` ≥ 2, surfaces layer in tooltip (C-007) |
| Inherited view sourced inconsistently (endpoint vs client filter) | T014 step 3: pick one approach and keep it consistent; prefer the endpoint |
| Local artifact type not recognising `layer`/`provenance` | T014 extends the consumed model shape so tsc stays clean |

## Reviewer Guidance

Review priorities (in order):

1. **Token reuse (C-006)** — confirm the badge uses only existing `rn-badge`/`rn-badge--*`
   classes and adds no new colour to global styles. Reject a new palette.
2. **Null-safety & future layers (C-007)** — missing/unknown provenance renders nothing; a
   `layer` ≥ 2 does not crash. No hardcoded 3-value enum assumption that blocks future layers.
3. **Coverage** — badge appears on pack-list rows, built-in-list rows, and the artifact-detail
   header (FR-014).
4. **Inherited view (FR-015)** — confirm it shows only built-ins with no override/enhance, and
   that its data source (endpoint or WP04 flags) is consistent.
5. **Read-only** — no edit affordances; no writes.
6. **Build gates** — `npx tsc --noEmit` clean and the app builds.
7. **No regressions** — diff stays within the owned files; existing list/detail badges and
   columns still render.

## Activity Log

- 2026-06-02T10:17:06Z – claude – shell_pid=2236700 – Ready for review: T013 provenance-badge standalone component (rn-badge tokens only: neutral/info/warning; layer-aware via provenance-keyed mapping, tolerates layer>=2 in tooltip, null-safe — C-006/C-007). T014 badge rendered on artifact-list pack + built-in rows and artifact-detail header; client-side 'inherited unchanged' filter over WP04 overridden_by_pack/enhanced_by_pack flags (FR-014/FR-015). Gates: npx tsc --noEmit exit 0; ng build exit 0 (only pre-existing domain-vocabulary-panel style-budget warning, unrelated). No ng lint target/eslint config exists so no linter covers the diff. Stayed within owned_files.
- 2026-06-02T10:17:39Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=2279810 – Started review via action command
