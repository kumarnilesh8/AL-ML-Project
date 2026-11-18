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

# PowerShell Specialist Agent (PowerShell Peter)

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `01KTP3DGA51P23R13715VG6T3Q` |
| Mission Slug | `powershell-specialist-agent-01KTP3DG` |
| Mission Type | software-dev |
| Target Branch | `beta` |
| Status | In Specification |

---

## Intent Summary

The Regnology doctrine pack provides language specialists for Java and Python via
spec-kitty built-in profiles augmented by pack styleguides and tactics. There is
no equivalent for **PowerShell**. Engagement teams working on Windows administration,
cross-platform `pwsh` automation, module packaging, and build scripts lack a governed
specialist with clear boundaries, conventions, and repeatable workflows.

This mission introduces **PowerShell Peter** (`powershell-peter`) — a pack-native
agent profile — plus a **PowerShell conventions styleguide**, **three tactics** for
module scaffolding, testing, and script quality gates, and **DRG wiring** so Peter
behaves consistently with other implementer agents (java-jenny, python-pedro,
devops-danny).

Primary actor: engagement engineer or orchestrating agent routing PowerShell
implementation work.

Source material: PowerShell Primer (Stijn Dejongh, 2025-11-13, draft) — distilled
into governed pack artifacts per **Primer Usage Strategy Option B** (see Assumptions).

---

## Scope

**In scope:**

- `pack/agent_profiles/powershell-peter.agent.yaml` — role, capabilities, specialization,
  collaboration contract, directive references, mode defaults
- `pack/styleguides/powershell-conventions.styleguide.yaml` — distilled coding and
  module conventions (principles + named patterns with good/bad examples)
- Three pack tactics (Option B — larger v1):
  - `powershell-module-scaffold` — bootstrap a Regnology-standard module layout
  - `powershell-pester-workflow` — author and run Pester tests
  - `powershell-script-quality-gate` — PSScriptAnalyzer + strict-mode verification
- DRG edges in `pack/drg/fragment.yaml`: Peter → styleguide/tactics/directives;
  collaboration edges to devops-danny and analyst-annie where appropriate
- Domain tag in `config/artifact-tags.yaml`
- `.cursor/agents/powershell-peter.md` Cursor export (generated from profile)
- Pack validation: `spec-kitty doctrine pack validate pack/` reports 0 errors
- Provenance note in spec Assumptions linking to the PowerShell Primer source

**Out of scope:**

- Upstreaming a spec-kitty built-in `powershell-peter` profile (follow-on if needed)
- Jenkinsfile / Sonar / SBOM pipeline design (DevOps Danny)
- Full repository doctrine scaffolding (Bootstrap Bill / repository-initialization)
- Replacing `.kittify/memory/templates/POWERSHELL_SYNTAX.md` (spec-kitty CLI shell guide;
  Peter cross-references it, does not duplicate it)
- Publishing the full PowerShell Primer verbatim inside `pack/` (see Primer Usage Strategy)

---

## Assumptions

1. **Default runtime target** is PowerShell 7+ (`pwsh`); Windows PowerShell 5.1 is
   acknowledged only where engagement charter requires legacy support.
2. **Primer Usage Strategy Option B** is selected: conventions are **distilled** into
   the styleguide YAML; a **companion human reference** lives at
   `docs/references/powershell-primer.md` (adapted from the source primer with
   attribution). The styleguide remains the enforceable contract; the companion doc
   is educational depth, not validated by pack schema.
3. Primer source is approved for internal Regnology use; author attribution (Stijn
   Dejongh) is preserved in the companion doc header.
4. Peter is a **pack-native profile** (not a spec-kitty built-in augmentation).
5. AppSec for PowerShell follows **tiered baseline C-001** (see Constraints); full
   Maven-style Sonar/SBOM integration is DevOps Danny's domain when the engagement
   charter classifies artifacts as deliverable application software.

---

## Primer Usage Strategy (Decision Record)

| Option | Description | Selected |
|---|---|---|
| A | Styleguide YAML only — all knowledge distilled; no companion doc | No |
| B | Styleguide YAML (enforceable) + `docs/references/powershell-primer.md` (human reference) | **Yes** |
| C | Styleguide + toolguide artifact for tooling/deps (PSResourceGet, Pester, etc.) | Deferred (Could follow-on) |
| D | Paste full primer into `pack/` as a template or styleguide blob | No — violates distill principle |

**Distill principle:** The styleguide answers "does this code conform?" The companion
doc answers "why and how do I learn this?" Tactics answer "what steps do I run?"

