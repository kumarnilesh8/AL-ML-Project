---
work_package_id: WP02
title: Cascade Service and Domain Config Routes
dependencies:
- WP01
requirement_refs:
- FR-002
- FR-003
- FR-004
- FR-005
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:36:47.497707+00:00'
subtasks:
- T007
- T008
- T009
- T010
- T011
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1088150"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/services/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/services/domain-cascade.service.ts
- tools/pack-dashboard/server/src/services/domain-cascade.service.test.ts
- tools/pack-dashboard/server/src/routes/domain-config.routes.ts
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

Create `domain-cascade.service.ts` (multi-file cascade orchestration) and extend
`domain-config.routes.ts` with all new HTTP endpoints for domain CRUD. This WP depends
on WP01's service methods being available.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Start from the lane worktree returned by: `spec-kitty agent action implement WP02 --agent <name>`

## Context

**WP01 exports** (now available in domain-tags.service.ts):
- `addDomain(input)`, `updateDomain(id, patch)`, `deleteDomain(id)`, `removeTagDomainFromAll(domainId)`
- `ALLOWED_COLORS`

**Existing functions needed**:
- `org-bindings.service.ts` exports `cascadeDelete(domainId: string): void` — already deletes all org-binding entries for a domain atomically. Import and call this directly.
- `getDomainConfig()` in domain-tags.service.ts — use for preview counts.
- `getArtifactTags()` in domain-tags.service.ts — use for preview counts.

**Current domain-config.routes.ts** (read-only GET only):
```typescript
router.get('/', (_req, res) => {
  const config = getDomainConfig();
  res.json({ domains: config.domains });
});
```

**Route ordering rule** (CRITICAL): register `GET /:id/cascade-preview` BEFORE `DELETE /:id`.
See `org-bindings.routes.ts` lines 1–10 for the existing pattern (action routes before `:id`).

## Subtask Guidance

### T007 — `cascadePreview(domainId)`

**File**: Create `tools/pack-dashboard/server/src/services/domain-cascade.service.ts`

**Purpose**: Read-only dry-run — count what would be removed. Does NOT write any files.

**Signature**:
```typescript
export interface CascadePreviewResult {
  domainId: string;
  artifactTagCount: number;
  primaryDomainLossCount: number;
  orgBindingCount: number;
}

export function cascadePreview(domainId: string): CascadePreviewResult {
```

**Steps**:
1. Check domain exists in `getDomainConfig()` — throw `{ code: 'DOMAIN_NOT_FOUND' }` if absent.
2. Count artifact tags: iterate `getArtifactTags().tags`, count entries where `domains` includes `domainId` → `artifactTagCount`.
3. Count primary domain loss: count entries where `primary_domain === domainId` → `primaryDomainLossCount`.
4. Count bindings: import `listBindings` from `org-bindings.service.ts`; count entries where `domain_id === domainId` → `orgBindingCount`. Note: filter out `orphaned` flag if present (count only the domain_id match).
5. Return `{ domainId, artifactTagCount, primaryDomainLossCount, orgBindingCount }`.

---

### T008 — `cascadeDelete(domainId)`

**Purpose**: Sequential cascade across all three config files. Design choice: call existing per-file service functions rather than duplicating write logic.

**Signature**: `export function cascadeDelete(domainId: string): void`

**Execution sequence** (documented in research.md §2):
```typescript
// Step 1: remove domain entry from domain-config.yaml
deleteDomain(domainId);  // from domain-tags.service.ts

// Step 2: remove domain from all artifact-tags entries
removeTagDomainFromAll(domainId);  // from domain-tags.service.ts

// Step 3: remove all org-binding entries bound to this domain
cascadeDeleteBindings(domainId);  // from org-bindings.service.ts
```

Import names to avoid collision:
```typescript
import { deleteDomain, removeTagDomainFromAll } from './domain-tags.service';
import { cascadeDelete as cascadeDeleteBindings } from './org-bindings.service';
```

**Important**:
- `deleteDomain` will throw `DOMAIN_NOT_FOUND` if the domain doesn't exist — that error propagates naturally.
- If step 1 succeeds but step 2 or 3 throws (e.g., disk error), the domain is gone from domain-config.yaml but references remain in other files. This is the accepted inconsistency window; the existing orphan-detection logic in org-bindings handles it.
- Do NOT add try/catch to hide these errors — let them propagate to the route handler.

---

### T009 — POST + PUT /:id routes

**File**: `tools/pack-dashboard/server/src/routes/domain-config.routes.ts`

Add after the existing `GET /` handler:

