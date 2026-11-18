---
work_package_id: WP02
title: PowerShell Tactics
dependencies:
- WP01
requirement_refs:
- FR-005
- FR-006
- FR-007
- C-001
- C-005
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: 6e3dc2bccdd04568031bbeb759dbceb6cd84077d
created_at: '2026-06-09T12:21:51.997747+00:00'
subtasks:
- T006
- T007
- T008
- T009
- T010
agent: "cursor:composer-2.5-fast:curator-carla:implementer"
shell_pid: "33705"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: pack/tactics/
execution_mode: code_change
owned_files:
- pack/tactics/powershell-module-scaffold.tactic.yaml
- pack/tactics/powershell-pester-workflow.tactic.yaml
- pack/tactics/powershell-script-quality-gate.tactic.yaml
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue. Workflows live in **tactics**, not in the
agent profile specialization block (C-005).

---

## Objective

Create three pack tactics that map to spec user scenarios 1–3:

1. `powershell-module-scaffold` — bootstrap Regnology-standard module layout
2. `powershell-pester-workflow` — author and run Pester tests
3. `powershell-script-quality-gate` — PSScriptAnalyzer + C-001 script-level AppSec baseline

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Execution workspace**: worktree from `spec-kitty agent action implement WP02 --agent <name>`

**Depends on WP01**: Tactics may reference `powershell-conventions` by id in prose;
styleguide must exist before this WP merges.

## Context

**Template**: `pack/tactics/maven-project-compliance-setup.tactic.yaml`

**Acceptance keywords** (from `contracts/pack-artifacts-acceptance.yaml`):

| Tactic | Required step keywords |
|--------|------------------------|
| module-scaffold | psd1, psm1, build.ps1 |
| pester-workflow | Pester, Invoke-Pester, Describe |
| script-quality-gate | PSScriptAnalyzer, StrictMode |

**C-001 tiered AppSec**: Quality gate covers script-level baseline only. Sonar/SBOM CI
integration is DevOps Danny's domain — mention in quality-gate notes, do not implement Jenkins steps.

---

### Subtask T006 — Create powershell-module-scaffold.tactic.yaml

**Purpose**: Scenario 1 — scaffold a reusable PowerShell module.

**File**: `pack/tactics/powershell-module-scaffold.tactic.yaml`

**Required steps** (each with `title` and multi-line `description`):

1. **Create module manifest** — `.psd1` with `RootModule`, `ModuleVersion`, `FunctionsToExport`, `RequiredModules` placeholder
2. **Create root module** — `.psm1` that dot-sources `Public/` and `Private/` scripts
3. **Create Public/ and Private/ folders** — exported functions in Public; helpers in Private
4. **Create Tests/ folder** — placeholder for Pester tests (`.Tests.ps1` naming)
5. **Create build.ps1** — param block with `[ValidateSet('Lint','Test','Build','Clean')]$Task`; stub tasks for each

**Schema skeleton**:

```yaml
schema_version: "1.0"
id: powershell-module-scaffold
name: PowerShell Module Scaffold
purpose: >
  Bootstrap a Regnology-standard PowerShell module layout with manifest, Public/Private
  split, test folder, and build.ps1 task runner. Apply when creating a new reusable
  module for deployment or administration automation.
steps:
  - title: ...
    description: >
      ...
failure_modes:
  - "Module manifest missing FunctionsToExport — add explicit export list or use Export-ModuleMember in psm1."
applies_to_languages:
  - powershell
notes: >
  Does not configure Jenkins or Sonar — hand off to DevOps Danny for CI integration.
```

**Validation**:
- [ ] Step descriptions mention psd1, psm1, build.ps1
- [ ] Public/Private layout documented
- [ ] ValidateSet tasks Lint, Test, Build, Clean in build.ps1 step

---

### Subtask T007 — Create powershell-pester-workflow.tactic.yaml

**Purpose**: Scenario 2 — add and run Pester tests.

**File**: `pack/tactics/powershell-pester-workflow.tactic.yaml`

**Required steps**:

1. **Verify/install Pester** — `Install-Module Pester -Scope CurrentUser -Force` or document PSResourceGet equivalent; confirm Pester 5.x
2. **Structure Describe/It blocks** — one Describe per function/file; It blocks for happy path and edge cases
3. **Run Invoke-Pester** — `-Output Detailed` or `CI` for local vs pipeline; exit non-zero on failure
4. **Integrate Test task in build.ps1** — Test task invokes Pester against `Tests/` folder

**Validation**:
- [ ] Steps mention Pester, Invoke-Pester, Describe
- [ ] Aligns with `powershell-conventions` Pester pattern

---

### Subtask T008 — Create powershell-script-quality-gate.tactic.yaml

**Purpose**: Scenario 3 — lint and security baseline before handoff.

**File**: `pack/tactics/powershell-script-quality-gate.tactic.yaml`

**Required steps**:

1. **Run PSScriptAnalyzer** — against module root or specified paths; document default ruleset or Regnology agreed ruleset path if known
2. **Enable Set-StrictMode** — `-Version Latest` at script/module entry; document placement
3. **Verify #Requires -Version 7.0** — on entry scripts and module scripts where applicable
4. **C-001 secret/credential checklist** — scan for hardcoded secrets, `ConvertTo-SecureString` with plaintext, credentials in repo; no `Invoke-Expression` on untrusted input
5. **Declare module dependencies** — manifest `RequiredModules` or documented lock file

**Validation**:
- [ ] Steps mention PSScriptAnalyzer and StrictMode
- [ ] C-001 anti-patterns covered in checklist step
- [ ] Explicit note: full Sonar/SBOM → DevOps Danny when charter requires

---

### Subtask T009 — Cross-references and metadata

**Purpose**: Wire tactics to conventions and improve operability.

**Steps**:

1. In each tactic's `purpose` or `notes`, reference `powershell-conventions` styleguide by id.
2. Ensure all three have:
   - `applies_to_languages: [powershell]`
   - `failure_modes:` with at least 2 entries each
3. Keep step descriptions **actionable** — an agent should execute verbatim on an engagement repo.

**Validation**:
- [ ] All three tactics reference conventions
- [ ] failure_modes present on each

---

### Subtask T010 — Validate tactics schema

**Steps**:

```bash
spec-kitty doctrine pack validate pack/
rg "^id: powershell-" pack/tactics/
```

Fix any schema errors. Confirm no duplicate tactic ids.

**Validation**:
- [ ] 0 pack validate errors for tactic files
- [ ] Three distinct tactic files exist

---

## Definition of Done

- [ ] Three tactic YAML files under `pack/tactics/`
- [ ] Acceptance contract keywords satisfied
- [ ] C-001 script-level baseline in quality-gate tactic
- [ ] No Jenkins/Sonar procedural steps (delegation to DevOps Danny documented)
- [ ] Pack validate passes

## Risks

| Risk | Mitigation |
|------|------------|
| Steps too vague | Each step should name files, cmdlets, and expected outcomes |
| Duplicating styleguide rules | Tactics = **how to run**; styleguide = **what conforms** |

## Reviewer Guidance

Pick one tactic and mentally execute it against an empty folder — every step should be
unambiguous. Confirm quality-gate does not claim Sonar ownership.

**Implement command**: `spec-kitty agent action implement WP02 --agent <name>`

## Activity Log

- 2026-06-09T12:21:53Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=33705 – Assigned agent via action command
