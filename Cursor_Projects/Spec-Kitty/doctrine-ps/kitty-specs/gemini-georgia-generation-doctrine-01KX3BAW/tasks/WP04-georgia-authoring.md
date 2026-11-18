---
work_package_id: WP04
title: Georgia authoring behaviour
dependencies:
- WP01
- WP02
- WP03
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
tracker_refs:
- MIGRATION-2967
planning_base_branch: feat/migration-2967-gemini-doctrine
merge_target_branch: feat/migration-2967-gemini-doctrine
branch_strategy: Planning artifacts for this mission were generated on feat/migration-2967-gemini-doctrine. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/migration-2967-gemini-doctrine unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
phase: Phase 1 - Authoring
assignee: ''
agent: ''
history:
- timestamp: '2026-07-09T13:00:00Z'
  agent: system
  action: Prompt generated via spec-kitty.tasks
authoritative_surface: pack/agent_profiles/gemini-bot-georgia.agent.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/agent_profiles/gemini-bot-georgia.agent.yaml
tags: []
---

# Work Package Prompt: WP04 – Georgia authoring behaviour

## Goal
Update `pack/agent_profiles/gemini-bot-georgia.agent.yaml` so Georgia systematically authors the new
sections when generating chatbots, sourcing the recommended model from the WP02 mapping and following
the WP03 best-practices styleguide.

## Requirements
FR-001 (connectors/tools fencing, APPSEC), FR-002 (KB manifest), FR-003 (recommended model from the
single mapping), FR-004 (curated on-scope starter prompts).

## Subtasks
- T007: Extend Georgia's `specialization`/capabilities so she authors: (a) a Connectors-and-tools
  section that fences a general web-search tool (e.g. `google_search`) to sourcing official
  references only — never answering grounded-domain substance (APPSEC_COMPLIANCE); (b) a
  Knowledge-base-overview manifest with provenance and licence attribution for grounded agents.
- T008: Extend Georgia to (c) emit a Recommended-model line in each set-up guide drawn from the WP02
  mapping (no per-file duplication, MODEL_DISCIPLINE); (d) author a curated, on-scope Suggested
  starter-prompts set per agent (curation discipline: stay within scope boundary).
- Add references to the WP03 `gemini-chatbot-authoring` styleguide and the WP02 mapping.

## Independent test
Georgia's profile instructs all four behaviours; existing invariants preserved (front-door handoff,
navigator model, avoidance-boundary, no agent-to-agent invocation, personal-scope default, no
self-promotion). Profile validates under the agent-profile schema.

## Definition of Done
- All four ACs represented in Georgia's authoring contract; styleguide + mapping referenced.

## Activity Log

- 2026-07-09T13:07:13Z – user – Done override: Implemented + validated inline by host agent (standalone pack validate 0 schema errors; layered blocked only by pre-existing cross-layer duplication); committed in ffc8e4b.
