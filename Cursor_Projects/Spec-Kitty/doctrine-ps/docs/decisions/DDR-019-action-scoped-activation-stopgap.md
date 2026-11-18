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

# DDR-019: Action-Scoped Doctrine Activation — Stopgap Pending Upstream Wiring

**Status:** Accepted
**Date:** 2026-07-04
**Author:** PS doctrine maintainers (recorded by Cursor agent, MIGRATION-2898)
**Related:** MIGRATION-2505 (AC#2), MIGRATION-2897, MIGRATION-2898

---

## Context

MIGRATION-2505 AC#2 requires that `spec-kitty charter context --action implement --json` return
directives/tactics scoped to the current mission action, not just the unscoped `all_directives`
list. MIGRATION-2897 smoke testing (against a real consumer, `regnology-docgen`, genuine first
load) confirmed the action-scoped `directives`/`tactics` arrays were empty. MIGRATION-2898 was
opened to close the gap, with a premise that the fix was to author
`pack/actions/<action>/index.yaml`.

That premise was incorrect. Direct inspection of the installed `spec-kitty-cli` 3.2.4 package
source (`specify_cli.doctrine.org_charter`, `charter.activations`, `charter.context`,
`charter.extractor`) established the actual mechanism:

1. `pack/actions/<action>/index.yaml` does not exist as a concept read by any installed spec-kitty
   code path. It appears only in agent-skill documentation describing spec-kitty's own **built-in**
   mission-type definitions (`src/doctrine/missions/<type>/actions/<action>/index.yaml`, package-
   internal), not something org/departmental packs author.
2. Action-scoped surfacing at runtime is driven by `charter.activations.resolve_for_context`,
   matching `ActivationEntry` rows (`activation_context: {mission_type, action}` →
   `doctrine_pack_id`/`artifact_id`/`artifact_kind`) against the current mission action.
3. `ActivationEntry` rows are populated into `GovernanceConfig.activations` **exclusively** by
   scanning fenced YAML blocks in the **consuming project's own `charter.md`**
   (`charter.extractor._collect_activations_from_section`) — a project-repo-local, per-engagement,
   human-authored mechanism.
4. `OrgCharterPolicy.activations` — a field our `org-charter.yaml` genuinely can populate
   (landed under FR-008/WP06) — is parsed and folded across the `extends:` chain
   (`org_charter.py::_fold_policies`), but the merged result is **never consumed anywhere else** in
   the installed package. No code path copies it into the interview, `charter.md`, or
   `governance.yaml`. It is a schema-valid, semantically inert field in spec-kitty-cli 3.2.4.
5. A GitHub issue search on both `Regnology/spec-kitty` (issues disabled on that fork) and the
   upstream `Priivacy-ai/spec-kitty` found no existing report of this specific gap.

## Decision

### Decision 1 — File the gap upstream, do not attempt to work around it in code

The correct fix (wiring `OrgCharterPolicy.activations` into `GovernanceConfig.activations` /
runtime resolution) lives in spec-kitty itself, not in our pack. Filed as
[Priivacy-ai/spec-kitty#2365](https://github.com/Priivacy-ai/spec-kitty/issues/2365). We do not
attempt a local patch, fork, or CLI shim to force the wiring — that would create a maintenance
burden disproportionate to the gap and risk diverging from the upstream fix's eventual shape.

### Decision 2 — Populate `org-charter.yaml`'s `activations:` field now, as a forward-compatible no-op

`pack/org-charter.yaml` now declares 16 `activations:` entries mapping PS directives/tactics to
the mission actions they are most relevant to (`specify`/`plan`/`implement`/`review` × the pack's
`CONTEXT_AWARE_DESIGN` directive and its design/SQLX/PowerShell tactics). This is schema-valid
(verified via direct `OrgCharterPolicy.model_validate` load) and currently has **zero runtime
effect** per Decision-context finding #4. It costs nothing to ship now and requires no further
pack change once the upstream wiring lands — the entries will simply start taking effect.

Directives that are **not** mission-action-scoped by nature (`ACTION_ITEM_ATTRIBUTION`,
`MINUTES_STAND_ALONE` — meeting-minutes governance; `AD_HOC_PROMPT_CAPTURE` — explicitly governs
sessions *outside* formal mission actions) are deliberately excluded from the `activations:` list.
They remain in the always-on `required_directives` list, which is unaffected by this change.

### Decision 3 — Document the manual per-repo workaround for engagement teams that need it today

`docs/installation/HOW_TO_USE.md` now documents that engagement repos can paste an equivalent
`activations:` block into their own `.kittify/charter.md` to get action-scoped surfacing
immediately (this path **is** wired today, per finding #3). This is explicitly framed as a
temporary, per-repo duplication of the org pack's recommendation, to be removed once the upstream
fix lands and the org-pack-level registry takes over automatically.

## Consequences

- MIGRATION-2505 AC#2 cannot be marked fully satisfied by a pack-only change while spec-kitty-cli
  3.2.4 is the org's active baseline. MIGRATION-2898 is closed with this stopgap; a follow-up
  ticket should re-verify AC#2 once spec-kitty ships the upstream fix (track
  Priivacy-ai/spec-kitty#2365).
- The `activations:` mapping in `org-charter.yaml` is a first pass based on each artifact's
  documented purpose/scope text, not an exhaustive doctrine-maintainer review. Revisit the mapping
  once it starts having real effect (post-upstream-fix) rather than gold-plating an inert field now.
- No DRG or schema regressions: `spec-kitty doctrine pack validate pack/` reports the same
  pre-existing `drg_dangling_edge` errors before and after this change (all inherited-upstream
  URNs per DDR-018, unrelated to `org-charter.yaml`). This standalone count has drifted upward
  over time as new cross-layer dependencies were added (150 at DDR-018 → 154 here → 156 as of
  2026-07-06) — see the 2026-07-06 update below for why the standalone figure is not the
  authoritative one to track.

## Update — 2026-07-06: upstream fix landed, re-verification still pending

[Priivacy-ai/spec-kitty#2365](https://github.com/Priivacy-ai/spec-kitty/issues/2365) is now
**closed** (closed 2026-07-04, milestone `3.2.x`, fixed via
[PR #2374](https://github.com/Priivacy-ai/spec-kitty/pull/2374), "wire org-charter activations
into runtime charter context"). The local dev environment's `spec-kitty-cli` has already moved
to **3.2.5** (past the 3.2.4 baseline this DDR was originally written against).

Source-inspected the installed 3.2.5 package directly (`charter/context.py`):
`_iter_org_charter_docs` now has a documented dual purpose — it feeds both the pre-existing
`required_<kind>` reader and a new `_read_org_activations`-style path referenced by
`_load_governance_activations` / `_union_activations`, explicitly citing "the fix does not leave
a third hand-rolled rescan copy — the exact duplication class that caused #2365" in its own
docstring. This matches the suggested-fix shape from the filed issue (union project-local ∪
org-pack activations). The wiring code is present and reads `activations:` from every configured
org pack, not just `required_<kind>` fields as before.

**Not yet empirically re-verified end-to-end** (MIGRATION-2897 methodology: genuine first-load
`spec-kitty charter context --action <x> --json` against a real no-symlink consumer). Attempted
against the one local consumer available on this machine (`regnology-docgen`); blocked by an
unrelated environment gap — its `.kittify/config.yaml` pack entry has no `source_type` and the
pinned local pack cache is not populated on this machine, so no pack was actually loadable to
test against. This is not a doctrine-ps or spec-kitty defect; it is a per-machine setup gap in a
different repo, out of this pack's scope to fix.

**Recommended next step:** re-run the MIGRATION-2897 smoke test against a properly configured
no-symlink consumer (fresh `spec-kitty doctrine fetch --pack ps-agent-enabled-factory` +
`charter context --action implement --json`, first load). If the 16 `activations:` entries in
`pack/org-charter.yaml` surface as expected, MIGRATION-2898 can move from stopgap-only to fully
resolved and MIGRATION-2505 AC#2 can close.

## Update — 2026-07-06: this repo's own upstream wiring was also wrong; now fixed

Separately from the `regnology-docgen` blocker above, an investigation squad found and fixed a
second, unrelated gap in *this* repo: `.kittify/config.yaml`'s `regnology-all-company` source was
pointed at `rfg/skills.git`, an empty scaffold repo with no `pack/agent_profiles/` at all, instead
of the actively-maintained `raf/doctrine-org.git` (see DDR-018's 2026-07-06 update for full
detail). This also removed a dangling `activations:` entry for `lexical-style-diagnostic`
(promoted upstream 2026-07-06, migration PR #1) that referenced a tactic no longer present under
`ps-agent-enabled-factory`.

With the corrected wiring, `spec-kitty doctrine fetch --pack regnology-all-company` now returns 62
artifacts (was 0), and `make validate-layered BASE_PACK_DIR=.doctrine-cache/doctrine-org/pack`
reports **0 errors, 0 advisories** — a genuine layered validation pass on this machine, not just a
theoretical CI-context claim. This does not by itself close AC#2 (that still requires the
`regnology-docgen`-style empirical `charter context --action <x> --json` smoke test against a
real consumer, per the recommended next step above), but it removes one source of doubt about
whether this repo's own doctrine-fetch chain is trustworthy.
