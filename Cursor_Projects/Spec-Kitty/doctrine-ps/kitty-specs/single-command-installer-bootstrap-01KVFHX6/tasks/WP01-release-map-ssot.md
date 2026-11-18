---
work_package_id: WP01
title: Release-Map SSOT & Injection Contract
agent: "cursor:opus:code-reviewer-cindy:reviewer"
dependencies: []
requirement_refs:
- C-003
- FR-006
- FR-008
tracker_refs: []
planning_base_branch: feature/single-command-installer-bootstrap
merge_target_branch: feature/single-command-installer-bootstrap
branch_strategy: Planning artifacts for this mission were generated on feature/single-command-installer-bootstrap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/single-command-installer-bootstrap unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-single-command-installer-bootstrap-01KVFHX6
base_commit: c8c5e4fad0b29526f58d72746a35da0104f93b83
created_at: '2026-06-19T12:35:41.885821+00:00'
subtasks:
- T001
- T002
- T003
shell_pid: '1131929'
history:
- timestamp: '2026-06-19T11:53:39Z'
  actor: tasks
  note: Authored from remediated plan (IC-01).
authoritative_surface: config/release-map.yaml
create_intent: []
execution_mode: code_change
owned_files:
- config/release-map.yaml
tags: []
---

# WP01 — Release-Map SSOT & Injection Contract

## Objective

Make `config/release-map.yaml` the authoritative, validated single source of truth for the versions
a release installs, and freeze the placeholder-token contract that both the installer scripts (WP02)
and the Jenkins pipeline (WP03) depend on. This WP is foundational: WP02 and WP03 build directly on
the decisions captured here.

## Context

- The file already exists (created during planning) with schema + a `v2.0.0` entry, but its
  `spec_kitty_version`, `default_spec_kitty_version`, and `base_pack_version` are `NEEDS-CONFIRMATION`
  placeholders (see `research.md` § Open items).
- Resolution model (decision D-005): a `curl|sh` installer cannot resolve a tag at runtime. The
  Jenkins tag build reads this map and **injects** concrete versions into the published installer via
  placeholder tokens. The in-repo fallback installer uses `default_spec_kitty_version` + `latest`
  aliases.
- Do NOT change script or Jenkinsfile behavior here — only the map and its documented contract.
  Those files are owned by WP02/WP03.

## Subtasks

### T001 — Pin/resolve release-map versions

**Purpose**: Replace `NEEDS-CONFIRMATION` with real, verified versions, or — if a value genuinely
cannot be pinned yet — convert it into an explicit, tracked open-resolution rather than leaving a
silent placeholder.

**Steps**:
1. Determine the published spec-kitty distribution to pin. Confirm the package name first
   (`spec-kitty` vs `spec-kitty-cli`; the existing `Jenkinsfile` uses `spec-kitty-cli`). Record the
   confirmed name as a comment in the map.
2. Set `default_spec_kitty_version` to the concrete release chosen for stability (the stakeholder
   directive was "go for 2, to ensure stability" — interpret as the pinned-release strategy, not a
   literal "2.x"; pick the actual stable release and document why).
3. Set `releases[0].spec_kitty_version` for tag `v2.0.0` to the same pinned release (or the specific
   one validated against overlay 2.0.0).
4. Set `base_pack_version` to the upstream `regnology-all-company` release validated against overlay
   `2.0.0`, and record the `{base_upstream}` Artifactory root (used by WP02 endpoint resolution).
5. If any value is still unknowable, keep a clearly-commented sentinel AND open a tracked note in
   `research.md` § Open items — do not pretend it is resolved.

**Files**: `config/release-map.yaml`.

**Validation**:
- [ ] No bare `NEEDS-CONFIRMATION` remains unless paired with a tracked open-resolution note.
- [ ] `default_spec_kitty_version` and the `v2.0.0` mapping are concrete strings.
- [ ] The spec-kitty package name is recorded and consistent with what `pipx install` expects.

### T002 — Define + document the placeholder-token injection contract

**Purpose**: Freeze the token names and substitution semantics so WP02 (scripts) and WP03 (CI) cannot
diverge.

**Steps**:
1. In a header comment block of `config/release-map.yaml`, enumerate the exact tokens:
   `@SPEC_KITTY_VERSION@`, `@OVERLAY_PACK_VERSION@`, `@BASE_PACK_VERSION@`, `@RELEASE_TAG@`.
2. State, per token, the map field it resolves from and the fallback value when un-injected.
3. State the invariant: a published (injected) script contains **no** remaining `@…@` tokens; an
   un-injected script resolves to `default_spec_kitty_version` + `latest` aliases and logs
   "fallback/unpinned mode".
4. Cross-reference `data-model.md` entity 5 (InstallerReleaseBinding) so the contract has one home.

**Files**: `config/release-map.yaml` (comment block only).

**Validation**:
- [ ] Token list in the map matches `data-model.md` exactly (4 tokens).
- [ ] Each token documents source field + fallback.

### T003 — Add release-map schema/lint validation hook [P]

**Purpose**: Prevent a malformed map from silently breaking injection.

**Steps**:
1. Add a lightweight validation the CI lint stage (WP03) and local runs can call — e.g. a short
   `python3 -c` snippet or a tiny script under `config/` that asserts: YAML parses,
   `schema_version` present, `default_spec_kitty_version` present, every `releases[]` has `tag`,
   `spec_kitty_version`, `overlay_pack_version`, `base_pack_version`, and tags are unique.
2. Keep it dependency-free (standard library only) so it runs on the Jenkins `tools` container.
3. Document the invocation in a comment so WP03 can wire it into the lint stage.

> Ownership note: if the validator is a new file, place it where it does not collide with WP02/WP03
> owned files. A `config/`-local helper (e.g. `config/validate-release-map.py`) keeps it inside this
> WP's authoritative surface. If you prefer an inline `python3 -c` in CI, leave only the documented
> snippet here and let WP03 embed it.

**Files**: `config/` (helper colocated with the map) — must stay within `config/`.

**Validation**:
- [ ] Validator rejects a map missing a required key (test by temporarily removing one).
- [ ] Validator passes on the real map.
- [ ] Validator uses only the standard library.

## Branch Strategy

Planning branch: `feature/single-command-installer-bootstrap`. Final merge target:
`feature/single-command-installer-bootstrap`. Execution worktrees are allocated per computed lane
from `lanes.json` (populated by `finalize-tasks`); do not create worktrees manually.

## Definition of Done

- `config/release-map.yaml` has concrete versions (or explicit tracked open-resolutions), the
  documented 4-token contract, and a working dependency-free validator.
- No script or Jenkinsfile edits made in this WP.

## Risks

- Guessing a spec-kitty version that does not exist on PyPI/GitHub — verify before pinning.
- Token-name drift vs `data-model.md` — copy names verbatim.

## Reviewer Guidance

- Confirm no silent `NEEDS-CONFIRMATION` remains.
- Confirm token names match `data-model.md` entity 5 exactly.
- Confirm the validator fails on a removed required key and only touches `config/`.
