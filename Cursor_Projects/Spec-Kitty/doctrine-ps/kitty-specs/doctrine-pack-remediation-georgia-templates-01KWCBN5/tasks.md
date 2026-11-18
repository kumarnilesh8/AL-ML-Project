<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Tasks: Doctrine pack remediation & Georgia templates

**Mission:** `doctrine-pack-remediation-georgia-templates-01KWCBN5`
**Plan:** [plan.md](./plan.md) · **Spec:** [spec.md](./spec.md) · **Quickstart:** [quickstart.md](./quickstart.md)
**Branch:** `refactor/doctrine-daphne-and-onboard-built-in-overlap` (planning base == merge target)

## Ownership model

Work packages are scoped so **no two WPs edit the same file** (the post-plan adversarial
review's file-collision matrix forced single-owner consolidation). Where two Implementation
Concerns touched one file, the owning WP performs both edits. `graph.yaml` and `MANIFEST.yml`
are generated — only their owning WP regenerates them; never hand-edit.

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Declare `external_nodes` (doctrine-daphne, planner-priti) with provenance | WP01 | |
| T002 | Remove self-referencing edge `onboard-external-agent-to-pack → self` | WP01 | |
| T003 | Remove duplicate `receptionist-rob → repository-initialization` edge | WP01 | |
| T004 | Wire orphan paradigms (`backend-for-frontend-bff`, `capability-language-selection`) as nodes + ≥1 consuming edge each | WP01 | |
| T005 | Verify fragment parses; 0 undeclared dangling refs, 0 self/dup edges | WP01 | |
| T006 | Reproduce defect: run compiler, capture ≥41 mis-prefixed targets (≥8 local) | WP02 | |
| T007 | Fix `tools/compile-drg.py` kind-derivation (resolve from local pack/MANIFEST + external_nodes) | WP02 | |
| T008 | Fetch upstream pack (secondary); regenerate `graph.yaml` | WP02 | |
| T009 | Verify all ≥41 targets correct (broad grep + MANIFEST cross-check); deterministic re-run = no diff | WP02 | |
| T010 | Create `pack/templates/gemini/` template family | WP03 | [P] |
| T011 | Slim `gemini-bot-georgia` `primary-focus` to template references (≥50% cut, no per-file prose) | WP03 | [P] |
| T012 | Apply canonical `context-sources` shape to Georgia | WP03 | [P] |
| T013 | Update `gemini-agents/README.md` to point at templates | WP03 | [P] |
| T014 | Verify SC-006 structural gate | WP03 | [P] |
| T015 | Pester pitfalls → single authoritative source (toolguide), procedure references | WP04 | [P] |
| T016 | SQLX CLI/JVM block → single source (tactic), toolguide references | WP04 | [P] |
| T017 | Model-tier restatements (sqlx-mcp toolguide, sqlx-fu-pipeline) → reference MODEL_DISCIPLINE | WP04 | [P] |
| T018 | Minutes format string → single source (styleguide), directive references | WP04 | [P] |
| T019 | `meeting-minutes-pipeline`: drop model-tier restatement + de-hardcode model names | WP04 | [P] |
| T020 | Verify per-target single-source greps (SC-004) | WP04 | [P] |
| T021 | Replace/remove dangling personas in `cloud-native-design-review.tactic.yaml` | WP05 | [P] |
| T022 | Fix `create-branded-pdf-document` "Regnology / Regnology" cross-line typo | WP05 | [P] |
| T023 | Fix directive `050` `scope` (docs→agent-behavior) + un-agent-measurable metric | WP05 | [P] |
| T024 | Verify clarity greps (SC-007 partial) | WP05 | [P] |
| T025 | Document canonical schema (paradigm summary/body; context-sources shape) in schema-template procedures | WP06 | |
| T026 | Canonicalize all paradigms `summary`/`body` (incl. wired orphans) | WP06 | |
| T027 | Canonicalize `context-sources` shape across all profiles (except Georgia) | WP06 | |
| T028 | Enrich `scribe-sally` `context-sources` with `toolguides` | WP06 | |
| T029 | Profile-resident dedup: duplicate `juno-mcp` in annie & darren; Mahad inlined Sally ethos → reference | WP06 | |
| T030 | Mahad `confirmation-mode` → canonical mode token | WP06 | |
| T031 | Verify SC-008 + profile dedup greps | WP06 | |
| T032 | Regenerate `MANIFEST.yml` via supported tool (research R4) | WP07 | |
| T033 | MANIFEST machine-diff: 0 unregistered (incl. georgia, mahad, powershell-peter) | WP07 | |
| T034 | `spec-kitty doctrine pack validate pack/` → 0 errors (baseline 150) | WP07 | |
| T035 | Run full quickstart harness (SC-001..008); confirm FR-012 surfaces | WP07 | |
| T036 | Confirm graph freshness (compiler deterministic, no diff) | WP07 | |

## Execution lanes

```
Phase 0 (parallel):  WP01   WP03   WP04   WP05
Phase 1:             WP02 (after WP01 + upstream fetch)
                     WP06 (after WP01)
Phase 2 (terminal):  WP07 (after WP01..WP06)
```

---

## WP01 — DRG source cleanup (`fragment.yaml`)

- **Goal:** Make `pack/drg/fragment.yaml` valid input: declare built-in external nodes, remove bad edges, wire orphan paradigms. Prompt: [tasks/WP01-drg-source-cleanup.md](./tasks/WP01-drg-source-cleanup.md)
- **Priority:** P1 (gates WP02, WP06) · **Requirements:** FR-004, FR-006, FR-008
- **Independent test:** `fragment.yaml` parses; only `doctrine-daphne`/`planner-priti` remain as declared external refs; 0 self/duplicate edges; both orphan paradigms appear as nodes with ≥1 edge.
- **Dependencies:** none · **Est:** ~180 lines
- [x] T001 Declare `external_nodes` (doctrine-daphne, planner-priti) with provenance (WP01)
- [x] T002 Remove self-referencing edge `onboard-external-agent-to-pack → self` (WP01)
- [x] T003 Remove duplicate `receptionist-rob → repository-initialization` edge (WP01)
- [x] T004 Wire orphan paradigms as nodes + ≥1 consuming edge each (WP01)
- [x] T005 Verify fragment parses; 0 undeclared dangling refs, 0 self/dup edges (WP01)

## WP02 — DRG compiler fix & graph regeneration

- **Goal:** Fix `tools/compile-drg.py` kind-derivation and regenerate `graph.yaml` so all ≥41 mis-prefixed targets carry correct kinds. Prompt: [tasks/WP02-drg-compiler-fix.md](./tasks/WP02-drg-compiler-fix.md)
- **Priority:** P1 · **Requirements:** FR-005
- **Independent test:** broadened grep returns 0 mis-prefixed local targets; every remaining `target: directive:<id>` resolves to a real directive in MANIFEST; re-running the compiler yields no diff.
- **Dependencies:** WP01 · **Est:** ~220 lines
- [x] T006 Reproduce defect: capture ≥41 mis-prefixed targets (≥8 local) (WP02)
- [x] T007 Fix `tools/compile-drg.py` kind-derivation (local pack/MANIFEST + external_nodes) (WP02)
- [x] T008 Fetch upstream pack (secondary); regenerate `graph.yaml` (WP02)
- [x] T009 Verify all ≥41 targets correct; deterministic re-run = no diff (WP02)

## WP03 — Gemini template extraction & Georgia slim

- **Goal:** Capture Georgia's output structure once in `pack/templates/gemini/`; slim her profile to references; point README at templates. Prompt: [tasks/WP03-gemini-templates.md](./tasks/WP03-gemini-templates.md)
- **Priority:** P2 · **Requirements:** FR-001, FR-002, FR-003 (NFR-004)
- **Independent test:** `pack/templates/gemini/` exists; Georgia `primary-focus` carries no per-file prose and is ≥50% shorter; README points at templates.
- **Dependencies:** none · **Est:** ~230 lines
- [x] T010 Create `pack/templates/gemini/` template family (WP03)
- [x] T011 Slim Georgia `primary-focus` to template references (WP03)
- [x] T012 Apply canonical `context-sources` shape to Georgia (WP03)
- [x] T013 Update `gemini-agents/README.md` to point at templates (WP03)
- [x] T014 Verify SC-006 structural gate (WP03)

## WP04 — De-duplication: single source of truth (non-profile)

- **Goal:** Collapse each duplicated rule/body to one authoritative artefact; others reference it. Prompt: [tasks/WP04-dedup-single-source.md](./tasks/WP04-dedup-single-source.md)
- **Priority:** P2 · **Requirements:** FR-010, FR-011 (minutes-pipeline model names)
- **Independent test:** per-target greps each return exactly one authoritative file; `meeting-minutes-pipeline` carries no hardcoded model names.
- **Dependencies:** none · **Est:** ~240 lines
- [x] T015 Pester pitfalls → single source (toolguide) (WP04)
- [x] T016 SQLX CLI/JVM block → single source (tactic) (WP04)
- [x] T017 Model-tier restatements → reference MODEL_DISCIPLINE (WP04)
- [x] T018 Minutes format string → single source (styleguide) (WP04)
- [x] T019 `meeting-minutes-pipeline`: drop model-tier restatement + de-hardcode model names (WP04)
- [x] T020 Verify per-target single-source greps (SC-004) (WP04)

## WP05 — Clarity fixes

- **Goal:** Remove dangling personas, the cross-line branding typo, and the mis-scoped `050` metadata. Prompt: [tasks/WP05-clarity-fixes.md](./tasks/WP05-clarity-fixes.md)
- **Priority:** P3 · **Requirements:** FR-011
- **Independent test:** persona grep = 0; typo grep = 0; `050` `scope: agent-behavior`.
- **Dependencies:** none · **Est:** ~150 lines
- [x] T021 Replace/remove dangling personas in `cloud-native-design-review.tactic.yaml` (WP05)
- [x] T022 Fix `create-branded-pdf-document` cross-line typo (WP05)
- [x] T023 Fix directive `050` `scope` + un-agent-measurable metric (WP05)
- [x] T024 Verify clarity greps (WP05)

## WP06 — Profile & paradigm normalization

- **Goal:** Canonicalize schema (paradigm `summary`/`body`, `context-sources` shape) across all profiles (except Georgia) and paradigms; fold in profile-resident dedup/clarity. Prompt: [tasks/WP06-profile-paradigm-normalization.md](./tasks/WP06-profile-paradigm-normalization.md)
- **Priority:** P2 · **Requirements:** FR-009, FR-010 (profile-resident), FR-011 (Mahad confirmation-mode)
- **Independent test:** every paradigm has `summary:` + `body:`; uniform `context-sources` shape; Sally has `toolguides`; no duplicate `juno-mcp`; Mahad references Sally (no inlined ethos) and uses a canonical mode token.
- **Dependencies:** WP01 (orphan disposition) · **Est:** ~260 lines
- [x] T025 Document canonical schema in schema-template procedures (WP06)
- [x] T026 Canonicalize all paradigms `summary`/`body` (WP06)
- [x] T027 Canonicalize `context-sources` across all profiles except Georgia (WP06)
- [x] T028 Enrich `scribe-sally` `context-sources` with `toolguides` (WP06)
- [x] T029 Profile-resident dedup (juno-mcp annie/darren; Mahad ethos → reference) (WP06)
- [x] T030 Mahad `confirmation-mode` → canonical mode token (WP06)
- [x] T031 Verify SC-008 + profile dedup greps (WP06)

## WP07 — MANIFEST refresh & validation gate (terminal)

- **Goal:** Refresh `MANIFEST.yml` after all edits settle; run the full acceptance harness green. Prompt: [tasks/WP07-manifest-validation-gate.md](./tasks/WP07-manifest-validation-gate.md)
- **Priority:** P1 (terminal) · **Requirements:** FR-007, FR-012 (validation-only)
- **Independent test:** MANIFEST machine-diff = 0 unregistered; `pack validate` = 0 errors; quickstart SC-001..008 all pass.
- **Dependencies:** WP01, WP02, WP03, WP04, WP05, WP06 · **Est:** ~170 lines
- [ ] T032 Regenerate `MANIFEST.yml` via supported tool (WP07)
- [ ] T033 MANIFEST machine-diff: 0 unregistered (WP07)
- [ ] T034 `pack validate` → 0 errors (WP07)
- [ ] T035 Run full quickstart harness (SC-001..008); confirm FR-012 (WP07)
- [ ] T036 Confirm graph freshness (deterministic, no diff) (WP07)

## MVP scope

WP01 → WP02 → WP07 (DRG integrity + validation) is the minimum that turns the pack
green again. WP03–WP06 are independently shippable improvements layered on top.
