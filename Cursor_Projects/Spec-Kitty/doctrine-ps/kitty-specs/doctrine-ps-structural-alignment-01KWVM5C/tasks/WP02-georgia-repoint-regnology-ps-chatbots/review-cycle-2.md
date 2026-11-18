---
affected_files: []
cycle_number: 2
mission_slug: doctrine-ps-structural-alignment-01KWVM5C
reproduction_command:
reviewed_at: '2026-07-06T14:55:11Z'
reviewer_agent: unknown
verdict: rejected
wp_id: WP02
review_artifact_override_at: "2026-07-06T15:33:12Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP02"
review_artifact_override_reason: "Review passed (cycle 2): all 3 cycle-1 findings resolved (SC-005 template qualifiers incl. review-submission.template.md, description field qualifier, T010 drift documented in commit 8bca1f8). C-002 re-verified clean across both cycles combined. Note: review-cycle-2.md is a duplicate/misnamed artifact of the same cycle-1 rejection event (identical content to review-cycle-1.md, same reviewed_at timestamp 2026-07-06T14:55:11Z) — overriding artifact check since this cycle-2 review is a fresh independent pass finding no unresolved issues."
---

# WP02 Review — Cycle 1 — REJECTED

## Summary

C-002 identity/wiring check **passed** (verified via full manual diff of
`gemini-bot-georgia.agent.yaml`) and several parts of the WP are done well (glossary/branding
path corrections, FR-014 surface docs, `.gitignore` cleanup, NFR-003 markdownlint). However,
**SC-005 is not satisfied**: the WP only performed the narrow `glossary/branding` →
`shared/glossary,branding` path-segment fix, but did not address the broader "no
reference implies local `gemini-agents/`" requirement across the six templates, and missed
one occurrence in the agent profile itself. Additionally, T010's re-verification findings are
undocumented, which the WP's own Definition of Done requires.

## Failing Criteria

### 1. SC-005 — none of the six `pack/templates/gemini/*` files state that `gemini-agents/` lives in `regnology-ps-chatbots`

Verified with `grep -rl "regnology-ps-chatbots" pack/templates/gemini/` → **zero files match**.
Every one of the six templates still reads as if `gemini-agents/` is a directory local to
`doctrine-ps`, e.g.:

- `pack/templates/gemini/per-agent-folder.template.md:19` — "**Output-structure contract**
  for a single agent folder under `gemini-agents/`." (no repo qualifier at all)
- `pack/templates/gemini/per-agent-folder.template.md:89` — "See `gemini-agents/README.md`
  for the pack-backed vs Gemini-only ..." (implies a local, readable path)
- `pack/templates/gemini/about.template.md:20`, `:32` — bare `gemini-agents/{chatbot-slug}/`
  and `gemini-agents/roster.yaml` with no repository context
- `pack/templates/gemini/instructions.template.md:20`, `:31`, `:92`, `:152`, `:160` — same
  pattern, all bare
- `pack/templates/gemini/set-up-guide.template.md:20`, `:67`, `:80`, `:131`, `:147` — same
  pattern, all bare
- `pack/templates/gemini/review-submission.template.md:20` — same pattern (this file was not
  touched at all by the WP, even though it contains an unqualified `gemini-agents/{chatbot-slug}/`
  reference)
- `pack/templates/gemini/roster.template.yaml:14`, `:38`, `:40`, `:50`, `:62` — same pattern

T016's step 2 ("Grep-verify SC-005 ... zero remaining references ... imply Georgia's output
lands in a local `gemini-agents/` directory") does not appear to have actually been run against
the templates — a trivial `regnology-ps-chatbots` grep across the folder returns nothing.

