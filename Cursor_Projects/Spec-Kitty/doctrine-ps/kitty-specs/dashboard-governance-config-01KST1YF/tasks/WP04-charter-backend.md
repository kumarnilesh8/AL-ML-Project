---
work_package_id: WP04
title: Charter Backend
dependencies: []
requirement_refs:
- FR-009
- FR-010
- FR-011
- FR-012
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:24:45.565582+00:00'
subtasks:
- T017
- T018
- T019
- T020
- T021
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1041558"
history: []
agent_profile: node-norris
authoritative_surface: tools/pack-dashboard/server/src/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/models/charter.model.ts
- tools/pack-dashboard/server/src/services/charter.service.ts
- tools/pack-dashboard/server/src/services/charter.service.test.ts
- tools/pack-dashboard/server/src/routes/charter.routes.ts
- tools/pack-dashboard/server/src/index.ts
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

Implement the complete charter backend: data model, `CharterService`, HTTP routes, and
Express app registration. Charter entries persist to `config/charter-config.yaml` (NOT
`pack/org-charter.yaml` — that file is a separate spec-kitty governance artifact).

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Independent of Lane A — start from: `spec-kitty agent action implement WP04 --agent <name>`

## Context

**Config root resolution** (same pattern as all other services):
```typescript
import { getConfigRoot } from '../config';
const filePath = path.join(getConfigRoot(), 'charter-config.yaml');
```

**Atomic write pattern** (established):
```typescript
const tmpPath = filePath + '.tmp';
const serialized = yaml.dump(data, { lineWidth: 120 });
fs.writeFileSync(tmpPath, serialized, 'utf-8');
fs.renameSync(tmpPath, filePath);
```

**Existing index.ts registrations** (lines 36–55 of server/src/index.ts):
```typescript
app.use('/api/domain-config', domainConfigRouter);
app.use('/api/artifact-tags', artifactTagsRouter);
app.use('/api/org-bindings', orgBindingsRouter);
```
Add charter router in the same pattern.

**CONSTRAINT C-002**: `pack/org-charter.yaml` is a spec-kitty governance artifact. No
code in this WP may read from or write to `pack/org-charter.yaml`. The charter feature
exclusively uses `config/charter-config.yaml`.

## Subtask Guidance

### T017 — Server charter.model.ts

**File**: Create `tools/pack-dashboard/server/src/models/charter.model.ts`

```typescript
export type ArtifactKind =
  | 'directives'
  | 'tactics'
  | 'procedures'
  | 'styleguides'
  | 'toolguides'
  | 'paradigms'
  | 'agent_profiles'
  | 'mission_step_contracts'
  | 'templates';

export const VALID_ARTIFACT_KINDS: ArtifactKind[] = [
  'directives', 'tactics', 'procedures', 'styleguides', 'toolguides',
  'paradigms', 'agent_profiles', 'mission_step_contracts', 'templates',
];

export interface CharterEntry {
  artifact_id: string;
  artifact_kind: ArtifactKind;
}

export interface CharterConfigFile {
  schema_version: string; // "1"
  entries: CharterEntry[];
}
```

---

### T018 — charter.service.ts

**File**: Create `tools/pack-dashboard/server/src/services/charter.service.ts`

**Implement three public functions**:

**`list(): CharterEntry[]`** — read charter-config.yaml; return empty array if file absent:
```typescript
export function list(): CharterEntry[] {
  const filePath = path.join(getConfigRoot(), 'charter-config.yaml');
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as CharterConfigFile | null;
  return parsed?.entries ?? [];
}
```

**`add(entry: CharterEntry): void`** — append to charter; 409 if duplicate:
```typescript
export function add(entry: CharterEntry): void {
  // Validate kind
  if (!VALID_ARTIFACT_KINDS.includes(entry.artifact_kind)) {
    throw Object.assign(new Error('Invalid artifact_kind'), { code: 'INVALID_KIND', provided: entry.artifact_kind });
  }
  if (!entry.artifact_id || typeof entry.artifact_id !== 'string') {
    throw Object.assign(new Error('artifact_id required'), { code: 'MISSING_ARTIFACT_ID' });
  }
  // Validate artifact_id matches ^[A-Za-z0-9_-]{1,200}$
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(entry.artifact_id)) {
    throw Object.assign(new Error('Invalid artifact_id format'), { code: 'INVALID_ARTIFACT_ID' });
  }
  // Normalise artifact_id to lowercase before storage and duplicate detection
  const normalised_id = entry.artifact_id.toLowerCase();
  const entries = list();
  if (entries.some(e => e.artifact_id === normalised_id)) {
    throw Object.assign(new Error('Already chartered'), { code: 'ALREADY_CHARTERED', artifact_id: normalised_id });
  }
  entries.push({ artifact_id: normalised_id, artifact_kind: entry.artifact_kind });
  writeCharter(entries);
}
```

**`remove(artifactId: string): void`** — remove entry; 404 if missing:
```typescript
export function remove(artifactId: string): void {
  const entries = list();
  const idx = entries.findIndex(e => e.artifact_id === artifactId);
  if (idx === -1) {
    throw Object.assign(new Error('Not in charter'), { code: 'NOT_CHARTERED', artifact_id: artifactId });
  }
  entries.splice(idx, 1);
  writeCharter(entries);
}
```

**Private `writeCharter(entries)`** — atomic write (creates file on first write):
```typescript
function writeCharter(entries: CharterEntry[]): void {
  const filePath = path.join(getConfigRoot(), 'charter-config.yaml');
  const data: CharterConfigFile = { schema_version: '1', entries };
  const tmpPath = filePath + '.tmp';
  const serialized = yaml.dump(data, { lineWidth: 120 });
  fs.writeFileSync(tmpPath, serialized, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}
```

