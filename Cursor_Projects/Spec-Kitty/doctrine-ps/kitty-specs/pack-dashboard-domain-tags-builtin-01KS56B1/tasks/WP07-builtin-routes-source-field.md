---
work_package_id: WP07
title: GET /api/builtin routes + ArtifactSummary source field
dependencies:
- WP06
requirement_refs:
- FR-011
- FR-012
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T031
- T032
- T033
- T034
- T035
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1530962"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/routes/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/server/src/models/artifact.model.ts
- tools/pack-dashboard/src/app/models/artifact.model.ts
- tools/pack-dashboard/server/src/services/pack-scanner.service.ts
- tools/pack-dashboard/server/src/routes/builtin.routes.ts
- tools/pack-dashboard/server/src/routes/builtin.routes.test.ts
- tools/pack-dashboard/server/src/index.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any further, load the agent profile assigned to this work package:

```
/ad-hoc-profile-load node-norris
```

---

## Objective

Extend `ArtifactSummary` in both server and frontend models with `source?: 'pack' | 'builtin'`. Update `PackScannerService` to emit `source: 'pack'` on every summary. Create the three read-only `GET /api/builtin` routes and register them in `index.ts`.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP07 --agent claude:sonnet:node-norris:implementer`

---

## Context

After WP06, `BuiltinScannerService` is available but not exposed via HTTP. This WP wires it up. It also normalises the `source` discriminant across pack and built-in artifacts.

**Consumer contract** (data-model.md): After this WP, `source` is NOT optional for newly emitted summaries. Pack scanner emits `'pack'`, built-in scanner emits `'builtin'`. Downstream components (`ArtifactListComponent`) treat `source === 'builtin'` as the only special case; all others (including `'pack'`) render as pack artifacts.

**Read before implementing**:
- `tools/pack-dashboard/server/src/services/pack-scanner.service.ts`
- `tools/pack-dashboard/server/src/services/builtin-scanner.service.ts` (WP06)
- `tools/pack-dashboard/server/src/routes/artifacts.routes.ts` (route pattern to follow)
- `kitty-specs/pack-dashboard-domain-tags-builtin-01KS56B1/contracts/builtin.openapi.yaml`

---

## Subtask T031 — Extend `ArtifactSummary` with `source?`

**Server model** `tools/pack-dashboard/server/src/models/artifact.model.ts`:

Add `source?: 'pack' | 'builtin';` to the `ArtifactSummary` interface:

```typescript
export interface ArtifactSummary {
  id: string;
  kind: ArtifactKind;
  title: string;
  filePath: string;
  validationStatus: ValidationStatus;
  reviewStatus?: ReviewStatus;
  parseError?: string;
  source?: 'pack' | 'builtin';  // ← add this
}
```

**Frontend model** `tools/pack-dashboard/src/app/models/artifact.model.ts`:

Add the same field:
```typescript
export interface ArtifactSummary {
  // ...existing fields...
  source?: 'pack' | 'builtin';  // ← add this
}
```

The field is optional (`?`) in the interface because existing callers may not set it yet. After WP07 all new summaries will set it.

---

## Subtask T032 — Update `PackScannerService` to emit `source: 'pack'`

**File**: `tools/pack-dashboard/server/src/services/pack-scanner.service.ts`

In `scanKind()`, add `source: 'pack'` to both the success and error push calls:

```typescript
results.push({
  id: extractId(parsed, kind),
  kind,
  title: extractTitle(parsed),
  filePath,
  validationStatus: 'unknown',
  source: 'pack',   // ← add
});
```

And for parse errors:
```typescript
results.push({
  id: file,
  kind,
  title: `${file} (parse error)`,
  filePath,
  validationStatus: 'invalid',
  parseError: (err as Error).message,
  source: 'pack',   // ← add
});
```

This is a **non-breaking additive change**. Consumers that don't check `source` are unaffected.

---

## Subtask T033 — Create `builtin.routes.ts`

**File**: `tools/pack-dashboard/server/src/routes/builtin.routes.ts` (new)

Three read-only routes:

```typescript
import { Router } from 'express';
import { getAll, getKind, getDetail } from '../services/builtin-scanner.service';
import { ArtifactKind, ARTIFACT_KINDS } from '../models/artifact.model';

const router = Router();

// GET /api/builtin — all kinds
router.get('/', (_req, res) => {
  res.json(getAll());
});

// GET /api/builtin/:kind — one kind
router.get('/:kind', (req, res) => {
  const kind = req.params.kind as ArtifactKind;
  if (!ARTIFACT_KINDS.includes(kind)) {
    return res.status(404).json({ error: `Unknown artifact kind: ${kind}` });
  }
  res.json(getKind(kind));
});

// GET /api/builtin/:kind/:id — single artifact
router.get('/:kind/:id', (req, res) => {
  const kind = req.params.kind as ArtifactKind;
  const { id } = req.params;
  if (!ARTIFACT_KINDS.includes(kind)) {
    return res.status(404).json({ error: `Unknown artifact kind: ${kind}` });
  }
  const detail = getDetail(kind, id);
  if (!detail) {
    return res.status(404).json({ error: `Built-in artifact not found: ${kind}/${id}` });
  }
  res.json(detail);
});

