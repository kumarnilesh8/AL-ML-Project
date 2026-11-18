---
work_package_id: WP02
title: Frontend — Charter Orphan Indicator
dependencies:
- WP01
requirement_refs:
- FR-002
- FR-003
- FR-004
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-charter-orphan-and-test-hardening-01KT1FNE
base_commit: 5475f1812298b690165ef5a9f0640567e3a402da
created_at: '2026-06-01T12:00:21.936611+00:00'
subtasks:
- T004
- T005
- T006
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1240100"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/pages/charter/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/pages/charter/charter.component.ts
- tools/pack-dashboard/src/app/models/charter.model.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load frontend-freddy
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Update the `/charter` page to use the new `GET /api/charter/enriched` endpoint (WP01)
and display a "Not found in pack" indicator on entries where the artefact no longer
exists in the pack (`exists === false`). The remove action must remain visible and
functional on all entries — orphaned or not.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Base**: WP01 must be approved before this WP is dispatched. The workspace base
  is the lane branch computed by `spec-kitty agent action implement WP02 --agent <name>`.

## Pre-Read

Before touching any file:

1. Read `tools/pack-dashboard/src/app/pages/charter/charter.component.ts` — understand
   the current `groupedEntries$` observable, the `@for` loop, and the `removeFromCharter`
   method.
2. Read `tools/pack-dashboard/src/app/services/charter.service.ts` — understand the
   `BehaviorSubject<CharterEntry[] | null>` pattern, `load()`, `add()`, `remove()`.
3. Read `tools/pack-dashboard/src/app/models/charter.model.ts` — understand the current
   `CharterEntry` and `CharterResponse` types.

---

## Subtask Guidance

### T004 — Define `EnrichedCharterEntry` type

**Purpose**: Extend the model so the component can type-check the `exists` field from
the enriched endpoint without casting.

**Steps**:

1. Open `tools/pack-dashboard/src/app/models/charter.model.ts`.
2. Add the extended type after the existing `CharterEntry`:
   ```typescript
   export interface EnrichedCharterEntry extends CharterEntry {
     exists: boolean;
   }

   export interface EnrichedCharterResponse {
     entries: EnrichedCharterEntry[];
   }
   ```

**Files**: `tools/pack-dashboard/src/app/models/charter.model.ts`

**Validation**:
- [ ] `EnrichedCharterEntry` extends `CharterEntry` (has all its fields plus `exists`)
- [ ] `EnrichedCharterResponse` wraps `EnrichedCharterEntry[]`
- [ ] `npx tsc --noEmit` exits 0 after the type addition

---

### T005 — Update CharterComponent to fetch from enriched endpoint

**Purpose**: Replace the existing charter data source with the enriched endpoint so the
component receives `exists` per entry.

**Design choice**: Add a component-local `enrichedEntries$` observable backed by a direct
`HttpClient.get('/api/charter/enriched')` call. Do NOT modify `CharterService` — it owns
the `BehaviorSubject` for badge propagation across the app; enriched data is only needed
on the charter page itself.

**Steps**:

1. Open `tools/pack-dashboard/src/app/pages/charter/charter.component.ts`.

2. Inject `HttpClient` if not already present:
   ```typescript
   constructor(
     private charterService: CharterService,
     private http: HttpClient,
   ) {}
   ```
   Add `HttpClientModule` or `HttpClient` to the component's imports if the component is
   standalone (check the `@Component({ imports: [...] })` decorator).

3. Add an `enrichedEntries$` observable:
   ```typescript
   readonly enrichedEntries$ = this.http.get<EnrichedCharterResponse>('/api/charter/enriched')
     .pipe(
       map(r => r.entries),
       catchError(() => of([] as EnrichedCharterEntry[])),
     );
   ```
   Import `map`, `catchError`, `of` from `rxjs/operators` / `rxjs`.

4. Update `groupedEntries$` to derive from `enrichedEntries$` instead of
   `charterService.entries$`:
   - The current `groupedEntries$` maps over `CharterEntry[]`; update the type to
     `EnrichedCharterEntry[]` so the template can access `entry.exists`.
   - Keep the grouping logic (`ARTIFACT_KINDS`, `Map<ArtifactKind, EnrichedCharterEntry[]>`) unchanged.

5. Add a `reload()` method that triggers a fresh fetch — this is called after `removeFromCharter()`:
   The simplest approach is to use a `BehaviorSubject<void>` trigger:
   ```typescript
   private reload$ = new BehaviorSubject<void>(undefined);

   readonly enrichedEntries$ = this.reload$.pipe(
     switchMap(() => this.http.get<EnrichedCharterResponse>('/api/charter/enriched')),
     map(r => r.entries),
     catchError(() => of([] as EnrichedCharterEntry[])),
   );
   ```
   Import `switchMap` from `rxjs/operators`.

6. Update `removeFromCharter()` to call `this.reload$.next()` after the
   `charterService.remove()` completes:
   ```typescript
   removeFromCharter(artifactId: string): void {
     this.charterService.remove(artifactId).subscribe(() => {
       this.reload$.next();
     });
   }
   ```
   Adjust to match the actual `remove()` signature (it may return `Observable<void>` or
   be synchronous — check the service code first).

