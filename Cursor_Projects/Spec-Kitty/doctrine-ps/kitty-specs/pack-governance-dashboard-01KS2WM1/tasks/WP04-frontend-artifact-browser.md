---
work_package_id: WP04
title: Frontend Artifact Browser
dependencies:
- WP02
requirement_refs:
- FR-002
- FR-003
- FR-007
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
agent: "claude:sonnet:reviewer-rita:reviewer"
shell_pid: "690040"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/src/app/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/src/app/layout/**
- tools/pack-dashboard/src/app/pages/**
- tools/pack-dashboard/src/app/components/validation-badge/**
- tools/pack-dashboard/src/app/services/artifact.service.ts
- tools/pack-dashboard/src/app/models/artifact.model.ts
tags: []
---

# WP04 — Frontend Artifact Browser

## Objective

Build the Angular frontend shell and artifact browsing pages. After this WP, users can
navigate the sidebar by kind, see a table of artifacts, and view individual artifact YAML.

## Context

- Angular 18 standalone components (no NgModules)
- Regnology CSS provides: `.rn-header`, `.rn-sidebar`, `.rn-table`, `.rn-badge`, `.rn-btn`
- API is at `http://localhost:3000/api/` (proxied in dev via angular.json proxy config)
- Use Angular HttpClient for API calls
- Routes: `/` (redirect to dashboard), `/artifacts/:kind` (list), `/artifacts/:kind/:id` (detail)

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T012 — Build Angular layout shell

`tools/pack-dashboard/src/app/layout/`:
- `header.component.ts` — Regnology branded header with app title "Pack Dashboard"
- `sidebar.component.ts` — Navigation links for each artifact kind (8 items)
- Wire into `app.component.ts` with `<router-outlet>` for page content
- Add Angular proxy config (`proxy.conf.json`) to forward `/api` to port 3000

### T013 — Build artifact-list page

`tools/pack-dashboard/src/app/pages/artifact-list/`:
- Route parameter: `:kind`
- Calls `GET /api/artifacts/:kind`
- Renders table with columns: ID, Title, File Path, Review Status (badge)
- Each row links to detail page
- Use Regnology table styling (`.rn-table`)

### T014 — Build artifact-detail page

`tools/pack-dashboard/src/app/pages/artifact-detail/`:
- Route parameters: `:kind`, `:id`
- Calls `GET /api/artifacts/:kind/:id`
- Displays raw YAML in a `<pre><code>` block (Monaco editor added in WP05)
- Shows metadata: kind, id, title, file path
- Shows validation badge (triggers validation on load)
- "Back to list" navigation

### T015 — Build validation-badge component

`tools/pack-dashboard/src/app/components/validation-badge/`:
- Input: `status: 'valid' | 'invalid' | 'pending' | 'unknown'`
- Renders colored badge: green (valid), red (invalid), grey (pending/unknown)
- Uses `.rn-badge` class with color modifiers
- Standalone component, reusable in list and detail views

## Definition of Done

- [ ] Sidebar shows 8 artifact kinds as navigation links
- [ ] Clicking a kind navigates to `/artifacts/directives` (or other kind)
- [ ] Artifact list table renders all artifacts for that kind
- [ ] Clicking an artifact navigates to detail page showing full YAML
- [ ] Validation badge shows correct color after validation API call
- [ ] Regnology header/sidebar styling matches design system
- [ ] Artifact list page renders within 2s for the current pack size (NFR-001 acceptance: time the initial render manually with browser DevTools Network tab throttled to "No throttling")

## Risks

- API not running → show error state in components (empty state with message)
- Large YAML content → `<pre>` block handles it fine for now (Monaco in WP05)

## Activity Log

- 2026-05-20T18:23:08Z – claude:sonnet:implementer-ivan:implementer – shell_pid=687058 – Started implementation via action command
- 2026-05-20T18:26:27Z – claude:sonnet:implementer-ivan:implementer – shell_pid=687058 – Ready for review: layout shell with header/sidebar, artifact-list and detail pages, validation-badge component
- 2026-05-20T18:26:50Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=690040 – Started review via action command
- 2026-05-20T18:29:31Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=690040 – Review passed: lazy-loaded routes, 8-kind sidebar, table with ID/title/validation/review, standalone components, validation triggered on detail load, error states handled
