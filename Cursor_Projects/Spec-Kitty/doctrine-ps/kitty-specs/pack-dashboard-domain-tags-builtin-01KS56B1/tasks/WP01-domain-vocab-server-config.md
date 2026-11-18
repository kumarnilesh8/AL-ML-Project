---
work_package_id: WP01
title: Domain vocabulary + GET /api/domain-config
dependencies: []
requirement_refs:
- FR-001
- FR-002
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-pack-dashboard-domain-tags-builtin-01KS56B1
base_commit: a936d976bfcff2b22cbf720325959f29b5d86ca9
created_at: '2026-05-21T12:40:42.816511+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1507440"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/routes/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- docs/domain-config.yaml
- tools/pack-dashboard/server/src/config.ts
- tools/pack-dashboard/server/src/routes/domain-config.routes.ts
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading any further, load the agent profile assigned to this work package:

```
/ad-hoc-profile-load node-norris
```

This profile is optimised for Node.js/TypeScript server work. Follow its guidance throughout this WP.

---

## Objective

Create the domain vocabulary YAML file (`docs/domain-config.yaml`) with 10 starter domains, add `DomainTagsService` to the Express server with a `getDomainConfig()` method, expose the data at `GET /api/domain-config`, and add a `getDocsRoot()` getter to `config.ts` for testable path resolution.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Worktree**: allocated per `lanes.json` — check with `spec-kitty next --agent <your-name> --mission pack-dashboard-domain-tags-builtin-01KS56B1`

Claim workspace before starting:
```bash
spec-kitty agent action implement WP01 --agent claude:sonnet:node-norris:implementer
```

---

## Context

The pack governance dashboard currently has no domain classification axis. This WP lays the server foundation for the domain tag feature: a vocabulary file and a read-only GET endpoint.

**Existing patterns to follow**:
- `tools/pack-dashboard/server/src/routes/artifacts.routes.ts` — Express router pattern
- `tools/pack-dashboard/server/src/services/pack-scanner.service.ts` — service pattern
- `tools/pack-dashboard/server/src/config.ts` — getter pattern (`getPackRoot()`, `getSpecKittySrc()`)

**Key constraint (C-003)**: The domain vocabulary in `domain-config.yaml` is the only allowed source of truth for valid domain IDs. The GET endpoint must never 500 when the file is absent — it returns `{domains:[]}` (FR-001).

---

## Subtask T001 — Create `docs/domain-config.yaml`

**Purpose**: Provide the 10-domain starter vocabulary that the server reads on every request.

**File**: `docs/domain-config.yaml` (repo root, not inside `tools/`)

**Content**:
```yaml
schema_version: "1"
domains:
  - id: engineering
    label: Engineering
    description: Software engineering practices, architecture, and technical standards.
    color: blue
  - id: security
    label: Security
    description: Application security, threat modelling, and compliance controls.
    color: red
  - id: communications
    label: Communications
    description: Stakeholder communication, reporting, and documentation standards.
    color: petrol
  - id: governance
    label: Governance
    description: Organizational policies, decision frameworks, and audit requirements.
    color: amber
  - id: devops
    label: DevOps
    description: CI/CD pipelines, deployment, and infrastructure automation.
    color: blue
  - id: quality
    label: Quality
    description: Testing strategies, quality gates, and defect management.
    color: green
  - id: architecture
    label: Architecture
    description: System design patterns, integration strategies, and structural decisions.
    color: petrol
  - id: research
    label: Research
    description: Technical investigation, proof-of-concept work, and knowledge synthesis.
    color: purple
  - id: tooling
    label: Tooling
    description: Developer tools, IDE configuration, and productivity infrastructure.
    color: amber
  - id: delivery
    label: Delivery
    description: Project delivery, sprint management, and release coordination.
    color: green
  - id: brand-alignment
    label: Brand Alignment
    description: Brand consistency, visual identity, and communication style standards.
    color: amber
  - id: design
    label: Design
    description: UX/UI design, interaction patterns, and product experience standards.
    color: purple
```

**Validation**: Run `cat docs/domain-config.yaml` and confirm 12 domains are present with unique IDs.

---

## Subtask T002 — Add `DomainTagsService` with `getDomainConfig()`

**Purpose**: Encapsulate file I/O for the domain config. Read-per-request (no caching); absent file → empty result (not an error).

**File**: `tools/pack-dashboard/server/src/services/domain-tags.service.ts` (new)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getDocsRoot } from '../config';

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

export function getDomainConfig(): DomainConfigFile {
  const filePath = path.join(getDocsRoot(), 'domain-config.yaml');
  if (!fs.existsSync(filePath)) {
    return { schema_version: '1', domains: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as DomainConfigFile;
  return parsed ?? { schema_version: '1', domains: [] };
}
```

**Key behaviours**:
- `getDocsRoot()` is called inside the function (not at module level), so `process.env.DOCS_ROOT` overrides work in tests.
- Returns empty domain list rather than throwing when file is absent.
- Does NOT cache — each call reads from disk. This is intentional (file changes without restart).

---

## Subtask T003 — Create `domain-config.routes.ts`

**Purpose**: Expose `GET /api/domain-config` as a simple read-through to `getDomainConfig()`.

**File**: `tools/pack-dashboard/server/src/routes/domain-config.routes.ts` (new)

```typescript
import { Router } from 'express';
import { getDomainConfig } from '../services/domain-tags.service';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const config = getDomainConfig();
    res.json({ domains: config.domains });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read domain configuration' });
  }
});

