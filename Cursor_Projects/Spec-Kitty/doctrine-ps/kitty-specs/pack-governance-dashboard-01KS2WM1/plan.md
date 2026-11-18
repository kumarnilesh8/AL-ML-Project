# Implementation Plan: Pack Governance Dashboard

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/pack-governance-dashboard-01KS2WM1/spec.md`

## Summary

Build a local Angular 18 + Express.js webapp that reads pack YAML artifacts from disk,
provides a branded UI for inspection and live editing, validates against spec-kitty Pydantic
schemas via Python subprocess, and implements a review workflow with disk-persisted JSON
outcomes for agent consumption.

## Technical Context

**Language/Version**: TypeScript 5.4+ (frontend + backend), Python 3.11+ (validation bridge)
**Primary Dependencies**: Angular 18 (standalone components), Express.js 4.x, Monaco Editor, js-yaml
**Storage**: Filesystem only — YAML artifacts in `pack/`, review JSON in `pack/.reviews/`
**Testing**: Vitest (backend unit), Karma/Jest (Angular), existing pytest suite (schema validation)
**Target Platform**: Linux/macOS local development (localhost:4200 frontend, localhost:3000 API)
**Project Type**: Web application (separate frontend + backend)
**Performance Goals**: <2s page load for 100 artifacts, <5s for single-artifact validation
**Constraints**: No external services, no database, filesystem-only persistence, Node 20+
**Scale/Scope**: ~100 YAML artifacts across 8 kinds, single-user local tool

## Charter Check

*No charter file exists yet in this project. Skipped — not a blocker for a local dev tool.*

## Project Structure

### Documentation (this feature)

```
kitty-specs/pack-governance-dashboard-01KS2WM1/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # API contract (OpenAPI)
└── tasks.md             # Phase 2 output (created by /spec-kitty.tasks)
```

### Source Code (repository root)

```
tools/pack-dashboard/
├── package.json                    # Workspace root (npm workspaces)
├── tsconfig.base.json              # Shared TypeScript config
├── angular.json                    # Angular CLI config
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express entry, CORS, static serve
│       ├── config.ts               # Path resolution (PACK_ROOT, SPEC_KITTY_SRC)
│       ├── routes/
│       │   ├── artifacts.routes.ts # GET/PUT artifact CRUD
│       │   ├── reviews.routes.ts   # GET/POST review lifecycle
│       │   ├── validation.routes.ts# POST validate (Python bridge)
│       │   └── drg.routes.ts       # GET DRG fragment
│       ├── services/
│       │   ├── pack-scanner.service.ts   # Scan pack/ dirs, parse YAML
│       │   ├── review-store.service.ts   # Read/write .reviews/ JSON
│       │   └── validator.service.ts      # Python subprocess invocation
│       └── models/
│           ├── artifact.model.ts
│           └── review.model.ts
├── src/                            # Angular 18 app
│   ├── main.ts
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   ├── layout/
│   │   │   ├── header.component.ts
│   │   │   └── sidebar.component.ts
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── artifact-list/
│   │   │   └── artifact-detail/
│   │   ├── components/
│   │   │   ├── yaml-editor/
│   │   │   ├── review-panel/
│   │   │   └── validation-badge/
│   │   ├── services/
│   │   │   ├── artifact.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── validation.service.ts
│   │   └── models/
│   │       ├── artifact.model.ts
│   │       └── review.model.ts
│   ├── assets/
│   │   └── css/
│   │       └── regnology-web.css   # Symlinked from docops
│   └── styles.scss
└── scripts/
    └── validate_artifact.py        # Python bridge script
```

**Structure Decision**: Web application with separate server/ (Express API) and src/ (Angular frontend),
co-located under `tools/pack-dashboard/`. Uses npm workspaces for shared TypeScript types.

## Implementation Phases

### Phase 1 — Read + Validate (MVP core)

1. Scaffold Angular 18 project with `ng new` (standalone, SSR disabled)
2. Scaffold Express backend with TypeScript
3. Implement `pack-scanner.service.ts` — scan all 8 artifact subdirs, parse raw YAML content + filePath. Delegate canonical `id` and `title` extraction to `validate_artifact.py --extract-meta` (Python bridge is the single authority on per-kind field names; scanner does not duplicate schema knowledge)
4. Implement artifact routes (GET list, GET detail)
5. Write `validate_artifact.py` Python bridge with two modes: `--validate` (Pydantic validation → ValidationResult JSON) and `--extract-meta` (canonical id/title from Pydantic model fields). Implement in-process result cache keyed by `(filePath, mtime)`.
6. Implement validation routes (single + bulk). Bulk validation runs subprocesses in parallel batches (default concurrency: 8) to avoid sequential blocking at scale.
7. Build Angular layout shell with Regnology CSS (header, sidebar, routing)
8. Build artifact-list page (table with kind/id/title/validationStatus/reviewStatus columns)
9. Build artifact-detail page (YAML display with syntax highlighting) + related-artifacts panel (consumes `GET /api/drg`, filters edges by current artifact id, zero extra API work)
10. Add validation-badge component (unknown/valid/invalid three-state indicator)

### Phase 2 — Edit + Review (MVP complete)

11. Integrate Monaco editor component (ngx-monaco-editor-v2)
12. Implement PUT route for saving edited YAML to disk
13. Wire editor save with validate-before-write sequence: POST /api/validate (in-memory) → if valid PUT /api/artifacts (write to disk) → update badge; if invalid show errors, block write, file on disk unchanged
14. Implement review-store.service.ts (read/write `.reviews/` JSON)
15. Implement review routes (GET state, POST decision). Register `/api/reviews-summary` literal route before `/api/reviews/:kind` in the Express router — this ordering is load-order-sensitive and must be enforced by a comment in reviews.routes.ts and a route-level unit test.
16. Build review-panel component (comments, severity, decision buttons — only SubmittableReviewStatus values exposed)
17. Add review status indicators to artifact-list
18. Document the `.reviews/` file contract for agent consumption

### Phase 3 — Polish (post-MVP)

19. Dashboard overview page: counts per kind, validation pass rate, review progress by status, coverage summary (link to DRG coverage query results)
20. Filesystem watcher (chokidar) for auto-refresh on external changes; invalidate validation cache on file change events
21. [WANT] DRG graph viewer with Cytoscape.js — full interactive graph. Note: related-artifacts panel (shipped in Phase 1, step 9) already provides node-level navigation without this.

## Dependencies & Tooling

| Dependency | Purpose | Version |
|-----------|---------|---------|
| @angular/cli | Frontend scaffold and dev server | ^18.x |
| express | Backend HTTP server | ^4.x |
| js-yaml | YAML parse/serialize in Node | ^4.x |
| ngx-monaco-editor-v2 | Monaco editor Angular wrapper | latest |
| chokidar | Filesystem watcher (Phase 3) | ^3.x |
| cors | Dev CORS middleware | ^2.x |
| spec-kitty (Python) | Pydantic models for validation | 3.2.0rc15 (fork) |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Python subprocess latency | Validate on-demand, cache results, show spinner |
| Monaco bundle size | Lazy-load editor module, only load on detail page |
| Design system CSS drift | Symlink to docops dist, not copy; re-sync with `make build` in docops |
| Spec-kitty model changes | Existing pytest suite catches schema drift; rerun after upstream updates |

## Complexity Tracking

No charter violations. Tool is a straightforward web app with well-understood patterns.
No over-engineering detected — filesystem-only storage, subprocess validation, standard REST API.
