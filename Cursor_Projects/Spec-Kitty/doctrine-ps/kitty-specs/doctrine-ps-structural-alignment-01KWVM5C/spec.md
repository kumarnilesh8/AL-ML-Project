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

# Specification: Doctrine-PS Structural Alignment

**Mission:** `doctrine-ps-structural-alignment-01KWVM5C`
**Type:** software-dev
**Status:** Draft (specify)
**Created:** 2026-07-06
**Evidence base:** Independent on-disk verification performed during this specify session
(see citations inline per requirement); originating investigation: an `architect-alphonso`
audit invocation (`kitty-ops/01KWVHTDETQCF702JS0GXK1G7N.jsonl`, 2026-07-06) that flagged
structural drift between `CLAUDE.md`/`AGENTS.md`/`pack/README.md` and the on-disk repository.

## Summary

`AGENTS.md`, `CLAUDE.md`, and `README.md` describe repository structure, toolguide paths,
and a directive catalogue that no longer match what exists on disk. Separately, the
`gemini-bot-georgia` agent profile and its six output templates still describe a retired
local `gemini-agents/` directory as Georgia's generation target, when that deliverable was
extracted to a new dedicated repository, `regnology-ps-chatbots`, on 2026-07-03. This mission
reconciles the documentation with verified reality, repoints Georgia and her templates at the
new repository's actual layout, and adds a lightweight lint script so this class of
doc-path drift is caught automatically going forward.

## Background & Motivation

Every claim below was independently verified against the live repository during this
specify session (not merely restated from the originating audit prompt):

- **`.cursor/`/`.claude/` claimed as committed structure.** `AGENTS.md` §8 and `CLAUDE.md`
  both describe `.cursor/` and `.claude/` as existing repository directories. Neither exists
  on disk (`ls .cursor` / `ls .claude` → "No such file or directory"). `README.md` § "Local
  Agent And IDE Harnesses" already documents the accurate model: these are gitignored,
  locally generated from `tools/surfaces/`, and never committed.
- **`src/framework/**` + `tests/framework|orchestration|integration|unit` + `fixtures/`
  claimed as the runtime layout.** `CLAUDE.md` § "Repository Structure & Key Directories"
  and `AGENTS.md` §8 both describe an elaborate `src/framework/{core,execution,interface,
  orchestration,context,config,schemas}` runtime tree, a matching `tests/{framework,
  orchestration,integration,unit}` tree, and a `fixtures/{prompts,copilot,opencode,agents}`
  tree. On disk: `src/` contains only `.gitkeep`; `tests/` contains only
  `test_pack_schema_validation.py` (plus `__init__.py`/`__pycache__`) — no `framework/`,
  `orchestration/`, `integration/`, or `unit/` subdirectories; `fixtures/` does not exist at
  all.
- **`pack/tools/fallback/agentic_model_leaderboard.yaml` claimed as a local toolguide
  path.** `pack/tools/` does not exist in this repository (`find pack/tools` →
  "No such file or directory"; top-level `ls pack/` confirms no `tools/` entry). `pack/
  org-charter.yaml` line 26 declares `extends: regnology-all-company`, and its own comment
  (lines 37–38) states the `agentic-model-leaderboard` toolguide "is inherited from the
  parent layer" — the file is real, but it lives in the upstream `regnology-all-company`
  pack, not at a local `pack/tools/fallback/` path in this repository.
- **`AGENTS.md` §9 directive index overstates locally-authored directive count.**
  §9's table links 12 directive codes as `[pack]` (006, 018, 022, 023, 028, 037, 038, 041,
  042, 043, 044, 050) and its closing line states "Location: `pack/directives/` (12 migrated
  YAML artifacts)." `ls pack/directives/` shows only **two** of those twelve actually exist
  locally: `037-context-aware-design.directive.yaml` and
  `050-ad-hoc-prompt-capture.directive.yaml` (plus two unrelated, unnumbered directives —
  `meeting-minutes-action-item-attribution.directive.yaml` and
  `minutes-stand-alone.directive.yaml` — that back `org-charter.yaml`'s
  `required_directives: [ACTION_ITEM_ATTRIBUTION, MINUTES_STAND_ALONE]`). The other ten
  (006, 018, 022, 023, 028, 038, 041, 042, 043, 044) are inherited from `regnology-all-company`
  via `extends:`, consistent with `org-charter.yaml`'s own framing that PS-local directives
  are additive to an inherited baseline — but §9 links to them as if they resolve locally.
