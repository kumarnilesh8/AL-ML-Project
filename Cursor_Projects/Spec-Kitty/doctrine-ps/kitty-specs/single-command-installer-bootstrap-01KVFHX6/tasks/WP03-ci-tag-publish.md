---
work_package_id: WP03
title: CI Tag-Triggered Publish & Injection
agent: "cursor:opus:code-reviewer-cindy:reviewer"
dependencies:
- WP01
- WP02
requirement_refs:
- C-001
- C-002
- FR-008
- FR-013
- NFR-001
- NFR-005
tracker_refs: []
planning_base_branch: feature/single-command-installer-bootstrap
merge_target_branch: feature/single-command-installer-bootstrap
branch_strategy: Planning artifacts for this mission were generated on feature/single-command-installer-bootstrap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/single-command-installer-bootstrap unless the human explicitly redirects the landing branch.
subtasks:
- T009
- T010
- T011
- T012
- T013
shell_pid: '1189613'
history:
- timestamp: '2026-06-19T11:53:39Z'
  actor: tasks
  note: Authored from remediated plan (IC-03) + current-state reconciliation deltas.
authoritative_surface: Jenkinsfile
create_intent: []
execution_mode: code_change
owned_files:
- Jenkinsfile
tags: []
---

# WP03 — CI Tag-Triggered Publish & Injection

## Objective

Migrate the existing `Jenkinsfile` (from mission `regnology-stack-distribution-pipeline-01KSWHFT`)
to: trigger on tags, resolve pinned versions from `config/release-map.yaml`, inject them into the
published installer scripts, publish the overlay archive under the correct name with detached
checksums to JFrog only, and gate on installer syntax. This closes reconciliation deltas Δ1–Δ7 in
`plan.md`.

## Context

- The current pipeline triggers on `branch 'main'`, versions from `pack/.pack-version`, and publishes
  a single `regnology-default-*` archive with an in-archive `MANIFEST.yml`. Preserve its strengths:
  reproducible tar, duplicate-version HEAD guard, phased upload, and post-failure rollback.
- AppSec invariant (DIRECTIVE_043): `$ART_TOKEN` is shell-expanded only inside single-quoted `sh`
  blocks — never Groovy-interpolated. Keep this in every new curl step.
- Only `Jenkinsfile` is owned here. Token placeholders live in the scripts (WP02); the map lives in
  WP01. Read both but edit neither.

## Subtasks

### T009 — Tag-triggered + release-map-driven versioning

**Purpose**: Make releases tag-driven (FR-008, D-008; Δ1/Δ2).

**Steps**:
1. Replace the `when { anyOf { branch 'main'; … } }` gating with a tag-build condition
   (`when { buildingTag() }`, or the multibranch tag-scan equivalent for this Jenkins). Keep a
   `RUN_ON_THIS_BRANCH` style escape hatch for pipeline testing if desired.
2. Resolve the build tag (`env.TAG_NAME` / `env.GIT_TAG`).
3. Read `config/release-map.yaml`, look up the entry for the tag, and set `PACK_VERSION` /
   `OVERLAY_PACK_VERSION` / `BASE_PACK_VERSION` / `SPEC_KITTY_VERSION` from it. Fail clearly if the
   tag has no mapping.
4. Keep the semver guard and the duplicate-version HEAD check, now keyed to the resolved overlay
   version + new artifact name.

**Files**: `Jenkinsfile`.

**Validation**:
- [ ] Pipeline activates on a tag build, not on merge-to-`main`.
- [ ] Versions come from the map; an unmapped tag fails with a clear message.

### T010 — Overlay artifact rename + detached `.sha256` publish

**Purpose**: Name the overlay archive correctly and publish download-integrity checksums (FR-013,
D-006/D-007; Δ3/Δ4).

**Steps**:
1. Change `ARCHIVE_BASENAME` from `regnology-default` to `ps-agent-enabled-factory`.
2. Produce a detached `<artifact>.sha256` for every published payload (tar, zip, installer scripts)
   using `sha256sum`; publish each `.sha256` next to its artifact.
3. Update the Smoke Check to also HEAD-verify the `.sha256` siblings exist and are reachable.
4. Note in a comment that the base `regnology-all-company-*` layer is published by the upstream
   pipeline, not here.

