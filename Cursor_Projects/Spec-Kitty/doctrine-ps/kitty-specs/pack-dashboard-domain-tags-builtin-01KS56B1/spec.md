# Pack Dashboard — Domain Tags and Built-in Doctrine

**Mission ID:** 01KS56B1RXDA4JCMAZ6T4NHJ20
**Mission slug:** pack-dashboard-domain-tags-builtin-01KS56B1
**Target branch:** overhaul/migrate_to_kitty
**Mission type:** software-dev
**Date:** 2026-05-21
**Author:** Stijn Dejongh / Claude Sonnet 4.6

---

## Intent Summary

The Pack Governance Dashboard currently exposes no cross-cutting navigation axis beyond artifact
kind. Two features are needed:

1. **Functional Domain Tags** — a metadata layer that lets users classify artifacts by organisational
   domain (security, engineering, governance, etc.), stored separately from artifact YAML content
   so the schema and classification concerns remain independent. Editable through the dashboard UI,
   validated against a controlled vocabulary.

2. **Spec-Kitty Built-in Doctrine** — the effective governance set an agent operates under is
   the union of the org-pack and the platform built-ins. The dashboard currently only shows the
   pack half. Surfacing the built-ins (read-only) allows users to understand the full effective set
   and write relationship calls (`specializes_from`, `enhances`, `overrides`) without needing to
   know built-in IDs by heart.

**Primary actor:** Governance dashboard user (pack author / governance reviewer).
**Trigger:** User wants to navigate artifacts by domain, or wants to understand how pack artifacts
relate to platform defaults.
**Desired outcome:** Domain chips on artifact list/detail pages with editable tagging; a collapsible
"By Domain" section on the dashboard; built-in artifacts visible in kind-list pages and doctrine
overview; `specializes_from/enhances/overrides` references in structured view resolve with context
to the source built-in artifact.

**Key constraint:** Built-in artifacts are never writable through the dashboard. Domain
classification is stored separately from artifact YAML to avoid cross-repo schema alignment with
spec-kitty.

**Key decision (recorded):** Pack coverage ratio (org-pack vs built-ins) is shown on kind-list
pages only — not on the main dashboard — to avoid pressure to override every built-in.

**Resolved decision (01KS56EX82C5PWC3770N9ED3HK):** Untagged artifacts do not surface a warning
on the dashboard. Users discover untagged artifacts by browsing. No counter or banner is shown.

[NEEDS CLARIFICATION: Superseded by resolved decision 01KS56EX82C5PWC3770N9ED3HK above — answer is no-never, no warning shown.] <!-- decision_id: 01KS56BAANKS5G19AM79ECKH8C -->

---

## Scope Boundaries

**In scope:**
- Domain tag vocabulary YAML file + artifact-to-domain mapping YAML file
- GET /PUT server API for domain config and artifact tags
- Domain chip components (read-only and editable variants)
- Domain column on artifact list pages; editable chips on artifact detail pages
- "By Domain" collapsible section on the dashboard
- Built-in artifact scanner reading from `SPEC_KITTY_SRC/doctrine/`
- Read-only GET /api/builtin routes
- Built-in collapsible table on kind-list pages (non-navigable to edit)
- Read-only built-in detail view with banner
- Client-side built-in ID resolution in StructuredViewComponent
- Platform Defaults section in dashboard (counts only, no coverage ratio)
- YAML editor visible and editable on the artifact detail page (FR-016)

**Out of scope:**
- Organizational charter editor (separate future mission)
- Charter-to-pack consistency checks
- Interview wizard
- Writing to built-in artifacts
- Domain tag inference / auto-classification

---

## Functional Requirements

