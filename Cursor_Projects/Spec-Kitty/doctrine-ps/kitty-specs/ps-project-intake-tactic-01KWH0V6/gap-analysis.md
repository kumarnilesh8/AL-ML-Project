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

# Gap Analysis — PS project intake doctrine

**Mission:** `ps-project-intake-tactic-01KWH0V6` · **Step:** audit → gap analysis · **Date:** 2026-07-02
**Basis:** post-spec adversarial squad + direct pack inspection. Companion detail: `research/audit-existing-doctrine.md`.

## Target audience

PS central-tooling colleagues who must intake a new tooling project without the
original author — plus the doctrine maintainer who validates the pack.

## Coverage assessment (what exists vs what is needed)

| Capability the intake flow needs | Covered today? | Source / Gap |
|---|---|---|
| Jira formatting conventions (wiki markup, In/Out scope, binary AC, absolute URLs) | ✅ Covered | `pack/procedures/regnology-jira-workflow.procedure.yaml` — **reuse via DRG `applies`** |
| Procedure-vs-tactic classification + DRG exit rules | ✅ Covered | `pack/procedures/onboard-external-agent-to-pack.procedure.yaml` (precedent shape) |
| Gated, multi-actor intake sequence (entry/exit/actors, consent gates) | ❌ **Gap** | Create `ps-project-intake.procedure.yaml` (FR-001) |
| Reusable profile-load → open-trace → structured-interview unit | ❌ **Gap** | Create `ps-intake-interview.tactic.yaml` (FR-002) |
| Regnology Jira custom-field schema + live per-project resolution | ❌ **Gap** | Create `regnology-mcp-jira.toolguide.yaml` (FR-003) |
| Intake-trace capture (answers, decisions, consent evidence, lookup evidence) | ❌ **Gap** | Create template under `pack/templates/ps-workflows/` (FR-004) |
| Repo-scaffold baseline (Java/Angular/GCP) | ⚠️ Deferred | Follow-up story (FR-009); keep step 8 documented in-procedure only |
| Registration/discovery surface | ✅ Exists | `pack/drg/fragment.yaml` + `tools/compile-drg.py` — must wire new nodes/edges (FR-007) |

## Prioritised gaps to close in `design`/`generate`

1. **P1 — `ps-project-intake.procedure.yaml`** (core deliverable; blocks everything else).
2. **P1 — intake-trace template** (referenced by the procedure; drives non-fakeable acceptance).
3. **P2 — `regnology-mcp-jira.toolguide.yaml`** (single home for field IDs; unblocks step 4).
4. **P2 — `ps-intake-interview.tactic.yaml`** (composable, referenced by procedure step 1–3).
5. **P2 — DRG wiring + recompiled graph** (FR-007; required for `make validate-layered`).
6. **P3 — lift session trace** (FR-008; evidence-durability gate before generate).

## Risks / blockers carried into `design`

- **Evidence trace absent on disk** (`_local_work/…`) — must be lifted/versioned (FR-008).
- **Profile references** must be DRG `applies` edges, not hard-coded names.
- **Validation gate** is `make validate-layered` (overlay-authoritative), not standalone pack validate.
