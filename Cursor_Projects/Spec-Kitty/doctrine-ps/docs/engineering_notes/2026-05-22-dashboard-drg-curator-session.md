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

# Engineering Note: Dashboard Fixes and Curator Pass — 2026-05-22

_Version: 1.0.0_
_Date: 2026-05-22_
_Author: Stijn Dejongh / Claude Sonnet 4.6 (Curator Claire profile)_
_Status: Applied — all changes committed and pushed_

---

## Context

This note documents the changes made during the 2026-05-22 afternoon session. The session
covered three distinct areas:

1. **Dashboard defect fixes** — two UI regressions reported by the user.
2. **Curator Claire audit** — a full structural pass over all pack artifacts, checking
   cross-linking, domain tags, SK built-in overlap, and stale references.
3. **DRG enrichment** — ~80 new edges added to `pack/drg/fragment.yaml` to reflect
   relationships discovered during the curatorial audit.

---

## 1. Dashboard: YAML Editor Removal

### Problem

The collapsible YAML editor section in the artifact detail view was broken. The editor
was rendering inconsistently and had accumulated dead state after earlier partial refactors.
The user explicitly requested it be removed rather than fixed.

### Decision

Remove the YAML editor in its entirety. The dashboard's value proposition is the
**structured view** (semantic field rendering with chip-based cross-links) and the
**review panel**. Raw YAML editing belongs in the IDE, not in a governance dashboard.

### Changes

- `tools/pack-dashboard/src/app/pages/artifact-detail/artifact-detail.component.ts`:
  - Removed the collapsible YAML editor template block (was ~30 template lines).
  - Removed the `YamlEditorComponent` import and `imports` declaration.
  - Removed dead class fields: `editorContent`, `isDirty`, `isSaving`, `saveSuccess`,
    `saveError`, `saveSuccessTimer`, `yamlExpanded`.
  - Removed `save()`, `revert()`, `onContentChange()` methods.
  - Simplified `loadArtifact()` — no longer sets `editorContent` or `isDirty`.
  - Simplified `runValidation()` — no longer passes in-memory content override.
  - Removed `isSaving` and `saveSuccess` badges from the header template.

---

## 2. Dashboard: Related Artifacts Resolved for SK Built-ins

### Problem

The Related Artifacts table in the artifact detail view showed no entries for edges that
pointed at spec-kitty built-in artifacts. The DRG route (`GET /api/drg`) only read
`pack/drg/fragment.yaml` for its node list. Built-in SK artifacts (e.g. `implementer-ivan`,
`curator-carla`, `test-first-bug-fixing`) are referenced as edge targets but were never
included in the node map, so those edges were silently dropped during client-side
resolution.

### Root Cause

The `DrgService` on the client builds a `nodeMap` keyed by node ID. If an edge's `target`
or `source` is not in the node map, the edge is discarded. Built-in nodes were never
in the map because the DRG route only returned pack nodes.

### Decision

Merge built-in artifact nodes into the DRG response at the server level. The
`builtin-scanner.service` already inventories all built-in artifacts from
`SPEC_KITTY_SRC/doctrine/`. Calling `getAll()` from the DRG route and appending entries
not already present in the pack node list is a one-pass O(n) merge. No schema changes
needed.

Built-in nodes receive a `source: 'builtin'` discriminant so the frontend can route
them to `/artifacts/builtin/:kind/:id` rather than the pack artifact path.

### Changes

- `tools/pack-dashboard/server/src/routes/drg.routes.ts`:
  - Import `getAll` from `builtin-scanner.service`.
  - After loading pack nodes and edges, iterate all built-in summaries and append nodes
    whose ID is not already in the pack node set, tagged `source: 'builtin'`.
- `tools/pack-dashboard/src/app/services/drg.service.ts`:
  - Extend `DRGNode` interface with `source?: 'pack' | 'builtin'`.
- `tools/pack-dashboard/src/app/components/related-artifacts/related-artifacts.component.ts`:
  - Route built-in nodes to `/artifacts/builtin/:kind/:id`.
  - Render a `built-in` badge next to built-in artifact links for visual distinction.

---

## 3. Curatorial Pass (Curator Claire)