| ID | Status | Description |
|----|--------|-------------|
| FR-001 | proposed | The server reads `docs/domain-config.yaml` and exposes it at `GET /api/domain-config` as `{ domains: DomainConfig[] }`. If the file is absent, the endpoint returns `{ domains: [] }` (HTTP 200) rather than 500, so the tagging flow degrades gracefully. |
| FR-002 | proposed | `docs/domain-config.yaml` contains a `schema_version: "1"` field and a `domains:` list with `id`, `label`, `description`, and optional `color` per entry. Starter vocabulary: engineering, security, communications, governance, devops, quality, architecture, research, tooling, delivery, brand-alignment, design. |
| FR-003 | proposed | The server reads `docs/artifact-tags.yaml` and exposes it at `GET /api/artifact-tags` as `{ tags: Record<string, { domains: string[] }> }`. |
| FR-004 | proposed | `docs/artifact-tags.yaml` contains a `schema_version: "1"` field and a `tags:` map from artifact ID to `{ domains: string[] }`. Missing keys mean untagged. |
| FR-005 | proposed | `PUT /api/artifact-tags/:id` accepts `{ domains: string[] }`, validates each domain ID against `domain-config.yaml`, writes the entry back to `artifact-tags.yaml`, and returns 204 on success or 422 with an error message on unknown domain ID. |
| FR-006 | proposed | The frontend has a `DomainService` with methods `getConfig()`, `getTags()`, and `setTags(id, domains[])`. |
| FR-007 | proposed | The frontend has a `DomainChipsComponent` rendering domain tags as coloured chips. Read-only variant for list pages; multi-select editable variant for detail pages. |
| FR-008 | proposed | Each artifact kind list page shows a domain chips column for each artifact row. |
| FR-009 | proposed | The artifact detail page shows an editable domain chip selector below the kind header. Changes are saved via `PUT /api/artifact-tags/:id`. |
| FR-010 | proposed | The dashboard includes a collapsible "By Domain" section listing each domain with its artifact count and the artifact IDs classified under it. |
| FR-011 | proposed | The server scans `SPEC_KITTY_SRC/doctrine/` using the same file-walk pattern as the pack scanner and exposes the results at `GET /api/builtin` (all kinds), `GET /api/builtin/:kind` (per kind), and `GET /api/builtin/:kind/:id` (single artifact). All three routes are read-only; the existing `PUT /api/artifacts/:kind/:id` route must not be extended to built-in paths. |
| FR-012 | proposed | `ArtifactSummary` objects returned for built-in artifacts include `source: 'builtin'` to distinguish them from pack artifacts. |
| FR-013 | proposed | Each artifact kind list page includes a collapsible "Platform Defaults" table below the pack artifact table, showing built-in artifacts for that kind. Rows are non-navigable (no edit link). A `source` badge distinguishes built-in rows from pack artifact rows. |
| FR-014 | proposed | A read-only detail view is available at `/artifacts/builtin/:kind/:id`. The YAML editor is locked (`readOnly: true`). A banner reads: "This is a spec-kitty built-in artifact. It cannot be edited here. To specialize or override it, create a new artifact in the pack." |
| FR-015 | proposed | `StructuredViewComponent` resolves `specializes_from`, `enhances`, and `overrides` field values against both the pack artifact map and the built-in artifact map. Built-in matches render as a distinct chip variant (`sv-chip--builtin-ref`, `sv-chip--builtin-specializes-ref`, or `sv-chip--builtin-override-ref`) with a `routerLink` to the read-only detail view. |
| FR-016 | proposed | The artifact detail page displays the YAML content in the `YamlEditorComponent`. The editor is mutable for pack artifacts (save and revert buttons are active). Editing and saving round-trips through the server and persists to disk. |
| FR-018 | proposed | The YAML Content section on the artifact detail page is collapsed by default and can be expanded by the user via a disclosure toggle. The Structured View remains always visible. |
| FR-017 | proposed | The dashboard includes a "Platform Defaults" section (collapsed or minimal) in the doctrine overview area showing the built-in artifact count per kind. No pack-coverage ratio is shown at the dashboard level. |

---

## Non-Functional Requirements

| ID | Status | Description | Threshold |
|----|--------|-------------|-----------|
| NFR-001 | proposed | Server response time for all new `/api/domain-*` and `/api/builtin` routes. | p95 < 400 ms under normal local dev load |
| NFR-002 | proposed | The `PUT /api/artifact-tags/:id` route must be idempotent — calling it twice with the same body leaves `artifact-tags.yaml` in the same state. | Verified by test |
| NFR-003 | proposed | The built-in scanner must not throw if `SPEC_KITTY_SRC` is not set or the path does not exist; it returns an empty result and logs a warning. | Verified by test |
| NFR-004 | proposed | Domain chip colours meet WCAG AA contrast (4.5:1 for normal text) against their background. | Verified against the design system token values |