- **`README.md` has its own smaller set of dangling paths**, verified individually:
  - `docs/HOW_TO_USE.md` (README.md § "Repository Structure" tree, line ~147) does not
    exist; the real path is `docs/installation/HOW_TO_USE.md` (confirmed via
    `ls docs/installation/`). Note README.md's prose links elsewhere (lines 41, 120, 258)
    already use the correct `docs/installation/HOW_TO_USE.md` path — only the tree diagram
    entry is wrong.
  - `pack/mission_step_contracts/` (README.md "Pack Contents" table and Repository
    Structure tree) does not exist (`ls pack/mission_step_contracts` →
    "No such file or directory"; `ls pack/` confirms no such entry).
  - `pack/tools/fallback/` (same Repository Structure tree) does not exist, same root
    cause as the `AGENTS.md` toolguide finding above (inherited from the parent pack).
  - `tools/pack-dashboard/` (README.md Repository Structure tree, described as an
    "Angular + Express pack health dashboard") does not exist; `ls tools/` shows only
    `compile-drg.py`, `surfaces/`, and `triage-drg-dangles.py`.
- **Gemini Bot Georgia targets a retired local directory.** `gemini-agents/` does not exist
  anywhere in this repository (`ls gemini-agents` → "No such file or directory"), yet
  `pack/agent_profiles/gemini-bot-georgia.agent.yaml` references `gemini-agents/<chatbot-
  slug>/...`, `gemini-agents/roster.yaml`, and `gemini-agents/glossary/README.md` in its
  `purpose`, `specialization` (primary-focus, secondary-awareness, avoidance-boundary,
  success-definition), `collaboration.output-artifacts`, and `initialization-declaration`
  fields (15+ occurrences). The deliverable now lives in a dedicated repository,
  `regnology-ps-chatbots` (local clone verified at
  `/home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots`, remote
  `ssh://git@bitbucket.regnology.net:7999/cons/regnology-ps-chatbots.git`), extracted from
  `doctrine-ps` on 2026-07-03 per that repo's own `docs/status.md` and `README.md`. Its
  actual `gemini-agents/` layout (verified by listing the clone) is **not** identical to
  what Georgia's profile and templates describe: it now has a `gemini-agents/shared/`
  subdirectory holding `shared/glossary/` and `shared/branding/` (flat `gemini-agents/
  glossary/` and `gemini-agents/branding/`, as referenced by the profile and by
  `pack/templates/gemini/*`, no longer match). `regnology-ps-chatbots/docs/status.md`
  §"Open follow-ups" already names this exact gap: *"Generator/template divergence: the
  `shared/` restructure here diverges from what Gemini Bot Georgia generates upstream from
  `doctrine-ps` (`pack/templates/gemini/` currently produces a flat `gemini-agents/
  glossary/` layout). Needs a companion ticket to update the generator templates."* This
  mission is that companion ticket.
- **Other `gemini-agents/` references found by repo-wide search**
  (`rg -l "gemini-agents" -g '!gemini-agents/**'`, excluding this mission's own working
  files and the historical, already-merged `doctrine-pack-remediation-georgia-templates-
  01KWCBN5` mission directory): `docs/SURFACES.md`, `pack/README.md`,
  `pack/agent_profiles/README.md`, and the six files under `pack/templates/gemini/`
  (`set-up-guide.template.md`, `about.template.md`, `per-agent-folder.template.md`,
  `instructions.template.md`, `review-submission.template.md`, `roster.template.yaml`).
  `docs/pack-migration-plan.md` was also checked (per the originating prompt's instruction
  to search rather than guess): it only mentions `gemini-bot-georgia` as a profile name in
  a migration-tracking table, not a live `gemini-agents/` path — **verified, no change
  needed there.**

## User Scenarios & Testing

- **Agent bootstrapping in this repo** reads `AGENTS.md`/`CLAUDE.md` per Directive-mandated
  bootstrap, follows a referenced path or directive link, and finds it resolves to a real
  file or an explicit "inherited from the parent pack" note — not a dead end.
- **PS engineer onboarding via `README.md`** clicks or greps every path in the Repository
  Structure tree and Key Documentation table and finds each one exists.
- **Pack maintainer reviewing a future PR** runs the new lint target locally before pushing
  and gets an actionable list of any newly introduced dangling doc-path reference, instead
  of discovering it only when a human stumbles on it (as happened here).
