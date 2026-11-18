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

# Specification: PS project intake — reusable intake doctrine

**Mission:** `ps-project-intake-tactic-01KWH0V6`
**Type:** documentation
**Status:** Draft (specify) — revised after post-spec adversarial squad review
**Created:** 2026-07-02
**Seed ticket:** [MIGRATION-2837](https://jira.regnology.net/browse/MIGRATION-2837) (debrief seed)
**Programme:** Regnology PS – Agent Stack (parent MIGRATION-1952)

> **Note on the mission slug.** The slug contains "tactic" for historical reasons.
> The post-spec review (see *Design Review* below) established that the correct
> canonical artifact kind is a **procedure**, not a tactic. The deliverable is
> `ps-project-intake.procedure.yaml`. The slug is not renamed to avoid churning
> the mission's coordination branch; treat the deliverable kind as authoritative.

## Summary

Capture the repeatable process for intaking a new tooling project into the PS
central tooling team as durable doctrine, so any colleague can run the same flow
without the original author's involvement. The mission authors a reusable
**`ps-project-intake` procedure** (a gated, multi-actor operational procedure) in
the PS doctrine pack, a small composable **`ps-intake-interview` tactic** it
orchestrates, a **`regnology-mcp-jira` toolguide** that owns the Regnology Jira
field schema, and an **intake-trace template** the procedure references. Jira
convention knowledge is *reused* from the existing `regnology-jira-workflow`
procedure rather than restated.

## Background & Motivation

The intake flow was derived live on 2026-07-02 from a real engagement — the
Engagement & Contract Assistant intake (epic MIGRATION-2831; stories
MIGRATION-2832..MIGRATION-2836). That session produced a working sequence
(profile load → structured interview → running trace → Jira resolution → reality
reconciliation → epic draft/create → first-story slicing → optional scaffold →
verification) that currently lives only in a local, unversioned session trace.
Without a pack artifact, the knowledge is not discoverable, not schema-validated,
and not reusable across the team. This mission lifts that tacit process into
governed doctrine.

## Design Review (post-spec adversarial squad, 2026-07-02)

A bounded 4-lens squad (doctrine integrity, architecture, anti-laziness,
scope/sequencing) reviewed the first draft. Convergent conclusions now folded in:

- **Kind:** `procedure`, not `tactic`. The flow has an explicit entry condition,
  a definite exit condition, and distinct human/agent actors (consent gates).
  The `tactic` schema has no `actor`/`entry_condition`/`exit_condition` fields and
  structurally cannot express the consent semantics. Precedent:
  `pack/procedures/onboard-external-agent-to-pack.procedure.yaml` gate test and
  `pack/procedures/regnology-jira-workflow.procedure.yaml`.
- **Reuse over duplication:** Jira formatting conventions (wiki markup, In/Out
  scope, binary acceptance criteria, absolute URLs) are already governed by
  `regnology-jira-workflow.procedure.yaml`; reference it via a DRG `applies` edge
  instead of re-encoding.
- **Tool knowledge belongs in a toolguide:** Regnology-specific Jira custom-field
  IDs are instance configuration, not process — house them in a new
  `regnology-mcp-jira.toolguide.yaml`, and resolve the schema *live* per target
  project rather than trusting static IDs.
- **Non-fakeable acceptance:** the "colleague can follow it without the author"
  criterion becomes a concrete blind-run test.
- **Sequencing fix:** reconcile reality *before* creating the Epic; open the
  intake trace *before* the interview.
- **Registration surface:** the real surface is `pack/drg/fragment.yaml` compiled
  via `tools/compile-drg.py`; there is no MANIFEST.
- **Validation gate:** this is an overlay pack (`extends: regnology-all-company`),
  so standalone `spec-kitty doctrine pack validate pack/` is *not* authoritative
  (dangling cross-layer edges are expected). The authoritative gate is
  `make validate-layered`.
- **Branding:** Directive 041 exempts pack governance YAML from the ASCII header;
  the header goes on the **template** only, not the procedure/tactic/toolguide.

## User Scenarios & Testing

- **New tooling colleague** opens `ps-project-intake.procedure.yaml` and executes
  the intake for a fresh project end-to-end — loading the right specialist
  profile, running the interview, resolving the Jira schema live, reconciling
  reality, creating the overview Epic and first stories — **without** needing the
  original author.
- **Doctrine maintainer** runs `make validate-layered` and gets 0 errors /
  0 advisories; the new procedure, tactic, toolguide, and template are all
  registered in the DRG and traverse cleanly.
- **Intake operator** opens the intake trace *at the start* and records every
  interview answer, decision, consent quote/timestamp, and Jira-schema lookup as
  the flow proceeds (Directive 018).
- **Reviewer** confirms every external write (Jira create, PR) and `git push` is a
  `MUST`/`STOP` step with recorded consent evidence, and that no fabricated
  project keys or usernames can pass (Directive 044).

## The intake flow (corrected sequence)

1. **Load specialist profile** matching the primary work type (requirements→backlog
   selects requirements-analysis capability, e.g. Analyst Annie; doctrine work
   selects doctrine-curation, e.g. Doctrine Daphne). Reference profiles via DRG
   `applies` edges, not hard-coded display names.
2. **Open the running intake trace** from the template — *before* interviewing —
   so answers and decisions are captured as they are given.
3. **Structured interview** using the multiple-choice question tool across the
   fixed dimensions: identity/why, maturity, in/out scope, DoD, work-item type,
   handoff, repo, tech stack. Each dimension has a defined question and a binary
   completion rule; write directly into the trace.
4. **Resolve target Jira live** — confirm project key and resolve the issue-type
   field schema for *that* project via the `regnology-mcp-jira` toolguide (Epic
   Name, Work Item Type, Epic Link, AI fields). Never fabricate project keys or
   usernames; record the lookup evidence.
5. **Reconcile reality vs interview** — inspect any existing repo/POC; correct
   assumptions (e.g. "greenfield" vs an existing POC); align naming to avoid drift.
6. **Draft the overview Epic** in Jira wiki markup (Context/Goal, In/Out scope,
   Target architecture, DoD, Handoff) per `regnology-jira-workflow`. **STOP:**
   obtain explicit user consent (record the quote + timestamp), then create it.
7. **Slice rudimentary first Stories** — include an **"(initial intake)"** story;
   set Epic Link + assignee; keep thin for the assigned developer to flesh out.
8. **Optional repo scaffold** — target-stack skeleton on a feature branch
   (backend/frontend/iac + `HANDOVER.md`). **STOP:** commit; push only *with
   explicit recorded consent*.
9. **Verify** — JQL `"Epic Link" = <epic>`; confirm assignees; record results in
   the trace. On completion, link the produced artifacts back onto the seed ticket.

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | Author `pack/procedures/ps-project-intake.procedure.yaml` (kind: **procedure**) with top-level `entry_condition`, `exit_condition`, and `steps[].actor` (human/agent/system), encoding the corrected 9-step sequence and conforming to the procedure schema + Directive 006 version-governance fields. | Proposed |
| FR-002 | Author `pack/tactics/ps-intake-interview.tactic.yaml` — a composable tactic covering profile load → open trace → structured interview (steps 1–3), referenced by the procedure so future intake variants can reuse it. | Proposed |
| FR-003 | Author `pack/toolguides/regnology-mcp-jira.toolguide.yaml` housing the Regnology Jira custom-field ID table (Epic Name, Work Item Type, Epic Link, AI fields), the live field-schema resolution query pattern, mandatory Epic/Story fields, and the "never fabricate project keys/usernames" rule. The procedure `applies` this toolguide. | Proposed |
| FR-004 | Author an intake-trace **template** under `pack/templates/ps-workflows/` (new domain + `README.md`) with YAML front-matter and dedicated fields for: interview answers, decisions, consent quote/timestamp/action per gate, Jira project + field-schema lookup evidence, and a "blocked if unresolved" flag. Include the Directive 041 branding header (templates only). | Proposed |
| FR-005 | *Reuse, don't restate:* the procedure references `pack/procedures/regnology-jira-workflow.procedure.yaml` (wiki markup, In/Out scope, binary acceptance criteria, absolute URLs) via a DRG `applies` edge instead of re-encoding those conventions. | Proposed |
| FR-006 | Encode the governance gates as enforceable `MUST`/`STOP` steps with evidence capture: explicit consent before Jira create (step 6), before PR, and before `git push` (step 8); live Jira-schema resolution (step 4); no fabricated keys/usernames. Reference Directive 044 and Directive 018. | Proposed |
| FR-007 | Wire all new artifacts into `pack/drg/fragment.yaml` (procedure/tactic/toolguide nodes with correct `kind`; `applies` edges to `regnology-jira-workflow`, `CORPORATE_TOOLING`, `TRACEABLE_DECISIONS`, `regnology-mcp`, the selected profiles). The template is linked via `references:` rather than a DRG node — the OrgDRGFragment kind universe (C-009) does not admit a `template` kind. Regenerate the compiled graph via `tools/compile-drg.py` (`make compile-drg`). Tag artifacts in `config/artifact-tags.yaml`. | Proposed |
| FR-008 | Lift the originating session trace (`_local_work/…/2026-07-02-central-tooling-intake.md`) into a versioned location (pack or `reports/logs/`) as the evidence base, since it does not currently exist on disk. This is a gate before `design`. | Proposed |
| FR-009 | *(Deferred candidate)* The Java/Angular/GCP repo-scaffold baseline is a separate deliverable domain. Keep step 8 documented inside the procedure, but split any standalone scaffold artifact (template + companion tactic, per the `powershell-module-scaffold` precedent) into a follow-up story under MIGRATION-1952 rather than this mission. | Proposed |

## Non-Goals / Out of Scope

- Building any intake tooling or automation (this is documentation/doctrine only).
- Modifying Jira projects or creating live tickets as part of this mission.
- Retrofitting completed intakes; the procedure governs future intakes.
- Re-encoding Jira formatting conventions already owned by `regnology-jira-workflow`.
- Authoring a standalone tech-stack repo-scaffold artifact (deferred — FR-009).

## Acceptance Criteria

1. `pack/procedures/ps-project-intake.procedure.yaml` exists with valid
   `entry_condition`, `exit_condition`, and per-step `actor`, following the
   procedure schema.
2. The `ps-intake-interview` tactic, `regnology-mcp-jira` toolguide, and the
   intake-trace template exist and are referenced by the procedure — the tactic
   and toolguide via DRG `applies` edges, the template via the `references:`
   block (templates are not DRG nodes).
3. `make validate-layered` passes with **0 errors / 0 advisories** (standalone
   `spec-kitty doctrine pack validate pack/` is non-authoritative for this overlay
   pack and is not the gate); the compiled DRG regenerated and traverses cleanly.
4. **Blind-run test:** a colleague who did **not** author the artifacts, given only
   the procedure + template + a synthetic intake brief and *no contact with the
   author*, produces a completed intake trace, draft Epic text, a first-story set
   incl. an "(initial intake)" story, a consent log, and the verification JQL —
   with all mandatory fields populated, all consent gates recorded, and no
   fabricated Jira/project/user values. The review passes only if every output
   maps back to a procedure step.
5. On completion, MIGRATION-2837 is updated with links to the authored artifacts.

## Governance & Constraints

- **Directive 041 (Regnology branding):** ASCII header on the **template** only;
  pack governance YAML (procedure/tactic/toolguide) is exempt.
- **Directive 044 (corporate tooling):** Jira/Confluence conventions via
  `regnology-jira-workflow`; live field-schema resolution; no fabricated
  keys/usernames.
- **Directive 018 (traceable decisions):** the intake trace is the decision record,
  opened before the interview.
- **Directive 006 (version governance):** version-governance fields on all new
  pack artifacts.
- **Consent gates:** external writes and `git push` are `MUST`/`STOP` steps with
  recorded consent evidence.

## Traceability

- **Seed ticket** — [MIGRATION-2837](https://jira.regnology.net/browse/MIGRATION-2837)
- **Worked example (evidence, not re-executed)** — epic [MIGRATION-2831](https://jira.regnology.net/browse/MIGRATION-2831) + stories MIGRATION-2832 .. MIGRATION-2836
- **Session trace** — `_local_work/sow-workflow-automation/intake/2026-07-02-central-tooling-intake.md` (local; must be lifted per FR-008)
- **Design review** — post-spec adversarial squad, 2026-07-02 (doctrine / architecture / anti-laziness / scope lenses)
- **Target repo** — regnology-agent-doctrine
