---
work_package_id: WP01
title: DRG source cleanup (fragment.yaml)
dependencies: []
requirement_refs:
- FR-004
- FR-006
- FR-008
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-pack-remediation-georgia-templates-01KWCBN5
base_commit: ed076f2226b67c38393cf1a655093ac2fcb14ed8
created_at: '2026-06-30T17:47:36.180401+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
shell_pid: "98713"
agent: "cursor:sonnet-4.6:doctrine-daphne:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/drg/fragment.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/drg/fragment.yaml
tags: []
---

# WP01 — DRG source cleanup (`fragment.yaml`)

## Objective

Make `pack/drg/fragment.yaml` a valid, complete DRG **source** so the compiler (WP02) and
the validator stop reporting dangling references and edge defects. This WP edits **only**
`pack/drg/fragment.yaml`. Do **not** touch `ps-agent-enabled-factory.graph.yaml` (generated —
owned by WP02) or the paradigm files themselves (owned by WP06).

## Context

The post-plan review (and `spec-kitty doctrine pack validate pack/` — 150 errors at mission
start) confirmed four source defects, all in `fragment.yaml`:
- `doctrine-daphne` and `planner-priti` are used as edge sources but are **spec-kitty built-in
  profiles** (the active branch onboards built-in overlap). They must be declared, not authored
  as local nodes — research R1.
- a self-referencing edge `onboard-external-agent-to-pack → onboard-external-agent-to-pack`.
- a duplicate `receptionist-rob → repository-initialization` edge.
- two orphan paradigms (`backend-for-frontend-bff`, `capability-language-selection`) exist on
  disk but are absent from the graph — R5 decision is to **wire them in**.

## Branch Strategy

Planning base: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. Final merge target:
same. Execution worktrees are allocated per computed lane from `lanes.json`. Implement with:
`spec-kitty agent action implement WP01 --agent <name>`.

## Subtasks

### T001 — Declare `external_nodes` for built-ins
- Add a machine-readable `external_nodes:` section to `fragment.yaml` declaring `doctrine-daphne`
  and `planner-priti` with `kind: agent_profile`, an `origin`/`provenance` of the upstream
  spec-kitty built-in pack, and a short note that they are augmented (not replaced) per the
  org-charter "augment built-ins via edges" policy.
- Match the exact schema the compiler/validator expect (see `tools/compile-drg.py` header, which
  synthesises `agent_profile:` URNs for built-in sources). If a precedent `external_nodes` shape
  already exists upstream, mirror it.

### T002 — Remove the self-referencing edge
- Delete the edge whose `source` and `target` are both `onboard-external-agent-to-pack`
  (around the `relation: enhances` block). A node never enhances itself.

### T003 — Remove the duplicate edge
- There are two identical `receptionist-rob → repository-initialization` edges. Remove one;
  keep a single edge with its `relation`.

### T004 — Wire the orphan paradigms
- Add graph nodes for `backend-for-frontend-bff` and `capability-language-selection` (kind:
  `paradigm`) and at least **one consuming edge each** to a real consumer (e.g. a profile or
  tactic that applies the paradigm — choose the most accurate existing consumer; if none is a
  clean fit, wire to the architecture/design tactic that references the concept). Do not invent
  consumers; pick the artefact whose body already discusses the concept.

### T005 — Verify
- `python3 -c "import yaml,sys; yaml.safe_load(open('pack/drg/fragment.yaml'))"` parses clean.
- `rg -n "doctrine-daphne|planner-priti" pack/drg/fragment.yaml` shows them under `external_nodes`.
- No `source == target` edge remains; no duplicate `receptionist-rob → repository-initialization`.
- `rg -n "backend-for-frontend-bff|capability-language-selection" pack/drg/fragment.yaml` shows
  each as a node **and** as an edge endpoint.

## Definition of Done
- All five subtasks complete and verified by the commands above.
- `fragment.yaml` retains the Regnology branding header (C-003).
- No edits to any file other than `pack/drg/fragment.yaml`.

## Reviewer guidance
- Confirm external nodes are *declared*, not authored as local profile artefacts (C-001/R1).
- Confirm orphan edges point at genuine consumers, not placeholders.
- The graph will be regenerated in WP02; do not expect `graph.yaml` to change here.

## Risks
- Wrong `external_nodes` schema → WP02/validator still complains. Mitigate by mirroring the
  compiler's expected shape before committing.

## Activity Log

- 2026-06-30T17:57:09Z – user – shell_pid=51937 – fragment.yaml: external_nodes declared, self/dup edges removed, orphan paradigms wired; parses clean, greps pass
- 2026-06-30T17:58:32Z – cursor:sonnet-4.6:doctrine-daphne:reviewer – shell_pid=98713 – Started review via action command
- 2026-06-30T18:03:13Z – user – shell_pid=98713 – Review passed: external_nodes (daphne, priti) declared with provenance; self+dup edges removed; both orphan paradigms wired as nodes with consuming edges; fragment parses; scoped to fragment.yaml only
