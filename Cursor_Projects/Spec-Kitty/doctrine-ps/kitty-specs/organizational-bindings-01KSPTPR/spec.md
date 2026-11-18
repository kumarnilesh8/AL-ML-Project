# Spec: Organisational Bindings

**Mission:** `organizational-bindings-01KSPTPR`  
**Mission type:** software-dev  
**Target branch:** `overhaul/migrate_to_kitty`  
**Date:** 2026-05-28

---

## 1. Purpose and context

The pack-governance dashboard (being renamed to the **Doctrine Organisational
Management Dashboard** — see §10) currently models each doctrine domain with a
flat descriptive record (`id`, `label`, `description`, `color`) stored in
`docs/domain-config.yaml`. This is sufficient for categorisation but provides
no organisational signal: there is no way to tell who owns a domain, which
department is accountable, or the nature of that accountability.

This mission adds a **corporate enrichment layer** called *Organisational
Bindings* that attaches RACI-style accountability metadata to each doctrine
domain. The data is managed through a dedicated dashboard page and persisted to
a file that is intentionally **separate from the pack** so that
engagement-level organisational data does not pollute the distributable
doctrine artefacts.

---

## Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-001 | System provides `GET /api/org-bindings` returning all bindings from `config/org-bindings.yaml`; returns `[]` when the file is absent | proposed |
| FR-002 | System provides `POST /api/org-bindings` to create a binding; server assigns a stable ULID `id`; persists to `config/org-bindings.yaml` atomically | proposed |
| FR-003 | System provides `PUT /api/org-bindings/:id` to replace a binding by id; persists atomically | proposed |
| FR-004 | System provides `DELETE /api/org-bindings/:id` to remove a binding; persists atomically | proposed |
| FR-005 | `POST` and `PUT` validate `domain_id` exists in `config/domain-config.yaml`; return HTTP 400 on unknown domain | proposed |
| FR-006 | `POST` and `PUT` validate `accountability` is one of R, A, C, I; return HTTP 400 otherwise | proposed |
| FR-007 | `POST` and `PUT` validate `spoc`: if value contains `@`, it must match `.*@regnology\.net`; return HTTP 400 otherwise | proposed |
| FR-008 | `GET /api/org-bindings` marks bindings whose `domain_id` is absent from `domain-config.yaml` with `orphaned: true` | proposed |
| FR-009 | Dashboard page at `/org-bindings` renders all bindings as branded `ks-card` elements grouped by domain | proposed |
| FR-010 | Orphaned binding cards render with danger styling and offer cascade-delete and rebind remediation actions | proposed |
| FR-011 | Create/edit inline form validates all fields client-side before submitting; SPOC `@`-containing values checked against `@regnology.net` | proposed |
| FR-012 | Delete action shows a confirmation prompt before calling `DELETE /api/org-bindings/:id` | proposed |
| FR-013 | RACI badges use colour coding: R=green, A=petrol, C=amber, I=grey | proposed |
| FR-014 | Domain detail page (`/domain/:id`) displays an Accountability sub-section listing all bindings for that domain | proposed |
| FR-015 | Dashboard domain cards include a `→ Bindings` chip-link navigating to `/org-bindings?domain=<id>` | proposed |
| FR-016 | Sidebar Navigation section includes an *Organisational Bindings* link to `/org-bindings` | proposed |
| FR-017 | `config/domain-config.yaml` and `config/artifact-tags.yaml` are migrated from `docs/`; server reads both via `getConfigRoot()` | proposed |
| FR-018 | `getConfigRoot()` added to server `config.ts`; overridable via `CONFIG_ROOT` environment variable | proposed |
| FR-019 | Application header/title updated to *Doctrine Organisational Management Dashboard* | proposed |
| FR-020 | `config/org-bindings.yaml` is never created inside `pack/`; file placement follows the convention in `docs/SURFACES.md` | proposed |
| FR-021 | `config/artifact-tags.yaml` entries accept an optional `primary_domain` field; its value must be a member of the same entry's `domains` array; server returns HTTP 400 if violated | proposed |
| FR-022 | `GET /api/artifact-tags/:id` response includes `primary_domain` when set | proposed |
| FR-023 | Artifact detail page shows a **Primary Accountability** section: [A]-role bindings from the primary domain rendered prominently; if no `primary_domain` is set, a muted "No primary domain designated" notice is shown instead | proposed |
| FR-024 | Bindings from non-primary domains are shown beneath Primary Accountability in a visually subdued style, labelled **Secondary / informational** | proposed |
| FR-025 | The domain-tagging edit surface allows setting and clearing `primary_domain` via a dropdown constrained to the artifact's current `domains` selection | proposed |

