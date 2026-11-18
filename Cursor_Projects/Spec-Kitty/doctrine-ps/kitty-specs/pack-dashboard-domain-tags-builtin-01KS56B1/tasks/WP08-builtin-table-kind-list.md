---
work_package_id: WP08
title: Built-in table on kind-list pages + BuiltinService
dependencies:
- WP07
requirement_refs:
- FR-013
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T036
- T037
- T038
- T039
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1566987"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/services/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/services/builtin.service.ts
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

Create the frontend `BuiltinService`, add a collapsible "Platform Defaults" table to `ArtifactListComponent` showing the built-in artifacts for the current kind, add a source badge that distinguishes built-in rows, and show a count header above the table.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP08 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

After WP07, `GET /api/builtin/:kind` is available. This WP surfaces the built-in artifacts below the pack artifact table on kind-list pages. Built-in rows are **non-navigable** — no edit link, no `[routerLink]` to an edit page. The table is collapsed by default. A source badge distinguishes built-in rows from pack rows.

**Resolved constraint (C-004)**: No pack-coverage ratio is shown — just the raw count of built-in artifacts for this kind.

**Files to read first**:
- `tools/pack-dashboard/src/app/pages/artifact-list/artifact-list.component.ts`
- `tools/pack-dashboard/src/app/services/artifact.service.ts` (pattern to follow for service)

---

## Subtask T036 — Create `BuiltinService`

**File**: `tools/pack-dashboard/src/app/services/builtin.service.ts` (new)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArtifactSummary, ArtifactKind, ArtifactDetail } from '../models/artifact.model';

@Injectable({ providedIn: 'root' })
export class BuiltinService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Record<ArtifactKind, ArtifactSummary[]>> {
    return this.http.get<Record<ArtifactKind, ArtifactSummary[]>>('/api/builtin');
  }

  getByKind(kind: ArtifactKind): Observable<ArtifactSummary[]> {
    return this.http.get<ArtifactSummary[]>(`/api/builtin/${kind}`);
  }

  getDetail(kind: ArtifactKind, id: string): Observable<ArtifactDetail> {
    return this.http.get<ArtifactDetail>(`/api/builtin/${kind}/${encodeURIComponent(id)}`);
  }
}
```

---

## Subtask T037 — Collapsible "Platform Defaults" table in `ArtifactListComponent`

**File**: `tools/pack-dashboard/src/app/pages/artifact-list/artifact-list.component.ts`

Changes:
1. Inject `BuiltinService`.
2. Add fields: `builtinArtifacts: ArtifactSummary[] = [];`, `builtinExpanded = false;`
3. In `ngOnInit()`, after loading pack artifacts, call `BuiltinService.getByKind(kind)`.
4. Add the collapsible "Platform Defaults" section below the pack table in the template.

**Load built-ins** (in `ngOnInit()`):
```typescript
this.builtinService.getByKind(this.kind).subscribe({
  next: (artifacts) => { this.builtinArtifacts = artifacts; },
  error: () => { this.builtinArtifacts = []; }, // graceful: don't block UI if route fails
});
```

**Template addition** (after the main `</table>` closing tag, still inside the `@else` block):

```html
<!-- Platform Defaults collapsible (FR-013) -->
@if (builtinArtifacts.length > 0) {
  <div style="margin-top: 32px;">
    <button
      type="button"
      class="dash-section__toggle"
      [attr.aria-expanded]="builtinExpanded"
      (click)="builtinExpanded = !builtinExpanded">
      <span>Platform Defaults <span class="rn-badge rn-badge--source-builtin" style="margin-left:8px;">built-in</span></span>
      <span>{{ builtinArtifacts.length }} artifact{{ builtinArtifacts.length === 1 ? '' : 's' }} ▸</span>
    </button>

    @if (builtinExpanded) {
      <table class="rn-table" style="margin-top: 8px;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          @for (artifact of builtinArtifacts; track artifact.id) {
            <tr>
              <td>{{ artifact.id }}</td>
              <td>
                <a [routerLink]="['/artifacts/builtin', artifact.kind, artifact.id]">
                  {{ artifact.title }}
                </a>
              </td>
              <td>
                <span class="rn-badge rn-badge--source-builtin">spec-kitty built-in</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
}
```

**Note on navigation**: Built-in artifact rows have a `[routerLink]` to the read-only detail view (`/artifacts/builtin/:kind/:id`) — this is the informational "view" link, not an edit link. There is no "Edit" button or link. The route will be created in WP09.

---

## Subtask T038 — Source badge CSS

**File**: `tools/pack-dashboard/src/styles.scss`

Add to the badge section:

```scss
// Source badge for built-in artifacts
.rn-badge--source-builtin {
  background: var(--rn-ice-blue, #1788BE);
  color: #fff;
  border: none;
  font-weight: 600;
  font-size: var(--rn-font-size-footer, 0.625rem);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (prefers-color-scheme: dark) {
  .rn-badge--source-builtin {
    background: #0D5A8A;
    color: #D0E6EF;
  }
}
```

---

## Subtask T039 — Count header

Already included in T037: the "Platform Defaults" toggle button shows the count:
```
Platform Defaults [built-in badge]     3 artifacts ▸
```

No coverage ratio is shown (C-004). This is count-only.

---

## Definition of Done

- [ ] `BuiltinService` created with `getAll()`, `getByKind()`, `getDetail()`
- [ ] "Platform Defaults" collapsible section visible on kind-list page when built-ins exist
- [ ] Section is collapsed by default
- [ ] Built-in rows show the artifact ID, title (linked to read-only view), and source badge
- [ ] Built-in rows do NOT have an edit link
- [ ] Source badge `.rn-badge--source-builtin` styled in `styles.scss` with dark mode variant
- [ ] Count of built-in artifacts shown in the toggle header
- [ ] No pack-coverage ratio shown anywhere
- [ ] `ng build --configuration production` completes without errors

---

## Reviewer Guidance

- Verify the "Platform Defaults" section is absent (not just hidden) when `builtinArtifacts.length === 0`.
- Verify built-in row `[routerLink]` points to `/artifacts/builtin/:kind/:id` — not to `/artifacts/:kind/:id`.
- Verify `builtinExpanded = false` by default.
- Verify the `BuiltinService` is injected, not constructed manually.
- Confirm no coverage ratio or comparison count is displayed anywhere in this WP's output.

## Activity Log

- 2026-05-21T12:52:35Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1543978 – Started implementation via action command
- 2026-05-21T12:58:25Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1543978 – Ready for review: BuiltinService created, Platform Defaults collapsible section added to kind-list, source badge styled
- 2026-05-21T12:59:06Z – claude:sonnet:reviewer:reviewer – shell_pid=1566987 – Started review via action command
- 2026-05-21T13:00:47Z – claude:sonnet:reviewer:reviewer – shell_pid=1566987 – Review passed: BuiltinService correct (providedIn root, 3 methods with relative /api/builtin/... URLs), Platform Defaults section collapsible with builtinExpanded=false default, no edit links on built-in rows (only read-only /artifacts/builtin/:kind/:id routerLink), source badge rn-badge--source-builtin present in template and styled in styles.scss with dark mode variant, count header shown in toggle button, no coverage ratio, TypeScript compiles clean
