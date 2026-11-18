---
work_package_id: WP02
title: Server Model and Service
dependencies:
- WP01
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
created_at: '2026-05-28T11:36:55.392423+00:00'
subtasks:
- T006
- T007
- T008
shell_pid: "1784772"
agent: "cursor:sonnet:code-reviewer-cindy:reviewer"
history:
- date: '2026-05-28'
  event: created
authoritative_surface: tools/pack-dashboard/server/src/models/
execution_mode: code_change
owned_files:
- tools/pack-dashboard/server/src/models/org-binding.model.ts
- tools/pack-dashboard/server/src/services/org-bindings.service.ts
- tools/pack-dashboard/server/src/services/org-bindings.service.test.ts
tags: []
---

# WP02 — Server Model and Service

## Branch Strategy

- **Planning/base branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Depends on**: WP01 (config migration must be complete)
- To implement: `spec-kitty agent action implement WP02 --agent <name>`

## Objective

Create the TypeScript data model and the full CRUD service for org-bindings. The service reads/writes `config/org-bindings.yaml` using atomic writes, detects orphaned bindings at read time, and validates inputs before mutations.

## Context

- File format defined in `data-model.md` (schema_version, bindings array).
- Atomic write pattern: write to `<path>.tmp` then `fs.renameSync` — same as `domain-tags.service.ts`.
- ID generation: `crypto.randomUUID()` (Node.js built-in — no new dependency).
- Orphan detection: check `domain_id` against `getDomainConfig().domains` at read time.
- Server-side validation: `domain_id` in vocabulary, `accountability` in R/A/C/I enum, SPOC regex if `@` present, department non-empty ≤120 chars, involvement ≤800 chars.
- `PUT` on an orphaned binding (rebind intent) must accept a new valid `domain_id` — do not reject solely because the *current* `domain_id` is orphaned.

---

## T006 — Create `server/src/models/org-binding.model.ts`

**Purpose**: Define the shared TypeScript types that the service and routes both import.

**Content**:

```typescript
// tools/pack-dashboard/server/src/models/org-binding.model.ts

export type RaciRole = 'R' | 'A' | 'C' | 'I';
export const RACI_ROLES: RaciRole[] = ['R', 'A', 'C', 'I'];

export const RACI_LABELS: Record<RaciRole, string> = {
  R: 'Responsible',
  A: 'Accountable',
  C: 'Consulted',
  I: 'Informed',
};

export interface OrgBinding {
  id: string;
  domain_id: string;
  department: string;
  spoc: string;
  accountability: RaciRole;
  involvement?: string;
  /** Computed at read time — not persisted to disk. */
  orphaned?: boolean;
}

export interface OrgBindingsFile {
  schema_version: '1.0';
  bindings: OrgBinding[];
}

export interface ValidationError {
  error: string;
  fields: Record<string, string>;
}
```

**Files created**: `tools/pack-dashboard/server/src/models/org-binding.model.ts`

**Validation**:
- [ ] TypeScript compiles
- [ ] All types exported

---

## T007 — Create `server/src/services/org-bindings.service.ts`

**Purpose**: CRUD operations on `config/org-bindings.yaml` with orphan detection and input validation.

**Full implementation**:

```typescript
// tools/pack-dashboard/server/src/services/org-bindings.service.ts

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { getConfigRoot } from '../config';
import { getDomainConfig } from './domain-tags.service';
import {
  OrgBinding, OrgBindingsFile, RaciRole, RACI_ROLES, ValidationError
} from '../models/org-binding.model';

const SPOC_EMAIL_RE = /.*@regnology\.net$/;

function getFilePath(): string {
  return path.join(getConfigRoot(), 'org-bindings.yaml');
}

function readFile(): OrgBindingsFile {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) {
    return { schema_version: '1.0', bindings: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.load(raw) as OrgBindingsFile;
  return parsed ?? { schema_version: '1.0', bindings: [] };
}

function writeFile(data: OrgBindingsFile): void {
  const filePath = getFilePath();
  const tmpPath = filePath + '.tmp';
  // Persist without the computed `orphaned` field
  const cleaned: OrgBindingsFile = {
    schema_version: data.schema_version,
    bindings: data.bindings.map(({ orphaned: _o, ...rest }) => rest as OrgBinding),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmpPath, yaml.dump(cleaned, { lineWidth: 120 }), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function getValidDomainIds(): Set<string> {
  return new Set(getDomainConfig().domains.map(d => d.id));
}

function attachOrphanFlag(bindings: OrgBinding[], validIds: Set<string>): OrgBinding[] {
  return bindings.map(b => ({
    ...b,
    orphaned: !validIds.has(b.domain_id) ? true : undefined,
  }));
}

export function validateInput(
  input: Partial<OrgBinding>,
  opts: { isRebind?: boolean } = {}
): ValidationError | null {
  const fields: Record<string, string> = {};

  if (!input.department || input.department.trim().length === 0) {
    fields['department'] = 'Department is required.';
  } else if (input.department.length > 120) {
    fields['department'] = 'Department must be 120 characters or fewer.';
  }

  if (!input.spoc || input.spoc.trim().length === 0) {
    fields['spoc'] = 'SPOC is required.';
  } else if (input.spoc.includes('@') && !SPOC_EMAIL_RE.test(input.spoc)) {
    fields['spoc'] = 'SPOC email must be an @regnology.net address.';
  }

  if (!input.accountability || !RACI_ROLES.includes(input.accountability as RaciRole)) {
    fields['accountability'] = 'Accountability must be one of R, A, C, I.';
  }

  if (input.involvement && input.involvement.length > 800) {
    fields['involvement'] = 'Involvement must be 800 characters or fewer.';
  }

  const validIds = getValidDomainIds();
  if (!input.domain_id) {
    fields['domain_id'] = 'Domain is required.';
  } else if (!opts.isRebind && !validIds.has(input.domain_id)) {
    fields['domain_id'] = `Unknown domain: ${input.domain_id}`;
  } else if (opts.isRebind && !validIds.has(input.domain_id)) {
    // Rebind must target a valid domain
    fields['domain_id'] = `Target domain does not exist: ${input.domain_id}`;
  }

  return Object.keys(fields).length > 0 ? { error: 'Validation failed', fields } : null;
}

export function listBindings(): OrgBinding[] {
  const data = readFile();
  const validIds = getValidDomainIds();
  return attachOrphanFlag(data.bindings, validIds);
}

export function createBinding(input: Omit<OrgBinding, 'id' | 'orphaned'>): OrgBinding {
  const data = readFile();
  const newBinding: OrgBinding = {
    ...input,
    id: crypto.randomUUID(),
  };
  data.bindings.push(newBinding);
  writeFile(data);
  return newBinding;
}

export function updateBinding(id: string, input: Omit<OrgBinding, 'id' | 'orphaned'>): OrgBinding | null {
  const data = readFile();
  const idx = data.bindings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  const updated: OrgBinding = { ...input, id };
  data.bindings[idx] = updated;
  writeFile(data);
  return updated;
}

export function deleteBinding(id: string): boolean {
  const data = readFile();
  const before = data.bindings.length;
  data.bindings = data.bindings.filter(b => b.id !== id);
  if (data.bindings.length === before) return false;
  writeFile(data);
  return true;
}
```

