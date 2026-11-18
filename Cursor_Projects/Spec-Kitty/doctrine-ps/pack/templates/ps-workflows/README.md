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

# Templates: PS workflows

Reusable output scaffolds for repeatable PS central-tooling workflows.

| Template | Used by | Purpose |
|---|---|---|
| `ps-intake-trace.md` | `ps-project-intake` procedure | One trace per project intake: interview answers, reality reconciliation, live Jira resolution evidence, consent log, verification. Doubles as the auditable record that the intake was run correctly. |

## Conventions

- Copy the template into the engagement's working area (not into the pack) and
  fill it while running the associated procedure.
- The `blocked_if_unresolved` front-matter field is the completion gate: a trace
  with unresolved blocking items is not complete.
- Every external write (Jira create, repo push) requires a verbatim consent quote
  in the consent log — this is the Directive 044 (corporate tooling) external-write
  evidence trail.
