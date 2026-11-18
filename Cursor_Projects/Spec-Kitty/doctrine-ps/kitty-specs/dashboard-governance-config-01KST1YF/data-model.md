# Data Model: Dashboard Domain & Charter Governance

## Existing Entities (unchanged)

### DomainConfig (domain-tags.service.ts)

```typescript
interface DomainConfig {
  id: string;        // immutable slug, e.g. "engineering"
  label: string;     // display name, editable
  description: string; // editable
  color?: string;    // brand token name, editable; one of ALLOWED_COLORS
}

interface DomainConfigFile {
  schema_version: string; // "1"
  domains: DomainConfig[];
}
```

**Invariants:**
- `id` is immutable after creation.
- `id` must be unique within the domains array.
- `color`, when present, must be a member of `ALLOWED_COLORS = ['blue','green','red','petrol','amber','purple','neutral']`.

**State transitions:** No lifecycle states. CRUD only.

**Persistence:** `config/domain-config.yaml` — atomic write via `.tmp` rename.

---

### ArtifactTagsFile (domain-tags.service.ts — unchanged)

```typescript
interface ArtifactTagsEntry {
  domains: string[];        // list of domain IDs
  primary_domain?: string;  // must be a member of domains
}

interface ArtifactTagsFile {
  schema_version: string;   // "1"
  tags: Record<string, ArtifactTagsEntry>; // keyed by artifact_id
}
```

**Cascade rule:** When a domain ID `d` is deleted, remove `d` from every `domains` array
and clear `primary_domain` if it equals `d`.

**Persistence:** `config/artifact-tags.yaml` — atomic write.

---

### OrgBinding (org-binding.model.ts — unchanged)

```typescript
interface OrgBinding {
  id: string;
  domain_id: string;
  department: string;
  spoc: string;
  accountability: 'R' | 'A' | 'C' | 'I';
  involvement?: string;
  orphaned?: boolean; // computed at read time — not persisted
}
```

**Cascade rule:** When domain `d` is deleted, delete all OrgBinding entries where
`domain_id === d`.

**Persistence:** `config/org-bindings.yaml` — atomic write.

---

## New Entities

### CharterEntry

```typescript
// server: models/charter.model.ts
// client: models/charter.model.ts

type ArtifactKind =
  | 'directives' | 'tactics' | 'procedures' | 'styleguides'
  | 'toolguides' | 'paradigms' | 'agent_profiles'
  | 'mission_step_contracts' | 'templates';

interface CharterEntry {
  artifact_id: string;    // unique; identifies the charted artefact
  artifact_kind: ArtifactKind; // for grouping in /charter tab view
}

interface CharterConfigFile {
  schema_version: string; // "1"
  entries: CharterEntry[];
}
```

**Invariants:**
- `artifact_id` must match `^[A-Za-z0-9_-]{1,200}$`; format violations return 400 with code `INVALID_ARTIFACT_ID`.
- Duplicate detection normalises `artifact_id` to lowercase before comparison. The stored value is the lowercase-normalised form.
- `artifact_kind` must be a valid `ArtifactKind` value.
- Removing a non-existent entry returns 404.

**State transitions:** No lifecycle. Add / remove only.

**Persistence:** `config/charter-config.yaml` — atomic write. File is created on first
successful POST if absent (initialised with `{ schema_version: "1", entries: [] }`).

---

## Cascade Delete Flow (per-function-delegation strategy)

The cascade is implemented via three sequential function calls in `domain-cascade.service.ts`,
each handling its own atomic single-file write. This is the **resolved** implementation
strategy (see research.md §2 — the write-all-tmp-first strategy was evaluated and rejected
in favour of locality-of-change).

```
Input: domainId (string)

Step 1 — Delete domain from domain-config.yaml:
  deleteDomain(domainId)
  → reads domain-config.yaml, filters out domainId, atomic write

Step 2 — Remove domain from all artifact tags:
  removeTagDomainFromAll(domainId)
  → reads artifact-tags.yaml directly (bypasses setArtifactTags domain-validation),
    removes domainId from all domains arrays, clears primary_domain where matched,
    atomic write

Step 3 — Remove all org-binding entries for domain:
  cascadeDeleteBindings(domainId)
  → reads org-bindings.yaml, filters out entries where domain_id === domainId,
    atomic write
```

**Each step is individually atomic. The three steps are sequential, not simultaneous.**
A narrow inconsistency window exists between steps (e.g., after step 1, domainId is absent
from domain-config.yaml but its references survive in artifact-tags.yaml until step 2
completes). This is accepted for local single-user use (see FR-005, research.md §2).

**Recovery if interrupted between steps:** `config/*.yaml` files are committed to git.
Recovery from a mid-cascade failure uses `git revert` on the commit(s) that wrote the
partially-updated config files. A second `DELETE` on the same (now absent) domain ID
returns 404 — the cascade cannot be re-run via the API, but orphaned tags and bindings
are harmless until the config is manually restored.

**Why NOT write-all-tmp-first:** That strategy would require `domain-cascade.service.ts`
to replicate the internal write logic of three separate services. The per-function approach
keeps each service's write logic encapsulated. The trade-off (sequential rather than
near-simultaneous) is accepted given the local single-user context.

---

## Cascade Preview Model

```typescript
interface CascadePreviewResult {
  domainId: string;
  artifactTagCount: number;        // artefacts whose domains[] contains this domain ID
  primaryDomainLossCount: number;  // artefacts that will lose their primary_domain designation
  orgBindingCount: number;         // org-binding entries bound to this domain
}
```

`primaryDomainLossCount` is the count of artefacts in artifact-tags.yaml whose
`primary_domain` equals `domainId`. These artefacts retain their other domain tags
after cascade but lose their primary domain. Surfaced separately in the confirmation
dialog so the user understands the full impact.

This is computed by a read-only scan (no writes) before the user confirms deletion.

---

## API Response Shapes

### Domain Config

```typescript
// GET /api/domain-config — unchanged
{ domains: DomainConfig[] }

// POST /api/domain-config → 201
{ domain: DomainConfig }

// PUT /api/domain-config/:id → 200
{ domain: DomainConfig }

// GET /api/domain-config/:id/cascade-preview → 200
CascadePreviewResult

// DELETE /api/domain-config/:id → 204 (no body)
```

### Charter

```typescript
// GET /api/charter → 200
{ entries: CharterEntry[] }

// POST /api/charter → 201
{ entry: CharterEntry }
// 400 if missing/invalid fields
// 409 if artifact_id already in charter

// DELETE /api/charter/:artifactId → 204 (no body)
// 404 if artifact_id not in charter
```
