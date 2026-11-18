# Data Model: Pack Dashboard — Domain Tags and Built-in Doctrine

**Mission**: pack-dashboard-domain-tags-builtin-01KS56B1

---

## YAML File Schemas

### `docs/domain-config.yaml`

```yaml
schema_version: "1"
domains:
  - id: string            # kebab-case unique identifier
    label: string         # human-readable display name
    description: string   # one-sentence description
    color: string         # optional; one of: blue, green, red, petrol, amber, purple
```

**Invariants:**
- `id` values must be unique within the file.
- `id` values are the canonical reference for `artifact-tags.yaml`.
- `color` is optional; unknown values render as `.dc-chip--default`.

### `docs/artifact-tags.yaml`

```yaml
schema_version: "1"
tags:
  <artifact-id>:          # key is the artifact id value (not title or file path)
    domains:
      - <domain-id>       # must exist in domain-config.yaml
```

**Invariants:**
- Missing keys = untagged artifact (treated as `domains: []`).
- Every domain ID in any `domains` array must exist in `domain-config.yaml`
  (enforced by server on PUT; the file is not validated at read time).

---

## TypeScript Interfaces

### Server (`tools/pack-dashboard/server/src/models/`)

```typescript
// domain.model.ts

export interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color?: string;
}

export interface DomainConfigFile {
  schema_version: string;
  domains: DomainConfig[];
}

export interface ArtifactTagsEntry {
  domains: string[];
}

export interface ArtifactTagsFile {
  schema_version: string;
  tags: Record<string, ArtifactTagsEntry>;
}
```

### Server — extended ArtifactSummary

```typescript
// In artifact.model.ts — extend existing ArtifactSummary

export interface ArtifactSummary {
  kind: ArtifactKind;
  id: string;
  title: string;
  filePath: string;
  source?: 'pack' | 'builtin';   // WP07: pack-scanner emits 'pack'; builtin-scanner emits 'builtin'
}
```

**Consumer contract**: Pack scanner (`pack-scanner.service.ts`) must be updated in WP07 to emit
`source: 'pack'` on every `ArtifactSummary` it returns. Downstream components (`ArtifactListComponent`,
etc.) treat `source === 'builtin'` as the only special case; all other values (including `'pack'`)
render as pack artifacts. `undefined` is not a valid value after WP07 — do not rely on its absence.

### Frontend (`tools/pack-dashboard/src/app/models/`)

```typescript
// domain.model.ts

export interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color?: string;
}

export interface DomainConfigResponse {
  domains: DomainConfig[];
}

export interface ArtifactTagsEntry {
  domains: string[];
}

export interface ArtifactTagsResponse {
  tags: Record<string, ArtifactTagsEntry>;
}
```

---

## Service Responsibilities

### Server — `DomainTagsService`

| Method | Behaviour |
|--------|-----------|
| `getDomainConfig()` | Read and parse `docs/domain-config.yaml`; return `DomainConfigFile`. If file is absent, return `{ schema_version: "1", domains: [] }` — do not throw. |
| `getArtifactTags()` | Read and parse `docs/artifact-tags.yaml`; return `ArtifactTagsFile`; if file absent, return empty `{ schema_version: "1", tags: {} }` |
| `setArtifactTags(id, domains[])` | Validate all domain IDs against `getDomainConfig()`; on success, update in-memory tags map and write atomically to `artifact-tags.yaml`; return void; throw on unknown domain ID |

### Server — `BuiltinScannerService`

| Method | Behaviour |
|--------|-----------|
| `scan()` | Called once at startup. Walk `SPEC_KITTY_SRC/doctrine/` using the same pattern as `PackScannerService.scanPack()`. Return `Record<ArtifactKind, ArtifactSummary[]>` with `source: 'builtin'`. If path absent or not a directory, log warning and return empty record. **Must call `getSpecKittySrc()` at scan time — never import the frozen `SPEC_KITTY_SRC` constant — so `process.env.SPEC_KITTY_SRC` overrides work in tests.** |
| `getAll()` | Return cached scan result. |
| `getKind(kind)` | Return cached summaries for one kind. |
| `getDetail(kind, id)` | Return full artifact detail (parsed YAML + raw content) for one built-in. |

### Frontend — `DomainService`

| Method | Behaviour |
|--------|-----------|
| `getConfig()` | `GET /api/domain-config` → `Observable<DomainConfigResponse>` |
| `getTags()` | `GET /api/artifact-tags` → `Observable<ArtifactTagsResponse>` |
| `setTags(id, domains)` | `PUT /api/artifact-tags/:id` body `{ domains }` → `Observable<void>` |

### Frontend — `BuiltinService`

| Method | Behaviour |
|--------|-----------|
| `getAll()` | `GET /api/builtin` → `Observable<Record<ArtifactKind, ArtifactSummary[]>>` |
| `getByKind(kind)` | `GET /api/builtin/:kind` → `Observable<ArtifactSummary[]>` |
| `getDetail(kind, id)` | `GET /api/builtin/:kind/:id` → `Observable<ArtifactDetail>` |

---

## State Transitions

Domain tag assignment is a simple overwrite — there are no multi-state transitions.

```
artifact (no tags)  →[PUT /api/artifact-tags/:id]→  artifact (domains: [...])
artifact (domains)  →[PUT /api/artifact-tags/:id]→  artifact (domains: [...])  (overwrite)
```

The built-in artifact lifecycle has no mutable state from the dashboard's perspective.

---

## Router Routes (Frontend)

| Path | Component | Notes |
|------|-----------|-------|
| `/artifacts/:kind` | `ArtifactListComponent` | Existing; updated to show domain column + built-in table |
| `/artifacts/:kind/:id` | `ArtifactDetailComponent` | Existing; updated to show domain chips |
| `/artifacts/builtin/:kind/:id` | `BuiltinDetailComponent` | New; read-only |

**Route ordering (critical)**: `/artifacts/builtin/:kind/:id` must be registered as the **first**
entry in the artifacts path group in `app.routes.ts` — before both `/artifacts/:kind` and
`/artifacts/:kind/:id`. Angular matches routes top-to-bottom; placing the builtin route after
`/artifacts/:kind` causes `builtin` to be matched as the `:kind` parameter, routing to
`ArtifactListComponent` with an invalid kind.
