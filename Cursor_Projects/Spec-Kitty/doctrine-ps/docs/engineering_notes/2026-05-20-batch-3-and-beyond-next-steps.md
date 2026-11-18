<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██                                              |
|████                                                |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Engineering note: batch 3 and beyond — state as of 2026-05-20

_Version: 1.0_  
_Date: 2026-05-20_  
_Author: Stijn Dejongh (with Claude Code support)_  
_Status: Active_  
_Predecessor: `docs/engineering_notes/2026-05-19-org-layer-landed-full-replacement-assessment.md`_

---

## Current state

Batches 1 and 2 are complete. The pack is functional, loadable, and exercised by a 108-test
suite (4 xfailed pending an upstream spec-kitty fix for `guide_path` pattern validation, tracked
at spec-kitty#1157).

| Component | Status |
|---|---|
| All batch 1 artifacts (Domain A + 7 agent profiles) | Shipped |
| All batch 2 artifacts (Domain D + E: 9 tactics, 4 styleguides, 2 procedures, 1 paradigm) | Shipped |
| Comms Cleo (replaces Editor Eddy) | Shipped |
| `pack/drg/fragment.yaml` — 33 nodes, 68 edges | Shipped |
| Template migrations (audience, lexical, documentation, tickets, coordination, CI, security, branding) | Shipped |
| `pack/styleguides/professional-communications` + `regnology-branding` | Shipped |
| `pack/directives/018-traceable-decisions`, `022-audience-oriented-writing`, `023-clarification-before-execution` | Shipped |

The `doctrine/` directory has not been retired yet. That is intentional: the retirement commit
is a one-way action and should wait until batch 3 (Domain B agent profiles) is also complete,
so that all Markdown originals for content that has been migrated can be removed in a single
sweep rather than piecemeal.

---

## What remains

### Batch 3 — Domain B agent profiles (8 artifacts)

These are the genuinely Regnology-specific profiles with no spec-kitty built-in equivalent,
plus two profiles that override shipped built-ins with Regnology toolchain specifics.

| Profile | Type | Key differentiator |
|---|---|---|
| `analyst-annie` | unique | Requirements elicitation, testable spec authoring; also the parent for `abacus-mapper-abe` (`specializes-from`) |
| `bootstrap-bill` | unique | Repo topology mapping, multi-agent onboarding scaffolding |
| `lexical-larry` | unique | Writing style diagnostics, tone calibration — distinct from `comms-cleo` which authors content |
| `manager-mike` | unique | Multi-agent routing and workflow coordination |
| `scribe-sally` | unique | Meeting notes and interaction transcription |
| `translator-tanya` | unique | Cross-language translation with tone preservation |
| `frontend-freddy` | override | Built-in Freddy is a browser implementer; Regnology Freddy is a UI architect/designer |
| `java-jenny` | override | Adds Regnology AppSec toolchain: `sonar.regnology.net`, SpotBugs, DependencyTrack, CycloneDX |

Completion of batch 3 resolves the forward DRG reference from `abacus-mapper-abe → analyst-annie`
and makes the `delegates_to` edge resolvable at merge time.

After batch 3, update the DRG fragment with the 8 new nodes and their edges.

---

### Doctrine/ retirement (after batch 3)

Once batch 3 ships, the following `doctrine/` directories can be retired in a single commit:

- `doctrine/agents/` — all profiled agents are now in `pack/agent_profiles/`
- `doctrine/directives/` — all migrated directives are in `pack/directives/`
- `doctrine/tactics/` — all migrated tactics are in `pack/tactics/`
- `doctrine/styleguides/` — all migrated styleguides are in `pack/styleguides/`
- `doctrine/toolguides/` — all migrated toolguides are in `pack/toolguides/`
- `doctrine/templates/` — fully migrated to `pack/templates/`
- `doctrine/approaches/` — all migrated approaches are in `pack/procedures/` or `pack/paradigms/`

Artifacts that were deliberately skipped (D016, D017, D021, D036, D037, D038 — shipped spec-kitty
equivalents are sufficient) do not require a migration file; retiring the source directories
implicitly drops them.

`doctrine/guidelines/` can be reviewed last: java-conventions and python-conventions are deferred
to batch 6 (upstream contribution candidates); the others are already covered by `pack/styleguides/`.

**Precondition before retiring:** run `spec-kitty doctor doctrine` against an engagement repo
using the pack and confirm no artifacts currently referenced by the charter resolve from
`doctrine/` rather than `pack/`. Any remaining `doctrine/**` path references in YAML files
must be resolved first — the stale path remediation pass done in the previous session covered
most of these, but a final `grep -r "doctrine/" pack/` before the retirement commit is prudent.

---

### Batch 4 — Domain F: DDD & architecture (~21 artifacts)

Contains Regnology-flavored DDD patterns and architecture governance.
Notable deferred work:

| Category | Count | Notes |
|---|---|---|
| Directives (D025 Framework Guardian, D006 Version Governance) | 2 | No spec-kitty equivalents |
| Tactics | ~8 | `context-boundary-inference`, `team-interaction-mapping`, `requirements-validation-workflow`, others |
| Styleguides | 1 | `domain-driven-naming` |
| Paradigms (from approaches/) | ~10 | Bounded-context canvas, AMMERSE-related approaches |

Classification of the approaches into paradigm vs. procedure is the main decision gate for this batch.

---

### Batch 5 — Domain G: platform & tooling (~14 artifacts)

Lower priority. Contains Regnology-specific shell conventions, SQLX tooling, and infrastructure
patterns. Deferred until a decision is made on OD-2 (D001 CLI & Shell Tooling vs.
spec-kitty's `efficient-local-tooling`).

Key artifacts: `sqlx-author-arthur`, `sqlx-interpreter-indy` agent profiles; SQLX tactics;
ripgrep toolguide.

---

### Batch 6 — Domain H: generic craftsmanship (~33 artifacts, mostly deferred)

Most of these have close spec-kitty shipped equivalents and should be submitted upstream
rather than duplicated in the org pack. A one-pass triage (compare each against the shipped
set, mark as skip/upstream/migrate) is the pre-work for this batch. This is the lowest-priority
remaining work.

---

### Template migrations still pending

The following `doctrine/templates/` subdirectories have not yet been moved to `pack/templates/`:

| Source | Contents | Priority |
|---|---|---|
| `doctrine/templates/presentations/reveal-js/` | Reveal.js Regnology-branded template | Medium — referenced by `create-branded-slidedeck` procedure |
| `doctrine/templates/architecture/` | ADR templates, design doc templates | Low |
| `doctrine/templates/agents/` | Agent prompt templates | Low |
| `doctrine/templates/PDF/` | Branded PDF document template | Low |
| `doctrine/templates/diagramming/` | PlantUML/Mermaid brand themes | Medium — referenced by diagram-daisy |

The Reveal.js template is the most important gap: `create-branded-slidedeck` instructs agents
to copy from `pack/templates/presentations/reveal-js/` but the directory does not yet exist.

---

### Outstanding open decisions

| # | Decision | Blocking batch |
|---|---|---|
| OD-2 | D001 vs. spec-kitty `efficient-local-tooling`: skip or override? | 5 |
| OD-3 | Domain H upstream contribution candidates | 6 |
| OD-4 | Approaches → paradigm or procedure: classification pass needed | 4 |
| OD-5 | D018 (Traceable Decisions) vs DIRECTIVE_003: confirmed richer, keep as override | ✅ closed (batch 2 migrated it) |

---

### xfail cleanup

Four tests are marked `xfail(strict=True)` pending upstream spec-kitty#1157 (`guide_path`
pattern validation). Once that PR merges into the fork and is pulled here, remove
`_UPSTREAM_GUIDE_PATH_XFAIL` markers from `tests/test_pack_schema_validation.py`.

---

## Pack coverage at batch 3 completion (projected)

| Kind | Current count | After batch 3 | After all batches |
|---|---|---|---|
| Directives | 7 | 7 | ~11 |
| Agent profiles | 7 | 15 | ~17 |
| Tactics | 9 | 9 | ~25 |
| Styleguides | 4 | 4 | ~9 |
| Toolguides | 3 | 3 | ~8 |
| Procedures | 2 | 3 | ~5 |
| Paradigms | 1 | 1 | ~12 |
| **Total nodes** | **33** | **42** | **~87** |

These figures exclude the ~33 Domain H artifacts, the majority of which will be deferred
upstream rather than added to the pack.

---

_[Stijn Dejongh with Claude Code] — 2026-05-20_
