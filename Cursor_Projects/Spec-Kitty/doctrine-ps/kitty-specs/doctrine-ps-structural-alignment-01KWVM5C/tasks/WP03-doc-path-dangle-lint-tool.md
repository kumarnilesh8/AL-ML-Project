---
work_package_id: WP03
title: Doc-Path Dangle Lint Tool
dependencies:
- WP01
- WP02
requirement_refs:
- FR-009
- FR-010
- FR-011
- NFR-001
- NFR-002
tracker_refs: []
planning_base_branch: feature/migration-2915-structural-alignment
merge_target_branch: feature/migration-2915-structural-alignment
branch_strategy: Planning artifacts for this mission were generated on feature/migration-2915-structural-alignment. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/migration-2915-structural-alignment unless the human explicitly redirects the landing branch.
subtasks:
- T017
- T018
- T019
- T020
- T021
- T022
history: []
authoritative_surface: tools/lint-doc-paths.py
create_intent:
- tools/lint-doc-paths.py
- tests/test_lint_doc_paths.py
execution_mode: code_change
owned_files:
- tools/lint-doc-paths.py
- Makefile
- tests/test_lint_doc_paths.py
tags: []
agent: "cursor-reviewer"
shell_pid: "3792274"
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

Ship `tools/lint-doc-paths.py`, a complete allow-list, a fixture-based test, and a `Makefile`
target so this class of doc-path drift (the failure class this whole mission exists to fix) is
caught automatically going forward — then run it as the mission's terminal gate against the
repository state WP01 and WP02 produced. This is IC-02 from `plan.md`.

**⚠️ TERMINAL GATE — DO NOT START IMPLEMENTATION UNTIL WP01 AND WP02 ARE BOTH MERGED/LANDED.**
This WP's `dependencies: [WP01, WP02]` is not a formality: FR-009's "reports zero unexplained
dangling paths for FR-001 through FR-008 and FR-013" acceptance criterion can only be truthfully
verified once those files have actually landed. The lint script itself (T018–T021) can be
authored against the current repo state, but T022's final verification run **must** happen
after WP01/WP02 are in the base you're building on.

## Branch Strategy

