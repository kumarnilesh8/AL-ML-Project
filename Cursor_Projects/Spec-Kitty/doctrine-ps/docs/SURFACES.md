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

# Repository surfaces — directory reference

This document is the authoritative reference for the `doctrine-ps`
repository layout. Every directory has a single, clearly bounded purpose.
Agents and contributors must consult this document before deciding where a new
file belongs.

---

## Directory conventions (canonical)

| Directory | Purpose | Committed? | Distributed? |
|-----------|---------|-----------|-------------|
| `pack/` | Shippable doctrine artefacts | ✅ | ✅ via `spec-kitty doctrine fetch` |
| `config/` | Dashboard and organisational management configuration | ✅ | ❌ engagement-local |
| `docs/` | **Documentation only** — notes, ADRs, guides, HOW_TO_USE | ✅ | ❌ |
| `tools/` | Development-time utilities not imported by production | ✅ | ❌ |
| `tools/surfaces/` | Shared source overlays for local generated agent/IDE harnesses | ✅ | ❌ local regeneration input |
| `kitty-specs/` | Spec-kitty mission artefacts (specs, plans, WPs) | ✅ | ❌ |
| `.kittify/` | Spec-kitty project runtime (charter, synthesis, workspaces) | ✅ (charter) | ❌ |
| `.cursor/`, `.claude/` | Local generated agent/IDE harness output | ❌ gitignored | ❌ |
| `gemini-agents/` | **Not a directory in this repository.** Generated Gemini Enterprise **chatbot** distribution surface — output of Gemini Bot Georgia from `pack/`, committed in the separate `regnology-ps-chatbots` repository (see below). A separate agent population from `pack/agent_profiles/` (see `pack/README.md § Two agent surfaces`). **Not** a DRG input. | ❌ not here | N/A (lives in `regnology-ps-chatbots`) |
| `work/` | Orchestration workspace and agent learnings | ❌ gitignored | ❌ |

### Decision rule for new files

1. **Is it a doctrine artefact that should ship to engagement repos?** → `pack/`
2. **Is it configuration that drives the management dashboard or org enrichment?** → `config/`
3. **Is it documentation for humans?** → `docs/`
4. **Is it a build tool, exporter, validator, or dashboard app?** → `tools/`
5. **Is it a mission spec, plan, or work package?** → `kitty-specs/`
6. **Is it transient agent workspace / learning data?** → `work/` (gitignored)
7. **Is it a generated Gemini Enterprise chatbot artefact?** → Not part of this
   repository; Gemini Bot Georgia generates it from `pack/` into the separate
   `regnology-ps-chatbots` repository's `gemini-agents/` tree (committed there, never
   hand-edited)

> `docs/` is **documentation only**. YAML configuration files do not belong
> there. Any YAML that configures the management dashboard or enrichment layer
> belongs in `config/`.

---

## `pack/` — Shippable doctrine artefacts

Distributed to engagement repos via `spec-kitty doctrine fetch --pack regnology-default`.
All files here must be valid spec-kitty artefact schemas.

```
pack/
  directives/              # *.directive.yaml   — non-negotiable org constraints
  tactics/                 # *.tactic.yaml       — procedural execution guides
  styleguides/             # *.styleguide.yaml   — communication and format standards
  toolguides/              # *.toolguide.yaml    — tool and platform best practices
  paradigms/               # *.paradigm.yaml     — foundational mental models
  procedures/              # *.procedure.yaml    — step-by-step process definitions
  agent_profiles/          # *.agent.yaml        — deployable agent configurations
  mission_step_contracts/  # *.step-contract.yaml — mission phase I/O contracts
  templates/               # Output scaffolds (CI, branding, docs, diagrams, etc.)
    architecture/
    audience/
    branding/
    ci/
    coordination/
    diagramming/
    documentation/
    documents/
    lexical/
    license/
    presentations/
    project/
    security/
    tickets/
  tools/
    fallback/              # Structured reference data shipped with the pack
      agentic_model_leaderboard.yaml
  glossary/                # Domain glossaries (~430 terms across 8 domains)
    README.md
    agent-framework/
    architecture-ddd/
    development-practices/
    doctrine-governance/
    documentation/
    orchestration/
    specification/
    tooling/
  drg/
    fragment.yaml          # Additive DRG graph extensions
  org-charter.yaml         # Interview pre-fills and required directives
  README.md
```

