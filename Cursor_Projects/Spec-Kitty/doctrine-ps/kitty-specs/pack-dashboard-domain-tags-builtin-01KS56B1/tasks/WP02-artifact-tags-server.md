---
work_package_id: WP02
title: Artifact tags + GET/PUT /api/artifact-tags
dependencies:
- WP01
requirement_refs:
- FR-003
- FR-004
- FR-005
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
subtasks:
- T006
- T007
- T008
- T009
- T010
- T011
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1526233"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/services/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- docs/artifact-tags.yaml
- tools/pack-dashboard/server/src/services/domain-tags.service.ts
- tools/pack-dashboard/server/src/services/domain-tags.service.test.ts
- tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts
- tools/pack-dashboard/server/src/routes/artifact-tags.routes.test.ts
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

Create the `docs/artifact-tags.yaml` seed file, extend `DomainTagsService` with `getArtifactTags()` and `setArtifactTags()`, add the `GET /api/artifact-tags` and `PUT /api/artifact-tags/:id` routes with full validation (400 / 422), and implement atomic file write.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP02 --agent claude:sonnet:node-norris:implementer`

---

## Context

WP01 added `getDomainConfig()` to `DomainTagsService`. This WP extends that service with the artifact-side methods and exposes them via REST. The PUT route validates domain IDs against the vocabulary and writes atomically using a `.tmp` → `renameSync` pattern to prevent partial writes on interruption.

**OpenAPI contract**: `kitty-specs/pack-dashboard-domain-tags-builtin-01KS56B1/contracts/domain-tags.openapi.yaml`  
**Key requirements**:
- `GET /api/artifact-tags` → `{ tags: Record<string, { domains: string[] }> }` (FR-003)
- `PUT /api/artifact-tags/:id` accepts `{ domains: string[] }` (FR-005)
- PUT returns 204 on success, 400 on missing/non-array `domains`, 422 on unknown domain ID
- PUT is idempotent — calling twice with the same body leaves the file unchanged (NFR-002)
- Domain IDs are validated against the vocabulary from `getDomainConfig()` (C-003)

---

## Subtask T006 — Create `docs/artifact-tags.yaml`

**Purpose**: Provide the empty seed file so the GET endpoint has something to return on first run.

**File**: `docs/artifact-tags.yaml`

```yaml
schema_version: "1"
tags: {}
```

No entries yet — this file is populated via the dashboard UI or manual edits.

---

## Subtask T007 — Add `getArtifactTags()` + `setArtifactTags()` to `DomainTagsService`

**Purpose**: Read and write the artifact-tags file. `setArtifactTags()` validates domain IDs and writes atomically.

**Edit `tools/pack-dashboard/server/src/services/domain-tags.service.ts`** — append after existing `getDomainConfig()`:

```typescript
export function getArtifactTags(): ArtifactTagsFile {
  const filePath = path.join(getDocsRoot(), 'artifact-tags.yaml');
  if (!fs.existsSync(filePath)) {
    return { schema_version: '1', tags: {} };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as ArtifactTagsFile;
  return parsed ?? { schema_version: '1', tags: {} };
}

export function setArtifactTags(artifactId: string, domains: string[]): void {
  // Validate domain IDs against vocabulary
  const config = getDomainConfig();
  const validIds = new Set(config.domains.map(d => d.id));
  const unknown = domains.filter(d => !validIds.has(d));
  if (unknown.length > 0) {
    throw Object.assign(new Error('Unknown domain IDs'), { unknownDomains: unknown });
  }

  // Load existing tags and overwrite entry for this artifact
  const current = getArtifactTags();
  current.tags[artifactId] = { domains };

  // Atomic write: write to .tmp then rename
  const filePath = path.join(getDocsRoot(), 'artifact-tags.yaml');
  const tmpPath = filePath + '.tmp';
  const serialized = yaml.dump(current, { lineWidth: 120 });
  fs.writeFileSync(tmpPath, serialized, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}
```

**Key invariants**:
- `getDocsRoot()` is called inside each function — never at module level.
- `setArtifactTags()` overwrites the complete `domains` array for the given ID (not a merge).
- If `domains` is `[]` the entry is written as `domains: []` (artifact stays in file, FR-005).
- The `.tmp` + `renameSync` pattern makes writes atomic on POSIX filesystems.

---

## Subtask T008 — Create `artifact-tags.routes.ts`

**Purpose**: Expose the GET and PUT endpoints.

**File**: `tools/pack-dashboard/server/src/routes/artifact-tags.routes.ts` (new)

```typescript
import { Router } from 'express';
import { getArtifactTags, setArtifactTags } from '../services/domain-tags.service';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const tagsFile = getArtifactTags();
    res.json({ tags: tagsFile.tags });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read artifact tags' });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { domains } = req.body;

  // 400: missing or non-array domains field
  if (!Array.isArray(domains)) {
    return res.status(400).json({ error: '`domains` must be an array of domain ID strings' });
  }

  try {
    setArtifactTags(id, domains);
    return res.status(204).send();
  } catch (err: unknown) {
    if (err instanceof Error && 'unknownDomains' in err) {
      return res.status(422).json({
        error: 'Unknown domain IDs',
        unknown_domains: (err as any).unknownDomains,
      });
    }
    return res.status(500).json({ error: 'Failed to write artifact tags' });
  }
});