**POST /** (create domain):
```
Request:  { id, label, description, color? }
Response: 201 { domain: DomainConfig }
Errors:   400 INVALID_ID / INVALID_COLOR / missing required fields
          409 DOMAIN_ID_EXISTS
          500 file write failure
```

**PUT /:id** (update domain):
```
Request:  { label?, description?, color? } — id in body silently ignored
Response: 200 { domain: DomainConfig }
Errors:   400 EMPTY_PATCH / INVALID_COLOR
          404 DOMAIN_NOT_FOUND
          500 file write failure
```

Map error codes to HTTP status:
```typescript
function domainErrorToStatus(err: unknown): number {
  const code = (err as { code?: string }).code;
  if (code === 'DOMAIN_ID_EXISTS') return 409;
  if (code === 'DOMAIN_NOT_FOUND') return 404;
  if (['INVALID_ID', 'INVALID_COLOR', 'EMPTY_PATCH'].includes(code ?? '')) return 400;
  return 500;
}
```

Use standard try/catch + `res.status(status).json({ error: msg })` pattern.

---

### T010 — GET /:id/cascade-preview + DELETE /:id routes

**CRITICAL ORDERING**: Register `GET /:id/cascade-preview` BEFORE `DELETE /:id` in the router.

Add this comment block:
```typescript
// ORDERING CRITICAL: cascade-preview must be registered before :id handlers
// to prevent Express matching "cascade-preview" as the :id value.
// Pattern from org-bindings.routes.ts — action routes before :id.
```

**GET /:id/cascade-preview**:
```
Response: 200 CascadePreviewResult
Errors:   404 DOMAIN_NOT_FOUND
          500 read failure
```

**DELETE /:id** (cascade delete):
```
Response: 204 (no body)
Errors:   404 DOMAIN_NOT_FOUND
          500 file write failure
Note:     calling cascade-preview first is OPTIONAL — DELETE executes cascade unconditionally.
```

Delete handler calls `cascadeDelete(req.params.id)` (from domain-cascade.service.ts), not `deleteDomain`.

---

### T011 — Vitest tests for cascade service

**File**: Create `tools/pack-dashboard/server/src/services/domain-cascade.service.test.ts`

**Key test cases**:

*cascadePreview*:
- Returns correct counts from mocked domain-config, artifact-tags, org-bindings data
- `primaryDomainLossCount` only counts entries where `primary_domain === domainId` (not just membership)
- Returns 0 counts when domain exists but has no tags/bindings
- Throws DOMAIN_NOT_FOUND for unknown domainId

*cascadeDelete*:
- Calls `deleteDomain`, `removeTagDomainFromAll`, `cascadeDeleteBindings` in that order (verify call order via vi.spyOn)
- Throws DOMAIN_NOT_FOUND (propagated from `deleteDomain`) for unknown domainId
- Does NOT swallow errors from step 2 or 3

**Mocking**: Mock all three imported functions (`deleteDomain`, `removeTagDomainFromAll`, `cascadeDeleteBindings`) with `vi.mock`.

## Definition of Done

- [ ] `domain-cascade.service.ts` exports `cascadePreview` and `cascadeDelete`
- [ ] `domain-config.routes.ts` exposes POST, PUT /:id, GET /:id/cascade-preview, DELETE /:id
- [ ] Route ordering comment present in domain-config.routes.ts
- [ ] `cascadeDelete` imports existing `cascadeDelete` from org-bindings.service.ts (no duplicate write logic)
- [ ] HTTP error codes match contracts/api-domain-config.yaml
- [ ] Vitest tests pass: `npx vitest run domain-cascade`
- [ ] `npx tsc --noEmit` compiles clean

## Risks

- Name collision: `cascadeDelete` exists in both domain-cascade.service.ts and org-bindings.service.ts — import with alias `cascadeDeleteBindings` to avoid confusion.
- Route ordering regression: any future route added to domain-config.routes.ts after the DELETE /:id handler could silently shadow the cascade-preview endpoint if ordering is violated. The comment block mitigates this.

## Activity Log

- 2026-06-01T10:36:49Z – claude:sonnet:node-norris:implementer – shell_pid=1064048 – Assigned agent via action command
- 2026-06-01T10:41:19Z – claude:sonnet:node-norris:implementer – shell_pid=1064048 – Cascade service and routes implemented; preview before delete route ordering enforced; 3-file sequential cascade; Vitest tests pass (9/9); tsc --noEmit clean
- 2026-06-01T10:41:43Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1088150 – Started review via action command
- 2026-06-01T10:44:29Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1088150 – Review passed: cascade service, route ordering enforced (cascade-preview line 59 before DELETE line 71), read-only preview (no file writes), sequential cascade (deleteDomain → removeTagDomainFromAll → cascadeDeleteBindings), req.params.id authoritative in PUT, tests pass (9/9)