---

## 2. Scope

### In scope

- New data model: `OrgBinding` record (see §4).
- New storage file: `config/org-bindings.yaml` — repo-local, not under
  `pack/`; committed to git (see §4.3).
- New server-side service and REST routes for CRUD on org-bindings.
- New dashboard page **"Organisational Bindings"** at route `/org-bindings`.
- New sidebar menu item under the **Navigation** group: *Organisational
  Bindings*.
- The page allows:
  - Viewing all existing domain bindings in a branded card grid.
  - Creating a new binding (inline form).
  - Editing an existing binding (inline form).
  - Deleting a binding with confirmation.
  - Handling orphaned bindings (domain no longer in `domain-config.yaml`) with
    a visible warning and options to cascade-delete or rebind (see §5.4).
- Domain selector in the form uses the existing domain vocabulary as a
  dropdown.
- The existing **Domain overview page** (`/domain/:id`) surfaces RACI bindings
  for that domain beneath the domain description.
- Domain cards on the dashboard link to the bindings page (no inline detail).
- Application rename: the app header/title is updated to
  *Doctrine Organisational Management Dashboard* (see §10).

### In scope (addition)

- `primary_domain` field on artifact-tag entries: designation, validation, persistence, and visual resolution of primary vs secondary RACI accountability on the artifact detail page.

### Out of scope

- Creating or editing domain definitions (`domain-config.yaml` management).
- Bulk import / CSV upload of bindings.
- Authentication or role-based access control.
- RACI conflict detection across bindings.
- Integration with external HR or directory services.
- Email delivery or verification of the SPOC address.

---

## 3. User stories

| ID | As a… | I want to… | So that… |
|----|--------|-----------|----------|
| US-01 | Team lead | See all department/SPOC bindings for every doctrine domain | I know who to contact when a domain's artefacts need review |
| US-02 | Team lead | Record the type of accountability (R/A/C/I) for each domain–department pair | Stakeholders understand the engagement model clearly |
| US-03 | Team lead | Add a rationale note per binding | Future team members understand why a particular party is involved |
| US-04 | Team lead | Edit or remove a binding | The records stay accurate as the engagement evolves |
| US-05 | Any user | See all bindings at a glance in the dashboard | No file editing is required to review accountability state |
| US-06 | Any user | See the RACI bindings for a domain on the domain detail page | Context is available without navigating away |
| US-07 | Team lead | Be alerted when a binding references a deleted domain | Orphaned data can be repaired immediately |

---

## 4. Data model

### 4.1 `OrgBinding` record

```yaml
schema_version: "1.0"
bindings:
  - id: "01KSPTPR-abc123"              # server-assigned ULID; stable; never reused
    domain_id: "engineering"            # FK → docs/domain-config.yaml[].id
    department: "Professional Services" # free-text; owning department name
    spoc: "jane.doe@regnology.net"      # display name, email, or mailing list
    accountability: "A"                 # RACI role: R | A | C | I
    involvement: >                      # optional free-text rationale
      Accountable for delivery quality of all engineering artefacts produced
      under PS engagements.
```

### 4.2 Cardinality

The relationship is **many-to-many**: a single domain may have multiple
bindings (e.g. `R` from engineering staff, `A` from the delivery team), and a
single department/SPOC may appear across multiple domains. There is no
uniqueness constraint on `(domain_id, accountability)` pairs — duplicate RACI
roles on the same domain are allowed by design.

