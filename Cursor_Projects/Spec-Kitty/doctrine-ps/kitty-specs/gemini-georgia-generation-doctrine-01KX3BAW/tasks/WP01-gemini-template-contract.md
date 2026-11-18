---
work_package_id: WP01
title: Gemini template contract extension
dependencies: []
requirement_refs:
- FR-005
- FR-006
- FR-007
- FR-008
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
phase: Phase 0 - Foundation
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: pack/templates/gemini/instructions.template.md
create_intent: []
execution_mode: code_change
owned_files:
- pack/templates/gemini/instructions.template.md
- pack/templates/gemini/set-up-guide.template.md
tags: []
---

# Work Package Prompt: WP01 – Gemini template contract extension

## Goal
Extend the `pack/templates/gemini/` template family so generated chatbots have a defined place for
the new content, with standardized link syntax and grounding guidance.

## Requirements
FR-005, FR-006, FR-007, FR-008.

## Subtasks
- T001: In `pack/templates/gemini/instructions.template.md`, add three OPTIONAL sections —
  "Connectors and tools", "Knowledge base overview", and "Suggested starter prompts" — each clearly
  marked optional (omit for agents that don't need them).
- T002: In `pack/templates/gemini/set-up-guide.template.md`, add a "Recommended model" step and a
  step instructing the operator to paste the starter prompts into the Gemini Enterprise
  starter/suggested-prompts field.
- T003: Standardize the `connector://<name>` and `tool://<name>` link syntax used by Gemini
  Enterprise, and add grounding-strictness-vs-tool-access guidance (a general web-search tool may
  only source official references to attach, never answer domain substance).

## Independent test
Both templates render with the new sections/steps; the link syntax and grounding guidance are
present and consistent with the best-practices styleguide (WP03).

## Definition of Done
- Sections are optional and do not force empty manifests for non-grounded agents.
- Regnology branding header preserved; markdown-lint clean.

## Activity Log

- 2026-07-09T13:06:58Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
