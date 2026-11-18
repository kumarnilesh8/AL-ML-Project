# WP03 Review — Cycle 1

**Verdict: REJECT — T022/SC-004 terminal gate does not pass.**

## 1. Primary (automatic-reject) finding: lint does not exit 0

Ran `python3 tools/lint-doc-paths.py` against the current lane worktree state (which
includes WP01's and WP02's merged commits):

```
Scanning 53 tracked Markdown file(s) under <repo root>
...
FAIL: 161 unexplained dangling doc-path reference(s) found.
```
Exit code: **1**. `make lint-doc-paths` reproduces the identical output and failure
(make itself then reports exit 2, which is normal `make` recipe-failure wrapping — the
underlying script's exit code is still 1).

This directly fails WP03's own Definition of Done checkbox ("`python3
tools/lint-doc-paths.py` exits 0 against the final repo state") and spec.md's SC-004
("Running the new lint script against the post-mission repository state reports zero
unexplained dangling doc-path references"). Per the review brief for this WP, a non-zero
exit here is an automatic reject regardless of how well-reasoned the remaining 6/7
subtasks are.

To your credit, this gap is not hidden — your own Activity Log entry candidly states
"Literal SC-004 whole-repo-zero not achieved... flagging for reviewer decision." I want
to acknowledge that transparency. But per Directive 040 (Human-in-Charge Escalation),
a known-unmet terminal-gate acceptance criterion should be escalated *before* moving the
WP to `for_review`, not discovered by the reviewer. Please route the scope question below
through the mission's human-in-charge channel (or update spec.md directly, if you have the
authority) before resubmitting.

## 2. Concrete, in-scope fix you should make regardless of the scope decision below

At least two of the 161 findings are **false positives caused by an incomplete
allow-list, not pre-existing debt**, and are directly traceable to WP01's own FR-003 fix
that WP03 depends on:

- `AGENTS.md:144` and `AGENTS.md:317` — `` `pack/tools/fallback/` ``
- `AGENTS.md:155` — `` `pack/tactics/model-discipline-selection.tactic.yaml` ``

Both are WP01's correct FR-003 wording ("there is no local `pack/tools/fallback/`
directory in this repository" / "no local `pack/tactics/model-discipline-selection.tactic.yaml`
file exists") — i.e., paths that are genuinely inherited from the `regnology-all-company`
parent pack and legitimately never exist in this repo's checkout. This is structurally
identical to the `CROSS_REPO_ALLOWLIST` treatment you already built for `gemini-agents/`
and `.doctrine-config/`. T017 asked for a "full" cross-reference pass; this
parent-pack-inheritance category is evidenced by WP01's own commits (a WP03 dependency)
and should have been caught. Please add these (and audit for any other
inherited-from-parent-pack paths introduced by WP01/WP02's `extends:`-related wording) to
`CROSS_REPO_ALLOWLIST` with the same inline-justification convention, and re-run.

## 3. Unauthorized detection-scope narrowing — needs a spec.md decision, not a unilateral fix

`tools/lint-doc-paths.py`'s `SCAN_EXCLUDE_PREFIXES` / `SCAN_EXCLUDE_FILES` exclude entire
tracked source files from the scan (`kitty-specs/`, `.kittify/`, `docs/decisions/`,
`docs/engineering_notes/`, `CHANGELOG.md`, `docs/pack-migration-plan.md`,
`docs/AGENT_MIGRATION_GUIDANCE.md`).

spec.md's FR-009 pins detection scope to "backtick-quoted, repo-relative path tokens ...
inside tracked `.md` files" with **no source-file exclusion** mentioned, and explicitly
says "do not broaden or narrow it without updating spec.md first" (repeated verbatim in
the WP03 prompt's Context section). research.md's R2 — the only research decision this
WP cites — is scoped to *target-path allow-list completeness* only ("full `.gitignore`
cross-reference pass"), not to excluding whole source files from the scan.

The rationale in your docstring (avoiding noise on frozen historical/point-in-time
documents) is reasonable engineering judgment, and I don't think it's wrong — but it's a
real scope change that was never run through a spec.md update, which is exactly what the
WP03 prompt's Reviewer Guidance told me to check for ("Confirm the detection grammar was
not silently broadened or narrowed from the spec's pinned scope"). Please either:
(a) get spec.md amended to explicitly authorize this exclusion list and its rationale, or
(b) drop the mechanism and handle any resulting historical-doc false positives via
`ALLOWLIST`/`CROSS_REPO_ALLOWLIST` entries instead, scoped to the specific offending
tokens rather than whole files/directories.

## 4. Path forward on the remaining ~155+ findings (scope decision needed)

After fixing item 2, most of the remaining findings fall into two buckets, per your own
Activity Log breakdown:

- Findings in `AGENTS.md`/`README.md` that stem from FR-001/002/003/004/007's own
  intentional prose (e.g., `doctrine/` mentioned as "the former migration source,"
  `` `pack/tools/fallback/` `` explained as not-local). Spec.md already acknowledges the
  lint cannot evaluate FR-001/FR-002 this way ("prose-based justification... is a human
  review concern, not something the lint itself evaluates") — but the same limitation
  clearly extends to FR-003/004/007, which spec.md does not currently say. Worth a
  spec.md clarification.
- ~128 findings in files this mission never touched at all (`pack/glossary/**`,
  `pack/toolguides/**`, `docs/installation/**`, `dist/**`, etc.) — genuine pre-existing
  drift, unrelated to FR-001 through FR-013, outside WP03's `owned_files`.

FR-009's own acceptance-criterion wording is actually narrower than SC-004's: "reports
zero unexplained dangling paths **for the specific references named in FR-001 through
FR-008 and FR-013**" — not a literal whole-repo scan. SC-004's wording ("the post-mission
repository state") reads more broadly and is what T022's Definition-of-Done checkbox
followed literally. These two spec statements are in tension, and resolving that tension
is what's blocking a clean T022 run. I'd suggest one of:

1. Narrow T022's verification (and SC-004's wording, via a small spec.md edit) to the
   specific references named in FR-001–FR-008 and FR-013, matching FR-009's own literal
   text — then confirm *that* narrower set is clean (after item 2's fix, and after
   resolving the FR-003/004/007 prose-vs-lint gap noted above).
2. Keep SC-004 as a literal whole-repo requirement, and split the ~128 unrelated findings
   into a documented follow-up debt-burndown mission, explicitly out of this mission's
   scope.

Either is defensible — this isn't something I can resolve unilaterally as reviewer, and I
don't think you can either without a spec.md edit or a human-in-charge decision. What I
can't do is approve WP03 while `python3 tools/lint-doc-paths.py` exits 1 against the
stated Definition of Done.

## 5. Minor — T020 fixture test doesn't check output content

`tests/test_lint_doc_paths.py::test_dangling_reference_is_detected` only asserts
`exit_code == 1`. T020's step (b) requires asserting "the offending file/path is named in
the output" too, not just the exit code. Please add a `capsys.readouterr()` assertion
that `fixture.md` and the offending token string both appear in stdout.

## What already passes cleanly (no changes needed here)

- **Scope discipline**: only `tools/lint-doc-paths.py`, `Makefile`,
  `tests/test_lint_doc_paths.py` were touched (`git show --stat` on the WP03 commit). No
  stray `__pycache__` or other untracked artifacts were committed.
- **T018 core scanner**: branding header, module docstring, argparse CLI, stdlib-only
  (`re`/`pathlib`/`argparse`/`subprocess`), fenced-code-block skip, and templated-
  placeholder skip are all present and correct; mirrors `triage-drg-dangles.py`'s
  exit-code contract (0/1).
- **T019 allow-list format**: every `ALLOWLIST`/`CROSS_REPO_ALLOWLIST` entry has a
  substantive inline justification; `.cursor/`/`.claude/` present with the correct
  README.md-sourced rationale. Correctly did **not** add `dist/` (tracked, not
  gitignored) or `.doctrine-cache/` (only ever referenced from already-excluded
  historical docs) — matches T017's "only include if actually gitignored AND documented"
  instruction.
- **T021 Makefile wiring**: `.PHONY` updated, header-comment-block target description,
  `@echo`-style `help` entry added, `make lint-doc-paths` reproduces the script's exact
  behavior/exit code.
- **C-003**: confirmed clean — no `Jenkinsfile` or pre-commit hook changes anywhere in the
  WP03 commit.
- **Regression check**: WP01/WP02's changes are intact in this lane —
  `grep -c "regnology-ps-chatbots" pack/templates/gemini/*.template.md` shows matches in
  all 6 files; AGENTS.md's corrected `.cursor/`/`.claude/` "generated, gitignored"
  language is present.
- **NFR-001**: full scan completes in ~0.07s, well under the 10s budget.
- **T020 mechanics**: the fixture test itself passes (`2 passed` via
  `python3 -m pytest tests/test_lint_doc_paths.py -v`), it's just missing the
  output-content assertion (see item 5).

## Requested next steps

1. Fix item 2 (add the two parent-pack-inherited paths to `CROSS_REPO_ALLOWLIST`) and
   re-run — this is unambiguous and doesn't need a scope decision.
2. Resolve item 3 (spec.md authorization for `SCAN_EXCLUDE_PREFIXES`/`SCAN_EXCLUDE_FILES`,
   or drop the mechanism).
3. Get a decision (yourself if authorized, or escalate) on item 4's scope question, update
   spec.md accordingly, and re-run T022 against whatever the agreed final scope is.
4. Add the output-content assertion from item 5.
5. Resubmit with `python3 tools/lint-doc-paths.py` exiting 0 against the agreed scope, and
   note in the Activity Log which of the two paths in item 4 was chosen and why.
