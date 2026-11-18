# Work Packages: Pack Governance Dashboard

**Mission**: pack-governance-dashboard-01KS2WM1
**Branch**: overhaul/migrate_to_kitty
**Date**: 2026-05-20

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|------|----------|
| T001 | Scaffold Angular 18 project (standalone, no SSR) | WP01 | |
| T002 | Scaffold Express backend with TypeScript | WP01 | |
| T003 | Configure npm workspaces and shared tsconfig | WP01 | |
| T004 | Copy/symlink regnology-web.css into Angular assets | WP01 | |
| T005 | Implement pack-scanner service (scan dirs, parse YAML) | WP02 | |
| T006 | Implement artifact routes (GET list, GET detail) | WP02 | |
| T007 | Implement PUT route for saving edited YAML | WP02 | |
| T008 | Implement DRG route (parse fragment.yaml) + coverage query endpoint | WP02 | |
| T009 | Write validate_artifact.py Python bridge script | WP03 | |
| T010 | Implement validator service (subprocess invocation) | WP03 | |
| T011 | Implement validation routes (single + bulk) | WP03 | |
| T012 | Build Angular layout shell (header, sidebar, routing) | WP04 | [P] |
| T013 | Build artifact-list page component | WP04 | [P] |
| T014 | Build artifact-detail page component | WP04 | [P] |
| T015 | Build validation-badge component | WP04 | |
| T016 | Integrate Monaco editor component | WP05 | |
| T017 | Wire editor save: validate in-memory via POST /api/validate → if valid write via PUT → update badge; block write and show errors if invalid | WP05 | |
| T018 | Implement review-store service (read/write JSON) | WP06 | |
| T019 | Implement review routes (GET, POST) | WP06 | |
| T020 | Build review-panel component (comments, decision) | WP06 | |
| T021 | Add review status to artifact-list, wire end-to-end | WP06 | |
| T022 | Build dashboard overview page (review progress + validation counts per kind) | WP06 | |

## Work Packages

### WP01 — Project Scaffold and Configuration

**Priority**: Critical (foundation for all other WPs)
**Dependencies**: None
**Success criteria**: `npm start` launches both backend and frontend dev servers; Regnology CSS loads

- [x] T001 Scaffold Angular 18 project (standalone, no SSR) (WP01)
- [x] T002 Scaffold Express backend with TypeScript (WP01)
- [x] T003 Configure npm workspaces and shared tsconfig (WP01)
- [x] T004 Copy/symlink regnology-web.css into Angular assets (WP01)

**Implementation sketch**:
1. `ng new pack-dashboard --standalone --ssr=false --style=scss` under `tools/`
2. Create `server/` with Express + ts-node-dev
3. Set up npm workspace root linking both
4. CSS resolution (C-007 fix): check for `regnology-docgen/design-system/dist/regnology-web.css` at the known sibling path; symlink it into `src/assets/css/` if present. Ship `src/assets/css/regnology-web.snapshot.css` as a committed fallback for environments where docops is not checked out. `angular.json` points to the symlink target with the snapshot as fallback.
5. Verify both servers start and CSS renders in a hello-world page

**Risks**: Angular CLI version mismatch with Node 24; mitigate by pinning CLI version.

**Doctrine**: `dependency-hygiene` — pin all package versions in package.json and requirements.txt from day one; run `npm audit` as part of the WP01 acceptance gate.

---

### WP02 — Backend Artifact API

**Priority**: Critical (data layer for frontend)
**Dependencies**: WP01
**Success criteria**: `GET /api/artifacts` returns all pack artifacts as JSON; `PUT` saves YAML

- [x] T005 Implement pack-scanner service (scan dirs, parse YAML) (WP02)
- [x] T006 Implement artifact routes (GET list, GET detail) (WP02)
- [x] T007 Implement PUT route for saving edited YAML (WP02)
- [x] T008 Implement DRG route (parse fragment.yaml) (WP02)

