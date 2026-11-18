---
work_package_id: WP02
title: Installer Layering Refactor and Parity
dependencies:
- WP01
requirement_refs:
- FR-005
- FR-007
- NFR-001
- NFR-004
tracker_refs: []
planning_base_branch: beta
merge_target_branch: beta
branch_strategy: Planning artifacts for this mission were generated on beta. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into beta unless the human explicitly redirects the landing branch.
subtasks:
- T005
- T006
- T007
- T008
shell_pid: '344893'
agent: "claude:sonnet:reviewer-renata:reviewer"
authoritative_surface: dist/scripts/
execution_mode: code_change
owned_files:
- dist/scripts/install-regnology-stack.sh
- dist/scripts/install-regnology-stack.ps1
---

## Objective

Refactor installers to enforce deterministic layered installation:
`regnology-all-company` base first, then `ps-agent-enabled-factory` overlay, with
shell/PowerShell parity.

## Branch Strategy

- **Planning/base branch**: `beta`
- **Merge target**: `beta`
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP02 --agent <your-name>`.

## Context

- Spec anchors: FR-005, FR-007.
- Contract anchors: AC-003, NFR-004 in
  `contracts/pack-layering-and-distribution.contract.yaml`.
- Keep failure behavior explicit when placeholder pack coordinates are unresolved.

---

### Subtask T005 — Shell installer layering flow

1. Add/normalize base and overlay pack coordinates in
   `install-regnology-stack.sh`.
2. Enforce fetch/extract/apply order: base pack then overlay pack.
3. Keep output logs explicit enough to verify order in dry-run output.

### Subtask T006 — PowerShell installer parity

1. Mirror base/overlay coordinate model in `install-regnology-stack.ps1`.
2. Mirror shell ordering and failure handling semantics.
3. Ensure equivalent user-visible messaging for both scripts.

### Subtask T007 — Syntax and parity checks

1. Confirm shell script passes `bash -n`.
2. Confirm PowerShell script parser check passes.
3. Add/update inline comments for parity-critical sections.

### Subtask T008 — Ordering/failure evidence capture

1. Run dry-run or non-destructive mode commands to show base->overlay order.
2. Capture evidence lines for mission validation.

## Definition of Done

- Both installers encode identical layering intent and order.
- Both scripts pass syntax/parser checks.
- Dry-run evidence demonstrates base then overlay processing.