### 4.3 RACI role vocabulary

| Code | Role | Meaning | Badge colour |
|------|------|---------|-------------|
| `R` | Responsible | Does the work; creates or maintains the domain artefacts | green |
| `A` | Accountable | Signs off; single owner; escalation target | petrol |
| `C` | Consulted | Provides input before decisions are made | amber |
| `I` | Informed | Kept up to date; no decision authority | grey |

### 4.4 SPOC field validation

The field accepts free text (e.g. a display name, a role title, or a mailing
list alias). If the value contains `@`, a regex check confirms the domain is
`.*@regnology\.net`. No verification email is sent. Non-`@regnology.net`
email-shaped values are rejected at save time with an inline error message.
Plain text values (no `@`) are accepted without further validation.

### 4.5 Storage location

`config/org-bindings.yaml` at the repository root (see §11). This file is
committed to git and is **not** inside `pack/`. It will **not** be distributed
via `spec-kitty doctrine fetch`. The server locates it via a new
`getConfigRoot()` helper, overridable by a `CONFIG_ROOT` environment variable.
`docs/domain-config.yaml` and `docs/artifact-tags.yaml` migrate to `config/`
in the same mission (§11.2).

### 4.6 Orphaned bindings

A binding whose `domain_id` no longer exists in `domain-config.yaml` is
considered **orphaned**. The server returns orphaned bindings from `GET
/api/org-bindings` with an additional `orphaned: true` flag. The UI renders
them in the card grid with a danger border and a warning banner offering two
remediation actions:

1. **Cascade delete** — remove the binding permanently.
2. **Rebind** — change the `domain_id` to a valid domain via the edit form.

---

## 5. API surface

All routes are mounted under `/api/org-bindings`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/org-bindings` | Return all bindings; orphaned bindings include `orphaned: true` |
| `POST` | `/api/org-bindings` | Create a new binding; server assigns `id` |
| `PUT` | `/api/org-bindings/:id` | Replace a binding by id |
| `DELETE` | `/api/org-bindings/:id` | Remove a binding by id |

Request/response bodies use the `OrgBinding` schema (§4.1) without the
`schema_version` wrapper. The server validates:

- `domain_id` exists in `domain-config.yaml` (HTTP 400 if not, except for
  `PUT` on an already-orphaned binding where the intent is rebinding).
- `accountability` is one of `R`, `A`, `C`, `I` (HTTP 400 otherwise).
- `spoc` passes the `@regnology.net` regex if it contains `@` (HTTP 400
  otherwise).
- `department` is non-empty and ≤ 120 chars.
- `involvement` is ≤ 800 chars if provided.

---

## 6. UI — Organisational Bindings page (`/org-bindings`)

### 6.1 Layout

```
[ Organisational Bindings ]              [ + New binding ]
────────────────────────────────────────────────────────
  ⚠ 1 orphaned binding — domain "legacy-ops" was removed.
  [Cascade delete]  [Review]

Card grid (auto-fill, minmax 260 px):

