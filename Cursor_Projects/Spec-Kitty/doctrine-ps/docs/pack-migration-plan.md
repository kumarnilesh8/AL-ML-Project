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

# Pack Migration Plan: `doctrine/` → `pack/`

_Version: 0.3 (working document)_  
_Date: 2026-05-26_  
_Status: Active — batches 1–6 complete, TO_BE_REMOVED fully cleared; migration procedure pending_

### Scope decisions (v0.2)

| Domain | Decision |
|---|---|
| B — Agent Framework | **File-based orchestration directives dropped.** These are replaced by spec-kitty missions and are not pack content. Agent profiles and non-orchestration tactics remain. One dedicated migration procedure is added (see §3.1). |
| C — Spec & Delivery | **Priority lowered.** Spec-kitty natively subsumes the 6-phase workflow. D034/D035 and related tactics/approaches bring no additive value to a spec-kitty team. Mark as skip-or-defer. |
| D — DevSecOps | **Priority raised to ★★★.** |
| E — Documentation | **Priority raised to ★★★.** |
| G — Platform & Tooling | **RTK toolguide removed.** RTK usage is now discouraged due to problematic behaviour in test runs; the toolguide would normalise a pattern teams should stop using. |

This document tracks the conversion of Regnology doctrine Markdown artifacts into
spec-kitty YAML pack artifacts under `pack/`. It is updated as batches complete.

---

## 1. Full Inventory

### 1.1 Regnology source artifacts

| Kind | Count | Source dir |
|---|---|---|
| Directives | 38 | `doctrine/directives/` |
| Agent profiles | 24 | `doctrine/agents/` |
| Tactics | 62 | `doctrine/tactics/` |
| Approaches | 36 | `doctrine/approaches/` |
| Styleguides | 8 | `doctrine/styleguides/` |
| Guidelines | 11 | `doctrine/guidelines/` |
| Toolguides | 7 | `doctrine/toolguides/` |
| **Total** | **186** | |

### 1.2 Spec-kitty shipped artifacts (already available to every project)

| Kind | Count | Notes |
|---|---|---|
| Directives | 19 | `src/doctrine/directives/built-in/` |
| Tactics | 116 | `src/doctrine/tactics/` (4 root + 112 in built-in subdirs) |
| Agent profiles | 14 | `src/doctrine/agent_profiles/built-in/` |
| Paradigms | 9 | `src/doctrine/paradigms/built-in/` |
| Procedures | 13 | `src/doctrine/procedures/built-in/` |
| Styleguides | 10 | `src/doctrine/styleguides/built-in/` |
| Toolguides | 11 | `src/doctrine/toolguides/built-in/` |
| **Total** | **192** | |

---

## 2. Overlap Analysis

### 2.1 Directives — exact or near-exact matches with spec-kitty shipped

These Regnology directives cover the same ground as a spec-kitty built-in.
Migrating them to the org layer would override the shipped version for Regnology
teams. Only do so if the Regnology version is materially richer; otherwise skip
and rely on the shipped artifact.

| Regnology directive | Spec-kitty shipped equivalent | Decision |
|---|---|---|
| D016 — ATDD | DIRECTIVE_034 Test-First Development | Skip — shipped covers intent |
| D017 — TDD | DIRECTIVE_034 Test-First Development | Skip — shipped covers intent |
| D021 — Locality of Change | DIRECTIVE_024 Locality of Change | Skip — identical title and scope |
| D036 — Boy Scout Rule | DIRECTIVE_025 Boy Scout Rule | Skip — identical |
| D037 — Context-Aware Design | DIRECTIVE_031 Context-Aware Design | Skip — identical |
| D038 — Conceptual Alignment | DIRECTIVE_032 Conceptual Alignment | Skip — identical |

### 2.2 Agent profiles — name collisions with spec-kitty shipped

The org layer overrides shipped artifacts with the same ID. For agents with the
same profile-id, the Regnology version takes full precedence once the pack is
installed — which is the desired behaviour since Regnology agents carry
Regnology-specific directives, tools, and context sources.

| Regnology agent | Spec-kitty shipped equivalent | Decision |
|---|---|---|
| architect-alphonso | architect-alphonso | Migrate — overrides with Regnology directives |
| frontend-freddy | frontend-freddy | Migrate — overrides with Regnology tooling |
| java-jenny | java-jenny | Migrate — overrides with Regnology AppSec refs |
| python-pedro | python-pedro | Migrate — overrides with Regnology toolguides |
| planning-priti | planner-priti (different id) | Migrate as `planning-priti`, no collision |
| curator-claire | curator-carla (different id) | Migrate as `curator-claire`, no collision |
| researcher-ralph | researcher-robbie (different id) | Migrate as `researcher-ralph`, no collision |
| reviewer-rachel | reviewer-renata (different id) | Migrate as `reviewer-rachel`, no collision |

