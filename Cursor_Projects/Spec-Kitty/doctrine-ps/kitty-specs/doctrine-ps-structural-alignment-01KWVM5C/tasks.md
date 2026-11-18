<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                 |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Tasks: Doctrine-PS Structural Alignment

**Mission**: `doctrine-ps-structural-alignment-01KWVM5C`
**Branch**: `feature/migration-2915-structural-alignment` -> merges into `feature/migration-2915-structural-alignment`
**Plan**: `kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/plan.md`
**Spec**: `kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/spec.md`
**Research**: `kitty-specs/doctrine-ps-structural-alignment-01KWVM5C/research.md`

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Correct `.cursor/`/`.claude/` claims in `AGENTS.md` and `CLAUDE.md` (FR-001) | WP01 | — |
| T002 | Correct `src/framework`, `tests/*`, `fixtures/` claims in `AGENTS.md` and `CLAUDE.md` (FR-002) | WP01 | — |
| T003 | Correct `pack/tools/fallback/agentic_model_leaderboard.yaml` toolguide reference in `AGENTS.md` (FR-003) | WP01 | [P] |
| T004 | Reconcile `AGENTS.md` §9 directive index with `pack/directives/` reality (FR-004) | WP01 | [P] |
| T005 | Fix `README.md`'s `docs/HOW_TO_USE.md` path — correct in place (FR-005, research.md R5) | WP01 | [P] |
| T006 | Remove `README.md`'s `pack/mission_step_contracts/` reference (FR-006, research.md R5) | WP01 | [P] |
| T007 | Fix/annotate `README.md`'s `pack/tools/fallback/` reference (FR-007) | WP01 | [P] |
| T008 | Remove `README.md`'s `tools/pack-dashboard/` reference (FR-008, research.md R5) | WP01 | [P] |
| T009 | Markdownlint + grep-verify SC-001/SC-002/SC-003 for `AGENTS.md`/`CLAUDE.md`/`README.md` | WP01 | — |
| T010 | Re-verify `regnology-ps-chatbots` live structure against spec's 2026-07-06 snapshot (research.md R1 precondition) | WP02 | — |
| T011 | Repoint `gemini-bot-georgia.agent.yaml` output-target fields to `regnology-ps-chatbots` (FR-012) | WP02 | — |
| T012 | Update `instructions.template.md`, `about.template.md`, `set-up-guide.template.md` path examples (FR-013, batch 1) | WP02 | [P] |
| T013 | Update `review-submission.template.md`, `per-agent-folder.template.md`, `roster.template.yaml` path examples (FR-013, batch 2) | WP02 | [P] |
| T014 | Update `pack/README.md`, `pack/agent_profiles/README.md`, `docs/SURFACES.md` surface descriptions (FR-014) | WP02 | [P] |
| T015 | Clean `.gitignore`'s dead `gemini-agents/onboarding-odysseus/...` rules and stale comment (FR-014) | WP02 | [P] |
| T016 | Markdownlint + grep-verify SC-005/SC-006 + confirm C-002 untouched fields | WP02 | — |
| T017 | Full `.gitignore` cross-reference pass to build the complete lint allow-list candidate set (research.md R2) | WP03 | — |
| T018 | Write `tools/lint-doc-paths.py` core scanner (FR-009) | WP03 | — |
| T019 | Implement FR-010 allow-list mechanism with inline justification comments | WP03 | — |
| T020 | Ship fixture-based inject-and-detect test for the lint script (FR-009 acceptance criterion) | WP03 | — |
| T021 | Wire `lint-doc-paths` target into `Makefile` (FR-011) | WP03 | — |
| T022 | Run the lint against post-WP01/WP02 repo state; confirm zero unexplained dangling paths (SC-004) | WP03 | — |

---

## WP01 — Structural Documentation Drift Corrections

**Priority**: High
**Goal**: Correct `AGENTS.md`, `CLAUDE.md`, and `README.md` so their repository-structure claims, toolguide/directive references, and dangling paths match on-disk reality.
**Independent test**: Every path reference in the three files' structure sections resolves to an existing file/directory or carries an explicit "inherited from the parent pack" annotation; markdownlint reports 0 new violations.
**Estimated prompt size**: ~350 lines
**Requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-003, SC-001, SC-002, SC-003

