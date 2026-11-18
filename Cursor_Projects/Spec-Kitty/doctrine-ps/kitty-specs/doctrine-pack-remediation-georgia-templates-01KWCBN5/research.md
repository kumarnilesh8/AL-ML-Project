# Phase 0 Research: Doctrine pack remediation & Georgia templates

**Mission:** `doctrine-pack-remediation-georgia-templates-01KWCBN5`
**Date:** 2026-06-30

Resolves the open questions from `plan.md` and the deferred `[NEEDS CLARIFICATION]` in `spec.md`.

---

## R1 — Disposition of `doctrine-daphne` and `planner-priti` (FR-004)

- **Decision:** Declare both as **external/inherited (spec-kitty built-in) nodes** with provenance — do not create local `pack/agent_profiles/*.agent.yaml` for them.
- **Rationale:** They are referenced as delegation/suggestion targets (e.g. `gemini-bot-georgia → doctrine-daphne`, `receptionist-rob → planner-priti`) and are spec-kitty built-in profiles, not PS-layer artefacts. Creating local copies would duplicate built-ins and violate the "augment built-ins via edges, don't replace" policy in `org-charter.yaml`. The active branch (`refactor/doctrine-daphne-and-onboard-built-in-overlap`) is explicitly about onboarding built-in overlap — consistent with declaring them external.
- **Consequence:** `fragment.yaml` needs a machine-readable declaration so the validator/compiler treats these IDs as resolved-upstream rather than dangling (see R3).

## R2 — Agent-profile field naming (`profile-id`/`schema-version` vs `id`/`schema_version`) (FR-009)

- **Finding:** All 14 local agent profiles use hyphenated `profile-id:` / `schema-version:`, while every other artefact kind uses `id:` / `schema_version:`.
- **Decision (research-gated → resolved to):** **Do NOT rename profile fields in this mission.** Treat the hyphen form as the spec-kitty agent-profile sub-schema convention until proven otherwise. The canonicalization in FR-009 is therefore limited to **non-breaking** items: paradigm `summary`/`body` usage and the `context-sources` shape, plus *documenting* the per-kind field-name convention in the schema template.
- **Rationale:** `spec-kitty doctrine pack validate` is the authority. A rename touches the DRG, MANIFEST hashes, and any consumer keying on `id:`. The squad itself flagged this as "may be mandated by the SK sub-schema." Validating that the current hyphen form passes `pack validate` (it ships today) is sufficient evidence to leave it; a rename would need its own DDR (C-004) and is **deferred**.
- **Net effect on FR-009:** scoped to non-breaking canonicalization + documentation. No DDR required for this mission. The field-name question is recorded as a future DDR candidate.

## R3 — DRG compiler / kind-prefix defect (FR-005)  *(CORRECTED after post-plan review)*

- **CORRECTION:** An earlier draft of this section wrongly claimed there is no `tools/compile-drg.py`. **It exists and is the pack's DRG compiler** (`tools/compile-drg.py`, tracked, ~14KB). Its own header: *"Compile pack/drg/fragment.yaml → pack/drg/<pack_name>.graph.yaml … the distribution-end substitute for the upstream `spec-kitty doctrine pack compile-drg` (spec-kitty #1619)."* So `ps-agent-enabled-factory.graph.yaml` is produced by **this local script**, not the spec-kitty CLI's `regenerate-graph` (which composes spec-kitty's own internal `src/doctrine/graph.yaml`).
- **Confirmed defect & true root cause:** the compiled graph emits `target: directive:<id>` for **41 unique** non-directive targets, of which **≥8 are LOCAL pack artefacts** present in `MANIFEST.yml`: `regnology-mcp` (toolguide), `token-efficiency`, `regnology-main-context` (×11), `evidence-based-requirements`, `decision-first-development`, `design-diagramming-incremental-detail`, `living-glossary-practice` (paradigms), `commit-and-markdown-linting` (styleguide). Because these are LOCAL, the "upstream pack not fetched" hypothesis is **refuted** — the defect is in `tools/compile-drg.py`'s **kind-derivation logic**, which defaults un-resolved edge targets to `directive:` instead of resolving each target's kind from the local pack dirs / MANIFEST (and from declared external nodes for genuine built-ins).
- **Decision / approach for IC-03:**
  1. Fix `tools/compile-drg.py` so it derives each edge target's kind from the local artefact set (pack kind directories / MANIFEST) and from the `external_nodes` declaration (R1/R3-external) for built-ins — rather than defaulting to `directive:`.
  2. Regenerate `pack/drg/ps-agent-enabled-factory.graph.yaml` with the fixed compiler and verify **all 41** targets carry correct kind prefixes (not just the 2 in the original quickstart).
  3. Upstream fetch (`spec-kitty doctrine fetch --pack regnology-all-company`) remains a **secondary** prerequisite only for resolving kinds of genuinely-upstream IDs; it is **not** the fix for the local misclassifications. Verify-don't-assume: the first IC-03 task step is to reproduce the defect and confirm the local-resolution fix corrects `regnology-main-context` et al.
- **Constraint:** do not hand-edit `graph.yaml`; fix `tools/compile-drg.py` + regenerate. `.doctrine-cache/skills/pack` is confirmed absent, but that explains only the genuinely-upstream IDs, not the local ones.

## R4 — MANIFEST regeneration (FR-007)

- **Finding:** `pack/META/MANIFEST.yml` is a plain `sha256␠␠./relative/path` list. It currently includes upstream/assembled entries (e.g. `./directives/006-version-governance.directive.yaml`, which is not a local file) and is **missing** 3 on-disk profiles (`gemini-bot-georgia`, `minutes-maker-mahad`, `powershell-peter`) — consistent with the squad finding that it is an assembled-but-stale manifest.
- **Decision:** Regenerate the manifest deterministically rather than editing hashes by hand. Candidate mechanism: the assembly/validation path (`spec-kitty doctrine pack assemble` / `pack validate`, or `doctrine org validate`). The exact regen command is confirmed at implementation time by running `pack validate` and observing whether it offers/writes a refreshed manifest, or by the project's documented build step.
- **Acceptance:** after regeneration, 100% of on-disk artefacts have a matching hash and `pack validate` passes (NFR-003, SC-001).

## R5 — Orphan paradigms (FR-008)

- **Finding:** `backend-for-frontend-bff` and `capability-language-selection` exist on disk with valid `id`/`schema_version` but have no DRG node/edge and no MANIFEST entry.
- **Decision (default, confirm in design):** **Wire them in** (add DRG nodes + at least one consuming edge + MANIFEST entry) rather than delete — they encode genuine architecture guidance referenced conceptually by the cloud-native paradigms. Removal is the fallback only if no consumer/edge is justified.

## Summary of decisions

| Item | Decision |
|------|----------|
| R1 doctrine-daphne/planner-priti | Declare external/built-in nodes with provenance |
| R2 profile field naming | Keep hyphen form; FR-009 = non-breaking canonicalization + docs only; rename deferred to a future DDR |
| R3 DRG kind-prefix | Fetch upstream → regenerate-graph → verify; escalate upstream if it persists; never hand-edit graph |
| R4 MANIFEST | Regenerate deterministically via the supported assemble/validate path; no hand-edited hashes |
| R5 orphan paradigms | Wire into DRG + MANIFEST (delete only as fallback) |

All `[NEEDS CLARIFICATION]` markers from the spec are now resolved. No DDR required for this mission's scope (the only breaking change — profile field rename — is deferred).