### 2.3 Tactics — significant overlap

Approximately 25 of the 62 Regnology tactics have close equivalents in spec-kitty's
shipped tactic library. These are deferred; the ~37 Regnology-unique tactics are
migration candidates.

| Regnology tactic | Spec-kitty equivalent | Decision |
|---|---|---|
| `refactoring-*.tactic.md` (11 files) | `built-in/refactoring/refactoring-*.tactic.yaml` | Defer — shipped set is complete |
| `adr-drafting-workflow.tactic.md` | `built-in/communication/adr-drafting-workflow.tactic.yaml` | Defer |
| `adversarial-testing.tactic.md` | `adversarial-qa-handoff.tactic.yaml` | Defer |
| `ATDD_adversarial-acceptance.tactic.md` | `built-in/testing/atdd-adversarial-acceptance.tactic.yaml` | Defer |
| `premortem-risk-identification.tactic.md` | `built-in/analysis/premortem-risk-identification.tactic.yaml` | Defer |
| `test-boundaries-by-responsibility.tactic.md` | `built-in/testing/test-boundaries-by-responsibility.tactic.yaml` | Defer |
| `testing-select-appropriate-level.tactic.md` | `built-in/testing/testing-select-appropriate-level.tactic.yaml` | Defer |
| `autonomous-operation-protocol.tactic.md` | `autonomous-operation-protocol.tactic.yaml` | Defer |
| `stopping-conditions.tactic.md` | `stopping-conditions.tactic.yaml` | Defer |
| `change-apply-smallest-viable-diff.tactic.md` | `change-apply-smallest-viable-diff.tactic.yaml` | Defer |
| `review-intent-and-risk-first.tactic.md` | `review-intent-and-risk-first.tactic.yaml` | Defer |
| `input-validation-fail-fast.tactic.md` | `input-validation-fail-fast.tactic.yaml` | Defer |
| `analysis-extract-before-interpret.tactic.md` | `built-in/analysis/analysis-extract-before-interpret.tactic.yaml` | Defer |
| `development-bdd.tactic.md` | `built-in/architecture/development-bdd.tactic.yaml` | Defer |
| `dependency-hygiene.tactic.md` | `built-in/architecture/dependency-hygiene.tactic.yaml` | Defer |
| `terminology-extraction-mapping.tactic.md` | `built-in/analysis/terminology-extraction-mapping.tactic.yaml` | Defer |
| `event-storming-discovery.tactic.md` | `built-in/architecture/domain-event-capture.tactic.yaml` | Defer |
| `documentation-curation-audit.tactic.md` | `built-in/communication/documentation-curation-audit.tactic.yaml` | Defer |

### 2.4 Guidelines and styleguides — overlap

| Regnology artifact | Spec-kitty shipped equivalent | Decision |
|---|---|---|
| `guidelines/java-conventions.md` | `styleguides/built-in/java-conventions.styleguide.yaml` | Skip or override |
| `guidelines/python-conventions.md` | `styleguides/built-in/python-conventions.styleguide.yaml` | Skip or override |
| `styleguides/GENERIC_TESTING.md` | `styleguides/built-in/testing-principles.styleguide.yaml` | Skip or override |
| `styleguides/version_control_hygiene.md` | No shipped equivalent | Migrate |

---

## 3. Domain Grouping

All 186 source artifacts are grouped into eight domains for batched migration.
Priority reflects both IP value and the degree to which the pack is "inert" without
the domain's artifacts.

### Domain A — Regnology Identity & Compliance ★ highest priority

Artifacts that encode Regnology-specific governance obligations.  
No overlap with spec-kitty shipped. Must be in the pack for the org-charter to
carry any Regnology-specific weight.

**Directives (4)**

| ID | File | Pack target |
|---|---|---|
| D041 | `041_use_regnology_branding.md` | `directives/041-regnology-branding.directive.yaml` |
| D042 | `042_model_discipline.md` | `directives/042-model-discipline.directive.yaml` |
| D043 | `043_appsec_compliance.md` | `directives/043-appsec-compliance.directive.yaml` |
| D044 | `044_use_corporate_tooling.md` | `directives/044-corporate-tooling.directive.yaml` |

**Toolguides (4)**

| File | Pack target |
|---|---|
| `toolguides/agentic_model_leaderboard.yaml` | `toolguides/agentic-model-leaderboard.toolguide.yaml` |
| `toolguides/regnology-mcp.md` | `toolguides/regnology-mcp.toolguide.yaml` |
| `toolguides/google-cloud-mcp.md` | `toolguides/google-cloud-mcp.toolguide.yaml` |
| `toolguides/external-integrations.md` | `toolguides/external-integrations.toolguide.yaml` |

**Agent profiles (2 — purely Regnology roles)**

