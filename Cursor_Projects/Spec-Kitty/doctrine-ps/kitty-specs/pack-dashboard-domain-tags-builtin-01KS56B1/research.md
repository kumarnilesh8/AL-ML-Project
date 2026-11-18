# Research: Pack Dashboard — Domain Tags and Built-in Doctrine

**Mission**: pack-dashboard-domain-tags-builtin-01KS56B1
**Date**: 2026-05-21

All design decisions below were derived from the engineering note
(`docs/engineering_notes/2026-05-21-pack-dashboard-next-features.md`) and the
existing server/frontend codebase.

---

## 1. File I/O Strategy for Domain YAML Files

**Decision**: Read-per-request; no in-memory cache.

**Rationale**: At ~100 artifacts and 10 domain tags, `docs/artifact-tags.yaml` is a tiny file.
Node.js `readFileSync` + `js-yaml.load` on each request costs ≈ 1–3 ms locally, well inside the
400 ms NFR budget. Caching would require invalidation logic (file watcher or TTL) that adds
complexity for negligible benefit.

**Alternatives considered**:
- _In-memory cache with file watcher_: Rejected. Adds `fs.watch` setup, teardown in tests, and a
  cache-invalidation edge case when the file is edited outside the dashboard while the server is
  running.
- _Cache with TTL_: Rejected. Stale reads possible without clear user benefit.

---

## 2. Atomic Write for `artifact-tags.yaml`

**Decision**: `fs.writeFileSync` to `artifact-tags.yaml.tmp`, then `fs.renameSync` to
  `artifact-tags.yaml`. The rename is atomic on POSIX filesystems.

**Rationale**: A partial write (process killed mid-flush) would corrupt the YAML file. An atomic
rename ensures the file is either the old or the new version, never a partial.

**Alternatives considered**:
- _Append-only journal_: Over-engineered for a file with ~100 entries updated by a single user.
- _lockfile_: Adds dependency; not needed at this concurrency level.

---

## 3. Built-in Artifact Scanner Caching

**Decision**: Scan `SPEC_KITTY_SRC/doctrine/` once at server startup and hold results in memory.
No file watcher; no cache invalidation during process lifetime.

**Rationale**: Built-in artifacts are read-only from the dashboard's perspective and are only
updated when spec-kitty itself is updated (which requires a server restart). Memory footprint
for ~192 YAML artifacts (typically < 4 KB each) is negligible (< 800 KB parsed). Startup scan
runs once and does not block the event loop (sync read-dir is acceptable at startup, before
the server starts accepting connections).

**Alternatives considered**:
- _Read-per-request scan_: Rejected. Directory walk over ~192 files is measurably slower than
  an in-memory lookup.
- _File watcher on SPEC_KITTY_SRC_: Rejected. Over-engineered; users update built-ins by
  restarting the server, not by patching files in place.

---

## 4. Domain Chip Colour Mapping

**Decision**: The `color` field in `domain-config.yaml` maps to a predefined set of CSS modifier
classes. The following colour names are supported:

| `color` value | CSS class | Token basis |
|---------------|-----------|-------------|
| `blue` | `.dc-chip--blue` | `--rn-ice-blue` (#1788BE) |
| `green` | `.dc-chip--green` | `--rn-green-dark` (#06A74E) |
| `red` | `.dc-chip--red` | `--rn-color-danger` (#C62828) |
| `petrol` | `.dc-chip--petrol` | `--rn-petrol-blue` (#012D3F) |
| `amber` | `.dc-chip--amber` | `#B36800` (WCAG-safe warning amber) |
| `purple` | `.dc-chip--purple` | neutral purple derived from stone-grey |
| _(anything else)_ | `.dc-chip--default` | `--rn-stone-grey` |

**Rationale**: Keeps chip colours within the design-system token system (DIRECTIVE_001 / Dagmar
F-09 pattern). Prevents arbitrary hex colours from entering the CSS. Unknown colour names fall
back gracefully.

**Alternatives considered**:
- _Pass raw hex from config_: Rejected. Bypasses design system tokens; creates WCAG risk.
- _No colour mapping_: Rejected. The UX value of visually distinguishing domain tags by colour
  is explicit in the engineering note.

---

## 5. Client-Side Built-in ID Resolution (Option B)

**Decision**: `StructuredViewComponent` loads the full built-in artifact map on init via
`BuiltinService.getAll()` (which calls `GET /api/builtin`). The `PackRef` resolver checks
both the pack artifact map and the built-in map when resolving ID references.

**Rationale**: The existing `ArtifactService.getAll()` already loads the full pack map on init.
Extending the same pattern to built-ins adds one HTTP call on first load (< 400 ms) and zero
extra round-trips per chip. Server-side resolution (Option A) would require schema changes to
`ArtifactDetail.parsedData` and adds logic in the scanner.

**Alternatives considered**:
- _Option A (server-side resolution)_: Rejected per engineering note recommendation. More invasive
  and provides no user-visible benefit.

---

## 6. YAML Editor Default State

**Decision**: The YAML Content section on the artifact-detail page is **collapsed by default**.
It is expandable via a disclosure button. This keeps the page focused on the Structured View,
which is the primary read surface.

**Rationale**: User explicitly requested collapsed-by-default during planning. The Structured View
is richer and more readable than raw YAML for most users. Power users can expand for editing.

---

## 7. Built-in Detail View — Read-Only Enforcement

**Decision**: Enforce read-only in the Angular component, not via a separate route guard.
`BuiltinDetailComponent` sets `isBuiltin = true` and passes `[readOnly]="true"` to
`YamlEditorComponent`. The server never exposes PUT/DELETE on `/api/builtin/**`.

**Rationale**: The component itself is the simplest enforcement point. A route guard would
require the editor component to know about its own guard, or use a service flag, which is more
complex. Server-level enforcement (no PUT route) is the ultimate safety net.

---

## 8. Test Strategy

**Server**:
- `supertest` integration tests for each new route, using real temp YAML files
  (`fs.mkdtempSync` + `process.env.PACK_ROOT` / `SPEC_KITTY_SRC` override via `config.ts` getters)
- Domain tags service: unit tests for validation logic (unknown domain ID rejection, idempotent write)
- Built-in scanner: unit test with a temp directory containing sample YAML files; test the
  graceful-empty path when directory does not exist

**Frontend**:
- Angular TestBed unit tests for `DomainChipsComponent` (read-only and editable variants)
- `DomainService` / `BuiltinService`: test with `HttpClientTestingModule`
- `BuiltinDetailComponent`: test that `readOnly` is passed to the YAML editor and banner is shown