---

### T019 — charter.routes.ts

**File**: Create `tools/pack-dashboard/server/src/routes/charter.routes.ts`

```typescript
import { Router } from 'express';
import { list, add, remove } from '../services/charter.service';
import { CharterEntry } from '../models/charter.model';

const router = Router();

router.get('/', (_req, res) => {
  try {
    res.json({ entries: list() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read charter' });
  }
});

router.post('/', (req, res) => {
  try {
    const { artifact_id, artifact_kind } = req.body as CharterEntry;
    add({ artifact_id, artifact_kind });
    res.status(201).json({ entry: { artifact_id, artifact_kind } });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    const msg = (err as Error).message;
    if (code === 'ALREADY_CHARTERED') return res.status(409).json({ error: msg, artifact_id: (err as { artifact_id: string }).artifact_id });
    if (['INVALID_KIND', 'MISSING_ARTIFACT_ID'].includes(code ?? '')) return res.status(400).json({ error: msg });
    res.status(500).json({ error: msg });
  }
});

router.delete('/:artifactId', (req, res) => {
  try {
    remove(decodeURIComponent(req.params.artifactId));
    res.status(204).send();
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    const msg = (err as Error).message;
    if (code === 'NOT_CHARTERED') return res.status(404).json({ error: msg, artifact_id: req.params.artifactId });
    res.status(500).json({ error: msg });
  }
});

export default router;
```

Note `decodeURIComponent(req.params.artifactId)` — artifact IDs like `REGNOLOGY_BRANDING` are safe, but artefact IDs with slashes or special chars need URL-decoding.

---

### T020 — Register in index.ts

**File**: `tools/pack-dashboard/server/src/index.ts`

Add import:
```typescript
import charterRouter from './routes/charter.routes';
```

Add registration after the org-bindings line:
```typescript
app.use('/api/charter', charterRouter);
```

No ordering concern here (charter routes have no overlap with existing routes).

---

### T021 — Vitest unit tests

**File**: Create `tools/pack-dashboard/server/src/services/charter.service.test.ts`

**Test cases**:

*list()*:
- Returns `[]` when charter-config.yaml does not exist
- Returns entries when file exists and is valid YAML

*add()*:
- Adds entry and writes charter-config.yaml on first call (file did not exist before)
- Second add with different artifact_id succeeds; both entries present
- Duplicate artifact_id throws `ALREADY_CHARTERED` (code: 'ALREADY_CHARTERED')
- Invalid artifact_kind throws `INVALID_KIND`
- Missing artifact_id throws `MISSING_ARTIFACT_ID`

*remove()*:
- Removes correct entry by artifact_id
- Non-existent artifact_id throws `NOT_CHARTERED` (code: 'NOT_CHARTERED')
- After remove, remaining entries are preserved

*file creation*:
- add() when file does not exist: file is created with correct schema_version
- list() when file does not exist: returns [] without throwing

**Mocking**: Use `vi.mock('fs')` to mock existsSync, readFileSync, writeFileSync, renameSync.

## Definition of Done

- [ ] `charter.model.ts` exports CharterEntry, CharterConfigFile, VALID_ARTIFACT_KINDS, ArtifactKind
- [ ] `charter.service.ts` exports `list`, `add`, `remove`
- [ ] `list()` returns `[]` (not error) when charter-config.yaml absent
- [ ] `add()` creates charter-config.yaml on first write
- [ ] `add()` validates `artifact_id` format (`^[A-Za-z0-9_-]{1,200}$`) and normalises to lowercase before storage and duplicate check
- [ ] `add()` throws ALREADY_CHARTERED on duplicate artifact_id
- [ ] `remove()` throws NOT_CHARTERED on missing artifact_id
- [ ] `charter.routes.ts` returns correct HTTP status codes (201, 204, 400, 404, 409, 500)
- [ ] `decodeURIComponent` applied to `:artifactId` path param in DELETE handler
- [ ] `index.ts` registers `app.use('/api/charter', charterRouter)`
- [ ] NO reference to `pack/org-charter.yaml` anywhere in this WP
- [ ] Vitest tests pass: `npx vitest run charter`
- [ ] `npx tsc --noEmit` compiles clean

## Risks

- File path: ensure `getConfigRoot()` resolves to `<repo>/config/` and the charter file lands at `config/charter-config.yaml` — not inside `pack/`. Verify with a `console.log` test or assert the filePath in unit tests.
- `artifact_id` with URL-special characters (unlikely but possible) — `decodeURIComponent` in route handler covers this.

## Activity Log

- 2026-06-01T10:24:47Z – claude:sonnet:node-norris:implementer – shell_pid=1022826 – Assigned agent via action command
- 2026-06-01T10:28:37Z – claude:sonnet:node-norris:implementer – shell_pid=1022826 – Charter backend implemented: model, service with artifact_id validation and lowercase normalization, routes, registered in index.ts, Vitest tests pass (19/19)
- 2026-06-01T10:29:09Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041558 – Started review via action command
- 2026-06-01T10:31:10Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041558 – Review passed: artifact_id validation (INVALID_ARTIFACT_ID) and lowercase normalization before dedup both implemented and tested; charterRouter registered in index.ts; atomic writes confirmed; 19/19 tests pass; tsc --noEmit clean; no pack/org-charter.yaml references; diff touches only charter.service.ts, charter.routes.ts, charter.service.test.ts
