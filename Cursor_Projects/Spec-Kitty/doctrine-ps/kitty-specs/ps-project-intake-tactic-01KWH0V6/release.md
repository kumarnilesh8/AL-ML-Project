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

# Release Note — PS project intake doctrine

**Mission:** `ps-project-intake-tactic-01KWH0V6`
**Seed ticket:** [MIGRATION-2837](https://jira.regnology.net/browse/MIGRATION-2837)
**Programme:** Regnology PS – Agent Stack (parent MIGRATION-1952)
**Pack:** `ps-agent-enabled-factory` (PS layer, extends `regnology-all-company`)
**Date:** 2026-07-02
**Delivery:** feature branch → **pull request to `main`** (no direct merge)

## What's new

A reusable, durable doctrine set for **intaking a new PS tooling project** into the
central tooling team, so any colleague can run the flow without the original author.

| Kind | ID / path | Summary |
|---|---|---|
| Procedure | `pack/procedures/ps-project-intake.procedure.yaml` | Gated, multi-actor intake flow: profile load → interview → live Jira resolution → reality reconciliation → consented Epic + thin first stories → verify + link back. |
| Tactic | `pack/tactics/ps-intake-interview.tactic.yaml` | The 9-dimension intake interview with a binary completion check. |
| Toolguide | `pack/toolguides/regnology-mcp-jira.{toolguide.yaml,md}` | Live Jira project/field-schema/user resolution via `regnology-mcp`; fabricate nothing. |
| Template | `pack/templates/ps-workflows/ps-intake-trace.md` (+ README) | Per-intake auditable trace: answers, resolution evidence, consent log, verification. |
| Docs | `docs/workflows/ps-project-intake.md` | Human-facing runbook for operators. |
| Wiring | `pack/drg/fragment.yaml`, recompiled graph, `config/artifact-tags.yaml` | DRG nodes + edges; artifact tags. |

## Design decisions

- **Procedure, not tactic.** Post-spec adversarial review established the deliverable
  is a gated multi-actor *procedure*; the interview mechanics are the composable tactic.
- **Reuse over restatement.** Jira conventions stay in `regnology-jira-workflow`;
  the procedure references them (DRG `applies`) rather than duplicating.
- **Resolve live, fabricate nothing.** The toolguide teaches runtime resolution of
  Jira IDs/users — no hard-coded custom-field IDs.
- **Consent-gated writes.** Epic creation and any repo push are `actor: human` STOP
  points with a verbatim consent quote recorded in the trace.

## Quality gate

- `make validate-layered BASE_PACK_DIR=../skills/pack` → **0 errors, 0 advisories**
  (118 assembled artifacts across both layers).
- DRG recompiled: 61 nodes, 256 edges; no stale-graph warning.
- Full FR/AC coverage in `audit-report.md`.

## Known caveats / follow-ups

1. **AC#4 (independent blind run)** verified by inspection + dry read-through only;
   recommend a real blind run by a PS colleague before closing MIGRATION-2837.
2. **FR-008 (session-trace lift)** to `reports/logs/` on `main` is outstanding.
3. **Final Jira link-back** to MIGRATION-2837 is an external write pending explicit consent.
4. **Mission slug** retains `-tactic-` for branch stability; deliverable kind is a procedure.

## How to deliver

1. Push the coordination branch (or a renamed feature branch) to the remote.
2. Open a **pull request into `main`** for doctrine review (Doctrine Daphne lens).
3. On approval + merge, post the link-back comment to MIGRATION-2837 (with consent).
