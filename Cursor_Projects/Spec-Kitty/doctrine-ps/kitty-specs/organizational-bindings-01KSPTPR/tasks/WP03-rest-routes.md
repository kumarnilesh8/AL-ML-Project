---
work_package_id: WP03
title: REST Routes
dependencies:
- WP02
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-008
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-organizational-bindings-01KSPTPR
base_commit: ca3ccef9c51c5c29ce62863975c041e820c4f808
created_at: '2026-05-28T11:48:44.170722+00:00'
subtasks:
- T009
- T010
- T011
- T012
shell_pid: "1803679"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/server/src/routes/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/routes/org-bindings.routes.ts
- tools/pack-dashboard/server/src/routes/org-bindings.routes.test.ts
- tools/pack-dashboard/server/src/index.ts
tags: []
---

# WP03 — REST Routes

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Depends on**: WP02 (model + service)
- To implement: `spec-kitty agent action implement WP03 --agent <name>`

## Objective

Implement the four REST endpoints for org-bindings as an Express Router, mount it in `index.ts`, write route-level tests, and update the startup log string.

## Context

- All routes live under `/api/org-bindings`.
- Follow the same pattern as `domain-config.routes.ts` and `reviews.routes.ts`.
- Validation is delegated to `validateInput()` from the service; routes return 400 with the `ValidationError` shape on failure.
- `PUT` on an existing orphaned binding must accept a new valid `domain_id` (rebind intent). Pass `{ isRebind: true }` to `validateInput` when the current binding is orphaned.
- `DELETE` returns 204 on success, 404 when id not found.
- OpenAPI contract: `kitty-specs/organizational-bindings-01KSPTPR/contracts/org-bindings-api.yaml`.

---

## T009 — Create `server/src/routes/org-bindings.routes.ts`

**Purpose**: Express Router implementing GET / POST / PUT / DELETE for org-bindings.

**Implementation**:

```typescript
// tools/pack-dashboard/server/src/routes/org-bindings.routes.ts

import { Router, Request, Response } from 'express';
import {
  listBindings,
  createBinding,
  updateBinding,
  deleteBinding,
  validateInput,
} from '../services/org-bindings.service';

const router = Router();

// GET /api/org-bindings
router.get('/', (_req: Request, res: Response) => {
  try {
    res.json(listBindings());
  } catch (err) {
    res.status(500).json({ error: 'Failed to read org-bindings' });
  }
});

// POST /api/org-bindings
router.post('/', (req: Request, res: Response) => {
  const input = req.body;
  const err = validateInput(input);
  if (err) { res.status(400).json(err); return; }
  try {
    const created = createBinding(input);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create binding' });
  }
});

// PUT /api/org-bindings/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const input = req.body;

  // Detect rebind intent: current binding may be orphaned
  const existing = listBindings().find(b => b.id === id);
  if (!existing) { res.status(404).json({ error: 'Binding not found' }); return; }

  const isRebind = existing.orphaned === true;
  const err = validateInput(input, { isRebind });
  if (err) { res.status(400).json(err); return; }

  try {
    const updated = updateBinding(id, input);
    if (!updated) { res.status(404).json({ error: 'Binding not found' }); return; }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update binding' });
  }
});

// DELETE /api/org-bindings/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = deleteBinding(id);
    if (!deleted) { res.status(404).json({ error: 'Binding not found' }); return; }
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete binding' });
  }
});

export default router;
```

**Files created**: `tools/pack-dashboard/server/src/routes/org-bindings.routes.ts`

**Validation**:
- [ ] TypeScript compiles
- [ ] All four HTTP methods present

---

## T010 — Mount router in `index.ts`

**Purpose**: Make the routes reachable at `/api/org-bindings`.

**Steps**:

1. Open `tools/pack-dashboard/server/src/index.ts`.
2. Add import after the existing route imports:
   ```typescript
   import orgBindingsRouter from './routes/org-bindings.routes';
   ```
3. Mount after the `artifact-tags` mount:
   ```typescript
   app.use('/api/org-bindings', orgBindingsRouter);
   ```

**Files modified**: `tools/pack-dashboard/server/src/index.ts`

**Validation**:
- [ ] `GET http://localhost:3000/api/org-bindings` returns `[]` on a fresh install

---

## T011 — Write Vitest route tests

**Purpose**: Verify HTTP semantics — status codes, validation errors, 404 handling.

**File**: `tools/pack-dashboard/server/src/routes/org-bindings.routes.test.ts`

Key cases:

```typescript
// Use supertest + the express app exported from index.ts
// Override CONFIG_ROOT to a temp dir in beforeEach

// 1. GET /api/org-bindings → 200 with [] when no file
// 2. POST valid body → 201, body has id field
// 3. POST missing department → 400, fields.department present
// 4. POST spoc with non-regnology email → 400, fields.spoc present
// 5. POST invalid accountability → 400, fields.accountability present
// 6. PUT /api/org-bindings/:id valid update → 200, updated body
// 7. PUT /api/org-bindings/unknown → 404
// 8. DELETE /api/org-bindings/:id → 204
// 9. DELETE /api/org-bindings/unknown → 404
// 10. GET after POST → orphaned: true for binding with unknown domain_id
```

**Files created**: `tools/pack-dashboard/server/src/routes/org-bindings.routes.test.ts`

**Validation**:
- [ ] All 10 cases pass with `npm test`

---

## T012 — Update startup log string

**Purpose**: Rename the dashboard in the server's startup console output.

**Steps**:

1. Open `tools/pack-dashboard/server/src/index.ts`.
2. Find:
   ```typescript
   console.log(`Pack Governance Dashboard API running on http://localhost:${PORT}`);
   ```
3. Replace with:
   ```typescript
   console.log(`Doctrine Organisational Management Dashboard API running on http://localhost:${PORT}`);
   ```

**Files modified**: `tools/pack-dashboard/server/src/index.ts`

**Validation**:
- [ ] Server startup output shows new name

---

## Definition of Done

- [ ] All four endpoints reachable and returning correct status codes
- [ ] Validation errors return 400 with `{ error, fields }` shape
- [ ] 404 on unknown id for PUT and DELETE
- [ ] Route tests pass
- [ ] TypeScript compiles
- [ ] Startup log updated

## Risks

- **Supertest setup**: Verify `supertest` is already in `devDependencies` of the server package (`tools/pack-dashboard/server/package.json`). If missing, check how existing route tests (`domain-config.routes.test.ts`) import it.

## Activity Log

- 2026-05-28T11:48:45Z – cursor:sonnet:implementer:implementer – shell_pid=1789892 – Assigned agent via action command
- 2026-05-28T11:57:49Z – cursor:sonnet:implementer:implementer – shell_pid=1789892 – org-bindings router with CRUD + GET:id + rebind/cascade actions. Mounted in index.ts. 15 route tests pass. tsc clean. Backported getConfigRoot, model, and service from WP01/WP02 (not yet merged into base).
- 2026-05-28T11:58:16Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1803679 – Started review via action command
- 2026-05-28T12:00:00Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1803679 – Review passed: all 15 route tests pass; action routes correctly ordered before /:id; POST→201, DELETE→204, 404/400 semantics verified; tsc clean; startup log updated; backported WP01/WP02 items treated as neutral
