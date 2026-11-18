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

# Engineering Note: Integrating regnology-agent-doctrine into spec-kitty

_Version: 1.0.0 (FIRST PASS)_
_Date: 2026-05-12_
_Author: Architect Alphonso_
_Status: Draft — awaiting human decision on open questions_

---

## Context

This note assesses how to migrate the contents of `regnology-agent-doctrine` and its agent doctrine
into [spec-kitty](https://github.com/SDD-dev/spec-kitty), while keeping Regnology-focused doctrine
information separate from the open-core spec-kitty codebase.

The assessment was requested with two anchor options in scope:

1. Using only the as-is charter mechanism.
2. Using planned spec-kitty support for plug-in doctrine stacks.

Additional options were also explored. The companion initiative `regnology-docgen` (branded
document and presentation generation stack) is explicitly considered throughout.

---

## 1. System Landscape

```
┌──────────────────────────────────┐   ┌──────────────────────────────────────┐
│  regnology-agent-doctrine         │   │  spec-kitty (open-core)               │
│                                  │   │                                      │
│  doctrine/                       │   │  src/doctrine/                       │
│    guidelines/ (5 files)         │   │    directives/shipped/  (10 yaml)    │
│    directives/ (39 .md files)    │   │    tactics/shipped/                  │
│    agents/ (24 .agent.md)        │   │    agent_profiles/shipped/ (11 yaml) │
│    tactics/                      │   │    missions/  (4 workflows)          │
│    approaches/                   │   │    graph.yaml (DRG)                  │
│    templates/                    │   │    service.py (2-source loader)      │
│    toolguides/                   │   │                                      │
│                                  │   │  src/charter/  (DRG synthesis)       │
│  regnology-docgen (sibling repo) │   │  src/specify_cli/runtime/            │
│    branded PDF/slide pipeline    │   │    resolver.py (5-tier resolution)   │
│    brand assets + CSS surfaces   │   │                                      │
│                                  │   │  .kittify/charter/charter.md         │
│                                  │   │  .kittify/doctrine/  (project-local) │
└──────────────────────────────────┘   └──────────────────────────────────────┘
```

**Key structural observation:** `DoctrineService` (spec-kitty) already accepts a `shipped_root` and
a `project_root`, merging repositories from both. The 5-tier template resolver (`resolver.py`)
follows the same overlay pattern. The project-local overlay landing zone (`.kittify/doctrine/`) is
populated today by `charter synthesize`. **The architectural seam for a separate doctrine namespace
already exists; it just has no third-party/org-level slot yet.**

---

## 2. Migration Scope

| regnology-agent-doctrine artifact | Format | Equivalent in spec-kitty | Migration effort |
|---|---|---|---|
| 39 directives | `.md` prose | `*.directive.yaml` (structured YAML, DRG-linked) | **High** — format conversion + DRG edges |
| 24 agent profiles | `.agent.md` | `*.agent.yaml` (Pydantic-validated) | **Medium** — schema migration |
| Guidelines (5 files) | Markdown | `charter.md` sections / paradigms | **Medium** — conceptual mapping |
| Tactics | `.md` | `*.tactic.yaml` | **Medium** — format conversion |
| Approaches | `.md` | No direct equivalent (closest: procedures/paradigms) | **High** — conceptual gap |
| Templates | `.md` | `missions/*/templates/` | **Medium** |
| Toolguides | Markdown | `*.toolguide.yaml` | **Low** — clear 1:1 |
| Regnology branding (docops) | CSS/Python pipeline | External tool — stays in regnology-docgen | N/A |

Of the 39 directives, approximately 15 contain clearly Regnology-specific content (ABACUS360
integration, branding, Jira/Confluence tooling, model-leaderboard, internal patterns). The
remaining ~24 are sufficiently generic that equivalents may already exist in spec-kitty's shipped
set, or could be proposed as upstream contributions.

---

## 3. Options

### Option A — Charter-Only Integration (as-is charter)

Encode all Regnology governance decisions in a `charter.md` policy document. Run
`charter interview --comprehensive` + manual editing. Run `charter synthesize` to promote
project-local doctrine artifacts into `.kittify/doctrine/`. Regnology agents receive governance
context via `charter context --action <action>` (DRG-injected). The regnology-agent-doctrine repo
is gradually sunset; the charter becomes the single source of truth.

**What this does not solve:**
- Regnology's 24 agent profiles cannot currently be expressed as charter-derived artifacts
  (charter synthesizes directives/tactics, not profiles).
- The 39 narrative directive `.md` files have no mechanical import path into the YAML schema.
- The charter is per-project, not per-organisation — there is no "org-level charter" that every
  Regnology project inherits automatically.

| Criterion | Assessment | Notes |
|---|---|---|
| Ease of migration | ⚠️ Medium | Charter interview maps guidelines naturally; directives require manual YAML transcription |
| End-user UX | ✅ Good | Standard `spec-kitty charter` commands; nothing Regnology-specific to learn |
| Stability | ⚠️ Medium | Per-project; each new engagement must re-derive the Regnology layer |
| Portability | ❌ Low | No "inherit org charter" mechanism; each project charter is a fresh island |
| IP separation | ⚠️ Partial | Charter lives inside each project repo; proprietary directives visible in project history |
| regnology-docgen alignment | ❌ None | Brand pipeline and tooling stay disconnected |

---

### Option B — Plug-in Doctrine Stack (planned spec-kitty support)

Introduce a third source slot into `DoctrineService`: `org_root`, sitting between `shipped/` and
`project_root/`. This is architecturally consistent with the existing design. The Regnology
doctrine repo would be distributed as a **doctrine pack** — a directory tree of schema-validated
YAML artifacts installed once per machine, inherited by all projects.

**Proposed resolver chain:**

```
1. Project override            (.kittify/doctrine/)
2. Project legacy              (kitty-specs/doctrine/)
3. Org-level pack              (~/.kittify/org/<pack-name>/)    ← NEW
4. User-global                 (~/.kittify/)
5. Shipped (open-core)         (src/doctrine/)
```

**Concrete pack layout:**

```
~/.kittify/org/regnology-ps/
  directives/
    041-regnology-branding.directive.yaml
    042-model-discipline.directive.yaml
    ...
  agent_profiles/
    abacus-mapper-abe.agent.yaml
    ...
  toolguides/
    agentic-model-leaderboard.toolguide.yaml
    ...
  graph-extensions.yaml          ← additive DRG edges
```

**What this requires from spec-kitty:**
- `DoctrineService` gains an `org_roots: list[Path]` parameter.
- Each Repository (`DirectiveRepository`, `AgentProfileRepository`, etc.) gains a merge layer.
- `charter status` / `charter lint` learn to validate org-layer artifacts.
- DRG `graph.yaml` supports additive `graph-extensions.yaml` files layering on top without
  replacing the base graph.
- A `spec-kitty pack install <url-or-path>` command (or symlink convention) to register packs.

The regnology-agent-doctrine content would be converted to spec-kitty YAML schema and published as
a versioned private `regnology-ps-doctrine-pack`. The repo retains its git history and IP
boundary.

| Criterion | Assessment | Notes |
|---|---|---|
| Ease of migration | ❌ Hard | Requires spec-kitty core changes AND full format conversion |
| End-user UX | ✅ Excellent | Install once; all projects inherit; standard commands work |
| Stability | ✅ High | Single installation, versioned pack, DRG validation enforced |
| Portability | ✅ High | Pack is self-contained, installable in any spec-kitty environment |
| IP separation | ✅ Clean | Open-core ships without Regnology artifacts; pack is a private repo |
| regnology-docgen alignment | ✅ Natural | docops toolguides authored as pack artifacts |

---

### Option C — `.kittify/doctrine/` Overlay Per Project (pragmatic bridge)

Use the existing project-local doctrine overlay without waiting for plug-in support.
`DoctrineService` already merges `project_root` over `shipped/`. The Regnology doctrine pack can
be placed directly into `.kittify/doctrine/` as a **manually managed overlay**, bypassing
`charter synthesize`.

This is Option B at a lower level of formalization: no `org_root` slot, no `pack install` command,
but the overlay already works. Distribution via `git subtree add` or a small installer script.

| Criterion | Assessment | Notes |
|---|---|---|
| Ease of migration | ⚠️ Medium | Partial format conversion; no spec-kitty core changes required |
| End-user UX | ⚠️ Moderate | Bootstrap step required per project; overlay management is manual |
| Stability | ⚠️ Medium | No formal validation at install time; drift possible across projects |
| Portability | ⚠️ Medium | Works anywhere spec-kitty runs; install is per-project not per-machine |
| IP separation | ✅ Clean | Private repo stays private; `.kittify/doctrine/` is gitignored by default |
| regnology-docgen alignment | ⚠️ Partial | Toolguides can live here; brand assets remain separate |

---

### Option D — Parallel Operation + Gradual Conversion (low-risk hybrid)

Run both systems in parallel; converge incrementally:
- spec-kitty manages mission workflow and project governance via charter.
- regnology-agent-doctrine provides agent profiles and operational directives via `AGENTS.md`
  bootstrap (as today).
- High-value artifacts are converted to spec-kitty YAML over time and placed in
  `.kittify/doctrine/`.
- The two systems converge when Option B's plug-in mechanism lands in spec-kitty.

| Criterion | Assessment | Notes |
|---|---|---|
| Ease of migration | ✅ Low friction | No format conversion upfront; no spec-kitty core changes |
| End-user UX | ⚠️ Mixed | Two systems to understand; onboarding must explain the split clearly |
| Stability | ✅ High | Both systems are stable today; no new moving parts |
| Portability | ⚠️ Medium | Doctrine portability unchanged from today |
| IP separation | ✅ Clean | No IP leaks into open-core |
| regnology-docgen alignment | ✅ Natural | docops continues in its repo; doctrine agents access it via MCP or toolguide |

---

## 4. Comparative Matrix

| Dimension | A (charter-only) | B (plug-in pack) | C (overlay bridge) | D (parallel/hybrid) |
|---|---|---|---|---|
| Migration effort | Medium | **High** | Medium | **Low** |
| Org-level inheritance | ❌ None | ✅ Machine-level | ❌ Per-project only | ❌ None today |
| IP / confidentiality | ⚠️ Partial | ✅ Clean | ✅ Clean | ✅ Clean |
| Spec-kitty core changes required | None | Yes (3-layer service) | None | None |
| Format conversion required | Partial | Full | Partial | Incremental |
| UX for new engagement | Re-derive charter | Install pack, done | Bootstrap script | Use both CLIs |
| regnology-docgen fit | Poor | Excellent | Partial | Natural |
| Available today | ✅ Now | ❌ TBD (post-3.2.x) | ✅ Now | ✅ Now |
| Long-term scalability | ❌ Per-project drift | ✅ Versioned, testable | ⚠️ Manual | ✅ Converges to B |

---

## 5. Recommended Path

Given:
1. `regnology-docgen` is already building modularization primitives, indicating appetite for
   clean separation between tool layers.
2. spec-kitty does not yet have plug-in doctrine support. The `DoctrineService` seam exists but
   the `org_root` slot and `pack install` surface are not in the 3.2.x scope (per ADR
   `2026-05-11-1-defer-391-structural-extraction-from-3-2-x`).
3. regnology-agent-doctrine content is in Markdown, not spec-kitty YAML schema — full conversion
   is a non-trivial effort even before plug-in support lands.

**Proposed phased approach:**

### Phase 1 (now) — Option D: Parallel operation

- Continue using regnology-agent-doctrine for agent initialization (`AGENTS.md` bootstrap).
- Adopt spec-kitty for mission workflow in Regnology engagement repos.
- Document the split clearly in a `HOW_TO_USE` guide for onboarding.
- No format conversion required; no spec-kitty core changes.

### Phase 2 (short-term) — Option C: Overlay bridge

- Convert the 10–15 highest-value Regnology artifacts to spec-kitty YAML format:
  model-discipline toolguide, branding directive, ABACUS360 profile, Regnology-specific
  guidelines.
- Place them in `.kittify/doctrine/` via a bootstrap installer script (shell or Python, housed in
  this repo or regnology-docgen).
- Wire them into `charter.md` so DRG traversal picks them up during `charter context` calls.
- regnology-docgen provides branded output; toolguides reference it as the brand pipeline.

### Phase 3 (when spec-kitty adds org-layer support) — Option B: Plug-in pack

- Propose the `org_roots` slot addition to spec-kitty (either as a contribution or a private fork
  patch).
- Convert remaining Regnology doctrine to YAML schema.
- Publish `regnology-ps-doctrine-pack` as a versioned private repo.
- Retire regnology-agent-doctrine in favour of the pack.

---

## 6. Open Questions

The following require human decision before Phase 2 work can be scoped:

1. **Contribution appetite.** Is there interest and bandwidth to contribute the `org_roots`
   plug-in slot to spec-kitty open-core? This determines whether Phase 3 happens via a PR or
   remains a private fork concern.

2. **Upstream vs. proprietary boundary.** Which Regnology directives are truly proprietary and
   which are generic enough to propose as shipped doctrine in spec-kitty? A triage pass would
   reduce conversion scope for both Phase 2 and Phase 3.

3. **Charter as org baseline.** Should a "Regnology baseline charter" exist that each
   engagement's charter extends? If yes, that is a strong argument for the plug-in approach
   (charter inheritance) over overlay.

4. **regnology-docgen integration point.** Where does the brand pipeline surface in spec-kitty
   workflows — as a `toolguide.yaml`, as a post-mission hook, or as a separate CI step? This
   shapes whether docops and doctrine need to share a distribution mechanism.

---

## Related Artifacts

- `docs/architecture/adrs/` — ADR candidate once phased approach is confirmed
- `regnology-docgen` — `docs/VISION.md`, `SURFACES.md`
- spec-kitty ADR `2026-04-17-1-charter-synthesizer-adapter-seam.md` — synthesizer protocol shape
- spec-kitty ADR `2026-05-11-1-defer-391-structural-extraction-from-3-2-x.md` — deferral context
- spec-kitty `src/doctrine/README.md` — doctrine artifact catalog and design principles
- spec-kitty `src/doctrine/service.py` — `DoctrineService` two-source loader

---

_[Agent: Architect Alphonso] — `/analysis-mode`_
