# Project Instructions

## Purpose

This repository is the **Regnology PS org doctrine pack** for [spec-kitty](https://github.com/SDD-dev/spec-kitty).
The primary deliverable is `pack/` — a spec-kitty org doctrine pack containing typed YAML governance
artifacts (directives, tactics, agent profiles, toolguides, etc.) distributed to engagement repos
via `spec-kitty doctrine fetch`. Migration from Markdown originals is complete — all governance
artifacts now live in `pack/`.

## Repository Structure

- `pack/` — **Primary deliverable.** Spec-kitty org doctrine pack (YAML artifacts + DRG fragment)
- `docs/` — Engineering notes, architecture decisions, HOW_TO_USE guides
- `docs/decisions/` — Doctrine Decision Records (DDRs)
- `work/` — Orchestration workspace and learnings (gitignored, local only)
- `.claude/` — Claude Code agent definitions, skills, rules (gitignored, generated locally from
  `pack/` via `tools/surfaces/` — never committed; see `README.md` § "Local Agent And IDE
  Harnesses" for the accurate model)
- `.cursor/` — Cursor IDE agent and command configuration (gitignored, generated locally from
  `pack/` via `tools/surfaces/` — never committed; see `README.md` § "Local Agent And IDE
  Harnesses" for the accurate model)

## Common Commands

```bash
spec-kitty doctrine fetch --pack ps-agent-enabled-factory   # Install/update the pack
spec-kitty doctor doctrine                       # Verify pack is loaded correctly
spec-kitty doctrine pack validate pack/          # Validate pack schema before publishing
```

## Further Reference

- `pack/README.md` — Pack install instructions and layout
- `docs/installation/HOW_TO_SETUP.md` — **How to set up a developer machine from scratch** (directory layout, repo checkout, spec-kitty, regnology-mcp, credentials, `reg_agents` alias)
- `docs/installation/HOW_TO_USE.md` — **How to install and configure the pack in an engagement project** (team leads, per-developer setup, `.doctrine-config/` conventions)
- `docs/AGENT_MIGRATION_GUIDANCE.md` — Migration reference: rules for reading/writing pack artifacts, cross-reference updates, and engagement-repo conventions
- `docs/engineering_notes/` — Architecture notes
- `docs/decisions/` — Doctrine Decision Records (DDR-001 through DDR-020)
- `.claude/agents/` — Specialist agent definitions (generated locally; not committed — see above)
- `.claude/skills/` — On-demand skill prompts (generated locally; not committed — see above)
