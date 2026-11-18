---
work_package_id: WP03
title: Operational References, Changelog, and Migration Note
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-011
- FR-012
- NFR-002
tracker_refs: []
planning_base_branch: beta
merge_target_branch: beta
branch_strategy: Planning artifacts for this mission were generated on beta. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into beta unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
shell_pid: '357466'
agent: "claude:sonnet:reviewer-renata:reviewer"
authoritative_surface: AGENTS.md
execution_mode: code_change
owned_files:
- AGENTS.md
- CLAUDE.md
- CHANGELOG.md
- docs/HOW_TO_USE.md
---

## Objective

Remove active `ai-initiatives` path coupling from operational docs and complete
traceability notes for the slug migration.

## Branch Strategy

- **Planning/base branch**: `beta`
- **Merge target**: `beta`
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP03 --agent <your-name>`.

## Context

- Spec anchors: FR-006, FR-011, FR-012.
- Keep historical engineering notes untouched unless explicitly allowed.
- Migration note must clearly distinguish active-path updates vs historical references.

---

### Subtask T009 — Operational reference cleanup

1. Remove/replace active `ai-initiatives` path references from `AGENTS.md` and
   `CLAUDE.md`.
2. Preserve intent while using neutral/local paths.

### Subtask T010 — Changelog updates

1. Add/refresh unreleased section entries for:
   - pack slug normalization
   - upstream layering semantics
   - installer layering/parity updates
   - generated surface cleanup policy

### Subtask T011 — Migration note

1. Add explicit note in `docs/HOW_TO_USE.md` for
   `regnology-default` -> `ps-agent-enabled-factory`.
2. Include operational guidance for consumers and artifact path implications.

## Definition of Done

- Operational files are free of active `ai-initiatives` coupling.
- Changelog and migration guidance are present and accurate.
- Historical records are not modified unintentionally.
