# Mission Review Report: pack-governance-dashboard-01KS2WM1

**Reviewer**: Architect Alphonso (Claude Sonnet 4.6, orchestrator)
**Date**: 2026-05-20
**Mission**: `pack-governance-dashboard-01KS2WM1` — Pack Governance Dashboard
**Baseline commit**: `133407feb2fe8a38dd0015a6797af07a63e861c4` (last pre-mission commit to overhaul/migrate_to_kitty)
**Merge commit**: `3c37d40` (squash merge of mission branch)
**HEAD at review**: `eb04d6a95e0f4a2c294964e15bda9075af494dd2`
**WPs reviewed**: WP01, WP02, WP03, WP04, WP05, WP06

---

## Gate Results

### Gate 1 — Contract tests

- Command: `N/A — no contract test suite exists in this repository`
- Exit code: N/A
- Result: **NOT APPLICABLE**
- Notes: This mission builds a local dev tool (`tools/pack-dashboard/`) under the doctrine
  pack repository, not the spec-kitty CLI repository. The contract test suite described in
  Step 8.5 belongs to the spec-kitty repo. No equivalent contract suite exists for this tool.
  This gate does not apply.

### Gate 2 — Architectural tests

- Command: `N/A — no architectural test suite in this repository`
- Exit code: N/A
- Result: **NOT APPLICABLE**
- Notes: Same rationale as Gate 1. Architectural layer enforcement is not configured for
  the `tools/pack-dashboard/` project.

### Gate 3 — Cross-repo E2E

- Command: `N/A — no cross-repo E2E scenario suite for this tool`
- Exit code: N/A
- Result: **NOT APPLICABLE**
- Notes: The tool is a local-only dev utility, not a distributed service. Cross-repo E2E
  scenarios do not apply. No `mission-exception.md` is required.

### Gate 4 — Issue Matrix

- File: `kitty-specs/pack-governance-dashboard-01KS2WM1/issue-matrix.md` — **ABSENT**
- Rows: 0 (file does not exist)
- Result: **NOT APPLICABLE** (no issue matrix was produced during planning)
- Notes: The mission pre-dates formal issue-matrix generation. This is a gap to address
  in the follow-up, not a blocking hard fail for this tool.

---

## FR Coverage Matrix

| FR ID | Description | WP Owner | Test File(s) | Test Adequacy | Finding |
|-------|-------------|----------|--------------|---------------|---------|
| FR-001 | Reads all YAML from pack/ (8 kinds) | WP02 | None | MISSING | [DRIFT-1] |
| FR-002 | Browsable list per kind | WP02 | None | MISSING | [DRIFT-1] |
| FR-003 | Artifact detail with full YAML | WP04 | None | MISSING | [DRIFT-1] |
| FR-004 | Monaco-based YAML editor | WP05 | None | MISSING | [DRIFT-1] [DRIFT-4] |
| FR-005 | Validate in-memory before write | WP05 | None | MISSING | [DRIFT-1] |
| FR-006 | Validate via Python bridge, on-demand | WP03 | None | MISSING | [DRIFT-1] |
| FR-007 | Display validation results (pass/fail + errors) | WP04 | None | MISSING | [DRIFT-1] |
| FR-008 | Support approve / reject / changes_requested only | WP06 | None | MISSING | [DRIFT-1] |
| FR-009 | Line-level comments with severity | WP06 | None | MISSING | [DRIFT-1] |
| FR-010 | Persist review JSON at pack/.reviews/kind/id.review.json | WP06 | None | MISSING | [DRIFT-1] |
| FR-011 | Aggregate review progress dashboard | WP06 | None | MISSING | [DRIFT-1] |
| FR-012 | Bulk validate-all operation | WP03 | None | MISSING | [DRIFT-1] |
| FR-013 | Stable review JSON schema, no artifact_path field | WP06 | None | MISSING | [DRIFT-1] |
| FR-014 | DRG coverage query (unlinked nodes per relation) | WP02 | None | MISSING | [DRIFT-1] |

**Legend**: ADEQUATE = test constrains the required behavior; MISSING = no test file found.

All 14 FRs are MISSING test coverage. See DRIFT-1.

---

## Drift Findings

### DRIFT-1: Complete absence of test files — C-008 and C-009 violated