- **Operator following Gemini Bot Georgia's instructions** (via her profile, or via the
  operator-facing templates she fills) is told to look for generated files under the
  `regnology-ps-chatbots` repository's actual `gemini-agents/` layout — including its
  `shared/glossary/` and `shared/branding/` subdirectories — never under a local
  `gemini-agents/` directory inside `doctrine-ps`.
- **Pack maintainer reviewing `pack/README.md` / `pack/agent_profiles/README.md` /
  `docs/SURFACES.md`** finds the "two agent surfaces" split still explained, but now
  correctly locates the Gemini chatbot surface in the separate `regnology-ps-chatbots`
  repository rather than implying it is a directory inside `doctrine-ps`.

### Edge Cases

- What happens when a documented path is intentionally aspirational (describes a
  not-yet-built target state rather than current reality)? The correction must either
  remove the aspirational claim, replace it with the current actual state, or explicitly
  label it as a planned/future structure — it must not silently remain phrased as present
  fact.
- How should the lint script treat obviously templated placeholders that look like paths
  but are not (e.g., `{chatbot-slug}/`, `<feature_dir>/spec.md`, `[MISSION NAME]`)? These
  must not be flagged as dangling.
- How should the lint script treat paths that are valid only after cross-layer resolution
  (i.e., they resolve inside the inherited `regnology-all-company` pack, not locally)? These
  must not be flagged as dangling when the surrounding prose already documents the
  inheritance (as `tools/triage-drg-dangles.py` already does for DRG edges); the plan phase
  must decide the concrete detection or allow-listing mechanism.
- What happens if the `regnology-ps-chatbots` repository's `shared/` layout changes again
  before this mission reaches implementation? The plan phase must re-verify the target
  layout against that repository at implementation time rather than trusting this spec's
  snapshot indefinitely.

## Functional Requirements

Index (detailed description, acceptance criteria, and rationale for each FR follow this
table as `### FR-###` sections below):

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| FR-001 | Correct `.cursor/`/`.claude/` claims in `AGENTS.md` and `CLAUDE.md` | High | Open |
| FR-002 | Correct `src/framework`, `tests/*`, and `fixtures/` structural claims | High | Open |
| FR-003 | Correct the `pack/tools/fallback/agentic_model_leaderboard.yaml` toolguide reference | Medium | Open |
| FR-004 | Reconcile `AGENTS.md` §9's directive index with `pack/directives/` reality | Medium | Open |
| FR-005 | Fix `README.md`'s `docs/HOW_TO_USE.md` path | Low | Open |
| FR-006 | Fix or remove `README.md`'s `pack/mission_step_contracts/` reference | Low | Open |
| FR-007 | Fix or annotate `README.md`'s `pack/tools/fallback/` reference | Low | Open |
| FR-008 | Fix or remove `README.md`'s `tools/pack-dashboard/` reference | Low | Open |
| FR-009 | Add a doc-path dangle lint script | High | Open |
| FR-010 | Allow-list documented-as-generated-but-gitignored paths | Medium | Open |
| FR-011 | Wire the lint script into the `Makefile` | Medium | Open |
| FR-012 | Repoint `gemini-bot-georgia.agent.yaml` to `regnology-ps-chatbots` | High | Open |
| FR-013 | Update the six `pack/templates/gemini/*` files | High | Open |
| FR-014 | Update surface-description docs for the relocated `gemini-agents/` surface | Medium | Open |

### FR-001: Correct `.cursor/`/`.claude/` claims in `AGENTS.md` and `CLAUDE.md`

Both files' descriptions of `.cursor/` and `.claude/` as committed repository directories
must be corrected to match `README.md`'s already-accurate model: generated, gitignored, and
regenerated locally from `tools/surfaces/`.

**Acceptance criteria:**

- `AGENTS.md` §8's repository-structure listing does not list `.cursor/` or `.claude/` as
  bare directory entries; each mention is grep-verifiable as carrying an explicit
  non-committed marker (e.g. the words "gitignored" or "generated locally") in the same
  line or bullet.
- `CLAUDE.md`'s repository structure description carries the same correction (or a cross-
  reference to `README.md`'s accurate explanation) rather than a conflicting claim.