export default router;
```

**Route ordering**: When mounted with `app.use('/api/builtin', builtinRouter)`, the Express router handles the `/`, `/:kind`, and `/:kind/:id` paths in the order listed. No conflict between `/:kind` and `/:kind/:id` because Express will match the longest registered path.

**Write guard**: There are no POST/PUT/DELETE routes on this router. The existing `PUT /api/artifacts/:kind/:id` route (pack artifacts) must never match built-in paths — it is on a separate router mounted at `/api/artifacts`, so there is no risk of collision.

---

## Subtask T034 — Register builtin routes in `index.ts`

**File**: `tools/pack-dashboard/server/src/index.ts`

Add import:
```typescript
import builtinRouter from './routes/builtin.routes';
```

Add mount (after the existing `/api/artifacts` and `/api/validate` mounts):
```typescript
app.use('/api/builtin', builtinRouter);
```

---

## Subtask T035 — Supertest integration tests

**File**: `tools/pack-dashboard/server/src/routes/builtin.routes.test.ts` (new)

Test setup: Use `process.env.SPEC_KITTY_SRC` pointing to a temp dir with a seeded `doctrine/` structure. Use `jest.resetModules()` before each test to clear the `BuiltinScannerService` cache.

Tests to write:

1. **GET /api/builtin** — returns a map with all known kinds as keys; each key maps to an array.
2. **GET /api/builtin/:kind** — returns the array for a known kind.
3. **GET /api/builtin/:kind** — returns 404 for an unknown kind string.
4. **GET /api/builtin/:kind/:id** — returns a full `ArtifactDetail` for a seeded artifact.
5. **GET /api/builtin/:kind/:id** — returns 404 when the artifact ID is not found.
6. **source field** — verify all returned summaries in the array have `source: 'builtin'`.
7. **empty when SPEC_KITTY_SRC absent** — all kinds return `[]` (no crash).

```typescript
import request from 'supertest';
import express from 'express';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const SAMPLE_DIRECTIVE = 'id: my-directive\ntitle: My Directive\n';

describe('builtin routes', () => {
  let tmpDir: string;
  let app: express.Application;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'builtin-route-test-'));
    const doctrineDir = path.join(tmpDir, 'doctrine', 'directives');
    fs.mkdirSync(doctrineDir, { recursive: true });
    fs.writeFileSync(path.join(doctrineDir, 'my-directive.yaml'), SAMPLE_DIRECTIVE);

    process.env.SPEC_KITTY_SRC = tmpDir;
    jest.resetModules();

    const { scan } = require('../../services/builtin-scanner.service');
    scan(); // Prime cache

    const builtinRouter = require('../builtin.routes').default;
    app = express();
    app.use(express.json());
    app.use('/api/builtin', builtinRouter);
  });

  afterEach(() => {
    delete process.env.SPEC_KITTY_SRC;
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('GET /api/builtin returns all kinds', async () => {
    const res = await request(app).get('/api/builtin');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('directives');
  });

  it('GET /api/builtin/directives returns seeded artifact', async () => {
    const res = await request(app).get('/api/builtin/directives');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('my-directive');
    expect(res.body[0].source).toBe('builtin');
  });

  it('GET /api/builtin/directives/my-directive returns full detail', async () => {
    const res = await request(app).get('/api/builtin/directives/my-directive');
    expect(res.status).toBe(200);
    expect(res.body.content).toContain('my-directive');
  });

  it('GET /api/builtin/nonexistent-kind returns 404', async () => {
    const res = await request(app).get('/api/builtin/nonexistent-kind');
    expect(res.status).toBe(404);
  });
});
```

**Run**: `cd tools/pack-dashboard/server && npm test`

---

## Definition of Done

- [ ] `ArtifactSummary.source?: 'pack' | 'builtin'` added to both server and frontend models
- [ ] `PackScannerService.scanKind()` emits `source: 'pack'` on all summaries
- [ ] `GET /api/builtin` returns full kind-keyed map
- [ ] `GET /api/builtin/:kind` returns array for known kind; 404 for unknown
- [ ] `GET /api/builtin/:kind/:id` returns `ArtifactDetail`; 404 when not found
- [ ] All returned built-in summaries have `source: 'builtin'`
- [ ] No POST/PUT/DELETE routes on `builtinRouter`
- [ ] Routes registered in `index.ts`; server starts without error
- [ ] All tests pass; TypeScript compiles

---

## Reviewer Guidance

- Verify no `PUT` or `DELETE` routes exist in `builtin.routes.ts`.
- Verify `PackScannerService` now sets `source: 'pack'` — check both the success and error push in `scanKind()`.
- Verify the frontend `artifact.model.ts` also has the `source?` field (downstream components need it for WP08–WP10).
- Check that the `/:kind` and `/:kind/:id` routes are correctly disambiguated by Express (`:kind/:id` will be matched by the two-segment route when both segments are present).

## Activity Log

- 2026-05-21T12:46:20Z – claude:sonnet:node-norris:implementer – shell_pid=1518892 – Started implementation via action command
- 2026-05-21T12:48:50Z – claude:sonnet:node-norris:implementer – shell_pid=1518892 – Ready for review: GET /api/builtin routes implemented, pack-scanner emits source:pack, frontend model updated, 10 integration tests all pass, TypeScript compiles clean
- 2026-05-21T12:49:07Z – claude:sonnet:reviewer:reviewer – shell_pid=1530962 – Started review via action command
- 2026-05-21T12:52:12Z – claude:sonnet:reviewer:reviewer – shell_pid=1530962 – Review passed: all three GET routes correct (/, /:kind 404 on unknown, /:kind/:id 404 on not-found), pack-scanner emits source:'pack' on both success and error paths, frontend model updated with source field, no write routes on /api/builtin (C-001 satisfied), builtinRouter registered in index.ts, 10 integration tests all pass, TypeScript compiles clean. Minor: 400 vs 404 contract divergence for unknown-kind is consistent with WP prompt spec (WP prompt takes precedence); pack-scanner source assertion not in pack-scanner.test.ts but feature verified via implementation.
