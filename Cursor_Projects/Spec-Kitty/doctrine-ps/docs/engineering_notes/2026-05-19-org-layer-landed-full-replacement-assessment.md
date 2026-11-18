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

# Engineering Note: Org Layer Has Landed — Full Replacement Assessment

_Version: 1.0.0_  
_Date: 2026-05-19_  
_Author: Stijn Dejongh (with Claude Code analysis support)_  
_Status: Active — supersedes Phase 3 deferral in 2026-05-12 note_  
_Classification: FOR INTERNAL USE ONLY_  
_Predecessor: `docs/engineering_notes/2026-05-12-spec-kitty-doctrine-integration-options.md`_

---

## What Changed Since the May 12 Note

Alphonso's original analysis marked Option B (plug-in doctrine pack) as "Available today: ❌ TBD
(post-3.2.x)." That constraint has been removed.

Commit `fa80fa0f9` merged into `spec-kitty` on 2026-05-19 (today), landing mission
`layered-doctrine-org-layer-01KRNPEE`. The full three-layer org doctrine mechanism is now
functional in the working tree:

| Component | Status |
|---|---|
| `doctrine fetch` CLI (git, HTTPS, API sources) | Shipped |
| `OrgPackConfig` / `PackRegistry` — `.kittify/config.yaml` schema | Shipped |
| Three-layer resolution: shipped → org packs (ordered) → project | Shipped |
| `drg/fragment.yaml` — additive DRG graph extensions per pack | Shipped |
| `spec-kitty doctor doctrine` — full stack audit | Shipped |
| `charter lint` — advisory warnings for org layer overrides | Shipped |
| `org-charter.yaml` — org-wide interview pre-fills + required directives | Shipped |
| Multi-pack iteration (HIGH drift from post-merge review) | Patched in same commit |
| Charter interview pre-fill activation (HIGH drift) | Patched in same commit |

The previously recommended D→C→B phased path can now compress. Phase 3 no longer waits on
upstream feature delivery. The main remaining gate is format conversion effort.

---

## Is Full Replacement Consistent with the Analysis?

**Yes. Full replacement is the intended end state and is now more viable than originally assessed.**

The original note's Phase 3 conclusion was: "Retire regnology-agent-doctrine as a standalone
bootstrap dependency." The executive summary repeated this. The newly landed org layer makes
Phase 3 achievable without a fork or any spec-kitty core contribution.

"Full replacement" means:

1. All governance content (directives, tactics, agent profiles, toolguides, styleguides) is
   converted to spec-kitty YAML schema and distributed as a `regnology-ps-doctrine-pack`.
2. `AGENTS.md` bootstrap is retired. Agents initialize via org-layer profiles loaded
   automatically by spec-kitty; org charter pre-fills replace manual directive selection.
3. Per-project setup cost drops to one `doctrine.org.packs` entry in `.kittify/config.yaml`
   and a one-time `spec-kitty doctrine fetch`.
4. This repository either restructures to host the pack directory, or a dedicated
   `regnology-ps-doctrine-pack` repo is created. Either is valid; see Section 4.

What full replacement does **not** mean:

- regnology-docgen is unaffected. The document pipeline stays in its own repo and is
  referenced from the pack as toolguide YAML artifacts.
- IDE-specific setup (cursor hooks, VS Code settings) is out of scope for doctrine packs.
  It remains a separate distribution concern.
- Historical project decisions (`decisions/` ADRs) are not doctrine artifacts. They stay
  per-project.

---

## Format Gap: What Needs Converting

The pack loader reads from eight recognized artifact subdirectories. Files must carry the
correct YAML suffix; Markdown files are ignored by resolution. The table below maps the
current state of this repository to the target pack layout.

| This repo | Target pack dir | Suffix required | Gap |
|---|---|---|---|
| `doctrine/directives/` (39 `.md` files) | `directives/` | `*.directive.yaml` | Full conversion |
| `doctrine/agents/` (24 `.agent.md` files) | `agent_profiles/` | `*.agent.yaml` | Full conversion + rename |
| `doctrine/tactics/` (`.tactic.md` files) | `tactics/` | `*.tactic.yaml` | Full conversion |
| `doctrine/styleguides/` | `styleguides/` | `*.styleguide.yaml` | Full conversion |
| `doctrine/toolguides/*.md` | `toolguides/` | `*.toolguide.yaml` | Full conversion |
| `doctrine/toolguides/agentic_model_leaderboard.yaml` | `toolguides/` | `*.toolguide.yaml` | Rename + schema fields |
| `doctrine/guidelines/` (5 files) | `directives/` or `procedures/` | `*.directive.yaml` / `*.procedure.yaml` | Conceptual mapping needed |
| `doctrine/approaches/` | No direct equivalent | — | See Section 3 |
| _(absent)_ | `drg/fragment.yaml` | Required — blocks pack load | Must be created |
| _(absent)_ | `org-charter.yaml` | Optional — enables pre-fills | Recommended early |

Additionally, `drg/fragment.yaml` is **required for the pack to load at all**. The loader
raises `OrgPackMissingError` if it is absent. A minimal stub (`nodes: []\nedges: []\n`) is
sufficient to unblock resolution while the DRG edges are authored.

---