- [x] T001 Correct `.cursor/`/`.claude/` claims in `AGENTS.md` and `CLAUDE.md` (WP01)
- [x] T002 Correct `src/framework`, `tests/*`, `fixtures/` claims in `AGENTS.md` and `CLAUDE.md` (WP01)
- [x] T003 Correct `pack/tools/fallback/agentic_model_leaderboard.yaml` toolguide reference in `AGENTS.md` (WP01)
- [x] T004 Reconcile `AGENTS.md` §9 directive index with `pack/directives/` reality (WP01)
- [x] T005 Fix `README.md`'s `docs/HOW_TO_USE.md` path (WP01)
- [x] T006 Remove `README.md`'s `pack/mission_step_contracts/` reference (WP01)
- [x] T007 Fix/annotate `README.md`'s `pack/tools/fallback/` reference (WP01)
- [x] T008 Remove `README.md`'s `tools/pack-dashboard/` reference (WP01)
- [x] T009 Markdownlint + grep-verify SC-001/SC-002/SC-003 (WP01)

**Prompt file**: `tasks/WP01-structural-doc-drift-corrections.md`
**Dependencies**: none (parallel-safe with WP02)

---

## WP02 — Gemini Bot Georgia Repoint to `regnology-ps-chatbots`

**Priority**: High
**Goal**: Repoint `gemini-bot-georgia.agent.yaml`, its six output templates, three surface-description docs, and `.gitignore`'s dead rules from the retired local `gemini-agents/` directory to the live `regnology-ps-chatbots` repository's actual layout.
**Independent test**: Zero remaining references imply a local `gemini-agents/` output target; Georgia's profile-id/roles/routing-priority/roster wiring is byte-identical to before this WP; markdownlint reports 0 new violations.
**Estimated prompt size**: ~400 lines
**Requirements**: FR-012, FR-013, FR-014, NFR-003, SC-005, SC-006

- [x] T010 Re-verify `regnology-ps-chatbots` live structure against spec's 2026-07-06 snapshot (WP02)
- [x] T011 Repoint `gemini-bot-georgia.agent.yaml` output-target fields (WP02)
- [x] T012 Update `instructions.template.md`, `about.template.md`, `set-up-guide.template.md` (WP02)
- [x] T013 Update `review-submission.template.md`, `per-agent-folder.template.md`, `roster.template.yaml` (WP02)
- [x] T014 Update `pack/README.md`, `pack/agent_profiles/README.md`, `docs/SURFACES.md` (WP02)
- [x] T015 Clean `.gitignore`'s dead `gemini-agents/onboarding-odysseus/...` rules (WP02)
- [x] T016 Markdownlint + grep-verify SC-005/SC-006 + confirm C-002 untouched fields (WP02)

**Prompt file**: `tasks/WP02-georgia-repoint-regnology-ps-chatbots.md`
**Dependencies**: none (parallel-safe with WP01)

---

## WP03 — Doc-Path Dangle Lint Tool

**Priority**: High
**Goal**: Ship `tools/lint-doc-paths.py`, a complete allow-list, a fixture-based test, and a `Makefile` target so this class of doc-path drift is caught automatically going forward — then run it as the mission's terminal gate.
**Independent test**: `python3 tools/lint-doc-paths.py` exits 0 against the post-WP01/WP02 repository state; the shipped fixture test demonstrates non-zero exit on a deliberately dangling path and zero exit once removed; `make lint-doc-paths` invokes the same script.
**Estimated prompt size**: ~400 lines
**Requirements**: FR-009, FR-010, FR-011, NFR-001, NFR-002, SC-004

- [x] T017 Full `.gitignore` cross-reference pass for the lint allow-list (WP03)
- [x] T018 Write `tools/lint-doc-paths.py` core scanner (WP03)
- [x] T019 Implement FR-010 allow-list mechanism (WP03)
- [x] T020 Ship fixture-based inject-and-detect test (WP03)
- [x] T021 Wire `lint-doc-paths` target into `Makefile` (WP03)
- [x] T022 Run the lint against post-WP01/WP02 repo state; confirm zero unexplained dangling paths (WP03)

**Prompt file**: `tasks/WP03-doc-path-dangle-lint-tool.md`
**Dependencies**: WP01, WP02 (terminal gate — FR-009's "reports zero dangling paths for FR-001–FR-008 and FR-013" acceptance criterion can only be truthfully verified once those files have landed)

---

## Execution Notes

- WP01 and WP02 touch fully disjoint file sets (`AGENTS.md`/`CLAUDE.md`/`README.md` vs. `pack/agent_profiles/gemini-bot-georgia.agent.yaml`/`pack/templates/gemini/*`/`pack/README.md`/`pack/agent_profiles/README.md`/`docs/SURFACES.md`/`.gitignore`) and can implement/review in parallel.
- WP03 is a hard terminal gate: do not start T018–T022 implementation until WP01 and WP02 are both merged/landed, per plan.md's Implementation Concern Map sequencing and FR-009's own acceptance criterion.
- No testing subtasks beyond what the spec explicitly requires (FR-009's fixture test, and the markdownlint/grep verification steps each WP's acceptance criteria call for) — per Directive on tests-remain-optional, this mission does not add speculative test coverage beyond spec-mandated verification.