**Implementation sketch**:
1. pack-scanner reads all 8 subdirs under `PACK_ROOT`, parses each YAML as raw content + filePath
2. For canonical `id` and `title` extraction: call `validate_artifact.py --extract-meta` — the Python bridge already has the Pydantic models that know each kind's field names. Node scanner does not duplicate this per-kind knowledge.
3. GET routes return lists and details; PUT writes raw YAML to disk (only reached after in-memory validation succeeds — see WP05)
4. DRG route parses fragment.yaml nodes/edges into JSON
5. Coverage endpoint: load DRG edges, group by target node, return nodes with zero inbound edges of the queried relation

**Risks**: `validate_artifact.py` subprocess adds ~100ms per artifact for meta extraction. Mitigation: run extractions in parallel on startup, cache results. Alternatively, use a lightweight YAML key extraction without Pydantic for the list view and defer full validation to on-demand calls.

**Doctrine**: `input-validation-fail-fast` — malformed YAML must return a structured error (kind, filePath, parse error) and not crash the scanner; `black-box-integration-testing` — WP02 acceptance tests drive through `GET /api/artifacts` via HTTP; DIRECTIVE_031 — Pack Discovery module must not import from Review or Validation modules.

---

### WP03 — Python Validation Bridge

**Priority**: Critical (enables schema validation)
**Dependencies**: WP01
**Success criteria**: `POST /api/validate/directives/REGNOLOGY_BRANDING` returns valid:true

- [x] T009 Write validate_artifact.py Python bridge script (WP03)
- [x] T010 Implement validator service (subprocess invocation) (WP03)
- [x] T011 Implement validation routes (single + bulk) (WP03)

**Implementation sketch**:
1. Python script modes:
   - `--validate --kind <kind> --path <file>`: imports Pydantic model, validates, outputs `ValidationResult` JSON
   - `--extract-meta --kind <kind> --path <file>`: returns `{id, title}` using the Pydantic model's field definitions (single source of truth for per-kind field names; scanner delegates to this mode)
2. Node validator service: spawns `python3 scripts/validate_artifact.py` with args; caches result keyed by `(filePath, mtime)`; returns cached result immediately if mtime unchanged
3. Routes wire HTTP to service, return structured `ValidationResult`
4. `POST /api/validate-all`: spawn validations in parallel batches (e.g. 8 at a time), stream aggregate result; avoid blocking single request for >7 minutes at 87 artifacts × 5s ceiling

**Risks**: Python path resolution across environments; use SPEC_KITTY_SRC config.

**Doctrine**: `test-boundaries-by-responsibility` — test the Pydantic models real (no mocking spec-kitty); stub the filesystem for Node-side validator service unit tests; `secure-design-checklist` — apply before finalising file path handling in the bridge; check for path traversal via kind/id parameters before constructing file paths; `appsec-pipeline-setup` + APPSEC_COMPLIANCE — run SonarQube SAST on TypeScript output; include CycloneDX SBOM in WP03 acceptance gate.

---

### WP04 — Frontend Artifact Browser

**Priority**: High (core UI)
**Dependencies**: WP02
**Success criteria**: User can browse artifact list and view individual artifact YAML in the browser

- [x] T012 Build Angular layout shell (header, sidebar, routing) (WP04)
- [x] T013 Build artifact-list page component (WP04)
- [x] T014 Build artifact-detail page component (WP04)
- [x] T015 Build validation-badge component (WP04)

**Implementation sketch**:
1. Layout: `.rn-header` with logo, sidebar with kind navigation links
2. artifact-list: table using `.rn-table`, columns: id, title, validationStatus badge, reviewStatus badge; rows link to detail
3. artifact-detail: display raw YAML in `<pre>` (Monaco comes in WP05) + **related-artifacts panel**: call `GET /api/drg`, filter edges where source or target matches current artifact id, display linked nodes as a compact list with relation label. No extra API work — the DRG endpoint is already designed.
4. validation-badge: `unknown` (grey) / `valid` (green) / `invalid` (red) pill

**Parallel**: T012, T013, T014 can be developed in parallel (independent components).

**Doctrine**: `atomic-state-ownership` — editor focus state, selected artifact, and loaded pack list are distinct state scopes; do not lift editor state into a shared service prematurely; `acceptance-test-first` — write failing Angular component tests for artifact-list and artifact-detail before implementing them.

