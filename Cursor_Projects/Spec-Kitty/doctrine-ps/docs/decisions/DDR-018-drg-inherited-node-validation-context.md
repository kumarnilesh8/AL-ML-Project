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

# DDR-018: DRG Validation Context for Inherited Upstream Nodes

**Status:** Accepted
**Date:** 2026-06-30
**Author:** PS doctrine maintainers (recorded by Cursor agent during mission `doctrine-pack-remediation-georgia-templates-01KWCBN5`)
**Related:** DDR-016 (Repository Scope Reduction), mission spec FR-005 / SC-002 / SC-005

---

## Context

During implementation of the doctrine-pack-remediation mission (WP02, DRG compiler fix),
running `spec-kitty doctrine pack validate pack/` on the **source repository in isolation**
reported **150 `drg_dangling_edge` errors** against **38 unique target URNs**.

Investigation established two facts that contradict the mission's original premise:

1. **All 38 dangling URNs are inherited `regnology-all-company` artefacts**, not local. They
   include directives (`TRACEABLE_DECISIONS`, `APPSEC_COMPLIANCE`, `MODEL_DISCIPLINE`, …),
   paradigms (`regnology-main-context`, `token-efficiency`, `evidence-based-requirements`, …),
   styleguides, tactics, toolguides, and procedures that do **not** exist as files under `pack/`.
   The pack declares `extends: regnology-all-company` in `org-charter.yaml`, and
   `fragment.yaml`'s header explicitly states these targets "resolve via the parent layer."

2. **FR-005's claim that ≥8 of these targets are "confirmed LOCAL" was factually incorrect.**
   The kind-prefix defect that FR-005/WP02 fixes is real (the compiler previously defaulted
   unresolved targets to `directive:`), and the fix is correct — but **correcting a target's
   kind prefix does not make an inherited upstream node resolvable.** Danglingness is orthogonal
   to kind correctness.

3. On the development machine, `spec-kitty doctrine fetch --pack regnology-all-company` returns
   **0 artifacts** (version `b35b475` — an unpopulated stub). The upstream registry that
   populates the inherited artefact set is not reachable with content from this environment.

Consequently, **standalone `pack validate` cannot reach 0 errors in this repository** regardless
of any local change, because 38 of its DRG edges intentionally target nodes that live in the
parent layer.

## Decision

### Decision 1 — Validation authority is the populated (extends-resolved) context

`spec-kitty doctrine pack validate pack/` is authoritative for **0 errors** only in a context
where the `extends: regnology-all-company` chain is resolved to real artefacts (i.e. a
consumer/CI environment where the upstream pack is fetched with content). In that context the
38 inherited URNs resolve and the pack validates clean.

In a **standalone dev checkout without a populated upstream**, the **only** acceptable residual
errors are `drg_dangling_edge` entries whose target URN is one of the 38 documented inherited
`regnology-all-company` nodes. Any other error class, any **local** dangling target, any kind
mis-prefix, and any self/duplicate edge remain hard failures.

### Decision 2 — WP02 compiler fix is accepted on its merits

The WP02 change to `tools/compile-drg.py` (derive each edge target's kind from local
pack/MANIFEST/`external_nodes` instead of defaulting to `directive:`) is correct, deterministic
(re-run yields no diff), and is **approved**. The residual dangling errors are not a WP02 defect.

### Decision 3 — Inherited nodes are NOT hand-declared as `external_nodes`

We deliberately do **not** enumerate the 38 inherited URNs in `fragment.yaml` `external_nodes`.
Doing so would (a) duplicate the upstream artefact catalogue into this layer, (b) drift as the
upstream pack evolves, and (c) mask genuinely-new dangling edges behind a large allow-list. The
`extends:` chain is the single source of inheritance; `external_nodes` is reserved for the
narrow set of built-in profiles being onboarded on this branch (`doctrine-daphne`,
`planner-priti`).

## Consequences

- **SC-005** is redefined: "0 errors in a populated/CI context; in standalone dev, 0 errors
  other than the 38 documented inherited-upstream dangling URNs."
- **SC-002** is redefined: "0 **local** dangling references, 0 kind mis-prefixes, 0 self/duplicate
  edges; inherited `regnology-all-company` URNs are expected-external and not treated as defects."
- **WP07** (validation gate) acceptance is adjusted to the redefined SC-002/SC-005: it asserts
  0 local danglers / 0 kind defects / 0 self-dup edges / deterministic graph / clean MANIFEST,
  and that every residual dangling URN is in the known inherited set.
- **Follow-up (out of mission):** CI should run `pack validate` after a populated upstream fetch
  to assert the absolute 0-error gate. If the upstream registry is expected to be reachable from
  developer machines, that connectivity is a separate infrastructure task.

## Addendum (2026-06-30) — WP07 terminal-gate findings

Two clarifications surfaced while closing the terminal validation gate (WP07). Neither changes the
core decision; both refine how SC-002 is read in this environment.

### A — Sanctioned `overrides` self-edge is NOT a "self-referencing edge" defect

