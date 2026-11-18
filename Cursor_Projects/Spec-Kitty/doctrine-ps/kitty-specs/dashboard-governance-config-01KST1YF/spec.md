# Dashboard Domain & Charter Governance

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `dashboard-governance-config-01KST1YF` |
| Mission Type | software-dev |
| Target Branch | `overhaul/migrate_to_kitty` |
| Status | In Specification |

---

## Intent Summary

The Doctrine Management Dashboard currently allows users to browse, tag, and bind
doctrine artefacts to organisational domains, but provides no way to manage the
vocabulary of domains itself or to designate a subset of artefacts as the
organisation's default charter. This mission adds two self-contained governance
configuration capabilities:

1. **Domain vocabulary management** — create, edit, and delete the domain taxonomy
   that governs artefact tagging and RACI bindings, with cascading cleanup of
   dependent configuration when a domain is removed.

2. **Org charter management** — designate any pack artefact as part of the
   organisation's default charter, display a visual badge on chartered artefacts
   across the dashboard, and provide a dedicated charter view listing all
   charted artefacts.

Primary actor: doctrine curator (local, authenticated-by-default dashboard user).

---

## Scope

**In scope:**
- Domain CRUD (create / edit-in-place / delete with cascade) on the Org Bindings page
- Charter entry management: add/remove any artefact from the org charter
- Charter badge indicator on artefact cards and detail pages
- Dedicated `/charter` tab view
- Backend API and file-persistence for both features

**Out of scope:**
- Modifying `pack/org-charter.yaml` (the spec-kitty governance artifact — separate concern)
- Multi-user or remote-deployment charter synchronisation
- Bulk charter import/export
- Domain ID rename (immutable once created; create+rebind pattern covers migration)

---

## Assumptions

1. Domain IDs are treated as immutable after creation. Editing a domain changes
   only its label, description, and colour; the existing rebind endpoint handles
   the edge case where a domain must be replaced.
2. The charter is stored in `config/charter-config.yaml` — separate from
   `pack/org-charter.yaml`, which is a spec-kitty pack governance artifact and
   must not be modified by the dashboard.
3. A charter entry is identified by `artifact_id` alone; the same ID cannot appear
   twice in the charter.
4. Cascade-delete on a domain removes the domain from `domain-config.yaml`,
   all `artifact-tags.yaml` domain assignments for that domain ID, and all
   `org-bindings.yaml` entries bound to that domain ID. The user must confirm
   before the cascade executes.
5. Color values in `domain-config.yaml` are brand token names (e.g. `blue`,
   `petrol`, `amber`) from the Regnology design token system, not hex values.

---

## Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | The Org Bindings page displays a collapsible **Domain Vocabulary** panel listing all configured domains with their label, description, and colour swatch. | Approved | Must |
| FR-002 | A curator can open an inline **Add Domain** form and create a new domain by supplying a unique ID (slug), label, description, and colour token. The ID must match `^[a-z][a-z0-9-]*$` (max 64 characters); format violations return 400 distinct from the duplicate-ID 409. The system rejects duplicate IDs with a clear error message. Label and description must be plain strings; non-string values (objects, arrays) are rejected with 400. | Approved | Must |
| FR-003 | A curator can edit the label, description, and colour of an existing domain in-place. The domain ID field is read-only. Changes persist to `config/domain-config.yaml` atomically. If the domain ID does not exist, the system returns 404. Any `id` field in the request body is silently discarded server-side; the `:id` path parameter is the authoritative identifier. At least one mutable field (label, description, or color) must be present after stripping the ignored `id` field; a body containing only `id` returns 400. | Approved | Must |
| FR-004 | A curator can initiate domain deletion. Before executing, the dashboard shows a confirmation dialog listing the count of artefact-tag assignments and org-binding entries that will be removed as part of the cascade. The dialog is always shown, even when all counts are zero; zero-count text reads: "No artefact-tag assignments or org-binding entries will be removed." | Approved | Must |
| FR-005 | On confirmed deletion, the system removes the domain from `config/domain-config.yaml`, removes all matching entries from `config/artifact-tags.yaml`, and removes all matching entries from `config/org-bindings.yaml` in a best-effort sequential cascade. Each file write is individually atomic (`.tmp`-then-rename). The three renames are sequential, not simultaneous; a narrow inconsistency window between renames is accepted for local single-user use (see research.md §2). Recovery from a mid-cascade failure relies on git history — the `config/` files are committed to the repository. | Approved | Must |
| FR-006 | The dashboard exposes a dedicated **Charter** navigation tab at `/charter` listing all chartered artefacts grouped by kind (directives, tactics, procedures, etc.). Each entry shows the artefact name, kind badge, and a remove-from-charter action. | Approved | Must |
| FR-007 | Every artefact card rendered on the Browse, Directives, Tactics, Procedures, Toolguides, Styleguides, and Agent Profiles pages displays a small **charter badge** when the artefact is included in the org charter. | Approved | Must |
| FR-008 | Every artefact detail page displays a **"In Charter" toggle**. Activating the toggle adds the artefact to the org charter; deactivating removes it. The toggle reflects the current charter state on load. | Approved | Must |
| FR-009 | The backend exposes `GET /api/charter` returning the full list of chartered artefact IDs with their kind. | Approved | Must |
| FR-010 | The backend exposes `POST /api/charter` accepting `{ artifact_id, artifact_kind }` and adding the entry to the charter. `artifact_id` must match `^[A-Za-z0-9_-]{1,200}$`; invalid format returns 400 with code `INVALID_ARTIFACT_ID`. Duplicate detection normalises `artifact_id` to lowercase before comparison — `REGNOLOGY_BRANDING` and `regnology_branding` are treated as the same entry; the stored value is the lowercase-normalised form. Returns 409 Conflict if the normalised ID is already chartered. | Approved | Must |
| FR-011 | The backend exposes `DELETE /api/charter/:artifactId` removing the entry. Returns 404 if the artefact is not currently chartered. The `/charter` view must provide a remove action on all charter entries, including entries where the artefact no longer exists in the pack ("not found" indicator entries), so that orphaned entries can be removed without direct YAML editing. | Approved | Must |
| FR-012 | Charter state persists to `config/charter-config.yaml` using the atomic write pattern (write to `.tmp` then rename). The file is created on first write if absent. | Approved | Must |
| FR-013 | The `/charter` view shows a count summary ("N artefacts in charter") and is empty-state friendly when no artefacts are chartered yet. | Approved | Should |
| FR-014 | Adding or removing an artefact from the charter on the detail page updates the badge on the corresponding card in the background without a full page reload. | Approved | Should |