**Type**: PUNTED-FR (applied to all 14 FRs simultaneously)
**Severity**: CRITICAL
**Spec reference**: C-008, C-009, DIRECTIVE_030, DIRECTIVE_034, tactics `tdd-red-green-refactor`, `acceptance-test-first`, `black-box-integration-testing`

**Evidence**:
- `find tools/pack-dashboard -name "*.spec.ts" -o -name "*.test.ts"` → zero results
- `find tools/pack-dashboard -name "*.spec.py" -o -name "*.test.py"` → zero results
- `tools/pack-dashboard/server/package.json` line 7: `"test": "vitest run"` — Vitest is
  configured but has no test files to run
- `tools/pack-dashboard/package.json` devDependencies includes `karma`, `karma-jasmine`,
  `jasmine-core` — Angular test infrastructure present but no `.spec.ts` files exist

**Analysis**: C-008 requires both TypeScript type checking AND the test suite to pass before
merge. C-009 requires failing tests to exist before implementation code. Neither constraint
was enforced. The root package's `npm test` script runs `ng test && npm test --workspace=server`:
the Angular Karma runner will fail (no spec files match the default glob pattern, causing
Karma to either time out or report 0 tests), and the Vitest runner exits 0 because there are
no tests to run. This means the C-008 gate was never enforced.

Every FR in the coverage matrix above is effectively unverified by automated means. The per-WP
reviews were code reading exercises, not test-driven sign-offs. Any correctness claim rests
solely on the reviewer's visual inspection of source code.

---

### DRIFT-2: Scenario 2 in spec.md contradicts FR-005

**Type**: LOCKED-DECISION VIOLATION (spec self-inconsistency)
**Severity**: LOW
**Spec reference**: spec.md Scenario 2 vs FR-005

**Evidence**:
- `spec.md` Scenario 2: "When they click Save → Then the file is written to disk at the artifact's
  path AND schema validation runs automatically"
- `spec.md` FR-005: "On save, system validates edited YAML **in-memory first**; if validation passes
  the file is written to disk; if validation fails the file is **not** written"
- `artifact-detail.component.ts` `save()`: calls POST `/api/validate` first, returns early
  if `!validationResult.valid` without calling PUT — correctly implements FR-005

**Analysis**: The implementation is correct (follows FR-005). Scenario 2 was authored before
FR-005 was locked and was never updated to match the in-memory-validate-first invariant. A
future maintainer reading Scenario 2 alone would conclude the current implementation is wrong.
The scenario must be updated to match FR-005.

---

### DRIFT-3: CSS symlink bypassed — snapshot always loaded instead of live docops CSS (C-007)

**Type**: LOCKED-DECISION VIOLATION
**Severity**: MEDIUM
**Spec reference**: C-007

**Evidence**:
- `tools/pack-dashboard/angular.json` styles array: `["src/assets/css/regnology-web.snapshot.css", "src/styles.scss"]`
- `tools/pack-dashboard/src/styles.scss`: `@import 'assets/css/regnology-web.snapshot.css';`
- Symlink `src/assets/css/regnology-web.css → /home/stijn/.../regnology-docgen/design-system/dist/regnology-web.css`
  exists but is referenced by neither build config
- `git diff 133407f..3c37d40 -- tools/pack-dashboard/src/assets/css/regnology-web.css`:
  the symlink was added but never wired into `angular.json` or `styles.scss`

**Analysis**: C-007 states "Design system CSS is consumed from regnology-docgen, not duplicated;
a bundled CSS snapshot serves as **fallback** when docops is not checked out." The current
implementation always uses the snapshot, making it the primary source rather than the fallback.
The symlink is cosmetic dead code. Additionally, the symlink stores an absolute path
(`/home/stijn/Documents/...`) that will be broken on every other checkout location. CSS updates
to regnology-docgen will never be reflected automatically.

---

### DRIFT-4: Monaco editor not implemented — FR-004 violated

**Type**: PUNTED-FR
**Severity**: MEDIUM
**Spec reference**: FR-004, spec.md Scenario 2, plan.md Phase 2 step 11