---

### WP05 — Live YAML Editor

**Priority**: High (enables editing)
**Dependencies**: WP04
**Success criteria**: User can edit YAML in Monaco, save triggers disk write and re-validation

- [x] T016 Integrate Monaco editor component (WP05)
- [x] T017 Wire editor save to backend PUT + re-validate (WP05)

**Implementation sketch**:
1. Install ngx-monaco-editor-v2, configure YAML language
2. Replace `<pre>` display in artifact-detail with Monaco editor
3. Save button sequence (C1 fix — validate before write):
   a. POST `/api/validate/:kind/:id` with current editor content (in-memory validation)
   b. If validation fails: display errors in panel, do NOT call PUT; file on disk is unchanged
   c. If validation passes: PUT `/api/artifacts/:kind/:id` to write to disk, update badge to `valid`

**Risks**: Monaco bundle size; lazy-load the editor module.

**Doctrine**: `input-validation-fail-fast` — the save flow must show validation errors inline before any write attempt; `atomic-state-ownership` — editor dirty state (unsaved changes) is component-local; do not propagate it to a shared service or route guard until an explicit save action is taken.

---

### WP06 — Review Workflow

**Priority**: High (core governance feature)
**Dependencies**: WP04
**Success criteria**: User can submit a review decision; JSON persists to `.reviews/`; list shows status

- [x] T018 Implement review-store service (read/write JSON) (WP06)
- [x] T019 Implement review routes (GET, POST) (WP06)
- [x] T020 Build review-panel component (comments, decision) (WP06)
- [x] T021 Add review status to artifact-list, wire end-to-end (WP06)
- [x] T022 Build dashboard overview page (review progress + validation counts per kind) (WP06)

**Implementation sketch**:
1. review-store: reads/creates `pack/.reviews/<kind>/<id>.review.json`; POST overwrites any existing file (last-write-wins; history is explicitly out of scope — see spec.md Review File Contract)
2. Routes:
   - GET returns current state (or 404 if no review exists)
   - POST writes new review; responds 201 with the written Review
   - Register `GET /api/reviews-summary` (literal) **before** `GET /api/reviews/:kind` in the Express router to avoid path collision; document this ordering constraint in a comment in `reviews.routes.ts`
3. Decision buttons on review-panel: show only `approve`, `reject`, `changes_requested` (SubmittableReviewStatus); the backend must also validate that the submitted status is not `pending` or `in_review` and return 422 if so
4. Wire status badges into artifact-list table

**Risks**: Route registration order is load-order-sensitive in Express. Mitigation: use a single Router instance for all review routes and register the literal path first — add a unit test verifying `/api/reviews-summary` resolves correctly (not matched as `:kind = "summary"`).

T022 uses `GET /api/reviews-summary` (note: renamed from `/summary`) and artifact count from `GET /api/artifacts`. Route at `/` (dashboard home).

**Doctrine**: `domain-event-capture` — review decisions (approve/reject/changes_requested) are domain events; the persisted JSON captures reviewer, timestamp, comments, and decision atomically; this structure supports a future append-log migration without breaking the current schema; `black-box-integration-testing` — WP06 acceptance tests drive through `POST /api/reviews/:kind/:id` and verify the JSON file is written to disk with the correct fields.

---

## Deferred / Post-MVP

These items are explicitly out of scope for WP01–WP06 but must not be silently dropped.
They correspond to the "Should" and "Want" tiers from the MoSCoW table in spec.md.

| Item | MoSCoW | Notes |
|------|--------|-------|
| Filesystem watcher (chokidar) for auto-refresh | Should | Refresh artifact list when `pack/` changes on disk |
| Editor gutter annotations (inline error markers) | Should | Show validation errors inline in Monaco |
| DRG graph visualization (Cytoscape.js) | Want | Click-through graph of DRG nodes/edges |
| Diff view for edited vs. original YAML | Could | Compare current editor state to HEAD |
| Batch review operations | Could | Approve/reject multiple artifacts at once |
| Review history (audit trail) | Could | Append-log of all review decisions per artifact |
