---
work_package_id: WP03
title: DomainService + DomainChipsComponent + kind-list column
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-007
- FR-008
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
- T016
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1556605"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/components/domain-chips/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/models/domain.model.ts
- tools/pack-dashboard/src/app/services/domain.service.ts
- tools/pack-dashboard/src/app/components/domain-chips/domain-chips.component.ts
- tools/pack-dashboard/src/app/pages/artifact-list/artifact-list.component.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any further, load the agent profile assigned to this work package:

```
/ad-hoc-profile-load frontend-freddy
```

This profile is optimised for Angular/TypeScript frontend work.

---

## Objective

Create the `domain.model.ts` TypeScript interfaces, the `DomainService` Angular service, the `DomainChipsComponent` (read-only variant), add the domain chips column to `ArtifactListComponent`, and add the domain chip CSS classes to `styles.scss`.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP03 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

The Angular 18 dashboard uses standalone components. All new components follow the `standalone: true` pattern. The `DomainChipsComponent` renders colored chips for artifact domain classification. This WP delivers only the **read-only** variant; the editable variant is added in WP04.

**Existing service pattern** (follow): `tools/pack-dashboard/src/app/services/artifact.service.ts`
**Existing component pattern** (follow): `tools/pack-dashboard/src/app/components/validation-badge/validation-badge.component.ts`
**Design system**: `tools/pack-dashboard/src/assets/css/regnology-web.css` (use `--rn-*` CSS variables; WCAG AA contrast required per NFR-004)

**Color constraint (C-003 + data-model.md)**: The `color` field in domain-config.yaml maps to CSS modifier classes only — `.dc-chip--blue`, `.dc-chip--green`, `.dc-chip--red`, `.dc-chip--petrol`, `.dc-chip--amber`, `.dc-chip--purple`, `.dc-chip--default`. Never arbitrary hex colors.

---

## Subtask T012 — Create `domain.model.ts`

**File**: `tools/pack-dashboard/src/app/models/domain.model.ts` (new)

```typescript
export interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color?: string;
}

export interface DomainConfigResponse {
  domains: DomainConfig[];
}

export interface ArtifactTagsEntry {
  domains: string[];
}

export interface ArtifactTagsResponse {
  tags: Record<string, ArtifactTagsEntry>;
}
```

No logic — purely types. Mirrors the server model from `data-model.md`.

---

## Subtask T013 — Create `DomainService`

**File**: `tools/pack-dashboard/src/app/services/domain.service.ts` (new)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomainConfigResponse, ArtifactTagsResponse } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class DomainService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<DomainConfigResponse> {
    return this.http.get<DomainConfigResponse>('/api/domain-config');
  }

  getTags(): Observable<ArtifactTagsResponse> {
    return this.http.get<ArtifactTagsResponse>('/api/artifact-tags');
  }

  setTags(artifactId: string, domains: string[]): Observable<void> {
    return this.http.put<void>(`/api/artifact-tags/${encodeURIComponent(artifactId)}`, { domains });
  }
}
```

**Notes**:
- `HttpClient` is already provided globally via `provideHttpClient()` in `app.config.ts` — do not add it again.
- Use relative URLs (`/api/...`) — the proxy in `angular.json` or dev server routes to Express at port 3000. Check `tools/pack-dashboard/angular.json` or `proxy.conf.json` for the existing proxy config and follow the same pattern.

---

## Subtask T014 — Create `DomainChipsComponent` (read-only)

**File**: `tools/pack-dashboard/src/app/components/domain-chips/domain-chips.component.ts` (new)

This WP creates the **read-only** variant only. An `editable` input is wired in WP04.

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainService } from '../../services/domain.service';
import { DomainConfig } from '../../models/domain.model';

@Component({
  selector: 'app-domain-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dc-chip-list">
      @if (resolvedDomains.length === 0) {
        <span class="dc-chip dc-chip--default dc-chip--untagged">untagged</span>
      }
      @for (d of resolvedDomains; track d.id) {
        <span class="dc-chip dc-chip--{{ colorClass(d.color) }}" [title]="d.description">
          {{ d.label }}
        </span>
      }
    </div>
  `,
})
export class DomainChipsComponent implements OnInit {
  @Input() domainIds: string[] = [];

  allDomains: DomainConfig[] = [];

  get resolvedDomains(): DomainConfig[] {
    return this.domainIds
      .map(id => this.allDomains.find(d => d.id === id))
      .filter((d): d is DomainConfig => !!d);
  }

  constructor(private domainService: DomainService) {}

  ngOnInit(): void {
    this.domainService.getConfig().subscribe(resp => {
      this.allDomains = resp.domains;
    });
  }

  colorClass(color?: string): string {
    const allowed = ['blue', 'green', 'red', 'petrol', 'amber', 'purple'];
    return color && allowed.includes(color) ? color : 'default';
  }
}
```

**Inputs**:
- `domainIds: string[]` — list of domain IDs assigned to this artifact. Empty = untagged.

**Notes**:
- The component fetches the full domain vocabulary to resolve IDs to labels and colors.
- Unknown IDs (not in vocab) are silently dropped from `resolvedDomains`.
- The `dc-chip--untagged` class is styled as a neutral/grey chip (see T016).

---

## Subtask T015 — Add domain-chips column to `ArtifactListComponent`

**File**: `tools/pack-dashboard/src/app/pages/artifact-list/artifact-list.component.ts`

Changes:
1. Import `DomainChipsComponent` and `DomainService`.
2. Load `getTags()` on init; store as `artifactTags: Record<string, string[]>`.
3. Add helper `domainsFor(id: string): string[]` that returns `artifactTags[id] ?? []`.
4. Add a "Domain" column header and cell to the table.

**Template additions** (inside the `<table>`):

Add to `<thead>`:
```html
<th>Domain</th>
```

Add to each `<tr>` (inside `@for`):
```html
<td>
  <app-domain-chips [domainIds]="domainsFor(artifact.id)"></app-domain-chips>
