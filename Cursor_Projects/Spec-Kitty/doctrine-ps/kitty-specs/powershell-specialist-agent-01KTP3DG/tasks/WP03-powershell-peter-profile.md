---
work_package_id: WP03
title: PowerShell Peter Agent Profile
dependencies:
- WP01
- WP02
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-012
- NFR-002
- NFR-004
- C-002
- C-003
- C-005
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: 7cfb99dd170eaad00425c029037fd349e3f2d556
created_at: '2026-06-09T12:23:03.060477+00:00'
subtasks:
- T011
- T012
- T013
- T014
- T015
- T016
agent: "cursor:composer-2.5-fast:curator-carla:implementer"
shell_pid: "35780"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: pack/agent_profiles/
execution_mode: code_change
owned_files:
- pack/agent_profiles/powershell-peter.agent.yaml
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue. You are creating a **pack-native** agent
profile — there is no spec-kitty built-in PowerShell profile to augment (D-1).

---

## Objective

Create `pack/agent_profiles/powershell-peter.agent.yaml` — PowerShell Peter, the Regnology
PowerShell language specialist implementer. The profile must make scope, delegation to
DevOps Danny, and required tactics readable in under 5 minutes (NFR-002).

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Depends on**: WP01 (styleguide), WP02 (tactics) — reference them in `context-sources`

**Implement command**: `spec-kitty agent action implement WP03 --agent <name>`

## Context

**Templates** (read both):

- `pack/agent_profiles/devops-danny.agent.yaml` — directive-references, specialization shape
- `pack/agent_profiles/analyst-annie.agent.yaml` — collaboration.handoff-to / works-with

**Constraints**:

- C-002: `profile-id: powershell-peter`, name `PowerShell Peter`
- C-003: No secrets or engagement-specific data in YAML
- C-005: No multi-step runbooks in `specialization.primary-focus` — summarize capabilities; tactics hold steps
- FR-003: Avoidance boundary must exclude Jenkins/Sonar/SBOM (DevOps Danny), requirements spec (Analyst Annie), non-PS app logic

**Directive codes** (use numeric codes in `directive-references`):

| Code | Name | Rationale |
|------|------|-----------|
| 007 | Agent Initialization | Standard init |
| 018 | (check pack for name) | Operational hygiene |
| 023 | Clarification Before Execution | Ambiguous tasks |
| 028 | Test First Bug Fixing | TEST_FIRST_BUG_FIXING |
| 038 | Ensure Conceptual Alignment | Terminology alignment |
| 043 | AppSec Compliance | Tiered C-001 script baseline |

Verify directive names against files in `pack/directives/` before committing.

---

### Subtask T011 — Scaffold identity fields

**File**: `pack/agent_profiles/powershell-peter.agent.yaml`

**Required top-level fields**:

```yaml
profile-id: powershell-peter
schema-version: "1.0"
name: PowerShell Peter
description: >
  PowerShell 7+ module and script specialist for Regnology engagement repos.
roles:
  - implementer
capabilities:
  - powershell-module-authoring
  - pester-testing
  - psscriptanalyzer-quality-gates
  - cross-platform-pwsh-automation
routing-priority: 55
purpose: >
  Author, refactor, and review PowerShell modules and automation scripts using
  governed conventions, Pester tests, and script-level AppSec baseline. Delegates
  CI/CD pipeline and Sonar/SBOM integration to DevOps Danny.
```

Adjust `routing-priority` to 55–60 (align with devops-danny at 60).

**Validation**:
- [ ] profile-id and name satisfy C-002
- [ ] schema-version "1.0"

---

### Subtask T012 — Write specialization block

**Purpose**: FR-002 primary/secondary focus; FR-003 avoidance boundary.

**Fields under `specialization:`**:

- **primary-focus** (summary only — no step lists):
  - PowerShell 7+ module/script authoring
  - Pester test design and execution
  - PSScriptAnalyzer-enforced quality
  - Apply tactics: module-scaffold, pester-workflow, script-quality-gate

- **secondary-awareness**:
  - Cross-platform `pwsh`, module manifests, `build.ps1` task runners
  - PSResourceGet / gallery dependencies
  - Distinction from spec-kitty CLI shell syntax (FR-012)

