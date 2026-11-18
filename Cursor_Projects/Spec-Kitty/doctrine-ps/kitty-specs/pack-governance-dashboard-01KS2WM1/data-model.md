# Data Model: Pack Governance Dashboard

## Entities

### Artifact

Represents a single YAML file in `pack/` conforming to a spec-kitty schema.

| Field | Type | Source |
|-------|------|--------|
| id | string | Parsed from YAML (`id` or `profile-id` field) |
| kind | ArtifactKind | Derived from subdirectory name |
| title | string | Parsed from YAML (`title` or `name` field) |
| filePath | string | Relative path from pack root |
| content | string | Raw YAML file content |
| parsedData | object | Parsed YAML as JSON object |
| validationStatus | ValidationStatus | `unknown` until validated in session; `valid` or `invalid` after. Cached in-memory keyed by `(filePath, mtime)`. |
| reviewStatus | ReviewStatus | From `.reviews/` file if present |

### ArtifactKind (enum)

```typescript
type ArtifactKind =
  | 'directives'
  | 'tactics'
  | 'styleguides'
  | 'toolguides'
  | 'paradigms'
  | 'procedures'
  | 'agent_profiles'
  | 'mission_step_contracts';
```

### Review

Persisted as JSON at `pack/.reviews/<kind>/<id>.review.json`.

| Field | Type | Required |
|-------|------|----------|
| artifact_id | string | yes |
| artifact_kind | ArtifactKind | yes |
| status | ReviewStatus | yes |
| reviewed_at | ISO 8601 string | yes |
| reviewer | string | yes |
| comments | Comment[] | yes (may be empty) |
| summary | string | yes |

> `artifact_path` is intentionally absent. Consumers resolve the file path from `(artifact_kind, artifact_id)` at runtime using the pack-scanner's path resolution logic. Embedding the path would create stale references whenever a file is renamed during batch migrations.

### ReviewStatus (enum)

```typescript
type ReviewStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested';
```

### Comment

| Field | Type | Required |
|-------|------|----------|
| line | number | no (null for general comments) |
| text | string | yes |
| severity | CommentSeverity | yes |

### CommentSeverity (enum)

```typescript
type CommentSeverity = 'must-fix' | 'should-fix' | 'nit';
```

### ValidationStatus (enum)

```typescript
type ValidationStatus = 'unknown' | 'valid' | 'invalid';
```

Stored on `Artifact` in-memory only. `unknown` is the initial state for artifacts not yet validated in the current server session. Backend caches the last `ValidationResult` per artifact keyed by `(filePath, mtime)`. If the file has not changed since last validation, the cached result is returned immediately without spawning a Python subprocess.

### ValidationResult

Returned by the Python validation bridge.

| Field | Type |
|-------|------|
| valid | boolean |
| errors | ValidationError[] |
| artifact_id | string |
| artifact_kind | ArtifactKind |
| artifact_path | string |
| validated_at | ISO 8601 string |

### ValidationError

| Field | Type |
|-------|------|
| field | string (dot-path, e.g. "procedures.0.title") |
| message | string |
| type | string (Pydantic error type) |

### CoverageResult

Output of `GET /api/drg/coverage`. Not persisted — computed on demand from DRG edges.

| Field | Type |
|-------|------|
| relation_filter | string \| null |
| kind_filter | ArtifactKind \| null |
| total_unlinked | number |
| unlinked_nodes | DRGNode[] |

## Relationships

```
Artifact 1──1 Review       (optional, via .reviews/ lookup)
Artifact 1──* ValidationResult  (cached in-memory by filePath+mtime)
Review   1──* Comment
DRGNode  *──* DRGNode      (via DRGEdge — used for related-artifacts panel and coverage query)
```

## Storage Layout

```
pack/
  directives/
    041-regnology-branding.directive.yaml
    ...
  tactics/
    appsec-pipeline-setup.tactic.yaml
    ...
  .reviews/
    directives/
      REGNOLOGY_BRANDING.review.json
      MODEL_DISCIPLINE.review.json
    tactics/
      appsec-pipeline-setup.review.json
    agent_profiles/
      backend-benny.review.json
```

The `.reviews/` directory mirrors the artifact kind structure. Review file names use the
artifact's `id` field (not the filename), ensuring stable references even if files are renamed.
