---
work_package_id: WP09
title: Read-only built-in detail view
dependencies:
- WP08
requirement_refs:
- FR-014
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T040
- T041
- T042
- T043
- T044
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1579822"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/pages/builtin-detail/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/pages/builtin-detail/builtin-detail.component.ts
- tools/pack-dashboard/src/app/app.routes.ts
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

Create `BuiltinDetailComponent` at `/artifacts/builtin/:kind/:id` with a read-only YAML editor and info banner. Register the route as the **first** entry in the artifacts route group in `app.routes.ts` — before both `/artifacts/:kind` and `/artifacts/:kind/:id`.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP09 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

The Angular router matches routes top-to-bottom. If `/artifacts/builtin/:kind/:id` is registered AFTER `/artifacts/:kind`, Angular matches the string `builtin` as the `:kind` parameter — routing to `ArtifactListComponent` with kind `builtin`, which does not exist.

**Route ordering is the single most important constraint in this WP.**

**Existing components to model after**:
- `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`
- `tools/pack-dashboard/src/app/components/yaml-editor/yaml-editor.component.ts`

**Files to read first**:
- `tools/pack-dashboard/src/app/app.routes.ts` (current routes)
- `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts` (model)

---

## Subtask T040 — Create `BuiltinDetailComponent`

**File**: `tools/pack-dashboard/src/app/pages/builtin-detail/builtin-detail.component.ts` (new)

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BuiltinService } from '../../services/builtin.service';
import { YamlEditorComponent } from '../../components/yaml-editor/yaml-editor.component';
import { StructuredViewComponent } from '../../components/structured-view/structured-view.component';
import { ArtifactDetail, ArtifactKind } from '../../models/artifact.model';

@Component({
  selector: 'app-builtin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, YamlEditorComponent, StructuredViewComponent],
  template: `
    <div>
      <a [routerLink]="['/artifacts', kind]" class="rn-btn rn-btn--secondary" style="margin-bottom: 16px; display: inline-block;">
        ← Back to list
      </a>

      <!-- Read-only banner (FR-014) -->
      <div class="builtin-banner">
        <strong>spec-kitty built-in artifact</strong>
        — This artifact is provided by the spec-kitty platform and cannot be edited here.
        To specialise or override it, create a new artifact in the pack.
      </div>

      @if (loading) {
        <p>Loading…</p>
      } @else if (error) {
        <p class="rn-badge rn-badge--danger">{{ error }}</p>
      } @else if (artifact) {
        <div style="display: flex; gap: 16px; align-items: baseline; margin-bottom: 16px; flex-wrap: wrap;">
          <h2 style="margin: 0;">{{ artifact.title }}</h2>
          <span class="rn-badge rn-badge--source-builtin">spec-kitty built-in</span>
        </div>

        <dl style="display: grid; grid-template-columns: 150px 1fr; gap: 4px 16px; margin-bottom: 16px;">
          <dt>Kind</dt><dd>{{ artifact.kind }}</dd>
          <dt>ID</dt><dd>{{ artifact.id }}</dd>
        </dl>

        <section class="sv-section-wrap">
          <h3 class="sv-section-heading">Structured View</h3>
          <app-structured-view
            [parsedData]="artifact.parsedData"
            [kind]="kind">
          </app-structured-view>
        </section>

        <!-- YAML editor in read-only mode (FR-014) -->
        <div style="margin-top: 24px;">
          <h3 style="margin: 0 0 12px;">YAML Content <span style="font-size: 0.75rem; font-weight: 400; opacity: 0.6;">(read-only)</span></h3>
          <app-yaml-editor
            [content]="artifact.content"
            [readOnly]="true">
          </app-yaml-editor>
        </div>
      }
    </div>
  `,
})
export class BuiltinDetailComponent implements OnInit {
  kind: ArtifactKind = 'directives';
  id = '';
  artifact: ArtifactDetail | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private builtinService: BuiltinService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.kind = params['kind'] as ArtifactKind;
      this.id = params['id'];
      this.loadArtifact();
    });
  }

  private loadArtifact(): void {
    this.loading = true;
    this.error = null;
    this.builtinService.getDetail(this.kind, this.id).subscribe({
      next: (artifact) => {
        this.artifact = artifact;
        this.loading = false;
      },
      error: () => {
        this.error = `Built-in artifact not found: ${this.kind}/${this.id}`;
        this.loading = false;
      },
    });
  }
}
```

---

## Subtask T041 — Register route in `app.routes.ts` (FIRST in artifacts group)

**File**: `tools/pack-dashboard/src/app/app.routes.ts`

**CRITICAL**: The `/artifacts/builtin/:kind/:id` route MUST be placed BEFORE both `/artifacts/:kind` AND `/artifacts/:kind/:id`.

Current state:
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', ... },
  { path: 'artifacts/:kind', loadComponent: ... },
  { path: 'artifacts/:kind/:id', loadComponent: ... },
];
```

