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

# Engineering Note: Pack Dashboard — Next Feature Set

_Version: 1.0.0_
_Date: 2026-05-21_
_Author: Stijn Dejongh / Claude Sonnet 4.6_
_Status: Proposal — decisions required on sections marked [DECISION NEEDED]_

---

## Context

This note captures the design and implementation plan for three feature areas that follow the
`pack-governance-dashboard-01KS2WM1` mission:

1. **Functional Domain Tags** — a metadata layer for classifying artifacts by domain, stored
   separately from artifact content and editable through the dashboard UI.
2. **Spec-Kitty Built-in Doctrine** — surfacing the platform's built-in governance artifacts
   in a read-only section of the dashboard, enabling visibility into the full effective governance
   set and simplifying the authoring of relationship calls (`specializes_from`, `enhances`,
   `overrides`).
3. **Organizational Charter** _(out of scope for now — structural note only)_.

It also records the decision on the dark mode background fix applied at the end of the
`pack-governance-dashboard` mission.

---

## 1. Functional Domain Tags

### 1.1 Motivation

Artifacts in the pack span a broad functional surface. Without a tagging layer, the only
navigation axes are artifact _kind_ (the 8 structural categories) and _ID_. Domain tags add
a cross-cutting classification that allows users to ask "what governs my security posture?"
or "what applies to how we communicate?" without knowing artifact IDs up front.

Tags are kept separate from artifact YAML content because:
- Artifact schemas are owned by spec-kitty; adding `domains:` fields requires cross-repo
  schema alignment and would invalidate existing artifacts at the pack level.
- Domain classification is an _organizational opinion_, not a property of the artifact's
  governance contract. It changes as the organization's structure changes, not when the
  artifact's content changes.
- The separation allows the allowed-tag vocabulary to evolve independently without touching
  artifact files.

### 1.2 Proposed Starter Domain Set

Derived from the current pack artifact titles and themes:

| Tag | Description | Sample artifacts |
|-----|-------------|-----------------|
| `engineering` | Software design, implementation, testing, and refactoring | Architectural Integrity Standard, Test-First Development, Boy Scout Rule, refactoring tactics |
| `security` | AppSec, vulnerability management, secure design | AppSec Compliance, Encryption & Data Classification, Secure Design Checklist, OWASP principles |
| `communications` | Writing, branding, presentation, tone | Professional Communications, Regnology Branding, Audience-Oriented Writing, Slidedeck Stanislav |
| `governance` | Decision traceability, doctrine management, ADR hygiene | Traceable Decisions, Decision Reference Types, Doctrine Versioning Requirement |
| `devops` | Version control, CI/CD, pipeline configuration | Version Control Hygiene, Commit & Markdown Linting, SonarQube / Maven procedures |
| `quality` | Review, validation, acceptance testing | AppSec Impact Assessment, Code Review tactics, Quality Gate Verification |
| `architecture` | System design, domain modeling, boundary definition | Architectural Integrity Standard, Domain-Driven Design paradigm, C4 modeling |
| `research` | Investigation, learning loops, retrospectives | Reflection Post-Action Loop, Safe-to-Fail Experiment Design, Annual Governance Retrospective |
| `tooling` | Specific tool and platform guidance | Regnology MCP, Agentic Model Leaderboard, Google Cloud MCP, Contextive |
| `delivery` | Project execution, planning, work-package hygiene | Clarification Before Execution, PO Decision, Weekly/Quarterly triage procedures |

> **Note:** The starter set is intentionally coarse-grained. Tags should map to the audiences
> (engineering teams, governance boards, communication teams) rather than to technology stacks.
> Technology-specific sub-tagging (e.g., `java`, `python`) belongs on individual artifact IDs,
> not in the domain vocabulary.

### 1.3 Storage Layout

Two YAML files live under `docs/`:

```
docs/
  domain-config.yaml       ← allowed tag vocabulary + descriptions
  artifact-tags.yaml       ← artifact-id → domains mapping
```

**`docs/domain-config.yaml`** (vocabulary, human-edited only):

```yaml
schema_version: "1"
domains:
  - id: engineering
    label: Engineering
    description: Software design, implementation, testing, and refactoring practices.
    color: blue
  - id: security
    label: Security
    description: AppSec, vulnerability management, and secure-by-design patterns.
    color: red
  # … one entry per tag
```

The `color` hint is optional UI metadata; the dashboard maps it to a chip colour class.

**`docs/artifact-tags.yaml`** (classification, editable via dashboard UI):

