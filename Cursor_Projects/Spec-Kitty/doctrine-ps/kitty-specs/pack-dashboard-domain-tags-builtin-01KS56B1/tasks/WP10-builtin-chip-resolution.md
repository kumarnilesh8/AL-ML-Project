---
work_package_id: WP10
title: Built-in chip resolution in StructuredViewComponent
dependencies:
- WP09
requirement_refs:
- FR-015
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T045
- T046
- T047
- T048
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1595801"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/components/structured-view/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/components/structured-view/structured-view.component.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any further, load the agent profile assigned to this work package:

```
/ad-hoc-profile-load frontend-freddy
```

---

## Objective

Load the built-in artifact map into `StructuredViewComponent`, resolve `specializes_from`, `enhances`, and `overrides` field values against both the pack map and the built-in map, and render resolved built-in references as distinct linked chips with a `routerLink` to `/artifacts/builtin/:kind/:id`.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP10 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

**Read the entire existing component first** — it is the most complex component in the app:
```
tools/pack-dashboard/src/app/components/structured-view/structured-view.component.ts
```

Key existing logic:
- `strCell(s)` — converts a string value to a typed `Cell`. Current logic:
  1. Checks pack `artMap` for an exact ID match → `PackRef`
  2. Checks if string is an `ArtifactKind` → `KindRef`
  3. Matches all-caps pattern `^[A-Z][A-Z0-9_]{3,}$` → `BuiltinRef { type: 'builtin', value: s }`
  4. Long text → `LongText`
  5. Default → `TextCell`

- `buildSections()` — iterates `parsedData` entries, maps each to a `Section { key, label, cell }`.

- `BuiltinRef { type: 'builtin'; value: string }` — currently renders as a static `<span>` with the raw ID.

**After this WP**:
- `BuiltinRef` gains `builtinKind?: ArtifactKind` and `refVariant?: 'specializes' | 'enhances' | 'overrides' | 'generic'`
- When a built-in is resolved from the map, `builtinKind` is set so the routerLink can be constructed
- The chip variant is set based on the parent section key (`specializes_from` → `'specializes'`, `enhances` → `'enhances'`, `overrides` → `'overrides'`, all others → `'generic'`)
- The template renders resolved built-ins as `<a>` with `routerLink` and appropriate CSS class

**Design decision (C-005)**: Built-in resolution is **client-side**. The component loads the full built-in map via `BuiltinService.getAll()` on `ngOnInit`. Resolution is a local map lookup — no HTTP round-trip per chip.

---

## Subtask T045 — Load built-in map via `BuiltinService.getAll()`

**File**: `tools/pack-dashboard/src/app/components/structured-view/structured-view.component.ts`

Add:
1. Inject `BuiltinService` in the constructor.
2. Add `builtinMap = new Map<string, ArtifactSummary>();`
3. In `ngOnInit()`, load the full built-in set:

```typescript
ngOnInit(): void {
  // Load pack artifacts for pack-ref resolution (existing)
  this.artifactService.getArtifacts().subscribe(artifacts => {
    this.artMap = new Map(artifacts.map(a => [a.id, a]));
    this.buildSections();
  });

  // Load built-in artifacts for built-in ref resolution (new)
  this.builtinService.getAll().subscribe(byKind => {
    for (const [, summaries] of Object.entries(byKind)) {
      for (const summary of summaries as ArtifactSummary[]) {
        this.builtinMap.set(summary.id, summary);
        this.builtinMap.set(summary.id.toLowerCase(), summary);
      }
    }
    this.buildSections(); // Rebuild sections with resolved built-in refs
  });
}
```

**Note**: `buildSections()` is called again after the built-in map loads so any built-in refs are resolved on re-render. This is safe because the method is idempotent.

---

## Subtask T046 — Extend `BuiltinRef` cell type

**File**: same component

Update the `BuiltinRef` interface:

```typescript
export interface BuiltinRef {
  type: 'builtin';
  value: string;
  builtinKind?: ArtifactKind;   // resolved kind (for routerLink construction)
  refVariant?: 'specializes' | 'enhances' | 'overrides' | 'generic';
}
```