The pass followed the Curator Claire profile's audit workflow: cross-document consistency,
metadata correctness, SK overlap declaration, stale reference cleanup, and DRG completeness.

### 3.1 TO_BE_REMOVED Reference

**File:** `pack/procedures/migrate-doctrine-to-pack.procedure.yaml`

The `entry_condition` field contained a hard reference to `TO_BE_REMOVED/doctrine/`,
a directory that only exists during the active migration window and will not be present
in consumer repos. The reference was replaced with neutral wording
("legacy doctrine source directory") that remains accurate after the migration concludes.

**Rationale:** Pack artifacts are distributed to engagement repos that do not contain
`TO_BE_REMOVED/`. A hard path reference in a distributed procedure creates confusion
and false failure signals in those repos.

### 3.2 Domain Tag Corrections

**File:** `docs/artifact-tags.yaml`

The domain classification of the following artifacts was incomplete or incorrect:

| Artifact | Before | After | Rationale |
|---|---|---|---|
| `ammerse-analysis` | research, architecture, quality | + governance | AMMERSE analysis produces a decision record; governance is a primary output domain |
| `context-boundary-inference` | architecture | + governance, delivery | Boundary decisions constrain delivery scoping; results are governance artifacts |
| `regnology-mcp` | tooling | + governance | Corporate tool choice is a governance policy, not just a tooling preference |
| `TEST_FIRST_BUG_FIXING` | quality, engineering | + delivery | The directive is a delivery gate (bug fixes cannot be shipped without a failing test) |
| `backend-benny` | engineering | + security, architecture | Backend work is explicitly governed by AppSec compliance; backend agents own service architecture |
| `editor-eddy` | communications | + quality | Editorial review is explicitly a quality function; the profile's success definition is quality-oriented |
| `scribe-sally` | communications | + delivery | Scribe work supports delivery ceremonies (stand-ups, retrospectives, sprint reviews) |
| `synthesizer-sam` | research, communications | + architecture | Synthesis across multiple workstreams is architectural reasoning |
| `gcloud-proxy-setup` | (missing) | tooling, devops | The artifact existed in `pack/procedures/` but had no entry in artifact-tags.yaml |

### 3.3 SK Built-in Overlap Declarations

Three pack tactics shadow SK built-in tactics of the same ID:
- `context-boundary-inference`
- `requirements-validation-workflow`
- `secure-design-checklist`

The spec-kitty CLI issues advisories for these ("artifact id overrides a shipped tactic").
An `enhances:` field at the YAML level would suppress these advisories, but the current
tactic schema does not permit that field (extra inputs forbidden). The relationship is
instead encoded as DRG `enhances` edges — semantically equivalent and auditable.

Two agent profiles were confirmed as Regnology overrides of SK built-ins:
- `frontend-freddy` overrides the SK built-in `frontend-freddy` profile
- `java-jenny` overrides the SK built-in `java-jenny` profile

The `overrides:` field is valid in the agent_profile schema and was added to both files.
This resolves the advisory at the profile level and makes the override relationship
machine-readable without relying solely on prose in the `purpose` field.

The `TEST_FIRST_BUG_FIXING` directive is the policy enforcement wrapper for the SK
built-in procedure `test-first-bug-fixing`. A DRG `refines` edge was added to express
this relationship.

### 3.4 DRG Cross-linking Gaps

A full review of all pack artifacts against the DRG fragment revealed ~70 missing edges.
These fell into several categories:

**Agent → directive gaps.** Most agent profiles declare required directives in prose
(`directive-references:`) but had no corresponding DRG edges. Added `requires` edges for:
- `backend-benny` → `APPSEC_COMPLIANCE`, `TRACEABLE_DECISIONS`
- `devops-danny` → `APPSEC_COMPLIANCE`, `CORPORATE_TOOLING`
- `analyst-annie` → `AUDIENCE_ORIENTED_WRITING`, `CLARIFICATION_BEFORE_EXECUTION`
- `manager-mike` → `TRACEABLE_DECISIONS`, `CLARIFICATION_BEFORE_EXECUTION`
- `editor-eddy` → `AUDIENCE_ORIENTED_WRITING`
- `scribe-sally` → `AUDIENCE_ORIENTED_WRITING`
- `comms-cleo` → `AUDIENCE_ORIENTED_WRITING`
- `translator-tanya` → `AUDIENCE_ORIENTED_WRITING`
- `diagram-daisy` → `TRACEABLE_DECISIONS`
- `bootstrap-bill` → `FRAMEWORK_GUARDIAN`, `CLARIFICATION_BEFORE_EXECUTION`