---

## Non-Functional Requirements

| ID | Description | Threshold | Status |
|---|---|---|---|
| NFR-001 | Domain list and charter list pages render with current data after any create/edit/delete operation without a full browser refresh. Measured as wall-clock time from API response receipt to Angular DOM update, observable in Chrome DevTools Performance panel. | Under 500 ms for packs ≤ 200 artefacts | Approved |
| NFR-002 | The cascade-delete preview (counts of affected artefact-tags and bindings) is computed and displayed before the user confirms, not after. Measured as wall-clock time from delete button click to dialog open with counts populated, observable in Chrome DevTools Network panel (one GET /cascade-preview request must complete within this window). | Under 200 ms from delete button click to dialog open | Approved |
| NFR-003 | All individual YAML config writes use the atomic `.tmp`-then-rename pattern: no partial writes are visible to concurrent reads during a single-file update. Multi-file cascade operations (domain delete) write files sequentially; a narrow inconsistency window between individual renames is accepted for local single-user use (see FR-005). | Zero observable partial-write states per individual file | Approved |
| NFR-004 | TypeScript compiles without errors; Angular production build succeeds after all changes. | Zero compilation errors | Approved |

---

## Constraints

| ID | Description | Status |
|---|---|---|
| C-001 | Domain IDs, once created, are immutable. The UI must make the ID field read-only on edit and display a tooltip explaining the constraint. Server-side: any `id` field in a PUT request body is silently discarded; the `:id` path parameter is always the authoritative domain identifier. There is no rename operation — domain ID replacement requires delete-and-recreate. | Approved |
| C-002 | Charter configuration is stored in `config/charter-config.yaml`. The file `pack/org-charter.yaml` is a spec-kitty governance artifact and must not be modified by any dashboard operation. | Approved |
| C-003 | All YAML file writes use the atomic `.tmp`-then-rename pattern. No direct `writeFileSync` to the target path for config files. | Approved |
| C-004 | No new npm or pip dependencies may be introduced without explicit justification documented in the spec or a DDR. | Approved |
| C-005 | Colour values stored in `domain-config.yaml` must be members of the exhaustive `ALLOWED_COLORS` constant defined in `tools/pack-dashboard/server/src/services/domain-tags.service.ts`. The frontend dropdown, backend validator, and API contract enum must all derive from this single source of truth — no independent copies. The current permitted set is: `blue`, `green`, `red`, `petrol`, `amber`, `purple`, `neutral`. Hex or RGB values are rejected with 400 including the permitted values list. Adding a new brand token requires updating `ALLOWED_COLORS` and regenerating dependent artifacts. | Approved |
| C-006 | The cascade-delete operation is the only way to remove a domain. There is no soft-delete or archive. Deletions are immediate and irreversible from the dashboard. Recovery from accidental deletion relies on `git revert` of the commit that changed `config/domain-config.yaml`, `config/artifact-tags.yaml`, and `config/org-bindings.yaml`. | Approved |
| C-007 | The backend server MUST bind exclusively to `127.0.0.1` (loopback interface). Remote-deployment security, multi-user auth, and network-accessible deployments are out of scope for this mission. No authentication middleware is required for the local single-user use case, provided the loopback binding is enforced. | Approved |