- No prose elsewhere in either file contradicts the corrected model.
- This criterion is outside the FR-009 lint's automated coverage — the lint only detects
  dangling paths, not mischaracterized-but-existing ones — so it is verified by grep/manual
  review, not by the lint passing (see SC-004's note).

### FR-002: Correct `src/framework`, `tests/*`, and `fixtures/` structural claims

`AGENTS.md` §8 and `CLAUDE.md`'s repository-structure sections must reflect the actual
current state of `src/`, `tests/`, and `fixtures/` (or explicitly and unambiguously mark
the described tree as a not-yet-implemented target rather than current fact).

**Acceptance criteria:**

- The structural description does not state as present fact that `src/framework/**`,
  `tests/{framework,orchestration,integration,unit}/`, or `fixtures/{prompts,copilot,
  opencode,agents}/` exist, except within a section whose heading (or immediately preceding
  line) carries an explicit aspirational marker such as "Planned" or "Not yet implemented" —
  grep-verifiable by confirming no occurrence of these path strings exists outside such a
  marked section.
- The actual current state (`src/` = `.gitkeep` only; `tests/` = `test_pack_schema_
  validation.py` only; `fixtures/` absent) is discoverable from the corrected docs.
- This criterion is outside the FR-009 lint's automated coverage (same reasoning as
  FR-001) — verified by grep/manual review, not by the lint passing (see SC-004's note).

### FR-003: Correct the `pack/tools/fallback/agentic_model_leaderboard.yaml` toolguide reference

`AGENTS.md`'s reference to `pack/tools/fallback/agentic_model_leaderboard.yaml` (Model
Discipline / Directive 042 section) must be corrected to note that this toolguide is
inherited from the `regnology-all-company` parent pack via `extends:` in `pack/org-
charter.yaml`, not a local file in this repository.

**Acceptance criteria:**

- The reference no longer implies a local `pack/tools/fallback/` path exists in this
  repository.
- The corrected text explains (or links to an explanation of) the `extends:` inheritance
  model so a reader knows where the file actually resolves from.

### FR-004: Reconcile `AGENTS.md` §9's directive index with `pack/directives/` reality

§9's directive index table and its closing "12 migrated YAML artifacts" claim must be
corrected so that only directives actually present under `pack/directives/` in this
repository are linked as locally resolving, and the remainder are explicitly marked as
inherited from the parent pack rather than linked as if local.

**Acceptance criteria:**

- Directives 037 and 050 (the only two confirmed present under `pack/directives/` at
  verification time) remain linked as `[pack]` local artifacts.
- Directives 006, 018, 022, 023, 028, 038, 041, 042, 043, 044 are re-labeled to indicate
  inheritance from `regnology-all-company` (not linked as if a local file exists), or their
  links are updated to point at wherever they are actually discoverable (e.g., via
  `spec-kitty doctrine pack` inspection tooling) if such a path exists.
- The "(12 migrated YAML artifacts)" count is corrected to reflect what is actually true
  locally vs. inherited.

### FR-005: Fix `README.md`'s `docs/HOW_TO_USE.md` path

**Acceptance criteria:**

- The Repository Structure tree in `README.md` references `docs/installation/HOW_TO_USE.md`
  (matching the already-correct prose links elsewhere in the same file), not
  `docs/HOW_TO_USE.md`.

### FR-006: Fix or remove `README.md`'s `pack/mission_step_contracts/` reference

**Acceptance criteria:**

- `README.md`'s "Pack Contents" table and Repository Structure tree no longer claim a
  `pack/mission_step_contracts/` directory with a "6 contracts" count unless such a
  directory is created as part of this mission (out of scope — see Out of Scope). The
  reference is corrected to match actual `pack/` contents or removed.

### FR-007: Fix or annotate `README.md`'s `pack/tools/fallback/` reference

**Acceptance criteria:**

- Same correction/inheritance-annotation approach as FR-003, applied to `README.md`'s
  Repository Structure tree entry for `pack/tools/fallback/`.

### FR-008: Fix or remove `README.md`'s `tools/pack-dashboard/` reference

**Acceptance criteria:**

- `README.md`'s Repository Structure tree no longer describes a `tools/pack-dashboard/`
  ("Angular + Express pack health dashboard") subdirectory that does not exist, unless it is
  clearly labeled as a reference to a separate, named repository/deliverable rather than a
  local path.

### FR-009: Add a doc-path dangle lint script

A new script (e.g. `tools/lint-doc-paths.py`) must scan tracked `.md` files for backtick-
quoted or inline repo-relative paths and flag any that do not resolve to an existing file or
directory on disk, following this repository's existing tooling conventions (see
`tools/triage-drg-dangles.py` and `tools/compile-drg.py`: Regnology branding header comment
block, module docstring explaining purpose/usage, argparse-based CLI, explicit exit codes).

