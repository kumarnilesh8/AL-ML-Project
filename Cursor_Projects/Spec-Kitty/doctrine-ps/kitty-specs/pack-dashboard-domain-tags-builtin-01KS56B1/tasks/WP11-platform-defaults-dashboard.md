---
work_package_id: WP11
title: Platform Defaults section on dashboard
dependencies:
- WP07
requirement_refs:
- FR-017
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T049
- T050
- T051
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1610004"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/components/platform-defaults-section/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/components/platform-defaults-section/platform-defaults-section.component.ts
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

Create `PlatformDefaultsSectionComponent` — a standalone Angular component that displays the per-kind count of built-in artifacts. Wire it into `DashboardComponent` by adding `<app-platform-defaults-section>` to the dashboard template. No coverage ratio. No comparison to pack artifacts.

**Implementation note**: This WP creates a new standalone component rather than editing `dashboard.component.ts` directly. This avoids a cross-lane merge conflict with WP05 (which owns `dashboard.component.ts` in Lane A). The minimal change to `dashboard.component.ts` (adding a single `<app-platform-defaults-section>` tag and import) is low-conflict and documented below.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP11 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

`DashboardComponent` already has a "By Kind" section (pack artifact KPI cards). WP05 adds "By Domain". This WP adds a third section: "Platform Defaults" — showing how many built-in artifacts exist per kind.

**Constraint (C-004)**: Do NOT show a pack-coverage ratio. Only show the raw built-in count per kind.

**Cross-lane note**: This WP runs in Lane B independently of Lane A. `dashboard.component.ts` is primarily owned by WP05 (Lane A). The only changes to `dashboard.component.ts` needed here are: (1) importing `PlatformDefaultsSectionComponent`, (2) adding `<app-platform-defaults-section>` to the template. These are minimal and mergeable without conflict.

**Files to read first**:
- `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`
- `tools/pack-dashboard/src/app/services/builtin.service.ts` (created in WP08)

---

## Subtask T049 — Create `PlatformDefaultsSectionComponent`

**File**: `tools/pack-dashboard/src/app/components/platform-defaults-section/platform-defaults-section.component.ts` (new)

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuiltinService } from '../../services/builtin.service';
import { ArtifactKind, ARTIFACT_KINDS } from '../../models/artifact.model';
import { KIND_META_MAP } from '../../models/artifact-kind-meta';

