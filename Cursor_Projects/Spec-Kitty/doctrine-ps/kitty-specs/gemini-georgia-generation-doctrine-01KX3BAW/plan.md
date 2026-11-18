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

# Implementation Plan: Gemini/Georgia generation doctrine + folded-in cleanup

**Branch**: `feat/migration-2967-gemini-doctrine` | **Date**: 2026-07-09 | **Spec**: `./spec.md`
**Input**: `kitty-specs/gemini-georgia-generation-doctrine-01KX3BAW/spec.md`

## Summary

Update the Gemini Bot Georgia profile and the `pack/templates/gemini/` template family so generated
Gemini Enterprise chatbots systematically carry: fenced connectors/tools declarations (APPSEC),
a knowledge-base manifest with attribution, a recommended-model line from a single authoritative
mapping (MODEL_DISCIPLINE), and curated on-scope starter prompts. Record the Gemini best-practices
as a doctrine artifact so they propagate and survive regeneration (VERSION_GOVERNANCE). Fold in the
low-risk pack-consistency cleanup surfaced by the 2026-07-09 squad. No runtime code is added; the
deliverables are governance artifacts (YAML/Markdown templates, an agent profile, a styleguide/guide,
a model-mapping artifact) plus DRG/config hygiene.

## Technical Context

**Language/Version**: Doctrine pack artifacts — YAML (`schema_version` 1.0 spec-kitty pack schema) +
Markdown templates; tooling in Python 3.13 (`tools/compile-drg.py`). Spec Kitty CLI 3.2.5.
**Primary Dependencies**: spec-kitty 3.2.5 (`doctrine pack validate`, DRG compile), `ruamel.yaml` +
`pydantic` (pack schema tests), the parent pack `regnology-all-company` resolved via `extends:`.
**Storage**: Files in `pack/`, `config/`, `docs/`, `tools/` (version-controlled; no database).
**Testing**: `spec-kitty doctrine pack validate pack/` (0 errors) + `pytest tests/test_pack_schema_validation.py`
(noting MIGRATION-2977 pre-existing failures) + a template-render/dry-regeneration sanity check.
**Target Platform**: Consumed downstream by `regnology-ps-chatbots` (Gemini Enterprise generation)
and any pack consumer via `spec-kitty doctrine fetch`.
**Project Type**: single (doctrine pack repository).
**Performance Goals**: N/A (authoring artifacts).
**Constraints**: Must not weaken inherited governance; APPSEC fencing must be explicit; single
source of truth for the model mapping (no per-file duplication); Regnology branding on new docs.
**Scale/Scope**: 1 agent profile, ~4 Gemini templates, 1 best-practices doctrine artifact, 1 model
mapping artifact; ~6 cleanup surfaces across profiles/config/docs/tools/DRG.

## Charter Check

*GATE: must pass before implementation.*

- **APPSEC_COMPLIANCE**: FR-001 web-search fencing is an explicit least-privilege guardrail — satisfied by design.
- **MODEL_DISCIPLINE**: FR-003/FR-010 route recommended model through one authoritative mapping — satisfied.
- **VERSION_GOVERNANCE**: FR-011 re-pin is the propagation mechanism; marked dependent/cross-repo.
- **TRACEABLE_DECISIONS / REGNOLOGY_BRANDING / AUDIENCE_ORIENTED_WRITING**: new docs carry branding
  header, version stamps, and persona targeting — satisfied.
- **Context-Aware Design (037)**: changes stay within the doctrine-ps bounded context; cross-repo
  effect (FR-011) is an explicit integration boundary, not an in-repo coupling. No violations.

No charter violations → Complexity Tracking not required.

## Project Structure

### Documentation (this mission)

```
kitty-specs/gemini-georgia-generation-doctrine-01KX3BAW/
├── spec.md          # committed, substantive
├── plan.md          # this file
├── research.md      # phase 0 (as needed)
├── tasks.md         # phase 2 (spec-kitty.tasks)
└── tasks/           # work packages
```

### Source (repository root) — real surfaces this mission touches

```
pack/
├── agent_profiles/gemini-bot-georgia.agent.yaml     # FR-001..004, 009, 010 authoring behaviour
├── templates/gemini/
│   ├── instructions.template.md                     # FR-005 (+007,008)
│   ├── set-up-guide.template.md                     # FR-006 (+007,008)
│   └── about.template.md                            # FR-004 landing (starter prompts) if used
├── styleguides/ (new) gemini-chatbot-authoring.styleguide.yaml   # FR-009 best-practices
├── data/ or templates/gemini/ (new) model-recommendation mapping # FR-010 single source
├── agent_profiles/{devops-danny,powershell-peter,sqlx-specialist-simon}.agent.yaml  # FR-012
├── drg/fragment.yaml + ps-agent-enabled-factory.graph.yaml       # FR-013 dedup + recompile
config/artifact-tags.yaml                            # FR-012, FR-014, FR-016
docs/OVERVIEW.md                                     # FR-012, FR-015
tools/compile-drg.py                                 # FR-012 (_BUILTIN_AGENT_SOURCES)
```

