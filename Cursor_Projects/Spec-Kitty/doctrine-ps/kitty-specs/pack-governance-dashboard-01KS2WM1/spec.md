# Pack Governance Dashboard

## Overview

A local Angular 18 + Express.js webapp for inspecting, editing, reviewing, and validating
spec-kitty doctrine pack artifacts. The tool reads YAML artifacts from the `pack/` directory,
renders them in a branded web UI, supports live editing with schema validation, and implements
a review-and-approve/reject/changes_requested workflow. Review decisions are persisted to disk
as structured JSON files consumable by agents for remediation.

## Actors

| Actor | Role |
|-------|------|
| Human reviewer | Inspects artifacts, edits YAML, submits review decisions |
| Remediation agent | Reads review files from disk, applies requested changes |
| Pack maintainer | Monitors validation status and review progress |

## User Scenarios

### Scenario 1: Browse and inspect a pack artifact

**Given** the dashboard is running and the pack directory contains artifacts  
**When** the reviewer navigates to a specific artifact kind (e.g. directives)  
**Then** a table of artifacts is displayed with id, title, validation status, and review state  
**When** the reviewer clicks an artifact row  
**Then** the artifact detail view shows the parsed YAML with syntax highlighting  

### Scenario 2: Edit and validate an artifact

**Given** the reviewer is viewing an artifact detail page  
**When** they edit the YAML content in the editor  
**And** click "Save"  
**Then** schema validation runs **in-memory first** against the edited content  
**If** validation **passes**: the file is written to disk and the validation badge updates to `valid`  
**If** validation **fails**: errors are displayed inline and the file on disk is **not** written  
**And** the validation result (pass/fail with field-level errors) is displayed  

### Scenario 3: Submit a review decision

**Given** the reviewer is viewing an artifact detail page  
**When** they add one or more line-level comments with severity  
**And** select a decision (approve / reject / changes_requested)  
**And** provide a summary  
**Then** a review JSON file is written to `pack/.reviews/<kind>/<id>.review.json`  
**And** the artifact list reflects the updated review status  

### Scenario 4: Agent picks up review for remediation

**Given** review files exist with `"status": "changes_requested"`  
**When** a remediation agent scans `pack/.reviews/`  
**Then** it can parse each JSON file to get the artifact path, comments, and summary  
**And** apply fixes to the referenced YAML file  

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | System reads all YAML artifacts from `pack/` subdirectories (8 kinds) | proposed |
| FR-002 | System parses YAML and presents artifacts in a browsable list per kind | proposed |
| FR-003 | System displays artifact detail with full YAML content, syntax highlighted | proposed |
| FR-004 | System provides a Monaco-based YAML editor for live artifact editing | proposed |
| FR-005 | On save, system validates edited YAML **in-memory first**; if validation passes the file is written to disk and the result displayed; if validation fails the error is shown and the file is **not** written. This prevents corruption of committed source files. | proposed |
| FR-006 | System validates artifacts against spec-kitty Pydantic schemas via Python bridge; validation can also be triggered independently without saving | proposed |
| FR-007 | System displays validation results (pass/fail, error messages with field paths) | proposed |
| FR-008 | System supports reviewer-selectable decisions: approve, reject, changes_requested. System manages pending and in_review as internal states (not selectable by the reviewer). | proposed |
| FR-009 | System supports line-level comments with severity (must-fix, should-fix, nit) | proposed |
| FR-010 | System persists review decisions as JSON at `pack/.reviews/<kind>/<id>.review.json` | proposed |
| FR-011 | System displays aggregate review progress (count by status per kind) | proposed |
| FR-012 | System provides a bulk "validate all" operation | proposed |
| FR-013 | Review JSON files follow a stable schema consumable by agents. Agents resolve the artifact file path from `(kind, id)` at runtime — the review file does not embed an `artifact_path` field, which would become stale on any file rename. | proposed |
| FR-014 | System exposes a DRG coverage query returning artifact nodes that have no inbound edges of a given relation type (e.g. tactics with no `suggests` edge from any agent). Used to identify orphaned or unlinked artifacts during migration assessment. | proposed |
| FR-015 | System reads `pack/templates/` and lists template categories (subdirectories) as browsable items under the **Shared → Templates** navigation group | proposed |
| FR-016 | For a selected template category, system lists all files in that subdirectory (recursive), showing filename, relative path within `pack/templates/`, file size, and last-modified timestamp | proposed |
| FR-017 | For `.md` / `.markdown` files, system renders content as HTML using Markdown rendering | proposed |
| FR-018 | For `.yaml` / `.yml` and `.json` files, system displays content with syntax highlighting using the existing code-view component | proposed |
| FR-019 | For `.txt` and other recognised plain-text files (e.g. `.sh`, `.env.example`, `.gitignore`), system displays raw content in a monospace block | proposed |
| FR-020 | For unsupported file types, system displays: (1) a banner "File type `<ext>` does not have display support currently", (2) file metadata (filename, size, relative location, last-modified), and (3) a `file://` link to the absolute local filesystem path | proposed |
| FR-021 | Template files are never schema-validated; the validation badge renders as `not validated` for all template entries | proposed |