**Files**: `tools/pack-dashboard/src/app/pages/charter/charter.component.ts`

**Validation**:
- [ ] `npx tsc --noEmit` exits 0
- [ ] `enrichedEntries$` uses `HttpClient.get('/api/charter/enriched')`
- [ ] `groupedEntries$` is typed with `EnrichedCharterEntry[]`
- [ ] After remove, the list refreshes (reload trigger fires)

---

### T006 — Render "Not found in pack" indicator in template

**Purpose**: Show a visible badge on orphaned entries; keep the remove action on all entries
(FR-002, FR-003, FR-004).

**Steps**:

1. Locate the `@for` loop in the charter component template (inline or in a separate
   `.html` file — check the `templateUrl` vs `template` property).

2. Replace the current entry rendering block. The existing pattern is approximately:
   ```html
   <a [routerLink]="['/artifacts', entry.artifact_kind, entry.artifact_id]">
     {{ entry.artifact_id }}
   </a>
   <button (click)="removeFromCharter(entry.artifact_id)">Remove</button>
   ```

   Replace with:
   ```html
   @if (entry.exists) {
     <a [routerLink]="['/artifacts', entry.artifact_kind, entry.artifact_id]">
       {{ entry.artifact_id }}
     </a>
   } @else {
     <span class="charter-orphan-label">{{ entry.artifact_id }}</span>
     <span class="ks-badge ks-badge--warning charter-orphan-badge">Not found in pack</span>
   }
   <!-- Remove button is always visible — required by C-001 / FR-003 -->
   <button class="ks-btn ks-btn--icon charter-remove-btn"
           (click)="removeFromCharter(entry.artifact_id)"
           aria-label="Remove {{ entry.artifact_id }} from charter">
     Remove
   </button>
   ```

3. Styling: `ks-badge` and `ks-badge--warning` are existing design token classes — no new
   CSS needed. The `charter-orphan-label` and `charter-orphan-badge` class names are
   additions; add minimal inline styling if the project uses component-scoped SCSS, or
   leave them as semantic class hooks.

4. Verify the template renders correctly with Angular's `@if`/`@for` syntax (project uses
   Angular 17+ with the new control flow — confirm by looking at existing `@for` usage).

**Files**: `tools/pack-dashboard/src/app/pages/charter/charter.component.ts` (inline
template) or the corresponding `.html` file if `templateUrl` is used.

**Validation**:
- [ ] `npx tsc --noEmit` exits 0
- [ ] Orphaned entries (mock `exists: false`) show the "Not found in pack" badge
- [ ] Non-orphaned entries (mock `exists: true`) show the artefact link
- [ ] Remove button is present and calls `removeFromCharter()` for BOTH entry types
- [ ] No `@Component` imports are broken (check `HttpClientModule` or `provideHttpClient`)

---

## Definition of Done

- [ ] `tools/pack-dashboard/src/app/models/charter.model.ts` exports `EnrichedCharterEntry` and `EnrichedCharterResponse`
- [ ] `CharterComponent` fetches from `/api/charter/enriched` (not `/api/charter`)
- [ ] Template renders "Not found in pack" indicator on `exists === false` entries
- [ ] Remove button is unconditional — present on every entry regardless of `exists`
- [ ] Non-orphaned entries render as links to the artefact detail page (no regression)
- [ ] `npx tsc --noEmit` exits 0
- [ ] Diff touches only `charter.component.ts` and `charter.model.ts`

## Risks

| Risk | Mitigation |
|---|---|
| `HttpClient` not yet injected in `CharterComponent` | Check constructor; add `HttpClientModule` to standalone component imports if needed |
| `removeFromCharter()` returns void (not Observable) | If synchronous, call `this.reload$.next()` directly after; if it calls `charterService.remove()` which returns Observable, use `.subscribe()` |
| Angular template uses `*ngFor` instead of `@for` | Adapt the `@if` block to `*ngIf`; confirm which control-flow syntax the project uses before writing |
| `ks-badge--warning` class not defined | Fall back to `ks-badge--amber` or inspect existing badge usage in the codebase |

## Reviewer Guidance

1. Verify the remove button is present on orphaned entries — this is C-001.
2. Confirm `exists: false` entries show "Not found in pack" text, not just an absent link.
3. Confirm `exists: true` entries still navigate to the detail page (no regression — FR-004).
4. `CharterService.entries$` must NOT be modified — it feeds badge propagation across the app.
5. Diff must touch only the two owned files.

## Activity Log

- 2026-06-01T12:00:23Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1229078 – Assigned agent via action command
- 2026-06-01T12:02:27Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1229078 – EnrichedCharterEntry type, HttpClient enriched fetch with reload trigger, not-found badge, remove action unconditional, TypeScript clean
- 2026-06-01T12:03:11Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1240100 – Started review via action command
- 2026-06-01T12:04:22Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1240100 – Review passed: EnrichedCharterEntry type, enriched fetch, orphan badge, unconditional remove, TypeScript clean