---

## `config/` — Dashboard and organisational management configuration

Non-shippable YAML files that configure or enrich the Doctrine Organisational
Management Dashboard at engagement level. These are committed to the repository
but **not** distributed via `spec-kitty doctrine fetch`.

```
config/
  domain-config.yaml       # Domain vocabulary (id, label, description, color)
  artifact-tags.yaml       # Artifact-to-domain tag mappings
  org-bindings.yaml        # RACI accountability bindings per domain (see below)
```

### `config/domain-config.yaml`

Defines the doctrine domain vocabulary used by the dashboard for categorisation.
Each entry has `id`, `label`, `description`, and `color`. Changes here must be
consistent with `config/artifact-tags.yaml` and `config/org-bindings.yaml`.

### `config/artifact-tags.yaml`

Maps individual artefact IDs to one or more domain IDs from `domain-config.yaml`.
Maintained by the pack curator. Used by the dashboard "By Domain" view.

### `config/org-bindings.yaml`

Organisational accountability bindings for each doctrine domain. Each binding
records the `domain_id`, `department`, `spoc` (person or mailing list), RACI
`accountability` role, and an `involvement` rationale. Many-to-many: multiple
bindings per domain and per department are permitted by design.

Managed through the **Organisational Bindings** page of the dashboard
(`/org-bindings`). SPOC values containing `@` are validated against
`@regnology.net`. Bindings whose `domain_id` no longer exists in
`domain-config.yaml` are flagged as orphaned.

---

## `docs/` — Documentation only

Human-readable documentation. **No configuration files.** No YAML that
configures runtime behaviour.

```
docs/
  OVERVIEW.md              # Programme overview for PS consultants and leads
  SURFACES.md              # This file — authoritative directory reference
  HOW_TO_USE.md            # Pack setup guide and team lead checklist
  AGENT_MIGRATION_GUIDANCE.md
  pack-migration-plan.md   # Batch tracker and artefact inventory
  usage.md
  decisions/               # Doctrine Decision Records (DDR-001 onwards)
  engineering_notes/       # Architecture notes and session debriefs
  maintenance/             # Maintenance runbooks
```

---

## `tools/` — Development utilities

Not imported by production code. Not distributed.

```
tools/
  surfaces/                # Shared source overlays copied into local generated harnesses
    cursor/
      hooks.json
      hooks/
        check-drg-fresh.sh
    claude/
      settings.json
  pack-dashboard/          # Doctrine Organisational Management Dashboard
    server/                # Express API server (TypeScript)
      src/
        models/            # Server-side data models
        services/          # CRUD and scanning services
        routes/            # Express route handlers
    src/                   # Angular frontend application
      app/
        components/        # Shared UI components
        layout/            # Shell layout (header, sidebar, footer)
        models/            # Client-side data models
        pages/             # Route-level page components
        services/          # Angular HTTP services
    dist/                  # Production build output (committed for local run)
```

The dashboard server reads `config/` via `getConfigRoot()` (overridable by
`CONFIG_ROOT` env var). It reads `docs/` — documentation only — via
`getDocsRoot()` (overridable by `DOCS_ROOT` env var).

### Local generated harness overlays

Generated `.cursor/` and `.claude/` directories are local output and remain
gitignored. The pack-backed governance source is `pack/`; repository-specific
shared harness canon that is not generated from pack artifacts lives in
`tools/surfaces/`.

After regenerating local IDE or agent surfaces from `pack/` with the tooling used
on your machine, overlay the tracked shared canon:

```bash
mkdir -p .cursor/hooks .claude
cp tools/surfaces/cursor/hooks.json .cursor/hooks.json
cp tools/surfaces/cursor/hooks/check-drg-fresh.sh .cursor/hooks/check-drg-fresh.sh
cp tools/surfaces/claude/settings.json .claude/settings.json
chmod +x .cursor/hooks/check-drg-fresh.sh
```

Do not commit regenerated `.cursor/` or `.claude/` output. If shared harness
behaviour changes, update `tools/surfaces/` and refresh local generated surfaces
from the pack plus these overlays.

---

