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

# Specification: Doctrine pack remediation & Georgia templates

**Mission:** `doctrine-pack-remediation-georgia-templates-01KWCBN5`
**Type:** software-dev
**Status:** Draft (specify)
**Created:** 2026-06-30
**Evidence base:** `work/reports/2026-06-30-doctrine-squad-synthesis.md` (3-lens adversarial squad review)

## Summary

Remediate the structural and content debt found in the PS doctrine pack by a three-lens
review (duplication, DRG/SK-pack wiring, clarity), and correct the under-use of `template`
artefacts for Gemini Bot Georgia's generated output. The work brings the pack back to a
state where integrity verification, DRG traversal, and schema expectations all hold, and
where each rule/structure has a single authoritative source.

## Background & Motivation

An adversarial review squad assessed the pack across three lenses and converged on findings
that fall into four classes: (1) **integrity breakers** — stale `MANIFEST.yml`, unresolved
DRG nodes, and a DRG-compiler kind-prefix defect; (2) **schema drift** — inconsistent field
naming and structure across same-kind artefacts; (3) **duplication** — the same rule or
structure restated in multiple artefacts; and (4) **clarity** — bloat and dangling
references. Separately, Georgia's generated output structure is described in prose in three
places (her profile, her `output-artifacts`, and `gemini-agents/README.md`) instead of being
captured once as `template` artefacts — the doctrine stack's designated output-structure
contract.

## User Scenarios & Testing

- **Pack maintainer** runs `spec-kitty doctrine pack validate pack/` and integrity checks and
  gets a clean result, because every on-disk artefact is registered and hashed.
- **Consumer tooling** traverses the compiled DRG by typed URN and resolves every node,
  because the compiled graph carries correct kind prefixes and declares external nodes.
- **Doctrine author** opens any paradigm or agent profile and finds a consistent field
  schema, because schema shapes are canonicalized and documented in the schema template.
- **Georgia** generates a new Gemini agent by filling templates from `pack/templates/gemini/`,
  so output structure changes happen in one place and her profile stays lean.
