# Implementation Plan: PowerShell Specialist Agent (PowerShell Peter)

**Branch**: `beta` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)  
**Mission**: `powershell-specialist-agent-01KTP3DG` (`01KTP3DGA51P23R13715VG6T3Q`)

---

## Summary

Add **PowerShell Peter** — a pack-native language specialist — to the Regnology doctrine
pack alongside existing patterns for Java (`java-jenny` + `java-conventions`) and Python
(`python-pedro` + `python-conventions`). Unlike Java/Python, there is no spec-kitty
built-in PowerShell profile; this mission delivers a full agent profile, a distilled
styleguide, three tactics (Option B v1), a companion human reference doc, DRG wiring,
domain tags, and Cursor export.

Validation gate: `spec-kitty doctrine pack validate pack/` → 0 errors; DRG compiled via
`python3 tools/compile-drg.py`.

---

## Technical Context

**Language/Version**: YAML schema v1.0 (pack artifacts); Markdown (companion doc + Cursor export); PowerShell 7+ as the **target runtime** Peter authors for  
**Primary Dependencies**: spec-kitty CLI 3.2.0rc37 (`doctrine pack validate`); `tools/compile-drg.py` (DRG compilation); reference patterns from `java-conventions.styleguide.yaml`, `devops-danny.agent.yaml`, `maven-project-compliance-setup.tactic.yaml`  
**Storage**: File-based — `pack/agent_profiles/`, `pack/styleguides/`, `pack/tactics/`, `pack/drg/fragment.yaml`, `config/artifact-tags.yaml`, `docs/references/powershell-primer.md`, `.cursor/agents/powershell-peter.md`  
**Testing**: `spec-kitty doctrine pack validate pack/` (mandatory, 0 errors); manual DRG neighbourhood check in pack dashboard (optional); acceptance mapped to spec FR/NFR rows  
**Target Platform**: Doctrine pack consumed by spec-kitty on engagement repos (Linux/macOS/Windows dev machines); Peter targets cross-platform `pwsh` 7+  
**Project Type**: Doctrine pack extension — no application runtime code  
**Performance Goals**: Pack validate completes in under 30 seconds on developer machine (NFR implicit); styleguide readable in under 5 minutes (NFR-002)  
**Constraints**: C-001 tiered AppSec baseline; C-002 alliteration (`powershell-peter`); C-004 distill primer (no verbatim paste into styleguide); C-005 workflows in tactics not profile; curator review for DRG consistency  
**Scale/Scope**: 1 agent profile, 1 styleguide, 3 tactics, ~15 DRG node/edge additions, 1 companion doc, 1 Cursor export, 5 artifact-tag entries

---

## Charter Check

Charter policies applied:

| Policy | Application |
|--------|-------------|
| Pack artifacts → `pack/` | All YAML deliverables under `pack/` per DIR-001 |
| Human docs → `docs/` | Companion primer at `docs/references/powershell-primer.md` per DIR-003 |
| YAML validation gate | Every commit touching pack/ must pass validate (Quality Gates) |
| Curator review | DRG + schema consistency before merge (Review Policy) |
| No secrets in pack | C-003; no credentials or engagement-specific data |

**Gates**: No violations. No new npm/pip dependencies. No dashboard code changes in scope.

**Re-check post-design**: Design artifacts (data-model, contracts) align with charter directory rules and validation gate.

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | **Pack-native profile** (not SK built-in augmentation) | No `powershell-*` built-in exists; java-jenny/python-pedro pattern does not apply for profile creation — only for DRG `applies` edges to styleguides |
| D-2 | **Primer Usage Option B** | Styleguide = enforceable contract; `docs/references/powershell-primer.md` = human depth with author attribution |
| D-3 | **Domain tags: `tooling` + `engineering`** (primary: `engineering`) | Mirrors `python-conventions` / language-specialist pattern; Peter is an implementer for automation code |
| D-4 | **C-001 tiered AppSec** | Peter enforces script-level baseline (PSScriptAnalyzer, secrets, no IEX on untrusted input); DevOps Danny owns Sonar/SBOM CI when charter requires |
| D-5 | **Three tactics in v1** | `powershell-module-scaffold`, `powershell-pester-workflow`, `powershell-script-quality-gate` — defer InvokeBuild/psake and DSC tactics |
| D-6 | **DRG relations** | Peter `applies` styleguide + tactics; Peter `requires` TEST_FIRST_BUG_FIXING, ENSURE_CONCEPTUAL_ALIGNMENT, TRACEABLE_DECISIONS; optional `applies` regnology-main-context paradigm (consistent with devops-danny) |

---

## Project Structure

### Documentation (this mission)

```
kitty-specs/powershell-specialist-agent-01KTP3DG/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pack-artifacts-acceptance.yaml
└── tasks.md              ← /spec-kitty.tasks (not created here)
```

### Deliverables (repository root)

