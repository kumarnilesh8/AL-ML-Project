---
work_package_id: WP05
title: "'By Domain' collapsible section on dashboard"
dependencies:
- WP03
requirement_refs:
- FR-010
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T022
- T023
- T024
- T025
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1587077"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/pages/dashboard/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts
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

Add a collapsible "By Domain" section to `DashboardComponent` that lists each domain with its artifact count and the artifact IDs classified under it.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP05 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

`DashboardComponent` already shows a "By Kind" section with kind-level KPI cards. This WP adds a second collapsible section: "By Domain". The section lists each domain from the vocabulary, shows how many artifacts are tagged to it, and lists the artifact IDs.

**Resolved decision**: Untagged artifacts do NOT produce a warning, counter, or any visual indication on the dashboard. Users discover untagged artifacts by browsing the kind-list pages. The "By Domain" section only shows domains that have ≥ 1 tagged artifact; domains with 0 are still shown (with count 0) to reveal the full vocabulary.

**Files to read first**:
- `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts` (existing dashboard)
- `tools/pack-dashboard/src/app/services/domain.service.ts` (created in WP03)

---

## Subtask T022 — Load `DomainService` in `DashboardComponent`

**File**: `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`

Add to imports:
```typescript
import { DomainService } from '../../services/domain.service';
import { DomainConfig } from '../../models/domain.model';
```

Inject `DomainService` in the constructor. Add class fields:
```typescript
domainConfig: DomainConfig[] = [];
artifactTagsMap: Record<string, string[]> = {};
byDomainExpanded = false;
```

In `ngOnInit()` (or equivalent init), add:
```typescript
this.domainService.getConfig().subscribe(resp => {
  this.domainConfig = resp.domains;
});
this.domainService.getTags().subscribe(resp => {
  const map: Record<string, string[]> = {};
  for (const [id, entry] of Object.entries(resp.tags)) {
    map[id] = entry.domains;
  }
  this.artifactTagsMap = map;
});
```

---

## Subtask T023 — "By Domain" collapsible section template

Place the "By Domain" section in the dashboard template, after the "By Kind" section (or at the bottom of the statistics area).

```html
<!-- By Domain section (FR-010) -->
<section class="dash-section">
  <button
    type="button"
    class="dash-section__toggle"
    [attr.aria-expanded]="byDomainExpanded"
    (click)="byDomainExpanded = !byDomainExpanded">
    <span class="dash-section__title">By Domain</span>
    <span class="dash-section__chevron" [class.dash-section__chevron--open]="byDomainExpanded">▸</span>
  </button>

  @if (byDomainExpanded) {
    <div class="dash-domain-grid">
      @for (domain of domainConfig; track domain.id) {
        @let artifacts = artifactsForDomain(domain.id);
        <div class="dash-domain-card dc-chip--{{ colorClass(domain.color) }}">
          <div class="dash-domain-card__header">
            <span class="dash-domain-card__label">{{ domain.label }}</span>
            <span class="dash-domain-card__count">{{ artifacts.length }}</span>
          </div>
          @if (artifacts.length > 0) {
            <div class="dash-domain-card__ids">
              @for (id of artifacts; track id) {
                <span class="dc-chip dc-chip--default" style="font-size:0.6rem;">{{ id }}</span>
              }
            </div>
          }
        </div>
      }
    </div>
  }
</section>
```

---

## Subtask T024 — Compute artifact counts per domain

Add the following helper methods to the component class:

```typescript
artifactsForDomain(domainId: string): string[] {
  return Object.entries(this.artifactTagsMap)
    .filter(([, domains]) => domains.includes(domainId))
    .map(([id]) => id);
}

colorClass(color?: string): string {
  const allowed = ['blue', 'green', 'red', 'petrol', 'amber', 'purple'];
  return color && allowed.includes(color) ? color : 'default';
}
```

**Constraint**: Do NOT show a count of untagged artifacts or a warning. If a user wants to know which artifacts are untagged they browse the kind-list pages.

---

## Subtask T025 — CSS for the "By Domain" section

**File**: `tools/pack-dashboard/src/styles.scss`

```scss
// ── Dashboard By Domain Section ──────────────────────────────────────────────
.dash-section {
  margin-bottom: 24px;
}

.dash-section__toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  background: var(--rn-color-neutral-050, #F8F9FA);
  border: 1px solid var(--rn-color-neutral-200, #CFD3D9);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--rn-petrol-blue, #012D3F);
  text-align: left;
  &:hover { background: var(--rn-color-neutral-100, #E8EAED); }
  &:focus-visible { outline: 2px solid var(--rn-green-dark, #06A74E); outline-offset: 2px; }
}

.dash-section__title { font-size: 1rem; }

.dash-section__chevron {
  transition: transform 0.2s;
  display: inline-block;
}
.dash-section__chevron--open { transform: rotate(90deg); }

.dash-domain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px 0 4px;
}

.dash-domain-card {
  border: 1px solid var(--rn-color-neutral-200, #CFD3D9);
  border-radius: 8px;
  padding: 12px;
  // Color accent applied via .dc-chip--* modifier class on the element
}

.dash-domain-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.dash-domain-card__label {
  font-weight: 700;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dash-domain-card__count {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rn-petrol-blue, #012D3F);
}

.dash-domain-card__ids {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
```

---

## Definition of Done

- [ ] "By Domain" section appears on dashboard below the "By Kind" section
- [ ] Section is collapsed by default; clicking the toggle expands/collapses it
- [ ] Each domain from `domain-config.yaml` is shown with its artifact count
- [ ] Artifact IDs tagged to each domain are listed within the card
- [ ] Domains with 0 tagged artifacts show count 0 (no special warning)
- [ ] No "untagged artifacts" counter or warning anywhere on the dashboard
- [ ] `ng build --configuration production` completes without errors

---

## Reviewer Guidance

- Verify untagged artifacts are silently excluded — no counter, no warning, no badge (resolved decision 01KS56EX82C5PWC3770N9ED3HK).
- Verify domain cards apply the correct color class from `dc-chip--*` (not inline colors).
- Verify the section is collapsed by default (`byDomainExpanded = false`).
- Verify `artifactsForDomain()` does not iterate across the reactive store more than necessary.

## Activity Log

- 2026-05-21T13:03:15Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1579051 – Started implementation via action command
- 2026-05-21T13:05:33Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1579051 – Ready for review: By Domain collapsible section implemented with DomainService integration, domain cards with color classes, artifact ID chips, collapsed by default. No untagged artifact counter. TypeScript check passes.
- 2026-05-21T13:06:08Z – claude:sonnet:reviewer:reviewer – shell_pid=1587077 – Started review via action command
- 2026-05-21T13:09:07Z – claude:sonnet:reviewer:reviewer – shell_pid=1587077 – Review passed: By Domain section collapsed by default, no untagged warning, colorClass restricted, domain cards correct, CSS added, TypeScript clean