## `kitty-specs/` — Mission artefacts

Spec-kitty mission directories. Each mission has a stable ULID slug.

```
kitty-specs/
  <mission-slug>/
    meta.json              # Mission identity and purpose
    spec.md                # Functional specification
    plan.md                # Implementation plan (after spec-kitty plan)
    tasks.md               # Work package manifest (after spec-kitty tasks)
    tasks/
      WP01-<title>.md      # Work package prompt files
    status.events.jsonl    # Canonical event log (machine-managed)
    status.json            # Materialized status view (machine-managed)
```

Active missions on `overhaul/migrate_to_kitty`:

| Slug | Purpose | Status |
|------|---------|--------|
| `pack-governance-dashboard-01KS2WM1` | Build the dashboard app | done |
| `pack-dashboard-domain-tags-builtin-01KS56B1` | Domain tags and builtin scanning | done |
| `organizational-bindings-01KSPTPR` | Org enrichment layer + config/ migration | in spec |

---

## `.kittify/` — Spec-kitty project runtime

Managed by spec-kitty. Most files are machine-generated. The charter and
glossaries are committed; runtime workspaces and caches are transient.

```
.kittify/
  config.yaml              # Project UUID, VCS type, agent list
  metadata.yaml            # Spec-kitty version, schema capabilities
  charter/                 # Project governance charter (committed)
    charter.md             # Human-readable charter document
    interview/
      answers.yaml         # Interview answers used to generate charter
    references.yaml        # Charter reference manifest
    synthesis-manifest.yaml
  glossaries/              # Project-local glossary terms
  missions/                # Mission ID index (machine-managed)
  runtime/                 # Lane and workspace state (machine-managed)
  memory/                  # Agent memory templates
  workspaces/              # Agent worktree state (machine-managed)
```

---

## Gemini Enterprise chatbot surface (`gemini-agents/` — separate repository)

`gemini-agents/` is **not a directory in `doctrine-ps`**. It is a distribution surface
holding Gemini Enterprise chat agents generated by **Gemini Bot Georgia**
(`pack/agent_profiles/gemini-bot-georgia.agent.yaml`) from this pack, committed in the
separate **`regnology-ps-chatbots`** repository. It is generated output — analogous to
`.cursor/` in that the authored source of truth is `pack/` — but it is committed in that
other repository (unlike the gitignored local IDE harnesses) because it is the shared
deployment artefact for the Gemini chatbot team.

```
regnology-ps-chatbots/gemini-agents/    # in the SEPARATE repository, not doctrine-ps
  README.md            # surface explanation and per-agent folder layout
  roster.yaml          # single source of truth for the chatbot team
  shared/
    glossary/            # shared Regnology terminology (optional context for any agent)
    branding/            # avatar generation reference assets
  <chatbot-slug>/      # one folder per agent (instructions.md, about.md, avatar.png,
                       #   knowledge/, set-up-guide.md, review-submission.md)
```

**Boundaries:**

- **Not a DRG input.** The DRG (`pack/drg/`) wires *productivity* doctrine artefacts and
  the `gemini-bot-georgia` **profile** only. The `regnology-ps-chatbots` `gemini-agents/`
  tree is Georgia's *output* in a different repository and must never appear as DRG nodes
  or `body_path` targets.
- **Separate population from `pack/agent_profiles/`.** Gemini chatbots and productivity
  agents must never be mixed — see `pack/README.md § Two agent surfaces`.
- **Never hand-edited by `doctrine-ps` contributors.** The authored source of truth is
  this pack (`pack/templates/gemini/*` and `pack/agent_profiles/gemini-bot-georgia.agent.yaml`
  for pack-backed agents, or the agent's own files in `regnology-ps-chatbots` for
  Gemini-only agents). Edit the source and re-run Georgia, then commit the regenerated
  output in `regnology-ps-chatbots`. See that repository's `gemini-agents/README.md`.

## `work/` — Gitignored agent workspace

Local-only. Not committed. Contains agent session logs, learning artefacts,
orchestration YAML tasks, and the `human-in-charge/` escalation queue.

```
work/                      # .gitignore — never committed
  human-in-charge/         # HiC escalation artefacts
  notes/                   # Ideation and research notes
  reports/                 # Session logs and prompt documentation
```