**Evidence**:
- FR-004: "System provides a Monaco-based YAML editor for live artifact editing"
- `tools/pack-dashboard/src/app/components/yaml-editor/yaml-editor.component.ts`: implements
  a `<textarea>` with `font-family: monospace` styling, not Monaco
- `tools/pack-dashboard/package.json` has no `ngx-monaco-editor-v2` entry in dependencies
- WP05 activity log notes the Monaco skip was due to "esbuild incompatibility" but no
  post-merge tracking artifact exists recording this as a deferred known gap

**Analysis**: The `yaml-editor.component.ts` comment reads "textarea-based (Monaco skipped
due to esbuild incompatibility)". This is an implementation divergence from an accepted FR
that was approved by the WP05 reviewer without a formal deferral record. The functional impact
is real: no syntax highlighting, no schema-aware completion, no gutter annotations
(a separate "Should" item, but dependent on Monaco). The deferral decision is sound (esbuild
incompatibility is a genuine constraint), but it must be documented in a tracked artifact.

---

### DRIFT-5: Related-artifacts panel not implemented (plan.md Phase 1 item, MoSCoW Should)

**Type**: PUNTED-FR (Should-tier)
**Severity**: LOW
**Spec reference**: spec.md MoSCoW ("Should"), plan.md Phase 1 step 9

**Evidence**:
- plan.md Phase 1 step 9: "artifact-detail page (YAML display) **+ related-artifacts panel**
  (consumes GET /api/drg, filters edges by current artifact id, zero extra API work)"
- `artifact-detail.component.ts`: no related-artifacts panel, no DRG call on detail load
- The DRG endpoint works and the data is available; the panel was simply not built

**Analysis**: This was classified as "Should" in MoSCoW but was included in Phase 1 (MVP) of
the plan. The omission is defensible given the "Should" priority, but the inconsistency between
plan and MoSCoW should be resolved. No tracking artifact for this gap exists post-merge.

---

## Risk Findings

### RISK-1: Absolute-path symlink breaks on all non-developer checkouts

**Type**: BOUNDARY-CONDITION
**Severity**: MEDIUM
**Location**: `tools/pack-dashboard/src/assets/css/regnology-web.css` (symlink)
**Trigger condition**: Any user checking out the repository on a machine where the path
`/home/stijn/Documents/_code/CLIENTS/regnology/regnology-docgen/...` does not exist

**Analysis**: The symlink committed to git uses a hardcoded absolute path to the developer's
local filesystem. On any other machine, `ls -la` on the symlink shows a dangling reference.
Because `angular.json` currently bypasses the symlink and uses the snapshot directly, this has
no runtime impact today. If C-007 is fixed (symlink wired into build), this becomes a
blocking build failure for all other developers. The symlink should be replaced with a
relative path or a setup script that resolves and creates it.

---

### RISK-2: `validate-all` handler has no request body size guard

**Type**: BOUNDARY-CONDITION
**Severity**: LOW
**Location**: `validation.routes.ts:validateAllHandler`
**Trigger condition**: Large pack directory (hundreds of artifacts)

**Analysis**: `validateAllHandler` spawns up to 8 Python subprocesses concurrently, each
with a 10-second timeout. At scale (e.g. 200 artifacts), this spawns 25 batches × 8
processes = 200 Python processes sequentially. With the 10s timeout per batch, the total
wall time can reach 250+ seconds for a single POST request. There is no streaming response,
no per-batch progress, and no HTTP timeout on the Express route itself. This is a local
tool where the scale is documented as "~100 artifacts", but no enforcement exists.
For the current repo (87 artifacts), the risk is low.

---

### RISK-3: review-store.service.ts `getReview` silently swallows JSON parse errors

**Type**: ERROR-PATH
**Severity**: LOW
**Location**: `review-store.service.ts:24-27`
**Trigger condition**: Malformed `.review.json` file on disk

**Evidence**:
```typescript
} catch {
  return null;
}
```

**Analysis**: If a review file becomes malformed (partial write, encoding issue), `getReview`
returns `null`, which the artifact routes interpret as "no review". The reviewer's decision
silently disappears from the UI. The atomic write (`.tmp` then `renameSync`) protects against
partial writes from the server itself, but does not protect against external edits or
filesystem corruption. For a local dev tool, this is LOW risk but worth noting.

---

## Silent Failure Candidates