## Non-Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-001 | Dashboard renders within 2s of navigation for up to 100 artifacts | proposed |
| NFR-002 | Validation of a single artifact completes within 5s (Python subprocess) | proposed |
| NFR-003 | UI uses Regnology design system (regnology-web.css from regnology-docgen): all page containers, tables, buttons, and badges use `.rn-*` CSS class names; no ad-hoc inline styles | proposed |
| NFR-004 | Application runs locally without external network dependencies | proposed |
| NFR-005 | Backend requires only Node.js 20+ and Python 3.11+ (both already available) | proposed |

## Constraints

| ID | Constraint | Status |
|----|------------|--------|
| C-001 | Project lives at `tools/pack-dashboard/` within this repository | proposed |
| C-002 | Schema validation uses spec-kitty Pydantic models via subprocess (no JSON Schema export) | proposed |
| C-003 | Review files must be human-readable JSON (not binary, not database) | proposed |
| C-004 | No external services or databases — filesystem is the only persistence layer | proposed |
| C-005 | Frontend uses Angular 18+ with standalone components | proposed |
| C-006 | Backend uses Express.js with TypeScript | proposed |
| C-007 | Design system CSS is consumed from regnology-docgen, not duplicated; a bundled CSS snapshot (`regnology-web.snapshot.css`) serves as fallback when docops is not checked out | proposed |
| C-008 | Both backend (TypeScript) and frontend must pass `tsc --noEmit` and their respective test suites before merge — per DIRECTIVE_030 (Test and Typecheck Quality Gate) | proposed |
| C-009 | Failing tests must exist before implementation code for every WP feature — per DIRECTIVE_034 (Test-First Development) and the `acceptance-test-first` tactic | proposed |

## Governance and Doctrine References

The following shipped spec-kitty and Regnology pack artifacts govern implementation decisions for this mission. Implementers should load these before authoring the relevant WP.

| WP | Artifact | Kind | Governing constraint |
|----|----------|------|----------------------|
| WP02, WP03 | `input-validation-fail-fast` | tactic | Reject invalid YAML with structured errors before any persistence; do not silently swallow parse failures |
| WP02, WP03, WP06 | `black-box-integration-testing` | tactic | Primary test surface is HTTP endpoints, not internal services; drive tests through the API contract |
| WP03 | `test-boundaries-by-responsibility` | tactic | Test the Pydantic validation real (no mocks); stub the filesystem for unit tests of the Node validator service |
| ALL | `tdd-red-green-refactor` | tactic | Standard implementation cycle for all WPs |
| ALL | `acceptance-test-first` | tactic | Define acceptance criteria as failing tests before writing handlers |
| WP04, WP05 | `atomic-state-ownership` | tactic | Angular component state (editor focus, form validity) must not prematurely lift into shared application state |
| WP06 | `domain-event-capture` | tactic | Review decisions (approve/reject/changes_requested) are domain events — capture them with the timestamp, reviewer, and full comment set; enables future audit trail without breaking the schema |
| WP02, WP06 | DIRECTIVE_031 `context-aware-design` | directive | Three bounded contexts: Pack Discovery, Validation, Review Workflow — named consistently across modules, API routes, and Angular services |
| WP02 | DIRECTIVE_024 `locality-of-change` | directive | Changes to pack scanning must not touch review or validation modules, and vice versa |
| WP03 | `secure-design-checklist` | tactic | Apply before finalising the Python bridge and file-write path; check for path traversal and injection at the kind/id route parameters |
| WP03, WP06 | `appsec-pipeline-setup` + APPSEC_COMPLIANCE | tactic + directive | Run SonarQube SAST on the TypeScript codebase; run CycloneDX SBOM generation on package.json |

## Key Entities

| Entity | Description |
|--------|-------------|
| Artifact | A YAML file in `pack/` conforming to a spec-kitty schema (directive, tactic, agent_profile, etc.) |
| ArtifactKind | One of: directives, tactics, styleguides, toolguides, paradigms, procedures, agent_profiles, mission_step_contracts |
| Review | A JSON document recording a human's decision about an artifact's quality |
| ReviewStatus | Read model: pending, in_review, approved, rejected, changes_requested. Only approved / rejected / changes_requested are submittable by the reviewer; pending and in_review are internal states managed by the system. |
| Comment | A line-level annotation within a review, with severity |
| ValidationResult | Pass/fail outcome from Pydantic schema validation, with error details |