The `builtinKind` is `undefined` if the ID could not be resolved against the built-in map (e.g., map not loaded yet, or genuinely missing). In that case the chip renders as a static span (same as before).

---

## Subtask T047 — Resolve built-in IDs in `strCell()` with context

**File**: same component

Change `strCell(s: string)` to `strCell(s: string, ctxKey?: string)`:

```typescript
private strCell(s: string, ctxKey?: string): Cell {
  const t = s.trim();
  if (!t) return { type: 'text', text: '—' };

  // 1. Pack artifact lookup (unchanged)
  const ref = this.artMap.get(t) ?? this.artMap.get(t.toLowerCase());
  if (ref) return { type: 'pack-ref', id: ref.id, artKind: ref.kind, title: ref.title };

  // 2. Artifact kind name (unchanged)
  if (ARTIFACT_KINDS.includes(t as ArtifactKind)) return { type: 'kind-ref', kind: t as ArtifactKind };

  // 3. Built-in artifact lookup (new)
  const builtinRef = this.builtinMap.get(t) ?? this.builtinMap.get(t.toLowerCase());
  if (builtinRef) {
    const refVariant = ctxKey === 'specializes_from' ? 'specializes'
                     : ctxKey === 'enhances'         ? 'enhances'
                     : ctxKey === 'overrides'        ? 'overrides'
                     : 'generic';
    return { type: 'builtin', value: t, builtinKind: builtinRef.kind, refVariant };
  }

  // 4. All-caps pattern fallback → unresolved built-in reference
  if (/^[A-Z][A-Z0-9_]{3,}$/.test(t)) {
    return { type: 'builtin', value: t, refVariant: 'generic' };
  }

  // 5. Long / multiline text (unchanged)
  if (t.includes('\n') || t.length > 120) return { type: 'long', text: t };

  return { type: 'text', text: t };
}
```

Update `buildSections()` to pass the section key to `toCell`:
```typescript
private buildSections(): void {
  this.sections = Object.entries(this.parsedData)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => ({
      key,
      label: this.formatLabel(key),
      cell: this.toCell(value, 0, key),   // pass key as ctxKey
    }));
}
```

Update `toCell` signature: `private toCell(value: unknown, depth: number, ctxKey?: string): Cell`

In `toCell`, forward `ctxKey` to `strCell` when processing string values:
```typescript
if (typeof value === 'string') return this.strCell(value, ctxKey);
```

For arrays of primitives (the common case for `specializes_from: [id1, id2]`):
```typescript
return { type: 'tokens', items: value.map((i) => this.toCell(i, depth + 1, ctxKey)) };
```

This ensures all elements in a `specializes_from` array get the `'specializes'` variant.

---

**Template changes** — update the `@case ('builtin')` block:

```html
@case ('builtin') {
  @if (c.builtinKind) {
    <!-- Resolved built-in: render as link -->
    <a class="sv-chip sv-chip--builtin-{{ c.refVariant ?? 'generic' }}"
       [routerLink]="['/artifacts/builtin', c.builtinKind, c.value]"
       [title]="'spec-kitty built-in: ' + c.value">
      {{ c.value }}
    </a>
  } @else {
    <!-- Unresolved built-in (map not loaded or unknown ID): static span -->
    <span class="sv-chip sv-chip--builtin" title="Referenced built-in artifact (not yet resolved)">{{ c.value }}</span>
  }
}
```

---

## Subtask T048 — CSS for three built-in chip variants

**File**: `tools/pack-dashboard/src/styles.scss`

Add to the `sv-chip` section:

