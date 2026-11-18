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

# How to intake a new PS tooling project

**Audience:** PS central-tooling colleagues who need to bring a new tooling
project into the team — without the original author present.
**Seed:** [MIGRATION-2837](https://jira.regnology.net/browse/MIGRATION-2837)

This is the human-facing runbook. The authoritative, machine-readable doctrine is
the **`ps-project-intake` procedure** in the pack; this page tells you how to run
it and where each piece lives.

## What "intake" means here

Turning a raw request ("we should build a tool for X") into a tracked, minimally
scoped piece of work: an overview **Epic** plus a thin **first-story set** in the
correct Jira project, backed by an auditable record of what was decided and who
consented to the writes.

It deliberately stops at a *thin* first slice. Deep decomposition is a separate,
later activity — not part of intake.

## The doctrine artifacts you'll use

| Artifact | Path | Role |
|---|---|---|
| `ps-project-intake` **procedure** | `pack/procedures/ps-project-intake.procedure.yaml` | The gated, multi-actor flow. Start here. |
| `ps-intake-interview` **tactic** | `pack/tactics/ps-intake-interview.tactic.yaml` | The 9-dimension interview mechanics the procedure runs. |
| `regnology-mcp-jira` **toolguide** | `pack/toolguides/regnology-mcp-jira.toolguide.yaml` (+ `.md`) | How to resolve Jira project/field schema/users **live** and create the issues. |
| `ps-intake-trace` **template** | `pack/templates/ps-workflows/ps-intake-trace.md` | The per-intake record: answers, resolution evidence, consent, verification. |
| `regnology-jira-workflow` **procedure** | `pack/procedures/regnology-jira-workflow.procedure.yaml` | Owns all Jira conventions. The intake procedure *reuses* it. |

## Running it — the short version

1. **Load a fitting profile.** Requirements-led intake → Analyst Annie; doctrine
   work → Doctrine Daphne. Record the choice.
2. **Open the trace** from `ps-intake-trace.md` *before* interviewing.
3. **Interview** across all nine dimensions (identity/why, maturity, in scope,
   out of scope, binary done, work-item type, handoff, repository status, tech
   stack). Record "unknown" answers; flag blockers.
4. **Resolve Jira live** with the `regnology-mcp-jira` toolguide — project key,
   field IDs, assignees. **Never fabricate** a key, field ID, or username; if you
   can't resolve it, stop and ask.
5. **Reconcile with reality** — inspect the repo/POC, fix naming and scope *before*
   creating anything.
6. **Draft the Epic**, then **STOP for consent**. Only create after a human says so
   (record the exact words in the trace).
7. **Slice thin first stories**, including one "(initial intake)" story, linked to
   the Epic.
8. **(Optional) scaffold a repo** — and **STOP for consent** before any push.
9. **Verify** with JQL, link back to the seed ticket, and confirm the trace has no
   unresolved blockers.

## The rules that matter most

- **Resolve live, fabricate nothing.** Jira IDs are per-project and change.
- **Every external write needs recorded consent.** No verbatim consent quote in the
  trace → the write didn't happen (Directive 044).
- **Reconcile before you create.** Interview answers drift from reality.
- **Reuse Jira conventions, don't restate them.** Ticket content follows
  `regnology-jira-workflow`.

## When you're done

The intake is complete when the Epic and first stories exist and resolve under a
JQL check, all writes are consented in the trace, artifacts link back to the seed,
and nothing remains in the trace's `blocked_if_unresolved`.
