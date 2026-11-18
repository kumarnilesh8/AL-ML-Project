# ps-agent-enabled-factory — Professional Services Departmental Agent Doctrine pack

This directory is a [spec-kitty](https://github.com/Priivacy-ai/spec-kitty) org doctrine pack
(canonical slug `ps-agent-enabled-factory`). It is the primary deliverable of this repository.

This is the **Professional Services departmental layer**: it `extends` the Regnology
**All-Company** pack `regnology-all-company` (upstream:
[`RFG/skills`](https://bitbucket.regnology.net/projects/RFG/repos/skills/browse)), adding
PS-specific directives and defaults on top of the all-company baseline without relaxing,
weakening, or bypassing it. The additive layering is declared via the `extends:` key in
[`org-charter.yaml`](org-charter.yaml).

## Install

### Bootstrap installer (recommended)

```bash
# Set your Artefactory API token first
export REGNOLOGY_ARTEFACTORY_TOKEN='<your-api-key>'

# Unix / macOS
curl -sL https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.sh | sh

# Windows (PowerShell 5.1+)
$env:REGNOLOGY_ARTEFACTORY_TOKEN = '<your-api-key>'
irm https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.ps1 | iex
```

**Pack location**: `https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/`

### Manual / offline install

Download the archive and extract with `--strip-components=1` to remove the `pack/` wrapper:

```bash
curl -sL -H "X-JFrog-Art-Api: $TOKEN" \
  https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/ps-agent-enabled-factory-latest.tar.gz \
  | tar -xz --strip-components=1 -C /path/to/install/
```

Then wire the installed path into `.kittify/config.yaml`:

```yaml
doctrine:
  org:
    packs:
      - name: ps-agent-enabled-factory
        local_path: /path/to/install
        source_type: local
```

```bash
spec-kitty doctor doctrine
```

## Two agent surfaces — hard split

This repository contains **two completely separate agent populations** that must never be mixed:

| Surface | Location | What they are | Who uses them |
|---|---|---|---|
| **Productivity agents** | `pack/agent_profiles/` | IDE / CLI agents wired into the Spec Kitty doctrine runtime and Cursor. They execute missions, review code, write specs, compile DRGs. | Developers and PS team leads inside their IDE |
| **Gemini chatbots** | `gemini-agents/` in the separate **`regnology-ps-chatbots`** repository — not a directory in `doctrine-ps` | Gemini Enterprise workspace chat agents. Simple back-and-forth conversations for all Regnology employees. No filesystem, no tool calls, no doctrine runtime. | All Regnology employees via the Gemini chat UI |

**Consequences of the split:**

- A Gemini chatbot profile (`gemini-agents/<slug>/` in `regnology-ps-chatbots`) **must never appear** in `pack/agent_profiles/`.
- A productivity agent (`.agent.yaml` in `pack/agent_profiles/`) **must never appear** in `regnology-ps-chatbots`'s `gemini-agents/roster.yaml`.
- Gemini Bot Georgia (`gemini-bot-georgia.agent.yaml`) is the one bridge: she is a
  **productivity agent** whose job is to *generate* the `regnology-ps-chatbots`
  repository's `gemini-agents/` distribution surface. She is not herself a chatbot.
- `regnology-ps-chatbots`'s `gemini-agents/roster.yaml` is the single source of truth
  for the chatbot team. `pack/agent_profiles/` is the single source of truth for the
  productivity agent team. There is no overlap.

If you are unsure which surface a new agent belongs to, ask: _"Does this agent run inside a developer's IDE executing doctrine missions, or does it answer employee questions in a Gemini chat window?"_ The answer determines the surface.

## Layout

```
pack/
  directives/            # *.directive.yaml
  tactics/               # *.tactic.yaml
  styleguides/           # *.styleguide.yaml
  toolguides/            # *.toolguide.yaml
  paradigms/             # *.paradigm.yaml
  procedures/            # *.procedure.yaml
  agent_profiles/        # *.agent.yaml — PRODUCTIVITY AGENTS ONLY (see split above)
  mission_step_contracts/
  glossary/              # Domain glossaries (8 domains, ~430 terms)
    README.md            # Domain index and navigation
    agent-framework/
    architecture-ddd/
    development-practices/
    doctrine-governance/
    documentation/
    orchestration/
    specification/
    tooling/
  templates/             # Reusable output scaffolds (CI, branding, docs, etc.)
  tools/
    fallback/            # Structured reference data shipped with the pack
      agentic_model_leaderboard.yaml
                         # Parseable LLM leaderboard data (arenas, tiers,
                         # high_roi_by_task_type). Used by tactic
                         # model-discipline-selection and directive MODEL_DISCIPLINE.
                         # Refresh quarterly from arena.ai/leaderboard.
  drg/
    fragment.yaml        # Additive DRG graph extensions
  org-charter.yaml       # Interview pre-fills and required directives
```

## Version Bumping

The pack version lives in `pack/.pack-version` as a plain-text semver string
(e.g., `1.0.0`). Before merging any pack content change to `main`, bump this
file according to semver:

- **MAJOR** — incompatible change to a directive, tactic, or paradigm that
  consumers must adopt
- **MINOR** — backward-compatible addition (new artifact, new field with
  default)
- **PATCH** — backward-compatible fix (typo, clarification, metadata)

The CI `Validate` stage in `Jenkinsfile` rejects merges where the version
already exists in Artefactory (HTTP HEAD against the versioned archive URL
returns 200) unless the build is run with `FORCE_PUBLISH=true`. So forgetting
to bump fails the build immediately on `main`.

Pre-release suffixes are permitted: `1.2.0-rc1`, `2.0.0-beta3`, etc.

## Validating this overlay pack

This is an **overlay** pack that `extends: regnology-all-company`. Validating
`pack/` on its own is **not** the authoritative check.

| Check | Expected result | Notes |
| --- | --- | --- |
| `spec-kitty doctrine pack validate pack/` | 144 dangling-edge errors | **Normal.** Cross-layer references to artefacts promoted to the parent layer. Not a failure. |
| `make validate-layered` | 0 errors, 0 advisories, 0 conflicts | **Authoritative.** Assembles parent + overlay, then validates the merged tree. |

Run the layered check with the parent pack available:

```bash
# Obtain the parent pack once
git clone ssh://git@bitbucket.regnology.net:7999/rfg/skills.git
# Point the make target at its pack root, then validate
BASE_PACK_DIR=/path/to/skills/pack make validate-layered
```

Notes for maintainers:

- The parent version is pinned in `config/release-map.yaml` (`base_pack_version`,
  currently `1.0.0`); `make validate-layered` obtains the parent via `BASE_PACK_DIR`.
- CI enforces the layered gate as a Jenkins stage, so a clean local
  `make validate-layered` is the merge-readiness signal — not standalone validation.
- `tools/triage-drg-dangles.py` distinguishes acceptable cross-layer dangles from
  genuine defects when investigating standalone errors.

## Setup guide

See `docs/installation/HOW_TO_USE.md` for the full setup guide covering local config,
team lead checklist, project-specific `.doctrine-config/` conventions, and troubleshooting.

## Status

Migration complete. All source artifacts are in `pack/`.
See `docs/pack-migration-plan.md` for the batch tracker and artifact inventory.
