# Tasks: Organisational Bindings

**Mission**: `organizational-bindings-01KSPTPR`  
**Branch**: `overhaul/migrate_to_kitty` → merges into `overhaul/migrate_to_kitty`  
**Plan**: `kitty-specs/organizational-bindings-01KSPTPR/plan.md`

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|-----|---------|
| T001 | Add `getConfigRoot()` to `server/src/config.ts` (env override `CONFIG_ROOT`) | WP01 | — |
| T002 | Create `config/` directory; git-mv `docs/domain-config.yaml` → `config/domain-config.yaml` | WP01 | — |
| T003 | git-mv `docs/artifact-tags.yaml` → `config/artifact-tags.yaml` | WP01 | [P] |
| T004 | Update `domain-tags.service.ts` to use `getConfigRoot()` for both file reads/writes | WP01 | — |
| T005 | Update `domain-config.routes.ts` to use `getConfigRoot()` | WP01 | [P] |
| T006 | Create `server/src/models/org-binding.model.ts` (interfaces + RaciRole enum) | WP02 | — |
| T007 | Create `server/src/services/org-bindings.service.ts` (CRUD + orphan detection + atomic writes) | WP02 | — |
| T008 | Write Vitest unit tests for `org-bindings.service.ts` (CRUD, validation, orphan flag) | WP02 | [P] |
| T009 | Create `server/src/routes/org-bindings.routes.ts` (GET / POST / PUT / DELETE) | WP03 | — |
| T010 | Mount org-bindings router in `server/src/index.ts` | WP03 | — |
| T011 | Write Vitest route tests for org-bindings (validation errors, 404, orphan response) | WP03 | [P] |
| T012 | Update startup log string in `index.ts` to new app name | WP03 | [P] |
| T013 | Create `src/app/models/org-binding.model.ts` (client-side types, same shape as server) | WP04 | — |
| T014 | Create `src/app/services/org-bindings.service.ts` (Angular HttpClient CRUD) | WP04 | — |
| T015 | Create `src/app/pages/org-bindings/org-bindings.component.ts` — card grid + domain filter + orphan banner | WP04 | — |
| T016 | Add `/org-bindings` route to `app.routes.ts` | WP04 | [P] |
| T017 | Add *Organisational Bindings* nav item to sidebar (Navigation section, between Dashboard and artefact groups) | WP04 | [P] |
| T018 | Add `ReactiveFormsModule` inline create/edit form to `org-bindings.component.ts` | WP05 | — |
| T019 | Implement client-side validation in the form (SPOC regex, required fields, char limits) | WP05 | — |
| T020 | Implement delete with confirmation prompt | WP05 | — |
| T021 | Implement orphaned binding remediation actions (cascade-delete + rebind) | WP05 | — |
| T022 | Add RACI badge component / inline pill with colour coding (R=green, A=petrol, C=amber, I=grey) | WP05 | [P] |
| T023 | Add Accountability sub-section to `domain-artifacts.component.ts` | WP06 | — |
| T024 | Add `→ Bindings` chip-link to domain cards in `dashboard.component.ts` | WP06 | [P] |
| T025 | Update `header.component.ts` app title to *Doctrine Organisational Management Dashboard* | WP06 | [P] |
| T026 | Update `dashboard.component.ts` `<h2>` heading to new app name | WP06 | [P] |
| T027 | Create `config/org-bindings.yaml` seed file at repo root | WP06 | [P] |
| T028 | Add `primary_domain` picker to domain-tags editor (constrained dropdown + auto-clear) | WP07 | — |
| T029 | Render ★ primary domain marker on artifact domain chips | WP07 | [P] |

---

## WP01 — Config Root Migration

**Priority**: Critical (blocks WP02–WP06)  
**Goal**: Introduce `getConfigRoot()`, move `domain-config.yaml` and `artifact-tags.yaml` to `config/`, update all server readers.  
**Independent test**: Server starts, `GET /api/domain-config` returns domains, `GET /api/artifact-tags` works — without any `docs/*.yaml` files.  
**Estimated prompt size**: ~300 lines

- [x] T001 Add `getConfigRoot()` to `server/src/config.ts` (WP01)
- [x] T002 Create `config/` directory; git-mv `docs/domain-config.yaml` → `config/domain-config.yaml` (WP01)
- [x] T003 git-mv `docs/artifact-tags.yaml` → `config/artifact-tags.yaml` (WP01)
- [x] T004 Update `domain-tags.service.ts` to use `getConfigRoot()` for both file reads/writes (WP01)
- [x] T005 Update `domain-config.routes.ts` to use `getConfigRoot()` (WP01)

**Prompt file**: `tasks/WP01-config-root-migration.md`  
**Dependencies**: none

---

## WP02 — Server Model and Service

**Priority**: High (blocks WP03)  
**Goal**: Typed model + full CRUD service with atomic writes and orphan detection.  
**Independent test**: Vitest `org-bindings.service.test.ts` passes — create/read/update/delete/orphan cases.  
**Estimated prompt size**: ~380 lines