**Detection scope:** the lint scans backtick-quoted, repo-relative path tokens matching a
pattern like `^[\w.\-]+/[\w./\-]*$` inside tracked `.md` files. A path is "explained" (not
flagged) only if it or its prefix appears in the FR-010 allow-list — surrounding prose that
merely documents inheritance or context does not itself satisfy the lint, since "the prose
already explains it" is too subjective a state for automated detection. Prose-based
justification of a path is a human-review concern, not something the lint itself evaluates.

**Whole-file exclusion (frozen/historical documents):** the lint may additionally exclude
entire tracked `.md` files or path prefixes from the scan when they are frozen, point-in-time,
or historical documents whose path references were accurate at authoring time and are not
maintained prose (as opposed to living documentation this mission corrects). The initial
exclusion set is: `kitty-specs/` (mission planning artifacts, frozen once a mission merges),
`.kittify/` (runtime state, not prose), `docs/decisions/` (DDRs — point-in-time decision
records), `docs/engineering_notes/` (dated notes), `CHANGELOG.md` (historical release entries),
`docs/pack-migration-plan.md`, and `docs/AGENT_MIGRATION_GUIDANCE.md` (migration-era references
to a since-completed migration). Each exclusion must carry an inline comment explaining why the
file/prefix is frozen rather than living documentation. This is a distinct mechanism from the
FR-010 target-path allow-list: the allow-list explains individual *paths* that are expected to
be missing; whole-file exclusion scopes *which files* are checked at all. Expanding this set
beyond the initial list requires the same "frozen/historical, not living documentation"
justification, documented inline.

**Acceptance criteria:**

- The script runs standalone (`python3 tools/lint-doc-paths.py`) from the repository root
  with no required arguments, consistent with the existing tools' invocation style.
- For each dangling path found, output identifies the source file, and where feasible the
  line, and the offending path string (actionable, not just a count).
