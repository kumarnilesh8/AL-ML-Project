---
work_package_id: WP07
title: MANIFEST refresh & validation gate (terminal)
dependencies:
- WP01
- WP02
- WP03
- WP04
- WP05
- WP06
requirement_refs:
- FR-007
- FR-012
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
subtasks:
- T032
- T033
- T034
- T035
- T036
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/META/MANIFEST.yml
create_intent: []
execution_mode: code_change
owned_files:
- pack/META/MANIFEST.yml
tags: []
---

# WP07 — MANIFEST refresh & validation gate (terminal)

## Objective

After **all** other WPs have merged and the pack files have settled, regenerate
`pack/META/MANIFEST.yml` and run the full acceptance harness green. This is the terminal gate.

## Context

MANIFEST is currently stale: it omits `gemini-bot-georgia`, `minutes-maker-mahad`, and
`powershell-peter` (11 manifest profiles vs 14 on disk). It must be refreshed **last**, because
nearly every WP changes a hashed file. `pack validate` reported **150 errors** at mission start;
the goal is **0**.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. Depends on
WP01–WP06 (all). Implement with: `spec-kitty agent action implement WP07 --agent <name>`
(after all dependencies merge).

## Subtasks

### T032 — Regenerate MANIFEST
- Regenerate `pack/META/MANIFEST.yml` via the supported tool (research R4 — confirm the exact
  command, e.g. the pack assemble/validate path; do **not** hand-edit hashes).

### T033 — MANIFEST machine-diff
```bash
comm -23 \
  <(cd pack && find . -type f \( -name '*.yaml' -o -name '*.md' \) | sort) \
  <(rg -o "^\s*\./[^ ]+" pack/META/MANIFEST.yml | sed 's/^[[:space:]]*//' | sort)
```
- Expect empty output (0 unregistered files), including `gemini-bot-georgia`,
  `minutes-maker-mahad`, `powershell-peter`.

### T034 — Pack validation
- `spec-kitty doctrine pack validate pack/` → **0 errors** (down from 150).

### T035 — Full quickstart harness
- Run every step in [quickstart.md](../quickstart.md) (SC-001..008). All greps must hit their
  stated expected counts. Confirm FR-012 surfaces still present in `docs/SURFACES.md` and
  `.kittify/charter/charter.md` (validation-only — no edits).

### T036 — Graph freshness
- `python3 tools/compile-drg.py && git diff --exit-code pack/drg/ps-agent-enabled-factory.graph.yaml`
  → no diff (the committed graph from WP02 is fresh against the settled fragment).

## Definition of Done
- MANIFEST machine-diff empty; `pack validate` 0 errors; quickstart SC-001..008 all pass; graph
  deterministic/fresh. Regnology header preserved on MANIFEST. Only `pack/META/MANIFEST.yml` edited.

## Reviewer guidance
- This WP must run **after** all others; if any later edit lands, MANIFEST must be regenerated again.
- Reject hand-edited hashes — require the supported regeneration tool.

## Risks
- If an upstream-only kind-prefix issue remains from WP02, `pack validate` may still flag it;
  escalate per Directive 044 rather than masking it in MANIFEST.
