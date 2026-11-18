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

# Professional Services Departmental Agent Doctrine

_Pack: `ps-agent-enabled-factory` — Last updated: 2026-06-18_

The **Professional Services Departmental Agent Doctrine** pack for
[spec-kitty](https://github.com/Priivacy-ai/spec-kitty) (canonical pack slug
`ps-agent-enabled-factory`).
The primary deliverable of this repository is `pack/` — a versioned, machine-readable
governance pack that engagement projects consume via the bootstrap installer or
`spec-kitty doctrine fetch`.

## Layering: a departmental layer on the All-Company baseline

This pack is the **Professional Services departmental layer** of the federated doctrine and
charter stack. It **extends** the Regnology **All-Company** doctrine and charter pack
(`regnology-all-company`): it adds PS-specific directives and defaults on top of the
all-company baseline and cannot relax what the upstream enforces.

- **Upstream (All-Company layer):** [`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills/browse)
- **This layer extends:** `regnology-all-company` (declared via `extends:` in
  [`pack/org-charter.yaml`](pack/org-charter.yaml))

Doctrine extends from broad to specific; the enforced charter is cumulative (this layer inherits
the all-company charter and may only add to it, never weaken or bypass it).

New to the environment? Start here: **[docs/installation/HOW_TO_SETUP.md](docs/installation/HOW_TO_SETUP.md)**
_(companion Cursor skill: `tools/surfaces/cursor/skills/regnology-setup/`)_

For team leads setting up a new engagement project: **[docs/installation/HOW_TO_USE.md](docs/installation/HOW_TO_USE.md)**

For an introduction to the framework and the full agent catalogue, read: **[docs/OVERVIEW.md](docs/OVERVIEW.md)**

---

## The Doctrine Stack

Five layers with clear precedence govern agent behaviour across every engagement:

```
Guidelines  (values, preferences)         ← highest precedence
    │
Approaches  (mental models, frameworks)
    │
Directives  (non-negotiable constraints)  ← select tactics
    │
Tactics     (step-by-step execution)      ← execute work
    │
Templates   (output structure contracts)  ← lowest precedence
```

The pack ships these as typed YAML artifacts. The Doctrine Relationship Graph (DRG)
in `pack/drg/fragment.yaml` makes all relationships machine-readable — which agents
depend on which directives, which tactics implement which styleguides, and which
toolguides are required by the charter.

---

## Pack Contents

Pack version `1.0.0` ships the following artifact counts:

| Kind | Count | Path |
|---|---|---|
| Agent profiles | 13 | `pack/agent_profiles/` |
| Directives | 12 | `pack/directives/` |
| Tactics | 20 | `pack/tactics/` |
| Paradigms | 13 | `pack/paradigms/` |
| Procedures | 9 | `pack/procedures/` |
| Toolguides | 22 | `pack/toolguides/` |
| Styleguides | 14 | `pack/styleguides/` |
| Glossary domains | 8 (~430 terms) | `pack/glossary/` |

The `org-charter.yaml` pre-fills charter interviews with required directives and
Regnology branding defaults so new projects start correctly without manual answers.

The 8 required directives activated for every engagement are:
`REGNOLOGY_BRANDING`, `MODEL_DISCIPLINE`, `APPSEC_COMPLIANCE`, `CORPORATE_TOOLING`,
`TRACEABLE_DECISIONS`, `AUDIENCE_ORIENTED_WRITING`, `VERSION_GOVERNANCE`, `FRAMEWORK_GUARDIAN`

---

## Installing the Pack

### Bootstrap installer (recommended)

```bash
export REGNOLOGY_ARTEFACTORY_TOKEN='<your-api-key>'

# Unix / macOS
curl -sL https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.sh | sh

# Windows (PowerShell 5.1+)
$env:REGNOLOGY_ARTEFACTORY_TOKEN = '<your-api-key>'
irm https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.ps1 | iex
```

Creates `~/regnology-agent-stack/` with a Python venv, the `spec-kitty` CLI, and the
`ps-agent-enabled-factory` pack. Re-run with `--pack-version latest` to upgrade.

### Manual / offline install

```bash
spec-kitty doctrine fetch --pack ps-agent-enabled-factory
spec-kitty doctor doctrine
```

See [docs/installation/HOW_TO_USE.md](docs/installation/HOW_TO_USE.md) for the full setup guide, team lead
checklist, `.doctrine-config/` conventions, and troubleshooting.

---

## Repository Structure

```
doctrine-ps/
│
├── pack/                        # Primary deliverable — org doctrine pack
│   ├── org-charter.yaml         # Required directives and interview pre-fills
│   ├── agent_profiles/          # *.agent.yaml  (13 profiles)
│   ├── directives/              # *.directive.yaml  (12 directives)
│   ├── tactics/                 # *.tactic.yaml  (20 tactics)
│   ├── paradigms/               # *.paradigm.yaml  (13 paradigms)
│   ├── procedures/              # *.procedure.yaml  (9 procedures)
│   ├── toolguides/              # *.toolguide.yaml  (22 toolguides)
│   ├── styleguides/             # *.styleguide.yaml  (14 styleguides)
│   ├── glossary/                # 8-domain terminology pack (~430 terms)
│   ├── templates/               # Reusable output scaffolds
│   ├── tools/fallback/          # NOT local — inherited from regnology-all-company via
│   │                            #   extends: in pack/org-charter.yaml (see AGENTS.md §3)
│   ├── drg/fragment.yaml        # Doctrine Relationship Graph edges
│   └── .pack-version            # Semver string — bump before every merge to main
│
├── docs/
│   ├── installation/
│   │   └── HOW_TO_USE.md        # Install, configure, and use the pack
│   ├── OVERVIEW.md              # Framework introduction and agent catalogue
│   ├── ONBOARDING.md            # Quick onboarding for new contributors
│   ├── SURFACES.md              # Integration surfaces (Cursor, Claude, CLI)
│   ├── decisions/               # Doctrine Decision Records (DDR-001 — DDR-020)
│   ├── engineering_notes/       # Session notes, integration analyses
│   ├── maintenance/             # Upstream alignment checklists
│   └── procedures/              # Contributor procedures
│
├── kitty-specs/                 # Completed spec-kitty missions (7, 42/42 WPs)
│
├── tools/
│   └── surfaces/                # Shared source overlays for local agent/IDE harnesses
│
├── tests/
│   └── test_pack_schema_validation.py
│
├── work/                        # Local orchestration workspace (gitignored)
│
├── AGENTS.md                    # Agent initialization and governance protocol
├── CLAUDE.md                    # Project instructions for Claude Code
└── CHANGELOG.md                 # Pack change history
```

> `doctrine/` was the Markdown source directory during the migration window. Migration
> is complete — all artifacts now live in `pack/`. See [docs/AGENT_MIGRATION_GUIDANCE.md](docs/AGENT_MIGRATION_GUIDANCE.md).

---

## Local Agent And IDE Harnesses

Generated `.cursor/` and `.claude/` directories are local harness output and are
not versioned in this repository. The source of truth remains `pack/`; shared
repository-specific harness overlays that are not generated from pack artifacts
are preserved under `tools/surfaces/`.

| Source | Purpose |
|---|---|
| `pack/` | Doctrine artifacts used to regenerate agent and IDE governance surfaces |
| `tools/surfaces/cursor/hooks.json` | Shared Cursor hook wiring to copy into a local `.cursor/` harness |
| `tools/surfaces/cursor/hooks/check-drg-fresh.sh` | Preserved DRG freshness advisory hook script |
| `tools/surfaces/claude/settings.json` | Shared Claude settings baseline |

To recreate the local shared harness overlays after cloning or cleaning the
repository, regenerate the pack-backed surfaces with the local spec-kitty/Cursor
or Claude tooling you use, then overlay the preserved repository-specific files:

```bash
mkdir -p .cursor/hooks .claude
cp tools/surfaces/cursor/hooks.json .cursor/hooks.json
cp tools/surfaces/cursor/hooks/check-drg-fresh.sh .cursor/hooks/check-drg-fresh.sh
cp tools/surfaces/claude/settings.json .claude/settings.json
chmod +x .cursor/hooks/check-drg-fresh.sh
```

Keep generated `.cursor/` and `.claude/` output uncommitted. When shared harness
canon changes, update `tools/surfaces/` and regenerate local harnesses from the
pack plus those overlays.

### Setting up a consuming repo

After installing the pack, run the charter interview in your engagement repo:

```bash
spec-kitty charter interview
spec-kitty doctor doctrine   # verify pack is loaded
```

Add `.doctrine-config/` overrides for engagement-specific extensions:
- `specific_guidelines.md` — local conventions
- Additional directives, tactics, or agent profiles

Local overrides extend behaviour. They cannot override the general or operational
guidelines that the pack ships as the foundation layer.

---

## Development

### Validating the pack

```bash
spec-kitty doctrine pack validate pack/
spec-kitty doctor doctrine
```

### Versioning

The pack version lives in `pack/.pack-version` as a plain-text semver string.
Bump before every merge to `main`:

- **MAJOR** — incompatible change to an existing directive, tactic, or paradigm
- **MINOR** — backward-compatible addition (new artifact, new field with default)
- **PATCH** — backward-compatible fix (typo, clarification, metadata)

The CI `Validate` stage in `Jenkinsfile` rejects merges where the version already
exists in Artefactory.

### Doctrine Decision Records

Architecture and governance decisions for the pack are recorded in `docs/decisions/`
as Doctrine Decision Records (DDR-001 through DDR-020). Follow the DDR process for
any pack-level decision: what changed, why, and what alternatives were considered.

---

## Key Documentation

| Document | Purpose |
|---|---|
| [docs/installation/HOW_TO_USE.md](docs/installation/HOW_TO_USE.md) | Install and configure the pack; team lead checklist |
| [docs/OVERVIEW.md](docs/OVERVIEW.md) | Framework introduction, agent catalogue, MCP setup |
| [docs/ONBOARDING.md](docs/ONBOARDING.md) | Quick-start for new contributors |
| [docs/SURFACES.md](docs/SURFACES.md) | Cursor, Claude, CLI integration surfaces |
| [pack/README.md](pack/README.md) | Pack layout, install commands, version policy |
| [AGENTS.md](AGENTS.md) | Agent initialization protocol (AGENTS.md spec) |
| [CLAUDE.md](CLAUDE.md) | Project instructions for Claude Code |
| [CHANGELOG.md](CHANGELOG.md) | Pack change history |
| [docs/decisions/](docs/decisions/) | DDR-001 through DDR-020 |

---

## Acknowledgements

- **[spec-kitty](https://github.com/Priivacy-ai/spec-kitty)** (MIT) — specification-driven development toolkit; the distribution and runtime layer this pack is built for
- **[SDD Agent-Augmented Development](https://sddevelopment-be.github.io/quickstart_agent-augmented-development/)** — foundational patterns that informed the doctrine stack design
- **[Agents.md Specification](https://agents.md/)** — community-driven spec for AI agent behaviour

---

**Maintained by:** Regnology Professional Services  
**Pack version:** 1.0.0 — distributed via Regnology Artefactory  
**Artefactory path:** `ps-tooling-generic-local/doctrine-pack/`
