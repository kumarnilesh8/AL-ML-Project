---
work_package_id: WP06
title: Validation, CHANGELOG, re-pin follow-up
dependencies:
- WP01
- WP02
- WP03
- WP04
- WP05
requirement_refs:
- FR-011
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T012
phase: Phase 2 - Validation
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: CHANGELOG.md
create_intent: []
execution_mode: code_change
owned_files:
- CHANGELOG.md
tags: []
---

# Work Package Prompt: WP06 – Validation, CHANGELOG, re-pin follow-up

## Goal
Verify the mission's changes hold together, record them, and capture the cross-repo re-pin as a
tracked dependent follow-up (FR-011, VERSION_GOVERNANCE).

## Requirements
FR-011 (dependent/cross-repo) + overall acceptance verification.

## Subtasks
- T012:
  - Run `spec-kitty doctrine pack validate pack/` — must be 0 errors.
  - Run `pytest tests/test_pack_schema_validation.py` and distinguish any regression from the
    pre-existing MIGRATION-2977 failures (backend-benny/abacus-mapper-abe presence assertions should
    no longer reference the purged phantom; other pre-existing failures remain 2977's scope).
  - Dry render / inspect: confirm the new template sections and steps appear as intended.
  - Add a CHANGELOG.md entry (Why / What / For Whom) for the Gemini doctrine + cleanup.
  - Record FR-011 (re-pin `regnology-default` into `regnology-ps-chatbots` + regenerate) as a
    dependent follow-up (it is cross-repo; not delivered on this branch).

## Independent test
Pack validates 0 errors; graph fresh; CHANGELOG updated; FR-011 follow-up recorded.

## Definition of Done
- Green validation; documented; re-pin follow-up captured.

## Activity Log

- 2026-07-09T13:07:17Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
