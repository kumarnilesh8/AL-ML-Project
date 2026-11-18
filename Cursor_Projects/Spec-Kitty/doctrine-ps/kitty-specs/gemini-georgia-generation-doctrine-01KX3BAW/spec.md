<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Specification: Gemini/Georgia generation doctrine + folded-in pack cleanup

**Mission:** `gemini-georgia-generation-doctrine-01KX3BAW`
**Type:** software-dev
**Status:** Draft (specify)
**Tracker:** MIGRATION-2967 (Story) — with additional cleanup scope folded in from the
2026-07-09 cleanup/consistency review squad.
**Branch:** `feat/migration-2967-gemini-doctrine`

## Summary

Systematize, in `doctrine-ps` (the authored source of the `regnology-default` pack), the Gemini
chatbot improvements that were prototyped directly on the `infosec-idris` chatbot in
`regnology-ps-chatbots`. The work updates the **Gemini Bot Georgia** agent profile and the
`pack/templates/gemini/` template family so that every generated chatbot systematically carries:
a fenced connectors/tools declaration, a knowledge-base manifest with provenance/attribution, a
recommended-model line from a single authoritative mapping, and a curated set of on-scope starter
prompts. The Gemini chatbot best-practices are recorded in doctrine so they propagate to all
generated agents and survive regeneration (VERSION_GOVERNANCE).

Folded in as additional mission scope: the low-risk, pre-existing consistency debt surfaced by the
2026-07-09 cleanup/consistency squad (the `backend-benny` phantom purge, duplicate DRG edge and
tag key, stale `docs/OVERVIEW.md` agent table, and related hygiene).

## Background & Motivation

Improvements to how chatbots behave were prototyped on `infosec-idris` (a *generated* distribution
surface). Per VERSION_GOVERNANCE, changes to how chatbots are generated must be made upstream in
`doctrine-ps` — in the Georgia profile and the Gemini templates — then re-pinned into
`regnology-ps-chatbots`, so every generated chatbot benefits and the changes survive regeneration.
Currently the prototyped sections (connectors/tools fencing, knowledge-base manifest, recommended
model, starter prompts) exist only on the one prototyped chatbot, not in the authored source.

Separately, a cleanup/consistency review squad found pre-existing pack debt (notably a
`backend-benny` phantom referenced across three profiles, a config tag, the OVERVIEW table, and the
DRG compiler allowlist) that is low-risk to fix and worth folding into this doctrine pass.

## Goals

- Make the prototyped Gemini generation behaviours systematic in the authored pack.
- Keep governance guardrails intact (APPSEC_COMPLIANCE web-search fencing; MODEL_DISCIPLINE
  recommended model; VERSION_GOVERNANCE re-pin; TRACEABLE_DECISIONS).
- Leave the pack more internally consistent than before (Boy Scout, D036) by clearing the folded-in
  debt.

## Non-Goals

- Performing any generated chatbot's domain work.
- Changing chatbot content by hand in `regnology-ps-chatbots` (only re-pin + regenerate).
- The broad test-suite realignment to the layered model — owned by **MIGRATION-2977** (only the
  `backend-benny`/`abacus-mapper-abe` presence assertions directly implicated by the purge are
  touched here).

## Functional Requirements

Part A = Gemini/Georgia generation doctrine (MIGRATION-2967). Part B = folded-in cleanup
(2026-07-09 squad findings). Priority per MoSCoW column.