- **avoidance-boundary** (explicit):
  - Does NOT design Jenkinsfile, SonarQube gates, SBOM pipelines → **DevOps Danny**
  - Does NOT write requirements specs or BDD scenarios → **Analyst Annie**
  - Does NOT implement Java/Python/application business logic in other languages
  - Does NOT scaffold full repository doctrine → Bootstrap Bill

- **success-definition**:
  - Modules/scripts pass quality-gate tactic and conform to powershell-conventions
  - Tests runnable via build.ps1 and Invoke-Pester
  - Clear handoff notes when CI/AppSec pipeline work is needed

**Validation**:
- [ ] No numbered procedural steps in primary-focus (C-005)
- [ ] DevOps Danny named in avoidance-boundary

---

### Subtask T013 — Wire collaboration

**Purpose**: FR-008 collaboration edges documented in profile.

```yaml
collaboration:
  works-with:
    - devops-danny
    - analyst-annie
  handoff-to:
    - devops-danny
  output-artifacts:
    - "*.psd1"
    - "*.psm1"
    - "build.ps1"
    - "Tests/*.Tests.ps1"
```

Add brief rationale in comments only if your YAML linter allows — otherwise keep YAML clean.

**Validation**:
- [ ] works-with includes devops-danny and analyst-annie
- [ ] handoff-to includes devops-danny for CI/AppSec requests

---

### Subtask T014 — Directive references and mode defaults

**Add**:

```yaml
mode-defaults:
  - mode: analysis-mode
    description: Script and module diagnostics
    use-case: Lint failures, test gaps, module layout review

directive-references:
  - code: "007"
    name: Agent Initialization
    rationale: Standard agent bootstrap
  # ... add 018, 023, 028, 038, 043 with accurate names from pack/directives/
```

For 043 (AppSec), note **tiered** application per C-001 in rationale — script-level for Peter, full pipeline via Danny.

**Validation**:
- [ ] At least 6 directive references
- [ ] 028 maps to TEST_FIRST_BUG_FIXING (DRG edge in WP04)

---

### Subtask T015 — Configure context-sources

**Purpose**: FR-012 and plan.md context-sources guidance.

```yaml
context-sources:
  doctrine-layers:
    - styleguides
    - tactics
    - directives
  styleguides:
    - powershell-conventions
  tactics:
    - powershell-module-scaffold
    - powershell-pester-workflow
    - powershell-script-quality-gate
  additional:
    - .kittify/memory/templates/POWERSHELL_SYNTAX.md
  toolguides:
    - regnology-mcp
```

**FR-012**: POWERSHELL_SYNTAX.md is for **spec-kitty CLI** invocations in PowerShell shells — not module authoring conventions.

**Validation**:
- [ ] All three tactics listed
- [ ] powershell-conventions listed
- [ ] POWERSHELL_SYNTAX.md path present

---

### Subtask T016 — Validate and readability check

**Steps**:

1. `spec-kitty doctrine pack validate pack/`
2. **NFR-002 smoke test**: Read profile aloud or skim — confirm under 5 minutes you can answer:
   - What does Peter own?
   - When do I hand off to Danny?
   - Which tactics does Peter apply?

**Validation**:
- [ ] 0 pack validate errors
- [ ] NFR-002 satisfied
- [ ] NFR-004: field naming matches devops-danny / analyst-annie patterns

---

## Definition of Done

- [ ] `pack/agent_profiles/powershell-peter.agent.yaml` complete
- [ ] FR-001, FR-002, FR-003, FR-012 satisfied
- [ ] C-002, C-003, C-005 satisfied
- [ ] No secrets in file
- [ ] Pack validate passes

## Reviewer Guidance

Scenario 4 test: Ask "build a Jenkins pipeline with Sonar for this PowerShell repo" —
profile alone should make clear Peter declines primary ownership and hands off to Danny.

**Implement command**: `spec-kitty agent action implement WP03 --agent <name>`

## Activity Log

- 2026-06-09T12:23:04Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=35780 – Assigned agent via action command
