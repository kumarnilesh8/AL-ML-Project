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

# Audit — existing doctrine landscape for PS project intake

**Mission:** `ps-project-intake-tactic-01KWH0V6` · **Step:** audit · **Date:** 2026-07-02
**Basis:** post-spec adversarial squad (doctrine / architecture / anti-laziness / scope lenses) + direct pack inspection.

## What already exists (reuse, don't duplicate)

| Artifact | Path | Relevance |
|---|---|---|
| `regnology-jira-workflow` procedure | `pack/procedures/regnology-jira-workflow.procedure.yaml` | Already governs Jira wiki markup, In/Out scope, binary acceptance criteria, absolute URLs, semantic linking, transitions. **Reference via DRG `applies`; do not re-encode.** |
| `onboard-external-agent-to-pack` procedure | `pack/procedures/onboard-external-agent-to-pack.procedure.yaml` | Canonical **procedure-vs-tactic gate test** ("explicit start + definite done + distinct actors → procedure") and the overlap-audit rubric + DRG exit conditions. Precedent shape for our procedure. |
| `powershell-module-scaffold` tactic + `powershell-module-layout` template | `pack/tactics/`, `pack/templates/powershell/` | Precedent for the deferred repo-scaffold pairing (tactic + companion template), FR-009. |
| Procedure / tactic / paradigm schemas | `…/site-packages/doctrine/schemas/` | `tactic` schema has **no** `actor`/`entry_condition`/`exit_condition`; `procedure` schema has all three → confirms the intake flow must be a procedure. |
| DRG fragment + compiler | `pack/drg/fragment.yaml`, `tools/compile-drg.py` | The sole registration/discovery surface (no MANIFEST). New artifacts need nodes + edges + recompiled graph. |
| `regnology-mcp` toolguide (all-company) | inherited via `extends: regnology-all-company` | Covers Jira/Confluence/Bitbucket MCP tools; the new `regnology-mcp-jira` toolguide adds the Regnology field-schema specifics and `applies` to it / the base. |
| All-company directives 006/018/041/044 | `skills/pack/directives/` | Inherited via overlay; referenced by DRG edges, not present in this repo's `pack/directives/`. |

## Gaps this mission fills (to create)

1. `pack/procedures/ps-project-intake.procedure.yaml` — the gated, multi-actor intake sequence (FR-001).
2. `pack/tactics/ps-intake-interview.tactic.yaml` — composable profile-load → open-trace → structured-interview unit (FR-002).
3. `pack/toolguides/regnology-mcp-jira.toolguide.yaml` — Regnology Jira custom-field IDs + live-resolution pattern + no-fabrication rule (FR-003).
4. `pack/templates/ps-workflows/` (new domain + README) — intake-trace template with consent/decision/lookup-evidence fields (FR-004).

## Defects corrected in the revised spec

- Artifact kind tactic → **procedure** (schema + precedent evidence).
- Duplication of Jira conventions → reference `regnology-jira-workflow`.
- Field IDs as static lore → toolguide + **live** per-project resolution.
- Sequencing: open trace before interview; reconcile reality before Epic creation.
- AC#4 vibe → **blind-run** acceptance test; AC#3 → `make validate-layered` (overlay-authoritative gate).
- Branding header on template only (pack YAML exempt).

## Open risks carried into `design`

- **FR-008 (evidence trace):** the originating session trace `_local_work/…` is **absent on disk** — must be lifted to a versioned location before design/generate, or the derivation evidence dies with the author.
- **Profile wiring:** step-1 profile selection must be expressed as DRG `applies` edges, not hard-coded display names.
- **FR-009 scope:** confirm the Java/Angular/GCP scaffold artifact is deferred to a follow-up story (keep step 8 documented in-procedure only).
