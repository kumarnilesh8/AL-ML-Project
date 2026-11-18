# Implementation Plan: PS Departmental Rebrand + Extend All-Company Pack

**Branch**: `beta` | **Date**: 2026-06-18 | **Spec**: [spec.md](spec.md)  
**Mission**: `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1` (`01KVD1M1VW8WDSNN96HH098T0R`)

---

## Summary

Reposition this repository as the **Professional Services Departmental Agent Doctrine**
layer on top of the upstream **All-Company** layer (`regnology-all-company`, source:
`https://bitbucket.regnology.net/projects/RFG/repos/skills/browse`).

The implementation combines:

1. Human-facing rebrand updates in documentation and governance entry points.
2. Pack identity rename from `regnology-default` to `ps-agent-enabled-factory`.
3. Explicit `extends` layering against `regnology-all-company` in charter metadata.
4. Installer composition updates: upstream org-wide base pack first, PS layer second.
5. Operational cleanup: remove `ai-initiatives` path coupling.
6. Surface cleanup: untrack generated harness outputs (`.cursor/`, `.claude/`) while
   relocating any non-generated configuration to tracked source.
7. Bulk-edit safety classification captured in `occurrence_map.yaml` with explicit
   active-path rename overrides.
8. Surface-canon preservation inventory captured in `surface-preservation-inventory.yaml`
   and treated as a hard gate before untracking generated directories.

---

## Technical Context

**Language/Version**: Markdown + YAML artifacts managed by `spec-kitty-cli` 3.2.1  
**Primary Dependencies**: `spec-kitty` (`doctrine pack validate`, mission lifecycle commands), git, existing installer scripts under `dist/scripts/`  
**Storage**: File-based repository artifacts only (`pack/`, `docs/`, `kitty-specs/`, `dist/scripts/`, root dotfiles)  
**Testing**: `spec-kitty doctrine pack validate pack/`; targeted grep checks for slug/reference cleanup; script syntax checks (`bash -n`, PowerShell parser)  
**Target Platform**: Repo-level governance assets consumed on Linux/macOS/Windows developer machines  
**Project Type**: Doctrine-pack maintenance + distribution plumbing update (no runtime service code)  
**Performance Goals**: No regression in install/bootstrap path; validation run remains within normal local developer cycle (<1 min)  
**Constraints**: Upstream identifier fixed to `regnology-all-company`; normalized slug `ps-agent-enabled-factory`; no loss of hand-authored config while untracking generated surfaces; no secret material in pack  
**Scale/Scope**: Cross-cutting rename/reference migration across docs, metadata, installer scripts, and tracked surfaces (`.cursor` currently 116 tracked files, `.claude` currently 1 tracked file + local settings)

---

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Charter Policy | Plan Application |
|---|---|
| Shippable doctrine artifact -> `pack/` | Canonical governance remains in `pack/`; generated harness exports become local/regenerated artifacts |
| Human-readable docs -> `docs/` | Engineering note and migration rationale stay in mission/docs, not in generated surfaces |
| Mission artifacts -> `kitty-specs/` | All planning outputs in this mission directory |
| Quality gates | Mandatory `spec-kitty doctrine pack validate pack/` after metadata/script edits |
| Risk boundary | No secrets/PII; no external service dependency introduced |

**Result (pre-design): PASS**  
No charter violations required to execute this plan.

---

## Bulk-Edit Classification

This mission is explicitly marked as a bulk edit (`change_mode: bulk_edit`) because
it changes repeated identifiers and references across many files.

Primary rename target in occurrence map:

- `regnology-default` -> `ps-agent-enabled-factory`

Secondary cleanup operations (non-targeted mechanical operations) are handled by
implementation concerns and file-level review, with `occurrence_map.yaml` as the
diff-compliance contract for the target rename.

---

## Project Structure

### Documentation (this mission)

```
kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── occurrence_map.yaml
├── surface-preservation-inventory.yaml
├── contracts/
│   └── pack-layering-and-distribution.contract.yaml
└── tasks.md                     # Created later by /spec-kitty.tasks
```

### Affected repository surfaces

```
pack/
├── org-charter.yaml             # org_name + extends + layering comment
└── README.md

README.md
CHANGELOG.md
AGENTS.md
CLAUDE.md

dist/scripts/
├── install-regnology-stack.sh
└── install-regnology-stack.ps1

.gitignore
.cursor/                          # generated surface, currently partially tracked
.claude/                          # generated surface, currently minimally tracked
```