| File | Pack target |
|---|---|
| `agents/abacus-mapper-abe.agent.md` | `agent_profiles/abacus-mapper-abe.agent.yaml` |
| `agents/slidedeck-stanislav.agent.md` | `agent_profiles/slidedeck-stanislav.agent.yaml` |

**Domain A total: 10 artifacts**

---

### Domain B — Agent Profiles ★★ medium-high priority

~~File-based orchestration directives are **out of scope**.~~ These directives (D002,
D005, D007, D008, D009, D010, D011, D012, D014, D015, D019, D020, D024, D025, D040)
describe the old task-file coordination model that spec-kitty missions replace. They
do not belong in the pack and will not be converted.

The exception is a single migration procedure (§3.1) written specifically for teams
moving from the current repo structure to spec-kitty: it describes how to map
existing `doctrine/` content to pack artifacts — a one-time, audience-specific
document aimed at current maintainers, not general governance.

**Agent profiles — revised scope (8 → down from ~19)**

Profile migration decisions are driven by a comparison against spec-kitty built-in
profiles. The org-charter's `required_directives` (including TRACEABLE_DECISIONS and
AUDIENCE_ORIENTED_WRITING added in batch 2) apply to every agent in every project that
uses the pack. This "regnologifies" built-in profiles without requiring an override YAML.

**Migrate — genuinely adds value beyond org-charter directives:**

| Profile | Reason |
|---|---|
| `frontend-freddy` | **Role shift**: built-in Freddy is a browser implementer; Regnology Freddy is a UI architect/designer (component patterns, design-system ADRs) — different invocation semantics |

| `analyst-annie` | Unique — no spec-kitty equivalent (requirements elicitation + testable spec authoring) |
| `bootstrap-bill` | Unique — no spec-kitty equivalent (repo topology mapping, multi-agent onboarding scaffolding) |
| `lexical-larry` | Unique — no spec-kitty equivalent (writing style diagnostics, tone calibration) |

| `scribe-sally` | Unique — no spec-kitty equivalent (meeting notes and interaction transcription) |
| `translator-tanya` | Unique — no spec-kitty equivalent (cross-language translation with tone preservation) |

**Skip — org-charter required_directives are sufficient:**

| Profile | Spec-kitty equivalent | Why skipped |
|---|---|---|
| `architect-alphonso` | `architect-alphonso` (same id) | Near-identical scope; TRACEABLE_DECISIONS + APPSEC_COMPLIANCE cover the Regnology delta |
| `planning-priti` | `planner-priti` (different id) | Near-identical scope; different id means no collision; no additive Regnology content |
| `code-reviewer-cindy` | `reviewer-renata` | Same review scope; Regnology coding styleguides + TRACEABLE_DECISIONS cover the delta |
| `researcher-ralph` | `researcher-robbie` (different id) | Near-identical scope; no Regnology-specific research obligations |
| `reviewer-rachel` | `reviewer-renata` | Multi-lens review framing covered by TRACEABLE_DECISIONS + commit-and-markdown-linting styleguide |
| `curator-claire` | `curator-carla` (different id) | Editorial voice/tone delta covered by AUDIENCE_ORIENTED_WRITING + lexical-style-diagnostic tactic |
| `python-pedro` | `python-pedro` (same id) | APPSEC_COMPLIANCE (ruff, pytest-cov, cyclonedx-bom) + TRACEABLE_DECISIONS cover the Regnology delta; Python version floor is project config |

Note: `devops-danny`, `abacus-mapper-abe`, `slidedeck-stanislav` are in Domain A/D
for clarity of grouping.

**Domain B total: 8 agent profiles (down from ~19)**

---

### Domain C — Specification & Delivery Workflow ★ deferred / skip

**Priority lowered.** Spec-kitty natively provides the 6-phase mission lifecycle
(specify → plan → implement → review → merge → accept). D034 (Spec-Driven
Development) and D035 (Specification Frontmatter Standards) describe a workflow
that spec-kitty's mission runtime fully subsumes — migrating them to the pack would
create redundant governance that contradicts or duplicates the tool itself.

**Disposition:**

| Artifact | Decision |
|---|---|
| D034 Spec-Driven Development | **Skip** — subsumed by spec-kitty mission lifecycle |
| D035 Specification Frontmatter Standards | **Skip** — subsumed by spec-kitty mission metadata schema |
| `6-phase-spec-driven-implementation-flow.md` | **Skip** — IS spec-kitty's workflow |
| `phase-checkpoint-protocol.md` | **Skip** — subsumed by mission state machine |
| `claim-inventory-development.tactic.md` | **Review** — may have residual value outside missions |
| `spec-driven-6-phase-cycle` approach | **Skip** |
| `file-based-orchestration` approach | **Skip** — replaced by spec-kitty missions |
| Other C approaches | **Skip** |

