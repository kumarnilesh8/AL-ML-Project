---
work_package_id: WP01
title: Project Scaffold and Configuration
dependencies: []
requirement_refs:
- FR-001
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-pack-governance-dashboard-01KS2WM1
base_commit: 133407feb2fe8a38dd0015a6797af07a63e861c4
created_at: '2026-05-20T18:07:15.081938+00:00'
subtasks:
- T001
- T002
- T003
- T004
shell_pid: "677519"
agent: "claude:sonnet:reviewer-rita:reviewer"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/package.json
- tools/pack-dashboard/tsconfig.base.json
- tools/pack-dashboard/angular.json
- tools/pack-dashboard/server/package.json
- tools/pack-dashboard/server/tsconfig.json
- tools/pack-dashboard/server/src/index.ts
- tools/pack-dashboard/server/src/config.ts
- tools/pack-dashboard/src/main.ts
- tools/pack-dashboard/src/styles.scss
- tools/pack-dashboard/src/assets/css/**
- tools/pack-dashboard/src/app/app.component.ts
- tools/pack-dashboard/src/app/app.routes.ts
tags: []
---

# WP01 — Project Scaffold and Configuration

## Objective

Set up the monorepo structure for the Pack Governance Dashboard under `tools/pack-dashboard/`.
After this WP, both the Angular 18 frontend (localhost:4200) and the Express backend (localhost:3000)
should start successfully, and the Regnology design system CSS should be loaded.

## Context

- This is a local dev tool, not a production deployment.
- Angular 18 with standalone components (no NgModules), no SSR.
- Express 4.x with TypeScript for the API server.
- npm workspaces connect frontend and backend under a shared root.
- Regnology CSS is at `/home/stijnd/Documents/code/clients/REGNOLOGY/regnology-docgen/design-system/dist/regnology-web.css`.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T001 — Scaffold Angular 18 project

Create a new Angular 18 project under `tools/pack-dashboard/`:
- Use `ng new` with `--standalone --ssr=false --style=scss`
- Or manually scaffold the minimal Angular 18 standalone setup
- Ensure `angular.json` outputs to `dist/pack-dashboard`

### T002 — Scaffold Express backend

Create `tools/pack-dashboard/server/`:
- `package.json` with express, cors, js-yaml, typescript, ts-node-dev deps
- `tsconfig.json` extending the shared base
- `src/index.ts` with basic Express app: CORS enabled, JSON body parser, port 3000
- `src/config.ts` exporting PACK_ROOT and SPEC_KITTY_SRC paths (from env or defaults)

### T003 — Configure npm workspaces and shared tsconfig

At `tools/pack-dashboard/` root:
- `package.json` with `"workspaces": [".", "server"]`
- `tsconfig.base.json` with strict mode, ES2022 target, path aliases
- npm script `"start"` that concurrently runs Angular dev server and Express

### T004 — Symlink Regnology CSS

- Symlink or copy `regnology-web.css` into `tools/pack-dashboard/src/assets/css/`
- Import it in `src/styles.scss`
- Verify the CSS custom properties (--rn-color-primary, etc.) are available at runtime

## Definition of Done

- [ ] `cd tools/pack-dashboard && npm install` succeeds
- [ ] `npm start` launches both servers without errors
- [ ] Browser at localhost:4200 shows a page with Regnology header styling
- [ ] localhost:3000/api/health returns `{"status": "ok"}`

## Risks

- Angular CLI version might conflict with Node 24 — pin @angular/cli to 18.x
- Symlinks may not resolve correctly on Windows (not a concern — Linux target)

## Activity Log

- 2026-05-20T18:07:16Z – claude:sonnet:implementer-ivan:implementer – shell_pid=670951 – Assigned agent via action command
- 2026-05-20T18:12:49Z – claude:sonnet:implementer-ivan:implementer – shell_pid=670951 – Ready for review: Angular 18 + Express scaffold, npm workspaces configured, CSS snapshot included
- 2026-05-20T18:13:13Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=677519 – Started review via action command
- 2026-05-20T18:14:24Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=677519 – Review passed: all scaffold criteria met — Angular 18 standalone, Express /api/health, config.ts exports, Regnology CSS snapshot + symlink, strict TS compiles clean in both contexts, no SSR, .gitignore correct
