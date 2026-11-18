---
work_package_id: WP04
title: 'De-duplication: single source of truth (non-profile)'
dependencies: []
requirement_refs:
- FR-010
- FR-011
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-pack-remediation-georgia-templates-01KWCBN5
base_commit: 48a751c3553a8462cd045f63c7a62f89e1775800
created_at: '2026-06-30T17:48:26.937584+00:00'
subtasks:
- T015
- T016
- T017
- T018
- T019
- T020
shell_pid: "146094"
agent: "cursor:sonnet-4.6:reviewer-renata:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/toolguides/pester.toolguide.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/toolguides/pester.toolguide.yaml
- pack/procedures/powershell-pester-workflow.procedure.yaml
- pack/toolguides/sqlx-mcp.toolguide.yaml
- pack/tactics/sqlx-explanation.tactic.yaml
- pack/tactics/sqlx-generation.tactic.yaml
- pack/tactics/sqlx-optimization.tactic.yaml
- pack/tactics/sqlx-pseudo-code-to-spec.tactic.yaml
- pack/tactics/sqlx-testing.tactic.yaml
- pack/tactics/sqlx-validation.tactic.yaml
- pack/procedures/sqlx-fu-pipeline.procedure.yaml
- pack/procedures/meeting-minutes-pipeline.procedure.yaml
- pack/styleguides/meeting-minutes-format.styleguide.yaml
- pack/directives/meeting-minutes-action-item-attribution.directive.yaml
tags: []
---

# WP04 — De-duplication: single source of truth (non-profile)

## Objective

For each duplicated rule/body, keep exactly **one** authoritative artefact and make the others
**reference** it. Covers the non-profile duplications (profile-resident dedup — juno-mcp, Mahad
ethos — is WP06).

## Context

Convergent review findings (HIGH/MED): Pester pitfalls restated verbatim across toolguide ↔
procedure; the SQLX CLI/JVM troubleshooting block; the model-tier rule restated ×3; the minutes
action-item format string + "no LLM" duplicated across directive ↔ styleguide. Also the
`meeting-minutes-pipeline` step hardcodes model names (FR-011) — fixed here because it co-locates
with the model-tier restatement in the same file/step.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. No
dependencies — parallel-safe in Phase 0. Implement with:
`spec-kitty agent action implement WP04 --agent <name>`.

## Subtasks

### T015 — Pester pitfalls → one source
- Keep the full pitfalls body in `pester.toolguide.yaml` (authoritative); in
  `powershell-pester-workflow.procedure.yaml` replace the restated body with a reference to the
  toolguide. Do not lose any pitfall detail.

### T016 — SQLX CLI/JVM block → one source
- Keep the CLI/JVM troubleshooting block in the most appropriate single SQLX artefact (prefer the
  validation/testing tactic that already owns runtime troubleshooting); reference it from
  `sqlx-mcp.toolguide.yaml`. Preserve the full JVM/`HADOOP_HOME`/`-Xms` detail in the authoritative copy.

### T017 — Model-tier rule → reference MODEL_DISCIPLINE
- Remove the model-tier rule **restatements** in `sqlx-mcp.toolguide.yaml` and
  `sqlx-fu-pipeline.procedure.yaml`; replace with a reference to the existing MODEL_DISCIPLINE
  directive (Directive 042). Keep any genuinely task-specific guidance.

### T018 — Minutes format string → one source
- Keep the action-item format string + "no LLM editorialising" rule in
  `meeting-minutes-format.styleguide.yaml` (authoritative); reference it from
  `meeting-minutes-action-item-attribution.directive.yaml` instead of restating.

### T019 — `meeting-minutes-pipeline` cleanup
- Remove the model-tier restatement (reference MODEL_DISCIPLINE) **and** de-hardcode model names:
  replace literal model names with tier references / the leaderboard toolguide, per Directive 042.

### T020 — Verify single-source
```bash
rg -l "InModuleScope" pack/            # Pester pitfalls — expect exactly 1 file
rg -l "HADOOP_HOME" pack/              # SQLX JVM block — expect exactly 1 file
rg -n "claude|gpt-|sonnet|opus|gemini-" pack/procedures/meeting-minutes-pipeline.procedure.yaml   # expect 0 hardcoded model names
```

## Definition of Done
- Each target body exists in exactly one artefact; others reference it (no lost detail).
- `meeting-minutes-pipeline` carries no hardcoded model names.
- Regnology headers preserved; no edits outside owned files.

## Reviewer guidance
- Reject if the "single source" collapse dropped any detail (e.g. JVM block truncated).
- Confirm references actually point to the authoritative artefact by name/URN.

## Risks
- Over-aggressive collapse loses context. Mitigate: move, don't delete; verify with the greps.

## Activity Log

- 2026-06-30T18:00:14Z – user – shell_pid=56046 – non-profile dedup complete; each target single-sourced; minutes-pipeline de-hardcoded; SC-004 greps pass (HADOOP_HOME: 1 file; model names: 0; pester pitfalls procedure clean — toolguide+companion.md = 2 files for InModuleScope, both pester toolguide surface)
- 2026-06-30T18:01:30Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=113440 – Started review via action command
- 2026-06-30T18:08:26Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=146094 – Started review via action command
- 2026-06-30T18:12:29Z – user – shell_pid=146094 – Review passed: each target single-sourced (Pester pitfalls in pester.toolguide.yaml 4 items intact; SQLX JVM block in sqlx-validation.tactic.yaml HADOOP_HOME=1 file; model-tier references MODEL_DISCIPLINE 042 in both sqlx-mcp toolguide and sqlx-fu-pipeline; minutes format string in meeting-minutes-format.styleguide.yaml with directive referencing it; minutes-pipeline de-hardcoded 0 model name hits); references intact; scoped to non-profile files (5 owned files only, 0 profile/DRG/MANIFEST touches)
