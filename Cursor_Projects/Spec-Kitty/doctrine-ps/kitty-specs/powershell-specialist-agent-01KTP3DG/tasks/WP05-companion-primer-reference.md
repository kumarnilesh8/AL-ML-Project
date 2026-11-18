---
work_package_id: WP05
title: Companion Primer Reference
dependencies:
- WP01
requirement_refs:
- FR-010
- C-004
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: f95a096da3bba6cf374cc418d2788e092af4cfe7
created_at: '2026-06-09T12:21:55.845885+00:00'
subtasks:
- T022
- T023
- T024
- T025
agent: "cursor:composer-2.5-fast:curator-carla:implementer"
shell_pid: "33705"
history:
- date: '2026-06-09'
  event: created
agent_profile: curator-carla
authoritative_surface: docs/references/
execution_mode: code_change
owned_files:
- docs/references/powershell-primer.md
role: curator
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue. This is **Option B** human reference material —
the styleguide remains the enforceable contract (C-004).

---

## Objective

Create `docs/references/powershell-primer.md` — adapted from the PowerShell Primer source
(Stijn Dejongh, 2025-11-13) with Regnology branding and clear attribution. The styleguide
answers "does this conform?"; this doc answers "why and how do I learn this?" (FR-010).

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Depends on**: WP01 (principles defined; cross-link from styleguide)

**Can run in parallel with WP02/WP03** once WP01 is merged.

**Implement command**: `spec-kitty agent action implement WP05 --agent <name>`

## Context

**Source material**: PowerShell Primer provided during mission discovery (see mission
`meta.json` `source_description`). Content covers: language philosophy, cmdlets,
pipelines, modules, Pester, error handling, strict mode, cross-platform pwsh.

**If full primer text is not in-repo**: Expand from:

1. `kitty-specs/powershell-specialist-agent-01KTP3DG/plan.md` — Styleguide distillation section
2. `pack/styleguides/powershell-conventions.styleguide.yaml` — principles and patterns from WP01
3. Public PowerShell 7 documentation for any gaps (cite Microsoft docs where appropriate)

**Branding header**: Copy the HTML comment block from `kitty-specs/powershell-specialist-agent-01KTP3DG/spec.md` lines 1–11 (Regnology ASCII art + FOR INTERNAL USE ONLY).

**Charter**: Human docs live under `docs/` per DIR-003 — not in `pack/`.

---

### Subtask T022 — Create file with branding header

**File**: `docs/references/powershell-primer.md`

**Steps**:

1. Create `docs/references/` if missing.
2. Add Regnology branding HTML comment block (verbatim from spec.md).
3. Add markdown title: `# PowerShell Primer (Reference)`
4. Add metadata block:

```markdown
| Field | Value |
|-------|-------|
| Source author | Stijn Dejongh |
| Source date | 2025-11-13 |
| Status | Derived from draft primer — **styleguide is authoritative for enforcement** |
| Related | `pack/styleguides/powershell-conventions.styleguide.yaml` |
```

**Validation**:
- [ ] REGNOLOGY branding present (acceptance contract)
- [ ] Stijn Dejongh named

---

### Subtask T023 — Adapt primer content

**Purpose**: Human-readable depth without duplicating the entire styleguide YAML.

**Suggested sections** (adapt from source primer):

1. **Language Philosophy** — objects in pipeline vs text streams; why PowerShell for automation
2. **Cmdlets and Verb-Noun** — approved verbs, naming examples
3. **Pipeline Patterns** — object preservation; when to use Format-* at the end
4. **Module Structure** — Public/Private, manifest, versioning
5. **Testing with Pester** — Describe/It, running tests locally
6. **Quality and Safety** — PSScriptAnalyzer, StrictMode, C-001 tiered AppSec overview
7. **Cross-Platform pwsh** — PS 7+ default; 5.1 caveats
8. **Related Resources** — link to POWERSHELL_SYNTAX.md for spec-kitty CLI usage

**Rules**:

- Write in clear prose — this is educational, not schema-valid YAML
- Include code examples where they aid learning (may overlap styleguide patterns — that's OK here)
- Do NOT paste engagement-specific or customer data (C-003)
- Preserve attribution to Stijn Dejongh in an **Attribution** section at the end

**Validation**:
- [ ] Substantively longer than styleguide (distill check C-004)
- [ ] Covers topics from plan.md distillation list

---

### Subtask T024 — Status note and enforcement disclaimer

Add prominent callout near the top (after metadata):

```markdown
> **Enforcement note:** Pack validation and agent routing use
> `powershell-conventions.styleguide.yaml` as the contract. This reference document
> provides depth and learning context only.
```

Note draft status of source primer if still accurate.

**Validation**:
- [ ] Enforcement disclaimer present
- [ ] Draft/source status documented

---

### Subtask T025 — Verify bidirectional cross-links

**Purpose**: Confirm Option B linking without editing WP01-owned styleguide in this lane.

**Steps**:

1. Verify your companion doc metadata (T022) links to
   `pack/styleguides/powershell-conventions.styleguide.yaml`.
2. Verify the styleguide (from WP01) includes a `description` referencing
   `docs/references/powershell-primer.md`.
3. If the styleguide cross-ref is **missing**, stop and record a blocker for WP07
   integration — do **not** edit `pack/styleguides/` in this WP (owned by WP01).

**Validation**:
- [ ] Companion doc links to styleguide
- [ ] Styleguide → companion cross-ref verified or blocker documented for WP07

---

## Definition of Done

- [ ] `docs/references/powershell-primer.md` exists with branding + attribution
- [ ] FR-010 satisfied
- [ ] C-004: styleguide remains lean; companion provides depth
- [ ] No secrets or customer data

## Risks

| Risk | Mitigation |
|------|------------|
| Full primer unavailable in repo | Synthesize from plan + styleguide + public PS docs |
| Styleguide cross-ref conflict with WP01 | Edit styleguide in same branch after WP01 merge |

## Reviewer Guidance

Confirm author attribution and that the doc would help a new engineer learn PowerShell
idioms without replacing the styleguide for compliance checks.

**Implement command**: `spec-kitty agent action implement WP05 --agent <name>`

## Activity Log

- 2026-06-09T12:21:57Z – cursor:composer-2.5-fast:curator-carla:implementer – shell_pid=33705 – Assigned agent via action command