---

## Domain Language

| Term | Definition |
|---|---|
| **Domain** | A governance vocabulary entry in `config/domain-config.yaml`. Carries an immutable ID, label, description, and colour token. Used as a classification axis for artefact-tags and org-bindings. |
| **Charter** | The org-wide list of artefacts explicitly designated as part of the default engagement baseline, stored in `config/charter-config.yaml`. Distinct from the spec-kitty governance file `pack/org-charter.yaml`. |
| **Charter badge** | A small visual indicator on an artefact card or detail page showing the artefact is in the org charter. |
| **Cascade delete** | Deletion of a domain together with all downstream references in `artifact-tags.yaml` and `org-bindings.yaml`. |
| **Atomic write** | Write to `<file>.tmp` then `fs.renameSync(tmpPath, filePath)` — the established persistence pattern in this codebase. |

---

## Success Criteria

- A curator can add, edit, and delete a domain on the Org Bindings page without leaving the page or reloading the browser.
- Deleting a domain cascades correctly: the removed domain no longer appears in any artefact-tags or binding cards after deletion.
- Any artefact can be added to or removed from the org charter from its detail page, with the badge updating on the corresponding list card without reload.
- The `/charter` tab correctly lists all chartered artefacts, grouped by kind, with a working empty state.
- All four charter API endpoints return correct status codes and persist changes to `config/charter-config.yaml`.
- All modified YAML config files remain valid after any CRUD operation (parseable by `js-yaml`).

---

## Post-merge Remediation: Distribution Pipeline (carry-over from mission #4)

Findings from the post-merge review of `regnology-stack-distribution-pipeline-01KSWHFT` are
tracked under [MIGRATION-2505](https://jira.regnology.net/browse/MIGRATION-2505) and addressed
in WP07 of this mission.

| ID | Description | Status | Priority | Jira |
|---|---|---|---|---|
| FR-015 | Fix `Jenkinsfile` URL path duplication: remove the hardcoded `ARTEFACTORY_PATH = 'spec-kitty-packs'` environment variable and update all 4 URL construction sites (Validate, Publish, Smoke Check, Rollback) to `${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}/${filename}`. Without this fix, published archives land at `.../spec-kitty-packs/spec-kitty-packs/…` while the installer downloads from `.../spec-kitty-packs/…`. | Approved | Must | [MIGRATION-2576](https://jira.regnology.net/browse/MIGRATION-2576) |
| FR-016 | Add `set +x` before the `$ART_TOKEN` reference in the Smoke Check `sh` block, matching the defence-in-depth pattern already present in Validate, Publish, and Rollback stages. Without `set +x`, shell trace mode echoes `$ART_TOKEN` in plaintext to the Jenkins build log — a credential leak, not a hardening suggestion. | Approved | Must | [MIGRATION-2577](https://jira.regnology.net/browse/MIGRATION-2577) |
| FR-017 | Restore the `which zip \|\| apt-get install -y zip` self-healing guard in the Package stage, matching the plan. If the hard-fail approach is intentionally kept, document the deviation in the Jenkinsfile header and update the plan. | Approved | Should | [MIGRATION-2578](https://jira.regnology.net/browse/MIGRATION-2578) |
| FR-018 | Once SonarQube and CycloneDX are confirmed on the Jenkins agent: replace the `${SONAR_TOKEN:-}` empty-string expansion with a proper `withCredentials` block and remove `catchError(buildResult: 'UNSTABLE')` to make the Security Scan a hard gate. | Approved | Could | [MIGRATION-2579](https://jira.regnology.net/browse/MIGRATION-2579) |
| FR-019 | Produce the retrospective artefact for mission `regnology-stack-distribution-pipeline-01KSWHFT`. **Output**: `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml` must exist and be committed. **Done criterion**: `spec-kitty retrospect summary` exits 0 and includes mission #4. **Fallback**: if `spec-kitty retrospect create` errors, escalate — do not mark T036 done without the artefact. | Approved | Could | [MIGRATION-2580](https://jira.regnology.net/browse/MIGRATION-2580) |

> **Deployment sequencing note (WP07):** FR-015 is a production pipeline blocker — the Jenkinsfile must not be run against a live Artefactory instance until the URL path duplication is fixed. WP07 is in an independent lane (lane-g) and can be implemented in parallel with WPs 01–06, but it cannot be **deployed** independently: the mission merge gates require all 7 WPs to be approved before any lane is merged. Teams that need the Jenkinsfile fix urgently before the dashboard features are complete should consider cherry-picking the WP07 lane branch directly onto `overhaul/migrate_to_kitty` as a hotfix commit, then merging normally when the dashboard WPs complete.