- **Contributor** looking for where a rule lives finds exactly one authoritative artefact and
  references from the others, not duplicated bodies.

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | Create a `pack/templates/gemini/` template family capturing the structure of each Georgia output artefact (`instructions.md`, `about.md`, `set-up-guide.md`, `review-submission.md`, `roster.yaml` schema, per-agent folder layout). | Proposed |
| FR-002 | Refactor `gemini-bot-georgia.agent.yaml` to *reference* the new templates instead of inlining their structure; eliminate the structural triplication between the profile body, its `output-artifacts`, and the README. | Proposed |
| FR-003 | Update `gemini-agents/README.md` to point at the `pack/templates/gemini/` templates as the canonical output structure (README explains; templates define). | Proposed |
| FR-004 | Resolve the unresolved DRG profiles `doctrine-daphne` and `planner-priti`: either add the profile artefact + node, or declare them in a machine-readable external/inherited-nodes section with provenance. | Proposed |
| FR-005 | Fix the DRG compiler (`tools/compile-drg.py` — the pack's local graph compiler) so the compiled graph derives each edge target's kind from the local pack artefacts/MANIFEST and declared external nodes, instead of defaulting unresolved targets to `directive:`. Must correct **all** misclassified targets (≥41 unique, ≥8 of them confirmed LOCAL: `regnology-main-context`, `token-efficiency`, `regnology-mcp`, `evidence-based-requirements`, `decision-first-development`, `design-diagramming-incremental-detail`, `living-glossary-practice`, `commit-and-markdown-linting`), not only the two originally sampled. | Proposed |
| FR-006 | Remove the self-referencing edge (`onboard-external-agent-to-pack → onboard-external-agent-to-pack`) and the duplicate `receptionist-rob → repository-initialization` edge; add a machine-readable `external_nodes` declaration to `fragment.yaml`. | Proposed |
| FR-007 | Refresh `pack/META/MANIFEST.yml` so every on-disk agent profile (and any other unhashed artefact) has a current entry/hash. | Proposed |
| FR-008 | Wire the orphan paradigms (`backend-for-frontend-bff`, `capability-language-selection`) into the DRG + MANIFEST, or remove them; record the decision. | Proposed |
| FR-009 | Canonicalize **non-breaking** artefact schema: uniform paradigm `summary`/`body` usage and a uniform `context-sources` shape across paradigms and agent profiles; enrich `scribe-sally.agent.yaml` `context-sources` (currently missing a `toolguides` section); document the canonical shapes in the schema template(s). Agent-profile field renaming (`profile-id`→`id`, `schema-version`→`schema_version`) is a **breaking** change and is **deferred** to a future DDR-gated mission (see Out of Scope). | Proposed |
| FR-010 | De-duplicate to a single source: Pester pitfalls, the SQLX CLI/JVM troubleshooting block, the model-tier rule, the minutes action-item format string, the duplicate `- juno-mcp` entries in `analyst-annie.agent.yaml` and `datamodel-darren.agent.yaml`, and the verbatim re-inlining of Scribe Sally's neutrality ethos in `minutes-maker-mahad.agent.yaml` — each rule/structure lives in exactly one authoritative artefact; others reference it. | Proposed |
| FR-011 | Clarity fixes: replace/remove dangling personas in `cloud-native-design-review.tactic.yaml`; fix the `create-branded-pdf-document` "Regnology / Regnology" cross-line typo; correct directive `050` `scope`/un-agent-measurable metric; resolve the non-canonical `confirmation-mode`; de-hardcode model names in `meeting-minutes-pipeline`. | Proposed |
| FR-012 | **Validation-only / already done** — confirm (do not re-do) the `gemini-agents/` surface recognition applied this session in `docs/SURFACES.md` and `.kittify/charter/charter.md` (surface table, decision rule, dedicated section). No execution task should be generated; treat as an acceptance check only. | Done (this session) |

## Non-Functional Requirements

| ID | Requirement | Threshold | Status |
|----|-------------|-----------|--------|
| NFR-001 | Pack schema validation passes. | `spec-kitty doctrine pack validate pack/` returns 0 errors. | Proposed |
| NFR-002 | DRG freshness. | `check-drg-fresh` hook passes; compiled graph regenerated from `fragment.yaml` with no drift. | Proposed |
| NFR-003 | Integrity verification. | 100% of on-disk pack artefacts have a matching `MANIFEST.yml` hash. | Proposed |
| NFR-004 | Georgia profile size. | The profile no longer inlines per-file output structure; `specialization.primary-focus` reduced to references + behaviour (target: structural prose removed, single template source). | Proposed |

## Constraints

| ID | Constraint | Status |
|----|------------|--------|
| C-001 | The two-agent-surface split is preserved: `gemini-agents/` artefacts never appear as `pack/agent_profiles/` entries or DRG nodes. | Active |
| C-002 | Changes must not relax, weaken, or bypass the inherited `regnology-all-company` baseline. | Active |
| C-003 | Regnology branding headers and licensing remain on all applicable artefacts (Directive 041). | Active |
| C-004 | FR-009 is scoped to **non-breaking** canonicalization only. The breaking agent-profile field rename is deferred to a future DDR-gated mission and MUST NOT be attempted here. | Active |
| C-005 | The compiler kind-prefix fix (FR-005) lives in tooling (`tools/compile-drg.py`); generated outputs (`graph.yaml`, `MANIFEST.yml`) are never hand-edited — fix inputs/compiler and regenerate. | Active |

## Success Criteria

- **SC-001** — Integrity: a machine diff of on-disk pack artefacts vs `MANIFEST.yml` entries shows 0 missing and 0 stale (not a manual spot-check of 3 profiles).
- **SC-002** — DRG: in `ps-agent-enabled-factory.graph.yaml`, **0** of the ≥41 known mis-prefixed targets remain mis-classified (verified by the broadened grep covering all confirmed-local IDs **and** a structural cross-check against MANIFEST kinds, not just `regnology-mcp`/`token-efficiency`); 0 dangling references that are not explicitly declared external; 0 self-referencing or duplicate edges.
- **SC-003** — DRG: 0 orphan artefacts (every on-disk artefact is a DRG node or intentionally excluded with a recorded reason).
- **SC-004** — Single source: each de-duplication target (Pester pitfalls, SQLX CLI block, model-tier rule, minutes format string, `juno-mcp` entry, Sally ethos) appears as a body in **exactly one** artefact, verified by a per-target grep that returns a single authoritative file (others reference it).
- **SC-005** — Validation: `spec-kitty doctrine pack validate pack/` and the DRG freshness check pass with 0 errors (baseline at mission start: 150 validation errors).
- **SC-006** — Templates: Georgia's `specialization.primary-focus` contains **no per-file output-structure prose** (reduced ≥50% from baseline); all output-format detail is resolvable only via `pack/templates/gemini/` references; output structure is defined in one place only.
- **SC-007** — Clarity (FR-011): 0 dangling persona names (`Backend Benny`, `Python Pedro`, `Architect Alphonso`, `Code Reviewer Cindy`) remain in pack artefacts; the `create-branded-pdf-document` cross-line typo is gone; directive `050` `scope` is `agent-behavior` (not `docs`); `confirmation-mode` is replaced with a canonical mode token; `meeting-minutes-pipeline` carries no hardcoded model names.
- **SC-008** — Schema (FR-009): every on-disk paradigm has both `summary:` and `body:` fields; `context-sources` shape is uniform across paradigms/profiles; `scribe-sally.agent.yaml` `context-sources` includes a `toolguides` section; the schema template documents the per-kind canonical field conventions.

## Key Entities

- **Doctrine pack artefacts** — directives, tactics, paradigms, procedures, styleguides, toolguides, agent profiles, templates.
- **DRG** — `pack/drg/fragment.yaml` (source) + `pack/drg/ps-agent-enabled-factory.graph.yaml` (compiled).
- **MANIFEST** — `pack/META/MANIFEST.yml` integrity manifest.
- **Gemini surface** — `gemini-agents/` (Georgia's committed generated output) and `pack/templates/gemini/` (new).

## Assumptions

- `doctrine-daphne` and `planner-priti` are spec-kitty built-in profiles being onboarded (the active branch is `refactor/doctrine-daphne-and-onboard-built-in-overlap`); research confirmed: declare them as external/built-in nodes with provenance (R1).
- The DRG compiler is **confirmed** to be `tools/compile-drg.py` (the local distribution-end substitute for upstream `spec-kitty doctrine pack compile-drg`); the kind-prefix defect lives in its local kind-derivation logic (R3, corrected).

## Out of Scope

- Authoring net-new doctrine artefacts beyond the Georgia templates and the named remediation targets.
- The breaking agent-profile field rename (`profile-id`→`id`, `schema-version`→`schema_version`) — deferred to a future DDR-gated mission.
- Hand-editing generated outputs (`graph.yaml`, `MANIFEST.yml`) — these are only ever regenerated.
- Broad upstream spec-kitty fixes; if the defect proves to be an upstream calibrator bug, escalate via Directive 044 rather than patching upstream here.
- Changes to the upstream `regnology-all-company` pack (separate repo).
- The pack-governance dashboard application.

## Open Questions

- RESOLVED (research R1): `doctrine-daphne`/`planner-priti` are declared as external/built-in nodes with provenance (not finished as local profiles this mission).
