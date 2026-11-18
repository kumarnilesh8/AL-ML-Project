---
work_package_id: WP05
title: CRUD Form and Interactions
dependencies:
- WP04
requirement_refs:
- FR-010
- FR-011
- FR-012
- FR-013
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-organizational-bindings-01KSPTPR
base_commit: ca3ccef9c51c5c29ce62863975c041e820c4f808
created_at: '2026-05-28T12:22:06.992649+00:00'
subtasks:
- T018
- T019
- T020
- T021
- T022
shell_pid: "1866441"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/src/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/styles.scss
tags: []
---

# WP05 — CRUD Form and Interactions

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Depends on**: WP04 (page shell)
- To implement: `spec-kitty agent action implement WP05 --agent <name>`

## Objective

Add the full CRUD surface to `org-bindings.component.ts`: inline reactive form for create/edit, delete confirmation, orphan remediation (cascade-delete + rebind), and RACI badge pills. All interactions update the card grid reactively without page reload.

## Context

- Use Angular `ReactiveFormsModule` (`FormGroup` / `FormControl`). It is already in the project (used by `yaml-editor.component`).
- The form is an inline panel below the page header, toggled with `showForm` / `editingId` state.
- On successful save the form closes, `list()` is re-fetched, and the grid updates.
- RACI badge pill: a `<span>` using `rn-badge rn-badge--<variant>` with bracket notation `[R]`, `[A]`, etc.
- Delete confirmation: use a simple inline `confirm()` dialog (no modal component required).
- Rebind flow: when editing an orphaned binding, the domain dropdown shows only valid domains. On save, the binding's `domain_id` is updated to the selected valid domain.

---

## T018 — Add ReactiveFormsModule inline create/edit form

**Purpose**: Implement the create/edit panel controlled by `showForm` flag.

**Steps**:

1. Add imports to `org-bindings.component.ts`:
   ```typescript
   import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
   ```
2. Add state to the component class:
   ```typescript
   showForm = false;
   editingId: string | null = null;
   form!: FormGroup;
   ```
3. Inject `FormBuilder` in constructor.
4. Initialise `form` in `ngOnInit`:
   ```typescript
   this.form = this.fb.group({
     domain_id:      ['', Validators.required],
     department:     ['', [Validators.required, Validators.maxLength(120)]],
     spoc:           ['', Validators.required],
     accountability: ['', Validators.required],
     involvement:    ['', Validators.maxLength(800)],
   });
   ```
5. Add `openCreate()` method: sets `showForm = true`, `editingId = null`, resets form.
6. Add `openEdit(binding: OrgBinding)` method: sets `showForm = true`, `editingId = binding.id`, patches form with binding values.
7. Add `closeForm()` method: sets `showForm = false`, `editingId = null`.
8. Add `onSave()` method:
   - If form invalid → mark all touched and return.
   - If `editingId` → call `orgBindingsService.update(editingId, form.value)`.
   - Else → call `orgBindingsService.create(form.value)`.
   - On success: `closeForm()`, reload list.
9. In template: add `[+ New Binding]` button, conditional form panel with Save/Cancel, Edit button on each card.

**Form template sketch**:
```html
@if (showForm) {
  <div class="ks-card" style="margin: 16px 0;">
    <h3 style="margin-bottom: 12px;">{{ editingId ? 'Edit Binding' : 'New Binding' }}</h3>
    <form [formGroup]="form" (ngSubmit)="onSave()">
      <label>Domain *
        <select formControlName="domain_id">
          @for (d of domains; track d.id) { <option [value]="d.id">{{ d.label }}</option> }
        </select>
      </label>
      <label>Department *
        <input type="text" formControlName="department" maxlength="120">
      </label>
      <label>SPOC *
        <input type="text" formControlName="spoc">
      </label>
      <label>Accountability *
        <div class="rn-radio-group">
          @for (role of raciRoles; track role) {
            <label><input type="radio" formControlName="accountability" [value]="role"> {{ raciLabel(role) }}</label>
          }
        </div>
      </label>
      <label>Involvement
        <textarea formControlName="involvement" rows="3" maxlength="800"></textarea>
      </label>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button type="submit" class="rn-btn rn-btn--primary">Save</button>
        <button type="button" class="rn-btn rn-btn--secondary" (click)="closeForm()">Cancel</button>
      </div>
    </form>
  </div>
}
```

**Files modified**: `tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`

---

## T019 — Client-side validation

**Purpose**: Show inline error messages before submission; SPOC regex check.

**Steps**:

1. Add a custom validator for the SPOC field:
   ```typescript
   function spocValidator(control: AbstractControl): ValidationErrors | null {
     const val: string = control.value ?? '';
     if (val.includes('@') && !/.*@regnology\.net$/.test(val)) {
       return { spocDomain: 'Must be an @regnology.net address' };
     }
     return null;
   }
   ```
2. Add `spocValidator` to the `spoc` FormControl validators array.
3. In the template, add error display beneath each field:
   ```html
   @if (form.get('spoc')?.errors?.['spocDomain'] && form.get('spoc')?.touched) {
     <span class="rn-field-error">Must be an @regnology.net address</span>
   }
   ```
