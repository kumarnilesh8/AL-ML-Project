---
work_package_id: WP01
title: Pack Version File
dependencies: []
requirement_refs:
- FR-001
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-regnology-stack-distribution-pipeline-01KSWHFT
base_commit: 705f10bf03431d683ee31f70cce45e223a88728e
created_at: '2026-05-30T19:26:32.478503+00:00'
subtasks:
- T001
- T002
- T003
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "3155303"
history: []
agent_profile: implementer-ivan
authoritative_surface: pack/
execution_mode: code_change
owned_files:
- pack/.pack-version
- pack/README.md
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load implementer-ivan
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Introduce `pack/.pack-version`, a single-line plain-text semver file that anchors
the entire pack distribution pipeline. This file is read by:

- The Jenkins `Validate` stage (WP02) before packaging
- The two installer scripts (`install-regnology-stack.sh` / `.ps1`) to confirm
  the downloaded archive's version matches what the user requested
- The pack maintainer (manually, when bumping versions before merging to `main`)

Also add a short "Version Bumping" section to `pack/README.md` so the procedure is
discoverable.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: A worktree allocated by `finalize-tasks` based on this
  WP's lane in `lanes.json`. Enter the workspace path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`.

## Context

Decision 1 of `research.md` resolves: plain text over YAML. The reasons are:

- Both POSIX shell and PowerShell installers can read a single-line file with no
  parser dependency (`cat` / `Get-Content`).
- The Jenkins agent has no guaranteed `yq` or Python in the shell context.

The initial value is `1.0.0`. The plan's section 1.1 governs the lifecycle: the
pack maintainer bumps this file before merging any pack content change to `main`,
and the Jenkins `Validate` stage (WP02) HEAD-checks the version against
Artefactory to refuse silent re-publication.

---

### Subtask T001 — Create `pack/.pack-version`

**Purpose**: Establish the machine-readable version anchor.

**Steps**:
1. Create `pack/.pack-version` at the repository root with the single line:
   ```
   1.0.0
   ```
   No trailing whitespace beyond the standard newline at end-of-file.

2. Confirm there is no BOM or CR (line-ending must be `\n`, not `\r\n`):
   ```bash
   file pack/.pack-version
   # Expected: ASCII text
   xxd pack/.pack-version | head -1
   # Expected: 31 2e 30 2e 30 0a (which is "1.0.0\n")
   ```

**Files**:
- `pack/.pack-version` (new file, 1 line)

**Validation**:
- [ ] File exists at `pack/.pack-version`
- [ ] Content is exactly `1.0.0\n` (no BOM, no CRLF, no trailing whitespace)
- [ ] `cat pack/.pack-version | tr -d '[:space:]'` produces `1.0.0`

---

### Subtask T002 — Document Version Bumping in `pack/README.md`

**Purpose**: Make the version-bump procedure discoverable to pack maintainers so
WP02's Validate stage does not surprise them on the next merge.

**Steps**:
1. Open `pack/README.md`. The file currently has sections `Install`, `Layout`,
   `Setup guide`, `Status`. Insert the new "Version Bumping" section between
   `Layout` and `Setup guide` (so the lifecycle is documented before any
   workflow guidance that might reference it).

2. Add this section verbatim (adjust heading level to match the file's style):

   ```markdown
   ## Version Bumping

   The pack version lives in `pack/.pack-version` as a plain-text semver string
   (e.g., `1.0.0`). Before merging any pack content change to `main`, bump this
   file according to semver:

   - **MAJOR** — incompatible change to a directive, tactic, or paradigm that
     consumers must adopt
   - **MINOR** — backward-compatible addition (new artifact, new field with
     default)
   - **PATCH** — backward-compatible fix (typo, clarification, metadata)

   The CI `Validate` stage in `Jenkinsfile` rejects merges where the version
   already exists in Artefactory (HTTP HEAD against the versioned archive URL
   returns 200) unless the build is run with `FORCE_PUBLISH=true`. So forgetting
   to bump fails the build immediately on `main`.

   Pre-release suffixes are permitted: `1.2.0-rc1`, `2.0.0-beta3`, etc.
   ```

3. Verify the file still renders correctly (markdown).

**Files**:
- `pack/README.md` (existing, ~15 lines added)

**Validation**:
- [ ] `grep -n "Version Bumping" pack/README.md` returns one match
- [ ] Section explains MAJOR/MINOR/PATCH semantics
- [ ] Section references the `FORCE_PUBLISH` override

---

### Subtask T003 — End-to-end shell-readability verification

**Purpose**: Confirm the file is consumable by the validation regex from
`plan.md` section 1.2 (which the Jenkinsfile will use).

**Steps**:
1. Run the exact regex check the Jenkinsfile will use:
   ```bash
   PACK_VERSION=$(cat pack/.pack-version | tr -d '[:space:]')
   echo "$PACK_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$' \
     && echo "OK: $PACK_VERSION" \
     || { echo "FAIL: regex mismatch"; exit 1; }
   ```

2. Run a deliberately-invalid variant to confirm the regex catches it:
   ```bash
   echo "1.0" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$' \
     && echo "FAIL: should have rejected" \
     || echo "OK: correctly rejected"
   ```

3. Confirm `tr -d '[:space:]'` removes both `\n` and any accidental `\r`:
   ```bash
   printf "1.0.0\r\n" | tr -d '[:space:]' | xxd
   # Expected: just the bytes for 1.0.0, no trailing whitespace
   ```

**Files**:
- None modified; verification only.

**Validation**:
- [ ] Step 1 prints `OK: 1.0.0` and exits 0
- [ ] Step 2 prints `OK: correctly rejected`
- [ ] Step 3 confirms `tr -d` handles both line-ending styles

---

## Definition of Done

- `pack/.pack-version` exists at repo root with content `1.0.0`
- `pack/README.md` has a "Version Bumping" section explaining the lifecycle
- Validation regex from plan.md §1.2 accepts the file content
- Commit message follows repo convention: `feat(pack/WP01): add machine-readable version file`

## Risks

- **None significant** — this is a one-line file. The only failure mode is
  introducing CRLF line endings on Windows, mitigated by the validation in T003.

## Reviewer Guidance

- Confirm the file is exactly 6 bytes (`1.0.0\n`)
- Confirm `pack/README.md` Version Bumping section explicitly references
  `FORCE_PUBLISH` so the WP02 reviewer can cross-reference
- No unrelated changes in the diff
- Run T003 step 1 yourself to confirm shell-readability

## Next Steps

Once approved, WP02 / WP03 / WP04 can run in parallel.

## Activity Log

- 2026-05-30T19:31:03Z – claude:sonnet:implementer-ivan:implementer – shell_pid=3121617 – Assigned agent via action command
- 2026-05-30T19:42:19Z – claude:sonnet:implementer-ivan:implementer – shell_pid=3121617 – WP01 ready: pack/.pack-version=1.0.0 (6 bytes); pack/README.md Version Bumping section between Layout and Setup guide; T003 verification OK.
- 2026-05-30T19:46:50Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3155303 – Started review via action command
- 2026-05-30T19:53:35Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3155303 – Review passed: pack/.pack-version is 1.0.0 (6 bytes). pack/README.md Version Bumping section properly placed between Layout and Setup guide. MAJOR/MINOR/PATCH and FORCE_PUBLISH override documented. Clean diff.
- 2026-06-01T07:45:24Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=3155303 – Moved to done