- Exit code is non-zero when at least one unexplained dangling path is found, zero
  otherwise (mirroring `triage-drg-dangles.py`'s exit-code contract).
- Given a `.md` file containing a deliberately non-existent repo-relative path (e.g.
  `docs/DOES_NOT_EXIST_FIXTURE.md`), the lint script must exit non-zero and name the
  offending file and path; after the fixture file/path is removed, the script must exit
  zero. This must be implemented as an actual fixture-based test the implementer ships, not
  merely a manual claim.
- Running it against the repository state produced by this mission's other FRs reports zero
  unexplained dangling paths for the specific references named in FR-001 through FR-008 and
  FR-013 below. Note: FR-012 (`gemini-bot-georgia.agent.yaml`, a `.yaml` file) is outside
  this `.md`-scoped lint's reach and must be verified by manual review/grep instead.

### FR-010: Allow-list documented-as-generated-but-gitignored paths

The lint script must not flag paths that are gitignored but explicitly documented as
generated (at minimum `.cursor/` and `.claude/`, per `README.md`'s accurate model).

**Acceptance criteria:**

- An allow-list mechanism exists in the script (e.g., a constant list or config block) with
  an inline comment explaining *why* each entry is excluded (generated + gitignored, not
  merely "ignore this").
- `.cursor/` and `.claude/` are present in the allow-list with that justification.

### FR-011: Wire the lint script into the `Makefile`

**Acceptance criteria:**

- A new `Makefile` target (e.g. `lint-doc-paths`) invokes the script, following the
  existing `validate-pack`/`compile-drg` target conventions: a header-comment-block entry
  describing the target's purpose, `.PHONY` inclusion, and clear `@echo`-style status
  output.
- The `help` target's output is updated to list the new target alongside the existing ones.
- The target is **not** added to `Jenkinsfile` (CI) or any pre-commit hook configuration as
  part of this mission (see Constraints).

### FR-012: Repoint `gemini-bot-georgia.agent.yaml` to `regnology-ps-chatbots`

`pack/agent_profiles/gemini-bot-georgia.agent.yaml`'s `purpose`, `specialization` (primary-
focus, secondary-awareness, avoidance-boundary, success-definition),
`collaboration.output-artifacts`, and `initialization-declaration` fields must describe
Georgia generating output into the `regnology-ps-chatbots` repository's actual `gemini-
agents/` layout (including its `shared/glossary/` and `shared/branding/` subdirectories),
not a local `gemini-agents/` directory inside `doctrine-ps`.

**Acceptance criteria:**

- Every occurrence of a bare `gemini-agents/...` path in the fields listed above is updated
  to reflect that the target is the `regnology-ps-chatbots` repository (verified structure,
  not invented), including the `shared/` subdirectory split for glossary and branding
  assets.
- Georgia's `profile-id`, `roles`, `routing-priority`, `capabilities`,
  `context-sources`, `collaboration.handoff-from/handoff-to/works-with`,
  `mode-defaults`, `specialization-context`, `directive-references`, and
  `styleguide-references` fields are **unchanged** (see Constraints — only the output
  target changes, not Georgia's identity or wiring).

### FR-013: Update the six `pack/templates/gemini/*` files

`pack/templates/gemini/instructions.template.md`, `about.template.md`, `set-up-guide.
template.md`, `review-submission.template.md`, `per-agent-folder.template.md`, and
`roster.template.yaml` must have their embedded example paths corrected to match
`regnology-ps-chatbots`'s actual layout (e.g., `gemini-agents/glossary/` →
`gemini-agents/shared/glossary/`, `gemini-agents/branding/` → `gemini-agents/shared/
branding/`), resolving the divergence already flagged in `regnology-ps-chatbots/docs/
status.md` § "Open follow-ups".

**Acceptance criteria:**

- All six files' path examples match the verified `regnology-ps-chatbots` layout.
- The templates continue to describe the same output-structure contract (file roles,
  required sections, avatar generation rules) — only the embedded path examples change,
  not the structural contract itself, unless plan-phase verification finds the contract
  itself has also drifted.

### FR-014: Update surface-description docs for the relocated `gemini-agents/` surface

`pack/README.md` § "Two agent surfaces", `pack/agent_profiles/README.md`, `docs/
SURFACES.md`'s `gemini-agents/` entries, and `.gitignore`'s stale `gemini-agents/` rules
must be updated to state that the Gemini chatbot surface lives in the separate
`regnology-ps-chatbots` repository, not as a directory inside `doctrine-ps`, while
preserving the existing "two agent surfaces / never mixed" conceptual split these documents
establish. A repo-wide search including dotfiles (`rg -l --hidden "gemini-agents"`) found
three now-dead `gemini-agents/onboarding-odysseus/...` ignore rules and a comment
referencing `gemini-agents/README.md` in `.gitignore`, even though no such directory exists
and no tracked files match — the original background search (`rg -l "gemini-agents"`,
without `--hidden`) missed this dotfile.

**Acceptance criteria:**

- `pack/README.md`, `pack/agent_profiles/README.md`, and `docs/SURFACES.md` no longer
  describe `gemini-agents/` as if it is a committed directory inside `doctrine-ps`.
- The "two agent surfaces" distinction (productivity agents in `pack/agent_profiles/` vs.
  Gemini chatbots) remains intact and cross-references the `regnology-ps-chatbots`
  repository as the concrete location of the chatbot surface.
- `.gitignore`'s dead `gemini-agents/onboarding-odysseus/...` ignore rules and the
  `gemini-agents/README.md` comment are corrected or removed so the "zero stale
  `gemini-agents/` references" success criterion holds repo-wide, not just across `.md`
  files.

## Non-Functional Requirements

| ID | Requirement | Threshold | Status |
| --- | --- | --- | --- |
| NFR-001 | Lint script runs fast enough for routine local use. | Completes a full scan of this repository's tracked `.md` files in under 10 seconds on a typical developer machine. | Proposed |
| NFR-002 | Lint script output is actionable without re-deriving context. | Every reported finding names the source file and the exact offending path string (mirrors `triage-drg-dangles.py`'s per-finding reporting style). | Proposed |
| NFR-003 | Edited/new Markdown passes existing lint config. | All edited and newly created `.md` files pass the repository's existing `.markdownlint.yaml` rules with 0 new violations. | Proposed |

## Constraints

| ID | Constraint | Status |
| --- | --- | --- |
| C-001 | `pack/drg/fragment.yaml` and any compiled `pack/drg/*.graph.yaml` are **not** modified by this mission. No edge change is required for the `gemini-bot-georgia` repoint. Confirmed during specify: (a) all of Georgia's existing DRG edges (`delegates_to`, `requires`, `applies`) encode role/capability relationships only, never her output path — grep of `pack/drg/fragment.yaml` for `gemini-bot-georgia` confirms zero edges reference `gemini-agents/` or any path string; (b) `pack/templates/*` are not a valid DRG node kind at all per the fragment's own documented kind universe, so the six template files FR-013 touches cannot have DRG edges to begin with; (c) `docs/SURFACES.md` and `pack/README.md` already independently describe `gemini-agents/` as "Not a DRG input". | Active |
| C-002 | `gemini-bot-georgia`'s `profile-id`, `roles`, `routing-priority`, and collaboration/roster wiring remain unchanged; only the fields describing *where* her output lands (paths, purpose/specialization prose) change. | Active |
| C-003 | The new lint script/Makefile target is **not** wired into `Jenkinsfile` (CI) or any pre-commit hook in this mission — it is a locally-invocable target only, pending a separate decision to enforce it. | Active |
| C-004 | This mission run is scoped to the **specify** phase only. `plan.md`, `tasks.md`, and implementation are out of scope for this mission run and must not be produced until this spec is reviewed/approved. | Active |
| C-005 | No changes are made to the `regnology-ps-chatbots` repository itself; it is read-only reference material for this mission. | Active |
| C-006 | Regnology branding headers and licensing (Directive 041) are preserved on all edited files and added to the new lint script. | Active |
| C-007 | Corrections must not relax, weaken, or bypass the inherited `regnology-all-company` baseline (this repo's PS-departmental layering rule). | Active |

## Success Criteria

- **SC-001** — A fresh reader of `AGENTS.md`/`CLAUDE.md` can resolve every path reference in
  the repository-structure sections to either an existing file/directory or an explicit
  "inherited from the parent pack" annotation — zero silent dead paths.
- **SC-002** — `AGENTS.md` §9's directive links, cross-checked against `ls pack/directives/`,
  contain zero links presented as locally resolving when the artifact is not actually
  present on disk.
- **SC-003** — `README.md`'s Repository Structure tree and Key Documentation table contain
  zero paths that fail existence verification (`docs/HOW_TO_USE.md`,
  `pack/mission_step_contracts/`, `pack/tools/fallback/`, `tools/pack-dashboard/` all
  resolved or removed).
- **SC-004** — Running the new lint script against the post-mission repository state
  reports zero unexplained dangling doc-path references **for the specific references named
  in FR-001 through FR-008 and FR-013** (allow-listed and whole-file-excluded paths excepted),
  matching FR-009's own acceptance-criterion scope verbatim — this is not a literal
  whole-repository-zero requirement. Pre-existing dangling paths in files this mission does
  not touch (e.g. `pack/glossary/**`, `pack/toolguides/**`, `docs/installation/**`) are
  out of scope for this mission and are not required to be zero for SC-004 to pass; they are
  pre-existing drift the lint tool now makes visible for a future, separate cleanup. Note:
  SC-004 (lint clean) does **not** by itself prove FR-001/FR-002 are satisfied — those require
  the separate grep-verifiable checks and/or manual review described in FR-001/FR-002's
  acceptance criteria, since the lint's `.md`-path-token scope covers dangling paths, not
  mischaracterized-but-existing ones.
- **SC-005** — Zero remaining references across `gemini-bot-georgia.agent.yaml` and the six
  `pack/templates/gemini/*` files imply Georgia's generated output lands in a local
  `gemini-agents/` directory inside `doctrine-ps`; all such references instead describe the
  verified `regnology-ps-chatbots` layout.
- **SC-006** — `pack/README.md`, `pack/agent_profiles/README.md`, and `docs/SURFACES.md`
  consistently describe the Gemini chatbot surface as living in `regnology-ps-chatbots`,
  with no contradictions between the three documents.

## Key Entities

- **Governance/onboarding docs** — `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/SURFACES.md`,
  `pack/README.md`, `pack/agent_profiles/README.md`.
- **Gemini agent profile** — `pack/agent_profiles/gemini-bot-georgia.agent.yaml`.
- **Gemini output-structure templates** — the six files under `pack/templates/gemini/`.
- **Target repository (reference only)** — `regnology-ps-chatbots`
  (`/home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots`), specifically its
  `gemini-agents/` tree (`roster.yaml`, `shared/glossary/`, `shared/branding/`, per-agent
  folders) and `docs/status.md`/`README.md`.
- **New lint tool** — `tools/lint-doc-paths.py` and its `Makefile` target.

## Assumptions

- `pack/templates/gemini/` remains the canonical, authoritative definition of Georgia's
  output-structure contract and continues to live in `doctrine-ps` (not migrated to
  `regnology-ps-chatbots`) — this is explicitly corroborated by
  `regnology-ps-chatbots/gemini-agents/README.md`'s own "Cross-repo paths" note, which
  tells readers that `pack/` paths refer to `doctrine-ps`. Only the templates' *embedded
  path examples* change in this mission, not their ownership/location.
- The `regnology-ps-chatbots` repository's `gemini-agents/shared/{glossary,branding}/`
  layout, as observed on 2026-07-06, is the correct current target structure for Georgia's
  profile and templates to describe. This assumption carries a concrete, named risk: a
  sibling, same-day, in-flight mission in `regnology-ps-chatbots` —
  `receptionist-rob-front-door-rework` (parent Jira ticket MIGRATION-2848) — is actively
  restructuring `roster.yaml` (the exact file FR-013 edits), including dropping the
  `navigator: navigator-nemo` top-level key and adding a new `shared/commands/` bucket. The
  plan phase must either sequence FR-012/FR-013/FR-014 to land after that sibling mission
  merges, or explicitly re-verify `regnology-ps-chatbots`'s live structure against this
  spec's assumptions immediately before implementing FR-012/FR-013/FR-014 — whichever it
  decides; this spec does not mandate a specific sequencing choice.
- For each dangling `README.md` path (FR-005/FR-006/FR-008), the choice between "correct the
  path" and "remove the reference entirely" is a plan-phase decision guided by whether the
  underlying concept still needs documenting; this spec requires the dangling state be
  resolved one way or the other, not a specific resolution per path.

## Out of Scope

- Editing `pack/drg/fragment.yaml` or any compiled `pack/drg/*.graph.yaml` (see C-001 — no
  edge change is required, confirmed during specify).
- Any change to `gemini-bot-georgia`'s profile-id, roles, routing-priority, or collaboration/
  roster wiring (see C-002).
- Wiring the new lint script into `Jenkinsfile` (CI) or pre-commit hooks (see C-003).
- Any change to the `regnology-ps-chatbots` repository itself (see C-005).
- Creating a `pack/mission_step_contracts/` directory to make README.md's claim true by
  building the missing feature — FR-006 corrects the *documentation*, not the pack content.
- Creating a `tools/pack-dashboard/` Angular+Express application to make README.md's claim
  true — FR-008 corrects the *documentation*, not the missing tool.
- `docs/pack-migration-plan.md` — verified during this specify session to need no change
  (only mentions `gemini-bot-georgia` as a profile name in a tracking table, not a live
  `gemini-agents/` path).
- Fixing pre-existing dangling doc-paths discovered by the FR-009 lint tool in files this
  mission does not otherwise touch (e.g. `pack/glossary/**`, `pack/toolguides/**`,
  `docs/installation/**`) — surfaced as a side effect of WP03's implementation/review (see
  SC-004's scope note), this is unrelated pre-existing drift that the lint tool now makes
  visible for a future, separately scoped cleanup mission; resolving it is explicitly not
  required for this mission's SC-004 to pass.
- Reconciling `pack/.pack-version` (currently `2.0.0`) against `README.md`'s "Pack version
  `1.0.0`" claims — noticed during verification but outside the named scope of this mission;
  see Open Questions. Note: this is a version-number drift, a different drift class than the
  path-based drift FR-009's lint targets, and the lint is deliberately not built to catch it.
- Expanding scope to correct `AGENTS.md`'s "8 required directives" Mandatory Bootstrap
  Requirement claim and `README.md`'s "Pack Contents" § "8 required directives activated for
  every engagement" list — these were not part of the originally commissioned scope (which
  named only §9's directive index), and verification surfaced a related but distinct
  inconsistency: `pack/org-charter.yaml`'s own comment states "parent's 7 directives + 2
  here = 9 effective," not 8, and its `required_directives:` list names only
  `ACTION_ITEM_ATTRIBUTION`/`MINUTES_STAND_ALONE` locally. Confirming the true effective
  count requires inspecting the `regnology-all-company` parent pack, which is not available
  in this local checkout. This is a specify-time scope-boundary call, decided now rather than
  carried into plan: out of scope for this mission; may be tracked as a separate follow-up if
  warranted.
- `plan.md`, `tasks.md`, and implementation — this mission run stops at `spec.md` per C-004.

## Open Questions

1. **Lint allow-list completeness.** Beyond `.cursor/`/`.claude/`, are there other
   gitignored-but-documented-as-generated paths (e.g., `dist/`, `.doctrine-cache/`) that
   should be pre-seeded in the lint script's allow-list? Needs a plan-phase pass over
   `.gitignore` cross-referenced with doc mentions.
2. **Versioning impact of template changes.** `pack/.pack-version` is currently `2.0.0`.
   Do the `pack/templates/gemini/*` path corrections (FR-013) constitute a breaking change
   to Georgia's output contract under Directive 006 (Version Governance), warranting a
   version bump, or are they a non-breaking clarification (the structural contract itself is
   unchanged, only path examples)? Deferred to plan phase.