The only Domain C artifact worth reconsidering is `claim-inventory-development` —
whether it expresses something a spec-kitty team still needs that missions don't cover
is an open question deferred to batch 5.

**Domain C total: 0 artifacts migrated (deferred/skip)**

---

### Domain D — DevSecOps & Security ★★★ high priority

Security pipeline, compliance gates, and DevOps patterns specific to Regnology
infrastructure (SonarQube, DependencyTrack, Fortify, SpotBugs, CycloneDX, Rcloud).
Priority raised: these encode Regnology-mandated security obligations and are not
covered by spec-kitty shipped artifacts.

**Directives (1 — already in Domain A)**
D043 AppSec Compliance

**Tactics (5)**

| Tactic | Pack target |
|---|---|
| `appsec-pipeline-setup.tactic.md` | `tactics/appsec-pipeline-setup.tactic.yaml` |
| `security-issue-triage.tactic.md` | `tactics/security-issue-triage.tactic.yaml` |
| `urgent-vulnerability-response.tactic.md` | `tactics/urgent-vulnerability-response.tactic.yaml` |
| `maven-project-compliance-setup.tactic.md` | `tactics/maven-project-compliance-setup.tactic.yaml` |
| `secure-design-checklist.tactic.md` | `tactics/secure-design-checklist.tactic.yaml` |

**Agent profiles (1)**

| File | Pack target |
|---|---|
| `agents/devops-danny.agent.md` | `agent_profiles/devops-danny.agent.yaml` |

**Domain D total: ~6 artifacts** (directive counted in A)

---

### Domain E — Documentation & Communication ★★★ high priority

Writing standards, ADR patterns, audience-aware communication guidelines, and
Regnology's branded document procedures. Priority raised: these directly govern
PS engagement output quality and the branded deliverable pipeline is Regnology-specific
with no spec-kitty equivalent.

**Directives (3)**

| ID | File | Notes |
|---|---|---|
| D018 | `018_traceable_decisions.md` | Richer than DIRECTIVE_003; keep as Regnology override |
| D022 | `022_audience_oriented_writing.md` | No shipped equivalent |
| D023 | `023_clarification_before_execution.md` | No shipped equivalent |

**Tactics (4)**

| Tactic | Pack target |
|---|---|
| `safe-to-fail-experiment-design.tactic.md` | `tactics/safe-to-fail-experiment-design.tactic.yaml` |
| `glossary-maintenance-workflow.tactic.md` | `tactics/glossary-maintenance-workflow.tactic.yaml` |
| `lexical-style-diagnostic.tactic.md` | `tactics/lexical-style-diagnostic.tactic.yaml` |
| `reflection-post-action-learning-loop.tactic.md` | `tactics/reflection-post-action-learning-loop.tactic.yaml` |

**Procedures (from approaches — Regnology-specific branded output)**

| Approach | Pack target |
|---|---|
| `create-branded-slidedeck` | `procedures/create-branded-slidedeck.procedure.yaml` |
| `create-branded-pdf-document` | `procedures/create-branded-pdf-document.procedure.yaml` |
| `decision-reference-types` | `procedures/decision-reference-types.procedure.yaml` |
| `design-diagramming-incremental-detail` | `paradigms/design-diagramming-incremental-detail.paradigm.yaml` |

**Styleguides (2)**

| Source | Pack target |
|---|---|
| `styleguides/commit-and-markdown-linting.md` | `styleguides/commit-and-markdown-linting.styleguide.yaml` |
| `styleguides/version_control_hygiene.md` | `styleguides/version-control-hygiene.styleguide.yaml` |

**Domain E total: ~13 artifacts**

---

### Domain F — DDD & Architecture ★★ medium priority

Domain-Driven Design patterns. Heavy overlap with spec-kitty shipped paradigms
and tactics. Migrate only Regnology-flavored variants; skip where shipped covers
the same ground.

**Directives (2)**

| ID | File | Notes |
|---|---|---|
| D025 | `025_framework_guardian.md` | Regnology-specific audit workflow |
| D006 | `006_version_governance.md` | Regnology-specific versioning |

**Tactics (~8 — Regnology-specific framing)**

`context-boundary-inference`, `team-interaction-mapping`, `requirements-validation-workflow`,
`bounded-context-linguistic-discovery`, and 4 others with Regnology framing

**Styleguides (1)**

`domain-driven-naming` → `styleguides/domain-driven-naming.styleguide.yaml`

**Approaches → paradigms (~10)**

Bounded-context canvas, linguistic-discovery, and AMMERSE-related approaches

**Domain F total: ~21 artifacts**

---

### Domain G — Platform & Tooling ★ low priority

Tool-specific guides and shell/scripting conventions.
Some overlap with spec-kitty's efficient-local-tooling toolguide.