---

## User Scenarios & Testing

### Scenario 1 — Scaffold a new PowerShell module

**Given** an engagement needs a reusable PowerShell module for deployment automation  
**When** an orchestrator routes the task to PowerShell Peter  
**Then** Peter applies `powershell-module-scaffold`, produces `.psd1`/`.psm1` with
Public/Private layout, `Tests/`, and `build.ps1` with Lint/Test/Build tasks, and
validates layout against `powershell-conventions`

### Scenario 2 — Add tests to existing scripts

**Given** a repository has `.ps1` functions without tests  
**When** Peter is asked to add test coverage  
**Then** Peter applies `powershell-pester-workflow`, creates Describe/It blocks aligned
with pack test idioms, and documents how to run `Invoke-Pester` locally and from `build.ps1`

### Scenario 3 — Lint and security baseline before handoff

**Given** Peter has authored or modified PowerShell scripts  
**When** Peter completes the change set  
**Then** Peter runs `powershell-script-quality-gate` (PSScriptAnalyzer, strict mode
check, secret-pattern scan guidance per C-001) before marking work complete

### Scenario 4 — Clear delegation to DevOps Danny

**Given** the user asks for a Jenkins pipeline with Sonar gates for a PowerShell repo  
**When** Peter receives the request  
**Then** Peter declines primary ownership, documents script/module artifacts Peter can
deliver, and recommends handoff to DevOps Danny for CI/AppSec pipeline integration

---

## Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | A pack agent profile `powershell-peter` exists at `pack/agent_profiles/powershell-peter.agent.yaml` with schema-valid fields: profile-id, name ("PowerShell Peter"), purpose, specialization (primary-focus, secondary-awareness, avoidance-boundary, success-definition), collaboration contract, directive-references, and mode-defaults. | Approved | Must |
| FR-002 | The profile declares Peter's primary focus as PowerShell 7+ module and script authoring, Pester testing, and PSScriptAnalyzer-enforced quality; secondary awareness includes cross-platform `pwsh`, module manifests, and build.ps1 task runners. | Approved | Must |
| FR-003 | The profile's avoidance-boundary explicitly excludes Jenkinsfile/Sonar/SBOM pipeline design (DevOps Danny), requirements specification (Analyst Annie), and non-PowerShell application logic. | Approved | Must |
| FR-004 | A styleguide `powershell-conventions` exists at `pack/styleguides/powershell-conventions.styleguide.yaml` with at least: Verb-Noun cmdlet naming, `$variable`/`-Parameter` casing, PS 7+ default, module Public/Private layout principles, pipeline object-preservation pattern, Pester Describe/It pattern, and error-handling with `-ErrorAction Stop` in try/catch. | Approved | Must |
| FR-005 | Tactic `powershell-module-scaffold` exists with step-by-step instructions to create: module manifest (`.psd1`), root module (`.psm1`), `Public/` and `Private/` folders, `Tests/` folder, and `build.ps1` with ValidateSet tasks (Lint, Test, Build, Clean). | Approved | Must |
| FR-006 | Tactic `powershell-pester-workflow` exists with steps to: install/verify Pester, structure Describe/It blocks, run `Invoke-Pester` with Detailed output, and integrate Test task into `build.ps1`. | Approved | Must |
| FR-007 | Tactic `powershell-script-quality-gate` exists with steps to: run PSScriptAnalyzer on module paths, enable `Set-StrictMode -Version Latest` guidance, verify `#Requires -Version 7.0` on entry scripts, and checklist secret/credential anti-patterns before handoff. | Approved | Must |
| FR-008 | DRG fragment registers edges: `powershell-peter` → `applies` → `powershell-conventions`; `powershell-peter` → `applies` → each of the three tactics; `powershell-peter` → `requires` → `TEST_FIRST_BUG_FIXING`, `ENSURE_CONCEPTUAL_ALIGNMENT`, `TRACEABLE_DECISIONS`; collaboration edges to `devops-danny` documented in profile. | Approved | Must |
| FR-009 | `config/artifact-tags.yaml` tags the new profile, styleguide, and tactics to an appropriate domain (e.g. `tooling` or `development-practices`). | Approved | Must |
| FR-010 | Companion reference `docs/references/powershell-primer.md` exists with Regnology branding header, author attribution (Stijn Dejongh), and adapted content from the source primer; the styleguide description field references this doc for human-readable depth. | Approved | Must |
| FR-011 | `.cursor/agents/powershell-peter.md` is generated or authored so Cursor can route to Peter with initialization declaration consistent with Directive 007 intent. | Approved | Should |
| FR-012 | Peter's profile references `.kittify/memory/templates/POWERSHELL_SYNTAX.md` (or successor path) for spec-kitty CLI shell usage — distinct from language conventions. | Approved | Should |

