---
work_package_id: WP01
title: Config Root Migration
dependencies: []
requirement_refs:
- FR-017
- FR-018
- FR-020
- FR-021
- FR-022
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-organizational-bindings-01KSPTPR
base_commit: ca3ccef9c51c5c29ce62863975c041e820c4f808
created_at: '2026-05-28T11:26:11.080449+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
shell_pid: "1766207"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/server/src/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/config.ts
- tools/pack-dashboard/server/src/services/domain-tags.service.ts
- tools/pack-dashboard/server/src/routes/domain-config.routes.ts
- config/domain-config.yaml
- config/artifact-tags.yaml
- docs/domain-config.yaml
- docs/artifact-tags.yaml
tags: []
---

# WP01 — Config Root Migration

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Work directly on `overhaul/migrate_to_kitty`; no separate feature branch.
- To implement: `spec-kitty agent action implement WP01 --agent <name>`

## Objective

Introduce `getConfigRoot()` in the server config module and migrate `domain-config.yaml` and `artifact-tags.yaml` from `docs/` to the new `config/` top-level directory. All server code that reads these files must use `getConfigRoot()` afterwards. This is a prerequisite for WP02–WP06.

## Context

The server currently reads `domain-config.yaml` and `artifact-tags.yaml` from `getDocsRoot()` (defaults to `<repo-root>/docs`). These files are not documentation — they are dashboard configuration. Per `docs/SURFACES.md`, dashboard configuration belongs in `config/`. The `CONFIG_ROOT` env var follows the same override pattern as `PACK_ROOT` and `DOCS_ROOT`.

Existing file to extend: `tools/pack-dashboard/server/src/config.ts`  
Pattern to follow: `getDocsRoot()` — exact same signature, just `config` instead of `docs`.

---

## T001 — Add `getConfigRoot()` to `server/src/config.ts`

**Purpose**: Establish the config root getter so all other code can switch to it.

**Steps**:

1. Open `tools/pack-dashboard/server/src/config.ts`.
2. After the existing `getDocsRoot()` function, add:

```typescript
export function getConfigRoot(): string {
  return process.env.CONFIG_ROOT || path.join(REPO_ROOT, 'config');
}
```

3. Do **not** add a module-level `CONFIG_ROOT` constant (the comment on line 120 explains why — module-level constants are evaluated at import time and cannot be overridden by tests setting `process.env`).

**Files modified**: `tools/pack-dashboard/server/src/config.ts`

**Validation**:
- [ ] `getConfigRoot()` exported
- [ ] Defaults to `<REPO_ROOT>/config` when `CONFIG_ROOT` not set
- [ ] TypeScript compiles without errors

---

## T002 — Create `config/` directory and move `domain-config.yaml`

**Purpose**: Relocate the domain vocabulary file to its canonical home.

**Steps**:

1. Run `git mv docs/domain-config.yaml config/domain-config.yaml` from repo root.
2. Verify `config/domain-config.yaml` is present and `docs/domain-config.yaml` is gone.
3. Confirm the file contents are identical (git mv preserves content).

**Files modified**:
- `docs/domain-config.yaml` (deleted)
- `config/domain-config.yaml` (new via rename)

**Validation**:
- [ ] `config/domain-config.yaml` exists with correct content
- [ ] `docs/domain-config.yaml` no longer exists

---

## T003 — Move `artifact-tags.yaml`

**Purpose**: Same migration for artifact-tags.

**Steps**:

1. Run `git mv docs/artifact-tags.yaml config/artifact-tags.yaml` from repo root.
2. Verify move completed correctly.

**Files modified**:
- `docs/artifact-tags.yaml` (deleted)
- `config/artifact-tags.yaml` (new via rename)

**Validation**:
- [ ] `config/artifact-tags.yaml` exists
- [ ] `docs/artifact-tags.yaml` no longer exists

---

## T004 — Update `domain-tags.service.ts` to use `getConfigRoot()`

**Purpose**: The service currently imports `getDocsRoot` and uses it for both file paths. Switch both to `getConfigRoot`.

**Steps**:

1. Open `tools/pack-dashboard/server/src/services/domain-tags.service.ts`.
2. Change the import line from:
   ```typescript
   import { getDocsRoot } from '../config';
   ```
   to:
   ```typescript
   import { getConfigRoot } from '../config';
   ```
3. In `getDomainConfig()`, change:
   ```typescript
   const filePath = path.join(getDocsRoot(), 'domain-config.yaml');
   ```
   to:
   ```typescript
   const filePath = path.join(getConfigRoot(), 'domain-config.yaml');
   ```
4. In `getArtifactTags()`, change:
   ```typescript
   const filePath = path.join(getDocsRoot(), 'artifact-tags.yaml');
   ```
   to:
   ```typescript
   const filePath = path.join(getConfigRoot(), 'artifact-tags.yaml');
   ```
5. In `setArtifactTags()`, change both occurrences of `getDocsRoot()` to `getConfigRoot()`.

**Files modified**: `tools/pack-dashboard/server/src/services/domain-tags.service.ts`

**Validation**:
- [ ] No remaining `getDocsRoot` references in this file
- [ ] TypeScript compiles

---

## T005 — Update `domain-config.routes.ts`

