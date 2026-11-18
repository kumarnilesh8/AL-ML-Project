# Implementation Plan: Organisational Bindings

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-05-28 | **Spec**: `kitty-specs/organizational-bindings-01KSPTPR/spec.md`  
**Input**: Feature specification from `kitty-specs/organizational-bindings-01KSPTPR/spec.md`

---

## Summary

Add a RACI-based corporate enrichment layer to the Doctrine Organisational Management Dashboard. Introduces `OrgBinding` records (domain, department, SPOC, accountability role, involvement rationale) stored in `config/org-bindings.yaml`. Provides full CRUD REST API, a new `/org-bindings` Angular page with branded card grid and inline form, orphan detection, RACI badge colouring, and domain detail page integration. Also migrates `docs/domain-config.yaml` and `docs/artifact-tags.yaml` to `config/` and introduces `getConfigRoot()` on the server. Renames the app to *Doctrine Organisational Management Dashboard*.

---

## Technical Context

**Language/Version**: TypeScript 5.4 (Angular 18 frontend + Express 4 backend); Node.js 20 LTS  
**Primary Dependencies**: Angular 18 standalone components, Express 4.x, js-yaml, RxJS 7, @angular/forms (ReactiveFormsModule for the inline binding form)  
**Storage**: `config/org-bindings.yaml` — atomic write (.tmp + rename pattern), same as `domain-tags.service.ts`  
**Testing**: Vitest for server-side unit tests (services, routes, validation); Angular TestBed for component smoke tests  
**Target Platform**: Local developer machine; single-user; no auth  
**Project Type**: Web application — Angular SPA frontend + Express API backend, both in `tools/pack-dashboard/`  
**Performance Goals**: API CRUD operations < 100ms; Angular bundle size increase < 20 kB gzipped  
**Constraints**: No new npm dependencies; TypeScript must compile cleanly; no hard-coded hex values in SCSS; atomic file writes; SPOC regex validation server-side and client-side  
**Scale/Scope**: ~12 domains; expected < 100 bindings; single-user local tool

---

## Charter Check

*Against `.kittify/charter/charter.md`*

| Gate | Status | Notes |
|------|--------|-------|
| DIR-002: Dashboard YAML → `config/` | ✅ PASS | `org-bindings.yaml` in `config/`; migration of `domain-config.yaml` + `artifact-tags.yaml` also in scope |
| DIR-003: Documentation → `docs/` | ✅ PASS | No config YAML added to `docs/`; `SURFACES.md` already updated |
| DIR-004: Dashboard app → `tools/` | ✅ PASS | All new source files in `tools/pack-dashboard/` |
| DIR-007: Risk boundaries | ✅ PASS | SPOC `@regnology.net` validation enforced; no PII beyond internal email; `config/` never inside `pack/` |
| Quality gate — TypeScript compile | Required | `tsc --noEmit` must pass on both server and frontend tsconfigs |
| Quality gate — Angular build | Required | `ng build --configuration=production` must succeed |
| Quality gate — no bold font | Required | SCSS must not use `font-weight: 700`; RACI badges use colour, not weight |
| Quality gate — brand tokens only | Required | No hard-coded hex; all colours via `--rn-*` tokens or existing card variant classes |
| Testing — Vitest | Required | `OrgBindingsService` (CRUD + orphan detection) and route validation must have unit tests |

No charter conflicts detected. Re-checked after Phase 1 — no new gaps.

---

## Project Structure

### Documentation (this feature)

```
kitty-specs/organizational-bindings-01KSPTPR/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── org-bindings-api.yaml   ← Phase 1 OpenAPI contract
└── tasks.md             ← Phase 2 output (spec-kitty tasks)
```

### Source code changes (repository root)

```
config/                                        ← new top-level directory
  domain-config.yaml                           ← moved from docs/domain-config.yaml
  artifact-tags.yaml                           ← moved from docs/artifact-tags.yaml
  org-bindings.yaml                            ← new (initially: schema_version: "1.0"\nbindings: [])

tools/pack-dashboard/
  server/src/
    config.ts                                  ← add getConfigRoot() + CONFIG_ROOT env var
                                                  migrate domain-config + artifact-tags reads
    models/
      org-binding.model.ts                     ← new: OrgBinding interface, RaciRole enum
    services/
      org-bindings.service.ts                  ← new: CRUD + orphan detection, atomic writes
      domain-tags.service.ts                   ← update: getDocsRoot() → getConfigRoot()
    routes/
      org-bindings.routes.ts                   ← new: Express router /api/org-bindings
      domain-config.routes.ts                  ← update: getDocsRoot() → getConfigRoot()
    index.ts                                   ← mount org-bindings router
  src/app/
    models/
      org-binding.model.ts                     ← new: client-side OrgBinding + RaciRole
    services/
      org-bindings.service.ts                  ← new: Angular HttpClient service
    pages/
      org-bindings/
        org-bindings.component.ts              ← new: grid + inline form + orphan banner
      domain-artifacts/
        domain-artifacts.component.ts          ← update: add Accountability sub-section
    pages/dashboard/
      dashboard.component.ts                   ← update: add → Bindings chip to domain cards
    layout/
      header.component.ts                      ← update: title rename
      sidebar.component.ts                     ← update: add Organisational Bindings nav item
    app.routes.ts                              ← add /org-bindings route
```

**Structure Decision**: Web application layout. All backend changes in `tools/pack-dashboard/server/src/`; all frontend changes in `tools/pack-dashboard/src/app/`. Config migration is a filesystem move with server-side read path update.

---

## Complexity Tracking

No charter gate violations.

---

## Phase 0: Research

*Resolved unknowns — no open items requiring external research. Decisions recorded below.*

### R-001: ULID generation for binding IDs

**Decision**: Use `crypto.randomUUID()` (Node.js built-in, available since Node 15) for binding `id`. No additional dependency required. ULIDs require the `ulid` npm package which is not currently in `package.json`; UUIDs are semantically equivalent for this use case.

**Alternative rejected**: ULID — would require adding a dependency (violates charter constraint). Sequential integers — not stable across concurrent edits.

### R-002: Angular form strategy for inline create/edit panel

**Decision**: Use Angular `ReactiveFormsModule` (`FormGroup`/`FormControl`). Already imported in the project (used by `yaml-editor.component`). Provides clean validation hooks for the SPOC regex check and character-limit validators without template complexity.

**Alternative rejected**: Template-driven forms — less composable for programmatic validation of the SPOC regex rule.

### R-003: Query parameter routing for domain filter on `/org-bindings`

**Decision**: The `→ Bindings` chip on domain cards navigates to `/org-bindings?domain=<id>` using Angular's `Router.navigate(['/org-bindings'], { queryParams: { domain: id } })`. The `OrgBindingsComponent` subscribes to `ActivatedRoute.queryParams` and filters the displayed cards client-side (no separate API call). This avoids adding a new server route for filtering.

**Alternative rejected**: Route parameter (`/org-bindings/domain/:id`) — creates a separate page instead of a filtered view; harder to navigate back to the full list.

### R-004: Atomic config file migration strategy

**Decision**: Migration from `docs/` to `config/` is a git rename (`git mv`). The server `getConfigRoot()` defaults to `<repo-root>/config`. After the move, `DOCS_ROOT` continues to serve documentation discovery routes unchanged. Both `domain-config.yaml` and `artifact-tags.yaml` move in the same WP as `getConfigRoot()` introduction so the server is never in a broken state mid-migration.

---

*research.md complete — all Phase 0 unknowns resolved.*
