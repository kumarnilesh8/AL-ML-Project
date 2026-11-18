---
name: regnology-setup
description: >-
  Walk through setting up a developer's Regnology PS machine environment from scratch,
  or diagnose and repair an incomplete setup. Use when a developer is new to the project,
  when spec-kitty or regnology-mcp commands fail, when asked to "set up" or "configure"
  the Regnology agent stack, or when onboarding a new team member.
disable-model-invocation: true
---

# Regnology PS Machine Setup

Guides a developer (or executes on their behalf) through the one-time machine setup for
Regnology PS engagement work.

## Reference

Full walkthrough: `docs/installation/HOW_TO_SETUP.md`
Per-engagement charter setup: `docs/installation/HOW_TO_USE.md`

## Expected layout

```
~/code/
├── _config/
│   ├── packs/
│   │   ├── regnology-all-company/
│   │   └── ps-agent-enabled-factory/
│   ├── .regnology.env          ← PAT credentials (never committed)
│   ├── AGENTS.md               ← shared governance (from team lead)
│   ├── AGENT_ENHANCED_DEVELOPMENT.md
│   ├── communication-profile.md
│   └── venv/                   ← optional
├── regnology-agent-doctrine/   ← on beta branch
├── skills/                     ← rfg/skills (all-company doctrine)
├── spec-kitty/
├── regnology-docgen/
└── <engagement-repos>/
```

## Setup checklist

Probe each item. Skip steps that are already complete; execute missing ones.

- [ ] `~/code/_config/` directory exists
- [ ] Required repos cloned: `regnology-agent-doctrine` (beta), `skills`, `spec-kitty`, `regnology-docgen`
- [ ] `spec-kitty --version` succeeds
- [ ] `REGNOLOGY_ARTEFACTORY_TOKEN` set in shell environment
- [ ] Both packs present: `spec-kitty doctor doctrine` shows `regnology-all-company` + `ps-agent-enabled-factory`
- [ ] `regnology-mcp` cloned and built (`dist/index.js` exists)
- [ ] `~/code/_config/.regnology.env` present with PATs filled in
- [ ] `~/.cursor/mcp.json` present with correct paths; MCP server green in Cursor
- [ ] `AGENTS.md` present in `_config/`
- [ ] `AGENT_ENHANCED_DEVELOPMENT.md` present in `_config/`
- [ ] `communication-profile.md` present in `_config/`
- [ ] `reg_agents` alias defined in shell profile
- [ ] Each engagement repo's `.kittify/config.yaml` points to `~/code/_config/packs`

## How to run this skill

1. Read `docs/installation/HOW_TO_SETUP.md` for the authoritative step-by-step
2. Run the checklist above against the user's filesystem
3. For each missing item, execute or guide through the relevant step
4. Report final checklist status when done

## Key diagnostic commands

```bash
spec-kitty --version
spec-kitty doctor doctrine
printenv REGNOLOGY_ARTEFACTORY_TOKEN | head -c 4 ; echo "..."
ls ~/code/_config/
ls ~/code/_config/packs/
ls ~/code/regnology-mcp/dist/index.js 2>/dev/null || echo "not built"
type reg_agents
```