**RTK toolguide is removed from scope.** RTK usage is now discouraged due to
problematic behaviour in test runs. Adding a toolguide would normalise a pattern
teams should be moving away from. `toolguides/rtk.md` → **do not migrate**.

**Directives (2)**

| ID | File | Notes |
|---|---|---|
| D001 | `001_cli_shell_tooling.md` | Review against spec-kitty `efficient-local-tooling` before migrating |
| D013 | `013_tooling_setup.md` | Regnology-specific fallbacks and version pins |

**Toolguides (2)**

| Source | Pack target |
|---|---|
| `toolguides/ripgrep.md` | `toolguides/ripgrep.toolguide.yaml` |
| `toolguides/sqlx-mcp-and-manual.md` | `toolguides/sqlx-mcp.toolguide.yaml` |

**Styleguides (4 in pack for Domain G)**

| Source | Pack target |
|---|---|
| `styleguides/shell-scripts.md` | **Skip** — Upstream candidate (generic) |
| `styleguides/sqlx-test-data-conventions.md` | `styleguides/sqlx-test-data-conventions.styleguide.yaml` |
| `approaches/sqlx-coding-standards.md` | `styleguides/sqlx-coding-standards.styleguide.yaml` |
| `guidelines/powershell-conventions.md` | **Skip** — Upstream candidate (generic) |

**Tactics (5 in pack)**

`sqlx-pseudo-code-to-spec`, `sqlx-explanation`, `sqlx-generation`, `sqlx-validation`, `sqlx-testing`, `sqlx-optimization` (+ `repository-initialization` elsewhere)

**Paradigm (1 in pack)**

`sqlx-spec-driven-authoring` (from `approaches/sqlx-spec-driven-authoring.md`)

**Procedure (1 in pack)**

`sqlx-fu-pipeline` — pseudo code → spec → generate → validate → test (optional explain, optimize)

**Agent profiles (1 in pack)**

`sqlx-specialist-simon` / SQLX Specialist Simon (merged from `sqlx-author-arthur` + `sqlx-interpreter-indy`; specializes from `backend-benny`)

**Domain G total: ~14 artifacts** (RTK removed)

---

### Domain H — Generic Craftsmanship (deferred / upstream candidates) ★ low priority

Directives and tactics that already have a close spec-kitty shipped equivalent.
Migrate only if the Regnology version contains materially richer guidance.
Otherwise nominate for upstream contribution to spec-kitty built-in.

**Directives (10 — review before migrating)**

D003, D004, D026 (commit protocol), D028 (bug-fixing), D039 (refactoring),
and the 6 exact-match entries from the overlap table in Section 2.1

**Tactics (~18)**

The 11 refactoring tactics plus 7 others with close shipped equivalents

**Styleguides (2)**

`GENERIC_TESTING`, `FORMALIZED_CONSTRAINT_TESTING`

**Guidelines (3 — partially overlap with spec-kitty shipped styleguides)**

`java-conventions.md`, `python-conventions.md`, `general_guidelines.md`

**Domain H total: ~33 artifacts — most likely to be skipped or contributed upstream**

---

## 3.1 Migration Procedure (one-off artifact)

One procedure is created outside the domain batches, targeting current maintainers
of the old `regnology-agent-doctrine` structure:

**`migrate-doctrine-to-pack`** (inherited from `regnology-all-company`; formerly local at
`procedures/migrate-doctrine-to-pack.procedure.yaml`)

Audience: teams who already have the old Markdown doctrine in use and need to
convert their content to pack artifacts. Entry condition: existing `doctrine/`
directory with Markdown files. Steps: inventory source artifacts → classify by
pack kind → convert format → validate with `spec-kitty doctrine pack validate` →
update `drg/fragment.yaml` → update `org-charter.yaml`. Exit condition: `spec-kitty
doctor doctrine` reports the pack installed with expected artifact counts.

This is a one-time document for current users, not standing governance.

---


### 3.2 Migration Script for Legacy Orchestration
For teams with legacy `docs/planning` and `work/collaboration` directory contents, a migration script should be provided to retrofit a baseline spec-kitty overview (spec + plan) for traceability, or to feed `docs/architecture`. 
Manager Mike and file-based orchestration procedures are therefore permanently deprecated and will not be migrated as standing governance.

## 4. Artifact Count Summary

| Domain | Artifacts | Pack kind(s) | Priority |
|---|---|---|---|
| A — Regnology Identity | 10 | directives, toolguides, agent_profiles | ★★★ |
| B — Agent Profiles | ~19 | agent_profiles | ★★ |
| C — Spec & Delivery | 0 | — | skip (subsumed by spec-kitty) |
| D — DevSecOps | ~6 | tactics, agent_profiles | ★★★ |
| E — Documentation | ~13 | directives, tactics, styleguides, procedures, paradigms | ★★★ |
| F — DDD & Architecture | ~21 | directives, tactics, styleguides, paradigms | ★★ |
| G — Platform & Tooling | ~14 | directives, toolguides, styleguides, tactics, agent_profiles | ★ |
| H — Generic Craftsmanship | ~33 | directives, tactics, styleguides | skip/upstream |
| Migration procedure | 1 | procedures | one-off |
| **Total (excl. H)** | **~84** | | |