**Structure Decision**: Single doctrine-pack repo; no new source tree. New artifacts live in the
existing `pack/` layout (a new styleguide for FR-009; the FR-010 mapping location decided in tasks —
prefer a single YAML the templates/guide reference).

## Implementation Concern Map

> Concerns, not work packages. `spec-kitty.tasks` translates these into WPs.

### IC-01 — Gemini template contract extension
- **Purpose**: Add the optional sections + standardized link syntax + grounding-vs-tools guidance to the template family so generated output has a place for the new content.
- **Relevant requirements**: FR-005, FR-006, FR-007, FR-008 (landing surface for FR-001, FR-002, FR-004).
- **Affected surfaces**: `pack/templates/gemini/{instructions,set-up-guide,about}.template.md`.
- **Sequencing/depends-on**: none (foundation for IC-02).
- **Risks**: keep sections optional so non-grounded agents don't emit empty manifests.

### IC-02 — Georgia authoring behaviour
- **Purpose**: Update the profile so Georgia authors the new sections and sources the recommended model from the single mapping.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-010 (references FR-009).
- **Affected surfaces**: `pack/agent_profiles/gemini-bot-georgia.agent.yaml`.
- **Sequencing/depends-on**: IC-01, IC-03 (mapping), IC-04 (best-practices).
- **Risks**: preserve existing avoidance-boundary/handoff invariants; do not weaken fencing language.

### IC-03 — Authoritative model→agent mapping
- **Purpose**: One artifact mapping agents to recommended model tiers, per MODEL_DISCIPLINE + the leaderboard toolguide.
- **Relevant requirements**: FR-010 (feeds FR-003).
- **Affected surfaces**: new mapping YAML; references from Georgia + set-up-guide template.
- **Sequencing/depends-on**: none.
- **Risks**: avoid duplicating tier data already in the leaderboard toolguide — reference, don't copy.

### IC-04 — Gemini best-practices doctrine
- **Purpose**: Capture the guardrails (fencing, connectors/tools, KB manifest, link syntax, grounding-vs-tools, starter prompts) once, referenced by Georgia.
- **Relevant requirements**: FR-009.
- **Affected surfaces**: new `pack/styleguides/gemini-chatbot-authoring.styleguide.yaml`; DRG edge from Georgia.
- **Sequencing/depends-on**: none.
- **Risks**: bidirectional-linkage rule — wire it into the DRG so it is discoverable.

### IC-05 — Folded-in pack cleanup (backend-benny + hygiene)
- **Purpose**: Clear pre-existing consistency debt in the same pass (Boy Scout).
- **Relevant requirements**: FR-012, FR-013, FR-014, FR-015, FR-016, FR-017 (per plan decision).
- **Affected surfaces**: 3 agent profiles, `config/artifact-tags.yaml`, `docs/OVERVIEW.md`, `tools/compile-drg.py`, `pack/drg/fragment.yaml` + compiled graph.
- **Sequencing/depends-on**: none; recompile DRG after edits.
- **Risks**: keep isolated from the Gemini WPs for reviewability; FR-017 items scoped conservatively — coordination-templates/Directive-040 and receptionist-rob collision are **deferred** (larger, separate concern) unless trivial; orphan paradigm nodes wired only if low-risk.

### IC-06 — Validation & version stamp
- **Purpose**: Ensure pack validates, DRG recompiles, and a dry render shows the new sections; note FR-011 re-pin as dependent follow-up.
- **Relevant requirements**: acceptance verification; FR-011 (dependent).
- **Affected surfaces**: CHANGELOG.md, pack version, DRG compiled graph.
- **Sequencing/depends-on**: all above.
- **Risks**: MIGRATION-2977 pre-existing test failures must be distinguished from any regression.

### FR-017 plan decision (recorded)
- Coordination-templates / Directive-040 gap → **DEFERRED** (separate concern; larger than this mission).
- `receptionist-rob` collision `overrides:`/`enhances:` declaration → **DEFERRED** (needs collision-policy call).
- Orphan paradigm nodes (`client-data-storage`, `cloud-native-domain-modelling`) → **IN SCOPE if trivial**
  (wire from an existing edge during IC-05; otherwise defer).
