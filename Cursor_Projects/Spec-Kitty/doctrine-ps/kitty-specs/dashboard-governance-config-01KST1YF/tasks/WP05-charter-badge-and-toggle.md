---
work_package_id: WP05
title: Charter Badge and Toggle Frontend
dependencies:
- WP04
requirement_refs:
- FR-007
- FR-008
- FR-014
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:36:52.241332+00:00'
subtasks:
- T022
- T023
- T024
- T025
- T026
- T027
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1083171"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/models/charter.model.ts
- tools/pack-dashboard/src/app/services/charter.service.ts
- tools/pack-dashboard/src/app/components/charter-badge/**
- tools/pack-dashboard/src/app/pages/artifact-list/**
- tools/pack-dashboard/src/app/pages/artifact-detail/**
- tools/pack-dashboard/src/app/pages/builtin-detail/**
- tools/pack-dashboard/src/app/pages/dashboard/**
- tools/pack-dashboard/src/app/pages/domain-artifacts/**
- tools/pack-dashboard/src/app/components/platform-defaults-section/**
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

Implement the frontend charter integration: `CharterService` (Angular), `CharterBadgeComponent`,
charter toggle on both detail pages, badge on all artefact list pages, and the FR-007
scope audit of Dashboard and DomainArtifacts pages.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Start from: `spec-kitty agent action implement WP05 --agent <name>`

## Context

**Charter API** (WP04, now available):
- `GET /api/charter` → `{ entries: CharterEntry[] }`
- `POST /api/charter` → 201 with `{ entry }`
- `DELETE /api/charter/:artifactId` → 204

**Artefact kind types** (from `tools/pack-dashboard/src/app/models/artifact.model.ts`):
```typescript
type ArtifactKind =
  | 'directives' | 'tactics' | 'procedures' | 'styleguides'
  | 'toolguides' | 'paradigms' | 'agent_profiles'
  | 'mission_step_contracts' | 'templates';
```
Reuse this existing type or import it — do NOT define a duplicate.

**ArtifactListComponent** renders artefact rows in a table/grid. Rows have the artefact's
`id`, `kind`, `title`, and existing validation/review badges.

**ArtifactDetailComponent** has a header area that currently shows validation and review
status badges. The charter toggle should sit in the same area.

**PlatformDefaultsSectionComponent** renders built-in artefact rows within the ArtifactListComponent page. It also needs the charter badge.

**Regnology CSS**:
- Use `--rn-color-*` brand tokens for colours; no hex.
- Badge style: small pill chip, e.g. `.rn-chip rn-chip--amber` for "In Charter" indicator.
- No `font-weight: bold`.

## Subtask Guidance

### T022 — Frontend charter.model.ts

**File**: Create `tools/pack-dashboard/src/app/models/charter.model.ts`

```typescript
// Import ArtifactKind from artifact.model.ts to avoid duplication
import { ArtifactKind } from './artifact.model';

export { ArtifactKind };  // re-export for convenience in charter components

export interface CharterEntry {
  artifact_id: string;
  artifact_kind: ArtifactKind;
}

export interface CharterResponse {
  entries: CharterEntry[];
}
```

---

### T023 — Frontend charter.service.ts

**File**: Create `tools/pack-dashboard/src/app/services/charter.service.ts`

**Pattern**: Injectable service with BehaviorSubject cache. The BehaviorSubject is initialized
to `null` (not yet loaded) and set to `CharterEntry[]` after the first GET.

**Key design decisions** (from research.md §4):
- BehaviorSubject is the client-side cache. Single-tab use only (no polling).
- Initialize eagerly via Angular's `APP_INITIALIZER` token, OR load on first `isChartered()` call if faster integration is preferred. Choose based on what the codebase already uses for service initialization.
- `null` initial state means "charter not yet loaded". Components must handle this gracefully (render no badge, not an error).

```typescript
@Injectable({ providedIn: 'root' })
export class CharterService {
  private charter$ = new BehaviorSubject<CharterEntry[] | null>(null);
  readonly entries$ = this.charter$.asObservable();

  constructor(private http: HttpClient) {
    this.load();  // Eager initialization on service injection
  }

  private load(): void {
    this.http.get<CharterResponse>('/api/charter').subscribe({
      next: res => this.charter$.next(res.entries),
      error: () => this.charter$.next([]),  // fail open — treat as empty
    });
  }

  isChartered(artifactId: string): boolean {
    return this.charter$.getValue()?.some(e => e.artifact_id === artifactId) ?? false;
  }

  add(artifactId: string, artifactKind: ArtifactKind): Observable<void> {
    return this.http.post<{ entry: CharterEntry }>('/api/charter', { artifact_id: artifactId, artifact_kind: artifactKind }).pipe(
      tap(res => {
        const current = this.charter$.getValue() ?? [];
        this.charter$.next([...current, res.entry]);
      }),
      map(() => void 0),
    );
  }

  remove(artifactId: string): Observable<void> {
    return this.http.delete(`/api/charter/${encodeURIComponent(artifactId)}`, { observe: 'response' }).pipe(
      tap(() => {
        const current = this.charter$.getValue() ?? [];
        this.charter$.next(current.filter(e => e.artifact_id !== artifactId));
      }),
      map(() => void 0),
    );
  }
}
```

**Important**: `load()` in the constructor provides eager initialization without APP_INITIALIZER complexity. If the codebase already uses APP_INITIALIZER for other services, use that pattern instead for consistency. Either way, add a comment explaining the initialization choice.

---

### T024 — CharterBadgeComponent

**File**: Create `tools/pack-dashboard/src/app/components/charter-badge/charter-badge.component.ts`

**Standalone component, inline template**:

```typescript
@Component({
  selector: 'app-charter-badge',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  template: `
    <span *ngIf="isChartered$ | async" class="rn-chip rn-chip--amber charter-badge"
          title="In org charter">Charter</span>
  `,
})
export class CharterBadgeComponent implements OnInit {
  @Input() artifactId!: string;
  isChartered$!: Observable<boolean>;

  constructor(private charterService: CharterService) {}

  ngOnInit(): void {
    this.isChartered$ = this.charterService.entries$.pipe(
      map(entries => entries?.some(e => e.artifact_id === this.artifactId) ?? false),
    );
  }
}
```

**Null-safety**: `entries?.some(...) ?? false` — when the BehaviorSubject is `null` (loading state), `isChartered$` emits `false` → no badge renders. No error, no loading spinner needed.

**CSS**: The `.charter-badge` class should use small amber chip styling matching existing domain chips. Add styles inline or in a co-located `.scss` file.

---

### T025 — Charter badge on ArtifactListComponent + PlatformDefaultsSectionComponent

**ArtifactListComponent** (`tools/pack-dashboard/src/app/pages/artifact-list/artifact-list.component.ts`):

1. Add `CharterBadgeComponent` to the `imports` array of the standalone component.
2. In the template, add `<app-charter-badge [artifactId]="artifact.id">` next to the existing validation badge in the artefact row. Place it after the review status badge.
3. Do NOT change the table/grid structure — add the badge inline within the existing row markup.

**PlatformDefaultsSectionComponent** (`tools/pack-dashboard/src/app/components/platform-defaults-section/`):

1. Inspect the component template to see how built-in artefact rows are rendered.
2. Add `<app-charter-badge [artifactId]="builtin.id">` to each built-in artefact row using the same placement pattern as ArtifactListComponent.
3. Add `CharterBadgeComponent` to imports.

---

### T026 — Charter toggle on ArtifactDetailComponent + BuiltinDetailComponent

**ArtifactDetailComponent** (`tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`):

1. Add `CharterService` injection to the component.
2. Add `isChartered$: Observable<boolean>` derived from `charterService.entries$`.
3. Add toggle method:
   ```typescript
   toggleCharter(): void {
     const kind = this.artifact?.kind;
     if (!kind) return;
     if (this.charterService.isChartered(this.artifact.id)) {
       this.charterService.remove(this.artifact.id).subscribe();
     } else {
       this.charterService.add(this.artifact.id, kind).subscribe();
     }
   }
   ```
4. In the template, add a toggle button in the header/badge area:
   ```html
   <button class="rn-btn rn-btn--sm"
           [class.rn-btn--active]="isChartered$ | async"
           (click)="toggleCharter()">
     {{ (isChartered$ | async) ? 'Remove from Charter' : 'Add to Charter' }}
   </button>
   ```
5. No page reload needed — the BehaviorSubject update in `CharterService.add/remove` propagates to `CharterBadgeComponent` instances automatically (FR-014).

**BuiltinDetailComponent** (`tools/pack-dashboard/src/app/pages/builtin-detail/builtin-detail.component.ts`):

Apply the same toggle. Built-in artefacts use `kind` from the route params (`:kind` segment). The `artifact_kind` value passed to `charterService.add` for built-ins should be the same `ArtifactKind` used by pack artefacts (verify the kind string matches VALID_ARTIFACT_KINDS from the server model).

---

### T027 — FR-007 audit: DashboardComponent + DomainArtifactsComponent

**Purpose**: Confirm whether artefact rows are rendered in `DashboardComponent` and `DomainArtifactsComponent`, and add badges if so.

**DashboardComponent** (`tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`):
- Read the full component template.
- If it renders artefact cards/rows with an artefact ID visible: add `<app-charter-badge [artifactId]="...">` to each row and add `CharterBadgeComponent` to imports.
- If it only renders summary statistics or links without individual artefact rows: document in a code comment `// FR-007 audit: dashboard renders no individual artefact rows — charter badge not applicable` and leave unchanged.

**DomainArtifactsComponent** (`tools/pack-dashboard/src/app/pages/domain-artifacts/domain-artifacts.component.ts`):
- Same audit.
- This page typically shows artefacts filtered by domain. If it renders an artefact list, add the badge.

**Record outcome in both components** with a brief comment regardless of the decision. This satisfies the spec's acceptance invariant that FR-007 coverage is explicitly confirmed.

## Definition of Done

- [ ] `charter.model.ts` (frontend) created; reuses `ArtifactKind` from `artifact.model.ts`
- [ ] `CharterService` initializes eagerly; `isChartered()` returns `false` (not error) during loading
- [ ] `CharterBadgeComponent` renders no badge (not error) when charter state is `null`
- [ ] Charter badge appears on `ArtifactListComponent` artefact rows
- [ ] Charter badge appears on `PlatformDefaultsSectionComponent` built-in rows
- [ ] Charter toggle appears on `ArtifactDetailComponent` header
- [ ] Charter toggle appears on `BuiltinDetailComponent` header
- [ ] Toggling on detail page updates badge on list page without page reload (FR-014)
- [ ] DashboardComponent and DomainArtifactsComponent each have a comment confirming audit outcome
- [ ] No hex CSS values; no `font-weight: bold`
- [ ] `ng build --configuration=production` succeeds
- [ ] `npx tsc --noEmit` compiles clean

## Risks

- Race condition on initial load: `isChartered()` returns false before the GET /api/charter response arrives. This is by design (fail-open) and is acceptable since the constructor eagerly calls `load()`. The badge will re-render correctly once the BehaviorSubject emits.
- ArtifactKind mismatch: built-in artefacts may use a different kind string than expected. Verify the kind value in `BuiltinDetailComponent` matches `ArtifactKind` / `VALID_ARTIFACT_KINDS` from the server model before passing to `charterService.add()`.
- Multiple imports of `CharterBadgeComponent`: required in every list component that shows artefact rows. Don't miss `PlatformDefaultsSectionComponent`.

## Activity Log

- 2026-06-01T10:36:53Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1064048 – Assigned agent via action command
- 2026-06-01T10:39:59Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1064048 – Charter badge, service (BehaviorSubject), toggle on detail pages, FR-007 audit complete; TypeScript clean. Implementation was merged into mission base in a prior session (commit a4fb7c96). All 6 subtasks (T022-T027) verified: charter.model.ts reuses ArtifactKind, CharterService BehaviorSubject eager init, CharterBadgeComponent null-safe, badge on ArtifactListComponent + DomainArtifactsComponent (T025/T027), toggle on ArtifactDetailComponent + BuiltinDetailComponent (T026), FR-007 audit on Dashboard (no badge - KPI only) and DomainArtifacts (badge added). No router.navigate or extra GET after add/remove - FR-014 compliant.
- 2026-06-01T10:40:31Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1083171 – Started review via action command
- 2026-06-01T10:44:43Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1083171 – Review passed: charter badge, service, toggle; FR-007 coverage verified; FR-014 BehaviorSubject propagation confirmed; TypeScript clean