---

## Constraints

| ID | Status | Description |
|----|--------|-------------|
| C-001 | accepted | Built-in artifacts must never be writable through the dashboard API or UI. |
| C-002 | accepted | Domain classification (artifact-tags.yaml) is stored separately from artifact YAML content. Artifact schemas are not modified. |
| C-003 | accepted | The domain vocabulary (`domain-config.yaml`) is the only allowed source of truth for valid domain IDs. The server rejects unknown IDs with 422. |
| C-004 | accepted | Pack coverage ratio (built-ins with org-pack companions) is displayed on kind-list pages only, not on the main dashboard. |
| C-005 | accepted | Built-in ID resolution in StructuredViewComponent is client-side (Option B): the frontend loads the full built-in map on app init and resolves references locally. No additional server round-trip per chip. |
| C-006 | accepted | The frontend is Angular 18 standalone components. New components follow the same standalone pattern as existing components in `tools/pack-dashboard/src/app/`. |
| C-007 | accepted | The server is Express + TypeScript in `tools/pack-dashboard/server/src/`. New routes follow the same pattern as existing routes in `routes/`. |

---

## Domain Language

| Term | Definition |
|------|------------|
| Domain tag | An organisational classification label for an artifact (e.g., `security`, `engineering`). Stored in `docs/artifact-tags.yaml`. |
| Domain vocabulary | The controlled set of allowed domain IDs. Defined in `docs/domain-config.yaml`. |
| Built-in artifact | A governance artifact shipped with spec-kitty as a platform default. Located at `SPEC_KITTY_SRC/doctrine/`. Read-only from the dashboard's perspective. |
| Pack artifact | An org-pack governance artifact in the local `pack/` directory. Editable through the dashboard. |
| Effective governance set | The union of pack artifacts and built-in artifacts that governs agent behaviour in an engagement. |
| `specializes_from` | A relationship field on a pack artifact pointing at a built-in artifact that it narrows or extends. |
| `enhances` | A relationship field indicating the pack artifact adds optional behaviour on top of the referenced artifact. |
| `overrides` | A relationship field indicating the pack artifact replaces the referenced built-in artifact's rules. |

---

## Recommended Work Package Sequence

```
WP01  domain-config.yaml file + GET /api/domain-config
WP02  artifact-tags.yaml file + GET/PUT /api/artifact-tags
WP03  DomainService + DomainChipsComponent (read-only) + kind-list page column
WP04  Editable domain chip selector on artifact detail page
WP05  "By Domain" collapsible section on dashboard
  ↓
WP06  Built-in scanner service (server, reads SPEC_KITTY_SRC/doctrine/)
WP07  GET /api/builtin routes (all, per-kind, single artifact)
WP08  Built-in collapsible table on kind-list pages + source badge
WP09  Read-only built-in detail view (/artifacts/builtin/:kind/:id)
WP10  Built-in chip resolution in StructuredViewComponent
WP11  Platform Defaults section on dashboard (counts, no coverage ratio)
```

WP01–02 (tag storage), WP06–07 (built-in server foundation) can run in parallel.
WP03–05 depend on WP01–02. WP08–11 depend on WP07.

---

## Reference Material

- `docs/engineering_notes/2026-05-21-pack-dashboard-next-features.md` — full design proposal
  including API shapes, storage layout, option analysis, and dark-mode fix record.
- `tools/pack-dashboard/` — Angular 18 frontend + Express/TypeScript server.
- `tools/pack-dashboard/server/src/routes/` — existing route patterns to follow.
- `tools/pack-dashboard/src/app/services/` — existing service patterns.
- `tools/pack-dashboard/src/app/models/` — ArtifactKind, ArtifactDetail interfaces.
- `forks/spec-kitty/src/doctrine/` — built-in artifact source for the scanner.
- Regnology design system: `tools/pack-dashboard/src/assets/css/regnology-web.css`
  and `docs/engineering_notes/2026-05-21-dagmar-ui-brand-review.md`.