@Component({
  selector: 'app-platform-defaults-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dash-section">
      <button
        type="button"
        class="dash-section__toggle"
        [attr.aria-expanded]="expanded"
        (click)="expanded = !expanded">
        <span class="dash-section__title">
          Platform Defaults
          <span class="rn-badge rn-badge--source-builtin" style="margin-left:8px;vertical-align:middle;">spec-kitty</span>
        </span>
        <span class="dash-section__chevron" [class.dash-section__chevron--open]="expanded">▸</span>
      </button>

      @if (expanded) {
        <div class="dash-platform-defaults">
          <p class="dash-platform-defaults__intro">
            These artifacts are provided by the spec-kitty platform and are active in every engagement.
            Use <code>specializes_from</code>, <code>enhances</code>, or <code>overrides</code>
            in your pack artifacts to reference them.
          </p>
          <div class="dash-kpi-grid">
            @for (kind of kinds; track kind) {
              <div class="dash-kpi">
                <span class="ks-kpi__value">{{ counts[kind] ?? 0 }}</span>
                <span class="ks-kpi__label">{{ kindNameFor(kind) }}</span>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class PlatformDefaultsSectionComponent implements OnInit {
  expanded = false;
  kinds = ARTIFACT_KINDS;
  counts: Record<ArtifactKind, number> = {} as Record<ArtifactKind, number>;

  constructor(private builtinService: BuiltinService) {}

  ngOnInit(): void {
    this.builtinService.getAll().subscribe(byKind => {
      const c = {} as Record<ArtifactKind, number>;
      for (const kind of ARTIFACT_KINDS) {
        c[kind] = (byKind[kind] ?? []).length;
      }
      this.counts = c;
    });
  }

  kindNameFor(kind: ArtifactKind): string {
    return KIND_META_MAP[kind]?.name ?? kind;
  }
}
```

---

## Subtask T050 — Wire into `DashboardComponent`

**File**: `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`

This is the minimal cross-lane change. Add ONE import and ONE template tag:

1. Add to imports array:
```typescript
import { PlatformDefaultsSectionComponent } from '../../components/platform-defaults-section/platform-defaults-section.component';
// Add PlatformDefaultsSectionComponent to the @Component imports: []
```

2. Add to template (at the bottom of the statistics area, after any existing sections):
```html
<app-platform-defaults-section></app-platform-defaults-section>
```

No other changes to `dashboard.component.ts` are needed. All logic lives in `PlatformDefaultsSectionComponent`.

---

## Subtask T050 — "Platform Defaults" section template

Add below the "By Kind" section (and optionally below "By Domain" if WP05 is merged):

```html
<!-- Platform Defaults section (FR-017) -->
<section class="dash-section">
  <button
    type="button"
    class="dash-section__toggle"
    [attr.aria-expanded]="platformDefaultsExpanded"
    (click)="platformDefaultsExpanded = !platformDefaultsExpanded">
    <span class="dash-section__title">
      Platform Defaults
      <span class="rn-badge rn-badge--source-builtin" style="margin-left: 8px; vertical-align: middle;">spec-kitty</span>
    </span>
    <span class="dash-section__chevron" [class.dash-section__chevron--open]="platformDefaultsExpanded">▸</span>
  </button>

  @if (platformDefaultsExpanded) {
    <div class="dash-platform-defaults">
      <p class="dash-platform-defaults__intro">
        These artifacts are provided by the spec-kitty platform and are active in every engagement.
        Use <code>specializes_from</code>, <code>enhances</code>, or <code>overrides</code> in your pack artifacts to reference them.
      </p>
      <div class="dash-kpi-grid">
        @for (kind of kinds; track kind) {
          <div class="dash-kpi">
            <span class="ks-kpi__value">{{ builtinCounts[kind] ?? 0 }}</span>
            <span class="ks-kpi__label">{{ kindNameFor(kind) }}</span>
          </div>
        }
      </div>
    </div>
  }
</section>
```

Add `kinds = ARTIFACT_KINDS;` to the component class (or use the existing property if WP05 already added it).

The `kindNameFor(kind)` helper should already exist from prior work. If not:
```typescript
kindNameFor(kind: ArtifactKind): string {
  return KIND_META_MAP[kind]?.name ?? kind;
}
```

**Important**: No coverage ratio column. No "X of Y covered" anywhere. Counts only.

---

## Subtask T051 — CSS for Platform Defaults section

The `.dash-section`, `.dash-section__toggle`, and `.dash-section__chevron` styles were added in WP05. This WP only adds the content-area styles:

**File**: `tools/pack-dashboard/src/styles.scss`

```scss
// ── Platform Defaults dashboard section ──────────────────────────────────────
.dash-platform-defaults {
  padding: 16px 0 4px;
}

.dash-platform-defaults__intro {
  font-size: var(--rn-font-size-body, 0.875rem);
  color: var(--rn-color-neutral-600, #5F6368);
  margin-bottom: 16px;
  line-height: 1.5;

  code {
    background: var(--rn-color-neutral-100, #E8EAED);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.8125rem;
  }
}
```

The KPI grid (`.dash-kpi-grid`, `.dash-kpi`, `.ks-kpi__value`, `.ks-kpi__label`) reuses existing styles from the "By Kind" section. No new KPI styles are needed.

---

## Definition of Done

- [ ] "Platform Defaults" section visible on dashboard
- [ ] Section is collapsed by default (`platformDefaultsExpanded = false`)
- [ ] Per-kind built-in counts are shown as KPI tiles
- [ ] Intro text mentioning `specializes_from` / `enhances` / `overrides` relationship fields
- [ ] No pack-coverage ratio shown anywhere (C-004)
- [ ] `spec-kitty` badge visible in the section toggle header
- [ ] `ng build --configuration production` completes without errors

---

## Reviewer Guidance

- Verify `platformDefaultsExpanded = false` so section starts collapsed.
- Verify no coverage ratio, comparison percentage, or "X of Y" language anywhere in the template.
- Verify the section falls back gracefully if `BuiltinService` returns an empty map (all counts show 0).
- If WP05 was not yet merged, the `.dash-section` CSS may need to be added by this WP. Check before running `ng build`.

## Activity Log

- 2026-05-21T13:12:28Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1605291 – Started implementation via action command
- 2026-05-21T13:14:37Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1605291 – Ready for review: PlatformDefaultsSectionComponent created (standalone, T049), wired to DashboardComponent with minimal import+tag change (T050), TypeScript check passes with no errors (T051). Section collapsed by default, shows per-kind built-in counts, no coverage ratio (C-004 compliant), spec-kitty badge in header.
- 2026-05-21T13:14:54Z – claude:sonnet:reviewer:reviewer – shell_pid=1610004 – Started review via action command
- 2026-05-21T13:16:07Z – claude:sonnet:reviewer:reviewer – shell_pid=1610004 – Review passed: standalone component created, no coverage ratio, minimal dashboard.component.ts change, TypeScript clean
