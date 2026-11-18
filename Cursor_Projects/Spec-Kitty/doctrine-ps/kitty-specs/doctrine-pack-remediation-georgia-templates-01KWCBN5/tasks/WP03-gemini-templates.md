---
work_package_id: WP03
title: Gemini template extraction & Georgia slim
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- NFR-004
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-pack-remediation-georgia-templates-01KWCBN5
base_commit: 1bc7062672808405c1b34cbcbc4d52c00ac9f86d
created_at: '2026-06-30T17:48:19.993427+00:00'
subtasks:
- T010
- T011
- T012
- T013
- T014
shell_pid: "194097"
agent: "cursor:sonnet-4.6:reviewer-renata:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/templates/gemini/
create_intent: []
execution_mode: code_change
owned_files:
- pack/templates/gemini/**
- pack/agent_profiles/gemini-bot-georgia.agent.yaml
- gemini-agents/README.md
tags: []
---

# WP03 — Gemini template extraction & Georgia slim

## Objective

Capture Gemini Bot Georgia's **output structure** once as `template` artefacts under
`pack/templates/gemini/`, then slim `gemini-bot-georgia.agent.yaml` so it *references* the
templates instead of inlining their structure, and update `gemini-agents/README.md` to point at
them. Kills the triplication (profile body ↔ `output-artifacts` ↔ README) flagged by the review.

## Context

- `template` artefacts define **output structure contracts** (the lowest doctrine layer); the
  profile defines behaviour. Today Georgia's `specialization.primary-focus` (~600 words) restates
  the output file structure that also appears in her `output-artifacts` and in
  `gemini-agents/README.md`.
- `gemini-agents/` is a **generated output surface** (committed, never hand-edited; not a DRG
  input). This WP does **not** edit `gemini-agents/` artefacts other than its `README.md`, which
  is documentation about the surface.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. No
dependencies — parallel-safe in Phase 0. Implement with:
`spec-kitty agent action implement WP03 --agent <name>`.

## Subtasks

### T010 — Create the `pack/templates/gemini/` family
- One template per Georgia output artefact: `instructions.md`, `about.md`, `set-up-guide.md`,
  `review-submission.md`, the `roster.yaml` schema, and the per-agent folder layout.
- Each template defines the **structure** (sections, placeholders, required fields) — the single
  source of truth for what a generated Gemini agent's files contain. Use the pack template
  conventions (front-matter + Regnology header where applicable).
- Faithfully preserve **every** field currently documented in Georgia's profile/README — this is
  extraction, not redesign. Cross-check against the existing `gemini-agents/` output so no field
  is dropped.

### T011 — Slim Georgia's profile
- Replace the per-file output-structure prose in `specialization.primary-focus` (and any
  duplicate structure in `output-artifacts`) with concise references to the new templates
  (e.g. "emits the artefacts defined in `pack/templates/gemini/`"). Keep behaviour, scope, and
  guardrails. Target: `primary-focus` reduced ≥50% with **no per-file structure prose** remaining.

### T012 — Canonical `context-sources` on Georgia
- Apply the canonical `context-sources` shape (the same shape WP06 documents in the schema
  template) to Georgia's profile, so she is consistent with the rest of the fleet. (Georgia is
  owned here, not by WP06, to avoid a file collision.)

### T013 — Update the README
- `gemini-agents/README.md` should state that output structure is **defined** by
  `pack/templates/gemini/` and that the README only **explains** the surface — remove any
  restated structure that now lives in the templates.

### T014 — Verify
- `pack/templates/gemini/` exists with the full family.
- `rg -c "instructions|about|set-up|review-submission|roster" pack/agent_profiles/gemini-bot-georgia.agent.yaml`
  shows references, not inlined structure; `primary-focus` is ≥50% shorter than baseline.
- README points at the templates.

## Definition of Done
- Templates created; profile slimmed (no per-file prose); README points at templates; Georgia
  `context-sources` canonical. Regnology headers preserved (C-003).
- No edits outside the three owned paths.

## Reviewer guidance
- Reject cosmetic satisfaction (a stub dir + one-line reference while the 600-word block stays).
  Require the structural gate: no per-file output prose in `primary-focus`.
- Verify no output field was lost in extraction (diff against current `gemini-agents/` output).

## Risks
- Dropping a field during extraction → generated agents lose content. Mitigate with the field
  cross-check in T010/T014.

## Activity Log

- 2026-06-30T18:05:06Z – user – shell_pid=56046 – gemini templates created; Georgia profile slimmed to references; README points at templates; SC-006 gate passes
- 2026-06-30T18:07:26Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=142398 – Started review via action command
- 2026-06-30T18:08:03Z – user – shell_pid=142398 – gemini templates created; Georgia slimmed to references (no per-file prose); README points at templates; SC-006 gate passes
- 2026-06-30T18:13:58Z – user – shell_pid=142398 – Moved to planned
- 2026-06-30T18:15:51Z – cursor:gpt-5.5:doctrine-daphne:implementer – shell_pid=179218 – Started implementation via action command
- 2026-06-30T18:18:06Z – cursor:gpt-5.5:doctrine-daphne:implementer – shell_pid=179218 – cycle 1 fix: added Directive 041 branding header to gemini-agents/README.md; all other criteria already passed
- 2026-06-30T18:19:30Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=194097 – Started review via action command
- 2026-06-30T18:22:03Z – user – shell_pid=194097 – Review cycle 2 passed: README now carries Directive 041 branding header; all other criteria still pass