export default router;
```

---

## Subtask T009 — 400 + 422 validation

This is handled inside the `PUT /:id` route above:
- **400**: `domains` field is absent or not an array → return `{ error: "..." }` with HTTP 400.
- **422**: `setArtifactTags()` throws with `unknownDomains` property → return `{ error: "...", unknown_domains: [...] }` with HTTP 422.

The `unknown_domains` array allows the client to show which IDs were rejected.

---

## Subtask T010 — Atomic file write

The atomic write pattern is implemented in `setArtifactTags()` above via:
```typescript
fs.writeFileSync(tmpPath, serialized, 'utf-8');
fs.renameSync(tmpPath, filePath);
```

`renameSync` is atomic on POSIX systems (Linux, macOS). On Windows, it replaces the destination atomically in Node.js ≥ 12. If `docs/artifact-tags.yaml` does not yet exist (first write), `renameSync` still works because we are creating, not replacing.

**Important**: Ensure `getDocsRoot()` returns a path that exists before the first write. If `docs/` does not exist on the test system, `writeFileSync` will throw. The tests should create the temp directory before exercising PUT.

---

## Subtask T011 — Supertest integration tests

**File**: `tools/pack-dashboard/server/src/routes/artifact-tags.routes.test.ts` (new)

Tests to write:

1. **GET — empty file**: `docs/artifact-tags.yaml` is absent → HTTP 200, `{ tags: {} }`.
2. **GET — existing file**: Write a real `artifact-tags.yaml` → HTTP 200, tags returned correctly.
3. **PUT — success**: Valid domain ID from `domain-config.yaml` → HTTP 204, file updated.
4. **PUT — idempotent**: Two identical PUTs → file content is identical (compare file hash or content).
5. **PUT — 400**: Send `{}` body (no `domains` field) → HTTP 400.
6. **PUT — 400 non-array**: Send `{ domains: "engineering" }` → HTTP 400.
7. **PUT — 422**: Send `{ domains: ["nonexistent-domain"] }` → HTTP 422, `unknown_domains` in body.
8. **PUT — empty domains**: Send `{ domains: [] }` → HTTP 204, artifact entry written with empty list.

```typescript
import request from 'supertest';
import express from 'express';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const DOMAIN_CONFIG_YAML = `schema_version: "1"\ndomains:\n  - id: engineering\n    label: Engineering\n    description: Test\n`;
const ARTIFACT_TAGS_YAML = `schema_version: "1"\ntags:\n  my-artifact:\n    domains:\n      - engineering\n`;

describe('artifact-tags routes', () => {
  let tmpDir: string;
  let app: express.Application;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tags-test-'));
    process.env.DOCS_ROOT = tmpDir;
    jest.resetModules();
    const router = require('../routes/artifact-tags.routes').default;
    app = express();
    app.use(express.json());
    app.use('/api/artifact-tags', router);
    // Seed domain config for validation tests
    fs.writeFileSync(path.join(tmpDir, 'domain-config.yaml'), DOMAIN_CONFIG_YAML);
  });

  afterEach(() => {
    delete process.env.DOCS_ROOT;
    fs.rmSync(tmpDir, { recursive: true });
  });

  // ... (implement each test case above)
});
```

**Run**: `cd tools/pack-dashboard/server && npm test`

---

## Register in `index.ts`

Add to `tools/pack-dashboard/server/src/index.ts`:

```typescript
import artifactTagsRouter from './routes/artifact-tags.routes';
// ...
app.use('/api/artifact-tags', artifactTagsRouter);
```

---

## Definition of Done

- [ ] `docs/artifact-tags.yaml` exists with `schema_version: "1"` and empty `tags: {}`
- [ ] `GET /api/artifact-tags` returns `{ tags: {} }` when file is absent (HTTP 200)
- [ ] `GET /api/artifact-tags` returns existing tags when file is present
- [ ] `PUT /api/artifact-tags/:id` with valid domains returns 204 and updates file
- [ ] `PUT /api/artifact-tags/:id` with unknown domain returns 422 with `unknown_domains`
- [ ] `PUT /api/artifact-tags/:id` with missing/non-array `domains` returns 400
- [ ] PUT is idempotent — two identical calls produce identical file state
- [ ] Route registered in `index.ts`; server starts without error
- [ ] All tests pass; TypeScript compiles without errors

---

## Reviewer Guidance

- Verify `setArtifactTags()` calls `getDomainConfig()` and `getArtifactTags()` inside the function body, never at module top level.
- Verify the `.tmp` → `renameSync` atomic pattern is present in `setArtifactTags()`.
- Verify the 400 response fires when `domains` is absent OR non-array — not only when absent.
- Verify the 422 response body contains `unknown_domains` as an array of strings matching the OpenAPI contract.
- Confirm idempotency test passes.

## Activity Log

- 2026-05-21T12:45:40Z – claude:sonnet:node-norris:implementer – shell_pid=1516076 – Started implementation via action command
- 2026-05-21T12:48:00Z – claude:sonnet:node-norris:implementer – shell_pid=1516076 – Ready for review: artifact-tags YAML seed, GET/PUT /api/artifact-tags with 400/422 validation, atomic write, 8 passing tests, TypeScript clean
- 2026-05-21T12:48:17Z – claude:sonnet:reviewer:reviewer – shell_pid=1526233 – Started review via action command
- 2026-05-21T12:49:54Z – claude:sonnet:reviewer:reviewer – shell_pid=1526233 – Review passed: atomic write verified (writeFileSync+renameSync), getDocsRoot inside function bodies only, 400/422 correct, idempotent PUT, domains array overwrite confirmed, all 8 tests pass, TypeScript compiles clean
