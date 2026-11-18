---
work_package_id: WP06
title: Built-in scanner service (server)
dependencies: []
requirement_refs:
- FR-011
- FR-012
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-pack-dashboard-domain-tags-builtin-01KS56B1
base_commit: a936d976bfcff2b22cbf720325959f29b5d86ca9
created_at: '2026-05-21T12:40:48.808127+00:00'
subtasks:
- T026
- T027
- T028
- T029
- T030
agent: "claude:sonnet:reviewer:reviewer"
shell_pid: "1511681"
history:
- date: '2026-05-21'
  event: created
  note: Initial WP generated from plan
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/services/
execution_mode: code_change
mission_slug: pack-dashboard-domain-tags-builtin-01KS56B1
owned_files:
- tools/pack-dashboard/server/src/services/builtin-scanner.service.ts
- tools/pack-dashboard/server/src/services/builtin-scanner.service.test.ts
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

Create `BuiltinScannerService` that walks `SPEC_KITTY_SRC/doctrine/` at server startup, caches the result in memory, and provides `getAll()`, `getKind()`, and `getDetail()` query methods. Degrade gracefully (log warning, return empty) when `SPEC_KITTY_SRC` is absent or not a directory.

---

## Branch Strategy

- **Planning base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- Claim workspace: `spec-kitty agent action implement WP06 --agent claude:sonnet:node-norris:implementer`

---

## Context

The spec-kitty built-in doctrine lives at `SPEC_KITTY_SRC/doctrine/` (typically `forks/spec-kitty/src/doctrine/` in this repo). The scanner walks the same subdirectory structure as `PackScannerService.scanKind()` — subdirs named by `ArtifactKind`, containing `.yaml` / `.yml` files.

**Critical constraint**: The `scan()` method MUST call `getSpecKittySrc()` at scan time — never import the frozen `SPEC_KITTY_SRC` constant at module level. This is the same pattern used by PackScannerService: it takes `packRoot` as a parameter at call time.

**Reference implementation**: `tools/pack-dashboard/server/src/services/pack-scanner.service.ts`
**Config getter**: `tools/pack-dashboard/server/src/config.ts` — `getSpecKittySrc()`

**NFR-003**: If `SPEC_KITTY_SRC` is not set or the path does not exist, the scanner returns an empty result and logs a warning. It must never throw.

---

## Subtask T026 — Create `BuiltinScannerService` with `scan()`

**File**: `tools/pack-dashboard/server/src/services/builtin-scanner.service.ts` (new)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getSpecKittySrc } from '../config';
import { ArtifactKind, ArtifactSummary, ArtifactDetail, ARTIFACT_KINDS } from '../models/artifact.model';

// In-memory cache populated at startup
let cache: Record<ArtifactKind, ArtifactSummary[]> | null = null;

function extractId(parsed: Record<string, unknown>, kind: ArtifactKind): string {
  if (kind === 'agent_profiles') {
    return String(parsed['profile-id'] ?? parsed['id'] ?? 'unknown');
  }
  return String(parsed['id'] ?? 'unknown');
}

function extractTitle(parsed: Record<string, unknown>): string {
  return String(parsed['title'] ?? parsed['name'] ?? 'Untitled');
}