**Agent → tactic gaps.** Tactical guidance referenced in agent profiles but absent from
the graph:
- `manager-mike` → `ammerse-analysis`, `team-interaction-mapping`
- `editor-eddy` → `lexical-style-diagnostic`
- `comms-cleo` → `glossary-maintenance-workflow`
- `devops-danny` → `maven-project-compliance-setup`
- `diagram-daisy` → `safe-to-fail-experiment-design`

**Agent → styleguide gaps.** Style governance enforced by agent profiles:
- `editor-eddy`, `scribe-sally`, `translator-tanya`, `lexical-larry` → `professional-communications`
- `backend-benny`, `java-jenny` → `version-control-hygiene`

**Agent → paradigm links.** Agents whose specialization is grounded in a pack paradigm:
- `analyst-annie` → `evidence-based-requirements`, `decision-first-development`
- `backend-benny` → `ports-and-adapters-architecture`
- `diagram-daisy` → `design-diagramming-incremental-detail`
- `synthesizer-sam` → `traceability-chain-pattern`

**Procedure cross-links.** Procedures that had no outbound edges beyond their primary
directive:
- `regnology-jira-workflow` → `CORPORATE_TOOLING`, `regnology-mcp`, `TRACEABLE_DECISIONS`
- `decision-reference-types` → `ammerse-analysis` (suggests), `decision-first-development` (applies)
- `migrate-doctrine-to-pack` → `FRAMEWORK_GUARDIAN`
- `gcloud-proxy-setup` → `google-cloud-mcp` (suggests — inverse of the existing edge)
- `create-branded-pdf-document` → `professional-communications`
- `sqlx-fu-pipeline` → `sqlx-mcp`

**Paradigm completeness.**
- `ports-and-adapters-architecture` had no edges at all — added `applies TRACEABLE_DECISIONS`.
- `sqlx-spec-driven-authoring` referenced `sqlx-mcp` and `google-cloud-mcp` in its summary
  text but had no DRG edges to those toolguides — added `applies` edges for both.

---

## 4. Known Gaps (Not Resolved in This Session)

| Gap | Reason not resolved | Forward action |
|---|---|---|
| ~~`enhances:` on tactics~~ | ~~Tactic schema does not permit extra fields~~ | **Closed 2026-05-26.** Shipped in spec-kitty rc27 (WP05, mission `charter-ux-and-org-pack-vocabulary-01KSAF14`). Declarations restored; pack validates at 0 errors, 0 advisories. See [2026-05-26 note](./2026-05-26-enhances-field-restored-rc27-upgrade.md). |
| `curator-claire` pack profile | Profile only exists in `TO_BE_REMOVED/doctrine/agents/`; not yet migrated | Add to pack migration plan batch |
| Remaining TO_BE_REMOVED migration backlog | Out of scope for this session | See `docs/pack-migration-plan.md` |
| Dashboard: no "untagged artifacts" warning | Design decision deferred | See `2026-05-21-pack-dashboard-next-features.md` §1.6 |

---

## 5. Pack Validation State

After all changes in this session (2026-05-22):

```
spec-kitty doctrine pack validate pack/
⚠ advisory [tactics/context-boundary-inference]: artifact id overrides a shipped tactic
⚠ advisory [tactics/requirements-validation-workflow]: artifact id overrides a shipped tactic
⚠ advisory [tactics/secure-design-checklist]: artifact id overrides a shipped tactic
Pack validation: 0 errors, 3 advisories
```

The 3 advisories were pre-existing and intentional. They were resolved on 2026-05-26
after spec-kitty rc27 shipped the `enhances` schema field. Current state: **0 errors,
0 advisories**. See [2026-05-26 note](./2026-05-26-enhances-field-restored-rc27-upgrade.md).