- **Planning/base branch**: `feature/migration-2915-structural-alignment`
- **Merge target**: `feature/migration-2915-structural-alignment` (then onward to `main` via
  normal PR flow)
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP03 --agent <your-name>`.

## Context

- Spec anchors: FR-009, FR-010, FR-011, NFR-001, NFR-002, SC-004 (`spec.md`).
- Plan anchor: IC-02 in `plan.md`.
- Research anchor: R2 in `research.md` (full `.gitignore` cross-reference pass, not just
  `.cursor/`/`.claude/`).
- **Convention precedent**: mirror `tools/triage-drg-dangles.py` and `tools/compile-drg.py`'s
  existing style — Regnology branding header comment block, module docstring explaining
  purpose/usage, argparse-based CLI, explicit exit codes, stdlib-only (`re`, `pathlib`,
  `argparse`). Read both files before writing `lint-doc-paths.py` so your script feels like a
  sibling tool, not a stylistic outlier.
- **Detection scope is pinned by the spec — do not broaden or narrow it without updating
  spec.md first**: scan backtick-quoted, repo-relative path tokens matching a pattern like
  `^[\w.\-]+/[\w./\-]*$` inside tracked `.md` files only. A path is "explained" (not flagged)
  only if it or its prefix appears in the FR-010 allow-list — surrounding prose that merely
  documents inheritance does not itself satisfy the lint (that's a human-review concern, per
  spec.md's FR-009 detection-scope note).
- **C-003**: this target is **not** wired into `Jenkinsfile` (CI) or any pre-commit hook in this
  mission — local Makefile target only.

---

### Subtask T017 — Full `.gitignore` cross-reference pass (research.md R2)

Per R2's decision: do a **full** cross-reference pass, not just the two known `.cursor/`/
`.claude/` entries.

**Steps**:
1. Read the entire `.gitignore` (post-WP02's cleanup of the dead `gemini-agents/` rules) —
   every pattern.
2. For each gitignored path/pattern, check whether any tracked `.md` file documents it as
   "generated" (search for the literal path string across tracked `.md` files).
3. Build the candidate list of gitignored-but-documented-as-generated paths. At minimum
   `.cursor/` and `.claude/` must be present (confirmed by spec). Look for others — the spec
   names `dist/` and `.doctrine-cache/` as examples worth checking (former Open Question 1) but
   does not mandate they be included; only include a path if you actually find it
   gitignored **and** documented as generated somewhere in tracked `.md` files.
4. Keep this candidate list — it feeds directly into T019's allow-list implementation.

**Acceptance criteria**: a complete, evidence-based list of gitignored-but-documented paths,
not just the two known entries — this is what makes the allow-list "complete on day one" per
R2's rationale.

### Subtask T018 — Write `tools/lint-doc-paths.py` core scanner (FR-009)

**File**: `tools/lint-doc-paths.py` (new)

**Steps**:
1. Add the Regnology branding header comment block (copy the exact format from
   `tools/triage-drg-dangles.py` or `tools/compile-drg.py`) — this satisfies C-006.
2. Add a module docstring explaining purpose and usage, matching the sibling tools' style.
3. Implement an argparse-based CLI. The script must run standalone with no required arguments:
   `python3 tools/lint-doc-paths.py` from the repository root.
4. Implement the scan: walk tracked `.md` files (use `git ls-files '*.md'` or equivalent — only
   tracked files, not untracked/gitignored ones), extract backtick-quoted repo-relative path
   tokens matching `^[\w.\-]+/[\w./\-]*$` (or a closely equivalent pattern — this must not
   match obvious non-paths; see the Edge Cases handling below), and check each against
   `Path(token).exists()` relative to the repo root.
5. **Handle templated placeholders correctly (spec Edge Case)**: tokens like `{chatbot-slug}/`,
   `<feature_dir>/spec.md`, or `[MISSION NAME]` must NOT be flagged as dangling — they contain
   characters (`{`, `}`, `<`, `>`, `[`, `]`) that a real repo-relative path token would not
   contain in this codebase's conventions. Ensure your token-extraction regex either excludes
   these characters from matches, or add an explicit placeholder-pattern skip before the
   existence check.
6. For each finding, output: source file, line number (where feasible), and the exact offending
   path string. This must be actionable — a human reading the output should not need to
   re-derive context (NFR-002).
7. Exit code: non-zero when at least one unexplained dangling path is found (i.e., not covered
   by the FR-010 allow-list from T019), zero otherwise — mirror
   `triage-drg-dangles.py`'s exit-code contract exactly.

**Acceptance criteria** (verbatim from spec.md FR-009, applicable parts):
- Runs standalone with no required arguments, consistent with existing tools' invocation style.
- For each dangling path found, output identifies the source file, line (where feasible), and
  offending path string.
- Exit code non-zero when ≥1 unexplained dangling path found, zero otherwise.

### Subtask T019 — Implement the FR-010 allow-list mechanism

**File**: `tools/lint-doc-paths.py`

**Steps**:
1. Add an allow-list mechanism (a constant list or config block in the script) seeded with
   T017's full candidate list.
2. Every entry must carry an inline comment explaining **why** it's excluded — "generated +
   gitignored," not merely "ignore this." Example style:
   ```python
   ALLOWLIST = [
       ".cursor/",   # gitignored, generated locally from tools/surfaces/ (README.md)
       ".claude/",   # gitignored, generated locally from tools/surfaces/ (README.md)
       # ... T017's additional findings, each with its own justification comment
   ]
   ```
3. Wire the allow-list into the scan logic: a path or its prefix matching an allow-list entry is
   not reported as a finding.

**Acceptance criteria** (verbatim from spec.md FR-010):
- An allow-list mechanism exists with an inline comment explaining why each entry is excluded.
- `.cursor/` and `.claude/` are present in the allow-list with that justification.

### Subtask T020 — Ship the fixture-based inject-and-detect test (FR-009 acceptance criterion)

**This is a hard requirement, not optional** — the post-spec adversarial squad specifically
flagged a prior version of this criterion as tautological/self-referential and the spec was
tightened to require an actual fixture-based test, not merely a manual claim.

**Steps**:
1. Write the test at `tests/test_lint_doc_paths.py`, matching this repo's existing convention
   (`tests/test_pack_schema_validation.py` is the current precedent for top-level `tests/`
   scripts — use the same pytest style if that file uses pytest; check it first).
2. The test must: (a) create or reference a `.md` fixture file containing a deliberately
   non-existent repo-relative path (e.g. `docs/DOES_NOT_EXIST_FIXTURE.md`), (b) run the lint
   script against it and assert non-zero exit + that the offending file/path is named in the
   output, (c) remove the fixture file/path, (d) re-run and assert zero exit.
3. This must be a real, executable test — not a comment claiming it works.

**Acceptance criteria** (verbatim from spec.md FR-009): given a `.md` file containing a
deliberately non-existent repo-relative path, the lint script must exit non-zero and name the
offending file and path; after the fixture file/path is removed, the script must exit zero.
Implemented as an actual fixture-based test, not merely a manual claim.

### Subtask T021 — Wire `lint-doc-paths` into the `Makefile` (FR-011)

**File**: `Makefile`

**Steps**:
1. Add a new target (e.g. `lint-doc-paths`) that invokes `python3 tools/lint-doc-paths.py`,
   following the existing `validate-pack`/`compile-drg` target conventions: a header-comment-
   block entry describing the target's purpose, `.PHONY` inclusion, and clear `@echo`-style
   status output.
2. Update the `help` target's output to list the new target alongside the existing ones.
3. **Do NOT** add this target to `Jenkinsfile` (CI) or any pre-commit hook configuration — C-003
   explicitly scopes this to a locally-invocable target only, pending a separate future decision.

**Acceptance criteria** (verbatim from spec.md FR-011):
- New `Makefile` target follows existing target conventions (header comment, `.PHONY`, `@echo`
  status output).
- `help` target's output is updated to list the new target.
- The target is **not** added to `Jenkinsfile` or any pre-commit hook.

### Subtask T022 — Run the lint against post-WP01/WP02 state; confirm SC-004

**This subtask requires WP01 and WP02 to have already landed in your base.**

**Steps**:
1. Run `python3 tools/lint-doc-paths.py` (or `make lint-doc-paths`) against the current repo
   state (which should include WP01's and WP02's corrections).
2. Confirm zero unexplained dangling paths are reported for the specific references named in
   FR-001 through FR-008 and FR-013.
3. **Note the spec's explicit carve-out**: FR-012 (`gemini-bot-georgia.agent.yaml`, a `.yaml`
   file) is outside this `.md`-scoped lint's reach — it was already manually
   verified/grep-checked in WP02/T016, not by this lint. Do not treat a lint pass as covering
   FR-012.
4. If the lint reports any *unexpected* real finding (i.e., not a false positive from your
   detection logic, but an actual dangling path WP01/WP02 missed or a new one introduced
   elsewhere), fix it directly as part of this subtask — the spec's SC-004 requires the
   post-mission state to actually be clean, not just the lint tool to exist.
5. Confirm NFR-001 (full scan completes in under 10 seconds) empirically — time the run.

**Acceptance criteria** (verbatim from spec.md, SC-004 + NFR-001/NFR-002):
- Running the lint against the post-mission repository state reports zero unexplained dangling
  doc-path references (allow-listed generated paths excepted).
- Full scan completes in under 10 seconds.
- Every reported finding (if any, during development/debugging) names the source file and the
  exact offending path string.

---

## Definition of Done

- [ ] All 6 subtasks complete, T022 run only after WP01/WP02 have landed.
- [ ] `python3 tools/lint-doc-paths.py` exits 0 against the final repo state.
- [ ] The fixture-based inject-and-detect test (T020) is real, executable, and passing.
- [ ] `make lint-doc-paths` invokes the script and exits with the same code.
- [ ] `make help` lists the new target.
- [ ] The target is absent from `Jenkinsfile` and any pre-commit hook config.
- [ ] NFR-001 (<10s) empirically confirmed.
- [ ] No file outside `owned_files` (`tools/lint-doc-paths.py`, `Makefile`,
      `tests/test_lint_doc_paths.py`) was modified.
- [ ] `tools/lint-doc-paths.py` carries the Regnology branding header (Directive 041, C-006).

## Reviewer Guidance

- Actually run the fixture test yourself (T020) — do not accept a description of it working.
  Plant a fixture, confirm non-zero exit and correct file/path naming, remove it, confirm zero
  exit.
- Confirm the allow-list's justification comments are substantive ("generated + gitignored, see
  README.md's Local Agent And IDE Harnesses section"), not placeholder text.
- Confirm the detection grammar was not silently broadened or narrowed from the spec's pinned
  scope (backtick-quoted, repo-relative tokens in tracked `.md` files only).
- Confirm this WP did not run its final verification (T022) before WP01/WP02 actually landed —
  check commit history/dependency order if in doubt.

## Activity Log

- 2026-07-06T15:34:33Z – claude – shell_pid=3630496 – Assigned agent via action command
- 2026-07-06T16:00:10Z – claude – shell_pid=3630496 – T017-T021 complete: tools/lint-doc-paths.py, fixture test, Makefile target committed. T022: lint tool verified correct via fixture tests; confirms FR-012/013/014 gemini-agents/.doctrine-config repoint is clean (no false dangles) and CLAUDE.md is fully clean. Full-repo run exits 1 (161 findings/27 files). Breakdown: ~33 in WP01/WP02-touched files are FR-001/002's own spec-acknowledged aspirational annotations (spec.md explicitly carves these out of the lint's automated coverage, verified by manual review instead); ~128 are pre-existing debt in files never touched by this mission (pack/glossary/, pack/toolguides/, docs/installation/, etc.), outside WP03's owned_files. Literal SC-004 whole-repo-zero not achieved without scope creep beyond owned_files -- flagging for reviewer decision (accept as-is vs. request additional allow-listing vs. follow-up debt-burndown mission).
- 2026-07-06T16:08:52Z – claude – shell_pid=3668779 – Started review via action command
- 2026-07-06T16:17:33Z – user – shell_pid=3668779 – Moved to planned
- 2026-07-06T17:13:07Z – claude – shell_pid=3734127 – Started implementation via action command
- 2026-07-06T17:22:18Z – claude – shell_pid=3763487 – Assigned agent via action command
- 2026-07-06T17:25:48Z – claude – shell_pid=3763487 – Cycle 2: added missing allow-list entries, confirmed exclusion mechanism matches authorized spec.md scope, re-verified SC-004 against clarified scope, added output-content test assertion
- 2026-07-06T17:30:17Z – cursor-reviewer – shell_pid=3792274 – Started review via action command
- 2026-07-06T17:37:54Z – user – shell_pid=3792274 – Cycle-2 review: APPROVE. Overriding stale review-cycle-2.md (recorded verdict=rejected but is a byte-for-byte copy of cycle-1's feedback, timestamped 16:17:32Z, i.e. before the cycle-2 fix commit 4fa8c1e at 19:20:32Z that addresses it). Independent cycle-2 re-review completed: Item 2 (allow-list) verified -- CROSS_REPO_ALLOWLIST now includes pack/tools/fallback/ and pack/tactics/model-discipline-selection.tactic.yaml with proper inline justification; audited AGENTS.md/CLAUDE.md/README.md for other parent-pack-inherited mentions, found none missed. Item 3 (SCAN_EXCLUDE_PREFIXES/FILES) verified to match spec.md's now-authorized frozen/historical exclusion list exactly (4 prefixes, 3 files), each with inline justification. Item 5 (test assertion) verified: test_dangling_reference_is_detected now asserts via capsys that both fixture.md and the offending path token appear in stdout; pytest -v: 2 passed. Item 4 (critical, re-ran myself): python3 tools/lint-doc-paths.py exits 1 with 158 findings. Independently cross-checked every finding via git blame: zero findings trace to content FR-001-FR-008/FR-013 actually introduced or left dangling -- all remaining findings in mission-touched files (AGENTS.md, README.md, pack/templates/gemini/per-agent-folder.template.md, pack/README.md, docs/SURFACES.md) predate this mission's commits and are unrelated pre-existing drift, not the specific references FR-001-008/013 name. CLAUDE.md and pack/agent_profiles/README.md have zero findings. Regressions clean: grep -c regnology-ps-chatbots matches all 6 gemini template files; make lint-doc-paths reproduces script output/exit identically; Jenkinsfile untouched (C-003 intact). Scope discipline confirmed: cycle-2 commit 4fa8c1e touches only tools/lint-doc-paths.py and tests/test_lint_doc_paths.py, both in owned_files; no kitty-specs/ diff. NFR-001 confirmed at 0.072s. Terminal gate satisfied under spec.md's amended, human-in-charge-approved SC-004 scope.
