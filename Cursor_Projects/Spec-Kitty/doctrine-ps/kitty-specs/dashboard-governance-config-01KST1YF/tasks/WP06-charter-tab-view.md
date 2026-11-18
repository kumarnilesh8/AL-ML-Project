---
work_package_id: WP06
title: Charter Tab View
dependencies:
- WP04
- WP05
requirement_refs:
- FR-006
- FR-013
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:45:09.025238+00:00'
subtasks:
- T028
- T029
- T030
- T031
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1116165"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/pages/charter/**
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

Wait for profile confirmation, then continue with this work package.

---

## Objective

Create the `/charter` tab: a new `CharterComponent` page with group-by-kind view, empty
state, unknown-artefact handling, and remove-from-charter action. Wire it into app routing
and add the sidebar nav link.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Start from: `spec-kitty agent action implement WP06 --agent <name>`

## Context

**Depends on**:
- WP04: `/api/charter` backend endpoints, `CharterEntry` model
- WP05: `CharterService` with `entries$` BehaviorSubject and `remove()` method

**Existing routing** (`tools/pack-dashboard/src/app/app.routes.ts`):
```typescript
{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
{ path: 'dashboard', component: DashboardComponent },
{ path: 'artifacts/builtin/:kind/:id', component: BuiltinDetailComponent },
{ path: 'artifacts/:kind', component: ArtifactListComponent },
{ path: 'artifacts/:kind/:id', component: ArtifactDetailComponent },
{ path: 'org-bindings', component: OrgBindingsComponent },
```
ORDERING NOTE: `artifacts/builtin/:kind/:id` must remain before `artifacts/:kind/:id`.
Add `{ path: 'charter', component: CharterComponent }` — position after `org-bindings`.

**Sidebar** (`tools/pack-dashboard/src/app/layout/sidebar.component.ts`):
- Has nav links for Dashboard, artefact kinds, Org Bindings.
- Add a "Charter" link at the end of the nav, using `[routerLink]="['/charter']"`.
- Style consistent with existing nav items.

**ARTIFACT_KINDS order** (from `tools/pack-dashboard/src/app/models/artifact.model.ts`):
The `ArtifactKind` type definition order IS the display order. Use this exact sequence:
`directives → tactics → procedures → styleguides → toolguides → paradigms → agent_profiles → mission_step_contracts → templates`.
Do NOT hardcode a new array — derive from the existing `ARTIFACT_KINDS` constant if one exists, or define once based on the type order.

## Subtask Guidance

### T028 — CharterComponent page

**File**: Create `tools/pack-dashboard/src/app/pages/charter/charter.component.ts`

**Component class**:
```typescript
@Component({
  selector: 'app-charter',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink],
  templateUrl: './charter.component.html',  // or inline template
})
export class CharterComponent {
  readonly ARTIFACT_KINDS: ArtifactKind[] = [
    'directives', 'tactics', 'procedures', 'styleguides', 'toolguides',
    'paradigms', 'agent_profiles', 'mission_step_contracts', 'templates',
  ];

  readonly groupedEntries$: Observable<Map<ArtifactKind, CharterEntry[]>>;

  constructor(private charterService: CharterService, private artifactService: ArtifactService) {
    this.groupedEntries$ = this.charterService.entries$.pipe(
      filter(entries => entries !== null),
      map(entries => {
        const map = new Map<ArtifactKind, CharterEntry[]>();
        for (const kind of this.ARTIFACT_KINDS) map.set(kind, []);
        for (const entry of entries!) {
          map.get(entry.artifact_kind)?.push(entry);
        }
        return map;
      }),
    );
  }

  removeFromCharter(artifactId: string): void {
    this.charterService.remove(artifactId).subscribe();
  }

  totalCount$(entries$: Observable<CharterEntry[] | null>): Observable<number> {
    return entries$.pipe(map(e => e?.length ?? 0));
  }
}
```

**Template structure** (inline or external `.html`):

```html
<div class="charter-page">
  <h2>Org Charter</h2>
  <p class="charter-summary">{{ (charterService.entries$ | async)?.length ?? 0 }} artefacts in charter</p>

  <!-- Empty state (FR-013) -->
  <div *ngIf="(charterService.entries$ | async)?.length === 0" class="rn-empty-state">
    <p>No artefacts in the org charter yet.</p>
    <p>Browse any artefact and use the "Add to Charter" toggle to add it here.</p>
  </div>

  <!-- Group by kind -->
  <ng-container *ngFor="let kind of ARTIFACT_KINDS">
    <ng-container *ngIf="(groupedEntries$ | async)?.get(kind)?.length as count">
      <section class="charter-group" *ngIf="count > 0">
        <h3 class="charter-group__kind">{{ kind | titlecase }}</h3>
        <ul class="charter-entry-list">
          <li *ngFor="let entry of (groupedEntries$ | async)?.get(kind)" class="charter-entry">
            <!-- Link to artefact detail -->
            <a [routerLink]="['/artifacts', entry.artifact_kind, entry.artifact_id]">
              {{ entry.artifact_id }}
            </a>
            <!-- Remove button -->
            <button class="rn-btn rn-btn--sm rn-btn--ghost"
                    (click)="removeFromCharter(entry.artifact_id)">Remove</button>
          </li>
        </ul>
      </section>
    </ng-container>
  </ng-container>
</div>
```

