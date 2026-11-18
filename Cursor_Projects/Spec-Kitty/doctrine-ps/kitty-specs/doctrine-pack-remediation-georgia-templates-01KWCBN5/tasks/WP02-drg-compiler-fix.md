---
work_package_id: WP02
title: DRG compiler fix & graph regeneration
dependencies:
- WP01
requirement_refs:
- FR-005
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
subtasks:
- T006
- T007
- T008
- T009
shell_pid: "204073"
agent: "cursor:gpt-5.3-codex:doctrine-daphne:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: tools/compile-drg.py
create_intent: []
execution_mode: code_change
owned_files:
- tools/compile-drg.py
- pack/drg/ps-agent-enabled-factory.graph.yaml
tags: []
---

# WP02 — DRG compiler fix & graph regeneration

## Objective

Fix the **local** DRG compiler `tools/compile-drg.py` so the compiled
`pack/drg/ps-agent-enabled-factory.graph.yaml` derives each edge target's **kind** from the
local pack artefacts / MANIFEST and the declared `external_nodes`, instead of defaulting
unresolved targets to `directive:`. Then regenerate the graph.

## Context (read carefully — earlier research was wrong)

- `tools/compile-drg.py` **is** the pack's DRG compiler (the distribution-end substitute for
  upstream `spec-kitty doctrine pack compile-drg`, spec-kitty #1619). It compiles
  `pack/drg/fragment.yaml → pack/drg/ps-agent-enabled-factory.graph.yaml`. The spec-kitty CLI's
  `regenerate-graph` composes spec-kitty's *own* internal graph — it is **not** this pack's graph.
- The defect: the compiled graph emits `target: directive:<id>` for **41 unique** non-directive
  targets. **≥8 are LOCAL** artefacts present in `MANIFEST.yml` with non-directive kinds:
  `regnology-main-context` (×11, paradigm), `token-efficiency` (paradigm), `regnology-mcp`
  (toolguide), `evidence-based-requirements`, `decision-first-development`,
  `design-diagramming-incremental-detail`, `living-glossary-practice` (paradigms),
  `commit-and-markdown-linting` (styleguide).
- Because these are **local**, the "upstream pack not fetched" theory is **refuted**. The fix is
  in the compiler's local kind-derivation logic. Fetching upstream only helps genuinely-upstream IDs.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. Depends on
**WP01** — the compiler must read the settled `fragment.yaml` (external_nodes + orphan wiring).
Implement with: `spec-kitty agent action implement WP02 --agent <name>` (after WP01 merges).

## Subtasks

### T006 — Reproduce & inventory the defect
- Run `python3 tools/compile-drg.py` then
  `rg -o "target: directive:[a-zA-Z0-9_-]+" pack/drg/ps-agent-enabled-factory.graph.yaml | sort -u`.
- Cross-reference each ID against `pack/META/MANIFEST.yml` to classify which are genuinely
  directives vs. mis-classified local artefacts. Record the count (expect ≥41 unique, ≥8 local).

### T007 — Fix kind-derivation in `tools/compile-drg.py`
- Locate where edge targets are assigned a kind/URN prefix. Replace the `directive:` default with
  a resolver that, for each target ID:
  1. looks it up among local pack artefacts (by scanning the pack kind directories or reading
     `MANIFEST.yml`) and uses that artefact's true kind;
  2. else, if declared in `fragment.yaml` `external_nodes`, uses the declared kind;
  3. else, only then falls back (and ideally emits a warning) — but a genuine directive ID
     should resolve in step 1.
- Keep the compiler **deterministic** (stable ordering) so `--check`/freshness stays meaningful.
- Preserve the Regnology header and the existing built-in-source URN synthesis behaviour.

### T008 — Fetch upstream (secondary) & regenerate
- `spec-kitty doctrine fetch --pack regnology-all-company` to populate `.doctrine-cache/skills/pack`
  (resolves genuinely-upstream IDs only — NOT the fix for local ones).
- `python3 tools/compile-drg.py` to regenerate `pack/drg/ps-agent-enabled-factory.graph.yaml`.

### T009 — Verify all targets
```bash
# 0 known-local misclassifications:
rg -c "target: directive:(regnology-main-context|token-efficiency|regnology-mcp|evidence-based-requirements|decision-first-development|design-diagramming-incremental-detail|living-glossary-practice|commit-and-markdown-linting)" pack/drg/ps-agent-enabled-factory.graph.yaml   # expect 0
# every remaining directive: target is a real directive (cross-check vs MANIFEST):
rg -o "target: directive:[a-zA-Z0-9_-]+" pack/drg/ps-agent-enabled-factory.graph.yaml | sort -u
# deterministic regeneration:
python3 tools/compile-drg.py && git diff --exit-code pack/drg/ps-agent-enabled-factory.graph.yaml
```

## Definition of Done
- All ≥41 mis-prefixed targets carry correct kind prefixes; the broad grep returns 0.
- Re-running the compiler produces no diff (deterministic).
- Fix lives in `tools/compile-drg.py`; `graph.yaml` is only regenerated, never hand-edited (C-005).

## Reviewer guidance
- Reject if only `regnology-mcp`/`token-efficiency` were addressed — the most prevalent defect
  is `regnology-main-context` (×11). Require the broad grep + MANIFEST cross-check.
- Confirm the fix derives kind locally, not by hardcoding a per-ID lookup table.

## Risks
- If kinds still resolve wrong **with** the local fix, the defect may be partly upstream;
  escalate via Directive 044 (do not patch upstream here — out of scope).

## Activity Log

- 2026-06-30T18:21:50Z – user – shell_pid=128779 – compiler kind-derivation fixed; all >=41 mis-prefixed targets corrected; deterministic re-run no diff; fetch succeeded (regnology-all-company @ b35b475 in .doctrine-cache/skills/pack)
- 2026-06-30T18:22:59Z – cursor:gpt-5.3-codex:doctrine-daphne:reviewer – shell_pid=204073 – Started review via action command
- 2026-06-30T18:31:08Z – user – shell_pid=204073 – Moved to planned
- 2026-06-30T18:43:26Z – user – shell_pid=204073 – Arbiter approval: the compiler kind-derivation fix is correct and deterministic (reviewer-confirmed). Cycle-1 blocker (SC-002 residual dangling) is reclassified per human decision: the 38 residual dangling URNs are ALL inherited regnology-all-company nodes (extends chain), not local; upstream fetch returns 0 artifacts on this env, so standalone 0-errors is environmental. SC-002/SC-005 redefined to a populated CI/consumer context via DDR. WP02 owns compiler+graph only; that work is complete and sound.