Domain H artifacts should be reviewed against spec-kitty's shipped set before any
migration work starts on them. Most will not need to exist in the pack.

---

## 5. First Batch Scope

### Rationale

Batch 1 targets Domain A in full, plus the six highest-value unique agent profiles
from Domain B. Selection criteria:

1. **No deduplication risk** — every artifact is Regnology-specific; none clash with
   spec-kitty shipped artifacts in a way that requires a merge decision.
2. **Immediately populates `org-charter.yaml`** — the four identity directives become
   `required_directives`, giving the charter interview real Regnology weight from day one.
3. **One representative of each artifact kind** — validates the conversion pipeline
   (directive, toolguide, agent profile) before committing to the full migration.
4. **The toolguide YAML (`agentic_model_leaderboard.yaml`) is nearly ready** — it only
   needs schema fields added; the data is already structured YAML.

### Batch 1 Artifacts (14 total)

**Directives — Domain A (4)**

| Source file | Pack target | ID |
|---|---|---|
| `041_use_regnology_branding.md` | `directives/041-regnology-branding.directive.yaml` | `REGNOLOGY_BRANDING` |
| `042_model_discipline.md` | `directives/042-model-discipline.directive.yaml` | `MODEL_DISCIPLINE` |
| `043_appsec_compliance.md` | `directives/043-appsec-compliance.directive.yaml` | `APPSEC_COMPLIANCE` |
| `044_use_corporate_tooling.md` | `directives/044-corporate-tooling.directive.yaml` | `CORPORATE_TOOLING` |

**Toolguides — Domain A (3, one near-zero-effort)**

| Source file | Pack target |
|---|---|
| `toolguides/agentic_model_leaderboard.yaml` | `toolguides/agentic-model-leaderboard.toolguide.yaml` |
| `toolguides/regnology-mcp.md` | `toolguides/regnology-mcp.toolguide.yaml` |
| `toolguides/google-cloud-mcp.md` | `toolguides/google-cloud-mcp.toolguide.yaml` |

**Agent profiles — Unique Regnology roles, no spec-kitty equivalent (7)**

| Source file | Pack target | Domain |
|---|---|---|
| `agents/abacus-mapper-abe.agent.md` | `agent_profiles/abacus-mapper-abe.agent.yaml` | A |
| `agents/slidedeck-stanislav.agent.md` | `agent_profiles/slidedeck-stanislav.agent.yaml` | A |
| `agents/editor-eddy.agent.md` | `agent_profiles/editor-eddy.agent.yaml` | B |
| `agents/diagram-daisy.agent.md` | `agent_profiles/diagram-daisy.agent.yaml` | B |
| `agents/devops-danny.agent.md` | `agent_profiles/devops-danny.agent.yaml` | B/D |
| `agents/synthesizer-sam.agent.md` | `agent_profiles/synthesizer-sam.agent.yaml` | B |
| `agents/backend-benny.agent.md` | **Skip** — Generic implementer. Override via DRG with org-charter instead. | B |

### Batch 1 `org-charter.yaml` target state

```yaml
interview_defaults:
  model_tier: mid
  branding: regnology-default

required_directives:
  - REGNOLOGY_BRANDING
  - MODEL_DISCIPLINE
  - APPSEC_COMPLIANCE
  - CORPORATE_TOOLING

governance_policies:
  - id: ps-default-model-tier
    description: >
      Prefer mid-tier models (Sonnet/Flash) for routine structured work.
      Reserve premium models for complex reasoning and high-stakes decisions.
    enforcement: advisory
```

### Schema reference for conversion

**Directive minimum fields:**
```yaml
schema_version: "1.0"
id: REGNOLOGY_BRANDING
title: Use Regnology Branding
intent: >
  One-line intent statement.
enforcement: required          # required | recommended | advisory
scope: >
  What situations this directive applies to.
procedures:
  - Step one.
  - Step two.
integrity_rules:
  - Rule statement.
```

**Toolguide minimum fields** (inferred from spec-kitty shipped examples):
```yaml
schema_version: "1.0"
id: REGNOLOGY_MCP
title: Regnology MCP
summary: >
  One-line summary.
content: >
  Full toolguide body (can be multi-paragraph YAML literal block).
```

**Agent profile minimum fields:**
```yaml
profile-id: editor-eddy
name: Editor Eddy
description: One-line description.
schema-version: "1.0"
roles:
  - editor
capabilities:
  - content-editing
  - linguistic-refinement
routing-priority: 50
context-sources:
  doctrine-layers:
    - directives
    - tactics
  directives:
    - "022"
    - "018"
  additional:
    - charter-context
purpose: >
  Extended purpose statement.
```