## The One Conceptual Gap: `approaches/`

spec-kitty's 8-kind artifact universe is: directives, tactics, styleguides, toolguides,
paradigms, procedures, agent profiles, mission step contracts.

`approaches/` in this repo — worldview-level framing documents that explain *why* a pattern
exists and provide the philosophy behind related tactics — has no direct 1:1 equivalent. The
closest mapping:

- **Paradigm** (`*.paradigm.yaml`): worldview-level framing. Most approaches could map here.
- **Procedure** (`*.procedure.yaml`): stateful multi-step workflows with entry/exit conditions.
  Approaches that prescribe a sequence of steps fit here.

A triage pass over `approaches/` to classify each as paradigm, procedure, or "fold into the
related directive/tactic" is needed before conversion. This is a content decision, not a
tooling constraint.

---

## Recommended Path (Updated)

Given that Phase 3 enablement has shipped, the phased approach can be simplified:

### Phase 1 — Minimal viable pack (days, not weeks)

Create a `pack/` subdirectory in this repository with the spec-kitty layout. Convert the
five to eight highest-value artifacts first:

Priority candidates:
- Directive 042 (Model Discipline) — referenced by almost every agent profile
- Directive 041 (Regnology Branding) — Regnology-specific, IP boundary clear
- Agent profiles for the five core personas (architect, curator, editor, implementer, reviewer)
- `agentic_model_leaderboard.yaml` → renamed + schema fields added
- `drg/fragment.yaml` — minimal stub
- `org-charter.yaml` — mark 041 and 042 as `required_directives`; add Regnology-specific
  `interview_defaults` for model tier and branding

Configure `.kittify/config.yaml` in engagement repos:

```yaml
doctrine:
  org:
    packs:
      - name: regnology-ps
        local_path: /path/to/regnology-agent-doctrine/pack
        source_type: git
        url: <internal git remote>
```

At this point the pack loads, doctor doctrine shows it, and the charter interview pre-fills
Regnology defaults. This is a working org layer, not a stub.

### Phase 2 — Full content conversion (weeks)

Convert all 39 directives, 24 agent profiles, tactics, styleguides, and toolguides.
Triage `approaches/` against paradigms/procedures. Author DRG edges in `drg/fragment.yaml`.
Retire the Markdown originals once YAML equivalents are validated.

Retire `AGENTS.md` as the primary initialization path. The pack's agent profiles replace it.

### Phase 3 — Governance and distribution

Decide on repository structure (restructure this repo vs. new `regnology-ps-doctrine-pack`
repo). Decide on versioning cadence and release tagging. Add `spec-kitty doctrine fetch` to
the standard engagement toolchain setup script. Full replacement is complete.

---

## Open Decisions (Carried Forward from May 12 Note)

1. **Repo structure.** Does this repo restructure to become the pack repo (adding `pack/`
   at root), or does a new dedicated `regnology-ps-doctrine-pack` repo get created? The
   new repo option keeps a clean separation between the pack content and this repo's
   operational tooling. The in-place option avoids a new repo bootstrap step.

2. **Contribution appetite.** The org layer is now in spec-kitty open-core. Some generic
   Regnology directives (test-first, locality-of-change, etc.) could be proposed as
   additions to the spec-kitty built-in pack rather than duplicated in the org pack. A
   quick triage of the 39 directives against spec-kitty's shipped set would identify the
   candidates.

3. **`approaches/` mapping.** Paradigm vs. procedure classification for each approach
   document. This can be done incrementally — low-priority approaches can remain as
   reference Markdown and be converted last.

4. **regnology-docgen integration point.** The branded document pipeline should appear in
   the pack as a `toolguide.yaml` artifact. Decide whether it lives in the doctrine pack
   or in a separate docops-owned pack entry.

---

## Technical Reference

Pack layout expected by `spec-kitty` org layer resolver:

```
<pack-root>/
  directives/            # *.directive.yaml
  tactics/               # *.tactic.yaml
  styleguides/           # *.styleguide.yaml
  toolguides/            # *.toolguide.yaml
  paradigms/             # *.paradigm.yaml
  procedures/            # *.procedure.yaml
  agent_profiles/        # *.agent.yaml
  mission_step_contracts/
  drg/
    fragment.yaml        # REQUIRED — nodes/edges; empty list is valid
  org-charter.yaml       # OPTIONAL — interview_defaults, required_directives
```

Directive YAML minimum fields (from spec-kitty schema):

```yaml
schema_version: "1.0"
id: DIRECTIVE_042
title: Model Discipline
intent: >
  ...one-line intent statement...
enforcement: required   # or: recommended, advisory
```

Agent profile YAML minimum fields:

```yaml
profile-id: architect-alphonso
name: Architect Alphonso
description: ...
schema-version: "1.0"
roles:
  - architect
capabilities:
  - ...
```

`drg/fragment.yaml` minimum (unblocks pack loading):

```yaml
nodes: []
edges: []
```

`org-charter.yaml` structure:

```yaml
interview_defaults:
  model_tier: mid
  branding: regnology-ps
required_directives:
  - DIRECTIVE_041
  - DIRECTIVE_042
governance_policies: []
```

---

_[Analysis: Claude Code + Stijn Dejongh] — 2026-05-19_