**Fix**: Add a clear, one-time qualifier near the top of each of the six templates (or in each
file's "Output-structure contract" line) stating that `gemini-agents/` is a directory in the
separate `regnology-ps-chatbots` repository, not `doctrine-ps` — mirroring the pattern already
used well in `docs/SURFACES.md` and the `output-artifacts` comment added to
`gemini-bot-georgia.agent.yaml`. Bare in-body path examples (e.g. inside code fences) can stay
unqualified once the file's preamble establishes the repository, per the existing style in
`per-agent-folder.template.md`'s tree diagram — but at least one unambiguous statement per file
is required. `review-submission.template.md` was entirely skipped and needs this treatment too.

### 2. SC-005 — `gemini-bot-georgia.agent.yaml` `description` field (line 9) still bare

`pack/agent_profiles/gemini-bot-georgia.agent.yaml:9` (inside the top-level `description:`
field — not one of the four fields FR-012 required editing, but still in scope for SC-005,
which covers the whole file):

```
front-door agent (recorded as `front_door` in gemini-agents/roster.yaml), which guides
```

This is a bare, unqualified `gemini-agents/roster.yaml` reference identical in form to the ones
correctly fixed elsewhere in the same file (e.g. `purpose` at line 40-41, `initialization-declaration`
at line 232). It was missed.

**Fix**: Update line 9 to match the qualifier style used elsewhere in the file (e.g. "in the
`regnology-ps-chatbots` repository's `gemini-agents/roster.yaml`"). This does not touch any
C-002-protected field — `description` is free to edit for this purpose.

### 3. T010 documentation gap (Definition of Done item, Reviewer Guidance)

No commit message, PR description, or notes file documents T010's re-verification findings
(match vs. drift against the spec's snapshot assumption), as required by:

- WP Definition of Done: "All 7 subtasks complete, T010 run first" (implies findings are
  recorded, not just silently acted on)
- Reviewer Guidance: "Verify T010 was actually performed and its findings (match or drift) are
  documented, not skipped — this is the highest-risk step in this WP"

I independently verified the live `regnology-ps-chatbots/gemini-agents/` structure myself
(`ls gemini-agents/`, `ls gemini-agents/shared/`, `cat gemini-agents/roster.yaml`) and can
confirm the live structure **has drifted further** than the spec's snapshot assumed: the
`receptionist-rob-front-door-rework` sibling mission has already merged its restructure —
`front_door` is now `receptionist-rob` (`managed: repo`, not external), `navigator` is now the
sub-agent path `receptionist-rob/routing` (no more `navigator-nemo` agent at all), and
`shared/commands/` exists alongside `shared/glossary/` and `shared/branding/`. The
implementation's actual content (e.g. `roster.template.yaml`'s new `managed: "{external|repo}"`
field and sub-agent-path `navigator` schema, and the "navigator subagent's catalogue" wording
replacing "Navigator Nemo") **does correctly reflect this live drift** — so T010 was almost
certainly performed correctly in substance. But it is undocumented, which is itself a
Definition-of-Done gap and made it harder to verify with confidence during review.

**Fix**: Add a short note (commit message trailer, or a line in the WP's activity log/handoff)
stating what T010 found: that the live structure had drifted beyond the spec's snapshot
(front-door is now `receptionist-rob` managed as `repo`, `navigator` is now a sub-agent path,
`shared/commands/` was added) and that T011-T013's targets were adjusted accordingly.

## Passing Criteria (for reference, no action needed)

- **C-002 (CRITICAL CHECK)**: PASSED. Full manual diff of `gemini-bot-georgia.agent.yaml`
  confirms only `purpose`, `specialization.primary-focus`, `specialization.success-definition`,
  a comment added immediately above `collaboration.output-artifacts` (no value changes to
  `works-with`/`handoff-from`/`handoff-to`), and `initialization-declaration` changed.
  `profile-id`, `roles`, `routing-priority`, `capabilities`, `context-sources`,
  `collaboration.handoff-from/handoff-to/works-with` (values), `mode-defaults`,
  `specialization-context`, `directive-references`, `styleguide-references` are byte-identical.
- FR-013 `glossary/branding` → `shared/glossary,branding` path corrections: correctly applied
  everywhere; zero remaining un-migrated occurrences found via grep.
- FR-013 placeholders (e.g. `{chatbot-slug}/`) preserved correctly, not "corrected."
- `roster.template.yaml`'s structural update (added `managed: {external|repo}` and sub-agent-path
  `navigator` schema) correctly reflects the live drift found in `regnology-ps-chatbots`.
- FR-014: `pack/README.md`, `pack/agent_profiles/README.md`, `docs/SURFACES.md` all correctly
  state the Gemini chatbot surface lives in `regnology-ps-chatbots`, are mutually consistent
  (SC-006 passes), and preserve the "two agent surfaces" split.
- `.gitignore`: dead `gemini-agents/onboarding-odysseus/...` rules and the
  `gemini-agents/README.md` comment removed; nothing unrelated touched.
- NFR-003: ran `markdownlint -c .markdownlint.yaml` on all edited Markdown files; diffed against
  the base branch's lint output — **0 new violations** introduced by this WP (all reported
  violations pre-exist on the base branch).
- `pack/.pack-version` confirmed untouched (still no diff vs. base).
- Scope discipline: only `owned_files` changed; `regnology-ps-chatbots` was not touched by this
  WP's commits; no `AGENTS.md`/`CLAUDE.md`/top-level `README.md` changes leaked in.

## Required Actions

1. Add a `regnology-ps-chatbots` repository qualifier to each of the six
   `pack/templates/gemini/*` files (including the currently-untouched
   `review-submission.template.md`) so no reference implies `gemini-agents/` is local to
   `doctrine-ps`.
2. Fix the bare reference at `pack/agent_profiles/gemini-bot-georgia.agent.yaml:9` (in
   `description`).
3. Document T010's findings (live structure drift vs. spec snapshot) in a commit message or
   handoff note.
