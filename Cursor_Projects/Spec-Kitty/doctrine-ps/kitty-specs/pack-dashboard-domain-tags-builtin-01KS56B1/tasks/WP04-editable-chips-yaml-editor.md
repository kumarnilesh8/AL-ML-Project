---
work_package_id: WP04
title: Editable domain chips + YAML editor default state
dependencies:
- WP02
- WP03
requirement_refs:
- FR-009
- FR-016
- FR-018
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T017
- T018
- T019
- T020
- T021
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1572851"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/pages/artifact-detail/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts
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

Extend `DomainChipsComponent` with an editable multi-select variant, wire it into `ArtifactDetailComponent` with a `setTags()` PUT call, and collapse the YAML Content section by default via a disclosure toggle (FR-018), while keeping the Structured View always visible and the save/revert buttons functional (FR-016).

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP04 --agent claude:sonnet:frontend-freddy:implementer`

---

## Context

`ArtifactDetailComponent` currently shows a Structured View section and a YAML Content section. The YAML editor is already mutable for pack artifacts (save + revert buttons). This WP:
1. Adds domain chip editing below the kind header on the detail page.
2. Collapses the YAML Content section by default (user can expand it).
3. Does NOT touch the Structured View — it remains always visible.

**Files to read before implementing**:
- `tools/pack-dashboard/src/app/components/domain-chips/domain-chips.component.ts` (created in WP03)
- `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`

---

## Subtask T017 — Add editable variant to `DomainChipsComponent`

**File**: `tools/pack-dashboard/src/app/components/domain-chips/domain-chips.component.ts`

Extend the component (from WP03) with:
- New `@Input() editable = false;`
- New `@Output() domainsChange = new EventEmitter<string[]>();`
- An internal `selectedIds: Set<string>` synced from `domainIds`.
- A click handler `toggleDomain(id: string)` that adds/removes from `selectedIds` and emits the new array.

**Template additions** (only rendered when `editable = true`):

```html
@if (editable) {
  <div class="dc-chip-editor">
    @for (d of allDomains; track d.id) {
      <button
        type="button"
        class="dc-chip dc-chip--{{ colorClass(d.color) }}"
        [class.dc-chip--selected]="isSelected(d.id)"
        [attr.aria-pressed]="isSelected(d.id)"
        [title]="d.description"
        (click)="toggleDomain(d.id)">
        {{ d.label }}
      </button>
    }
  </div>
}
```

**Class additions**:
```typescript
@Input() editable = false;
@Output() domainsChange = new EventEmitter<string[]>();

selectedIds = new Set<string>();

ngOnChanges(changes: SimpleChanges): void {
  if (changes['domainIds']) {
    this.selectedIds = new Set(this.domainIds);
  }
}

isSelected(id: string): boolean {
  return this.selectedIds.has(id);
}