**Purpose**: This route file imports `getDomainConfig` from `domain-tags.service` which now uses `getConfigRoot`. No direct config import is needed in the routes file, so just verify the file compiles and the route still works after T004.

**Steps**:

1. Open `tools/pack-dashboard/server/src/routes/domain-config.routes.ts`.
2. No code changes needed if the file only calls `getDomainConfig()` from the service. Confirm there are no direct `getDocsRoot` imports.
3. If any direct `getDocsRoot` reference exists (e.g. `artifact-tags.routes.ts`), apply the same substitution there too.
4. Also check `tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts` — apply `getConfigRoot()` substitution for any `getDocsRoot()` reference.

**Files modified**: `tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts` (if needed)

**Validation**:
- [ ] `rg getDocsRoot tools/pack-dashboard/server/src/` returns no results
- [ ] `npm run build` succeeds in `tools/pack-dashboard/server/`
- [ ] `GET /api/domain-config` returns the domain list (manual smoke test or existing test)

---

## T005b — Extend `domain-tags.service.ts` with `primary_domain` support

**Purpose**: `ArtifactTagEntry` now has an optional `primary_domain` field. The service must read it, validate it on write, and auto-clear it when the domain it references is removed from `domains`.

**Steps**:

1. Extend the `ArtifactTagsEntry` interface in `domain-tags.service.ts`:
   ```typescript
   export interface ArtifactTagsEntry {
     domains: string[];
     primary_domain?: string;
   }
   ```
2. Update `setArtifactTags` signature to accept `primary_domain`:
   ```typescript
   export function setArtifactTags(
     artifactId: string,
     domains: string[],
     primaryDomain?: string,
   ): void
   ```
3. Add validation before writing:
   ```typescript
   if (primaryDomain && !domains.includes(primaryDomain)) {
     throw Object.assign(
       new Error('primary_domain must be a member of domains'),
       { code: 'PRIMARY_DOMAIN_NOT_IN_DOMAINS', primaryDomain }
     );
   }
   ```
4. Persist `primary_domain` in the tag entry (omit the key entirely when undefined — do not write `primary_domain: null`):
   ```typescript
   current.tags[artifactId] = {
     domains,
     ...(primaryDomain ? { primary_domain: primaryDomain } : {}),
   };
   ```
5. In `artifact-tags.routes.ts`, extract `primary_domain` from `req.body` and pass to `setArtifactTags`. Return HTTP 400 with `{ error: 'primary_domain must be a member of domains' }` when the thrown error has `code === 'PRIMARY_DOMAIN_NOT_IN_DOMAINS'`.
6. `GET /api/artifact-tags/:id` response already returns the full tag entry from YAML — `primary_domain` will be included automatically once persisted.

**Files modified**:
- `tools/pack-dashboard/server/src/services/domain-tags.service.ts`
- `tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts`

**Validation**:
- [ ] `PUT /api/artifact-tags/:id` with `primary_domain` outside `domains` → HTTP 400
- [ ] `PUT /api/artifact-tags/:id` with valid `primary_domain` → persisted; `GET` returns it
- [ ] `PUT /api/artifact-tags/:id` without `primary_domain` → field absent in YAML (no null written)

---

## Definition of Done

- [ ] `config/` directory exists at repo root with `domain-config.yaml` and `artifact-tags.yaml`
- [ ] `docs/domain-config.yaml` and `docs/artifact-tags.yaml` are deleted
- [ ] `getConfigRoot()` exported from `config.ts`, `CONFIG_ROOT` env override works
- [ ] All server reads for these two files go through `getConfigRoot()`
- [ ] `primary_domain` field supported in `ArtifactTagsEntry` — validated, persisted, returned
- [ ] TypeScript compiles without errors
- [ ] Existing domain-config and artifact-tags route tests pass (no regressions)

## Risks

- **Dashboard smoke test**: Any running instance of the dashboard will break until the server is restarted after the file move. This is expected — the migration is atomic within a single commit.
- **Test fixtures**: Any test that hard-codes `docs/domain-config.yaml` paths will fail. Check `rg docs/domain-config tools/pack-dashboard/server/src/` before committing.

## Activity Log

- 2026-05-28T11:26:12Z – cursor:sonnet:implementer:implementer – shell_pid=1753809 – Assigned agent via action command
- 2026-05-28T11:32:12Z – cursor:sonnet:implementer:implementer – shell_pid=1753809 – Config root migration complete. getConfigRoot() added, files moved to config/, primary_domain validated and persisted. tsc --noEmit passes. All artifact-tags and domain-config tests pass (pre-existing reviews.routes failure unrelated). Scope warnings on routes/test files are advisory — changes mandated by T005/T005b.
- 2026-05-28T11:32:51Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1766207 – Started review via action command
- 2026-05-28T11:36:16Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1766207 – Review passed: getConfigRoot() added to config.ts; docs/domain-config.yaml and docs/artifact-tags.yaml git-mv'd to config/; domain-tags.service.ts uses getConfigRoot() throughout; ArtifactTagsEntry has primary_domain?:string; setArtifactTags validates PRIMARY_DOMAIN_NOT_IN_DOMAINS; route returns HTTP 400 on that error; tsc --noEmit clean; all 14 WP01-relevant tests pass; reviews.routes failure is pre-existing debt unrelated to WP01.