export default router;
```

**Response shape** (matches OpenAPI contract):
```json
{ "domains": [ { "id": "engineering", "label": "Engineering", "description": "...", "color": "blue" } ] }
```

---

## Subtask T004 — Add `getDocsRoot()` to `config.ts` and register route

**Purpose**: Provide a testable path getter for the `docs/` directory. Register the new router in `index.ts`.

**Edit `tools/pack-dashboard/server/src/config.ts`** — add after the `getSpecKittySrc()` export:

```typescript
export function getDocsRoot(): string {
  return process.env.DOCS_ROOT || path.join(REPO_ROOT, 'docs');
}
```

**Edit `tools/pack-dashboard/server/src/index.ts`** — add import and mount:

```typescript
// Add import
import domainConfigRouter from './routes/domain-config.routes';

// Add route (after existing app.use('/api/validate', ...) block)
app.use('/api/domain-config', domainConfigRouter);
```

**Important**: Do NOT change the existing `PACK_ROOT` frozen constant usage for the `scanPack` call in `index.ts`. That pre-existing code is out of this WP's scope. Only add the new import and mount line.

---

## Subtask T005 — Supertest integration tests

**Purpose**: Verify the GET endpoint returns correct data and degrades gracefully when the file is absent.

**File**: `tools/pack-dashboard/server/src/routes/domain-config.routes.test.ts` (new)

The tests must:
1. Override `DOCS_ROOT` via `process.env.DOCS_ROOT` before importing the route (use a temp directory from `os.tmpdir()`).
2. **Happy path**: Write a real `domain-config.yaml` to the temp dir, call `GET /api/domain-config`, assert HTTP 200 and `{ domains: [...] }` with at least one entry.
3. **Absent file**: Set `DOCS_ROOT` to a temp dir with no YAML file, call the endpoint, assert HTTP 200 and `{ domains: [] }`.
4. **Malformed file**: Write invalid YAML, assert HTTP 500 (or 200 with empty list — document the choice in a comment).

Test file pattern — follow `tools/pack-dashboard/server/src/routes/reviews.routes.test.ts` for the supertest + express setup.

```typescript
import request from 'supertest';
import express from 'express';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

describe('GET /api/domain-config', () => {
  let tmpDir: string;
  let app: express.Application;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-test-'));
    process.env.DOCS_ROOT = tmpDir;
    // Re-require the router after setting env
    jest.resetModules();
    const domainConfigRouter = require('../routes/domain-config.routes').default;
    app = express();
    app.use(express.json());
    app.use('/api/domain-config', domainConfigRouter);
  });

  afterEach(() => {
    delete process.env.DOCS_ROOT;
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('returns domains from file', async () => {
    fs.writeFileSync(path.join(tmpDir, 'domain-config.yaml'),
      'schema_version: "1"\ndomains:\n  - id: eng\n    label: Eng\n    description: Test\n');
    const res = await request(app).get('/api/domain-config');
    expect(res.status).toBe(200);
    expect(res.body.domains).toHaveLength(1);
    expect(res.body.domains[0].id).toBe('eng');
  });

  it('returns empty domains when file is absent', async () => {
    const res = await request(app).get('/api/domain-config');
    expect(res.status).toBe(200);
    expect(res.body.domains).toEqual([]);
  });
});
```

**Run tests**: `cd tools/pack-dashboard/server && npm test`

---

## Definition of Done

- [ ] `docs/domain-config.yaml` exists with exactly 12 starter domains, all with unique IDs
- [ ] `GET /api/domain-config` returns `{ domains: [...] }` with all 12 entries when file is present
- [ ] `GET /api/domain-config` returns `{ domains: [] }` (HTTP 200, not 500) when file is absent
- [ ] `getDocsRoot()` getter exists in `config.ts`; `DOCS_ROOT` env var overrides path
- [ ] Route registered in `index.ts`; server starts without error
- [ ] All tests pass: `cd tools/pack-dashboard/server && npm test`
- [ ] TypeScript compiles: `cd tools/pack-dashboard/server && npx tsc --noEmit`

---

## Reviewer Guidance

- Verify `getDomainConfig()` calls `getDocsRoot()` inside the function body, NOT at module top level.
- Verify `index.ts` does NOT replace the existing frozen `PACK_ROOT` reference — that change is out of scope.
- Confirm the 12 starter domains match the spec's list: engineering, security, communications, governance, devops, quality, architecture, research, tooling, delivery, brand-alignment, design.
- Confirm the 400/422 response codes mentioned in the OpenAPI spec are addressed in WP02 (not this WP).

## Activity Log

- 2026-05-21T12:40:43Z – claude:sonnet:node-norris:implementer – shell_pid=1495001 – Assigned agent via action command
- 2026-05-21T12:43:22Z – claude:sonnet:node-norris:implementer – shell_pid=1495001 – Ready for review: 12-domain vocab YAML, getDomainConfig(), GET /api/domain-config, getDocsRoot getter, integration tests passing
- 2026-05-21T12:43:41Z – claude:sonnet:reviewer:reviewer – shell_pid=1507440 – Started review via action command
- 2026-05-21T12:45:10Z – claude:sonnet:reviewer:reviewer – shell_pid=1507440 – Review passed: 12-domain vocab, getDocsRoot getter correct, absent-file returns 200, index.ts wired, tests pass