---

## 6. Migration Batch Tracker

| Batch | Domain focus | Artifact count | Status |
|---|---|---|---|
| **1** | A (identity) + B unique agent profiles | 14 | ✅ complete (2026-05-19) |
| **2** | D (DevSecOps) + E (Documentation) | ~19 | ✅ complete (2026-05-19) |
| **3** | B agent profiles (overrides + unique, see §3) | 8 | ✅ complete (2026-05-26) — frontend-freddy override added; all skipped/deprecated profiles deleted |
| **4** | F (DDD & Architecture) | ~21 | ✅ complete (2026-05-26) — all paradigms/tactics/directives landed in earlier batches; model-discipline-selection tactic added; all TO_BE_REMOVED sources cleared |
| **5** | G (Platform & Tooling) | ~14 | ✅ complete (2026-05-26) — sqlx set, toolguides, styleguides all in pack; TO_BE_REMOVED fully cleared |
| **6** | H — triage and upstream contribution | ~33 | ✅ complete (2026-05-21) — 3 migrated, 30 skipped/upstreamed |
| Migration procedure | one-off | 1 | ⬜ pending |
| **Total (excl. H)** | | **~83** | |

---

## 7. Open Decisions

| # | Question | Impact |
|---|---|---|
| OD-1 | ~~For agent profiles that collide with spec-kitty shipped: keep as overrides or rename?~~ **Resolved (2026-05-19):** Only `frontend-freddy` and `java-jenny` are worth overriding. All other near-identical profiles are skipped — the org-charter's `required_directives` (incl. TRACEABLE_DECISIONS, AUDIENCE_ORIENTED_WRITING) sufficiently regnologify the built-ins. See Domain B §3 for full reasoning. | ✅ closed |
| OD-2 | D001 (CLI & Shell Tooling) vs spec-kitty's `efficient-local-tooling` toolguide: skip as duplicate, or migrate as Regnology-flavoured override (adds tool preferences, fallback conventions, internal paths)? **Resolved (2026-05-21): SKIP.** D001 heavily references file-based orchestration paths (`work/notes/LOCAL_ENV.md`, `tmp/remediation/`) and the RTK tool (discouraged). The generic tool-usage rules (rg, fd, jq, yq, ast-grep) are covered by the spec-kitty `efficient-local-tooling` built-in. | ✅ closed |
| OD-3 | For Domain H generic tactics and directives: which are upstream contribution candidates vs. genuine skips? A one-pass triage is needed before batch 6. **Resolved (2026-05-21):** Full triage complete. Migrated: TEST_FIRST_BUG_FIXING (directive), living-glossary-practice (paradigm), regnology-jira-workflow (procedure). Upstream nominees (generic quality artifacts, no Regnology flavour): `function-over-form-testing`, `reverse-speccing`, `code-review-incremental`. All remaining Domain H artifacts were either confirmed skip (identical to spec-kitty shipped, file-based orchestration references, or zero Regnology-specific content) or already deferred in the overlap analysis (Section 2.3). | ✅ closed |
| OD-4 | ~~Approaches → paradigm or procedure? A per-file classification pass is needed for all 36 approaches.~~ **Resolved (2026-05-26):** All 36 approaches classified. 10 migrated as paradigms, 3 as procedures. 23 skipped or deferred upstream. | ✅ closed |
| OD-5 | D018 (Traceable Decisions) vs spec-kitty DIRECTIVE_003 (Decision Documentation): confirm it is richer enough to warrant an override, or align with shipped and skip. **Resolved (2026-05-19):** Richer; kept as Regnology override in Batch 2. | ✅ closed |

---

## 8. Layer Promotion to All-Company (org) Pack

Separate from the doctrine→pack conversion above, artifacts that turned out to be
broadly reusable across the company are being promoted from this PS overlay
(`ps-agent-enabled-factory`) up to the all-company org pack
(`regnology-all-company`), one agent per PR.

