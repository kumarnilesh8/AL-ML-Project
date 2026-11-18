---
work_package_id: WP01
title: Pack Identity and Layer Metadata Normalization
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- C-001
- C-002
tracker_refs: []
planning_base_branch: beta
merge_target_branch: beta
branch_strategy: Planning artifacts for this mission were generated on beta. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into beta unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1
base_commit: 925fd19a8ec2368ab2ea809a77b866c76a108509
created_at: '2026-06-18T14:02:55.039879+00:00'
subtasks:
- T001
- T002
- T003
- T004
shell_pid: '331463'
agent: "claude:sonnet:reviewer-renata:reviewer"
authoritative_surface: pack/
execution_mode: code_change
owned_files:
- README.md
- pack/README.md
- pack/org-charter.yaml
- .kittify/metadata.yaml
---

## Objective

Normalize repository and pack identity so the PS departmental layer is explicitly
positioned on top of `regnology-all-company`, with a canonical slug of
`ps-agent-enabled-factory`.

## Branch Strategy

- **Planning/base branch**: `beta`
- **Merge target**: `beta`
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`.

## Context

- Spec anchors: FR-001..004, C-001, C-002.
- Plan anchors: IC-01 in `plan.md`.
- Upstream URL must remain:
  `https://bitbucket.regnology.net/projects/RFG/repos/skills/browse`.

---

### Subtask T001 — README and pack README identity updates

1. Update `README.md` and `pack/README.md` headings and intro identity wording.
2. Ensure both files reference the upstream all-company pack URL.
3. Keep terminology consistent: "Professional Services Departmental Agent Doctrine".

### Subtask T002 — Canonical slug migration in metadata

1. Set `org_name: ps-agent-enabled-factory` in `pack/org-charter.yaml`.
2. Align `.kittify/metadata.yaml` slug/identity fields accordingly.
3. Verify no active `ps-agent_enabled-factory` or `regnology-default` remains in WP-owned files.

### Subtask T003 — Layering semantics hardening

1. Keep `extends: regnology-all-company` and ensure comments describe additive,
   non-relaxing inheritance.
2. Ensure README/pack README wording matches charter semantics.

### Subtask T004 — Atomic metadata/docs consistency check

1. Run scoped grep on owned files for stale slug variants.
2. Resolve any mismatch before handoff.

## Definition of Done

- All four owned files are internally consistent on naming and slug.
- Upstream reference + `extends` semantics are explicit and non-ambiguous.
- No stale slug variants remain in owned files.