toggleDomain(id: string): void {
  if (this.selectedIds.has(id)) {
    this.selectedIds.delete(id);
  } else {
    this.selectedIds.add(id);
  }
  this.domainsChange.emit(Array.from(this.selectedIds));
}
```

Add `OnChanges` to the import from `@angular/core` and `SimpleChanges` to the signature. Import `EventEmitter, Output` as well.

**CSS additions** (in `styles.scss`):
```scss
.dc-chip--selected {
  box-shadow: 0 0 0 2px var(--rn-green-dark, #06A74E);
  font-weight: 700;
}
.dc-chip-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dc-chip-editor button.dc-chip {
  cursor: pointer;
  border: 1px solid transparent;
  &:hover { filter: brightness(0.92); }
  &:focus-visible { outline: 2px solid var(--rn-green-dark, #06A74E); outline-offset: 2px; }
}
```

---

## Subtask T018 — Wire editable chip selector into `ArtifactDetailComponent`

**File**: `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`

Changes:
1. Import `DomainChipsComponent` and `DomainService`.
2. Load `getTags()` on init; store `currentDomains: string[]` for this artifact.
3. Add the editable chip selector below the `<dl>` metadata block (before the Structured View section):

```html
<div class="artifact-domain-row" style="margin-bottom: 16px;">
  <span class="sv-row__label">Domain</span>
  <app-domain-chips
    [domainIds]="currentDomains"
    [editable]="true"
    (domainsChange)="onDomainsChange($event)">
  </app-domain-chips>
</div>
```

**Class additions**:
```typescript
currentDomains: string[] = [];
isSavingTags = false;
saveTagsSuccess = false;
saveTagsError: string | null = null;

onDomainsChange(domains: string[]): void {
  this.currentDomains = domains;
  this.isSavingTags = true;
  this.saveTagsSuccess = false;
  this.saveTagsError = null;
  this.domainService.setTags(this.id, domains).subscribe({
    next: () => {
      this.isSavingTags = false;
      this.saveTagsSuccess = true;
      setTimeout(() => { this.saveTagsSuccess = false; }, 2000);
    },
    error: (err) => {
      this.isSavingTags = false;
      this.saveTagsError = err?.error?.error ?? 'Failed to save domain tags';
    },
  });
}
```

Load current tags on init (add to `ngOnInit`):
```typescript
this.domainService.getTags().subscribe(resp => {
  this.currentDomains = resp.tags[this.id]?.domains ?? [];
});
```

---

## Subtask T019 — Connect `setTags()` PUT call

This is already handled in `onDomainsChange()` from T018 above. The change is auto-saved on every toggle (no separate "Save tags" button needed). The brief success/error feedback states are shown inline near the chips.

Add status indicator chips adjacent to the domain selector (optional, but improves UX):
```html
@if (isSavingTags) { <span class="rn-badge rn-badge--neutral" style="margin-left:8px;">Saving…</span> }
@if (saveTagsSuccess) { <span class="rn-badge rn-badge--success" style="margin-left:8px;">Saved</span> }
@if (saveTagsError) { <span class="rn-badge rn-badge--danger" style="margin-left:8px;">{{ saveTagsError }}</span> }
```

---

## Subtask T020 — Collapse YAML Content section by default (FR-018)

**File**: `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`

The Structured View section remains **always visible**. The YAML Content section (editor + save/revert buttons) is wrapped in a collapsible disclosure block that is **closed by default**.

Add `yamlExpanded = false;` to the component class.

**Template change** — wrap the existing YAML Content `<div>` + `<app-yaml-editor>` in a disclosure toggle:

```html
<!-- Collapsible YAML Content (FR-018: collapsed by default) -->
<div class="detail-section-disclosure" style="margin-top: 24px;">
  <button
    type="button"
    class="detail-section-disclosure__toggle"
    [attr.aria-expanded]="yamlExpanded"
    (click)="yamlExpanded = !yamlExpanded">
    <span>YAML Content</span>
    <span class="detail-section-disclosure__chevron" [class.detail-section-disclosure__chevron--open]="yamlExpanded">▸</span>
  </button>

  @if (yamlExpanded) {
    <div class="detail-section-disclosure__body">
      <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
        <button class="rn-btn rn-btn--primary" [disabled]="!isDirty || isSaving" (click)="save()">
          {{ isSaving ? 'Saving…' : 'Save' }}
        </button>
        <button class="rn-btn rn-btn--secondary" [disabled]="!isDirty" (click)="revert()">
          Revert
        </button>
      </div>
      <app-yaml-editor
        [content]="editorContent"
        (contentChange)="onContentChange($event)">
      </app-yaml-editor>
    </div>
  }
</div>
```

Remove the old `<div style="display: flex; gap: 8px; ...">` block and `<app-yaml-editor>` from their current location in the template, replacing them with the disclosure block above.

**CSS additions** (in `styles.scss`):
```scss
.detail-section-disclosure__toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  background: var(--rn-color-neutral-050, #F8F9FA);
  border: 1px solid var(--rn-color-neutral-200, #CFD3D9);
  border-radius: 6px;
  cursor: pointer;
  font-size: var(--rn-font-size-body, 0.875rem);
  font-weight: 600;
  color: var(--rn-petrol-blue, #012D3F);
  text-align: left;
  &:hover { background: var(--rn-color-neutral-100, #E8EAED); }
  &:focus-visible { outline: 2px solid var(--rn-green-dark, #06A74E); outline-offset: 2px; }
}
.detail-section-disclosure__chevron {
  transition: transform 0.2s;
  display: inline-block;
}
.detail-section-disclosure__chevron--open {
  transform: rotate(90deg);
}
.detail-section-disclosure__body {
  border: 1px solid var(--rn-color-neutral-200, #CFD3D9);
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 16px;
}
```

---

## Subtask T021 — Verify save/revert still work (FR-016)

No code change needed — just verify that the existing save/revert logic in `ArtifactDetailComponent` still functions after the template restructuring in T020.

**Manual verification steps**:
1. Open an artifact detail page.
2. Expand "YAML Content" by clicking the toggle.
3. Edit the YAML.
4. Click "Save" — verify the save succeeds and the dirty state clears.
5. Make another edit, click "Revert" — verify content resets to server state.
6. Collapse the section — verify the editor state is preserved if re-expanded.

If the `isDirty`, `isSaving`, `editorContent`, `save()`, and `revert()` methods are unchanged, this should work without modification.

---

## Definition of Done

- [ ] `DomainChipsComponent` has `editable` input that renders all domains as toggleable buttons
- [ ] Clicking a chip in editable mode toggles selection and emits `domainsChange`
- [ ] `ArtifactDetailComponent` shows editable domain chips below the metadata `<dl>`
- [ ] Toggling a domain chip triggers an auto-save via `PUT /api/artifact-tags/:id`
- [ ] Brief save feedback (saving / saved / error) shown inline
- [ ] YAML Content section is collapsed on page load (FR-018)
- [ ] Clicking the disclosure toggle expands/collapses the YAML editor
- [ ] Structured View section remains always visible
- [ ] Save and Revert buttons still functional when YAML section is expanded
- [ ] `ng build --configuration production` completes without TypeScript errors

---

## Reviewer Guidance

- Verify `yamlExpanded = false` is the default — the section must be closed on initial page load.
- Verify the Structured View section does NOT have a collapse toggle — it is always visible.
- Verify `DomainChipsComponent` implements `OnChanges` so `selectedIds` resets when `domainIds` changes (navigating between artifacts).
- Verify `onDomainsChange()` uses the `error` callback, not a `.catch()` on the observable, to capture 422 errors.

## Activity Log

- 2026-05-21T12:58:27Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1564379 – Started implementation via action command
- 2026-05-21T13:00:48Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1564379 – Ready for review: editable domain chips with auto-save, YAML Content collapsed by default (FR-018), Structured View always visible, save/revert still functional
- 2026-05-21T13:01:12Z – claude:sonnet:reviewer:reviewer – shell_pid=1572851 – Started review via action command
- 2026-05-21T13:02:58Z – claude:sonnet:reviewer:reviewer – shell_pid=1572851 – Review passed: editable chips with OnChanges reset, yamlExpanded=false default, disclosure toggle, Structured View always visible, onDomainsChange uses error callback