**Structure Decision**: single-repository doctrine-pack maintenance. No changes to
`tools/` runtime code or external repositories.

---

## Implementation Concern Map

### IC-01 — Identity and Layer Metadata

- **Purpose**: Rebrand and normalize pack identity while preserving layering semantics.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-011, FR-012
- **Affected surfaces**: `README.md`, `pack/README.md`, `CHANGELOG.md`, `pack/org-charter.yaml`, `.kittify/metadata.yaml`
- **Sequencing/depends-on**: none
- **Risks**: Partial rename leaves mixed slug references and broken fetch paths.

### IC-02 — Installer Composition to Upstream Base Layer

- **Purpose**: Ensure installers pull `regnology-all-company` as base layer before PS layer.
- **Relevant requirements**: FR-005, FR-007, NFR-001
- **Affected surfaces**: `dist/scripts/install-regnology-stack.sh`, `dist/scripts/install-regnology-stack.ps1`, README install flow sections
- **Sequencing/depends-on**: IC-01
- **Risks**: Placeholder coordinates, shell/PowerShell divergence, or ordering bugs can produce incorrect layered setup.

### IC-03 — Operational Reference Cleanup

- **Purpose**: Remove `ai-initiatives` path coupling from operational/governance files.
- **Relevant requirements**: FR-006
- **Affected surfaces**: `AGENTS.md` (and any other operational files discovered by grep)
- **Sequencing/depends-on**: none
- **Risks**: Accidentally editing historical records that should remain immutable.

### IC-04 — Generated Surface Untracking + Canon Preservation

- **Purpose**: Stop shipping generated `.cursor`/`.claude` outputs while preserving any hand-authored config.
- **Relevant requirements**: FR-008, FR-009
- **Affected surfaces**: `.cursor/`, `.claude/`, `.gitignore`, `surface-preservation-inventory.yaml`, replacement tracked source locations for non-generated config
- **Sequencing/depends-on**: IC-01 (slug paths may appear in generated outputs)
- **Risks**: Data loss if hand-authored files are removed before relocation.

### IC-05 — Validation and Change Safety

- **Purpose**: Prove consistency with charter and pack validation gates.
- **Relevant requirements**: FR-010, NFR-002, NFR-003, NFR-004
- **Affected surfaces**: mission evidence files, validation command outputs, final changelog
- **Sequencing/depends-on**: IC-01, IC-02, IC-03, IC-04
- **Risks**: Hidden stale references or schema drift if validation is skipped.

---

## Complexity Tracking

No charter exceptions required.

---

## Phase 0: Research

See [research.md](research.md):

- upstream pack identity confirmation (`regnology-all-company`)
- slug normalization decision (`ps-agent-enabled-factory`)
- tracked-vs-generated inventory for `.cursor` / `.claude`
- installer layering implications
- bulk-edit guardrail setup requirements

---

## Phase 1: Design

See:

- [data-model.md](data-model.md)
- [contracts/pack-layering-and-distribution.contract.yaml](contracts/pack-layering-and-distribution.contract.yaml)
- [quickstart.md](quickstart.md)
- [occurrence_map.yaml](occurrence_map.yaml)
- [surface-preservation-inventory.yaml](surface-preservation-inventory.yaml)

Design outcome:

- deterministic sequence from metadata rename -> installer layering -> operational cleanup
  -> generated surface cleanup -> validation.

---

## Post-Design Charter Re-check

PASS.  
All planned artifacts remain in charter-approved directories, and quality gate
execution is explicitly part of IC-05.

---

## Verification Checklist (for implementation phase)

1. `spec-kitty doctrine pack validate pack/` returns 0 errors.
2. `rg -n "regnology-default|ps-agent_enabled-factory"` across repo returns only
   intentionally preserved historical references.
3. Installer scripts reference `regnology-all-company` base layer + `ps-agent-enabled-factory` overlay in explicit order.
4. `.cursor/` and `.claude/` are no longer shipped as generated outputs; preserved
   hand-authored config is relocated and tracked elsewhere.
5. `surface-preservation-inventory.yaml` verification checklist is complete before
   untracking generated surfaces.
6. Shell and PowerShell installer syntax/parity checks pass.
7. `extends` layering semantics are evidenced via context resolution checks, not only metadata key presence.
8. `rg -n "ai-initiatives"` over operational/governance paths returns no active path-coupling hits.