```yaml
schema_version: "1"
tags:
  appsec-compliance:
    domains: [security, governance]
  regnology-branding:
    domains: [communications]
  professional-communications:
    domains: [communications]
  commit-and-markdown-linting:
    domains: [devops, engineering]
  traceable-decisions:
    domains: [governance]
  # artifact-id: null entry means no tags assigned yet
```

Keys are artifact `id` values (not titles or file paths). Missing keys = untagged.

### 1.4 Server API

Add to `tools/pack-dashboard/server/src/routes/`:

| Method | Path | Body / Params | Response |
|--------|------|---------------|----------|
| `GET` | `/api/domain-config` | — | `{ domains: DomainConfig[] }` |
| `GET` | `/api/artifact-tags` | — | `{ tags: Record<string, { domains: string[] }> }` |
| `PUT` | `/api/artifact-tags/:id` | `{ domains: string[] }` | `204` / `422` on unknown tag |

The PUT handler must:
1. Validate each domain ID against `domain-config.yaml` (return 422 with error message on unknown tag).
2. Write only the changed entry back to `artifact-tags.yaml` (full-file rewrite acceptable for
   current scale, ~100 artifacts).
3. Refuse domains not present in the allowed vocabulary.

### 1.5 Frontend Changes

**Models** (`src/app/models/`):
- Add `DomainConfig` and `ArtifactTags` interfaces.
- Extend `ArtifactDetail` with `domains?: string[]` (merged by the server from `artifact-tags.yaml`).

**Services**:
- `DomainService` — `getConfig()`, `getTags()`, `setTags(id, domains[])`.

**Components**:
- `DomainChipsComponent` — renders domain tags as coloured chips. Read-only variant for list
  pages; editable multi-select variant for detail pages.
- Artifact list page: show domain chips column.
- Artifact detail page: show editable domain chips below the kind header.
- Dashboard: add a "By Domain" section (collapsible, like Doctrine Structure) listing domains with
  artifact count and a chip-cloud of artifacts per domain.

### 1.6 [DECISION NEEDED]

> Should untagged artifacts be surfaced as a dashboard warning ("X artifacts have no domain tag")?
> This would encourage completeness but may be noise during early adoption.

---

## 2. Spec-Kitty Built-in Doctrine in the Dashboard

### 2.1 Motivation

Every spec-kitty deployment loads a set of built-in artifacts before applying org-pack overrides.
The effective governance set an agent operates under is the union of:

```
Built-ins + Org Pack overrides/extensions
```

Currently the dashboard only shows the org pack half. This makes it hard to:
- See whether a pack artifact *specializes* or *enhances* a built-in without knowing the built-in
  ID by heart.
- Identify gaps (built-ins with no org-pack companion).
- Write `specializes_from` / `enhances` / `overrides` references in pack artifacts.

### 2.2 Built-in Inventory (as of spec-kitty 3.x)

The spec-kitty fork at `../forks/spec-kitty/src/doctrine/` contains:

| Kind | Built-in count |
|------|---------------|
| Directives | 13 (DIRECTIVE_001–039, non-contiguous) |
| Tactics | ~110 |
| Paradigms | 8 |
| Styleguides | 8 |
| Toolguides | 10 |
| Procedures | 13 |
| Agent Profiles | 14 |
| Mission Step Contracts | 16 |
| **Total** | **~192** |

### 2.3 Server API

The server already has `SPEC_KITTY_SRC` configured in `config.ts`. The built-in scanner
follows the same pattern as the pack scanner but reads from `SPEC_KITTY_SRC/doctrine/`:

```
GET /api/builtin               → Record<ArtifactKind, ArtifactSummary[]>
GET /api/builtin/:kind         → ArtifactSummary[]
GET /api/builtin/:kind/:id     → ArtifactDetail  (read-only)
```

Built-in artifacts are **never writable** through the dashboard. The `PUT /api/artifacts/:kind/:id`
route must not be extended to the built-in path.

The `ArtifactSummary` for a built-in includes a `source: 'builtin'` discriminant so the
frontend can render them distinctly without extra API calls.

### 2.4 Relationship Resolution

Org-pack artifacts that carry `specializes_from`, `enhances`, or `overrides` fields pointing at
a built-in ID should resolve visually in the structured view. Two approaches:

**Option A — Resolve at parse time (server-side):**
The artifact scanner checks the value of `specializes_from` / `enhances` / `overrides` fields
against the built-in ID set. Matching entries are returned as `PackRef` cells with a
`source: 'builtin'` flag. The structured view renders them with a distinct "platform default"
chip style (e.g., light grey with a lock icon).

**Option B — Resolve at render time (client-side):**
The frontend loads the built-in artifact map on app init alongside the pack artifact map. The
`StructuredViewComponent` looks up any string that matches a built-in ID in the built-in map.