| Location | Condition | Silent result | Spec impact |
|----------|-----------|---------------|-------------|
| `review-store.service.ts:24-27` | Malformed review JSON | `null` (review disappears) | FR-010: review persistence appears broken |
| `artifact-detail.component.ts:runValidation()` error handler | Validation HTTP error | `validationStatus = 'unknown'` | FR-007: badge shows 'unknown' with no user explanation |
| `validator.service.ts:getCacheKey()` | `statSync` fails | returns `null`, skips cache | Low impact — validation runs uncached |
| `dashboard.component.ts:loadData()` error handlers | Either HTTP call fails | `tryFinish()` with default values; shows zeros | FR-011: dashboard renders with misleading zero counts |

---

## Security Notes

| Finding | Location | Risk class | Recommendation |
|---------|----------|------------|----------------|
| Absolute-path symlink | `src/assets/css/regnology-web.css` | OPERATIONAL | Replace with relative path or setup script |
| Temp file predictability | `validation.routes.ts:33` | LOW (local tool) | Use `crypto.randomUUID()` or `os.tmpdir()` + random suffix |
| `reviews.routes.ts` kind not validated vs ARTIFACT_KINDS | `reviews.routes.ts:8-13` | LOW | Add ARTIFACT_KINDS check at entry; harmless but inconsistent |
| Python bridge `--path` arg accepts any path | `validator.service.ts:44` | LOW (contained by MODEL_MAP) | The route already validates kind+id via findArtifact; path is always from pack scanner |

Note: No `shell=True` subprocess calls. No credential handling. No network calls. The
`sanitizeId` function correctly strips path traversal characters in review-store. The spawn
arguments are array-based (not shell-interpolated). Overall security posture is appropriate
for a local dev tool.

---

## Final Verdict

**FAIL**

### Verdict rationale

The mission delivers functional code for all 14 FRs except FR-004 (Monaco editor replaced
by textarea). The routing, service, and component layers are correctly structured and the
most security-sensitive patterns (sanitizeId, validate-before-write, atomic review writes,
DRG coverage routing order) are correctly implemented. The WP review cycle was clean — no
re-work cycles.

However, two blocking findings prevent a PASS:

1. **C-008 and C-009 are violated**: Zero test files were shipped. `npm test` runs `vitest run`
   with no test files (exit 0 vacuously) and `ng test` with no spec files (Karma hangs or
   fails). DIRECTIVE_030 and DIRECTIVE_034 were not enforced at merge time. No FR has
   automated verification.

2. **FR-004 is not implemented**: The spec explicitly requires Monaco. A `<textarea>` was
   shipped instead. The esbuild incompatibility rationale is valid but must be tracked as a
   deferred known gap.

These findings do not render the tool unusable — it is a local dev tool and the core
governance workflow (browse → edit → validate → review) functions correctly. But they mean
the delivery is not complete per the spec's own quality contract.

### Open items (non-blocking)

- DRIFT-2: Update spec.md Scenario 2 to match FR-005 validate-before-write sequence
- DRIFT-3: Wire `angular.json` and `styles.scss` to use `regnology-web.css` symlink as
  primary, snapshot as fallback; replace absolute-path symlink with relative or setup-script
- DRIFT-4: Create a tracked follow-up for Monaco integration (or formally downgrade FR-004
  to "Should" in spec.md with documented rationale)
- DRIFT-5: Create a tracked follow-up for related-artifacts panel
- RISK-1: Fix symlink to use relative path
- RISK-3: Log malformed review JSON as a warning rather than silently returning null

---

## Retrospective Reminder

The retrospective record was authored post-merge via `spec-kitty agent retrospect synthesize
--fabricate-empty`. File: `.kittify/missions/01KS2WM1PKXSNB3C61G3M7YND5/retrospective.yaml`.
The auto-generated record from `spec-kitty retrospect create` is preserved as
`retrospective.create-record.yaml` (schema format mismatch with `synthesize`; see engineering
notes for details).

Run `spec-kitty retrospect summary` for cross-mission aggregation.
Run `spec-kitty agent retrospect synthesize --mission pack-governance-dashboard-01KS2WM1`
to review staged proposals (currently none — the record has `ran_no_findings` provenance).