┌─────────────────────────────────────────┐
│  [A] Accountable         Engineering    │
│  🏢 Professional Services               │
│  ✉  ps-lead@regnology.net              │
│                                         │
│  "Accountable for delivery quality…"    │
│                                [Edit] [✕]│
└─────────────────────────────────────────┘
```

- Cards use `ks-card` with the domain's accent colour.
- RACI badge is a pill using the colours from §4.3.
- Orphaned cards render with `ks-card--red` and an "orphaned domain" label.
- Edit opens the inline form pre-populated; delete shows a confirmation prompt.

### 6.2 Create / Edit form (inline panel)

| Field | Control | Validation |
|-------|---------|-----------|
| Domain | `<select>` from domain config | Required |
| Department | Text input | Required, ≤ 120 chars |
| SPOC | Text input | Required; if contains `@`, must match `@regnology.net` |
| Accountability | Radio group R / A / C / I with full labels | Required |
| Involvement / rationale | Textarea | Optional, ≤ 800 chars |

Form has **Save** and **Cancel** buttons. On save: `POST` (create) or `PUT`
(edit). On success the form closes and the card grid refreshes reactively.

### 6.3 Domain detail page (`/domain/:id`) additions

Below the existing domain description and artefact table, add a
**Accountability** sub-section listing all bindings for this domain in a
compact table:

| Department | SPOC | Role | Involvement |
|------------|------|------|-------------|
| Professional Services | ps-lead@regnology.net | [A] Accountable | … |

If there are no bindings, show a muted "No accountability bindings recorded."

### 6.4 Dashboard domain cards

The domain cards on the dashboard `/` page grow a small `→ Bindings` chip-link
that navigates to `/org-bindings?domain=<id>`. No inline RACI detail is shown
on the card itself.

### 6.5 Navigation

*Organisational Bindings* is added to the **Navigation** sidebar section,
between *Dashboard* and the artefact groups.

---

## 7. File layout of new artefacts

```
config/                          ← new top-level directory (committed to git)
  domain-config.yaml             ← moved from docs/domain-config.yaml
  artifact-tags.yaml             ← moved from docs/artifact-tags.yaml
  org-bindings.yaml              ← new; initially: schema_version: "1.0"\nbindings: []

tools/pack-dashboard/
  server/src/
    models/
      org-binding.model.ts       ← OrgBinding interface, RaciRole enum
    services/
      org-bindings.service.ts    ← CRUD + orphan detection; atomic writes
    routes/
      org-bindings.routes.ts     ← Express router (/api/org-bindings)
    config.ts                    ← add getConfigRoot() + CONFIG_ROOT env var;
                                    migrate domain-config and artifact-tags
                                    lookups from getDocsRoot() → getConfigRoot()
  src/app/
    models/
      org-binding.model.ts       ← client-side interface + RaciRole type
    services/
      org-bindings.service.ts    ← Angular HttpClient service
    pages/
      org-bindings/
        org-bindings.component.ts  ← grid + inline form + orphan banner