Clearing the `same_id_collision` advisory on `procedure:onboard-external-agent-to-pack` (a local
procedure that fully replaces an upstream built-in of the same id) requires declaring the override
relationship. Because the inline `overrides:` field was retired (FR-028), the relationship is
encoded as a DRG edge `source: procedure:onboard-external-agent-to-pack → target:
procedure:onboard-external-agent-to-pack, relation: overrides`. This is a **same-URN edge by
design** and is the sanctioned encoding `pack validate` expects (it emits **0 advisories** once
present). SC-002's "0 self/duplicate edges" refers to **accidental/defective** self-loops (the kind
WP01 removed), **not** to an intentional `overrides`/`enhances` same-id relation. The two are
distinct; the sanctioned override self-edge is compliant.

### B — Compiled-graph freshness cannot be recompile-verified in a standalone checkout

`tools/compile-drg.py` derives edge-target kinds from resolvable artefacts; for the 38 inherited
upstream URNs (unresolvable without a populated fetch) it falls back to `directive:`. Therefore a
naive "recompile + diff == empty" freshness check **fails in standalone dev** — a direct corollary
of the same upstream-not-populated condition that drives SC-005. Hand-patching the compiled graph
for a minimal, kind-correct edge (as done for the `overrides` edge above) is **acceptable** when it
is (a) minimal, (b) the kind prefix is verified against the local `fragment.yaml`, and (c) the
rationale is recorded in the commit message. Authoritative freshness verification belongs in the
populated/CI context (same place SC-005's absolute 0-error gate runs).

### C — SC-008 / FR-009 "paradigm `body:` field" is superseded (schema is authoritative)

SC-008 and FR-009 (as originally written) require "every on-disk paradigm has both `summary:` and
`body:` fields". This is **unsatisfiable** against the authoritative `Paradigm` model
(`doctrine.paradigms.models.Paradigm`), which is `extra="forbid"` and permits ONLY
`schema_version, id, name, summary, directive_refs, references, opposed_by` — there is **no `body`
field**. WP06's canonicalization added a `body:` key in good faith to satisfy SC-008, but that made
all 7 local paradigms fail `schema_invalid`, directly contradicting **SC-005** (validation must
pass). The two criteria are mutually exclusive under the installed validator.

**Decision (same pattern as this DDR):** validation is authoritative (research R4). The `body:`
clause of SC-008/FR-009 is **superseded**: paradigm long-form prose lives in `summary` (a single
block scalar), and the forbidden `body:` key is removed. WP07 folded the body prose into `summary`
for all 7 paradigms with zero content loss; `pack validate` now reports **0 `schema_invalid`**.

**Amended SC-008:** "every on-disk paradigm validates against the authoritative `Paradigm` schema
(only permitted keys; prose in `summary`); `context-sources` shape is uniform across
paradigms/profiles; `scribe-sally.agent.yaml` `context-sources` includes a `toolguides` section;
the schema template documents the per-kind canonical field conventions." The non-breaking
context-sources / scribe-sally / template-documentation parts of FR-009 (WP06) are unaffected.

## Update — 2026-07-06: root cause of the "unreachable upstream" finding was a config bug, now fixed

This DDR's Context §3 stated the upstream registry was "not reachable with content from this
environment" and Decision 1 treated the populated/CI-only 0-error gate as effectively
unreachable from standalone dev. An investigation squad (Architect Alphonso + Doctrine Daphne
lenses, dispatched during MIGRATION-2505 follow-up) found the actual cause: `.kittify/config.yaml`
was pointing `regnology-all-company` at `ssh://.../rfg/skills.git`, a repository whose
`org-charter.yaml` is byte-identical to the intended one but which has **no `pack/agent_profiles/`
directory at all** — it was never populated. The actively-maintained All-Company pack
(comms-cleo, juno-mcp, the June-19 "slim PS pack" promotion, etc. all live there) is
`ssh://.../raf/doctrine-org.git`. This was not a spec-kitty limitation or an unreachable-registry
problem — it was this repo's config pointing at the wrong Bitbucket repo.

Confirmed 2026-07-06 (repo owner): `rfg/skills` is a **precursor/predecessor** of
`raf/doctrine-org`, not a competing or ambiguous canonical candidate — the same
project-key rename/move pattern (`RFG`/`CONS` → `RAF`) seen elsewhere in this migration,
including this repo's own `CONS/doctrine-ps` → `RAF/doctrine-ps` move. No governance
conflict to escalate; `rfg/skills` is simply deprecated.

`.kittify/config.yaml` has been repointed to `raf/doctrine-org.git` (2026-07-06). Re-running
`spec-kitty doctrine fetch --pack regnology-all-company` now returns **62 artifacts** (previously
0), and `make validate-layered BASE_PACK_DIR=.doctrine-cache/doctrine-org/pack` now reports
**0 errors, 0 advisories** on this same standalone dev machine — the populated/CI-only context
Decision 1 described as the only place 0 errors was achievable is now reachable here too.
Standalone `pack validate pack/` (no base pack) is unaffected by this fix and still reports the
by-design cross-layer dangling count (see DDR-019's 2026-07-06 update for the current figure) —
Decision 1–3 and the SC-002/SC-005 redefinitions remain correct and in force for that mode.