- [x] T006 Create `server/src/models/org-binding.model.ts` (WP02)
- [x] T007 Create `server/src/services/org-bindings.service.ts` (WP02)
- [x] T008 Write Vitest unit tests for `org-bindings.service.ts` (WP02)

**Prompt file**: `tasks/WP02-server-model-and-service.md`  
**Dependencies**: WP01

---

## WP03 — REST Routes

**Priority**: High (blocks WP04)  
**Goal**: Express router for all four CRUD endpoints, validation error responses, router mounted in index.  
**Independent test**: Route tests pass; `curl localhost:3000/api/org-bindings` returns `[]`.  
**Estimated prompt size**: ~350 lines

- [x] T009 Create `server/src/routes/org-bindings.routes.ts` (WP03)
- [x] T010 Mount org-bindings router in `server/src/index.ts` (WP03)
- [x] T011 Write Vitest route tests for org-bindings (WP03)
- [x] T012 Update startup log string in `index.ts` to new app name (WP03)

**Prompt file**: `tasks/WP03-rest-routes.md`  
**Dependencies**: WP02

---

## WP04 — Angular Service and Page Shell

**Priority**: High (blocks WP05)  
**Goal**: Client-side model, Angular service, page scaffold with read-only card grid and routing wired up.  
**Independent test**: Navigate to `/org-bindings`; page loads, existing bindings shown as cards (no CRUD yet).  
**Estimated prompt size**: ~380 lines

- [x] T013 Create `src/app/models/org-binding.model.ts` (WP04)
- [x] T014 Create `src/app/services/org-bindings.service.ts` (WP04)
- [x] T015 Create `src/app/pages/org-bindings/org-bindings.component.ts` — card grid + domain filter + orphan banner (WP04)
- [x] T016 Add `/org-bindings` route to `app.routes.ts` (WP04)
- [x] T017 Add *Organisational Bindings* nav item to sidebar (WP04)

**Prompt file**: `tasks/WP04-angular-service-and-page-shell.md`  
**Dependencies**: WP03

---

## WP05 — CRUD Form and Interactions

**Priority**: High  
**Goal**: Inline reactive form, create/edit/delete, orphan remediation, RACI badge pill.  
**Independent test**: Create a binding via the form; card appears. Edit it; card updates. Delete it; card disappears. Orphaned card shows danger styling and remediations.  
**Estimated prompt size**: ~450 lines

- [x] T018 Add ReactiveFormsModule inline create/edit form to `org-bindings.component.ts` (WP05)
- [x] T019 Implement client-side validation in the form (WP05)
- [x] T020 Implement delete with confirmation prompt (WP05)
- [x] T021 Implement orphaned binding remediation actions (WP05)
- [x] T022 Add RACI badge pill with colour coding (WP05)

**Prompt file**: `tasks/WP05-crud-form-and-interactions.md`  
**Dependencies**: WP04

---

## WP06 — Integration and Rename

**Priority**: Medium  
**Goal**: Surface bindings on the domain detail page, add chip to dashboard domain cards, rename the app, seed `config/org-bindings.yaml`.  
**Independent test**: `/domain/engineering` shows Accountability sub-section. Dashboard domain cards have `→ Bindings` chip. App header reads *Doctrine Organisational Management Dashboard*.  
**Estimated prompt size**: ~300 lines

- [x] T023 Add Accountability sub-section to `domain-artifacts.component.ts` (WP06)
- [x] T024 Add `→ Bindings` chip-link to domain cards in `dashboard.component.ts` (WP06)
- [x] T025 Update `header.component.ts` app title (WP06)
- [x] T026 Update `dashboard.component.ts` heading (WP06)
- [x] T027 Create `config/org-bindings.yaml` seed file (WP06)

**Prompt file**: `tasks/WP06-integration-and-rename.md`  
**Dependencies**: WP04

---

## WP07 — Primary Domain Designation UI

**Priority**: Medium  
**Goal**: Add `primary_domain` picker to the domain-tags editor; show ★ marker on primary domain chips.  
**Independent test**: Set primary domain on an artifact via the editor; artifact detail page shows Primary Accountability section populated; ★ marker visible on primary chip.  
**Estimated prompt size**: ~280 lines

- [x] T028 Add `primary_domain` picker to domain-tags editor (WP07)
- [x] T029 Render ★ primary domain marker on artifact domain chips (WP07)

**Prompt file**: `tasks/WP07-primary-domain-designation-ui.md`  
**Dependencies**: WP06

---

## Parallelization

```
WP01  →  WP02  →  WP03  →  WP04  →  WP05
                                  ↘
                                   WP06  →  WP07
```

WP05 and WP06 can be worked in parallel once WP04 is done. WP07 follows WP06.

## MVP Scope

WP01 → WP02 → WP03 → WP04 delivers a fully functional read-only binding browser backed by a working API. Add WP05 for full CRUD. WP06 for integration and rename polish.