---

## Non-Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| NFR-001 | `spec-kitty doctrine pack validate pack/` completes with **0 errors** after all artifacts are added. | Approved | Must |
| NFR-002 | A developer unfamiliar with the pack can identify Peter's scope, required tactics, and delegation boundaries by reading the agent profile alone in under **5 minutes**. | Approved | Must |
| NFR-003 | Styleguide principles are expressible as pass/fail checks (naming, layout, test structure) without requiring subjective judgement for at least **80%** of listed principles. | Approved | Should |
| NFR-004 | New artifacts follow existing pack YAML schema patterns established by `java-conventions` and `devops-danny` profiles (consistent field naming, no inline multi-step workflows in profile specialization beyond summary). | Approved | Must |

---

## Constraints

| ID | Description | Status | Priority |
|---|---|---|---|
| C-001 | **PowerShell AppSec baseline (tiered):** All Peter deliverables MUST pass PSScriptAnalyzer with the agreed ruleset, MUST NOT commit secrets or credentials, MUST NOT use `Invoke-Expression` on untrusted input, and MUST declare gallery module dependencies in the module manifest or documented lock. Full SonarQube/SBOM/Dependency-Track pipeline integration is required only when the engagement charter classifies the PowerShell artifact as deliverable application software — in that case Peter produces script/module artifacts and **DevOps Danny** integrates CI/AppSec gates. | Approved | Must |
| C-002 | Agent profile MUST satisfy org **alliteration** policy: `powershell-peter` / "PowerShell Peter". | Approved | Must |
| C-003 | Pack artifacts MUST NOT contain engagement-specific credentials, customer data, or organisational secrets. | Approved | Must |
| C-004 | Styleguide MUST NOT duplicate the full PowerShell Primer verbatim; distilled principles and patterns only, with companion doc for extended reference. | Approved | Must |
| C-005 | Multi-step workflows MUST live in tactics or procedures, not embedded as procedural runbooks inside the agent profile specialization block (per doctrine-daphne boundary). | Approved | Must |

---

## Success Criteria

1. An orchestrator can route "create a PowerShell module for X" to PowerShell Peter and
   receive a scaffold that passes `powershell-module-scaffold` and validates against
   `powershell-conventions` on first review.
2. Peter's DRG neighbourhood is visible in the doctrine dashboard: profile → styleguide
   → three tactics → required directives.
3. At least one reviewer confirms Peter's boundaries vs DevOps Danny are unambiguous
   using only the profile and spec (no oral briefing required).
4. Pack validation reports 0 errors; residual advisories, if any, are documented with
   justification in the mission work log.
5. Companion primer reference is reachable from the styleguide and preserves author
   attribution.

---

## Key Entities

| Entity | Description |
|---|---|
| PowerShell Peter | Pack agent profile — PowerShell language specialist implementer |
| powershell-conventions | Styleguide — enforceable coding and module conventions |
| powershell-module-scaffold | Tactic — bootstrap module layout and build.ps1 |
| powershell-pester-workflow | Tactic — Pester test authoring and execution |
| powershell-script-quality-gate | Tactic — lint, strict mode, security baseline before handoff |
| PowerShell Primer (source) | Draft reference document by Stijn Dejongh; distilled into pack artifacts |
| DevOps Danny | Delegation target for CI/CD and AppSec pipeline integration |

---

## Dependencies

- Existing pack patterns: `java-conventions.styleguide.yaml`, `python-conventions.styleguide.yaml`, `devops-danny.agent.yaml`
- `pack/drg/fragment.yaml` compilation workflow used by this repository
- `spec-kitty doctrine pack validate` CLI (3.2.x)
- Source primer content provided by mission requester

---

## Risks

| Risk | Mitigation |
|---|---|
| Overlap with DevOps Danny on build automation | Explicit avoidance-boundary and Scenario 4; C-001 tiered AppSec |
| Primer draft status | Attribution + companion doc marked as reference; styleguide is authoritative for enforcement |
| Token bloat if primer pasted into YAML | C-004 distill rule; Option B companion in docs/ |
| No SK built-in profile | Document as pack-native; follow-on mission can propose SK upstream |

---

## Open Items

None — discovery complete. Ready for `/spec-kitty.plan`.