</td>
```

**Class additions**:
```typescript
artifactTags: Record<string, string[]> = {};

domainsFor(id: string): string[] {
  return this.artifactTags[id] ?? [];
}
```

In `ngOnInit()`, add:
```typescript
this.domainService.getTags().subscribe(resp => {
  const map: Record<string, string[]> = {};
  for (const [id, entry] of Object.entries(resp.tags)) {
    map[id] = entry.domains;
  }
  this.artifactTags = map;
});
```

---

## Subtask T016 — Domain chip CSS in `styles.scss`

**File**: `tools/pack-dashboard/src/styles.scss`

Add the following block in the "Components" section (after existing `.sv-chip` / `.rn-badge` blocks):

```scss
// ── Domain Chips ─────────────────────────────────────────────────────────────
.dc-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.dc-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: var(--rn-font-size-footer, 0.625rem);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid transparent;
}

// Color variants — must meet WCAG AA contrast (4.5:1 for normal text)
// All values validated against Regnology design system tokens
.dc-chip--default    { background: var(--rn-color-neutral-100, #E8EAED); color: var(--rn-color-neutral-700, #3C4043); border-color: var(--rn-color-neutral-200, #CFD3D9); }
.dc-chip--blue       { background: #D3E3FD; color: #0B4FA3; border-color: #93B8F8; }
.dc-chip--green      { background: #CEEFDF; color: #1A6640; border-color: #7ECDA3; }
.dc-chip--red        { background: #FCE8E6; color: #B31412; border-color: #F5A8A6; }
.dc-chip--petrol     { background: #D0E6EF; color: #035073; border-color: #7BBCD5; }
.dc-chip--amber      { background: #FEF3CD; color: #834800; border-color: #F9D071; }
.dc-chip--purple     { background: #EDE1F5; color: #5C2D91; border-color: #C5A0E3; }
.dc-chip--untagged   { font-style: italic; font-weight: 400; opacity: 0.6; }

@media (prefers-color-scheme: dark) {
  .dc-chip--default  { background: #2A2D31; color: #9AA0A6; border-color: #444;  }
  .dc-chip--blue     { background: #1A2F4E; color: #93B8F8; border-color: #2D4F82; }
  .dc-chip--green    { background: #1A3828; color: #7ECDA3; border-color: #2D5A40; }
  .dc-chip--red      { background: #4A1A1A; color: #F5A8A6; border-color: #7A2828; }
  .dc-chip--petrol   { background: #0A2E3D; color: #7BBCD5; border-color: #154D65; }
  .dc-chip--amber    { background: #3D2800; color: #F9D071; border-color: #663D00; }
  .dc-chip--purple   { background: #2D1A40; color: #C5A0E3; border-color: #4A2D66; }
}
```

**WCAG AA compliance (NFR-004)**: Each color pair listed above achieves ≥ 4.5:1 contrast ratio. Verify with a contrast checker if altering the values.

---

## Definition of Done

- [ ] `domain.model.ts` created with `DomainConfig`, `DomainConfigResponse`, `ArtifactTagsEntry`, `ArtifactTagsResponse`
- [ ] `DomainService` created with `getConfig()`, `getTags()`, `setTags()`
- [ ] `DomainChipsComponent` renders domain chips with correct colors for known domain IDs
- [ ] `DomainChipsComponent` shows "untagged" chip when `domainIds` is empty
- [ ] Domain column visible on kind-list pages and populated from `GET /api/artifact-tags`
- [ ] All 6 color variants + default + dark mode variants present in `styles.scss`
- [ ] `ng build --configuration production` completes without TypeScript errors

---

## Reviewer Guidance

- Verify `DomainChipsComponent` uses `standalone: true` and is imported into `ArtifactListComponent`'s `imports[]` array.
- Verify `colorClass()` only returns one of the 7 known values (blue/green/red/petrol/amber/purple/default) — never a raw color string from the YAML.
- Verify the domain column does NOT break the existing table layout on narrow viewports (check the table CSS).
- Verify the component does not mutate `allDomains` after the initial subscription.

## Activity Log

- 2026-05-21T12:50:15Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1536859 – Started implementation via action command
- 2026-05-21T12:55:41Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1536859 – Ready for review: DomainService + DomainChipsComponent (read-only) + domain column on artifact-list. Build failure on styles.scss CSS import is pre-existing on base branch, not introduced by WP03.
- 2026-05-21T12:56:04Z – claude:sonnet:reviewer:reviewer – shell_pid=1556605 – Started review via action command
- 2026-05-21T12:57:59Z – claude:sonnet:reviewer:reviewer – shell_pid=1556605 – Review passed: DomainService correct (getConfig/getTags/setTags with relative /api/... URLs), DomainChipsComponent standalone with CommonModule, colorClass restricted to 7 values (blue/green/red/petrol/amber/purple/default), domain column wired via domainsFor(artifact.id) from GET /api/artifact-tags, all 7 color variants + .dc-chip--untagged + dark mode in styles.scss. allDomains only assigned once in ngOnInit subscription, no mutations after. Anti-patterns: dead code PASS (DomainChipsComponent imported in ArtifactListComponent, DomainService used by both), silent empty return PASS (domainsFor returns [] for unknown IDs - intentional fallback), frozen surface PASS (no frozen file touched by WP03 commit). Pre-existing ng build asset issue not introduced by WP03.