| FR | Pri | Requirement | Acceptance criterion |
|----|-----|-------------|----------------------|
| FR-001 | MUST | **Connectors & tools fencing (APPSEC).** Georgia authors a "Connectors and tools" section in each generated agent's instructions declaring connector/tool access and fencing a general web-search tool (e.g. `google_search`). | Given a grounded agent, when generated, its instructions contain a Connectors-and-tools section that forbids `google_search` from answering domain substance and limits it to sourcing official references to attach. |
| FR-002 | MUST | **Knowledge-base manifest.** Georgia authors a "Knowledge base overview" manifest section for knowledge-grounded agents. | Given a knowledge-grounded agent, when generated, its instructions list each attached document with provenance and any licence attribution (e.g. ISO standards). |
| FR-003 | MUST | **Recommended model (MODEL_DISCIPLINE).** Georgia emits a "Recommended model" line in each generated set-up guide, sourced from a single authoritative mapping (FR-010). | Given any generated agent, when its set-up guide is produced, it contains exactly one Recommended-model line whose value derives from the single mapping artifact. |
| FR-004 | MUST | **Suggested starter prompts.** Georgia authors a short, curated on-scope starter-prompt set per generated agent. | Given any generated agent, when generated, it carries a small set of starter prompts; none invite out-of-scope use. |
| FR-005 | MUST | **instructions template.** `pack/templates/gemini/instructions.template.md` gains optional "Connectors and tools", "Knowledge base overview", and "Suggested starter prompts" sections. | The template renders those three optional sections. |
| FR-006 | MUST | **set-up-guide template.** `pack/templates/gemini/set-up-guide.template.md` gains a "Recommended model" step and a step to configure starter prompts. | The template contains both steps. |
| FR-007 | MUST | **Link syntax.** Standardize the `connector://<name>` and `tool://<name>` link syntax in the templates. | Templates document and use the standardized syntax. |
| FR-008 | MUST | **Grounding vs tools guidance.** Add grounding-strictness-vs-tool-access guidance to the templates. | Guidance text present in the templates. |
| FR-009 | MUST | **Best-practices doctrine.** Record the Gemini best-practices (fencing, connectors/tools, KB manifest, link syntax, grounding-vs-tools, starter prompts) in a doctrine artifact referenced by Georgia. | A styleguide/guide artifact exists and Georgia references it. |
| FR-010 | MUST | **Authoritative model mapping.** A single model→agent mapping artifact exists in the pack (no per-file duplication), referenced for FR-003. | The mapping artifact exists and is the single source for FR-003. |
| FR-011 | SHOULD | **Re-pin (VERSION_GOVERNANCE), cross-repo/dependent.** Re-pin `regnology-default` into `regnology-ps-chatbots` and regenerate. | Tracked as a dependent follow-up; this branch delivers the doctrine-ps source only. |
| FR-012 | MUST | **backend-benny purge.** Remove the `backend-benny` phantom (dangle in no layer) from `works-with` in devops-danny/powershell-peter/sqlx-specialist-simon (+ sqlx prose), the `config/artifact-tags.yaml` tag block, `docs/OVERVIEW.md`, and `_BUILTIN_AGENT_SOURCES` in `tools/compile-drg.py`. | No `backend-benny` reference remains in those surfaces; pack validate clean. |
| FR-013 | MUST | **Dedup DRG edge.** Remove the duplicate `datamodel-darren → analyst-annie` (`specializes_from`) edge in `pack/drg/fragment.yaml` and recompile the graph. | Edge declared once; recompiled graph consistent. |
| FR-014 | MUST | **Dedup tag key.** Collapse the duplicate `powershell-conventions` key in `config/artifact-tags.yaml` to one canonical block. | Single key remains. |
| FR-015 | SHOULD | **OVERVIEW table.** Correct `docs/OVERVIEW.md`'s agent catalogue to match the real roster (remove/annotate phantom or renamed entries). | Table reflects installable agents. |
| FR-016 | SHOULD | **Stale tags.** Remove the stale `shell-scripts` tag (and any other confirmed-dead tag) from `config/artifact-tags.yaml`. | No confirmed-dead tag entries remain. |
| FR-017 | COULD | **Plan-decided candidates.** Coordination-templates/Directive-040 gap, orphan paradigm nodes (`client-data-storage`, `cloud-native-domain-modelling`), and the `receptionist-rob` collision declaration — plan decides in-scope vs deferred. | Plan records the decision per item. |

**WON'T (this mission):** broad test-suite realignment (MIGRATION-2977); hand-editing chatbot content
in `regnology-ps-chatbots` beyond re-pin/regenerate.

## Out of Scope

- The layered-pack test realignment (MIGRATION-2977).
- Any change authored directly in `regnology-ps-chatbots` other than the re-pin + regeneration.

## Governance Directives Touched

APPSEC_COMPLIANCE (FR-001), MODEL_DISCIPLINE (FR-003/FR-010), VERSION_GOVERNANCE (FR-011),
TRACEABLE_DECISIONS, AUDIENCE_ORIENTED_WRITING (set-up guide), REGNOLOGY_BRANDING, plus D036 Boy
Scout for Part B (FR-012–FR-017).

## Acceptance Verification

- `spec-kitty doctrine pack validate pack/` — 0 errors after changes.
- Pack schema tests run (noting MIGRATION-2977 pre-existing failures unrelated to this mission; the
  `backend-benny`/`abacus-mapper-abe` presence assertions must no longer reference the purged phantom).
- A dry regeneration (or template-render check) shows the new sections appear in generated output.
