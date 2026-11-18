# Data Model: PS Pack Rebrand + Layering Update

## Overview

This mission modifies governance metadata and distribution wiring, not runtime application entities.
The data model is therefore artifact-centric.

---

## Entities

### 1) PackIdentity

Represents the canonical identity for this departmental doctrine pack.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `org_name` | string | Pack slug used in charter metadata and fetch/distribution references | Must be `ps-agent-enabled-factory` |
| `display_name` | string | Human-facing repository/pack name | Must be "Professional Services Departmental Agent Doctrine" |
| `previous_slug` | string | Prior slug retained for migration traceability | `regnology-default` |

**Invariants**
- Exactly one canonical `org_name` is active after migration.
- Human-facing docs and charter metadata must agree on identity.

### 2) LayerBinding

Defines upstream/downstream relationship between packs.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `extends` | string | Upstream pack identifier declared by departmental charter | Must be `regnology-all-company` |
| `upstream_repo_url` | string | Canonical source URL for upstream layer | Must be absolute Bitbucket URL |
| `layering_mode` | enum | Relationship semantics | `additive_non_relaxing` |

**Invariants**
- Departmental layer may add constraints but cannot relax upstream required directives.
- Upstream reference in docs must match `extends`.

### 3) InstallerLayerOrder

Represents deterministic layering in bootstrap/install scripts.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `base_pack` | string | First pack pulled by installer | `regnology-all-company` |
| `overlay_pack` | string | Second pack pulled by installer | `ps-agent-enabled-factory` |
| `order` | array<string> | Sequence of fetch/apply operations | Must preserve base -> overlay |

**Invariants**
- Base pack is installed before overlay.
- Shell and PowerShell installers encode equivalent order.

### 4) GeneratedSurfacePolicy

Captures which harness surfaces are committed vs regenerated locally.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `surface_path` | string | Harness directory path | `.cursor/` or `.claude/` |
| `commit_policy` | enum | Versioning policy | `local_regenerate` |
| `preserved_sources` | list<string> | Relocated hand-authored files that remain tracked | Non-empty when authored files exist |

**Invariants**
- Generated artifacts are not shipped.
- Hand-authored canonical files are retained in tracked source locations.

### 5) OccurrenceClassification

Bulk-edit safety contract for diff-compliance.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `target.term` | string | Term being migrated | `regnology-default` |
| `target.replacement` | string | Replacement term | `ps-agent-enabled-factory` |
| `categories` | object | 8-category action map | All standard categories required |
| `exceptions` | list | Path-level overrides | Optional, must include reason |

**Invariants**
- All 8 standard categories exist with explicit action.
- Historical mission/docs paths remain protected by manual review or do-not-change exceptions.

---

## State transitions

### Pack identity migration state

`legacy_slug` -> `dual_reference_window` -> `normalized_slug_complete`

- Entry: `legacy_slug` when `regnology-default` still appears in active metadata.
- Intermediate: `dual_reference_window` during in-flight update.
- Exit: `normalized_slug_complete` when canonical metadata/docs/installers uniformly use `ps-agent-enabled-factory`.

### Surface policy transition

`tracked_generated` -> `relocation_verified` -> `untracked_generated`

- Entry: generated harness outputs tracked in git.
- Intermediate: hand-authored config relocated and verified.
- Exit: generated directories untracked + gitignored, regeneration instructions documented.
