---
work_package_id: WP02
title: Backend Artifact API
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-005
- FR-014
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
agent: "claude:sonnet:reviewer-rita:reviewer"
shell_pid: "681742"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/server/src/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/services/pack-scanner.service.ts
- tools/pack-dashboard/server/src/routes/artifacts.routes.ts
- tools/pack-dashboard/server/src/routes/drg.routes.ts
- tools/pack-dashboard/server/src/models/artifact.model.ts
tags: []
---

# WP02 — Backend Artifact API

## Objective

Implement the Express routes that serve pack artifacts to the frontend. The pack-scanner
service reads YAML files from `pack/`, parses them, and exposes them as JSON through REST endpoints.

## Context

- `PACK_ROOT` defaults to `../../pack` relative to `tools/pack-dashboard/` (i.e., the repo's `pack/` directory)
- 8 artifact kinds: directives, tactics, styleguides, toolguides, paradigms, procedures, agent_profiles, mission_step_contracts
- Each kind lives in a subdirectory of `pack/` (e.g., `pack/directives/*.directive.yaml`)
- Different kinds have different id fields:
  - `agent_profiles`: uses `profile-id`
  - Others: uses `id`
- DRG fragment is at `pack/drg/fragment.yaml`

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T005 — Implement pack-scanner service

`tools/pack-dashboard/server/src/services/pack-scanner.service.ts`:
- Export a `scanPack(packRoot: string): ArtifactSummary[]` function
- For each of the 8 known subdirs: read all `.yaml` files
- Parse each YAML, extract `id` (or `profile-id` for agent_profiles), `title` (or `name`)
- Return flat array of `{ id, kind, title, filePath }` objects
- Handle missing dirs gracefully (return empty for that kind)

### T006 — Implement artifact routes (GET)

`tools/pack-dashboard/server/src/routes/artifacts.routes.ts`:
- `GET /api/artifacts` — returns all artifacts grouped by kind
- `GET /api/artifacts/:kind` — returns list for a specific kind
- `GET /api/artifacts/:kind/:id` — returns full content (raw YAML + parsed JSON)
- Use `js-yaml` for parsing; return 404 if artifact not found

### T007 — Implement PUT route

> **Phase note**: The plan document lists the PUT endpoint under Phase 2, but it is implemented here in WP02 (Phase 1) to keep the full artifact CRUD surface in one place. WP05 (editor) will depend on this route already being present.

Same file:
- `PUT /api/artifacts/:kind/:id` — body `{ content: string }`
- Writes raw YAML content to the artifact's file path
- Returns `{ saved: true, path: <relative-path> }`
- Validate that the file exists before writing (no arbitrary file creation)

### T008 — Implement DRG route

`tools/pack-dashboard/server/src/routes/drg.routes.ts`:
- `GET /api/drg` — reads `pack/drg/fragment.yaml`
- Parses it and returns `{ nodes: [...], edges: [...] }` as JSON
- Nodes: `{ id, kind, title, body_path }`
- Edges: `{ source, target, relation }`

## Definition of Done

- [ ] `GET /api/artifacts` returns populated JSON for all kinds with artifacts in pack/
- [ ] `GET /api/artifacts/directives/REGNOLOGY_BRANDING` returns full YAML content
- [ ] `PUT /api/artifacts/directives/REGNOLOGY_BRANDING` with modified content saves to disk
- [ ] `GET /api/drg` returns the DRG graph with correct node/edge counts
- [ ] Missing kind dirs return empty arrays, not errors

## Risks

- YAML parse failures on malformed files — wrap in try/catch, return error in response
- Large artifact count — unlikely (<100 total), but paginate if needed

## Activity Log

- 2026-05-20T18:14:47Z – claude:sonnet:implementer-ivan:implementer – shell_pid=678725 – Started implementation via action command
- 2026-05-20T18:17:40Z – claude:sonnet:implementer-ivan:implementer – shell_pid=678725 – Ready for review: pack-scanner, GET/PUT artifact routes, DRG route with coverage endpoint
- 2026-05-20T18:18:03Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=681742 – Started review via action command
- 2026-05-20T18:19:08Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=681742 – Review passed: all 8 ACs met — profile-id extraction, grouped GET, detail GET with parsedData, PUT existence-gated, DRG nodes/edges, coverage with query params and correct route order, zero TS errors, missing dirs return empty arrays