| PR | Agent | Promoted artifacts | Stays in PS | Status |
|---|---|---|---|---|
| #1 | `comms-cleo` | `comms-cleo` profile, `juno-mcp` toolguide (+`.md`), `lexical-style-diagnostic` tactic, `templates/audience/**` | Inbound child→parent edges (synthesizer-sam, scribe-sally, receptionist-rob, gemini-bot-georgia; analyst-annie/datamodel-darren/juno-based-regulatory-research → juno-mcp); `juno-mcp` retained in `org-charter.yaml required_toolguides` (resolves via inheritance). The former downward `comms-cleo → slidedeck-stanislav` edge was later relocated up into the org fragment in PR #6. | ✅ migrated |
| #2 | `analyst-annie` | `analyst-annie` profile, `juno-based-regulatory-research` tactic, `atdd-acceptance-criteria-preparation` procedure, corporate Jira trio (`regnology-jira-workflow` procedure, `jira-conventions` styleguide, `regnology-mcp-jira` toolguide +`.md`) | Inbound child→parent edges to `analyst-annie` (lexical-larry, datamodel-darren, devops-danny, receptionist-rob; `datamodel-darren → juno-based-regulatory-research`; `ps-project-intake`/`ps-intake-interview` → `regnology-jira-workflow`; `ps-project-intake → regnology-mcp-jira`); the three downward edges `analyst-annie → datamodel-darren` / `→ ps-project-intake` / `→ ps-intake-interview`; the PS intake process (`ps-project-intake`, `ps-intake-interview`, `templates/ps-workflows/`) stays. Built-in→org edges (`planner-priti → jira-conventions`, `doctrine-daphne → analyst-annie`) relocated to the org fragment. `juno-mcp` (already org) resolves via inheritance. | ✅ migrated |
| #3 | `scribe-sally`, `synthesizer-sam` | `scribe-sally` and `synthesizer-sam` profiles only (all dependencies already upstream via PR #1 or built-in; no new artifact promotions) | Inbound child→parent edges kept in PS: `minutes-maker-mahad → scribe-sally` (specializes_from), `gemini-bot-georgia → synthesizer-sam` (delegates_to). No downward edges. Built-in `doctrine-daphne → synthesizer-sam` relocated to the org fragment. Design-review (doctrine-daphne) dropped unbacked edges `synthesizer-sam → juno-mcp` / `→ agentic-model-leaderboard` and downgraded both `specializes_from comms-cleo` to `suggests`. | ✅ migrated |
| #4 | `lexical-larry` | `lexical-larry` profile + its exclusive `language-first-architecture` paradigm (all other deps already upstream via PR #2/pre-existing or built-in `architect-alphonso`; no other new promotions) | No inbound child→parent edges and no downward edges (lexical-larry references only org/built-in targets); the node's removal drops both copies of the pre-existing duplicate `lexical-larry → analyst-annie (specializes_from)` edge from this fragment (2→0 locally — the org-side design-review kept one copy of that edge, plus added `lexical-larry → VERSION_GOVERNANCE` (dir 006), in the promoted `doctrine-org` fragment, not this repo's). | ✅ migrated |
| #5 | `minutes-maker-mahad` | `minutes-maker-mahad` profile + the locked minutes cluster: `meeting-minutes-pipeline` (procedure), `meeting-minutes-format` (styleguide), `confluence-minutes-publisher` (toolguide +`.md`), `extract-then-publish-separation` (paradigm), `MINUTES_STAND_ALONE` + `ACTION_ITEM_ATTRIBUTION` (directives) | Inbound child→parent edge kept in PS: `receptionist-rob → minutes-maker-mahad` (suggests). No downward edges. **The two minutes directives stay enforced in this PS `org-charter.yaml required_directives` and resolve via inheritance from the parent (enforcement unchanged).** Design-review (doctrine-daphne): PASS, no remediation — `minutes-maker-mahad → scribe-sally (specializes_from)` kept as a genuine narrowing (runs the Scribe Sally documentation discipline); `confluence-minutes-publisher` write scope appropriate for a publisher. | ✅ migrated |

| #6 | `diagram-daisy`, `slidedeck-stanislav` | Both profiles only — all dependencies already upstream (org: `regnology-main-context`, `regnology-branding`, `TRACEABLE_DECISIONS`, `safe-to-fail-experiment-design`, `design-diagramming-incremental-detail`, `professional-communications`, `AUDIENCE_ORIENTED_WRITING`, `regnology-docgen`; built-in `designer-dagmar`) — no new artifact promotions | Inbound child→parent edge kept in PS: `receptionist-rob → slidedeck-stanislav` (suggests). **Relocated the standing PR #1 downward edge `comms-cleo → slidedeck-stanislav` UP into the org fragment (both endpoints now org) — net −1 downward edges.** Design-review (doctrine-daphne): dropped 2 unbacked `→ designer-dagmar (delegates_to)` edges (kept `specializes_from designer-dagmar` as genuine design-family narrowing); added `slidedeck-stanislav → regnology-docgen (applies)` to back a heavy prose reference (pre-existing PS gap). | ✅ migrated |

Golden rule preserved: the org fragment carries no reference to any PS (child)
artifact; the only downward edge remaining in this PS fragment is
`analyst-annie → {datamodel-darren, ps-project-intake, ps-intake-interview}`
(PR #2). The former `comms-cleo → slidedeck-stanislav` exception (PR #1) was
relocated up into the org fragment as part of PR #6 (both endpoints now org;
see row #6 above).