```scss
// ── Built-in ref chip variants ────────────────────────────────────────────────
// Base built-in (unresolved or generic)
.sv-chip--builtin {
  background: var(--rn-color-neutral-100, #E8EAED);
  color: var(--rn-color-neutral-600, #5F6368);
  border: 1px dashed var(--rn-color-neutral-400, #9AA0A6);
  font-style: italic;
}

// Resolved built-in with routerLink (all 3 variants share the link cursor)
a.sv-chip--builtin-generic,
a.sv-chip--builtin-specializes,
a.sv-chip--builtin-enhances,
a.sv-chip--builtin-overrides {
  text-decoration: none;
  cursor: pointer;
  &:hover { filter: brightness(0.9); text-decoration: underline; }
  &:focus-visible { outline: 2px solid var(--rn-green-dark, #06A74E); outline-offset: 2px; }
}

// specializes_from → subtle teal
.sv-chip--builtin-specializes {
  background: #D0E6EF;
  color: #035073;
  border: 1px solid #7BBCD5;
}

// enhances → muted green
.sv-chip--builtin-enhances {
  background: #CEEFDF;
  color: #1A6640;
  border: 1px solid #7ECDA3;
}

// overrides → amber warning tone
.sv-chip--builtin-overrides {
  background: #FEF3CD;
  color: #834800;
  border: 1px solid #F9D071;
}

// generic resolved (no specific relationship key)
.sv-chip--builtin-generic {
  background: var(--rn-ice-blue-light, #D0E6EF);
  color: var(--rn-ice-blue, #1788BE);
  border: 1px solid var(--rn-ice-blue, #1788BE);
}

@media (prefers-color-scheme: dark) {
  .sv-chip--builtin          { background: #2A2D31; color: #9AA0A6; border-color: #555; }
  .sv-chip--builtin-specializes { background: #0A2E3D; color: #7BBCD5; border-color: #154D65; }
  .sv-chip--builtin-enhances    { background: #1A3828; color: #7ECDA3; border-color: #2D5A40; }
  .sv-chip--builtin-overrides   { background: #3D2800; color: #F9D071; border-color: #663D00; }
  .sv-chip--builtin-generic     { background: #0A2E3D; color: #7BBCD5; border-color: #1788BE; }
}
```

---

## Definition of Done

- [ ] `BuiltinService.getAll()` is called in `StructuredViewComponent.ngOnInit()` and the result is stored in `builtinMap`
- [ ] `BuiltinRef` type has `builtinKind?` and `refVariant?` fields
- [ ] `strCell()` accepts `ctxKey?` and sets `refVariant` based on it
- [ ] Resolved built-in references render as `<a>` chips with correct `routerLink`
- [ ] `specializes_from` values get `sv-chip--builtin-specializes` class
- [ ] `enhances` values get `sv-chip--builtin-enhances` class
- [ ] `overrides` values get `sv-chip--builtin-overrides` class
- [ ] Unresolved all-caps IDs fall back to static `sv-chip--builtin` span (no broken link)
- [ ] Pack-ref resolution (existing `PackRef` logic) is NOT broken
- [ ] `ng build --configuration production` completes without TypeScript errors

---

## Reviewer Guidance

- Verify `buildSections()` passes the top-level key down to `toCell` and subsequently `strCell`.
- Verify the token-list branch in `toCell` also forwards `ctxKey` so array-valued fields (e.g., `specializes_from: [id1, id2]`) have each element resolved with the correct variant.
- Verify existing pack-ref chips (`sv-chip--pack`) are unchanged.
- Verify that chips with an unresolved `builtinKind` render as a static `<span>` (no dead `[routerLink]="['/artifacts/builtin', undefined, ...]"`).

## Activity Log

- 2026-05-21T13:05:39Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1586277 – Started implementation via action command
- 2026-05-21T13:07:58Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1586277 – Ready for review: BuiltinService injected, builtinMap loaded client-side (C-005), BuiltinRef extended with builtinKind/refVariant, ctxKey threaded through buildSections->toCell->strCell, routerLink chips rendered for resolved built-ins, CSS variants for specializes/enhances/overrides/generic with dark mode
- 2026-05-21T13:08:22Z – claude:sonnet:reviewer:reviewer – shell_pid=1595801 – Started review via action command
- 2026-05-21T13:12:05Z – claude:sonnet:reviewer:reviewer – shell_pid=1595801 – Review passed: client-side resolution via BuiltinService.getAll() in ngOnInit (C-005), no per-chip server round-trips, routerLink chips for resolved built-ins at /artifacts/builtin/:kind/:id, ctxKey threaded through buildSections()->toCell()->strCell() with array forwarding, all 4 CSS chip variants (specializes/enhances/overrides/generic) with dark mode, unresolved all-caps IDs fall back to static span, existing pack-ref logic untouched, TypeScript compiles clean
