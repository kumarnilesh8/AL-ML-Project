---
work_package_id: WP07
title: Primary Domain Designation UI
dependencies:
- WP06
requirement_refs:
- FR-025
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-organizational-bindings-01KSPTPR
base_commit: ca3ccef9c51c5c29ce62863975c041e820c4f808
created_at: '2026-05-28T12:46:00.220279+00:00'
subtasks:
- T028
- T029
shell_pid: "1911975"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/src/app/components/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/components/domain-tags-editor/**
tags: []
---

# WP07 — Primary Domain Designation UI

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Depends on**: WP06 (primary/secondary display must exist so the UI has meaning)
- To implement: `spec-kitty agent action implement WP07 --agent <name>`

## Objective

Add a `primary_domain` picker to the domain-tags editing surface so users can designate and clear the primary domain for any artifact. The picker is a dropdown constrained to the artifact's currently selected domains.

## Context

- The domain-tags editor component is the surface where users assign domain tags to artifacts. Locate it with:
  ```bash
  rg "artifact-tags\|domain.*tag\|setArtifactTags" tools/pack-dashboard/src/app/ -l
  ```
- The `PUT /api/artifact-tags/:id` endpoint already accepts `primary_domain` after WP01's T005b.
- Constraint: `primary_domain` must be a member of `domains`. The dropdown must reflect the current domains selection live (if a domain is deselected, remove it from `primary_domain` automatically and show an inline notice).
- "Clear" option: the dropdown always has a `(none)` option at the top, setting `primary_domain` to `undefined`.

---

## T028 — Add `primary_domain` picker to the domain-tags editor

**Purpose**: Let users set and clear the primary domain designation from the existing tagging UI.

**Steps**:

1. Locate the domain-tags editor component (likely `artifact-detail` or a dedicated `domain-tags-editor` component). Confirm with:
   ```bash
   rg -l "artifact-tags\|setArtifactTags\|domain.*tags" tools/pack-dashboard/src/app/
   ```
2. The component already loads the artifact's tag entry (`{ domains, primary_domain? }`). Add a `primaryDomain: string | null` reactive form control to the existing form (or add standalone state if the editor uses template-driven forms).
3. Add a `<select>` dropdown below the domains multi-select:
   ```html
   <label>Primary Domain
     <select [(ngModel)]="primaryDomain" (ngModelChange)="onPrimaryDomainChange($event)">
       <option [value]="null">(none — no primary designation)</option>
       @for (d of selectedDomains; track d) {
         <option [value]="d">{{ domainLabel(d) }}</option>
       }
     </select>
   </label>
   @if (primaryDomainCleared) {
     <p class="rn-field-info">
       Primary domain was cleared because its domain tag was removed.
     </p>
   }
   ```
4. `selectedDomains` is the live list of currently checked domain IDs from the domains editor.
5. Add `onPrimaryDomainChange(value: string | null)` — updates local state only (no immediate API call; save happens on form submit).
6. On form submit, include `primary_domain` in the `PUT /api/artifact-tags/:id` request body:
   ```typescript
   const payload = {
     domains: this.selectedDomains,
     ...(this.primaryDomain ? { primary_domain: this.primaryDomain } : {}),
   };
   ```
7. Auto-clear logic: when a domain is removed from `selectedDomains`, check if it equals `primaryDomain`. If so, set `primaryDomain = null` and set `primaryDomainCleared = true` (cleared on next user interaction).

**Files modified**: domain-tags editor component (path resolved in step 1)

**Validation**:
- [ ] Dropdown shows only domains currently selected in the domains multi-select
- [ ] Removing a selected domain that was `primary_domain` auto-clears the picker and shows the notice
- [ ] Selecting `(none)` and saving sends `PUT` without `primary_domain` field
- [ ] Selecting a valid domain and saving persists it; subsequent page load shows it selected

---

## T029 — Reflect `primary_domain` in the domain chips display

**Purpose**: Any place that renders domain chips for an artifact should visually distinguish the primary domain so users see at a glance which domain is primary without opening the editor.

**Steps**:

1. Locate all places that render artifact domain chips (likely `artifact-list.component.ts` and/or `artifact-detail` component).
2. For each domain chip rendered for an artifact, if `chip.domainId === artifact.primaryDomain`, add a small indicator:
   ```html
   <span class="rn-badge rn-badge--petrol">
     {{ domainLabel(chip.domainId) }}
     @if (chip.domainId === primaryDomain) {
       <span style="margin-left: 4px; font-size: 0.75rem; opacity: 0.8;">★</span>
     }
   </span>
   ```
3. The `★` marker is purely visual — no tooltip required in this iteration (future work).
4. If the artifact-tags API response does not currently include `primary_domain` in the list endpoint (`GET /api/artifact-tags`), check if the existing summary scanner returns it. If not, the primary domain marker can be loaded lazily on the artifact detail view only (not in the list).

**Files modified**: artifact chip display component(s) — locate with `rg "domain.*chip\|chip.*domain\|domains.*badge" tools/pack-dashboard/src/app/`

**Validation**:
- [ ] Primary domain chip shows ★ marker in artifact detail view
- [ ] Non-primary domain chips have no marker
- [ ] Angular production build succeeds

---

## Definition of Done

- [ ] Domain-tags editor shows `primary_domain` picker constrained to current domain selection
- [ ] Auto-clear fires when the primary domain's tag is removed; inline notice shown
- [ ] Save/cancel flow correctly persists or discards `primary_domain`
- [ ] Primary domain chip shows ★ marker in artifact detail view
- [ ] TypeScript compiles
- [ ] Angular production build succeeds
- [ ] AC-27 passes: dropdown constrained to current `domains` selection

## Risks

- **Domain-tags editor location**: The editor may be embedded in the artifact detail page or a standalone component. Resolve before editing to avoid modifying the wrong file.
- **Primary domain in list API**: The `GET /api/artifact-tags` endpoint may not return `primary_domain` in the summary scan. If so, the ★ marker in T029 is only shown on the detail page (lazy load). Flag this as a follow-up if the list endpoint needs extending.

## Activity Log

- 2026-05-28T12:46:01Z – cursor:sonnet:implementer:implementer – shell_pid=1881418 – Assigned agent via action command
- 2026-05-28T12:56:52Z – cursor:sonnet:implementer:implementer – shell_pid=1881418 – primary_domain picker in domain-tags editor (constrained to current domains, auto-clear on removal). Star marker on primary domain chips. Build passes.
- 2026-05-28T12:57:26Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1896673 – Started review via action command
- 2026-05-28T13:02:56Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1896673 – Moved to planned
- 2026-05-28T13:03:23Z – cursor:sonnet:implementer:implementer – shell_pid=1903291 – Started implementation via action command
- 2026-05-28T13:11:49Z – cursor:sonnet:implementer:implementer – shell_pid=1903291 – Cycle 2: hex fallbacks removed from .dc-primary-star and .dc-field-info, added :host { --rn-amber } component-scoped variable definition, server-side primary_domain code reverted (WP01 owns it), angular.json/styles.scss restored to mission branch state, broken relative symlink fixed (regnology-web.css → regnology-web.snapshot.css). Frontend UI intact. Build passes.
- 2026-05-28T13:12:17Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1911975 – Started review via action command
- 2026-05-28T13:15:01Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1911975 – Cycle 2 approved: all three blockers resolved. Hex fallbacks removed (var(--rn-amber) no fallback, :host scoped definition acceptable). Server-side files unchanged (empty diffs). angular.json/styles.scss unchanged. TypeScript clean. Frontend UI intact.