**Files created**: `tools/pack-dashboard/server/src/services/org-bindings.service.ts`

**Validation**:
- [ ] TypeScript compiles
- [ ] `orphaned` field is stripped before writing to YAML
- [ ] `config/` directory is created by `writeFile` if absent (via `mkdirSync recursive`)

---

## T008 — Write Vitest unit tests for the service

**Purpose**: Verify CRUD operations, validation logic, and orphan detection in isolation.

**File**: `tools/pack-dashboard/server/src/services/org-bindings.service.test.ts`

Key test cases to cover:

```typescript
// 1. listBindings() returns [] when file absent
// 2. createBinding() writes a new record; returned id is a UUID
// 3. createBinding() + listBindings() round-trip — data survives a second read
// 4. updateBinding() modifies an existing record; returns updated binding
// 5. updateBinding() with unknown id returns null
// 6. deleteBinding() removes the record; subsequent list does not include it
// 7. deleteBinding() with unknown id returns false
// 8. validateInput() — missing department → fields.department set
// 9. validateInput() — spoc with non-regnology.net email → fields.spoc set
// 10. validateInput() — spoc with plain text (no @) → passes
// 11. validateInput() — invalid accountability → fields.accountability set
// 12. listBindings() — binding with domain_id not in config → orphaned: true
// 13. Atomic write: .tmp file is renamed (no .tmp left after write)
```

Use `vi.mock` or a temp directory (`os.tmpdir()`) and override `CONFIG_ROOT` via `process.env.CONFIG_ROOT` in `beforeEach` / `afterEach` to isolate file I/O.

**Files created**: `tools/pack-dashboard/server/src/services/org-bindings.service.test.ts`

**Validation**:
- [ ] `npm test` in `tools/pack-dashboard/server/` passes
- [ ] All 13 cases covered

---

## Definition of Done

- [ ] `org-binding.model.ts` created with all exports
- [ ] `org-bindings.service.ts` created — CRUD, validation, orphan detection, atomic writes
- [ ] `org-bindings.service.test.ts` created — all 13 test cases pass
- [ ] TypeScript compiles (`tsc --noEmit`) in server project

## Risks

- **Domain config dependency in tests**: `validateInput` calls `getDomainConfig()` which reads from disk. Tests must mock this or set `CONFIG_ROOT` to a temp dir with a seeded `domain-config.yaml`.
- **`crypto.randomUUID` availability**: Available in Node.js 15+. The project uses Node 20 — no issue.

## Activity Log

- 2026-05-28T11:36:56Z – cursor:sonnet:implementer:implementer – shell_pid=1772748 – Assigned agent via action command
- 2026-05-28T11:45:18Z – cursor:sonnet:implementer:implementer – shell_pid=1772748 – OrgBinding model + service created. CRUD, validation, orphan detection, atomic writes implemented. 13 Vitest tests pass. tsc clean.
- 2026-05-28T11:45:46Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1784772 – Started review via action command
- 2026-05-28T11:48:24Z – cursor:sonnet:code-reviewer-cindy:reviewer – shell_pid=1784772 – Review passed: model (OrgBinding, RaciRole, OrgBindingsFile, ValidationError), service (CRUD, atomic write, orphan detection, SPOC validation), 13 Vitest tests pass, tsc clean. getConfigRoot backport from WP01 lane is legitimate. Pre-existing reviews.routes.test failure unrelated to WP02.