**Files**: `Jenkinsfile`.

**Validation**:
- [ ] Published archive is `ps-agent-enabled-factory-<version>.tar.gz` (+ `.zip`).
- [ ] Every payload has a reachable `.sha256` sibling.

### T011 — Build-time injection + no-remaining-token assertion

**Purpose**: Bake resolved versions into the published installer scripts (FR-008, D-005; Δ5).

**Steps**:
1. Before publishing the scripts, substitute the WP01 tokens (`@SPEC_KITTY_VERSION@`,
   `@OVERLAY_PACK_VERSION@`, `@BASE_PACK_VERSION@`, `@RELEASE_TAG@`) in copies of
   `dist/scripts/install-regnology-stack.sh` and `.ps1` with the resolved values (e.g. `sed`).
2. Assert no `@…@` token remains in the injected copies; fail the build if any do (grep guard).
3. Publish the **injected** copies (versioned + latest aliases) to JFrog. Do not mutate the in-repo
   originals (they keep placeholders for the Bitbucket fallback).

**Files**: `Jenkinsfile`.

**Validation**:
- [ ] Published scripts contain concrete versions and zero `@…@` tokens.
- [ ] A deliberately-unsubstituted token fails the build.

### T012 — Installer lint stage [P]

**Purpose**: Fail the build on installer syntax errors (NFR-001; Δ6).

**Steps**:
1. Add a `Lint` stage (early, before Package) that runs `bash -n dist/scripts/install-regnology-stack.sh`
   and a PowerShell parser check (`pwsh -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile(...)"`
   if `pwsh` is available; otherwise document the gap and mark UNSTABLE rather than silently passing).
2. Also invoke the WP01 release-map validator here.
3. Hard-fail on `bash -n` error (do not wrap in catchError).

**Files**: `Jenkinsfile`.

**Validation**:
- [ ] A syntax error in the shell script fails the build.
- [ ] The release-map validator runs in CI.

### T013 — Security-scan hardening posture tracking [P]

**Purpose**: Keep the first-deploy `catchError → UNSTABLE` posture but make the hardening path
explicit (DIRECTIVE_043; Δ7).

**Steps**:
1. Leave the Sonar/CycloneDX `catchError(buildResult: 'UNSTABLE')` as-is for first-deploy resilience.
2. Add a tracked comment + a `HARDEN_SECURITY_SCAN` boolean param (default false) that, when true,
   removes the soft-fail and requires the tools — so the transition to FAILURE is a one-flag change
   once the toolchain is confirmed on all agents.
3. Ensure `SONAR_TOKEN` is sourced via `withCredentials`, never a plaintext default.

**Files**: `Jenkinsfile`.

**Validation**:
- [ ] Default behavior unchanged (UNSTABLE on missing tools).
- [ ] `HARDEN_SECURITY_SCAN=true` enforces hard failure.
- [ ] No plaintext token defaults remain.

## Branch Strategy

Planning branch: `feature/single-command-installer-bootstrap`. Final merge target:
`feature/single-command-installer-bootstrap`. Worktrees allocated per `lanes.json`. Depends on
**WP01** (map + tokens) and **WP02** (scripts carry the placeholders to inject).

## Definition of Done

- Tag build resolves versions from the map, injects them (no `@…@` left), publishes
  `ps-agent-enabled-factory-<version>` + `.sha256` to JFrog only, lints installers (hard-fail on
  parse error), and preserves the existing rollback/duplicate-guard behavior.

## Risks

- Trigger migration can accidentally disable publishing — test with a tag on a sandbox.
- Renaming the artifact breaks existing consumers — WP04 docs must announce the cutover.
- Injection `sed` could corrupt scripts — assert "no remaining tokens" AND re-run `bash -n` on the
  injected copy before publish.

## Reviewer Guidance

- Confirm trigger is tag-based and versions come from the map.
- Confirm `$ART_TOKEN` / `SONAR_TOKEN` are never Groovy-interpolated or echoed.
- Confirm injected published scripts have zero `@…@` tokens and the in-repo originals are untouched.
- Confirm rollback and duplicate-version guard still function under the new naming.
