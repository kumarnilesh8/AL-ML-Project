---
work_package_id: WP06
title: Integration and Rename
dependencies:
- WP04
requirement_refs:
- FR-014
- FR-015
- FR-019
- FR-020
- FR-023
- FR-024
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-organizational-bindings-01KSPTPR
base_commit: ca3ccef9c51c5c29ce62863975c041e820c4f808
created_at: '2026-05-28T12:22:17.308526+00:00'
subtasks:
- T023
- T024
- T025
- T026
- T027
shell_pid: "1877830"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/src/app/pages/domain-artifacts/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/pages/domain-artifacts/domain-artifacts.component.ts
- tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts
- tools/pack-dashboard/src/app/layout/header.component.ts
- tools/pack-dashboard/src/app/pages/artifact-detail/**
- config/org-bindings.yaml
tags: []
---

# WP06 — Integration and Rename

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Depends on**: WP04 (OrgBindingsService must exist)
- Can be worked in parallel with WP05 once WP04 is merged.
- To implement: `spec-kitty agent action implement WP06 --agent <name>`

## Objective

Surface org-bindings data in two existing pages (domain detail and dashboard), rename the application, and create the seed `config/org-bindings.yaml` file.

## Context

- `domain-artifacts.component.ts` already exists; we add a new Accountability sub-section below the existing artifacts table.
- `dashboard.component.ts` domain cards already exist; we add a small chip-link to each.
- `header.component.ts` — find the title string and update it.
- `OrgBindingsService` is injectable from WP04; import and inject it.

---

## T023 — Add primary/secondary Accountability sub-section to `domain-artifacts.component.ts`

**Purpose**: Show RACI bindings for the current domain, split into Primary Accountability and Secondary / informational sections based on whether this domain is the `primary_domain` for each artifact.

**Context**: The artifact detail page (`/artifacts/:kind/:id`) — not the domain page — is where `primary_domain` matters most. The domain page at `/domain/:id` shows all bindings *for that domain*, so every binding shown here is for this domain specifically. The primary/secondary split here reads as: "Is this domain the primary domain of the *artifact* being viewed?" This is only relevant when viewing the page from an artifact's perspective.

For the domain detail page, show **all bindings for this domain** in a flat accountability table (they're all "about" this domain). The primary/secondary split is surfaced on the **artifact detail page** in T023b below.

**Steps**:

1. Open `tools/pack-dashboard/src/app/pages/domain-artifacts/domain-artifacts.component.ts`.
2. Inject `OrgBindingsService` in the constructor.
3. Add a `bindings: OrgBinding[] = []` property.
4. In `ngOnInit`, add a call to `orgBindingsService.list()` and filter by `domain.id`:
   ```typescript
   this.orgBindingsService.list().subscribe(all => {
     this.bindings = all.filter(b => b.domain_id === this.domainId);
   });
   ```
5. At the bottom of the template (after the artifacts table), add a flat accountability table:

```html
<section style="margin-top: 32px;">
  <h3 class="dash-section-heading">Accountability</h3>
  @if (bindings.length === 0) {
    <p style="color: var(--rn-color-text-secondary);">No accountability bindings recorded.</p>
  } @else {
    <table class="rn-table" style="margin-top: 12px;">
      <thead>
        <tr><th>Department</th><th>SPOC</th><th>Role</th><th>Involvement</th></tr>
      </thead>
      <tbody>
        @for (b of bindings; track b.id) {
          <tr>
            <td>{{ b.department }}</td>
            <td>{{ b.spoc }}</td>
            <td>
              <span class="rn-badge rn-badge--{{ raciBadge(b.accountability) }}">
                [{{ b.accountability }}] {{ raciLabel(b.accountability) }}
              </span>
            </td>
            <td style="color: var(--rn-color-text-secondary); font-size: 0.875rem;">
              {{ b.involvement ?? '—' }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</section>
```

6. Add `raciBadge` and `raciLabel` helpers (import from `org-binding.model.ts`).

**Files modified**: `tools/pack-dashboard/src/app/pages/domain-artifacts/domain-artifacts.component.ts`

---

## T023b — Primary / secondary accountability split on artifact detail page

**Purpose**: The artifact detail page (`/artifacts/:kind/:id`) is where `primary_domain` resolves "who is accountable". Show primary domain [A] bindings prominently; all other domain bindings in a subdued informational style.

**Context**: The artifact detail page is in `tools/pack-dashboard/src/app/pages/artifact-detail/` (or similar — locate with `rg "artifact-detail" tools/pack-dashboard/src/app/`). It currently shows YAML content and validation status. We add an Accountability section beneath.

**Steps**:

1. Locate the artifact detail component. Inject both `OrgBindingsService` and `ArtifactTagsService` (or call `HttpClient` directly for `/api/artifact-tags/:id`).
2. In `ngOnInit`, fetch:
   - The artifact's tag entry: `GET /api/artifact-tags/:id` → `{ domains, primary_domain? }`
   - All org-bindings: `GET /api/org-bindings`
3. Derive:
   ```typescript
   const primaryDomain   = tagEntry?.primary_domain ?? null;
   const artifactDomains = tagEntry?.domains ?? [];

   const primaryBindings = primaryDomain
     ? allBindings.filter(b => b.domain_id === primaryDomain)
     : [];
   const secondaryBindings = allBindings.filter(
     b => artifactDomains.includes(b.domain_id) && b.domain_id !== primaryDomain
   );
   ```
4. Render:

```html
<section style="margin-top: 32px;">
  <h3 class="dash-section-heading">Primary Accountability</h3>

  @if (!primaryDomain) {
    <p style="color: var(--rn-color-text-secondary); font-style: italic;">
      No primary domain designated. Set a primary domain in the domain tags to
      resolve accountability.
    </p>
  } @else if (primaryBindings.length === 0) {
    <p style="color: var(--rn-color-text-secondary);">
      No accountability bindings recorded for primary domain
      <strong>{{ primaryDomain }}</strong>.
    </p>
  } @else {
    <table class="rn-table" style="margin-top: 8px;">
      <thead><tr><th>Department</th><th>SPOC</th><th>Role</th><th>Involvement</th></tr></thead>
      <tbody>
        @for (b of primaryBindings; track b.id) {
          <tr>
            <td><strong>{{ b.department }}</strong></td>
            <td>{{ b.spoc }}</td>
            <td>
              <span class="rn-badge rn-badge--{{ raciBadge(b.accountability) }}">
                [{{ b.accountability }}] {{ raciLabel(b.accountability) }}
              </span>
            </td>
            <td style="font-size: 0.875rem;">{{ b.involvement ?? '—' }}</td>
          </tr>
        }
      </tbody>
    </table>
  }

  @if (secondaryBindings.length > 0) {
    <details style="margin-top: 16px;">
      <summary style="cursor: pointer; color: var(--rn-color-text-secondary); font-size: 0.875rem;">
        Secondary / informational ({{ secondaryBindings.length }})
      </summary>
      <table class="rn-table" style="margin-top: 8px; opacity: 0.7;">
        <thead><tr><th>Domain</th><th>Department</th><th>SPOC</th><th>Role</th></tr></thead>
        <tbody>
          @for (b of secondaryBindings; track b.id) {
            <tr>
              <td style="color: var(--rn-color-text-secondary);">{{ b.domain_id }}</td>
              <td>{{ b.department }}</td>
              <td>{{ b.spoc }}</td>
              <td>
                <span class="rn-badge rn-badge--neutral">
                  [{{ b.accountability }}] {{ raciLabel(b.accountability) }}
                </span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </details>
  }
</section>
```

5. Add `OrgBindingsService`, `OrgBinding`, `raciBadge`, `raciLabel` to imports.

**Files modified**: artifact detail component (locate path with `rg "artifact-detail\|ArtifactDetail" tools/pack-dashboard/src/app/`)

---

## T024 — Add `→ Bindings` chip to dashboard domain cards

**Purpose**: Each domain card on the main dashboard gets a chip that navigates to `/org-bindings?domain=<id>`.

**Steps**:

1. Open `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`.
2. Locate the domain card template section (the `ks-card` block inside the `By Domain` area).
3. Add at the bottom of each domain card:
   ```html
   <a class="rn-badge rn-badge--neutral"
      style="margin-top: 8px; display: inline-block; cursor: pointer;"
      [routerLink]="['/org-bindings']"
      [queryParams]="{ domain: domain.id }">
     → Bindings
   </a>
   ```
4. Ensure `RouterLink` is in the component's `imports` array (it likely already is).

**Files modified**: `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`

---

## T025 — Update `header.component.ts` app title

**Purpose**: Rename the displayed application title.

**Steps**:

1. Open `tools/pack-dashboard/src/app/layout/header.component.ts`.
2. Find the title string — likely `Pack Governance Dashboard` or `pack-governance-dashboard`.
3. Replace with `Doctrine Organisational Management Dashboard`.
4. Verify the change is visible in the rendered header.

**Files modified**: `tools/pack-dashboard/src/app/layout/header.component.ts`

---

## T026 — Update `dashboard.component.ts` page heading

**Purpose**: The `<h2>` or page title in the dashboard component also needs the rename.

**Steps**:

1. Open `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`.
2. Find the `<h2>` (or equivalent) that reads something like `Pack Governance Dashboard`.
3. Replace with `Doctrine Organisational Management Dashboard`.

**Files modified**: `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts`

---

## T027 — Create seed `config/org-bindings.yaml`

**Purpose**: Ensure the file exists at repo root so the server returns `[]` immediately after `git clone` without needing a POST first.

**Steps**:

1. Create `config/org-bindings.yaml` at repo root (i.e. `/home/stijn/Documents/_code/CLIENTS/regnology/regnology-agent-doctrine/config/org-bindings.yaml`) with:
   ```yaml
   schema_version: "1.0"
   bindings: []
   ```
2. Confirm the file is not inside `pack/`.
3. Commit the file.

**Files created**: `config/org-bindings.yaml`

---

## Definition of Done

- [ ] `/domain/:id` shows flat Accountability table with all bindings for that domain
- [ ] Artifact detail page shows **Primary Accountability** section with primary domain [A] bindings
- [ ] Artifact detail page shows **Secondary / informational** collapsible section for non-primary domain bindings
- [ ] "No primary domain designated" notice shown when `primary_domain` absent
- [ ] Dashboard domain cards have `→ Bindings` chip-link
- [ ] App title in header reads *Doctrine Organisational Management Dashboard*
- [ ] `<h2>` on dashboard page reads *Doctrine Organisational Management Dashboard*
- [ ] `config/org-bindings.yaml` exists at repo root (outside `pack/`)
- [ ] Angular production build succeeds
- [ ] `GET /api/org-bindings` returns `[]` on a fresh clone (AC-01)

## Risks

- **`header.component.ts` title location**: May be a TypeScript string, an HTML template string, or a `<title>` tag in `index.html`. Check `rg "Pack Governance" tools/pack-dashboard/src/` to locate all occurrences before editing.
- **Concurrent WP05 edits**: T023 modifies `domain-artifacts.component.ts` and T024/T025/T026 modify dashboard/header components — none of these overlap with WP05 which only touches `org-bindings.component.ts` and `styles.scss`. WP05 and WP06 can safely run in parallel after WP04.

## Activity Log

- 2026-05-28T12:22:18Z – cursor:sonnet:implementer:implementer – shell_pid=1840148 – Assigned agent via action command
- 2026-05-28T12:35:51Z – cursor:sonnet:implementer:implementer – shell_pid=1840148 – Domain accountability table, artifact primary/secondary split, Bindings chip, app renamed, seed YAML. Build passes.
- 2026-05-28T12:36:36Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1866689 – Started review via action command
- 2026-05-28T12:41:08Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1866689 – Moved to planned
- 2026-05-28T12:41:34Z – cursor:sonnet:implementer:implementer – shell_pid=1873127 – Started implementation via action command
- 2026-05-28T12:43:18Z – cursor:sonnet:implementer:implementer – shell_pid=1873127 – Cycle 2: added routerLink on no-primary-domain notice, snapshot badge hex moved to --rn-color-*-light tokens. Build passes.
- 2026-05-28T12:43:36Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1877830 – Started review via action command
- 2026-05-28T12:45:37Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1877830 – Cycle 2 approved: routerLink on no-primary-domain notice present, CSS badge classes use var(--rn-color-*-light, hex) tokens, all original ACs verified (accountability table, primary/secondary split, bindings chip, title rename, config/org-bindings.yaml, build passes). Cycle 1 rejection addressed.