Recommendation: **Option B**. The client already loads the full artifact map on init
(`ArtifactService.getAll()`). Extending that to include built-ins with `source: 'builtin'`
means zero new server logic; the structured view chip resolver handles both namespaces from
the same lookup table.

### 2.5 Frontend Changes

**Dashboard — Built-in section:**
Add a second `DoctrineOverviewComponent` instance (or a variant) below the org-pack section,
labelled "Platform Defaults (spec-kitty built-ins)". Cards are read-only (no edit navigation
link). The KPI tile shows built-in count only — no Pack Coverage tile on the dashboard
(see §2.6 decision below).

**Artifact list pages:**
Each kind list page gains a "Platform Defaults" collapsible table below the pack artifact table.
Rows are non-clickable (or navigate to a read-only detail view). A `source` badge distinguishes
them from pack artifacts.

**Artifact detail pages:**
Built-in artifacts get a read-only detail view at `/artifacts/builtin/:kind/:id`. The YAML
editor is locked (`readOnly: true`). A banner reads: "This is a spec-kitty built-in artifact.
It cannot be edited here. To specialize or override it, create a new artifact in the pack."

**Structured view chip variants:**
- `builtin-ref` cell type: existing grey `.sv-chip--builtin` chip, now with a routerLink to
  `/artifacts/builtin/:kind/:id`.
- `builtin-override-ref` cell type (for `overrides:` fields): amber chip with a ↑ icon.
- `builtin-specializes-ref` cell type (for `specializes_from:`): blue chip with a fork icon.

### 2.6 Decision: Pack Coverage placement

**Decided: show coverage per kind on the kind-list pages only — not on the dashboard.**

Rationale: surfacing a coverage ratio on the dashboard creates an implicit completeness signal
("we cover 3/13 directives") that may drive unwanted pressure to override or specialize every
built-in. The kind-list pages are the right context — the user is already scoped to a single
kind and can make a meaningful judgement about whether gaps are intentional or not.

---

## 3. Organizational Charter (Out of Scope — Structural Note)

The org charter (`pack/org-charter.yaml`) already exists and specifies which built-in directives
are required and what org-level interview defaults apply. Future work will include:

- A **Charter Editor** tab in the dashboard (alongside "Artifacts"): editable structured view
  of `org-charter.yaml` with validation against the charter schema.
- **Charter-to-pack consistency checks**: highlight required directives that exist in the charter
  but have no companion pack artifact.
- **Interview wizard**: step through the charter interview questions directly from the dashboard,
  generating or updating `org-charter.yaml`.

This is a separate mission. The dashboard architecture is already compatible — the server's
artifact scanner and YAML-write pattern apply directly to the charter file.

---

## 4. Recommended Implementation Sequence

```
WP01  Domain tag vocabulary + GET /api/domain-config
WP02  Artifact tag file + GET/PUT /api/artifact-tags
WP03  Domain chips on list and detail pages (read + edit)
WP04  "By Domain" dashboard section
  ↓
WP05  Built-in scanner service (server)
WP06  GET /api/builtin routes
WP07  Frontend: built-in artifact list sections (per kind)
WP08  Frontend: built-in detail (read-only view)
WP09  Built-in chip resolution in StructuredViewComponent
WP10  Dashboard: Platform Defaults overview section
```

WP01–04 (tags) and WP05–06 (server foundation for built-ins) can run in parallel.
WP07–10 depend on WP06.

Estimated scope: 2 spec-kitty missions of ~5 WPs each.

---

## 5. Dark Mode — Applied Fix

The main content area and page background used `var(--rn-color-bg-secondary)` and
`var(--rn-pure-white)` without a `prefers-color-scheme: dark` override.

**Fix applied (2026-05-21):** Added a `@media (prefers-color-scheme: dark)` block in
`tools/pack-dashboard/src/styles.scss` overriding the key surface variables:

```scss
@media (prefers-color-scheme: dark) {
  html, body {
    background: var(--rn-navy-dark, #01202E);
    color: var(--rn-pure-white, #fff);
  }
  .rn-main-content {
    background: var(--rn-navy-dark, #01202E);
  }
  .sv-root, .sv-card, .do-card--blue, .do-card--green, .ks-card--blue, .ks-card--green {
    background: color-mix(in srgb, var(--rn-navy-dark) 85%, white);
    border-color: rgba(255,255,255,0.12);
  }
}
```

The design system does not yet publish a full dark-mode token set; the above is a best-effort
approximation using existing petrol/navy tokens. A full dark-mode pass should be done when the
design system ships dark-mode tokens.
