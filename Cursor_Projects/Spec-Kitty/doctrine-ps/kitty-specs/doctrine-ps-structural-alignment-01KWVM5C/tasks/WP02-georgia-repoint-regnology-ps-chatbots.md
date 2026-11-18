---
work_package_id: WP02
title: Gemini Bot Georgia Repoint to regnology-ps-chatbots
dependencies: []
requirement_refs:
- FR-012
- FR-013
- FR-014
- NFR-003
tracker_refs: []
planning_base_branch: feature/migration-2915-structural-alignment
merge_target_branch: feature/migration-2915-structural-alignment
branch_strategy: Planning artifacts for this mission were generated on feature/migration-2915-structural-alignment. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/migration-2915-structural-alignment unless the human explicitly redirects the landing branch.
subtasks:
- T010
- T011
- T012
- T013
- T014
- T015
- T016
history: []
authoritative_surface: pack/agent_profiles/gemini-bot-georgia.agent.yaml
create_intent: []
execution_mode: code_change
owned_files:
- pack/agent_profiles/gemini-bot-georgia.agent.yaml
- pack/templates/gemini/**
- pack/README.md
- pack/agent_profiles/README.md
- docs/SURFACES.md
- .gitignore
tags: []
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "3568880"
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

Repoint `gemini-bot-georgia.agent.yaml`, its six output templates, three surface-description
docs, and `.gitignore`'s dead rules away from the retired local `gemini-agents/` directory to
the live `regnology-ps-chatbots` repository's actual `gemini-agents/shared/{glossary,branding}/`
layout. This is IC-03 from `plan.md`.

**Guardrail (C-002, non-negotiable)**: Georgia's `profile-id`, `roles`, `routing-priority`,
`capabilities`, `context-sources`, `collaboration.handoff-from/handoff-to/works-with`,
`mode-defaults`, `specialization-context`, `directive-references`, and `styleguide-references`
fields must remain **byte-for-byte unchanged**. Only the fields describing *where her output
lands* (paths, purpose/specialization prose) change. If you find yourself tempted to touch
anything else in this file, stop and re-read C-002.

## Branch Strategy

- **Planning/base branch**: `feature/migration-2915-structural-alignment`
- **Merge target**: `feature/migration-2915-structural-alignment` (then onward to `main` via
  normal PR flow)
- **Execution workspace**: Use the path printed by
  `spec-kitty agent action implement WP02 --agent <your-name>`.

## Context

- Spec anchors: FR-012, FR-013, FR-014, NFR-003, SC-005, SC-006 (`spec.md`).
- Plan anchor: IC-03 in `plan.md`.
- Research anchor: R1 in `research.md` — **read this before starting T011**, it governs T010's
  mandatory precondition step.
- This WP is **independent of WP01** (disjoint file sets). Do not touch `AGENTS.md`,
  `CLAUDE.md`, or `README.md` — that's WP01's job.
- **Read-only reference repository**: `regnology-ps-chatbots`, local clone at
  `/home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots`. **Never edit anything
  in that repository** (spec C-005) — it is reference material only, for verifying the actual
  target layout.
- **C-001 (no DRG changes needed)**: confirmed during specify — none of Georgia's DRG edges
  reference `gemini-agents/` or any path string, and `pack/templates/*` is not a valid DRG node
  kind at all. You do not need to touch `pack/drg/fragment.yaml` or any compiled
  `pack/drg/*.graph.yaml`, and doing so would be out of scope.
- **R3 (no version bump)**: `pack/.pack-version` (currently `2.0.0`) must **not** be touched.
  These are non-breaking path-example clarifications, not a contract change, per Directive 006's
  actual version-bump triggers (new required directives / breaking step-contract changes /
  artifact removal — none apply here).

---

### Subtask T010 — Re-verify `regnology-ps-chatbots` live structure (research.md R1 precondition)

**MUST RUN FIRST, before any edit in this WP.**

A same-day, in-flight sibling mission in `regnology-ps-chatbots` —
`receptionist-rob-front-door-rework` (Jira MIGRATION-2848) — was, as of spec time, actively
restructuring `gemini-agents/roster.yaml` (dropping the `navigator: navigator-nemo` top-level
key, adding a new `shared/commands/` bucket). Research.md R1's decision: re-verify immediately
before implementing, rather than blocking on that sibling mission merging.

**Steps**:
1. In the read-only reference clone, inspect the current live structure:
   ```
   ls /home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots/gemini-agents/
   ls /home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots/gemini-agents/shared/
   cat /home/stijn/Documents/_code/CLIENTS/regnology/regnology-ps-chatbots/gemini-agents/roster.yaml
   ```
2. Compare against this spec's 2026-07-06 snapshot assumption:
   `gemini-agents/shared/glossary/` and `gemini-agents/shared/branding/` subdirectories exist
   (replacing the old flat `gemini-agents/glossary/` and `gemini-agents/branding/` the profile
   and templates currently describe).
3. If the live structure matches the snapshot: proceed with T011–T015 as written below.
4. If the live structure has drifted further (e.g., `receptionist-rob-front-door-rework` has
   since merged and changed `roster.yaml`'s schema beyond what's described here): **update your
   target state for T011/T013 to match what's actually live**, not this prompt's snapshot.
   Document what you found and why you deviated in your implementation notes/PR description.
5. Confirm (read-only check) whether `receptionist-rob-front-company-rework`'s own scope still
   avoids touching `shared/glossary/`/`shared/branding/` (its own spec states it "MUST NOT
   modify any other existing specialist agent's instructions" and scopes a distinct
   `shared/commands/` bucket) — if that has changed, flag it, don't silently proceed.

**Acceptance criteria**: You have a confirmed, current snapshot of
`regnology-ps-chatbots/gemini-agents/`'s actual layout before writing a single line in T011+,
and you've noted (in your PR/handoff) whether it matched or diverged from this prompt's
assumption.

### Subtask T011 — Repoint `gemini-bot-georgia.agent.yaml` (FR-012)

**File**: `pack/agent_profiles/gemini-bot-georgia.agent.yaml`

Update `purpose`, `specialization` (primary-focus, secondary-awareness, avoidance-boundary,
success-definition), `collaboration.output-artifacts`, and `initialization-declaration` fields
so Georgia's described output target is the `regnology-ps-chatbots` repository's actual
`gemini-agents/` layout (per T010's verified structure), not a local `gemini-agents/` directory
inside `doctrine-ps`. There are 15+ occurrences of bare `gemini-agents/...` paths across these
fields at spec time — grep the file for `gemini-agents` to find every one; do not rely on this
count if it has changed.

**Steps**:
1. `grep -n "gemini-agents" pack/agent_profiles/gemini-bot-georgia.agent.yaml` to enumerate
   every occurrence.
2. For each occurrence inside `purpose`, `specialization.*`, `collaboration.output-artifacts`,
   or `initialization-declaration`: update the path to reflect the `regnology-ps-chatbots`
   target, including the `shared/` subdirectory split for glossary and branding assets (e.g.
   `gemini-agents/glossary/` → `gemini-agents/shared/glossary/`).
3. Leave every other field (`profile-id`, `roles`, `routing-priority`, `capabilities`,
   `context-sources`, `collaboration.handoff-from/handoff-to/works-with`, `mode-defaults`,
   `specialization-context`, `directive-references`, `styleguide-references`) **completely
   untouched** — do not reformat, reindent, or "clean up" anything outside the four field groups
   named above.
4. After editing, diff the file against its pre-edit state and manually confirm only the four
   field groups changed.

**Acceptance criteria** (verbatim from spec.md FR-012):
- Every occurrence of a bare `gemini-agents/...` path in `purpose`, `specialization`,
  `collaboration.output-artifacts`, and `initialization-declaration` is updated to reflect the
  `regnology-ps-chatbots` target (verified structure, not invented), including the `shared/`
  subdirectory split.
- `profile-id`, `roles`, `routing-priority`, `capabilities`, `context-sources`,
  `collaboration.handoff-from/handoff-to/works-with`, `mode-defaults`, `specialization-context`,
  `directive-references`, and `styleguide-references` fields are **unchanged**.

### Subtask T012 — Update templates batch 1 (FR-013)

**Files**: `pack/templates/gemini/instructions.template.md`, `about.template.md`,
`set-up-guide.template.md`

Correct embedded example paths to match `regnology-ps-chatbots`'s actual layout (per T010's
verified structure): `gemini-agents/glossary/` → `gemini-agents/shared/glossary/`,
`gemini-agents/branding/` → `gemini-agents/shared/branding/`. This resolves the divergence
already flagged in `regnology-ps-chatbots/docs/status.md` § "Open follow-ups".

**Steps**:
1. Grep each file for `gemini-agents/glossary` and `gemini-agents/branding` (and any other bare
   `gemini-agents/...` path examples).
2. Update path examples only. Do **not** change the structural contract these templates
   describe (file roles, required sections, avatar generation rules) unless T010's
   re-verification found the contract itself has also drifted (unlikely, but check).
3. Preserve all templated placeholders (e.g., `{chatbot-slug}/`) exactly as-is — these are not
   real paths and must not be "corrected."

**Acceptance criteria** (verbatim from spec.md FR-013, this batch): path examples in these
three files match the verified `regnology-ps-chatbots` layout; the templates continue to
describe the same output-structure contract — only embedded path examples change.

### Subtask T013 — Update templates batch 2 (FR-013)

**Files**: `pack/templates/gemini/review-submission.template.md`,
`per-agent-folder.template.md`, `roster.template.yaml`

Same correction as T012, applied to the remaining three files. `roster.template.yaml` is the
file most likely to intersect with `receptionist-rob-front-door-rework`'s in-flight
`roster.yaml` restructure (per T010/R1) — pay close attention here: if T010 found the live
`roster.yaml` has dropped `navigator: navigator-nemo` or added `shared/commands/`, reflect that
in `roster.template.yaml`'s own example structure too, not just the glossary/branding path
strings.

**Steps**: Same as T012's steps, applied to these three files. For `roster.template.yaml`
specifically, cross-check its example content against T010's live `roster.yaml` snapshot for
any structural (not just path-string) drift.

**Acceptance criteria** (verbatim from spec.md FR-013, this batch): path examples in these
three files match the verified `regnology-ps-chatbots` layout; the templates continue to
describe the same output-structure contract — only embedded path examples change (unless T010
found the contract itself has drifted, in which case document that explicitly).

### Subtask T014 — Update surface-description docs (FR-014, part 1)

**Files**: `pack/README.md`, `pack/agent_profiles/README.md`, `docs/SURFACES.md`

These three docs' "two agent surfaces" sections (productivity agents in `pack/agent_profiles/`
vs. Gemini chatbots) must state that the Gemini chatbot surface lives in the separate
`regnology-ps-chatbots` repository, not as a directory inside `doctrine-ps`, while preserving
the "two agent surfaces / never mixed" conceptual split.

**Steps**:
1. Find each file's `gemini-agents/` references (`rg -n "gemini-agents" pack/README.md
   pack/agent_profiles/README.md docs/SURFACES.md`).
2. Rewrite so none of the three imply `gemini-agents/` is a committed directory inside
   `doctrine-ps`.
3. Keep the "two agent surfaces" distinction intact and cross-reference the
   `regnology-ps-chatbots` repository as the concrete location.
4. Cross-check the three files against each other for consistency (SC-006 requires **no
   contradictions between the three documents**) — read all three together, not one at a time
   in isolation.

**Acceptance criteria** (verbatim from spec.md FR-014, this part):
- `pack/README.md`, `pack/agent_profiles/README.md`, and `docs/SURFACES.md` no longer describe
  `gemini-agents/` as if it is a committed directory inside `doctrine-ps`.
- The "two agent surfaces" distinction remains intact and cross-references
  `regnology-ps-chatbots` as the concrete location.

### Subtask T015 — Clean `.gitignore`'s dead rules (FR-014, part 2)

**File**: `.gitignore`

A repo-wide search **including dotfiles** (`rg -l --hidden "gemini-agents"`) found three now-dead
`gemini-agents/onboarding-odysseus/...` ignore rules and a comment referencing
`gemini-agents/README.md` in `.gitignore`, even though no such directory exists and no tracked
files match. A prior background search without `--hidden` missed this — re-run with `--hidden`
yourself to confirm current state before editing (the exact count may have changed).

**Steps**:
1. `rg -n --hidden "gemini-agents" .gitignore` to locate the current dead rules/comment.
2. Remove the dead `gemini-agents/onboarding-odysseus/...` ignore rules and the
   `gemini-agents/README.md` comment.
3. Do not remove any `.gitignore` rule unrelated to `gemini-agents/` — scope this edit tightly.

**Acceptance criteria** (verbatim from spec.md FR-014, this part): `.gitignore`'s dead
`gemini-agents/onboarding-odysseus/...` ignore rules and the `gemini-agents/README.md` comment
are corrected or removed so the "zero stale `gemini-agents/` references" success criterion
holds repo-wide, not just across `.md` files.

### Subtask T016 — Markdownlint + grep-verify SC-005/SC-006 + confirm C-002

**Files**: all `owned_files` (read-only verification pass)

**Steps**:
1. Run `markdownlint` against the edited `pack/README.md`, `pack/agent_profiles/README.md`,
   `docs/SURFACES.md`, and the five edited `pack/templates/gemini/*.template.md` files
   (`roster.template.yaml` is YAML, not Markdown — skip it for this check). Fix any new
   violations.
2. Grep-verify **SC-005**: zero remaining references across `gemini-bot-georgia.agent.yaml` and
   the six `pack/templates/gemini/*` files imply Georgia's output lands in a local
   `gemini-agents/` directory inside `doctrine-ps`.
3. Grep-verify **SC-006**: `pack/README.md`, `pack/agent_profiles/README.md`, and
   `docs/SURFACES.md` consistently describe the Gemini chatbot surface as living in
   `regnology-ps-chatbots`, with no contradictions between the three documents.
4. Diff `gemini-bot-georgia.agent.yaml` against its pre-WP state and confirm **C-002**:
   `profile-id`, `roles`, `routing-priority`, and all collaboration/roster wiring fields are
   byte-identical to before. Any change to these fields is a hard failure of this WP.
5. Confirm `pack/.pack-version` was not touched (R3 decision — no bump).

---

## Definition of Done

- [ ] All 7 subtasks complete, T010 run first.
- [ ] `markdownlint` reports 0 new violations on the edited Markdown files.
- [ ] SC-005, SC-006 manually grep-verified and passing.
- [ ] C-002 confirmed via diff: Georgia's identity/wiring fields are byte-identical to pre-WP.
- [ ] `pack/.pack-version` untouched.
- [ ] No file outside `owned_files` was modified; `regnology-ps-chatbots` was not edited.
- [ ] Regnology branding headers (Directive 041) on all edited Markdown files are
      untouched/preserved.

## Reviewer Guidance

- Verify T010 was actually performed and its findings (match or drift) are documented, not
  skipped — this is the highest-risk step in this WP given the concurrent sibling mission.
- Diff `gemini-bot-georgia.agent.yaml` yourself against the pre-WP version; do not trust a
  summary — C-002 violations are easy to miss in a large YAML file.
- Confirm `.gitignore`'s edit is scoped only to the dead `gemini-agents/` rules, nothing else.
- Confirm no `AGENTS.md`, `CLAUDE.md`, or `README.md` changes leaked into this WP (WP01's scope).

## Activity Log

- 2026-07-06T14:19:49Z – claude:sonnet:implementer:implementer – shell_pid=3418248 – Assigned agent via action command
- 2026-07-06T14:41:37Z – claude:sonnet:implementer:implementer – shell_pid=3418248 – Ready for review
- 2026-07-06T14:45:30Z – claude:sonnet:implementer:implementer – shell_pid=3418248 – Ready for review: T010-T016 complete
- 2026-07-06T14:45:57Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3495731 – Started review via action command
- 2026-07-06T14:55:11Z – user – shell_pid=3495731 – Moved to planned
- 2026-07-06T14:56:07Z – claude:sonnet:implementer:implementer – shell_pid=3538987 – Started implementation via action command
- 2026-07-06T15:01:36Z – claude:sonnet:implementer:implementer – shell_pid=3538987 – Cycle 2: addressed review-cycle-1 feedback (SC-005 template qualifiers, description field, T010 documentation)
- 2026-07-06T15:04:34Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3568880 – Started review via action command
- 2026-07-06T15:33:13Z – user – shell_pid=3568880 – Review passed (cycle 2): all 3 cycle-1 findings resolved (SC-005 template qualifiers incl. review-submission.template.md, description field qualifier, T010 drift documented in commit 8bca1f8). C-002 re-verified clean across both cycles combined. Note: review-cycle-2.md is a duplicate/misnamed artifact of the same cycle-1 rejection event (identical content to review-cycle-1.md, same reviewed_at timestamp 2026-07-06T14:55:11Z) — overriding artifact check since this cycle-2 review is a fresh independent pass finding no unresolved issues.