**Unknown artefact handling** (per research.md §3 and C-002 post-review note):
The `/charter` view must handle chartered artefact IDs that no longer exist in the pack.
These will navigate to a 404-equivalent page if clicked. Display the `artifact_id` as the
link text even if the artefact is unknown — do NOT crash or hide the entry. The detail
page's own not-found state handles the UX for the missing artefact.

If the codebase already has a `getArtefactTitle(id)` lookup, use it to show a friendly
name; if not, showing the raw `artifact_id` is acceptable and correct for this WP.

---

### T029 — Add /charter route to app.routes.ts

**File**: `tools/pack-dashboard/src/app/app.routes.ts`

Add after the `org-bindings` route entry:
```typescript
{ path: 'charter', component: CharterComponent },
```

Import `CharterComponent` at the top of the file.

**Do not change** the ordering of `artifacts/builtin/:kind/:id` and `artifacts/:kind/:id` — keep those in their existing order.

---

### T030 — Add Charter nav link to sidebar.component.ts

**File**: `tools/pack-dashboard/src/app/layout/sidebar.component.ts`

Add a nav link for Charter after the Org Bindings link. The exact HTML depends on the sidebar's existing nav item markup — follow the pattern exactly.

Typical structure (verify against actual file):
```html
<li class="sidebar__nav-item">
  <a routerLink="/charter" routerLinkActive="sidebar__nav-item--active">
    Charter
  </a>
</li>
```

Or if the sidebar uses a different component/pattern (e.g., `<app-nav-item>`), follow that pattern.

Add `RouterLink` and `RouterLinkActive` to the sidebar's imports if not already present.

---

### T031 — Wire CharterComponent to CharterService; verify empty state and remove action

**Purpose**: Integration smoke-check tasks (done during development, not a separate file).

1. Verify `CharterService` is injected and `entries$` emits correctly when charter is empty.
2. Verify empty state block renders when `entries$.length === 0`.
3. Verify remove action: clicking "Remove" on a charter entry calls `charterService.remove()`, BehaviorSubject updates, and the entry disappears from the list without page reload.
4. Verify group sections are hidden when a kind has no entries (using `*ngIf="count > 0"` above).
5. Verify count summary updates correctly after add/remove from detail page.

These checks are part of implementing T028 — they are listed here as explicit acceptance criteria, not as separate implementation steps.

## Definition of Done

- [ ] `CharterComponent` created as standalone Angular component
- [ ] Artefacts grouped by kind in ARTIFACT_KINDS order (derived from existing constant, not hardcoded separately)
- [ ] Empty state message renders when charter has 0 entries (FR-013)
- [ ] Unknown artefact IDs render without error (show artifact_id as link text)
- [ ] Remove action updates `CharterService` BehaviorSubject; entry disappears without page reload
- [ ] Count summary ("N artefacts in charter") updates correctly
- [ ] `/charter` route registered in `app.routes.ts`
- [ ] Charter nav link visible in sidebar; `routerLinkActive` style applied when on `/charter`
- [ ] No hex CSS values; no `font-weight: bold`
- [ ] `ng build --configuration=production` succeeds
- [ ] `npx tsc --noEmit` compiles clean

## Risks

- `| titlecase` pipe on `artifact_kind` converts `agent_profiles` → `Agent Profiles` — verify the display is acceptable. If a more specific label map is needed, define a `KIND_LABELS` map consistent with the one in `ArtifactListComponent`.
- The `*ngFor` over kinds combined with `*ngIf="count > 0"` creates nested structural directives. In Angular 17+, use `@for`/`@if` blocks if the rest of the codebase uses the new template syntax. Match the existing syntax pattern used in other page components.
- `RouterLink` import: if `CharterComponent` is standalone and does not import `RouterLink`, navigation links will silently fail to render. Ensure the import is present.

## Activity Log

- 2026-06-01T10:45:10Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1100898 – Assigned agent via action command
- 2026-06-01T10:48:13Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1100898 – Charter view: /charter route, sidebar nav, grouped by kind, count summary, empty state, remove action on all entries including orphans, TypeScript clean
- 2026-06-01T10:48:38Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1116165 – Started review via action command
- 2026-06-01T10:51:10Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1116165 – Review passed: /charter route (lazy loadComponent), sidebar nav with routerLinkActive, ARTIFACT_KINDS imported constant (not hardcoded), count summary 'N artefacts in charter', empty state renders at 0 entries, orphan remove action unconditional on all entries, TypeScript clean
