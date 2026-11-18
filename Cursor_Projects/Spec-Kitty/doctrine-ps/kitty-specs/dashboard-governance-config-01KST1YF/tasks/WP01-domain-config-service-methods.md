---
work_package_id: WP01
title: Domain Config Service Methods
dependencies: []
requirement_refs:
- FR-002
- FR-003
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:24:40.845392+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1041558"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/services/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/services/domain-tags.service.ts
- tools/pack-dashboard/server/src/services/domain-tags.service.test.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load node-norris
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Add write operations to `tools/pack-dashboard/server/src/services/domain-tags.service.ts`
for full domain vocabulary management: create, update, delete (single-file), and bulk
removal of a domain from artifact-tags.yaml. These methods form the data layer used
by the cascade service (WP02) and the route handlers (WP02).

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Work in the worktree assigned to this WP's lane by `spec-kitty agent action implement WP01 --agent <name>`

## Context

**Existing code** (`tools/pack-dashboard/server/src/services/domain-tags.service.ts`):
- `getDomainConfig(): DomainConfigFile` — reads config/domain-config.yaml
- `getArtifactTags(): ArtifactTagsFile` — reads config/artifact-tags.yaml
- `setArtifactTags(artifactId, domains, primaryDomain?)` — writes one artifact's tags; validates domain IDs against getDomainConfig()
- `DomainConfig`, `DomainConfigFile`, `ArtifactTagsEntry`, `ArtifactTagsFile` interfaces already declared

**Atomic write pattern** (established, use everywhere):
```typescript
const filePath = path.join(getConfigRoot(), 'filename.yaml');
const tmpPath = filePath + '.tmp';
const serialized = yaml.dump(data, { lineWidth: 120 });
fs.writeFileSync(tmpPath, serialized, 'utf-8');
fs.renameSync(tmpPath, filePath);
```

**domain-config.yaml structure**:
```yaml
schema_version: "1"
domains:
  - id: engineering
    label: Engineering
    description: ...
    color: blue
```

**artifact-tags.yaml structure**:
```yaml
schema_version: "1"
tags:
  adr-drafting-workflow:
    domains: [engineering, quality]
    primary_domain: engineering
```

## Subtask Guidance

### T001 — ALLOWED_COLORS constant + color validation helper

**Purpose**: Enforce C-005 (no hex values; only Regnology brand token names allowed).

**What to add** (at top of file, after imports):
```typescript
export const ALLOWED_COLORS = ['blue', 'green', 'red', 'petrol', 'amber', 'purple', 'neutral'] as const;
export type DomainColor = typeof ALLOWED_COLORS[number];
```

Add to `DomainConfig` interface: `color?: DomainColor` (update the type from `string` to `DomainColor`).

Add a private helper:
```typescript
function assertValidColor(color?: string): void {
  if (color !== undefined && !(ALLOWED_COLORS as readonly string[]).includes(color)) {
    throw Object.assign(new Error('Invalid color token'), { code: 'INVALID_COLOR', provided: color, allowed: ALLOWED_COLORS });
  }
}
```

**Files**: `domain-tags.service.ts`

---

### T002 — `addDomain(input)`

**Purpose**: Create a new domain entry. Reject duplicate IDs.

**Signature**: `export function addDomain(input: { id: string; label: string; description: string; color?: string }): void`

**Steps**:
1. Validate `input.id` matches `/^[a-z][a-z0-9-]*$/` and `input.id.length <= 64` — throw `{ code: 'INVALID_ID' }` if not.
2. Validate `typeof input.label === 'string'` and `typeof input.description === 'string'` — throw `{ code: 'INVALID_FIELD_TYPE', field: 'label' | 'description' }` if not (protects against YAML injection via object/array values).
3. Call `assertValidColor(input.color)`.
4. Read current config via `getDomainConfig()`.
5. Check `config.domains.some(d => d.id === input.id)` — throw `{ code: 'DOMAIN_ID_EXISTS', id: input.id }` if duplicate.
6. Push `{ id, label, description, color }` (omit color if undefined) to `config.domains`.
7. Atomic write `domain-config.yaml`.

**Error codes used by route handler**:
- `INVALID_ID` → 400
- `INVALID_FIELD_TYPE` → 400
- `INVALID_COLOR` → 400
- `DOMAIN_ID_EXISTS` → 409

---

### T003 — `updateDomain(id, patch)`

**Purpose**: Edit label, description, and/or color. ID is immutable.

**Signature**: `export function updateDomain(id: string, patch: { label?: string; description?: string; color?: string }): DomainConfig`

**Steps**:
1. Validate `assertValidColor(patch.color)`.
2. If `patch.label !== undefined`, validate `typeof patch.label === 'string'` — throw `{ code: 'INVALID_FIELD_TYPE', field: 'label' }` if not.
3. If `patch.description !== undefined`, validate `typeof patch.description === 'string'` — throw `{ code: 'INVALID_FIELD_TYPE', field: 'description' }` if not.
4. Read current config.
5. Find `idx = config.domains.findIndex(d => d.id === id)`.
6. If `idx === -1`, throw `{ code: 'DOMAIN_NOT_FOUND', id }`.
7. Merge patch: `config.domains[idx] = { ...config.domains[idx], ...patch }`. If `patch.color === undefined`, preserve existing color.
8. Ensure at least one of label/description/color is present in patch — throw `{ code: 'EMPTY_PATCH' }` if all are undefined.
9. Atomic write.
10. Return updated `DomainConfig`.