## Success Criteria

1. A reviewer can browse all pack artifacts, edit them inline, and save changes to disk
2. Schema validation runs on demand and shows actionable error messages
3. Review decisions persist as JSON files that a separate agent can parse and act on
4. The UI is visually consistent with Regnology brand (uses design system CSS)
5. The tool requires minimal configuration: `npm start` works out of the box when `SPEC_KITTY_SRC` is set (or defaults to the sibling fork path); all other paths auto-resolve from repo structure and are documented in `tools/pack-dashboard/README.md`

## Architecture

```
tools/pack-dashboard/
  server/                  # Express.js backend (TypeScript)
    src/
      index.ts             # Entry point, CORS, static serving
      routes/              # REST endpoints
      services/            # Filesystem, validation, review store
      models/              # TypeScript interfaces
  src/                     # Angular 18 frontend
    app/
      layout/              # Header, sidebar (Regnology branded)
      pages/               # Dashboard, artifact-list, artifact-detail
      components/          # yaml-editor, review-panel, validation-badge
      services/            # HTTP clients
      models/              # TypeScript interfaces
  scripts/
    validate_artifact.py   # Python bridge to spec-kitty Pydantic models
```

## API Surface

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/artifacts` | List all artifacts grouped by kind with review status |
| GET | `/api/artifacts/:kind` | List artifacts of a specific kind |
| GET | `/api/artifacts/:kind/:id` | Get single artifact (parsed YAML + metadata) |
| PUT | `/api/artifacts/:kind/:id` | Save edited YAML content to disk |
| POST | `/api/validate/:kind/:id` | Validate single artifact, return errors |
| POST | `/api/validate-all` | Run full validation suite |
| GET | `/api/reviews/:kind/:id` | Get review state for an artifact |
| POST | `/api/reviews/:kind/:id` | Submit review decision |
| GET | `/api/reviews-summary` | Aggregate review progress (note: literal path; avoids Express routing collision with `/api/reviews/:kind`) |
| GET | `/api/drg/coverage` | DRG coverage query — returns nodes with no inbound edges per relation type |

## Review File Contract

> **Path convention**: Review files do **not** embed `artifact_path`. Agents resolve the artifact file path from `(artifact_kind, artifact_id)` at runtime using the same logic as the pack-scanner, ensuring references remain valid across file renames.
> **Reviewer field**: `reviewer` stores the OS username (or `$USER`) — not a display name or email.
> **Overwrite semantics**: `POST /api/reviews/:kind/:id` replaces any existing review for that artifact (last write wins). Review history is out of scope for the current version; this is an explicit decision. If history is required in a future version, storage must migrate from single-file overwrite to an append-log pattern — this constraint is documented here to prevent a silent breaking change.

```json
{
  "artifact_id": "REGNOLOGY_BRANDING",
  "artifact_kind": "directives",
  "status": "changes_requested",
  "reviewed_at": "2026-05-20T15:30:00Z",
  "reviewer": "stijnd",
  "comments": [
    {
      "line": 12,
      "text": "Intent statement is too vague",
      "severity": "must-fix"
    }
  ],
  "summary": "Sharpen intent and add the header template reference"
}
```

## MoSCoW Priority

**Must:** FR-001 through FR-014, NFR-001 through NFR-005, C-001 through C-007  
**Should:** Dashboard overview with counts, filesystem watcher for auto-refresh, editor gutter annotations, related-artifacts panel on artifact-detail (DRG-driven, no extra API work)  
**Could:** Diff view, batch review operations  
**Want:** DRG graph visualization (Cytoscape.js), click-through graph navigation, graph filtering  
**Out of scope (documented decision):** Review history / audit trail — storage is single-file overwrite; migrating to append-log requires a future breaking schema change. See Review File Contract.  

## Assumptions

1. The Python bridge resolves `SPEC_KITTY_SRC` from the `SPEC_KITTY_SRC` environment variable; if unset it falls back to `../../../../forks/spec-kitty/src` relative to the script location (matching the known fork path on the primary dev machine)
2. Node.js 20+ and Angular CLI are available on the development machine
3. The `regnology-docgen/design-system/dist/regnology-web.css` file is available at build time
4. The pack directory contains well-formed YAML (graceful error handling for malformed files)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Python subprocess adds latency to validation | Medium | Low | Cache results, validate on-demand not on-load |
| Monaco editor bundle size bloats the app | Low | Low | Lazy-load editor component |
| Design system CSS may have breaking changes | Low | Medium | Pin to a specific dist snapshot or symlink |
| Spec-kitty model changes break validation | Medium | Medium | Test suite already catches this; rerun after upstream updates |