function scanBuiltinKind(doctrineRoot: string, kind: ArtifactKind): ArtifactSummary[] {
  const kindDir = path.join(doctrineRoot, kind);
  if (!fs.existsSync(kindDir) || !fs.statSync(kindDir).isDirectory()) return [];

  const files = fs.readdirSync(kindDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const results: ArtifactSummary[] = [];

  for (const file of files) {
    const filePath = path.join(kindDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.load(content) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') continue;

      results.push({
        id: extractId(parsed, kind),
        kind,
        title: extractTitle(parsed),
        filePath,
        source: 'builtin',
      });
    } catch {
      // Silently skip unparseable built-in files
    }
  }

  return results;
}

export function scan(): Record<ArtifactKind, ArtifactSummary[]> {
  // MUST call getSpecKittySrc() here at scan time — not at module load time.
  const specKittySrc = getSpecKittySrc();
  const doctrineRoot = path.join(specKittySrc, 'doctrine');

  const result = {} as Record<ArtifactKind, ArtifactSummary[]>;
  for (const kind of ARTIFACT_KINDS) {
    result[kind] = [];
  }

  if (!fs.existsSync(doctrineRoot) || !fs.statSync(doctrineRoot).isDirectory()) {
    console.warn(`[BuiltinScannerService] SPEC_KITTY_SRC doctrine path not found: ${doctrineRoot}. Built-in artifacts will be empty.`);
    cache = result;
    return result;
  }

  for (const kind of ARTIFACT_KINDS) {
    result[kind] = scanBuiltinKind(doctrineRoot, kind);
  }

  cache = result;
  return result;
}

export function getAll(): Record<ArtifactKind, ArtifactSummary[]> {
  return cache ?? scan();
}

export function getKind(kind: ArtifactKind): ArtifactSummary[] {
  return getAll()[kind] ?? [];
}

export function getDetail(kind: ArtifactKind, id: string): ArtifactDetail | null {
  const summary = getKind(kind).find(a => a.id === id);
  if (!summary) return null;

  try {
    const content = fs.readFileSync(summary.filePath, 'utf-8');
    const parsed = yaml.load(content) as Record<string, unknown>;
    return {
      ...summary,
      content,
      parsedData: parsed ?? {},
    };
  } catch {
    return null;
  }
}
```

---

## Subtask T027 — Graceful empty result when absent

This is handled in `scan()` above: if `doctrineRoot` does not exist or is not a directory, the function:
1. Logs a `console.warn` with the path so developers can diagnose.
2. Returns an empty record (all kinds → `[]`).
3. Caches the empty result so subsequent `getAll()` calls are fast.

**Important**: `getDetail()` reads the file at call time from the summary's `filePath`. If the file disappears after startup (unlikely in normal use), `getDetail()` returns `null` — not a throw.

---

## Subtask T028 — Expose `getAll()`, `getKind()`, `getDetail()`

Already implemented in T026. Summary of the API surface:

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `scan()` | `() => Record<ArtifactKind, ArtifactSummary[]>` | Walk the doctrine dir; populate cache; return result |
| `getAll()` | `() => Record<ArtifactKind, ArtifactSummary[]>` | Return cache (calls scan if not yet populated) |
| `getKind()` | `(kind: ArtifactKind) => ArtifactSummary[]` | Return cached summaries for one kind |
| `getDetail()` | `(kind: ArtifactKind, id: string) => ArtifactDetail \| null` | Read file at call time; return full artifact or null |

All built-in summaries have `source: 'builtin'` set (FR-012).

---

## Subtask T029 — Wire startup scan in `index.ts`

**File**: `tools/pack-dashboard/server/src/index.ts`

Add the startup scan call. It must use the imported `scan` function (which calls `getSpecKittySrc()` internally):

```typescript
import { scan as scanBuiltins } from './services/builtin-scanner.service';

// Call at startup (after app.use() registrations, before app.listen())
scanBuiltins();
```

**Important**: Do NOT pass `SPEC_KITTY_SRC` as an argument to `scan()`. The function reads it internally via `getSpecKittySrc()`. This is the test-isolation contract.

Also: do NOT change the existing `PACK_ROOT` import or usage for pack scanning — that is out of scope for this WP.

---

## Subtask T030 — Unit tests for `BuiltinScannerService`

**File**: `tools/pack-dashboard/server/src/services/builtin-scanner.service.test.ts` (new)

Tests to write:

1. **Happy path — scan finds artifacts**: Set `SPEC_KITTY_SRC` to a temp dir that contains a `doctrine/directives/` subdirectory with one valid YAML file. Call `scan()`, verify `getKind('directives')` returns the expected summary with `source: 'builtin'`.

2. **Absent path — graceful empty**: Set `SPEC_KITTY_SRC` to a non-existent path. Call `scan()`, verify `getAll()` returns an empty record (all kinds are `[]`). Verify no throw.

3. **getDetail — found**: After a successful scan, call `getDetail(kind, id)`. Verify it returns an `ArtifactDetail` with `content` and `parsedData`.

4. **getDetail — not found**: Call `getDetail(kind, 'nonexistent-id')`. Verify it returns `null`.

```typescript
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

describe('BuiltinScannerService', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'builtin-test-'));
    process.env.SPEC_KITTY_SRC = tmpDir;
    jest.resetModules(); // Force re-import so cache is cleared
  });

  afterEach(() => {
    delete process.env.SPEC_KITTY_SRC;
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('scans doctrine dir and returns summaries with source builtin', () => {
    const doctrineDir = path.join(tmpDir, 'doctrine', 'directives');
    fs.mkdirSync(doctrineDir, { recursive: true });
    fs.writeFileSync(
      path.join(doctrineDir, 'test-directive.yaml'),
      'id: test-directive\ntitle: Test Directive\n'
    );

    const { scan, getKind } = require('../services/builtin-scanner.service');
    scan();
    const result = getKind('directives');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-directive');
    expect(result[0].source).toBe('builtin');
  });

  it('returns empty result when doctrine path absent', () => {
    const { scan, getAll } = require('../services/builtin-scanner.service');
    expect(() => scan()).not.toThrow();
    const all = getAll();
    expect(Object.values(all).every(arr => arr.length === 0)).toBe(true);
  });
});
```

**Run**: `cd tools/pack-dashboard/server && npm test`

---

## Definition of Done

- [ ] `BuiltinScannerService` created with `scan()`, `getAll()`, `getKind()`, `getDetail()`
- [ ] All built-in summaries have `source: 'builtin'`
- [ ] `scan()` calls `getSpecKittySrc()` inside the function body — never at module level
- [ ] When `SPEC_KITTY_SRC` path is absent, `scan()` returns empty without throwing
- [ ] Startup scan wired in `index.ts` via `scan()` import (no argument passing)
- [ ] Tests pass for both happy path and absent-path cases
- [ ] TypeScript compiles without errors

---

## Reviewer Guidance

- Verify `getSpecKittySrc()` is called inside `scan()`, not at module top-level.
- Verify the module-level `cache` variable starts as `null` so `jest.resetModules()` in tests works correctly.
- Verify `getDetail()` reads from `summary.filePath` at call time (not from cache) so content is always fresh.
- Confirm existing `index.ts` frozen constant usages are NOT modified by this WP.

## Activity Log

- 2026-05-21T12:40:49Z – claude:sonnet:node-norris:implementer – shell_pid=1495280 – Assigned agent via action command
- 2026-05-21T12:44:16Z – claude:sonnet:node-norris:implementer – shell_pid=1495280 – Ready for review: builtin-scanner.service.ts, getSpecKittySrc() called inside scan(), module-level cache=null, tests passing
- 2026-05-21T12:44:39Z – claude:sonnet:reviewer:reviewer – shell_pid=1511681 – Started review via action command
- 2026-05-21T12:46:04Z – claude:sonnet:reviewer:reviewer – shell_pid=1511681 – Review passed: scan() calls getSpecKittySrc() inside function body (not at module level), module-level cache=null for vi.resetModules() isolation, absent-path returns empty array with console.warn (no throw), source:'builtin' set on all summaries, all 6 tests pass, TypeScript compiles clean. Anti-pattern checks: PASS dead-code (scan() wired in index.ts), PASS synthetic-fixture (tests import and invoke production code), PASS silent-empty (documented graceful-degrade per NFR-003), PASS FR coverage (FR-011 scan/cache, FR-012 source:builtin both tested), PASS frozen-surface (no frozen files touched), N/A locked-decision, PASS shared-file ownership (noted below), N/A production-fragility. Out-of-scope changes: implementer also modified artifact.model.ts (added ArtifactSource type and source? field to ArtifactSummary) and index.ts (wired scanBuiltins() at startup) — both are WP07-owned files, but changes are additive, correct, and required. WP07 implementer should skip those steps to avoid re-adding them.
