---
work_package_id: WP01
title: PowerShell Conventions Styleguide
dependencies: []
requirement_refs:
- FR-004
- NFR-003
- NFR-004
- C-004
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: 968618756040ccbbbd401c1215c0191fa51d44ad
created_at: '2026-06-09T12:21:01.821514+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
agent: "cursor:composer-2.5-fast:reviewer-renata:reviewer"
shell_pid: "33458"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: pack/styleguides/
execution_mode: code_change
owned_files:
- pack/styleguides/powershell-conventions.styleguide.yaml
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue with this work package. You are authoring a
**governed pack artifact** — the enforceable contract for PowerShell Peter. Distill the
primer; do not paste it verbatim (C-004).

---

## Objective

Create `pack/styleguides/powershell-conventions.styleguide.yaml` — the schema-valid,
enforceable PowerShell coding and module conventions for engagement repos. This is
Track A in `plan.md` and the foundation for tactics (WP02), the agent profile (WP03),
and the companion reference (WP05).

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Execution workspace**: A worktree allocated per this WP's lane in `lanes.json` by
  `finalize-tasks`. Enter the workspace path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`.

## Context

**Templates to follow** (read both before writing):

- `pack/styleguides/java-conventions.styleguide.yaml`
- `pack/styleguides/python-conventions.styleguide.yaml`

**Distillation source** (human depth, not for pasting into YAML):

- `kitty-specs/powershell-specialist-agent-01KTP3DG/plan.md` — "Styleguide distillation" section
- `kitty-specs/powershell-specialist-agent-01KTP3DG/spec.md` — FR-004, C-001, C-004
- Mission `meta.json` `source_description` — PowerShell Primer by Stijn Dejongh (2025-11-13)

**Target runtime**: PowerShell 7+ (`pwsh`) by default; acknowledge Windows PowerShell 5.1
only where engagement charter requires legacy support.

---

### Subtask T001 — Review styleguide schema templates

**Purpose**: Confirm field names and structure before authoring.

**Steps**:

1. Read `pack/styleguides/java-conventions.styleguide.yaml` and note:
   - Top-level keys: `schema_version`, `id`, `title`, `scope`, `principles`, `patterns`
   - Optional: `anti_patterns`, `quality_test`
2. Read `pack/styleguides/python-conventions.styleguide.yaml` for the same structure.
3. Confirm `scope: code` is correct for language conventions (matches Java/Python).

**Validation**:
- [ ] You can list the required top-level keys from memory before writing

---

### Subtask T002 — Draft ≥8 distilled principles

**Purpose**: Encode pass/fail rules Peter and reviewers can apply without subjective judgement (NFR-003).

**Required principles** (minimum set from plan.md — you may add more, not fewer):

1. Target PowerShell 7+ (`pwsh`) by default
2. Verb-Noun cmdlet naming; `$camelCase` variables; `-PascalCase` parameters
3. Module layout: Public/Private split; module manifest (`.psd1`) required for reusable modules
4. Keep objects in the pipeline — no mid-pipeline formatting that breaks object flow
5. Pester Describe/It for tests; integrate via `build.ps1` Test task
6. PSScriptAnalyzer before handoff; `Set-StrictMode -Version Latest` on scripts
7. `#Requires -Version 7.0` on entry scripts
8. C-001 anti-patterns: no secrets in repo, no `Invoke-Expression` on untrusted input, declare gallery module dependencies in manifest or documented lock

**Steps**:

1. Create `pack/styleguides/powershell-conventions.styleguide.yaml` with:
   ```yaml
   schema_version: "1.0"
   id: powershell-conventions
   title: PowerShell conventions
   scope: code
   ```
2. Add each principle as a concise, testable string in `principles:`.
3. Keep principles **short** — one sentence each where possible.

**Files**: `pack/styleguides/powershell-conventions.styleguide.yaml`

**Validation**:
- [ ] At least 8 principles present
- [ ] Each principle is objectively checkable (naming, layout, tool invocation)

---

### Subtask T003 — Author ≥3 patterns with good/bad examples

**Purpose**: Provide concrete examples reviewers and Peter can cite.

