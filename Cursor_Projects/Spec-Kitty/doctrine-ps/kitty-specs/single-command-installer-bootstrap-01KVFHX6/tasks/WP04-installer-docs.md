---
work_package_id: WP04
title: Installation Documentation
dependencies:
- WP02
- WP03
requirement_refs:
- C-004
- FR-011
tracker_refs: []
planning_base_branch: feature/single-command-installer-bootstrap
merge_target_branch: feature/single-command-installer-bootstrap
branch_strategy: Planning artifacts for this mission were generated on feature/single-command-installer-bootstrap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/single-command-installer-bootstrap unless the human explicitly redirects the landing branch.
subtasks:
- T014
- T015
- T016
agent: "cursor:opus:code-reviewer-cindy:reviewer"
shell_pid: "1253380"
history:
- timestamp: '2026-06-19T11:53:39Z'
  actor: tasks
  note: Authored from remediated plan (FR-011, C-004).
authoritative_surface: docs/HOW_TO_INSTALL.md
create_intent: []
execution_mode: code_change
owned_files:
- docs/HOW_TO_INSTALL.md
- dist/scripts/README.md
tags: []
---

# WP04 — Installation Documentation

## Objective

Make the user-facing documentation accurate for the remediated design: Python 3.12 prerequisite, the
two-layer source model, integrity verification, fallback semantics (no payload failover), release-tag
pinning, and a one-command invocation that matches the published entrypoint. Closes delta Δ8.

## Context

- Implement after WP02/WP03 so the documented behavior matches the shipped scripts and pipeline.
- Owns only `docs/HOW_TO_INSTALL.md` and `dist/scripts/README.md`. Apply Directive 041 branding where
  the existing docs already carry it; match the surrounding style.
- Stale content to fix: any "Python 3.9+" references, single-pack framing, and `regnology-default-*`
  artifact names.

## Subtasks

### T014 — Update `docs/HOW_TO_INSTALL.md`

**Purpose**: Primary install guide reflects the remediated flow (FR-011).

**Steps**:
1. State the Python **3.12** prerequisite (remove any 3.9+ language).
2. Document the two-layer source model: base `regnology-all-company` consumed from the upstream
   Artifactory root (`{base_upstream}`), overlay `ps-agent-enabled-factory` from this repo's path;
   applied base→overlay.
3. Document integrity verification (detached `.sha256` checked before extraction).
4. Document fallback semantics precisely (D-001/C-002): Artifactory is the only automatic runtime
   payload source; Bitbucket hosts the script for discovery/manual download only — no payload
   failover.
5. Document release-tag pinning + build-time injection at a user level (a tagged installer installs a
   fixed spec-kitty version; running the in-repo script uses the documented default/fallback).
6. Give the exact one-command invocation per platform (macOS, Debian, Windows PowerShell) and the
   env vars the user may need to set (Artifactory URL/repo/path, `{base_upstream}`, token var).
7. Document the preflight failure messages users may see (missing / access-denied / network) and
   their remediations.

**Files**: `docs/HOW_TO_INSTALL.md`.

**Validation**:
- [ ] No "3.9" prerequisite remains; 3.12 stated.
- [ ] Two-layer model, integrity, fallback semantics, and pinning all documented.
- [ ] Documented command matches the published installer entrypoint name.

### T015 — Update `dist/scripts/README.md` + invocation parity [P]

**Purpose**: Keep the scripts' own README consistent and confirm the published entrypoint name.

**Steps**:
1. Align `dist/scripts/README.md` with `HOW_TO_INSTALL.md` (single source of truth for the command;
   cross-link rather than duplicate where practical).
2. Document the placeholder/fallback behavior for developers running the in-repo script from a clone.
3. Verify the documented one-command URL matches what WP03 publishes
   (`install-regnology-stack-latest.sh` / `.ps1`).

**Files**: `dist/scripts/README.md`.

**Validation**:
- [ ] README command and published artifact name agree.
- [ ] Fallback/unpinned developer behavior is explained.

### T016 — Non-Debian guidance + token handling note [P]

**Purpose**: Cover C-004 and NFR-005 at the documentation level.

**Steps**:
1. Add a short section: Debian/apt, macOS/brew, Windows/winget are first-class automated targets;
   other Linux distros receive guidance only and should install Python 3.12/pipx manually.
2. Add a token-handling note: tokens are read from environment variables only, never committed or
   echoed; show the env var name(s) without example secrets.

**Files**: `docs/HOW_TO_INSTALL.md` (section) and/or `dist/scripts/README.md`.

**Validation**:
- [ ] Non-Debian guidance present and clearly marked as guidance-only.
- [ ] Token-handling note present with no example secret values.

## Branch Strategy

Planning branch: `feature/single-command-installer-bootstrap`. Final merge target:
`feature/single-command-installer-bootstrap`. Worktrees allocated per `lanes.json`. Depends on
**WP02** and **WP03** so the docs describe shipped behavior.

## Definition of Done

- Both docs accurately describe Python 3.12, the two-layer model, integrity verification, fallback
  semantics, release-tag pinning, the exact per-platform command, and non-Debian guidance — with no
  stale 3.9/single-pack/`regnology-default` references.

## Risks

- Docs drifting from shipped behavior — implement last and cross-check against WP02/WP03 output.

## Reviewer Guidance

- Spot-check for stale "3.9", "regnology-default", or single-pack language.
- Confirm the documented command matches the published entrypoint exactly.
- Confirm fallback semantics are stated as "script discovery only, no payload failover".

## Activity Log

- 2026-06-19T13:20:55Z – cursor:opus:scribe-sally:implementer – shell_pid=1234493 – Assigned agent via action command
- 2026-06-19T13:26:09Z – cursor:opus:scribe-sally:implementer – shell_pid=1234493 – Install docs aligned: 3.12, two-layer base->overlay, .sha256 integrity, no-failover fallback, release-tag pinning, real env vars, published entrypoints
- 2026-06-19T13:27:02Z – cursor:opus:code-reviewer-cindy:reviewer – shell_pid=1253380 – Started review via action command
- 2026-06-19T13:28:30Z – user – shell_pid=1253380 – Review passed: docs state Python 3.12 (no 3.9), two-layer base->overlay model (regnology-all-company from {base_upstream}, ps-agent-enabled-factory from {base}), .sha256 integrity before extraction, Artifactory-only payload with no Bitbucket failover, release-tag pinning + clone fallback (spec-kitty-cli default 3.2.1, latest aliases), per-platform one-command using published install-regnology-stack-latest.{sh,ps1} matching WP03 Jenkinsfile, guidance-only non-Debian section, env-only token note with no secrets; env var names match install-regnology-stack.sh. No stale refs. Known WP02 script 3.9+ enforcement noted as separate cross-WP fix, not a WP04 docs defect.