```

Existing files modified:

- `tools/pack-dashboard/server/src/config.ts` — add `getConfigRoot()`, migrate
  `domain-config.yaml` and `artifact-tags.yaml` reads to `CONFIG_ROOT`.
- `tools/pack-dashboard/server/src/index.ts` — mount org-bindings router.
- `tools/pack-dashboard/server/src/services/domain-tags.service.ts` — use
  `getConfigRoot()` instead of `getDocsRoot()`.
- `tools/pack-dashboard/server/src/routes/domain-config.routes.ts` — same.
- `tools/pack-dashboard/src/app/app.routes.ts` — add `/org-bindings` route.
- `tools/pack-dashboard/src/app/layout/sidebar.component.ts` — add nav item.
- `tools/pack-dashboard/src/app/pages/domain-artifacts/domain-artifacts.component.ts`
  — add Accountability sub-section.
- `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts` — add
  `→ Bindings` chip to domain cards.

---

## 8. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-01 | `GET /api/org-bindings` returns `[]` for a fresh file with no entries |
| AC-02 | `POST` with valid payload creates a binding and persists it to `config/org-bindings.yaml` |
| AC-03 | `POST` with an unknown `domain_id` returns HTTP 400 |
| AC-04 | `POST` with a SPOC containing `@` outside `@regnology.net` returns HTTP 400 |
| AC-05 | `PUT /:id` updates the binding; changes survive a server restart |
| AC-06 | `DELETE /:id` removes the binding from the YAML file |
| AC-07 | `GET` returns orphaned bindings with `orphaned: true` when the referenced domain has been removed |
| AC-08 | The `/org-bindings` page renders all bindings as branded `ks-card` elements |
| AC-09 | Orphaned binding cards render with a danger border and remediation options |
| AC-10 | Creating a binding via the form calls `POST` and shows the new card without a page reload |
| AC-11 | Editing a binding via the form calls `PUT` and the card updates in place |
| AC-12 | Deleting a binding shows a confirmation prompt and calls `DELETE` on confirmation |
| AC-13 | The domain selector in the form is populated from the existing domain vocabulary |
| AC-14 | `config/org-bindings.yaml` is never created inside `pack/` |
| AC-15 | The sidebar shows *Organisational Bindings* linking to `/org-bindings` |
| AC-16 | RACI badges display correct colours per role (R=green, A=petrol, C=amber, I=grey) |
| AC-17 | `/domain/:id` shows an Accountability sub-section listing the domain's bindings |
| AC-18 | Dashboard domain cards include a `→ Bindings` link |
| AC-19 | The app title/header reads *Doctrine Organisational Management Dashboard* |
| AC-20 | `config/domain-config.yaml` and `config/artifact-tags.yaml` exist; `docs/domain-config.yaml` and `docs/artifact-tags.yaml` are removed |
| AC-21 | All dashboard server routes continue to function after the file migration (domain config, artifact tags, org-bindings all read from `config/`) |
| AC-22 | `PUT /api/artifact-tags/:id` with `primary_domain` set to a value absent from `domains` returns HTTP 400 |
| AC-23 | `PUT /api/artifact-tags/:id` with valid `primary_domain` persists the field; subsequent `GET` returns it |
| AC-24 | Artifact detail page shows the [A]-role binding for the primary domain in the Primary Accountability section |
| AC-25 | Artifact detail page shows secondary domain bindings in subdued style when a primary domain is set |
| AC-26 | Artifact detail page shows "No primary domain designated" when `primary_domain` is absent |
| AC-27 | Domain-tagging UI `primary_domain` dropdown is constrained to the artifact's current `domains` selection |

---

## 9. Non-functional requirements

- File writes use the atomic write pattern (write to `.tmp`, then `rename`)
  already established in `domain-tags.service.ts`.
- No new npm/pip dependencies beyond what already exists in the project.
- All TypeScript compiles without errors under the existing `tsconfig.json`.
- Styling uses existing `ks-card`, `dash-section-heading`, and Regnology brand
  tokens; no new CSS custom properties.
- `GET /api/org-bindings` returns HTTP 200 with `[]` when
  `config/org-bindings.yaml` does not exist (fresh clone scenario).

---

## 10. Application rename

The dashboard application is renamed from *Pack Governance Dashboard* to
**Doctrine Organisational Management Dashboard**. The term "governance" is
reserved for enterprise-level strategic oversight in the Regnology glossary;
"organisational management" more accurately describes the dashboard's scope.

Changes required by the rename:
- `tools/pack-dashboard/src/app/layout/header.component.ts` — update title.
- `tools/pack-dashboard/src/app/pages/dashboard/dashboard.component.ts` —
  update `<h2>` heading.
- `docs/engineering_notes/` and any README references can be updated as
  opportunistic clean-up (not a blocking criterion).

---

## 11. Directory convention and config migration

### 11.1 Canonical directory roles

| Directory | Purpose |
|-----------|---------|
| `docs/` | **Documentation only.** Human-readable engineering notes, ADRs, HOW_TO_USE guides. No configuration files. |
| `pack/` | **Shippable doctrine artefacts.** Distributed via `spec-kitty doctrine fetch`. |
| `config/` | **Dashboard / enrichment configuration.** Non-shippable YAML files that configure or enrich the management dashboard at engagement level. |
| `work/` | Gitignored orchestration workspace. |

### 11.2 Files to migrate as part of this mission

The introduction of `getConfigRoot()` creates the right moment to relocate
existing mis-placed files. The following are dashboard configuration, not
documentation:

| Current path | Target path |
|---|---|
| `docs/domain-config.yaml` | `config/domain-config.yaml` |
| `docs/artifact-tags.yaml` | `config/artifact-tags.yaml` |

Both files are currently read via `getDocsRoot()` in the server. After the
migration they will be read via `getConfigRoot()` instead. The `DOCS_ROOT`
env var continues to serve only true documentation roots; `CONFIG_ROOT`
defaults to `<repo-root>/config`.

This migration is **in scope** for this mission — it is a pre-condition for
`getConfigRoot()` being internally consistent, and the blast radius is small
(two files, two service references, one env var addition).
