# Tasks: PowerShell Specialist Agent (PowerShell Peter)

**Mission**: `powershell-specialist-agent-01KTP3DG`  
**Branch**: `feature/powershell-specialist-agent-01KTP3DG` → merges into `beta`  
**Plan**: `kitty-specs/powershell-specialist-agent-01KTP3DG/plan.md`

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|-----|----------|
| T001 | Review `java-conventions` and `python-conventions` styleguide schema as templates | WP01 | — |
| T002 | Draft ≥8 distilled principles for `powershell-conventions` (PS 7+, naming, layout, pipeline, tests, lint, C-001) | WP01 | — |
| T003 | Author ≥3 patterns with good/bad examples (pipeline formatting, Pester Describe/It, try/catch + `-ErrorAction Stop`) | WP01 | [P] |
| T004 | Add `anti_patterns`, optional `quality_test`, and styleguide description cross-ref to companion doc | WP01 | — |
| T005 | Run `spec-kitty doctrine pack validate pack/` on styleguide; fix schema errors | WP01 | — |
| T006 | Create `powershell-module-scaffold.tactic.yaml` (psd1, psm1, Public/Private, Tests/, build.ps1 tasks) | WP02 | — |
| T007 | Create `powershell-pester-workflow.tactic.yaml` (Pester install, Describe/It, Invoke-Pester, build.ps1 Test) | WP02 | [P] |
| T008 | Create `powershell-script-quality-gate.tactic.yaml` (PSScriptAnalyzer, StrictMode, #Requires, C-001 checklist) | WP02 | [P] |
| T009 | Add `failure_modes`, `applies_to_languages: [powershell]`, and styleguide cross-refs to all three tactics | WP02 | — |
| T010 | Validate all three tactics pass pack schema | WP02 | — |
| T011 | Scaffold `powershell-peter.agent.yaml` with schema-valid identity fields (profile-id, name, roles, capabilities) | WP03 | — |
| T012 | Write `specialization` block (primary-focus, secondary-awareness, avoidance-boundary, success-definition) per FR-002/FR-003 | WP03 | — |
| T013 | Wire `collaboration` (works-with devops-danny, analyst-annie; handoff-to devops-danny) and output-artifacts | WP03 | [P] |
| T014 | Add `directive-references` (007, 018, 023, 028, 038, 043) and `mode-defaults` | WP03 | — |
| T015 | Configure `context-sources` (styleguide, three tactics, POWERSHELL_SYNTAX.md, optional regnology-mcp) | WP03 | — |
| T016 | Validate agent profile schema; confirm NFR-002 readability (5-minute scope test) | WP03 | — |
| T017 | Add DRG nodes for `powershell-peter`, `powershell-conventions`, and three tactics in `fragment.yaml` | WP04 | — |
| T018 | Add DRG edges: Peter `applies` styleguide + tactics; Peter `requires` TEST_FIRST, ENSURE_CONCEPTUAL_ALIGNMENT, TRACEABLE_DECISIONS; optional `regnology-main-context` | WP04 | — |
| T019 | Add domain tag entries in `config/artifact-tags.yaml` (tooling + engineering, primary engineering) | WP04 | [P] |
| T020 | Run `python3 tools/compile-drg.py` and verify compiled graph updates | WP04 | — |
| T021 | Smoke-check DRG neighbourhood with `rg "powershell-peter" pack/drg/` | WP04 | — |
| T022 | Create `docs/references/powershell-primer.md` with Regnology branding header and Stijn Dejongh attribution | WP05 | — |
| T023 | Adapt primer content from mission source material (human-readable depth; styleguide remains authoritative) | WP05 | — |
| T024 | Add status note: draft primer reference; enforcement via styleguide | WP05 | [P] |
| T025 | Cross-link companion doc from styleguide `description` field | WP05 | — |
| T026 | Review existing `.cursor/agents/*.md` export pattern | WP06 | — |
| T027 | Author `.cursor/agents/powershell-peter.md` with Directive 007 initialization declaration | WP06 | — |
| T028 | Reference pack profile path and primary focus / delegation boundaries in Cursor export | WP06 | — |
| T029 | Run full `spec-kitty doctrine pack validate pack/` — must report 0 errors (NFR-001) | WP07 | — |
| T030 | Execute acceptance contract checks from `contracts/pack-artifacts-acceptance.yaml` | WP07 | — |
| T031 | Fix any validation or acceptance failures across pack artifacts | WP07 | — |
| T032 | Document residual advisories (if any) and NFR-002/NFR-003 smoke results in mission work log | WP07 | — |

---

## WP01 — PowerShell Conventions Styleguide

**Priority**: Critical (blocks WP02, WP03, WP05)  
**Goal**: Create `pack/styleguides/powershell-conventions.styleguide.yaml` — the enforceable contract distilled from the PowerShell Primer (Option B).  
**Independent test**: Styleguide exists with ≥8 principles and ≥3 patterns; `spec-kitty doctrine pack validate pack/` reports 0 errors for this file.  
**Estimated prompt size**: ~380 lines

- [x] T001 Review java-conventions and python-conventions styleguide schema as templates (WP01)
- [x] T002 Draft ≥8 distilled principles for powershell-conventions (WP01)
- [x] T003 Author ≥3 patterns with good/bad examples (WP01)
- [x] T004 Add anti_patterns, quality_test, and companion doc cross-ref (WP01)
- [x] T005 Run pack validate on styleguide; fix schema errors (WP01)

**Prompt file**: `tasks/WP01-powershell-conventions-styleguide.md`  
**Dependencies**: none

---

## WP02 — PowerShell Tactics (Scaffold, Pester, Quality Gate)

**Priority**: High (blocks WP03)  
**Goal**: Create three pack tactics that implement user scenarios 1–3 and C-001 script-level AppSec baseline.  
**Independent test**: All three tactic files exist; each contains required step keywords per acceptance contract; pack validate passes.  
**Estimated prompt size**: ~420 lines

- [x] T006 Create powershell-module-scaffold.tactic.yaml (WP02)
- [x] T007 Create powershell-pester-workflow.tactic.yaml (WP02)
- [x] T008 Create powershell-script-quality-gate.tactic.yaml (WP02)
- [x] T009 Add failure_modes, applies_to_languages, and styleguide cross-refs (WP02)
- [x] T010 Validate all three tactics pass pack schema (WP02)

**Prompt file**: `tasks/WP02-powershell-tactics.md`  
**Dependencies**: WP01

---

## WP03 — PowerShell Peter Agent Profile

**Priority**: High (blocks WP04, WP06)  
**Goal**: Create `pack/agent_profiles/powershell-peter.agent.yaml` — pack-native language specialist with clear DevOps Danny delegation boundaries.  
**Independent test**: Profile readable in under 5 minutes; avoidance-boundary mentions Jenkins/Sonar handoff; pack validate passes.  
**Estimated prompt size**: ~400 lines

- [x] T011 Scaffold powershell-peter.agent.yaml identity fields (WP03)
- [x] T012 Write specialization block per FR-002/FR-003 (WP03)
- [x] T013 Wire collaboration and output-artifacts (WP03)
- [x] T014 Add directive-references and mode-defaults (WP03)
- [x] T015 Configure context-sources including POWERSHELL_SYNTAX.md (WP03)
- [x] T016 Validate profile schema and NFR-002 readability (WP03)

**Prompt file**: `tasks/WP03-powershell-peter-profile.md`  
**Dependencies**: WP01, WP02

---

## WP04 — DRG Wiring and Domain Tags

**Priority**: High (blocks WP07)  
**Goal**: Register Peter and related artifacts in the DRG fragment, compile graph, and tag domains in `config/artifact-tags.yaml`.  
**Independent test**: Required edges present in `fragment.yaml`; `compile-drg.py` succeeds; artifact-tags entries exist for all five artifact ids.  
**Estimated prompt size**: ~350 lines

- [x] T017 Add DRG nodes in fragment.yaml (WP04)
- [x] T018 Add DRG edges per FR-008 (WP04)
- [x] T019 Add domain tag entries in artifact-tags.yaml (WP04)
- [x] T020 Run compile-drg.py and verify graph update (WP04)
- [x] T021 Smoke-check DRG neighbourhood (WP04)

**Prompt file**: `tasks/WP04-drg-and-domain-tags.md`  
**Dependencies**: WP03

---

## WP05 — Companion Primer Reference

**Priority**: Medium (parallel with WP02/WP03 after WP01)  
**Goal**: Create `docs/references/powershell-primer.md` — human-readable depth with author attribution (Option B).  
**Independent test**: File exists with Regnology header, "Stijn Dejongh" attribution, and cross-link from styleguide description.  
**Estimated prompt size**: ~320 lines

- [x] T022 Create docs/references/powershell-primer.md with branding header (WP05)
- [x] T023 Adapt primer content from mission source material (WP05)
- [x] T024 Add draft/status note and enforcement disclaimer (WP05)
- [x] T025 Cross-link from styleguide description field (WP05)

**Prompt file**: `tasks/WP05-companion-primer-reference.md`  
**Dependencies**: WP01

---

## WP06 — Cursor Agent Export

**Priority**: Should (blocks WP07 acceptance for FR-011)  
**Goal**: Add `.cursor/agents/powershell-peter.md` so Cursor can route to Peter with initialization declaration.  
**Independent test**: Export file exists; references pack profile; includes Directive 007-style readiness announcement.  
**Estimated prompt size**: ~250 lines

- [x] T026 Review existing .cursor/agents export pattern (WP06)
- [x] T027 Author .cursor/agents/powershell-peter.md (WP06)
- [x] T028 Reference pack profile path and delegation boundaries (WP06)

**Prompt file**: `tasks/WP06-cursor-agent-export.md`  
**Dependencies**: WP03

---

## WP07 — Pack Validation and Acceptance

**Priority**: Critical (final gate)  
**Goal**: Run full pack validation and acceptance contract; fix residual issues; document sign-off evidence.  
**Independent test**: `spec-kitty doctrine pack validate pack/` → 0 errors; acceptance contract artifacts verified.  
**Estimated prompt size**: ~300 lines

- [x] T029 Run full pack validate — 0 errors required (WP07)
- [x] T030 Execute acceptance contract checks (WP07)
- [x] T031 Fix any validation or acceptance failures (WP07)
- [x] T032 Document advisories and NFR smoke results (WP07)

**Prompt file**: `tasks/WP07-pack-validation-acceptance.md`  
**Dependencies**: WP04, WP05, WP06

---

## Parallelization Summary

```
WP01 (styleguide)
 ├── WP02 (tactics) ──► WP03 (profile) ──► WP04 (DRG) ──┐
 ├── WP05 (companion) ───────────────────────────────────┤
 └── WP03 ──► WP06 (cursor export) ──────────────────────┤
                                                          ▼
                                                    WP07 (validate)
```

**MVP scope**: WP01 alone delivers the enforceable conventions contract. Minimum shippable increment for routing: WP01 → WP02 → WP03 → WP04 → WP07.

---

## Requirement Coverage Map

| Requirement | Work Package |
|-------------|--------------|
| FR-001 – FR-003, FR-012 | WP03 |
| FR-004 | WP01 |
| FR-005 – FR-007 | WP02 |
| FR-008, FR-009 | WP04 |
| FR-010 | WP05 |
| FR-011 | WP06 |
| NFR-001 | WP07 |
| NFR-002 | WP03, WP07 |
| NFR-003 | WP01, WP07 |
| NFR-004 | WP01, WP03, WP07 |
