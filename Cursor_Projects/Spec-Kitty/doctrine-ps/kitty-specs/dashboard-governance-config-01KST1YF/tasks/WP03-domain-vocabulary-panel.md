---
work_package_id: WP03
title: Domain Vocabulary Panel Frontend
dependencies:
- WP01
- WP02
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:44:56.106702+00:00'
subtasks:
- T012
- T013
- T014
- T015
- T016
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1114148"
history: []
agent_profile: frontend-freddy
authoritative_surface: tools/pack-dashboard/src/app/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/services/domain.service.ts
- tools/pack-dashboard/src/app/components/domain-vocabulary-panel/**
- tools/pack-dashboard/src/app/pages/org-bindings/**
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

Build the Domain Vocabulary panel UI: extend the frontend `DomainService` with CRUD
methods, create a new standalone `DomainVocabularyPanelComponent`, and integrate it
into the Org Bindings page with cascade-preview confirmation dialog.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Start from: `spec-kitty agent action implement WP03 --agent <name>`

## Context

**Existing frontend service** (`tools/pack-dashboard/src/app/services/domain.service.ts`):
- `getConfig(): Observable<DomainConfigResponse>` → `GET /api/domain-config`
- `getTags(): Observable<ArtifactTagsResponse>` → `GET /api/artifact-tags`
- `setTags(artifactId, domains, primaryDomain?): Observable<void>` → `PUT /api/artifact-tags/:id`

**Existing model** (`tools/pack-dashboard/src/app/models/domain.model.ts`):
```typescript
interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color?: string; // 'blue' | 'green' | 'red' | 'petrol' | 'amber' | 'purple' | 'neutral'
}
interface DomainConfigResponse { domains: DomainConfig[]; }
```

**OrgBindingsComponent** (`tools/pack-dashboard/src/app/pages/org-bindings/org-bindings.component.ts`):
- Inline template (~184 lines)
- Uses `forkJoin([this.orgBindingsService.list(), this.domainService.getConfig()])` on init
- Has `domains: DomainConfig[]` used for the domain dropdown in the binding form
- Reactive form with `editId`, `createForm`, etc. — same pattern to follow for domain CRUD

**Regnology brand CSS** — use `--rn-*` custom properties; no hex values; no `font-weight: bold`.
Color token to badge class: `blue` → `.rn-chip--blue`, `petrol` → `.rn-chip--petrol`, etc.
Follow existing chip styling from `DomainChipsComponent`.

**ALLOWED_COLORS** from WP01: `['blue','green','red','petrol','amber','purple','neutral']`

## Subtask Guidance

### T012 — Extend frontend domain.service.ts

**Purpose**: Add CRUD methods to the existing service so components can create/update/delete domains and fetch cascade previews.

**Add these methods to DomainService**:
```typescript
addDomain(input: { id: string; label: string; description: string; color?: string }): Observable<{ domain: DomainConfig }>
  // POST /api/domain-config

updateDomain(id: string, patch: { label?: string; description?: string; color?: string }): Observable<{ domain: DomainConfig }>
  // PUT /api/domain-config/:id

deleteDomain(id: string): Observable<void>
  // DELETE /api/domain-config/:id → 204

getCascadePreview(id: string): Observable<CascadePreviewResult>
  // GET /api/domain-config/:id/cascade-preview
```

Add `CascadePreviewResult` interface to `domain.model.ts`:
```typescript
export interface CascadePreviewResult {
  domainId: string;
  artifactTagCount: number;
  primaryDomainLossCount: number;
  orgBindingCount: number;
}
```

Use `HttpClient` with typed responses consistent with existing method patterns. `deleteDomain` should use `{ observe: 'response' }` or handle 204 correctly.

---

### T013 — DomainVocabularyPanelComponent — domain list + add form

**File**: Create `tools/pack-dashboard/src/app/components/domain-vocabulary-panel/domain-vocabulary-panel.component.ts`

**Component inputs/outputs**:
```typescript
@Input() domains: DomainConfig[] = [];
@Output() domainsChanged = new EventEmitter<void>();
```

**Inline template structure**:
```html
<section class="domain-vocabulary">
  <div class="domain-vocabulary__header">
    <h3>Domain Vocabulary</h3>
    <button (click)="toggleCollapsed()">{{ collapsed ? 'Expand' : 'Collapse' }}</button>
  </div>

  <div *ngIf="!collapsed">
    <!-- Domain list -->
    <div class="domain-list">
      <div *ngFor="let domain of domains" class="domain-item">
        <!-- Collapsed: show color swatch + label + edit + delete buttons -->
        <!-- Expanded for edit: show edit form (T014) -->
      </div>
    </div>

    <!-- Add domain form (toggleable) -->
    <div *ngIf="showAddForm">
      <!-- ID slug input, Label input, Description textarea, Color dropdown -->
      <!-- Save / Cancel buttons -->
    </div>
    <button *ngIf="!showAddForm" (click)="showAddForm = true">+ Add Domain</button>
  </div>
</section>
```

**Add form fields** (use `FormBuilder`):
- `id`: text input, pattern validation `^[a-z][a-z0-9-]*$`, required, maxlength 60
- `label`: text input, required, maxlength 80
- `description`: textarea, required, maxlength 400
- `color`: `<select>` with options from ALLOWED_COLORS (display brand names, value = token name)

**On save**: call `domainService.addDomain(form.value)`, on success emit `domainsChanged` and hide form. On 409: show inline "ID already exists" error. On 400: show inline validation error from server.

**Color dropdown rendering**: map color token to a colored swatch using existing chip CSS:
```html
<option *ngFor="let c of allowedColors" [value]="c">{{ c }}</option>
```
Show a `<span class="rn-chip rn-chip--{{domain.color}}">{{ domain.color }}</span>` swatch inline next to each domain in the list.

---

### T014 — Edit mode in DomainVocabularyPanelComponent

**Purpose**: Allow inline editing of label, description, color. ID must be read-only.

**State**: Add `editId: string | null = null` to the component.

**Edit form** (shown inline within the domain-item div when `editId === domain.id`):
```html
<form *ngIf="editId === domain.id" [formGroup]="editForm">
  <input formControlName="id" readonly class="rn-input rn-input--readonly" [value]="domain.id">
  <span class="rn-hint">Domain ID is immutable</span>
  <input formControlName="label" ...>
  <textarea formControlName="description" ...></textarea>
  <select formControlName="color">
    <option [value]="null">— no color —</option>
    <option *ngFor="let c of allowedColors" [value]="c">{{ c }}</option>
  </select>
  <button (click)="saveEdit(domain.id)">Save</button>
  <button (click)="editId = null">Cancel</button>
</form>
```

**On save**: call `domainService.updateDomain(domain.id, { label, description, color })`, on success emit `domainsChanged` and clear `editId`. On error show inline message.

**UX rule**: Only one domain can be in edit mode at a time. Opening edit for domain B while domain A is in edit mode should close domain A's form (set `editId = domainB.id`).

---

### T015 — Delete flow with cascade preview confirmation

**Purpose**: Before deleting, show a confirmation dialog with cascade impact counts (FR-004).

**State**: Add `deletePreview: { domainId: string; result: CascadePreviewResult } | null = null`.

**Delete button click handler**:
```typescript
async onDeleteDomain(domainId: string): Promise<void> {
  // 1. Fetch preview
  this.domainService.getCascadePreview(domainId).subscribe(result => {
    this.deletePreview = { domainId, result };
  });
}
```

**Confirmation dialog** (inline in template, shown when `deletePreview !== null`):
```html
<div class="rn-dialog" *ngIf="deletePreview">
  <h4>Delete domain "{{ deletePreview.domainId }}"?</h4>
  <p>This will also remove:</p>
  <ul>
    <li>{{ deletePreview.result.artifactTagCount }} artefact tag assignment(s)</li>
    <li *ngIf="deletePreview.result.primaryDomainLossCount > 0">
      {{ deletePreview.result.primaryDomainLossCount }} primary domain designation(s) lost
    </li>
    <li>{{ deletePreview.result.orgBindingCount }} organisational binding(s)</li>
  </ul>
  <button class="rn-btn rn-btn--danger" (click)="confirmDelete()">Delete</button>
  <button (click)="deletePreview = null">Cancel</button>
</div>
```

**confirmDelete()**:
```typescript
confirmDelete(): void {
  const { domainId } = this.deletePreview!;
  this.domainService.deleteDomain(domainId).subscribe({
    next: () => {
      this.deletePreview = null;
      this.domainsChanged.emit();
    },
    error: err => { /* show inline error */ }
  });
}
```

---

### T016 — Integrate into OrgBindingsComponent

**Purpose**: Add `<app-domain-vocabulary-panel>` to the Org Bindings page and reload domain dropdown when domains change.

**Changes to OrgBindingsComponent**:

1. Add `DomainVocabularyPanelComponent` to imports array of the standalone component.
2. In the template, add the panel above the bindings grid:
   ```html
   <app-domain-vocabulary-panel
     [domains]="domains"
     (domainsChanged)="reloadDomains()">
   </app-domain-vocabulary-panel>
   ```
3. Add `reloadDomains()` method:
   ```typescript
   reloadDomains(): void {
     this.domainService.getConfig().subscribe(config => {
       this.domains = config.domains;
     });
   }
   ```
   This keeps the binding form's domain dropdown in sync without a full component reload.

4. Ensure `domains: DomainConfig[]` is already populated on init (it is, from the `forkJoin` in `ngOnInit`).

**Check**: After adding a domain via the panel, the domain dropdown in the "New Binding" form should include the newly added domain immediately.

## Definition of Done

- [ ] `DomainService` exports `addDomain`, `updateDomain`, `deleteDomain`, `getCascadePreview`
- [ ] `CascadePreviewResult` interface in domain.model.ts
- [ ] `DomainVocabularyPanelComponent` created as standalone Angular component
- [ ] Add form validates ID format, label, description, color token
- [ ] Edit form: ID field is read-only with visible hint
- [ ] Delete confirmation shows `artifactTagCount`, `primaryDomainLossCount`, `orgBindingCount`
- [ ] After CRUD operations, `domainsChanged` emits and OrgBindingsComponent reloads domain list
- [ ] No hex values in CSS; no `font-weight: bold`
- [ ] `ng build --configuration=production` succeeds from tools/pack-dashboard/
- [ ] `npx tsc --noEmit` compiles clean

## Risks

- `updateDomain` with an empty patch should not be sent to the server — validate on the frontend that at least one field is changed.
- The panel integrates inside an already ~184-line inline template component. Keep the panel as a child component (not inlined) to preserve the extraction benefit.
- Color validation: the frontend dropdown constrains values, but also validate the server's 400 response so the form doesn't silently fail.

## Activity Log

- 2026-06-01T10:44:57Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1100283 – Assigned agent via action command
- 2026-06-01T10:47:37Z – claude:sonnet:frontend-freddy:implementer – shell_pid=1100283 – Domain vocabulary panel: add/edit/delete with cascade dialog (always shown, zero-count handled per FR-004), integrated into OrgBindingsComponent, TypeScript clean
- 2026-06-01T10:48:01Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1114148 – Started review via action command
- 2026-06-01T10:50:10Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1114148 – Review passed: panel integrated in OrgBindingsComponent, zero-count dialog confirmed (shows 'No artefact-tag assignments or org-binding entries will be removed.'), ID read-only on edit with hint, colour uses ALLOWED_COLORS dropdown, reloadDomains() wired to domainsChanged, all four service methods called from panel, TypeScript clean (tsc --noEmit exits 0), diff scoped to tools/pack-dashboard/src/app/ only
