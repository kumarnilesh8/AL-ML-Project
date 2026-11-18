---
work_package_id: WP05
title: Folded-in pack cleanup
dependencies: []
requirement_refs:
- FR-012
- FR-013
- FR-014
- FR-015
- FR-016
- FR-017
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
phase: Phase 0 - Cleanup
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: pack/drg/fragment.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/agent_profiles/devops-danny.agent.yaml
- pack/agent_profiles/powershell-peter.agent.yaml
- pack/agent_profiles/sqlx-specialist-simon.agent.yaml
- config/artifact-tags.yaml
- docs/OVERVIEW.md
- tools/compile-drg.py
- pack/drg/fragment.yaml
- pack/drg/ps-agent-enabled-factory.graph.yaml
tags: []
---

# Work Package Prompt: WP05 – Folded-in pack cleanup

## Goal
Clear the pre-existing consistency debt found by the 2026-07-09 squad (Boy Scout, D036). Owns ALL
`pack/drg/fragment.yaml` edits + graph recompile (single-owner).

## Requirements
FR-012, FR-013, FR-014, FR-015, FR-016, FR-017.

## Subtasks
- T009 (FR-012): Purge the `backend-benny` phantom — from `works-with` in
  `devops-danny.agent.yaml`, `powershell-peter.agent.yaml`, `sqlx-specialist-simon.agent.yaml`
  (+ the prose line in sqlx-specialist-simon), the tag block in `config/artifact-tags.yaml`, the
  `docs/OVERVIEW.md` agent table, and `_BUILTIN_AGENT_SOURCES` in `tools/compile-drg.py`.
- T010 (FR-013/FR-014/FR-016/FR-017): In `pack/drg/fragment.yaml`: remove the duplicate
  `datamodel-darren → analyst-annie` (`specializes_from`) edge; add the
  `gemini-bot-georgia → gemini-chatbot-authoring` (references) edge for WP03; wire the orphan
  paradigm nodes (`client-data-storage`, `cloud-native-domain-modelling`) to >=1 edge IF trivial
  (else leave, per plan). In `config/artifact-tags.yaml`: collapse the duplicate
  `powershell-conventions` key to one block; drop the stale `shell-scripts` tag. Then recompile the
  graph via `tools/compile-drg.py` (never hand-edit the compiled graph). FR-017 deferred items
  (coordination-templates/Directive-040, receptionist-rob collision) are NOT done here.
- T011 (FR-015): Correct `docs/OVERVIEW.md` agent table to match the real installable roster.

## Independent test
`rg backend-benny` returns 0 in pack/config/docs/tools (docs/decisions + engineering_notes historical
excepted); single `datamodel-darren → analyst-annie` edge; single `powershell-conventions` key;
recompiled graph consistent with fragment.

## Definition of Done
- All MUST cleanup items done; graph recompiled; no new dangles introduced.

## Activity Log

- 2026-07-09T13:07:09Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
