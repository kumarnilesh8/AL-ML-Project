---
work_package_id: WP05
title: Clarity fixes
dependencies: []
requirement_refs:
- FR-011
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-pack-remediation-georgia-templates-01KWCBN5
base_commit: e701116630a79f61d54f6cb2e9405ecd114f846d
created_at: '2026-06-30T17:48:34.234865+00:00'
subtasks:
- T021
- T022
- T023
- T024
shell_pid: "91701"
agent: "cursor:sonnet-4.6:reviewer-renata:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/tactics/cloud-native-design-review.tactic.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/tactics/cloud-native-design-review.tactic.yaml
- pack/procedures/create-branded-pdf-document.procedure.yaml
- pack/directives/050-ad-hoc-prompt-capture.directive.yaml
tags: []
---

# WP05 — Clarity fixes

## Objective

Surgical clarity corrections across three artefacts. (The `meeting-minutes-pipeline` model-name
fix is WP04; the Mahad `confirmation-mode` fix is WP06 — both to keep file ownership disjoint.)

## Context

Review clarity findings verified on disk: dangling persona names in the cloud-native design
review tactic; a cross-line "Regnology / Regnology" typo in the branded-PDF procedure; directive
`050` mis-scoped (`scope: docs` for an agent-behaviour directive) plus an un-agent-measurable
"under two minutes" metric.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. No
dependencies — parallel-safe in Phase 0. Implement with:
`spec-kitty agent action implement WP05 --agent <name>`.

## Subtasks

### T021 — Dangling personas
- In `cloud-native-design-review.tactic.yaml`, replace/remove dangling persona names (e.g.
  `Backend Benny`, `Python Pedro`, `Architect Alphonso`, `Code Reviewer Cindy`) that do not map
  to real pack agent profiles. Use a role description or a real profile reference instead.

### T022 — Branding typo
- In `create-branded-pdf-document.procedure.yaml`, fix the cross-line "Regnology\nRegnology PDF
  generator" duplication (lines ~5-6) to the correct single product name.

### T023 — Directive 050 metadata
- Change `scope: docs` → `scope: agent-behavior` (the directive governs agent behaviour, not
  docs). Replace the un-agent-measurable "under two minutes" wording with an agent-actionable
  criterion (e.g. a concrete step/threshold an agent can self-check).

### T024 — Verify
```bash
rg -n "Backend Benny|Python Pedro|Architect Alphonso|Code Reviewer Cindy" pack/   # expect 0
rg -nU "Regnology\s+Regnology" pack/procedures/create-branded-pdf-document.procedure.yaml   # expect 0
rg -n "scope: docs" pack/directives/050-ad-hoc-prompt-capture.directive.yaml   # expect 0
```

## Definition of Done
- All three artefacts corrected and greps pass. Regnology headers preserved. No edits outside
  owned files.

## Reviewer guidance
- Confirm persona replacements do not reintroduce other dangling names.
- Confirm the new `050` metric is something an agent can actually measure.

## Risks
- Low. Persona replacement could miss an occurrence — the grep gate catches it.

## Activity Log

- 2026-06-30T17:55:53Z – user – shell_pid=56046 – clarity fixes complete; directive 050 scope=agent-behavior; persona/typo greps = 0 in owned files
- 2026-06-30T17:56:53Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=91701 – Started review via action command
- 2026-06-30T18:00:05Z – user – shell_pid=91701 – Review passed: dangling personas removed, branding typo fixed, directive 050 scope=agent-behavior with measurable metric; scoped to 3 owned files
