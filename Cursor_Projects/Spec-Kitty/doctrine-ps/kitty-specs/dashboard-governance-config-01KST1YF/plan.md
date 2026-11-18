# Implementation Plan: Dashboard Domain & Charter Governance

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-05-29 | **Spec**: [spec.md](spec.md)
**Input**: `kitty-specs/dashboard-governance-config-01KST1YF/spec.md`

## Summary

Adds two self-contained governance configuration capabilities to the Doctrine Management
Dashboard. Feature A extends the Org Bindings page with a Domain Vocabulary panel
supporting full CRUD on `config/domain-config.yaml`, including cascade-delete that
cleans up references in `config/artifact-tags.yaml` and `config/org-bindings.yaml`.
Feature B introduces org charter management: a `config/charter-config.yaml`–backed API
(`GET/POST/DELETE /api/charter`), a charter badge on all artefact cards, a toggle on the
artefact detail page, and a new `/charter` tab view. Both features follow the existing
atomic write pattern (`.tmp` then rename) and introduce no new npm dependencies.

The two features are structurally independent and planned as parallel execution lanes.

## Technical Context

**Language/Version**: TypeScript 5.x — Node.js 20 (backend Express server), Angular 18 (frontend standalone components)
**Primary Dependencies**: Express 4.x, Angular 18, js-yaml 4.x, uuid 9.x, RxJS 7.x — all existing; no new dependencies added
**Storage**: YAML files in `config/` — `domain-config.yaml` (domains), `artifact-tags.yaml` (artefact→domain mapping), `org-bindings.yaml` (RACI bindings), `charter-config.yaml` (new — charted artefact list)
**Testing**: Vitest unit tests for new service methods (domain-config write ops, CharterService CRUD); Angular component tests for charter badge logic; file I/O mocked via vi.mock
**Target Platform**: Local developer machine (Linux/macOS); dashboard runs on localhost only, no cloud deployment
**Project Type**: Web application — `tools/pack-dashboard/server/` (Express) + `tools/pack-dashboard/src/` (Angular 18)
**Performance Goals**: Domain vocabulary panel and charter list render under 500 ms after any CRUD operation for packs ≤ 200 artefacts
**Constraints**: Atomic writes required; no hex values in CSS; no `font-weight: bold`; TypeScript must compile clean; Angular production build must succeed

## Charter Check

**DIRECTIVE_003 (Decision Documentation):** Material decisions captured in spec.md and this plan. ✓
**DIRECTIVE_010 (Specification Fidelity):** Implementation must follow approved FR-001–FR-014 without deviation. ✓
**DIR-002 (Config → `config/`):** `charter-config.yaml` lands in `config/`, not `pack/`. ✓
**DIR-004 (Dashboard → `tools/`):** All new code within `tools/pack-dashboard/`. ✓
**Quality Gates:** Atomic writes, no hex CSS, tsc clean — enforced via existing patterns. ✓
**Constraint C-002 checked:** `pack/org-charter.yaml` is untouched by all dashboard charter operations. ✓

No violations. Complexity tracking section omitted.

## Project Structure

### Documentation (this feature)

```
kitty-specs/dashboard-governance-config-01KST1YF/
├── plan.md                            # This file
├── research.md                        # Phase 0 findings
├── data-model.md                      # Phase 1 data model
├── contracts/
│   ├── api-domain-config.yaml         # Domain CRUD API contract
│   └── api-charter.yaml               # Charter API contract
└── tasks/                             # Populated by /spec-kitty.tasks
```

### Source Code (repository root)

```
tools/pack-dashboard/
├── server/src/
│   ├── routes/
│   │   ├── domain-config.routes.ts        [EXTEND] add POST / PUT /:id / GET /:id/cascade-preview / DELETE /:id
│   │   │                                   NOTE: register GET /:id/cascade-preview BEFORE DELETE /:id
│   │   │                                   to prevent Express matching "cascade-preview" as an ID value.
│   │   └── charter.routes.ts              [NEW] GET / POST / DELETE /:artifactId
│   ├── services/
│   │   ├── domain-tags.service.ts         [EXTEND] addDomain / updateDomain / deleteDomain
│   │   ├── domain-cascade.service.ts      [NEW] cascadePreview + cascadeDelete orchestrator
│   │   │                                   DESIGN CHOICE (see research.md §2): calls existing
│   │   │                                   org-bindings.service.ts#cascadeDelete() for bindings write
│   │   │                                   rather than duplicating file-write logic.
│   │   └── charter.service.ts             [NEW] list / add / remove; persists charter-config.yaml
│   ├── models/
│   │   └── charter.model.ts               [NEW] CharterEntry, CharterConfigFile
│   └── index.ts                           [EXTEND] register charterRouter at /api/charter
├── src/app/
│   ├── models/
│   │   └── charter.model.ts               [NEW] CharterEntry, ArtifactKind-typed
│   ├── services/
│   │   ├── charter.service.ts             [NEW] get / add / remove; BehaviorSubject; eager init
│   │   └── domain.service.ts              [EXTEND] add addDomain / updateDomain / deleteDomain /
│   │                                       getCascadePreview — extend existing service, do NOT
│   │                                       create a separate domain-config.service.ts
│   ├── components/
│   │   ├── charter-badge/                 [NEW] charter-badge.component.ts — reads BehaviorSubject;
│   │   │                                   renders no badge (not error) when charter not yet loaded
│   │   └── domain-vocabulary-panel/       [NEW] domain-vocabulary-panel.component.ts — extracted from
│   │                                       OrgBindingsComponent to keep template size manageable
│   └── pages/
│       ├── org-bindings/
│       │   └── org-bindings.component.ts  [EXTEND] add <app-domain-vocabulary-panel>
│       ├── artifact-detail/
│       │   └── artifact-detail.component.ts [EXTEND] charter toggle
│       ├── artifact-list/
│       │   └── artifact-list.component.ts [EXTEND] charter badge on rows
│       ├── dashboard/
│       │   └── dashboard.component.ts     [AUDIT] confirm whether artefact rows are rendered here;
│       │                                   add badge if so (FR-007 scope clarification)
│       ├── domain-artifacts/
│       │   └── domain-artifacts.component.ts [AUDIT] same FR-007 audit as dashboard component
│       ├── charter/                       [NEW] charter.component.ts — groups entries by kind in
│       │                                   ARTIFACT_KINDS array order; empty state handled
│       └── layout/
│           └── sidebar.component.ts       [EXTEND] add Charter nav item (WP06)
```

**Structure Decision**: Web application layout (separate backend/frontend trees). All changes are
additive within the existing `tools/pack-dashboard/` tree; no new top-level directories needed.

## Execution Lanes

Two parallel lanes — each lane is internally sequential:

**Lane A — Domain Vocabulary**
1. WP01: Domain Config write API (backend service + route extensions)
2. WP02: Cascade delete backend (preview + execute; multi-file atomic write)
3. WP03: Domain Vocabulary panel frontend (Org Bindings page extension)

**Lane B — Charter Management**
4. WP04: Charter API (CharterService + charter.routes.ts; new config file)
5. WP05: Charter badge + toggle frontend (CharterBadge component; detail page toggle)
6. WP06: Charter tab view frontend (new /charter page, routing, empty state)

Lane A and Lane B are independent and can be implemented concurrently.
