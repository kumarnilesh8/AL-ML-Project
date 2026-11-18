# Implementation Plan: Pack Dashboard — Domain Tags and Built-in Doctrine

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-05-21 | **Spec**: `kitty-specs/pack-dashboard-domain-tags-builtin-01KS56B1/spec.md`

---

## Summary

Two independent subsystems are added to the existing Express + Angular 18 pack governance dashboard:

1. **Domain Tags** — a controlled-vocabulary tagging layer backed by two YAML files in `docs/`.
   The server exposes GET/PUT REST routes. The frontend adds a `DomainChipsComponent`, a domain
   column to kind-list pages, an editable chip selector to artifact-detail pages, and a "By
   Domain" collapsible section to the dashboard.

2. **Built-in Doctrine Surfacing** — the server scans `SPEC_KITTY_SRC/doctrine/` at startup and
   caches the result. Read-only GET routes expose the built-in artifact set. The frontend adds
   a collapsible built-in table to kind-list pages, a read-only detail view, client-side ID
   resolution in `StructuredViewComponent`, and a Platform Defaults section on the dashboard.

Both subsystems are fully independent and can be implemented in parallel lanes.

---

## Technical Context

**Language/Version**: TypeScript 5.x (server: Node.js 20+; frontend: Angular 18 / TypeScript 5.4)
**Primary Dependencies**: Express 4.x, js-yaml 4.x (server); Angular 18, RxJS 7.x (frontend)
**Storage**: YAML files: `docs/domain-config.yaml` (vocabulary), `docs/artifact-tags.yaml`
  (artifact-to-domain mapping); filesystem scan for built-in artifacts
**Testing**: Server — supertest integration tests using real temp YAML files (no mocks for
  file I/O); Angular TestBed unit tests for new components and services
**Target Platform**: Node.js server + web browser (Chrome/Firefox/Safari/Edge latest)
**Project Type**: Web application — Express REST API + Angular 18 SPA
**Performance Goals**: p95 < 400 ms for all new API routes (NFR-001)
**Constraints**: Built-in artifacts never writable; domain vocab is the only valid source for tag IDs;
  `PUT /api/artifact-tags/:id` must be idempotent; built-in scanner returns empty result
  gracefully when `SPEC_KITTY_SRC` is absent (NFR-003)
**Scale/Scope**: ~100 pack artifacts, ~192 built-in artifacts, ~10 domain tags

---

## Charter Check

No project charter at `.kittify/charter/charter.md`. Applicable built-in directives:

| Directive | Implication | Status |
|-----------|-------------|--------|
| DIRECTIVE_001 Architectural Integrity | New routes and services must not reach across each other's concerns. Domain tags ≠ built-in scanner. | ✅ Met — separate service files per concern |
| DIRECTIVE_003 Decision Documentation | Design decisions (caching strategy, file-write approach, color mapping) documented in research.md | ✅ Met |
| DIRECTIVE_010 Specification Fidelity | Built-in artifacts must never be writable; domain vocab must be validated server-side | ✅ Enforced at route level |
| DIRECTIVE_024 Locality of Change | Domain tags changes confined to new route/service files; built-in scanner is additive only | ✅ |
| DIRECTIVE_030 Test and Typecheck Quality Gate | All new routes must have supertest integration tests; services must have unit tests | ✅ Required by plan |
| DIRECTIVE_034 Test-First Development | Tests authored before or alongside implementation for each WP | ✅ Required by WP definition |
| DIRECTIVE_036 Black-Box Integration Testing | Server tests exercise routes through HTTP (supertest), not by calling service methods directly | ✅ |

---

## Project Structure

### Documentation (this mission)

```
kitty-specs/pack-dashboard-domain-tags-builtin-01KS56B1/
├── plan.md              # This file
├── research.md          # Phase 0 — architecture and design decisions
├── data-model.md        # Phase 1 — TypeScript interfaces and YAML schemas
├── contracts/
│   ├── domain-tags.openapi.yaml     # GET /api/domain-config, GET/PUT /api/artifact-tags
│   └── builtin.openapi.yaml         # GET /api/builtin/**
└── quickstart.md        # Developer onboarding for this feature set
```

### Server additions (`tools/pack-dashboard/server/src/`)

```
services/
  domain-tags.service.ts        # Read docs/domain-config.yaml, read/write artifact-tags.yaml
  domain-tags.service.test.ts   # Supertest + temp-file tests
  builtin-scanner.service.ts    # Scan SPEC_KITTY_SRC/doctrine/, cache at startup
  builtin-scanner.service.test.ts
routes/
  domain-config.routes.ts       # GET /api/domain-config
  artifact-tags.routes.ts       # GET /api/artifact-tags, PUT /api/artifact-tags/:id
  artifact-tags.routes.test.ts
  builtin.routes.ts             # GET /api/builtin, /api/builtin/:kind, /api/builtin/:kind/:id
  builtin.routes.test.ts
index.ts                        # Updated: register new routers
```

### Frontend additions (`tools/pack-dashboard/src/app/`)

