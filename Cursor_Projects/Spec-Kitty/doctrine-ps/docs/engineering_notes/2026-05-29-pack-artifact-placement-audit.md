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

# Engineering Note: Pack Artifact Placement Audit — 2026-05-29

_Version: 1.0.0_
_Date: 2026-05-29_
_Author: Stijn Dejongh / Claude Sonnet 4.6_
_Status: In progress — three items resolved this session; remainder open_

---

## Context

During a routine pack curation session on 2026-05-29, three artifacts were identified as
misplaced and removed from the distributed pack:

- `decision-reference-types` (procedure) — governance of decision references, only relevant
  to doctrine repo authors; moved to `docs/procedures/`.
- `reflection-post-action-learning-loop` (tactic) — duplicates spec-kitty's built-in
  reflection support; removed entirely.
- `requirements-validation-workflow` (tactic) — a multi-week, multi-role research workflow
  that is a custom mission type, not a tactic; moved to `not-yet-supported/mission-types/`.

This note records the rationale for those moves and documents remaining potential issues
found during a broader audit of the pack, for follow-up.

---

## 1. Resolved This Session

| Artifact | Former location | Action | Rationale |
|---|---|---|---|
| `decision-reference-types` | `pack/procedures/` | Moved to `docs/procedures/` | Internal doctrine-repo guidance; not meaningful to consuming engagement repos |
| `reflection-post-action-learning-loop` | `pack/tactics/` | Deleted | Spec-kitty has native built-in support for post-action reflection; pack override added no delta |
| `requirements-validation-workflow` | `pack/tactics/` | Moved to `not-yet-supported/mission-types/` | Is a full mission type (5-phase, multi-week, assigned roles); spec-kitty does not yet support pluggable custom mission types |

DRG nodes and edges, `config/artifact-tags.yaml` entries, and all cross-references in step
contracts and other artifacts were cleaned up for each removal.

---

## 2. Open Findings

### 2.1 `migrate-doctrine-to-pack` — Initially flagged; resolved via agent linkage

**Artifact:** `pack/procedures/migrate-doctrine-to-pack.procedure.yaml`
**Current kind:** procedure
**Severity:** ~~High~~ — **Resolved 2026-05-29**

Initially flagged as too repo-specific: the procedure describes migrating Markdown doctrine
originals from `doctrine/` into typed YAML pack artifacts, and references
`docs/pack-migration-plan.md` and internal batch-migration structure.

On review, the procedure is retained in the pack and linked to **Receptionist Rob**
(`receptionist-rob → migrate-doctrine-to-pack`, relation: `performs`), as Rob is the
designated agent for doctrine pack authoring and maintenance tasks. The DRG edge was added
in the 2026-05-29 curation session.

---

### 2.2 `appsec-pipeline-setup` — Wrong artifact kind

**Artifact:** ~~`pack/tactics/appsec-pipeline-setup.tactic.yaml`~~ → `pack/procedures/appsec-pipeline-setup.procedure.yaml`
**Current kind:** ~~tactic~~ → **procedure**
**Severity:** Medium — **Resolved 2026-05-29**

The content is a 10-step sequential setup workflow with explicit human actor steps
(e.g. "Contact appsec@regnology.net to request credentials"), template substitution
requiring multi-day external turnaround, and validation cycles spanning days. This matches
the `procedure` schema, not `tactic`.

Resolved by moving the file to `pack/procedures/`, updating the DRG node `kind` from
`tactics` to `procedures`, and relocating the node to the Procedures section in the DRG
fragment.

---

### 2.3 SQLX artifact cluster — Toolchain-scoped, scope undocumented

**Artifacts:** `sqlx-generation`, `sqlx-testing`, `sqlx-validation`, `sqlx-optimization`,
`sqlx-explanation`, `sqlx-pseudo-code-to-spec`, `sqlx-fu-pipeline`, `sqlx-coding-standards`,
`sqlx-test-data-conventions`, `sqlx-mcp`, `sqlx-specialist-simon`
**Current kind:** tactics / procedures / styleguides / toolguides / agent_profile
**Severity:** Low — intentional, but should be explicit

SQLX is Regnology's proprietary datamodel language usable across multiple products (not
ABACUS360-exclusive). The SQLX artifact cluster applies to any engagement using an
SQLX-based system. The Abacus CLI is required at runtime, but this is a toolchain dependency,
not a product-scope restriction.

No scope indicator currently exists on these artifacts, which is a minor documentation gap
rather than a structural problem. As the pack grows to serve engagements outside the SQLX
toolchain, the absence of scope metadata becomes a navigation hazard.

**Suggested action:** No immediate restructuring needed. Consider adding a `scope` metadata
field (or DRG `scope` edges) once spec-kitty supports scoped artifact activation. Until then,
a note in `org-charter.yaml` documenting the SQLX toolchain assumption is sufficient.

---

### 2.4 `juno-based-regulatory-research` — Scope undocumented; Juno dependency untracked

**Artifact:** `pack/tactics/juno-based-regulatory-research.tactic.yaml`
**Current kind:** tactic
**Severity:** Low — **Resolved 2026-05-29**

The tactic applies specifically to German/European banking regulatory engagements
(Bundesbank Meldewesen, EBA/ECB supervisory reporting) and requires the Juno MCP server.
Neither constraint was declared in the artifact or the DRG.

Resolved by:
1. Adding an explicit `Scope:` block to the `purpose` field, naming the regulatory context
   and the Juno MCP prerequisite.
2. Adding a DRG edge: `juno-based-regulatory-research → juno-mcp` (`relation: requires`)
   so the tool dependency is machine-readable.

---

## 3. Not Actioned (False Positives)

The audit surfaced several other candidates that were ruled out on closer inspection:

| Candidate | Reason ruled out |
|---|---|
| `repository-initialization` tactic — references `pack/templates/` | Intentional: templates are distributed with the pack and consumed by engagement repos; the references are correct by design |
| Agent profile alliteration on `slidedeck-stanislav`, `synthesizer-sam`, `sqlx-specialist-simon` | All three pass: the rule compares the role-domain slug to the persona name (S+S, S+S, S+S+S), not the spec-kitty canonical role type |
| `mission_step_contracts` — `enhances` field unsupported | spec-kitty rc27 (2026-05-26 upgrade) added native `enhances` field support; these are valid pack extensions |
| `maven-project-compliance-setup` — Java-only scope | Mitigated by `applies_to_languages: java` field in the artifact; scope is declared, not hidden |

---

## 4. Summary

| Finding | Artifact | Severity | Status |
|---|---|---|---|
| Repo-internal procedure in distributed pack | `decision-reference-types` | High | Resolved 2026-05-29 |
| Duplicate of SK built-in | `reflection-post-action-learning-loop` | High | Resolved 2026-05-29 |
| Custom mission type filed as tactic | `requirements-validation-workflow` | High | Resolved 2026-05-29 |
| Repo-internal procedure in distributed pack | `migrate-doctrine-to-pack` | High | Resolved 2026-05-29 — linked to Receptionist Rob |
| Wrong artifact kind (tactic vs procedure) | `appsec-pipeline-setup` | Medium | Resolved 2026-05-29 — moved to procedures, DRG updated |
| Undocumented toolchain scope | SQLX artifact cluster (11 artifacts) | Low | **Open** — tracked; no immediate action |
| Undocumented regulatory scope + missing tool dependency | `juno-based-regulatory-research` | Low | Resolved 2026-05-29 — scope added to purpose, DRG `requires` edge added |
