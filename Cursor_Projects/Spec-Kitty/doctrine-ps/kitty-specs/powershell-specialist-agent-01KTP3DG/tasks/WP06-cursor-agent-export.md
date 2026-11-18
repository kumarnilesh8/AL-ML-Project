---
work_package_id: WP06
title: Cursor Agent Export
dependencies:
- WP03
requirement_refs:
- FR-011
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: 069acc014021c653c128f7615df09a84fdc3faac
created_at: '2026-06-09T12:23:54.649144+00:00'
subtasks:
- T026
- T027
- T028
agent: "cursor:composer-2.5-fast:curator-carla:implementer"
shell_pid: "37554"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: .cursor/agents/
execution_mode: code_change
owned_files:
- .cursor/agents/powershell-peter.md
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue.

---

## Objective

Create `.cursor/agents/powershell-peter.md` so Cursor can route PowerShell work to Peter
with an initialization declaration consistent with Directive 007 intent (FR-011).

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Depends on**: WP03 (profile content is source of truth)

**Implement command**: `spec-kitty agent action implement WP06 --agent <name>`

## Context

**Pattern files** (read at least two):

- `.cursor/agents/devops-danny.md`
- Any other `.cursor/agents/*.md` in this repo

**Source of truth**: `pack/agent_profiles/powershell-peter.agent.yaml` — export is a
routing shim, not a second profile.

**Note**: Some older exports reference `doctrine/agents/` paths; this repo uses
`pack/agent_profiles/` for YAML. Point to the pack path.

---

### Subtask T026 — Review export pattern

**Steps**:

1. List `.cursor/agents/*.md`
2. Note frontmatter shape:
   ```yaml
   ---
   name: devops-danny
   description: ...
   ---
   ```
3. Note Initialization section pattern and readiness announcement format.

**Validation**:
- [ ] You know the expected sections: Initialization, Primary Focus, Avoid, Reference

---

### Subtask T027 — Author powershell-peter.md

**File**: `.cursor/agents/powershell-peter.md`

**Template** (adapt from profile — do not copy entire YAML):

```markdown
---
name: powershell-peter
description: PowerShell 7+ module and script specialist for Regnology engagement repos.
---

# PowerShell Peter

You are PowerShell Peter. You author, refactor, and review PowerShell modules and
automation scripts using governed conventions, Pester tests, and script-level quality gates.

## Initialization

Read your full profile: `pack/agent_profiles/powershell-peter.agent.yaml`. Load required
directives and announce readiness:

```
✅ Regnology Agent "PowerShell Peter" initialized.
```

## Primary Focus

- PowerShell 7+ modules and scripts (`.psd1`, `.psm1`, `.ps1`)
- Pester tests and `build.ps1` task runners
- PSScriptAnalyzer and script-quality-gate before handoff
- Tactics: module-scaffold, pester-workflow, script-quality-gate

## Avoid

- Jenkinsfile, SonarQube, SBOM, and CI pipeline design → hand off to **DevOps Danny**
- Requirements specifications and BDD scenarios → **Analyst Annie**
- Application logic in Java, Python, or other non-PowerShell languages

## Reference

- Full profile: `pack/agent_profiles/powershell-peter.agent.yaml`
- Conventions: `pack/styleguides/powershell-conventions.styleguide.yaml`
- CLI shell syntax (spec-kitty): `.kittify/memory/templates/POWERSHELL_SYNTAX.md`
- Human primer: `docs/references/powershell-primer.md`
```

**Validation**:
- [ ] Frontmatter name matches `powershell-peter`
- [ ] Directive 007-style initialization block present
- [ ] Primary Focus and Avoid align with profile (FR-002, FR-003)

---

### Subtask T028 — Verify delegation and paths

**Steps**:

1. Diff export against profile specialization — no contradictions
2. Confirm all paths exist or will exist after sibling WPs merge
3. Keep file concise (<80 lines) — export is not the full profile

**Validation**:
- [ ] DevOps Danny delegation explicit
- [ ] Pack profile path correct
- [ ] FR-011 satisfied

---

## Definition of Done

- [ ] `.cursor/agents/powershell-peter.md` exists
- [ ] Initialization declaration present
- [ ] Consistent with WP03 profile
- [ ] No duplicate full profile content

## Reviewer Guidance

Open Cursor agent picker (if available) or verify frontmatter `name` matches profile-id.
Scenario 4: export Avoid section should mention Danny for Jenkins/Sonar.

**Implement command**: `spec-kitty agent action implement WP06 --agent <name>`

## Activity Log

- 2026-06-09T12:23:55Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=37554 – Assigned agent via action command
