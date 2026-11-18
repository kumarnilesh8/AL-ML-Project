# Research: Dashboard Domain & Charter Governance

## 1. Domain Write API — Extend or New File?

**Decision:** Extend `domain-config.routes.ts` + `domain-tags.service.ts` rather than
creating a new service file for domain config writes.

**Rationale:** `domain-tags.service.ts` already owns the `getDomainConfig()` / `getArtifactTags()` /
`setArtifactTags()` functions and the `DomainConfig` / `DomainConfigFile` interfaces. Adding
`addDomain`, `updateDomain`, and `deleteDomain` to the same file keeps domain persistence
cohesive. The cascade logic (touching three files) is complex enough to warrant its own
`domain-cascade.service.ts` — this isolates the multi-file write concern and keeps each
service testable in isolation.

**Alternatives considered:**
- Separate `domain-config.service.ts` for all domain writes — rejected; would duplicate the
  existing interface types and `getDomainConfig()` call.

---

## 2. Multi-File Cascade Delete Atomicity

**Decision:** Write all three `.tmp` files first (domain-config, artifact-tags, org-bindings),
verify no write throws, then rename all three in sequence. Document the narrow inconsistency
window between the first and third rename as a known, accepted risk for a local-only tool.

**Rationale:** Node.js has no OS-level cross-file transaction primitive. A true atomic 3-file
update would require a WAL or journal — disproportionate for a local developer dashboard.
The write sequence is: domain-config.tmp → artifact-tags.tmp → org-bindings.tmp; then
rename domain-config → rename artifact-tags → rename org-bindings. If the server process
is killed between renames, the user can recover by re-running the delete (idempotent: the
domain no longer exists in domain-config.yaml after the first rename, so the remaining
orphaned references are caught by the existing orphan-detection logic in org-bindings).

**Chosen implementation strategy (resolved post-Alphonso review):** `domain-cascade.service.ts`
orchestrates via the existing per-file service functions rather than the three-file `.tmp` strategy:
1. Write `domain-config.yaml.tmp` → rename (via extended `domain-tags.service.ts#deleteDomain()`)
2. Write `artifact-tags.yaml.tmp` → rename (via extended `domain-tags.service.ts`)
3. Write `org-bindings.yaml.tmp` → rename (via existing `org-bindings.service.ts#cascadeDelete()`)

The three renames are sequential, not simultaneous. The narrow inconsistency window between
steps 1 and 3 is accepted for a local-only tool. If the process is killed between steps, the
domain no longer exists in `domain-config.yaml` but references survive in the other files —
these become orphans surfaced by existing orphan-detection logic.

**Alternatives considered:**
- Three-file `.tmp` strategy (write all `.tmp` then rename all) — preferred in theory but
  requires bypassing the private `writeFile()` in `org-bindings.service.ts`, creating a second
  place that writes `org-bindings.yaml`. Rejected to preserve locality of change.
- Single JSON state file wrapping all config — rejected; would break existing read contracts
  for domain-config.yaml and artifact-tags.yaml used outside the dashboard.

---

## 3. Charter Storage Schema

**Decision:** `config/charter-config.yaml` with `schema_version: "1"` and a flat `entries`
list of `{ artifact_id, artifact_kind }` objects. No timestamps; no metadata beyond kind.

**Rationale:** The spec requires only badge/toggle and list-by-kind views. Timestamps would
add complexity without a stated requirement. `artifact_kind` is needed for the `/charter`
tab's group-by-kind rendering. The file is initialized on first POST if absent.

**Schema:**
```yaml
schema_version: "1"
entries:
  - artifact_id: REGNOLOGY_BRANDING
    artifact_kind: directives
  - artifact_id: adr-drafting-workflow
    artifact_kind: tactics
```

**Alternatives considered:**
- Storing charter entries inside `pack/org-charter.yaml` — rejected by C-002; that file
  is a spec-kitty pack governance artifact and must not be dashboard-writable.
- Flat list of IDs without kind — rejected; kind is needed for group-by rendering in the
  `/charter` tab view (FR-006) and saves a second lookup per entry.

---

## 4. Charter Badge — Component Strategy

**Decision:** A new `CharterBadgeComponent` (standalone, inline template) that accepts an
`[artifactId]` input and reads from an Angular `CharterService` backed by a `BehaviorSubject`.
The badge is rendered once per artefact in the artifact-list table rows and detail page header.

**Rationale:** No separate card component exists — artefact rows are rendered inline in
`ArtifactListComponent`. Rather than duplicating charter-check logic in every list component,
a standalone `CharterBadgeComponent` encapsulates the `isChartered(id)` check against the
shared `BehaviorSubject` and exposes it as a one-liner import. The `BehaviorSubject` caches
the charter state after the first `GET /api/charter` call; the toggle on the detail page
calls `add()`/`remove()` which update the `BehaviorSubject` in place (FR-014 — no full
page reload required).

**Alternatives considered:**
- `*ngIf` inline charter check in each list template — rejected; duplicates the API call
  across 7+ page components.
- NgRx store — rejected; the existing codebase uses no state management library, and
  introducing one violates C-004 (no new dependencies without DDR).

---

## 5. Domain Vocabulary Panel — Placement

**Decision:** Add a collapsible `<section class="domain-vocabulary">` above the existing
bindings grid in `OrgBindingsComponent`, using inline form management consistent with
the existing `createForm` / `editId` / `deleteId` pattern in that component.

**Rationale:** Keeping domain management on the Org Bindings page is explicitly required
by FR-001. The existing component already handles inline add/edit/delete of bindings
with a reactive form, so the same pattern is familiar and avoids a new page/route.
The section is collapsible to prevent visual overload when many domains are present.

**Alternatives considered:**
- Separate `/domains` route — rejected by FR-001 which specifies the Org Bindings page.

---

## 6. Color Token Validation

**Decision:** Validate colour values against a server-side allowlist matching the Regnology
brand token names: `blue`, `green`, `red`, `petrol`, `amber`, `purple`, `neutral`.
Values outside this set are rejected with 400. The frontend renders a dropdown of these
tokens, not a free-text field.

**Rationale:** C-005 prohibits hex values. Validating the server side provides a hard
constraint; the dropdown in the frontend provides UX guidance. The allowlist is derived
from `RACI_BADGE_VARIANT` and domain chip colour usage in the existing codebase.

---

## 7. Cascade Preview Endpoint

**Decision:** `GET /api/domain-config/:id/cascade-preview` returns
`{ domainId, artifactTagCount, orgBindingCount }`. This is a read-only dry-run that
counts (does not modify) the affected records.

**Rationale:** FR-004 requires the count to be displayed before the user confirms deletion.
A separate preview endpoint keeps the DELETE endpoint clean (no `?dry-run` query param
complexity) and is consistent with the existing `/actions/cascade-delete` pattern in
`org-bindings.routes.ts`.
