---
work_package_id: WP04
title: DRG Wiring and Domain Tags
dependencies:
- WP03
requirement_refs:
- FR-008
- FR-009
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: d21d361c7ee55a4a110c0d8733801832b46067d7
created_at: '2026-06-09T12:23:50.375792+00:00'
subtasks:
- T017
- T018
- T019
- T020
- T021
agent: "cursor:composer-2.5-fast:curator-carla:implementer"
shell_pid: "37554"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: pack/drg/
execution_mode: code_change
owned_files:
- pack/drg/fragment.yaml
- pack/drg/regnology-default.graph.yaml
- config/artifact-tags.yaml
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue. DRG edits require curator discipline —
every profile reference must have a matching node and edge.

---

## Objective

Wire PowerShell Peter and related artifacts into the Doctrine Relationship Graph and
register domain tags. After this WP, the dashboard DRG tab can show Peter's neighbourhood:
profile → styleguide → tactics → required directives (FR-008, FR-009).

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Depends on**: WP03 (profile file must exist with final id `powershell-peter`)

**Implement command**: `spec-kitty agent action implement WP04 --agent <name>`

## Context

**Reference patterns** in `pack/drg/fragment.yaml`:

- `devops-danny` node (~line 359) and its edges (~619+)
- `python-pedro` → `python-conventions` applies (~1591)
- `python-pedro` → `TEST_FIRST_BUG_FIXING` requires (~1610)

**Directive target ids** (verify exact ids in fragment.yaml nodes section):

- `TEST_FIRST_BUG_FIXING`
- `ENSURE_CONCEPTUAL_ALIGNMENT`
- `TRACEABLE_DECISIONS`
- `regnology-main-context` (optional applies, D-6)

**Domain tags pattern** (`config/artifact-tags.yaml`):

```yaml
python-conventions:
  domains:
    - engineering
    - quality
  primary_domain: engineering
```

Use `tooling` + `engineering` with `primary_domain: engineering` per research.md R-6.

---

### Subtask T017 — Add DRG nodes

**File**: `pack/drg/fragment.yaml` — `nodes:` section

Add nodes (if not already present):

```yaml
  - id: powershell-peter
    kind: agent_profiles
    title: PowerShell Peter
    body_path: agent_profiles/powershell-peter.agent.yaml

  - id: powershell-conventions
    kind: styleguides
    title: PowerShell conventions
    body_path: styleguides/powershell-conventions.styleguide.yaml

  - id: powershell-module-scaffold
    kind: tactics
    title: PowerShell Module Scaffold
    body_path: tactics/powershell-module-scaffold.tactic.yaml

  - id: powershell-pester-workflow
    kind: tactics
    title: PowerShell Pester Workflow
    body_path: tactics/powershell-pester-workflow.tactic.yaml

  - id: powershell-script-quality-gate
    kind: tactics
    title: PowerShell Script Quality Gate
    body_path: tactics/powershell-script-quality-gate.tactic.yaml
```

Place nodes near other agent_profiles / styleguides / tactics for maintainability.

**Validation**:
- [ ] Five nodes added with correct `kind` and `body_path`
- [ ] No duplicate ids

---

### Subtask T018 — Add DRG edges

**File**: `pack/drg/fragment.yaml` — `edges:` section

**Required edges** (FR-008):

```yaml
  - source: powershell-peter
    target: powershell-conventions
    relation: applies

  - source: powershell-peter
    target: powershell-module-scaffold
    relation: applies

  - source: powershell-peter
    target: powershell-pester-workflow
    relation: applies

  - source: powershell-peter
    target: powershell-script-quality-gate
    relation: applies

  - source: powershell-peter
    target: TEST_FIRST_BUG_FIXING
    relation: requires

  - source: powershell-peter
    target: ENSURE_CONCEPTUAL_ALIGNMENT
    relation: requires

  - source: powershell-peter
    target: TRACEABLE_DECISIONS
    relation: requires
```

**Optional** (D-6, consistent with devops-danny):

```yaml
  - source: powershell-peter
    target: regnology-main-context
    relation: applies
```

**Note**: Collaboration to devops-danny is documented in the **profile YAML**, not necessarily as a DRG edge unless the pack pattern adds `delegates_to` — check devops-danny/python-pedro patterns; do not invent edges not supported by existing conventions.

**Validation**:
- [ ] All acceptance contract edges present
- [ ] Source/target ids match nodes section

---

### Subtask T019 — Add artifact-tags entries

**File**: `config/artifact-tags.yaml`

Add entries for:

- `powershell-peter`
- `powershell-conventions`
- `powershell-module-scaffold`
- `powershell-pester-workflow`
- `powershell-script-quality-gate`

Each with:

```yaml
  powershell-peter:
    domains:
      - tooling
      - engineering
    primary_domain: engineering
```

Follow alphabetical or existing grouping order in the file.

**Validation**:
- [ ] Five entries added
- [ ] primary_domain is engineering

---

### Subtask T020 — Compile DRG

**Steps**:

```bash
python3 tools/compile-drg.py
git diff --stat pack/drg/
```

Commit both `fragment.yaml` and updated `regnology-default.graph.yaml` (or whichever compiled output the tool produces).

**Validation**:
- [ ] compile-drg.py exit code 0
- [ ] Compiled graph includes powershell-peter references

---

### Subtask T021 — Smoke-check neighbourhood

```bash
rg "powershell-peter" pack/drg/fragment.yaml
rg "powershell-" config/artifact-tags.yaml
```

Manually trace: peter → conventions → tactics → TEST_FIRST.

**Validation**:
- [ ] All five artifact ids appear in fragment.yaml
- [ ] No orphan nodes (every new node has at least one edge)

---

## Definition of Done

- [ ] FR-008 and FR-009 complete
- [ ] DRG compiled successfully
- [ ] artifact-tags.yaml updated
- [ ] quickstart.md step 3 commands would pass

## Risks

| Risk | Mitigation |
|------|------------|
| Wrong directive node id | Grep fragment.yaml for TEST_FIRST before adding edges |
| Merge conflict in large fragment.yaml | Add nodes/edges in logical sections; minimal diff |

## Reviewer Guidance

Compare edge set to `contracts/pack-artifacts-acceptance.yaml` required_edges list —
must match exactly on relation types.

**Implement command**: `spec-kitty agent action implement WP04 --agent <name>`

## Activity Log

- 2026-06-09T12:23:51Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=37554 – Assigned agent via action command
