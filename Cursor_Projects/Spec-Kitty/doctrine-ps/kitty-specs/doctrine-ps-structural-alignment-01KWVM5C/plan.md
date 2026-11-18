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

# Implementation Plan: Doctrine-PS Structural Alignment

**Branch**: `feature/migration-2915-structural-alignment` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/spec.md`

## Summary

Correct structural-documentation drift in `AGENTS.md`, `CLAUDE.md`, and `README.md` (claims
about `.cursor/`/`.claude/`, `src/framework/**`, `tests/*`, `fixtures/`, and several dangling
doc paths that no longer match the on-disk repository); repoint `gemini-bot-georgia`'s agent
profile and six output templates from the retired local `gemini-agents/` directory to the new
dedicated `regnology-ps-chatbots` repository; and add a lightweight `tools/lint-doc-paths.py`
script (+ Makefile target) so this class of drift is caught automatically going forward.
Approach: three independent implementation concerns split by affected file-set (doc-drift
prose, Georgia's YAML/template repoint, and the new lint tool), sequenced so the lint's
"zero dangling paths" acceptance criterion only runs as a terminal gate after the other two
concerns land.

## Technical Context

**Language/Version**: Markdown/prose edits (no runtime); Python 3.13 for the new
`tools/lint-doc-paths.py` (matches repo convention: `tools/compile-drg.py`,
`tools/triage-drg-dangles.py`, both `#!/usr/bin/env python3`, stdlib-only)
**Primary Dependencies**: None new. Python stdlib only (`re`, `pathlib`, `argparse`) for the
lint script, mirroring `tools/triage-drg-dangles.py`'s dependency-free convention.
**Storage**: Filesystem — Markdown docs at repo root and `docs/`; YAML/Markdown templates
under `pack/agent_profiles/` and `pack/templates/gemini/`; `.gitignore`.
**Testing**: Grep/manual-review verification for FR-001–FR-008 and FR-012–FR-014 (per spec's
acceptance criteria, several of which are explicitly outside automated coverage); a
fixture-based positive/negative test shipped with `tools/lint-doc-paths.py` itself (plant a
deliberately dangling path, expect non-zero exit; remove it, expect zero exit); `spec-kitty
doctrine pack validate pack/` as a smoke check post-FR-012/013 (not expected to change the
existing 156-error inherited-layer baseline, per Doctrine Daphne's post-spec finding).
**Target Platform**: Local developer machine (lint is a local Makefile target only this
mission — not wired into CI/pre-commit, per C-003) and any agent bootstrapping from
`AGENTS.md`/`CLAUDE.md`/`README.md`.
**Project Type**: single (documentation + one new local tooling script + one agent-profile's
template family; no application code, no API, no data model)
**Performance Goals**: N/A. NFR-001 sets a bound on the lint script only (under 10 seconds
against this repo's current tracked `.md` file count).
**Constraints**: C-001 (no DRG edge/fragment changes — confirmed unnecessary), C-002 (Georgia's
profile-id/roles/routing-priority/roster wiring unchanged), C-003 (lint not wired into CI/
pre-commit this mission), C-004 (this run stops at plan.md per the mission's own scope — see
Next Steps), C-005 (`regnology-ps-chatbots` is read-only reference, never edited by this
mission), C-006 (Regnology branding headers/licensing, Directive 041, preserved on all edited
files and added to the new lint script), C-007 (corrections must not relax, weaken, or bypass
the inherited `regnology-all-company` baseline).
**Scale/Scope**: 3 root docs (`AGENTS.md`, `CLAUDE.md`, `README.md`), 1 new script + 1
Makefile target, 1 agent profile + 6 templates + `.gitignore`, 14 FRs total.

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Charter mode `bootstrap` (first load for `plan` action this session). Relevant gates from
`.kittify/charter/charter.md`:

- **File placement (Decision rule for file placement, charter §"Repository Structure"):**
  doc corrections stay in their existing root/`docs/` locations; new lint script → `tools/`
  (existing "Development-time utilities, validators, exporters" bucket — no new top-level
  directory needed); Georgia's profile/template edits stay under `pack/`. ✅ Conforms, no new
  directory categories introduced.
- **No new dependencies without DDR justification (charter §"Branch Strategy" /
  Deployment constraints):** the lint script is stdlib-only Python, matching
  `tools/triage-drg-dangles.py`'s existing convention. ✅ No new npm/pip dependency.
- **Quality Gates (YAML validation before commit):** FR-012/013 touch a YAML agent profile
  and YAML template (`roster.template.yaml`); `spec-kitty doctrine pack validate pack/` must
  still pass post-edit. ✅ Planned as a verification step in IC-03.
- **Branding:** no new artefact files are created that require a Regnology header except
  `tools/lint-doc-paths.py`, which the spec (FR-009) already requires to carry the branding
  header block matching `triage-drg-dangles.py`/`compile-drg.py`. ✅ Conforms.
- **⚠️ Charter Check finding (new, surfaced during this plan phase, not by the original
  spec or the post-spec squad):** `.kittify/charter/charter.md` §"Repository Structure"
  itself still lists `gemini-agents/` as a **committed** directory ("Generated Gemini
  Enterprise chatbot distribution surface … Committed but never hand-edited") — this is now
  stale, since `gemini-agents/` was removed from this repository earlier in this same
  session (superseded by `regnology-ps-chatbots`). The charter file carries a
  `<!-- Generated by \`spec-kitty charter generate\` -->` marker (generated 2026-05-28) — it
  is a **generated artefact**, not hand-maintained prose, so per the repo's own
  generated-artefact convention it should be regenerated via `spec-kitty charter generate`
  (or an equivalent charter sync), not hand-edited. **Decision: out of scope for this
  mission** (it is a different generation surface than the FR-001–FR-014 doc-drift set this
  mission was commissioned to fix, and hand-editing a generated file would itself be a
  process violation). Recorded here as a follow-up recommendation rather than silently
  ignored, matching how the spec already handles the `pack/.pack-version` and "8 required
  directives" out-of-scope items.

No unjustified Charter Check violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this mission)

```
kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/
├── spec.md              # Specify phase output (reviewed by post-spec squad)
├── plan.md              # This file
├── research.md          # Phase 0 output (plan-phase decisions + charter finding)
└── tasks.md             # Phase 2 (/spec-kitty.tasks — NOT created here)
```

No `data-model.md`, `contracts/`, or `quickstart.md` — this mission has no data model, no
API, and no new user-facing setup flow to walk through; Phase 1 design is fully captured by
the Implementation Concern Map below (N/A per the "based on confirmed intent" guidance in the
plan workflow).

### Source surfaces (repository root)

```
AGENTS.md, CLAUDE.md, README.md          # IC-01 — structural doc-drift corrections
tools/lint-doc-paths.py                  # IC-02 — NEW: doc-path dangle lint script
Makefile                                 # IC-02 — new lint target wired in
pack/agent_profiles/gemini-bot-georgia.agent.yaml   # IC-03 — repoint to regnology-ps-chatbots
pack/templates/gemini/*.template.md, roster.template.yaml   # IC-03 — six files, path examples only
pack/README.md, pack/agent_profiles/README.md, docs/SURFACES.md   # IC-03 — surface docs
.gitignore                               # IC-03 — remove dead gemini-agents/onboarding-odysseus/ rules
```

**Structure Decision**: Single-repo doctrine pack, no new top-level directories. Changes are
organized by Implementation Concern (file-set), not by app layer — there is no application
code in this mission.

## Complexity Tracking

No Charter Check violations requiring justification. (The charter-staleness finding above is
a follow-up recommendation, not a violation this mission is causing or must justify.)

## Implementation Concern Map

> Concerns are NOT work packages. `/spec-kitty.tasks` translates these into executable WPs.

### IC-01 — Structural documentation drift corrections

- **Purpose**: Correct `AGENTS.md`, `CLAUDE.md`, and `README.md` so their repository-structure
  claims, toolguide/directive references, and dangling paths match on-disk reality.
- **Relevant requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008;
  NFR-003 (edited Markdown passes the repository's existing `.markdownlint.yaml` rules with 0
  new violations); SC-001, SC-002, SC-003
- **Affected surfaces**: `AGENTS.md`, `CLAUDE.md`, `README.md`
- **Sequencing/depends-on**: none — independent of IC-02 and IC-03 (disjoint file sets).
  Internally, FR-001/FR-002 touch both `AGENTS.md` and `CLAUDE.md`; treat as one serial pass
  per file rather than parallel edits to avoid merge friction within the concern itself.
- **Definition of Done (markdownlint, NFR-003)**: run `markdownlint` (or the repository's
  equivalent config check) against the edited `AGENTS.md`, `CLAUDE.md`, and `README.md` and
  confirm 0 new violations before considering this concern complete.
- **Risks**: FR-001/FR-002's acceptance criteria are grep-verifiable but not lint-covered
  (per the post-spec squad's finding) — verify by direct grep, not by assuming the lint's
  green result covers them. FR-005/FR-006/FR-008 each require a "correct vs. remove" judgment
  call per spec's Assumptions section — resolve per-path based on whether the underlying
  concept still needs documenting (resolved per-path in research.md R5: FR-005 corrected in
  place, FR-006 and FR-008 removed).

### IC-02 — Doc-path dangle lint tool

- **Purpose**: Ship `tools/lint-doc-paths.py`, a Makefile target, and a pre-seeded allow-list
  so future doc-path drift (the failure class this whole mission exists to fix) is caught
  automatically instead of by manual discovery.
- **Relevant requirements**: FR-009, FR-010, FR-011; NFR-001, NFR-002 (every reported finding
  names the source file and the exact offending path string, mirroring
  `triage-drg-dangles.py`'s per-finding reporting style); SC-004
- **Affected surfaces**: `tools/lint-doc-paths.py` (new), `Makefile`
- **Sequencing/depends-on**: **terminal gate — runs last, after IC-01 and IC-03 are both
  complete.** The script itself can be authored in parallel with IC-01/IC-03, but its
  FR-009 "reports zero unexplained dangling paths for FR-001 through FR-008 and FR-013"
  acceptance criterion can only be truthfully verified once those FRs' files have actually
  landed. Per this plan's resolved decision on lint allow-list scope: **do a full
  `.gitignore` cross-reference pass now** (not just seed the known `.cursor/`/`.claude/`
  entries) — cross-reference every gitignored-but-documented-as-generated path found across
  `.gitignore` against doc mentions, resolving the spec's former Open Question 1 in full
  rather than deferring further.
- **Risks**: the BLOCKER-severity finding from the post-spec squad (self-referential/
  tautological acceptance criterion) is already addressed in the spec's FR-009 — implementer
  must ship the fixture-based inject-and-detect test, not just a clean-state check. Detection
  grammar (backtick-quoted repo-relative path tokens in `.md` files only) is pinned in the
  spec; do not silently broaden or narrow it without updating the spec first.

### IC-03 — Gemini Bot Georgia repoint to `regnology-ps-chatbots`

- **Purpose**: Repoint `gemini-bot-georgia.agent.yaml`, its six `pack/templates/gemini/*`
  files, the three surface-description docs, and `.gitignore`'s dead rules away from the
  retired local `gemini-agents/` directory to the live `regnology-ps-chatbots` repository's
  actual `gemini-agents/shared/{glossary,branding}/` layout.
- **Relevant requirements**: FR-012, FR-013, FR-014; NFR-003 (edited/new Markdown — the three
  surface docs and the five `.template.md` files — passes the repository's existing
  `.markdownlint.yaml` rules with 0 new violations); SC-005, SC-006
- **Affected surfaces**: `pack/agent_profiles/gemini-bot-georgia.agent.yaml`,
  `pack/templates/gemini/*` (6 files), `pack/README.md`, `pack/agent_profiles/README.md`,
  `docs/SURFACES.md`, `.gitignore`
- **Sequencing/depends-on**: none on IC-01/IC-02, but has a **precondition on itself**: per
  this plan's resolved decision on Georgia-repoint sequencing, **immediately before starting
  this concern's implementation**, re-verify `regnology-ps-chatbots`'s live
  `gemini-agents/roster.yaml` and `shared/{glossary,branding}/` structure against this spec's
  2026-07-06 snapshot — the sibling mission `receptionist-rob-front-door-rework`
  (MIGRATION-2848) is concurrently restructuring that exact `roster.yaml` file. If the live
  structure has changed since the snapshot, update this concern's target state before editing
  rather than implementing against a stale assumption.
- **Definition of Done (markdownlint, NFR-003)**: run `markdownlint` (or the repository's
  equivalent config check) against the edited `pack/README.md`,
  `pack/agent_profiles/README.md`, `docs/SURFACES.md`, and the five edited
  `pack/templates/gemini/*.template.md` files and confirm 0 new violations before considering
  this concern complete.
- **Risks**: C-002 (must not touch profile-id/roles/routing-priority/roster wiring — only
  path/prose fields describing *where* output lands) is the main guardrail against scope
  creep here. `.gitignore`'s three dead `gemini-agents/onboarding-odysseus/...` rules (found
  by Doctrine Daphne's `--hidden` re-search) are easy to miss if the implementer only
  greps `.md` files — this concern explicitly includes `.gitignore`, not just docs/templates.
  No `pack/.pack-version` bump (per R3; Directive 006's actual version-bump triggers — new
  required directives, breaking structural changes to step contracts, or removal of
  artifacts — are not met by FR-013's path-only corrections). `.gitignore` and the
  surface-doc prose this concern edits (`pack/README.md`, `pack/agent_profiles/README.md`,
  `docs/SURFACES.md`) are non-DRG-node kinds: `pack/drg/fragment.yaml`'s own kind-universe
  comment (the same one C-001 cites for `pack/templates/*`) admits only `directives, tactics,
  styleguides, toolguides, paradigms, procedures, agent_profiles, and mission_*` kinds, and
  neither `tools/compile-drg.py` nor `tools/triage-drg-dangles.py` references `.gitignore` at
  all (verified by grep) — so removing stale `.gitignore` rules or stale doc mentions here
  cannot create dangling DRG edges.

### Execution lanes & sequencing topology (for `/spec-kitty.tasks`)

```
Phase 0 (parallel-safe):
  WP-A  IC-01  (doc-drift corrections — AGENTS.md, CLAUDE.md, README.md)
  WP-B  IC-03  (Georgia repoint — profile, templates, surface docs, .gitignore;
                re-verify regnology-ps-chatbots live structure as first task step)

Phase 1 (terminal gate — after WP-A and WP-B both land):
  WP-C  IC-02  (lint script + full .gitignore allow-list pass + Makefile wiring +
                fixture test; final "zero dangling paths" run against the post-WP-A/B state)
```

| WP | Contains | Requires | Primary outputs |
|----|----------|----------|-----------------|
| WP-A | IC-01 | — | Corrected `AGENTS.md`, `CLAUDE.md`, `README.md` |
| WP-B | IC-03 | — (re-verify `regnology-ps-chatbots` as first step) | Repointed `gemini-bot-georgia.agent.yaml`, 6 templates, 3 surface docs, cleaned `.gitignore` |
| WP-C | IC-02 | WP-A, WP-B | `tools/lint-doc-paths.py`, fixture test, `Makefile` target, seeded allow-list, green terminal run |

### Phase 0 research items (resolved in research.md)

1. Georgia-repoint sequencing given the in-flight `receptionist-rob-front-door-rework`
   sibling mission (spec Assumptions / former plan-phase deferral). → R1.
2. Lint allow-list completeness (spec's former Open Question 1). → R2.
3. `pack/.pack-version` bump for FR-013's template corrections (spec's former Open
   Question 2). → R3.
4. `.kittify/charter/charter.md` staleness re: `gemini-agents/` (new finding, this plan's
   Charter Check). → R4.
5. `README.md` dangling-path resolution: correct-in-place vs. remove, per path (spec
   Assumptions section, FR-005/FR-006/FR-008). → R5.

## Next Steps

Per C-004, this mission run is scoped to plan phase only. The user must explicitly invoke
`/spec-kitty.tasks` (or an equivalent tasks-generation step) to convert the Implementation
Concern Map above into executable work packages. Do not proceed to task generation or
implementation without that explicit instruction.

**Branch contract (repeated per plan workflow):** current branch at plan start: `main`
(mission was retargeted mid-plan-phase; see `meta.json` and commits `62f6a57`/`72b9ee5`).
Planning/base branch for this feature: `feature/migration-2915-structural-alignment`.
Completed changes must merge into: `feature/migration-2915-structural-alignment` (then
onward to `main` via normal PR flow). `branch_matches_target`: true as of this correction —
`meta.json`'s `target_branch` is `feature/migration-2915-structural-alignment` and all
plan-phase artifacts are committed there, not on `main`.