---

### T004 — `deleteDomain(id)`

**Purpose**: Remove a single domain from domain-config.yaml. Does NOT touch artifact-tags or org-bindings — that is the cascade service's job (WP02).

**Signature**: `export function deleteDomain(id: string): void`

**Steps**:
1. Read current config.
2. Find domain. Throw `{ code: 'DOMAIN_NOT_FOUND', id }` if absent.
3. Filter out: `config.domains = config.domains.filter(d => d.id !== id)`.
4. Atomic write.

---

### T005 — `removeTagDomainFromAll(domainId)`

**Purpose**: Bulk-remove a domain ID from every artefact's `domains` array in artifact-tags.yaml, and clear `primary_domain` for any entry where `primary_domain === domainId`.

**Signature**: `export function removeTagDomainFromAll(domainId: string): void`

**IMPORTANT**: This function must NOT call `setArtifactTags()` — that function validates domain IDs against getDomainConfig(), which will fail because the domain is being deleted. Instead, this function writes artifact-tags.yaml directly via the atomic write pattern.

**Steps**:
1. Read current artifact tags via `getArtifactTags()`.
2. Iterate over all entries in `current.tags`:
   ```typescript
   for (const artifactId of Object.keys(current.tags)) {
     const entry = current.tags[artifactId];
     entry.domains = entry.domains.filter(d => d !== domainId);
     if (entry.primary_domain === domainId) {
       delete entry.primary_domain;
     }
   }
   ```
3. Atomic write `artifact-tags.yaml` (same pattern as setArtifactTags).

**Note**: Entries where `domains` becomes empty after filter are kept in the file (the artefact just has no domain tags). Do not delete the artefact entry entirely.

---

### T006 — Vitest unit tests

**Purpose**: Validate all 5 functions. Use `vi.mock('fs')` to mock file I/O.

**Test file**: Create `tools/pack-dashboard/server/src/services/domain-tags.service.test.ts`

**Key test cases**:

*addDomain*:
- Valid input → domain appears in written YAML
- Duplicate ID → throws DOMAIN_ID_EXISTS
- Invalid color → throws INVALID_COLOR
- Invalid ID format (e.g. "My Domain") → throws INVALID_ID

*updateDomain*:
- Patch label → only label changed, color preserved
- Empty patch (no fields) → throws EMPTY_PATCH
- Unknown ID → throws DOMAIN_NOT_FOUND

*deleteDomain*:
- Removes correct domain from list
- Does not touch artifact-tags.yaml (only domain-config.yaml written)
- Unknown ID → throws DOMAIN_NOT_FOUND

*removeTagDomainFromAll*:
- Removes domain from all matching domains arrays
- Clears primary_domain where it matched
- Does not remove artefact entries with empty domains (entries preserved)
- Does not call getDomainConfig() (bypasses validation)

**Setup**: Mock `fs.existsSync` to return true; mock `fs.readFileSync` to return fixture YAML strings; assert on `fs.writeFileSync` and `fs.renameSync` calls.

## Definition of Done

- [ ] `addDomain`, `updateDomain`, `deleteDomain`, `removeTagDomainFromAll` exported from domain-tags.service.ts
- [ ] ALLOWED_COLORS exported; DomainConfig.color typed as DomainColor
- [ ] All 5 functions use atomic write pattern
- [ ] `updateDomain` silently ignores any `id` field in the patch (ID immutability)
- [ ] `removeTagDomainFromAll` does NOT call `setArtifactTags()` (avoids domain-validation bootstrap)
- [ ] Vitest tests pass: `npx vitest run domain-tags`
- [ ] TypeScript compiles without errors: `npx tsc --noEmit` from tools/pack-dashboard/

## Risks

- `setArtifactTags()` validates against `getDomainConfig()` — calling it during cascade would fail because the domain is already gone. `removeTagDomainFromAll()` must write directly.
- Partial YAML parse errors from malformed fixture files in tests — use valid js-yaml input.

## Activity Log

- 2026-06-01T10:24:42Z – claude:sonnet:node-norris:implementer – shell_pid=1022826 – Assigned agent via action command
- 2026-06-01T10:28:17Z – claude:sonnet:node-norris:implementer – shell_pid=1022826 – Domain service methods implemented: addDomain, updateDomain, deleteDomain, removeTagDomainFromAll, ALLOWED_COLORS, type guards (id length <=64, label/description string type, id immutability in patch), Vitest tests pass (34 tests)
- 2026-06-01T10:29:06Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041558 – Started review via action command
- 2026-06-01T10:30:37Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041558 – Review passed: all 5 functions implemented with atomic write; ALLOWED_COLORS exported; id-length/type-guard/immutability checks correct; removeTagDomainFromAll writes directly without setArtifactTags; 34 Vitest tests pass; TS compiles clean; diff touches only owned files
