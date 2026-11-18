---
work_package_id: WP03
title: Python Validation Bridge
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-007
- FR-012
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
agent: "claude:sonnet:reviewer-rita:reviewer"
shell_pid: "686932"
history:
- agent: general-purpose
  ts_utc: '2026-05-20T14:38:12Z'
  action: created
authoritative_surface: tools/pack-dashboard/scripts/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/scripts/validate_artifact.py
- tools/pack-dashboard/server/src/services/validator.service.ts
- tools/pack-dashboard/server/src/routes/validation.routes.ts
tags: []
---

# WP03 — Python Validation Bridge

## Objective

Create a Python script that validates a single YAML artifact against spec-kitty Pydantic models,
and a Node.js service that invokes it via subprocess, exposed through Express routes.

## Context

- Spec-kitty Pydantic models are the ground truth for schema validation
- The fork is at `/home/stijnd/Documents/code/forks/spec-kitty/`
- Models are imported as: `from doctrine.directives.models import Directive`
- The Python script must be invocable without installing the dashboard (it uses the existing Python env)
- SPEC_KITTY_SRC env var points to the spec-kitty source root

### Model Import Map

| Kind | Model | Import Path |
|------|-------|-------------|
| directives | Directive | `doctrine.directives.models` |
| tactics | Tactic | `doctrine.tactics.models` |
| styleguides | Styleguide | `doctrine.styleguides.models` |
| toolguides | Toolguide | `doctrine.toolguides.models` |
| paradigms | Paradigm | `doctrine.paradigms.models` |
| procedures | Procedure | `doctrine.procedures.models` |
| agent_profiles | AgentProfile | `doctrine.agent_profiles.profile` |
| mission_step_contracts | MissionStepContract | `doctrine.mission_step_contracts.models` ⚠️ verify path exists in fork before implementing |

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target branch: `overhaul/migrate_to_kitty`
- Execution worktrees are allocated per computed lane from `lanes.json`.

## Subtasks

### T009 — Write validate_artifact.py

`tools/pack-dashboard/scripts/validate_artifact.py`:
- CLI args: `--kind <kind> --path <file-path>`
- Adds SPEC_KITTY_SRC to sys.path
- Loads YAML from the path
- Maps kind → Pydantic model class
- Calls `Model(**data)` to validate
- On success: outputs JSON `{"valid": true, "errors": [], ...}`
- On ValidationError: outputs JSON with `valid: false` and structured error list
- Exit code 0 always (errors are in the JSON output, not in exit codes)

### T010 — Implement validator service

`tools/pack-dashboard/server/src/services/validator.service.ts`:
- Export `validateArtifact(kind: string, filePath: string): Promise<ValidationResult>`
- Spawns `python3 scripts/validate_artifact.py --kind <kind> --path <path>`
- Parses JSON stdout
- Handles subprocess errors (Python not found, script crash) as validation failures
- Configurable Python path via env var

### T011 — Implement validation routes

`tools/pack-dashboard/server/src/routes/validation.routes.ts`:
- `POST /api/validate/:kind/:id` — validates single artifact, returns result
- `POST /api/validate-all` — iterates all artifacts from scanner, validates each
- Returns structured ValidationResult per the OpenAPI contract

## Definition of Done

- [ ] `python3 scripts/validate_artifact.py --kind directives --path pack/directives/041-regnology-branding.directive.yaml` outputs valid JSON
- [ ] `POST /api/validate/directives/REGNOLOGY_BRANDING` returns `{ valid: true }`
- [ ] Invalid YAML (e.g., missing required field) returns `{ valid: false, errors: [...] }`
- [ ] `POST /api/validate-all` returns aggregate results for all artifacts
- [ ] Script handles gracefully if SPEC_KITTY_SRC is not set (clear error message)
- [ ] Single-artifact validation completes within 5s (NFR-002): verify by timing `time python3 scripts/validate_artifact.py --kind directives --path pack/directives/041-regnology-branding.directive.yaml` on the development machine

## Risks

- Python environment differences between dev machines — document in README
- Pydantic validation errors have complex nested structures — flatten to field + message
- `doctrine.mission_step_contracts.models` import path is unverified in the fork — confirm with `python3 -c "from doctrine.mission_step_contracts.models import MissionStepContract"` before writing the bridge for that kind; fall back to a no-op passthrough if the module is absent

## Activity Log

- 2026-05-20T18:14:58Z – claude:sonnet:implementer-ivan:implementer – shell_pid=679016 – Started implementation via action command
- 2026-05-20T18:22:38Z – claude:sonnet:implementer-ivan:implementer – shell_pid=679016 – Ready for review: Python bridge tested (live directive + agent_profile validated ok), mtime cache, temp-file content support, batched validate-all, clean TS typecheck
- 2026-05-20T18:23:03Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=686932 – Started review via action command
- 2026-05-20T18:24:27Z – claude:sonnet:reviewer-rita:reviewer – shell_pid=686932 – Review passed: Python bridge handles all 8 kinds, exit-0 contract, mtime cache, no-reject Promise, validate-all batching, path traversal safe via findArtifact scan, TS compiles clean
