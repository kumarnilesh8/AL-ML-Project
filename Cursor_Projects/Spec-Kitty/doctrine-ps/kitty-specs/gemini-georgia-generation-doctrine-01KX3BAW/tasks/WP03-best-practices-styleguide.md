---
work_package_id: WP03
title: Gemini best-practices doctrine styleguide
dependencies: []
requirement_refs:
- FR-009
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T005
phase: Phase 0 - Foundation
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: pack/styleguides/gemini-chatbot-authoring.styleguide.yaml
create_intent:
- pack/styleguides/gemini-chatbot-authoring.styleguide.yaml
execution_mode: code_change
owned_files:
- pack/styleguides/gemini-chatbot-authoring.styleguide.yaml
tags: []
---

# Work Package Prompt: WP03 – Gemini best-practices doctrine styleguide

## Goal
Record the Gemini chatbot best-practices once, as a doctrine artifact Georgia references, so they
propagate to all generated agents.

## Requirements
FR-009.

## Subtasks
- T005: Author `pack/styleguides/gemini-chatbot-authoring.styleguide.yaml` capturing: google_search
  fencing, connectors/tools declaration, KB manifest with provenance/attribution, `connector://` /
  `tool://` link syntax, grounding-strictness-vs-tool-access rule, and on-scope starter-prompt
  curation. Valid against the pack styleguide schema (`schema_version`, `id` kebab-case,
  `principles` with >=1 entry).
- (DRG wiring: the `gemini-bot-georgia -> gemini-chatbot-authoring` references edge is added by WP05,
  the single owner of `pack/drg/fragment.yaml`, to avoid file collisions.)

## Independent test
Styleguide validates under pack schema; no dangling references (the discoverability edge is verified in WP05/WP06).

## Definition of Done
- Single authoritative best-practices source; Georgia references it (WP04).

## Activity Log

- 2026-07-09T13:07:05Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