**Required patterns** (from plan.md):

| Pattern | Topic |
|---------|-------|
| 1 | Mid-pipeline formatting — preserve objects, format at end |
| 2 | Pester Describe/It structure |
| 3 | try/catch with `-ErrorAction Stop` |

**Steps**:

1. For each pattern, add a `patterns:` entry with:
   - `name`
   - `description`
   - `bad_example` (multi-line string, realistic PowerShell)
   - `good_example` (multi-line string)
2. Use realistic cmdlet names (Verb-Noun) in examples.
3. Ensure bad examples demonstrate a **specific** violation, not generic bad code.

**Example structure** (adapt content):

```yaml
patterns:
  - name: Pipeline Object Preservation
    description: "Do not call Format-* or Out-* mid-pipeline when downstream cmdlets need objects."
    bad_example: |
      Get-Process | Format-Table | Select-Object Name
    good_example: |
      Get-Process | Select-Object Name, CPU | Format-Table
```

**Validation**:
- [ ] At least 3 patterns with both good and bad examples
- [ ] Examples use PS 7+ idioms

---

### Subtask T004 — Add anti_patterns, quality_test, and companion cross-ref

**Purpose**: Complete the styleguide contract and link to human-readable depth (Option B).

**Steps**:

1. Add `anti_patterns:` with at least 2 entries, e.g.:
   - `Invoke-Expression` on untrusted input (C-001)
   - Secrets or credentials in source files (C-001)
   - Mid-pipeline `Format-*` / `Out-*` (may overlap pattern 1 as anti_pattern)
2. Add optional `quality_test:` string describing how compliance is verified, e.g.:
   - PSScriptAnalyzer clean run
   - Pester tests pass
   - Module manifest present for modules
3. Add or extend a `description:` field (if schema allows at top level) referencing:
   - `docs/references/powershell-primer.md` for human-readable depth
   - Note: companion doc will be created in WP05; use the path even if file does not exist yet

**Validation**:
- [ ] anti_patterns present with good/bad examples
- [ ] quality_test describes verifiable checks
- [ ] Companion doc path referenced in description

---

### Subtask T005 — Validate styleguide schema

**Purpose**: Confirm pack schema acceptance before downstream WPs depend on this file.

**Steps**:

1. Run from repo root:
   ```bash
   spec-kitty doctrine pack validate pack/
   ```
2. Fix any errors related to `powershell-conventions.styleguide.yaml`.
3. Confirm no duplicate `id: powershell-conventions` exists elsewhere:
   ```bash
   rg "id: powershell-conventions" pack/
   ```

**Validation**:
- [ ] Pack validate reports 0 errors (styleguide-specific errors must be zero)
- [ ] File is valid YAML with consistent indentation (2 spaces)

---

## Definition of Done

- [ ] `pack/styleguides/powershell-conventions.styleguide.yaml` exists
- [ ] ≥8 principles, ≥3 patterns, ≥2 anti_patterns
- [ ] C-001 and PS 7+ defaults reflected in principles
- [ ] No verbatim paste of full PowerShell Primer (C-004)
- [ ] `spec-kitty doctrine pack validate pack/` passes for this artifact
- [ ] NFR-003: ≥80% of principles are pass/fail checkable

## Risks

| Risk | Mitigation |
|------|------------|
| Token bloat from long examples | Keep examples focused (~10–20 lines each) |
| Schema field mismatch | Mirror java-conventions exactly for unknown fields |
| Overlap with POWERSHELL_SYNTAX.md | That file covers spec-kitty CLI shell usage, not module authoring — do not duplicate |

## Reviewer Guidance

Verify principles are **distilled** (not primer prose), patterns are realistic PowerShell,
and the styleguide could be used by a reviewer without reading the companion doc.

**Implement command**: `spec-kitty agent action implement WP01 --agent <name>`

## Activity Log

- 2026-06-09T12:21:03Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=33024 – Assigned agent via action command
- 2026-06-09T12:21:35Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=33024 – Ready for review
- 2026-06-09T12:21:39Z – cursor:composer-2.5-fast:reviewer-renata:reviewer – shell_pid=33458 – Started review via action command
