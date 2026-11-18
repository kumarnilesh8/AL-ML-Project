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

# Design / Plan — PS project intake doctrine

**Mission:** `ps-project-intake-tactic-01KWH0V6` · **Step:** design · **Date:** 2026-07-02
**Inputs:** `spec.md`, `gap-analysis.md`, `research/audit-existing-doctrine.md`.
**Schema authority:** `…/doctrine/schemas/procedure.schema.yaml` (v1.0) · precedent
`pack/procedures/regnology-jira-workflow.procedure.yaml`.

## Artifacts to generate (4 + wiring)

### 1. `pack/procedures/ps-project-intake.procedure.yaml`  (P1 — FR-001)

Field-level design (procedure schema v1.0, `additionalProperties: false`):

- `schema_version: "1.0"`
- `id: ps-project-intake`
- `name: PS Project Intake`
- `purpose:` capture the repeatable intake of a new PS tooling project into central
  tooling — profile load, interview, live Jira resolution, reality reconciliation,
  Epic + first-story creation, verification — so any colleague can run it unaided.
- `entry_condition:` a new PS tooling project needs intake; the operator can reach
  Regnology Jira (via `regnology-mcp`) and knows (or will resolve) the target project key.
- `exit_condition:` an overview Epic + a thin first-story set (incl. one "(initial
  intake)" story) exist and are verified by JQL; every external write has recorded
  consent; the intake trace is complete; artifacts linked back to the seed ticket.
- `steps:` (each `{title, actor, description, on_success?, on_failure?}`) — corrected order:
  1. Load specialist profile — `actor: agent` — selection *criterion*, not hard-coded names.
  2. Open the intake trace from the template — `actor: agent` — before interviewing.
  3. Structured interview (9 dimensions, binary completion) — `actor: agent`.
  4. Resolve target Jira live via `regnology-mcp-jira` toolguide — `actor: agent` —
     `on_failure:` stop; never fabricate keys/usernames.
  5. Reconcile reality vs interview (inspect repo/POC; fix naming) — `actor: agent`.
  6. Draft Epic (wiki markup per `regnology-jira-workflow`) then **STOP** for consent →
     create — `actor: human` (consent) — `on_failure:` do not create.
  7. Slice rudimentary first Stories incl. "(initial intake)" — `actor: agent`.
  8. Optional repo scaffold; **STOP** for consent before push — `actor: human` (consent).
  9. Verify via JQL + link artifacts back to seed ticket — `actor: agent`.
- `references:` (type/id):
  - `procedure / regnology-jira-workflow` — reuse Jira conventions (FR-005)
  - `tactic / ps-intake-interview` (FR-002)
  - `toolguide / regnology-mcp-jira` (FR-003)
  - `template / ps-intake-trace` (FR-004)
  - `directive / CORPORATE_TOOLING` (044), `directive / TRACEABLE_DECISIONS` (018)
- `anti_patterns:` create-Epic-before-reconcile; fabricate project keys/usernames;
  open the trace after the interview; re-encode Jira conventions already governed.
- **Branding:** no ASCII header (pack YAML exempt, Directive 041).

### 2. `pack/tactics/ps-intake-interview.tactic.yaml`  (P2 — FR-002)

Tactic schema (no actor/entry/exit fields). Steps = the interview mechanics:
load-profile → open-trace → ask the 9 dimensions (identity/why, maturity, in/out
scope, DoD, work-item type, handoff, repository status, tech stack), each with a binary
completion rule. `references:` template `ps-intake-trace`. Referenced by the
procedure so future intake variants reuse it.

### 3. `pack/toolguides/regnology-mcp-jira.toolguide.yaml`  (P2 — FR-003)

Houses Regnology Jira instance knowledge: custom-field ID table (Epic Name
`customfield_10004`, Work Item Type `customfield_15108`, Epic Link
`customfield_10001`, AI fields), the **live** field-schema resolution query
pattern (resolve per target project, do not trust static IDs), mandatory
Epic/Story fields, and the "never fabricate project keys/usernames" rule.
`applies`/references the inherited all-company `regnology-mcp` toolguide.

### 4. `pack/templates/ps-workflows/ps-intake-trace.md` (+ domain `README.md`)  (P1 — FR-004)

New template domain `ps-workflows/`. YAML front-matter + sections:
- front-matter: `project`, `date`, `operator`, `status`, `blocked_if_unresolved`
- Interview answers (one block per dimension)
- Decisions log
- Consent log: per gate → `{action, consent_quote, timestamp}`
- Jira resolution evidence: `{project_key_source, field_schema_lookup, user_lookup}`
- Verification: JQL + results
- **Branding:** ASCII header present (templates carry it).

### 5. DRG wiring  (P2 — FR-007)

In `pack/drg/fragment.yaml`: add nodes for the procedure (`kind: procedures`),
tactic (`kind: tactics`), toolguide (`kind: toolguides`). The template is **not**
a DRG node — the OrgDRGFragment kind universe (C-009) admits only directives,
tactics, styleguides, toolguides, paradigms, procedures, agent_profiles, and
mission_* kinds; templates are linked via the `references:` blocks in the
procedure/tactic instead. Edges: `ps-project-intake --applies--> {regnology-jira-workflow,
regnology-mcp-jira, ps-intake-interview, CORPORATE_TOOLING, TRACEABLE_DECISIONS,
regnology-mcp, <selected profiles>}`. Then `make compile-drg` to regenerate the
compiled graph; tag artifacts in `config/artifact-tags.yaml`.

## Sequencing of generation (design → generate)

1. Toolguide `regnology-mcp-jira` (unblocks procedure step 4 references).
2. Template `ps-intake-trace` + domain README.
3. Tactic `ps-intake-interview` (references template).
4. Procedure `ps-project-intake` (references all of the above).
5. DRG fragment nodes/edges + `make compile-drg` + artifact-tags.
6. Lift session trace (FR-008) before/with generate.
7. Validate: `make validate-layered` → 0/0 (AC#3).

## Requirement → artifact traceability

| FR | Artifact(s) |
|----|-------------|
| FR-001 | procedure |
| FR-002 | tactic |
| FR-003 | toolguide |
| FR-004 | template (+ domain README) |
| FR-005 | procedure `references` → regnology-jira-workflow |
| FR-006 | procedure steps 4/6/8 (MUST/STOP + evidence) |
| FR-007 | DRG fragment + compiled graph + artifact-tags |
| FR-008 | lifted session trace |
| FR-009 | deferred follow-up (out of this mission) |

## Acceptance mapping

- AC#1 → procedure with entry/exit/actor (design §1).
- AC#2 → tactic/toolguide/template exist + referenced (design §2–4, §5 edges).
- AC#3 → `make validate-layered` 0/0 + recompiled DRG.
- AC#4 → blind-run test (executed at `validate`/`accept`).
- AC#5 → link-back at procedure step 9 / on merge.

## Open decisions carried to `generate`

- Confirm which specialist profiles the procedure wires by `applies` edge
  (Analyst Annie for requirements-led intakes; Doctrine Daphne for doctrine work).
- Confirm session-trace lift destination (pack vs `reports/logs/`).