Required state:
```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', ... },
  // ORDERING CRITICAL: builtin route MUST be before both :kind and :kind/:id
  {
    path: 'artifacts/builtin/:kind/:id',
    loadComponent: () =>
      import('./pages/builtin-detail/builtin-detail.component').then(m => m.BuiltinDetailComponent)
  },
  { path: 'artifacts/:kind', loadComponent: ... },
  { path: 'artifacts/:kind/:id', loadComponent: ... },
];
```

Add a comment above the builtin route explaining the ordering requirement (this is the kind of non-obvious constraint that a future developer must not inadvertently "fix" by sorting alphabetically).

---

## Subtask T042 — Wire `YamlEditorComponent` with `[readOnly]="true"`

In `BuiltinDetailComponent` template above, the editor is already declared as:
```html
<app-yaml-editor [content]="artifact.content" [readOnly]="true">
```

Verify that `YamlEditorComponent` already supports a `readOnly` input. Read the component:
```
tools/pack-dashboard/src/app/components/yaml-editor/yaml-editor.component.ts
```

If `readOnly` is not yet an input, add it:
```typescript
@Input() readOnly = false;
```

And in the template/editor setup, disable editing when `readOnly = true`. The exact mechanism depends on the editor library used. Common patterns:
- CodeMirror: set `editable: false` in the state config
- Plain `<textarea>`: `[attr.readonly]="readOnly || null"`

Check the current implementation and apply the minimal change.

---

## Subtask T043 — Read-only info banner

Already included in T040. The banner text (from FR-014):
> "This is a spec-kitty built-in artifact. It cannot be edited here. To specialize or override it, create a new artifact in the pack."

The component uses the `.builtin-banner` CSS class styled in T044.

---

## Subtask T044 — CSS for built-in detail banner

**File**: `tools/pack-dashboard/src/styles.scss`

```scss
.builtin-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: var(--rn-ice-blue-light, #D0E6EF);
  border: 1px solid var(--rn-ice-blue, #1788BE);
  border-left: 4px solid var(--rn-ice-blue, #1788BE);
  border-radius: 4px;
  font-size: var(--rn-font-size-body, 0.875rem);
  color: var(--rn-petrol-blue, #012D3F);

  strong {
    white-space: nowrap;
  }
}

@media (prefers-color-scheme: dark) {
  .builtin-banner {
    background: #0A2E3D;
    border-color: #1788BE;
    color: #D0E6EF;
  }
}
```

---

## Definition of Done

- [ ] `BuiltinDetailComponent` created at `pages/builtin-detail/builtin-detail.component.ts`
- [ ] Route `/artifacts/builtin/:kind/:id` registered as FIRST entry before `:kind` and `:kind/:id`
- [ ] Comment in `app.routes.ts` explaining route ordering requirement
- [ ] `YamlEditorComponent` accepts `[readOnly]="true"` and disables editing
- [ ] Info banner visible on all built-in detail pages
- [ ] Page shows kind, ID, Structured View, and read-only YAML editor
- [ ] "Back to list" link navigates to `/artifacts/:kind`
- [ ] `ng build --configuration production` completes without TypeScript errors

---

## Reviewer Guidance

- **Verify route order in `app.routes.ts`** — this is the primary failure mode. Check that `artifacts/builtin/:kind/:id` comes before `artifacts/:kind` in the array.
- Verify the YAML editor is truly non-editable (no save/revert buttons, no content change events wired).
- Verify the banner text matches FR-014 exactly.
- Verify `BuiltinDetailComponent` uses `standalone: true` and is listed in `loadComponent` (lazy loaded), not in a shared module.

## Activity Log

- 2026-05-21T13:01:06Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1572591 – Started implementation via action command
- 2026-05-21T13:03:09Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1572591 – Ready for review: BuiltinDetailComponent created with read-only YAML editor, FR-014 banner, /artifacts/builtin/:kind/:id route registered first in app.routes.ts with ordering comment, .builtin-banner CSS added. TypeScript check passes clean.
- 2026-05-21T13:03:41Z – claude:sonnet:reviewer:reviewer – shell_pid=1579822 – Started review via action command
- 2026-05-21T13:05:23Z – claude:sonnet:reviewer:reviewer – shell_pid=1579822 – Review passed: route order correct (builtin first at index 2, before :kind at index 3 and :kind/:id at index 4), readOnly editor confirmed (no save/revert, no contentChange), FR-014 banner present, standalone lazy-loaded component, TypeScript compiles clean