4. Add `rn-field-error` SCSS if not present: `color: var(--rn-color-danger); font-size: 0.8rem;`
5. Repeat for required/maxLength errors on department and involvement.

**Files modified**:
- `tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`
- `tools/pack-dashboard/src/styles.scss` (only if `rn-field-error` not already defined)

---

## T020 — Delete with confirmation

**Purpose**: Delete action on card shows a confirm prompt; calls DELETE endpoint on confirmation.

**Steps**:

1. Add `onDelete(binding: OrgBinding)` method:
   ```typescript
   onDelete(binding: OrgBinding): void {
     if (!confirm(`Delete binding for "${binding.department}" on domain "${binding.domain_id}"?`)) return;
     this.orgBindingsService.remove(binding.id).subscribe({
       next: () => this.reload(),
       error: () => alert('Failed to delete binding.'),
     });
   }
   ```
2. Add `[✕]` delete button to each card in the template:
   ```html
   <button class="rn-btn rn-btn--danger rn-btn--sm" (click)="onDelete(binding)">✕</button>
   ```
3. Add Edit button that calls `openEdit(binding)`.

**Files modified**: `tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`

---

## T021 — Orphan remediation actions

**Purpose**: Orphaned cards show Cascade Delete and Rebind buttons.

**Steps**:

1. In the orphan banner, add:
   ```html
   <button class="rn-btn rn-btn--danger rn-btn--sm" (click)="cascadeDeleteOrphans()">Cascade delete all</button>
   <button class="rn-btn rn-btn--secondary rn-btn--sm" (click)="scrollToOrphans()">Review</button>
   ```
2. Add `cascadeDeleteOrphans()`: filter orphaned bindings, call `remove()` for each, reload.
3. Orphaned card in the grid: show "Rebind" button that calls `openEdit(binding)` — the form opens pre-populated; the domain dropdown shows only valid domains (filter `domains` by existence in `getDomainConfig`).
4. On `openEdit` for an orphaned binding, set a flag `this.isRebind = true` so the form subtitle shows "Reassign Domain" instead of "Edit Binding".

**Files modified**: `tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`

---

## T022 — RACI badge pill

**Purpose**: Consistent pill rendering for accountability roles in cards and domain detail (WP06 reuses this).

**Steps**:

1. The badge is an inline `<span>` using existing `rn-badge` classes — no new component needed.
2. Helper already in T013 model: `RACI_BADGE_VARIANT` maps role → variant.
3. In the card template, ensure the badge renders as:
   ```html
   <span class="rn-badge rn-badge--{{ raciBadge(binding.accountability) }}">
     [{{ binding.accountability }}] {{ raciLabel(binding.accountability) }}
   </span>
   ```
4. Verify `rn-badge--petrol` exists in `styles.scss`. The `--petrol` variant should exist from the existing ks-card variants. If absent, add:
   ```scss
   .rn-badge--petrol {
     background: var(--rn-color-petrol-light, #e0f0f4);
     color: var(--rn-color-petrol, #007a8c);
   }
   ```
5. Verify `rn-badge--green` and `rn-badge--amber` similarly.

**Files modified**: `tools/pack-dashboard/src/styles.scss` (if badge variants missing)

---

## Definition of Done

- [ ] Create form opens, validates client-side, calls POST, card appears on success
- [ ] Edit form opens pre-populated, calls PUT, card updates on success
- [ ] SPOC with non-regnology.net email shows inline error and blocks submission
- [ ] Delete button shows confirm prompt; on confirm calls DELETE; card disappears
- [ ] Orphaned cards have Rebind and per-card delete buttons
- [ ] Cascade-delete banner button removes all orphaned bindings
- [ ] RACI badges display correct colours for all four roles
- [ ] Angular production build succeeds

## Risks

- **`confirm()` dialog**: Works in Chromium-based browsers. If the team needs a branded modal in future, this is easy to swap; the WP does not need to implement it.
- **Badge variants**: Check `rn-badge--green` in existing SCSS — the project may use `rn-badge--success` as the green equivalent. Align with existing convention rather than introducing new variants.

## Activity Log

- 2026-05-28T12:22:08Z – cursor:sonnet:implementer:implementer – shell_pid=1839455 – Assigned agent via action command
- 2026-05-28T12:32:55Z – cursor:sonnet:implementer:implementer – shell_pid=1839455 – CRUD form, validation, delete confirm, orphan rebind/remove, RACI badges. Build passes.
- 2026-05-28T12:36:27Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1866441 – Started review via action command
- 2026-05-28T12:39:38Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1866441 – Review passed: ReactiveFormsModule form with all 5 fields, spocValidator with regnology.net pattern and inline error, confirm() delete (acceptable for local dashboard), Rebind+Delete on orphaned rows, cascade-delete banner, RACI badge pills via rn-badge--{color}, no hardcoded hex (rgba fallbacks follow existing convention), no font-weight:bold, production build succeeds in 1.75s
