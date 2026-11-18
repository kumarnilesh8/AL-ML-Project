---
work_package_id: WP01
title: Structural Documentation Drift Corrections
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
- NFR-003
tracker_refs: []
planning_base_branch: feature/migration-2915-structural-alignment
merge_target_branch: feature/migration-2915-structural-alignment
branch_strategy: Planning artifacts for this mission were generated on feature/migration-2915-structural-alignment. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/migration-2915-structural-alignment unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
- T007
- T008
- T009
history: []
authoritative_surface: AGENTS.md
create_intent: []
execution_mode: code_change
owned_files:
- AGENTS.md
- CLAUDE.md
- README.md
tags: []
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "3494946"
---

<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                 |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

## Objective

Correct `AGENTS.md`, `CLAUDE.md`, and `README.md` so their repository-structure claims,
toolguide/directive references, and dangling paths match on-disk reality. This is IC-01 from
`plan.md` — a self-contained, verification-oriented documentation pass with **no code
changes** and **no touching of `.cursor/`/`.claude/` themselves** (they are gitignored,
generated artefacts; you are only correcting *prose describing* them).

## Branch Strategy

- **Planning/base branch**: `feature/migration-2915-structural-alignment`
- **Merge target**: `feature/migration-2915-structural-alignment` (then onward to `main` via
  normal PR flow)
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`.

## Context

- Spec anchors: FR-001 through FR-008, NFR-003, SC-001, SC-002, SC-003 (`spec.md`).
- Plan anchor: IC-01 in `plan.md`.
- Research anchor: R5 in `research.md` (per-path correct-vs-remove decisions for FR-005/006/008).
- This WP is **independent of WP02** (disjoint file sets: `AGENTS.md`/`CLAUDE.md`/`README.md`
  here vs. Georgia's profile/templates/surface-docs/`.gitignore` in WP02). Do not touch any
  file outside `owned_files`.
- **You must NOT touch**: `.cursor/`, `.claude/` (they don't exist on disk and must stay
  gitignored/generated — you are only correcting the *prose* that describes them),
  `pack/drg/fragment.yaml` or any `pack/drg/*.graph.yaml` (C-001 — no DRG changes needed here),
  `.gitignore` (that's WP02's job), any file under `pack/agent_profiles/` or
  `pack/templates/gemini/` (WP02's scope).

---

### Subtask T001 — Correct `.cursor/`/`.claude/` claims (FR-001)

**Files**: `AGENTS.md`, `CLAUDE.md`

Both files currently describe `.cursor/` and `.claude/` as committed repository directories.
`README.md` § "Local Agent And IDE Harnesses" already documents the accurate model: these are
gitignored, locally generated from `tools/surfaces/`, and never committed. Grep both files for
`.cursor` and `.claude` to find every mention before editing (do not rely on memory of a single
occurrence — AGENTS.md §8's repository-structure listing is the primary offender, but check the
whole file).

**Steps**:
1. In `AGENTS.md` §8's repository-structure listing, ensure every `.cursor/`/`.claude/` mention
   carries an explicit non-committed marker in the same line or bullet — use words like
   "gitignored" or "generated locally" (this must be **grep-verifiable**: after your edit,
   `grep -n "\.cursor\|\.claude" AGENTS.md` should show only lines that also contain
   "gitignored" or "generated" nearby, never a bare directory-listing entry).
2. In `CLAUDE.md`'s repository structure description, apply the same correction, or replace the
   claim with an explicit cross-reference to `README.md`'s accurate explanation (either is
   acceptable per the spec).
3. Read both files' full prose (not just the structure section) for any other sentence that
   implies `.cursor/`/`.claude/` are committed, and correct those too.

**Acceptance criteria** (verbatim from spec.md FR-001):
- `AGENTS.md` §8's repository-structure listing does not list `.cursor/` or `.claude/` as bare
  directory entries; each mention is grep-verifiable as carrying an explicit non-committed
  marker in the same line or bullet.
- `CLAUDE.md`'s repository structure description carries the same correction (or a
  cross-reference to `README.md`'s accurate explanation).
- No prose elsewhere in either file contradicts the corrected model.
- **This criterion is outside WP03's lint's automated coverage** (the lint only detects
  dangling paths, not mischaracterized-but-existing ones) — verify by grep/manual review
  yourself; do not defer this check to WP03.

### Subtask T002 — Correct `src/framework`, `tests/*`, `fixtures/` claims (FR-002)

**Files**: `AGENTS.md`, `CLAUDE.md`

Both files describe an elaborate `src/framework/{core,execution,interface,orchestration,
context,config,schemas}` runtime tree, a matching `tests/{framework,orchestration,integration,
unit}` tree, and a `fixtures/{prompts,copilot,opencode,agents}` tree. On disk today: `src/`
contains only `.gitkeep`; `tests/` contains only `test_pack_schema_validation.py` (plus
`__init__.py`/`__pycache__`) — no `framework/`, `orchestration/`, `integration/`, or `unit/`
subdirectories; `fixtures/` does not exist at all. Verify this yourself first
(`ls src/ tests/`, confirm `fixtures/` absent) rather than trusting this prompt blindly — if
the on-disk state has changed since spec time, adapt the correction to match current reality.

**Steps**:
1. Locate every occurrence of `src/framework/**`, `tests/{framework,orchestration,integration,
   unit}/`, and `fixtures/{prompts,copilot,opencode,agents}/` (or equivalent prose) in
   `AGENTS.md` §8 and `CLAUDE.md`.
2. For each occurrence, either (a) remove the claim that this tree currently exists, (b) replace
   it with the actual current state, or (c) keep the description but add an unambiguous
   aspirational marker — a heading or immediately-preceding line reading "Planned" or "Not yet
   implemented" — directly above/around it.
3. Ensure the actual current state (`src/` = `.gitkeep` only; `tests/` = one file; `fixtures/`
   absent) is discoverable somewhere in the corrected docs — don't just delete the section and
   leave a gap; a reader should be able to tell what's really there.

**Acceptance criteria** (verbatim from spec.md FR-002):
- The structural description does not state as present fact that `src/framework/**`,
  `tests/{framework,orchestration,integration,unit}/`, or `fixtures/{prompts,copilot,opencode,
  agents}/` exist, except within a section whose heading (or immediately preceding line) carries
  an explicit aspirational marker such as "Planned" or "Not yet implemented" — grep-verifiable
  by confirming no occurrence of these path strings exists outside such a marked section.
- The actual current state is discoverable from the corrected docs.
- **Outside WP03's lint coverage** — verify by grep/manual review yourself.

### Subtask T003 — Correct the toolguide reference (FR-003)

**File**: `AGENTS.md`

`AGENTS.md`'s Model Discipline / Directive 042 section references
`pack/tools/fallback/agentic_model_leaderboard.yaml` as if it were a local file.
`pack/tools/` does not exist in this repository — the file is real but lives in the upstream
`regnology-all-company` pack, resolved via `extends: regnology-all-company` in
`pack/org-charter.yaml`.

**Steps**:
1. Find the reference (search for `agentic_model_leaderboard` or `pack/tools/fallback`).
2. Rewrite so the text no longer implies a local `pack/tools/fallback/` path exists in this
   repository.
3. Explain (in-line, or via a link to an existing explanation elsewhere in the doc) the
   `extends:` inheritance model, so a reader understands where the file actually resolves from.

**Acceptance criteria** (verbatim from spec.md FR-003):
- The reference no longer implies a local `pack/tools/fallback/` path exists in this repository.
- The corrected text explains (or links to an explanation of) the `extends:` inheritance model.

### Subtask T004 — Reconcile the §9 directive index (FR-004)

**File**: `AGENTS.md`

§9's Extended Directives Index table currently links 12 directive codes as `[pack]` (006, 018,
022, 023, 028, 037, 038, 041, 042, 043, 044, 050) with a closing line "Location:
`pack/directives/` (12 migrated YAML artifacts)." Run `ls pack/directives/` yourself to confirm
current reality (at spec time: only `037-context-aware-design.directive.yaml` and
`050-ad-hoc-prompt-capture.directive.yaml` were present locally; the other ten resolve via
`extends: regnology-all-company`). Re-verify — this may have changed if another mission added
pack/directives/ files since.

**Steps**:
1. Compare §9's table against current `ls pack/directives/` output.
2. Keep directives actually present locally linked as `[pack]` local artifacts.
3. Re-label directives that only resolve via `extends:` — do not link them as if a local file
   exists; either mark them "(inherited)" or point the link at wherever they're actually
   discoverable (e.g., `spec-kitty doctrine pack` inspection tooling), if such a path exists.
4. Correct the "(N migrated YAML artifacts)" count to reflect what's actually true locally vs.
   inherited.

**Acceptance criteria** (verbatim from spec.md FR-004):
- Directives actually present under `pack/directives/` at verification time remain linked as
  `[pack]` local artifacts.
- Directives resolving only via `extends:` are re-labeled to indicate inheritance (not linked as
  if a local file exists), or their links point at wherever they're actually discoverable.
- The migrated-artifact count is corrected to reflect actual local vs. inherited reality.

### Subtask T005 — Fix `README.md`'s `docs/HOW_TO_USE.md` path (FR-005 — correct in place)

**File**: `README.md`

Per research.md R5: **correct in place**. The Repository Structure tree diagram (around
line ~147 at spec time — re-locate by searching for `HOW_TO_USE`) references
`docs/HOW_TO_USE.md`, which doesn't exist; the real path is `docs/installation/HOW_TO_USE.md`.
README.md's prose already links this correctly elsewhere (lines ~41, 120, 258 at spec time) —
only the tree-diagram entry is wrong.

**Steps**: Update the tree-diagram entry to `docs/installation/HOW_TO_USE.md`, matching the
already-correct prose links elsewhere in the same file.

**Acceptance criteria** (verbatim from spec.md FR-005):
- The Repository Structure tree in `README.md` references `docs/installation/HOW_TO_USE.md`,
  not `docs/HOW_TO_USE.md`.

### Subtask T006 — Remove `README.md`'s `pack/mission_step_contracts/` reference (FR-006 — remove)

**File**: `README.md`

Per research.md R5: **remove**, not correct-in-place. No `pack/mission_step_contracts/`
directory (or equivalent) exists anywhere in the pack, and building one is explicitly Out of
Scope for this mission (spec.md Out of Scope section). There is no alternate existing or
inherited location this claim could correctly repoint to.

**Steps**: Remove the `pack/mission_step_contracts/` entry (and its "6 contracts" count) from
both the "Pack Contents" table and the Repository Structure tree in `README.md`. Do not replace
it with an aspirational marker — research.md R5 explicitly rules that out for this path (no
tracked plan to build it).

**Acceptance criteria** (verbatim from spec.md FR-006):
- `README.md`'s "Pack Contents" table and Repository Structure tree no longer claim a
  `pack/mission_step_contracts/` directory with a "6 contracts" count. The reference is
  corrected to match actual `pack/` contents or removed.

### Subtask T007 — Fix/annotate `README.md`'s `pack/tools/fallback/` reference (FR-007)

**File**: `README.md`

Same root cause and same correction approach as T003/FR-003: `pack/tools/fallback/` doesn't
exist locally; it's inherited from `regnology-all-company` via `extends:`.

**Steps**: Apply the same inheritance-annotation approach as T003 to `README.md`'s Repository
Structure tree entry for `pack/tools/fallback/`. Consider cross-referencing the correction you
made in `AGENTS.md` (T003) rather than duplicating the full explanation, if that reads more
naturally.

**Acceptance criteria** (verbatim from spec.md FR-007):
- Same correction/inheritance-annotation approach as FR-003, applied to `README.md`'s
  Repository Structure tree entry for `pack/tools/fallback/`.

### Subtask T008 — Remove `README.md`'s `tools/pack-dashboard/` reference (FR-008 — remove)

**File**: `README.md`

Per research.md R5: **remove**, not correct-in-place. `README.md`'s Repository Structure tree
describes a `tools/pack-dashboard/` ("Angular + Express pack health dashboard") subdirectory
that does not exist (`ls tools/` shows only `compile-drg.py`, `surfaces/`, and
`triage-drg-dangles.py`). Building this tool is explicitly Out of Scope for this mission, and no
separate named repository/deliverable for it is evidenced anywhere in the spec.

**Steps**: Remove the `tools/pack-dashboard/` entry from `README.md`'s Repository Structure
tree. Do not label it as a reference to a separate named repository — no such repository is
evidenced in this spec.

**Acceptance criteria** (verbatim from spec.md FR-008):
- `README.md`'s Repository Structure tree no longer describes a `tools/pack-dashboard/`
  subdirectory that does not exist, unless clearly labeled as a reference to a separate, named
  repository/deliverable (not applicable here per research.md R5 — remove).

### Subtask T009 — Markdownlint + grep-verify SC-001/SC-002/SC-003

**Files**: `AGENTS.md`, `CLAUDE.md`, `README.md` (all three, read-only verification pass)

This is the WP's Definition-of-Done verification step, not a new edit.

**Steps**:
1. Run `markdownlint` (or this repository's equivalent config check against
   `.markdownlint.yaml`) against all three edited files. Fix any new violations introduced by
   your edits before considering this WP complete — do not introduce lint regressions.
2. Grep-verify **SC-001**: every path reference in `AGENTS.md`/`CLAUDE.md`'s
   repository-structure sections resolves to either an existing file/directory or an explicit
   "inherited from the parent pack" annotation.
3. Grep-verify **SC-002**: `AGENTS.md` §9's directive links, cross-checked against
   `ls pack/directives/`, contain zero links presented as locally resolving when the artifact
   isn't actually present on disk.
4. Grep-verify **SC-003**: `README.md`'s Repository Structure tree and Key Documentation table
   contain zero paths that fail existence verification (`docs/HOW_TO_USE.md`,
   `pack/mission_step_contracts/`, `pack/tools/fallback/`, `tools/pack-dashboard/` all resolved
   or removed).
5. Re-read T001/T002's acceptance criteria and re-confirm by grep — these are **not** covered
   by WP03's automated lint (it only detects dangling paths, not mischaracterized-but-existing
   ones), so this manual pass is the only verification they get.

---

## Definition of Done

- [ ] All 9 subtasks complete.
- [ ] `markdownlint` reports 0 new violations on `AGENTS.md`, `CLAUDE.md`, `README.md`.
- [ ] SC-001, SC-002, SC-003 manually grep-verified and passing.
- [ ] FR-001/FR-002's non-lint-covered acceptance criteria manually grep-verified.
- [ ] No file outside `owned_files` (`AGENTS.md`, `CLAUDE.md`, `README.md`) was modified.
- [ ] Regnology branding headers (Directive 041) on all three files are untouched/preserved.

## Reviewer Guidance

- Reviewers should independently grep each acceptance criterion above rather than trust a
  green markdownlint run — several FRs in this WP are explicitly outside lint coverage by
  spec design (see FR-001/FR-002's acceptance criteria and SC-004's note in spec.md).
- Confirm research.md R5's correct-vs-remove decisions were followed exactly per path (FR-005
  corrected in place; FR-006 and FR-008 removed, not aspirationally re-labeled).
- Confirm no `.cursor/`, `.claude/`, `pack/agent_profiles/`, `pack/templates/gemini/`, or
  `.gitignore` changes leaked into this WP (those belong to WP02, or are out of scope entirely).

## Activity Log

- 2026-07-06T14:19:35Z – claude:sonnet:implementer:implementer – shell_pid=3417846 – Assigned agent via action command
- 2026-07-06T14:41:03Z – claude:sonnet:implementer:implementer – shell_pid=3417846 – Ready for review: T001-T009 complete.
- 2026-07-06T14:45:28Z – claude:sonnet:implementer:implementer – shell_pid=3417846 – Ready for review: T001-T009 complete
- 2026-07-06T14:45:42Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3494946 – Started review via action command
- 2026-07-06T14:52:06Z – user – shell_pid=3494946 – Review passed: all FR-001–FR-008/NFR-003 acceptance criteria independently grep/manually verified against diff and current file state; 0 new markdownlint violations (rule-set diff vs base branch confirms pre-existing violations only); scope clean (only AGENTS.md/CLAUDE.md/README.md touched, 3 commits); frozen surfaces (.cursor/.claude/pack/drg/.gitignore/pack/agent_profiles/pack/templates/gemini) untouched; branding headers preserved on all 3 files.