```
models/
  domain.model.ts                    # DomainConfig, ArtifactTagsMap
services/
  domain.service.ts                  # getConfig(), getTags(), setTags()
  builtin.service.ts                 # getAll(), getByKind(), getDetail()
components/
  domain-chips/
    domain-chips.component.ts        # Read-only and editable chip variants
pages/
  artifact-list/
    artifact-list.component.ts       # Updated: domain column + built-in collapsible table
  artifact-detail/
    artifact-detail.component.ts     # Updated: editable domain chips
  builtin-detail/
    builtin-detail.component.ts      # Read-only detail view for /artifacts/builtin/:kind/:id
app.routes.ts                        # Updated: add /artifacts/builtin/:kind/:id route
styles.scss                          # Updated: domain chip colors, builtin badge, built-in table
```

### New data files

```
docs/
  domain-config.yaml     # Domain vocabulary (starter set of 10 tags)
  artifact-tags.yaml     # Artifact-to-domain mapping (empty on creation)
```

---

## Work Package Lane Assignments

Two independent lanes. WP01 and WP06 can start in parallel.

### Lane A — Domain Tags

| WP | Title | Depends on | Acceptance summary |
|----|-------|------------|--------------------|
| WP01 | Domain vocabulary + GET /api/domain-config | — | `GET /api/domain-config` returns 10 starter domains; if `domain-config.yaml` is absent the endpoint returns `{ domains: [] }` (200, not 500). New route registered in `index.ts` using `getPackRoot()` getter (never the frozen constant). Validation rejects unknown IDs. |
| WP02 | Artifact tags file + GET/PUT /api/artifact-tags | WP01 | `GET /api/artifact-tags` returns tag map; `PUT` updates entry and rejects unknown domain IDs with 422 |
| WP03 | DomainService + DomainChipsComponent + kind-list column | WP01 | Domain chips render on kind-list pages; read-only variant functional |
| WP04 | Editable domain chips on artifact detail page | WP02, WP03 | User can add/remove domain tags on detail page; changes persist to artifact-tags.yaml. FR-018: YAML Content section is collapsed by default and expandable via a disclosure toggle; Structured View remains always visible. |
| WP05 | "By Domain" dashboard section | WP03 | Dashboard shows collapsible By Domain section with artifact counts per domain |

### Lane B — Built-in Doctrine

| WP | Title | Depends on | Acceptance summary |
|----|-------|------------|--------------------|
| WP06 | Built-in scanner service (server) | — | `BuiltinScannerService` scans SPEC_KITTY_SRC/doctrine/ at startup; returns empty gracefully when path absent. **MUST call `getSpecKittySrc()` getter at scan time — never import the frozen `SPEC_KITTY_SRC` constant — so `process.env` overrides work in tests. Same applies when wiring in `index.ts`: use `getPackRoot()` / `getSpecKittySrc()` getters.** |
| WP07 | GET /api/builtin routes | WP06 | All three routes return data; `source: 'builtin'` present on all builtin summaries. Pack scanner updated to emit `source: 'pack'` (not omitted) so consumers have a definitive contract. |
| WP08 | Built-in table on kind-list pages + source badge | WP07 | Collapsible built-in table below pack table; source badge distinguishes rows |
| WP09 | Read-only built-in detail view | WP08 | `/artifacts/builtin/:kind/:id` loads; YAML editor locked; banner visible. **`app.routes.ts`: the new route must be placed as the first entry in the artifacts group — before both `/artifacts/:kind` and `/artifacts/:kind/:id` — to prevent Angular matching `builtin` as a `:kind` parameter.** |
| WP10 | Built-in chip resolution in StructuredViewComponent | WP09 | `specializes_from/enhances/overrides` values matching built-in IDs render as distinct chips with correct links |
| WP11 | Platform Defaults section on dashboard | WP07 | Dashboard shows Platform Defaults section with per-kind built-in counts; no coverage ratio |

---

## Key Design Decisions

(Full rationale in `research.md`)

1. **File I/O — read-per-request** for domain-config.yaml and artifact-tags.yaml. No caching needed at ~100 artifacts; keeps the server stateless for local dev.

2. **artifact-tags.yaml write strategy — full-file rewrite** with atomic rename pattern (`writeFileSync` to a `.tmp` file, then `renameSync` to the final path). Prevents partial writes on process interrupt.

3. **Built-in scanner caching** — scan `SPEC_KITTY_SRC/doctrine/` once at server startup, store in memory. No file watcher; built-ins are read-only and stable between deploys.

4. **Domain chip color mapping** — `color` field in domain-config.yaml maps to a small set of design-system-derived CSS modifier classes (`.dc-chip--blue`, `.dc-chip--green`, `dc-chip--red`, etc.). Unknown values fall back to `.dc-chip--default`. No arbitrary hex colors.

5. **Client-side built-in resolution** (Option B from engineering note) — `StructuredViewComponent` loads the full built-in map via `BuiltinService.getAll()` on init. Resolution is a local lookup against this map; no additional HTTP round-trip per chip.

6. **Route guard for built-in artifacts** — the read-only banner on the built-in detail view is enforced in the component itself (`isBuiltin = true`). The `YamlEditorComponent` receives `[readOnly]="true"`. The server PUT route only handles `/api/artifacts` (pack), never `/api/builtin`.

---

## Complexity Tracking

No charter violations. All additions are strictly additive to the existing codebase.
