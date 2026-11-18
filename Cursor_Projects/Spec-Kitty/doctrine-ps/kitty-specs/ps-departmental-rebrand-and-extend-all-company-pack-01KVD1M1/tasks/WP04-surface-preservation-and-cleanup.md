---
work_package_id: WP04
title: Harness Surface Canon Preservation and Cleanup
dependencies:
- WP01
- WP03
requirement_refs:
- FR-008
- FR-009
- NFR-002
tracker_refs: []
planning_base_branch: beta
merge_target_branch: beta
branch_strategy: Planning artifacts for this mission were generated on beta. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into beta unless the human explicitly redirects the landing branch.
subtasks:
- T012
- T013
- T014
- T015
shell_pid: '415811'
agent: "claude:sonnet:reviewer-renata:reviewer"
authoritative_surface: .cursor/
execution_mode: code_change
owned_files:
- .gitignore
- .cursor/**
- .claude/**
- tools/surfaces/**
---

## Objective

Preserve non-generated harness canon, then remove generated `.cursor` / `.claude`
artifacts from versioned distribution safely.

## Branch Strategy

- **Planning/base branch**: `beta`
- **Merge target**: `beta`
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP04 --agent <your-name>`.

## Context

- Spec anchors: FR-008, FR-009.
- Inventory authority:
  `kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1/surface-preservation-inventory.yaml`.
- Do not untrack generated directories until authored candidates are relocated and verified.

---

### Subtask T012 — Prepare tracked destination structure

1. Create required canonical destination paths under `tools/surfaces/`.
2. Ensure directory naming aligns with inventory targets.

### Subtask T013 — Relocate authored candidates

1. Move/copy inventoried authored candidates from `.cursor`/`.claude` into tracked
   destination files.
2. Keep functional parity of hook/config content.

### Subtask T014 — Untrack generated directories post-relocation

1. Update `.gitignore` if needed for generated surface policy.
2. Remove generated outputs from git index only after relocation checks pass.

### Subtask T015 — Surface-preservation readiness gate verification

1. Mark inventory verification checks complete with evidence references.
2. Mirror gate completion status in tracked documentation evidence under `docs/engineering_notes/`.

## Definition of Done

- `surface-preservation-inventory.yaml` readiness gate is fully satisfied.
- Authored files are preserved in tracked canonical locations.
- Generated `.cursor`/`.claude` artifacts are no longer shipped from git.
