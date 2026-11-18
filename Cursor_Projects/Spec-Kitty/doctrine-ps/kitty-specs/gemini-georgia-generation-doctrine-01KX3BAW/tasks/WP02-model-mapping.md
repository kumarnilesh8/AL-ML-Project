---
work_package_id: WP02
title: Authoritative model to agent mapping
dependencies: []
requirement_refs:
- FR-010
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T004
phase: Phase 0 - Foundation
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: pack/templates/gemini/model-recommendation.map.yaml
create_intent:
- pack/templates/gemini/model-recommendation.map.yaml
execution_mode: code_change
owned_files:
- pack/templates/gemini/model-recommendation.map.yaml
tags: []
---

# Work Package Prompt: WP02 – Authoritative model to agent mapping

## Goal
Create a single authoritative model→agent mapping the recommended-model line (FR-003) draws from, so
tier recommendations live in exactly one place (no per-file duplication), per MODEL_DISCIPLINE.

## Requirements
FR-010.

## Subtasks
- T004: Create one mapping artifact (prefer a YAML under `pack/templates/gemini/` or `pack/data/`,
  decided at implementation) that maps each Gemini agent (or agent class) to a recommended model
  tier. Reference the `agentic-model-leaderboard` toolguide for tier rationale rather than copying
  its tier data. Include a short header explaining it is the single source for FR-003.

## Independent test
Exactly one mapping artifact exists; grep confirms no competing per-file model recommendations; the
set-up-guide template (WP01) and Georgia (WP04) reference this artifact.

## Definition of Done
- Single source of truth; references, not copies, the leaderboard toolguide.
- Regnology branding header (if a doc) / schema-valid (if pack YAML).

## Activity Log

- 2026-07-09T13:07:02Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