```
pack/
├── agent_profiles/
│   └── powershell-peter.agent.yaml          ← FR-001..003
├── styleguides/
│   └── powershell-conventions.styleguide.yaml ← FR-004
├── tactics/
│   ├── powershell-module-scaffold.tactic.yaml       ← FR-005
│   ├── powershell-pester-workflow.tactic.yaml       ← FR-006
│   └── powershell-script-quality-gate.tactic.yaml   ← FR-007
└── drg/
    ├── fragment.yaml                          ← FR-008 (nodes + edges)
    └── regnology-default.graph.yaml           ← recompiled

config/
└── artifact-tags.yaml                         ← FR-009

docs/references/
└── powershell-primer.md                       ← FR-010

.cursor/agents/
└── powershell-peter.md                        ← FR-011
```

**Structure Decision**: Single-track pack authoring mission. No `tools/pack-dashboard` or `src/` changes. Implementation follows dependency order: styleguide → tactics → profile → DRG/tags → companion doc → Cursor export → validate.

---

## Phase 0: Research

See [research.md](research.md). All clarifications resolved from spec and codebase inspection — no external research agents required.

Key findings:

- `java-conventions` / `python-conventions` styleguide schema is the template for PowerShell conventions
- `devops-danny` and `analyst-annie` agent profiles define collaboration and directive-reference patterns
- DRG edge patterns for implementers documented in `fragment.yaml` lines 1591–1616 (python-pedro, java-jenny)
- `tools/compile-drg.py` must run after `fragment.yaml` edits
- `.kittify/memory/templates/POWERSHELL_SYNTAX.md` covers spec-kitty CLI shell usage — Peter references, does not duplicate (FR-012)

---

## Phase 1: Design

See [data-model.md](data-model.md) for entity definitions and [contracts/pack-artifacts-acceptance.yaml](contracts/pack-artifacts-acceptance.yaml) for acceptance checks.

### Implementation tracks (suggested WP order for `/spec-kitty.tasks`)

| Track | Deliverable | Depends on | Spec FRs |
|-------|-------------|------------|----------|
| **A** | `powershell-conventions.styleguide.yaml` | — | FR-004 |
| **B** | Three tactics (scaffold, pester, quality-gate) | A (references conventions) | FR-005..007 |
| **C** | `powershell-peter.agent.yaml` | A, B (context-sources) | FR-001..003 |
| **D** | DRG nodes/edges + `artifact-tags.yaml` | C | FR-008, FR-009 |
| **E** | `docs/references/powershell-primer.md` | A (cross-ref) | FR-010 |
| **F** | `.cursor/agents/powershell-peter.md` | C | FR-011 |
| **G** | Validate + compile DRG | D | NFR-001 |

### DRG wiring checklist (FR-008)

**Nodes to add** in `fragment.yaml`:

- `powershell-peter` (agent_profiles)
- `powershell-conventions` (styleguides) — if not already present as node
- Three tactic nodes

**Edges to add**:

```
powershell-peter → powershell-conventions          applies
powershell-peter → powershell-module-scaffold      applies
powershell-peter → powershell-pester-workflow      applies
powershell-peter → powershell-script-quality-gate  applies
powershell-peter → TEST_FIRST_BUG_FIXING           requires
powershell-peter → ENSURE_CONCEPTUAL_ALIGNMENT     requires
powershell-peter → TRACEABLE_DECISIONS             requires
powershell-peter → regnology-main-context          applies  (optional, D-6)
```

### Styleguide distillation (FR-004, C-004)

Minimum principles (from primer → YAML):

1. Target PowerShell 7+ (`pwsh`) by default
2. Verb-Noun cmdlet naming; `$camelCase` variables; `-PascalCase` parameters
3. Module layout: Public/Private split; manifest required
4. Keep objects in pipeline — no mid-pipeline formatting
5. Pester Describe/It for tests; integrate via build.ps1 Test task
6. PSScriptAnalyzer before handoff; `Set-StrictMode -Version Latest` on scripts
7. `#Requires -Version 7.0` on entry scripts
8. C-001 anti-patterns: no secrets in repo, no `Invoke-Expression` on untrusted input

Minimum patterns (good/bad examples):

- Mid-pipeline formatting (from primer §6)
- Pester Describe/It structure (from primer §5)
- try/catch with `-ErrorAction Stop` (from primer §6.3)

### Agent profile shape (FR-001..003)

Mirror `devops-danny.agent.yaml` + `analyst-annie.agent.yaml`:

- `collaboration.works-with`: `devops-danny`, `analyst-annie`
- `collaboration.handoff-to`: `devops-danny` (CI/AppSec pipeline requests)
- `avoidance-boundary`: explicit Jenkins/Sonar/non-PS scope
- `directive-references`: 007, 018, 023, 028 (TEST_FIRST), 038, 043 (APPSEC at tiered level)
- `context-sources`: powershell-conventions styleguide; three tactics; regnology-mcp toolguide (optional)

---

## Complexity Tracking

No charter violations requiring justification.

---

## Verification (post-implement)

1. `spec-kitty doctrine pack validate pack/` → 0 errors  
2. `python3 tools/compile-drg.py` → graph updated  
3. Dashboard DRG tab shows `powershell-peter` neighbourhood (manual smoke)  
4. Profile readable in under 5 minutes; boundaries vs Danny unambiguous (NFR-002, NFR-003)  
5. Companion doc has branding header + Stijn Dejongh attribution (FR-010)

**Next command**: `/spec-kitty.tasks` on mission `powershell-specialist-agent-01KTP3DG`
