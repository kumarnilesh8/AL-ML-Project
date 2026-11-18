<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Spec: Regnology Stack Distribution Pipeline

**Mission**: regnology-stack-distribution-pipeline-01KSWHFT  
**Status**: Draft  
**Created**: 2026-05-30  
**Target branch**: overhaul/migrate_to_kitty

---

## Purpose

Enable Regnology PS engineers to bootstrap a new engagement repo with a single command
by closing the last distribution gap: the doctrine pack exists in version control but is
not published anywhere that the bootstrap installer scripts can download it from.

---

## Background and Context

The `dist/scripts/install-regnology-stack.sh` and `install-regnology-stack.ps1` scripts
were written to replace a 6-step manual git-clone setup process. Both scripts expect to
download a versioned pack archive from Regnology Artefactory, but:

- No archive has ever been published to Artefactory.
- The pack has no machine-readable version identifier.
- No CI pipeline exists to publish archives on release.
- `docs/HOW_TO_USE.md` still documents the manual git-clone path as the primary setup method.

This mission delivers all three missing pieces.

---

## User Scenarios

### Primary — New developer bootstraps an engagement repo

A Regnology PS engineer joins an engagement and needs to set up spec-kitty with
Regnology governance. They run a single install command, specify which pack version to
use, and within minutes have a working `spec-kitty` CLI and the doctrine pack configured
at a known local path. They can then run `spec-kitty init .` in their engagement repo
and complete charter setup.

### Secondary — Pack maintainer releases a new pack version

A pack maintainer merges a batch of new artifacts to `main`. The CI pipeline detects
the merge, reads the version identifier from the pack, packages the pack directory into
versioned archives, and publishes them to Artefactory. The maintainer can verify that the
new version is available at the expected Artefactory URL within minutes of the merge
completing.

### Tertiary — Developer upgrades an existing stack installation

A developer who already has the stack installed wants to pick up the latest pack changes.
They re-run the installer with `--pack-version latest`. The installer downloads the new
archive and replaces the local pack directory, without touching the venv or the
engagement repo configuration.

### Exception — Artefactory is unreachable

The installer is run in an environment without Artefactory access (e.g., air-gapped,
credentials missing). The failure is reported clearly, with actionable guidance on how
to obtain and install the pack manually as an alternative.

---

## Functional Requirements

| ID | Description | Priority | Status |
|---|---|---|---|
| FR-001 | The doctrine pack directory (`pack/`) must contain a machine-readable semantic version file that CI and installer tooling can read without parsing pack YAML content | Must | Draft |
| FR-002 | On every merge to `main`, a CI pipeline stage must package the pack directory into versioned archive files | Must | Draft |
| FR-003 | The CI stage must publish both a `.tar.gz` and a `.zip` archive for each pack release to the designated Artefactory repository | Must | Draft |
| FR-004 | Each release must be published under both a versioned path (e.g., `regnology-default-1.2.0.tar.gz`) and a `latest`-alias path (`regnology-default-latest.tar.gz`) so installers can request either | Must | Draft |
| FR-005 | The CI stage must authenticate with Artefactory using a Jenkins credential — never a hardcoded token | Must | Draft |
| FR-006 | `docs/HOW_TO_USE.md` must present the bootstrap installer scripts as the primary recommended developer setup path | Must | Draft |
| FR-007 | `docs/HOW_TO_USE.md` must document how to keep an existing stack installation current (re-running the installer with a version flag) | Must | Draft |
| FR-008 | `docs/HOW_TO_USE.md` must retain a fallback section describing manual setup for environments without Artefactory access | Should | Draft |
| FR-009 | The CI stage must fail the build if the pack version file is absent or unparseable, preventing a versionless archive from being published | Must | Draft |
| FR-010 | The CI stage must be idempotent: re-running it for the same pack version must not overwrite a previously published archive (or must do so safely with a configurable override flag) | Should | Draft |

---

## Non-Functional Requirements

| ID | Description | Threshold | Priority | Status |
|---|---|---|---|---|
| NFR-001 | CI publish stage completes (from pipeline trigger to archive available in Artefactory) within 5 minutes under normal conditions | ≤ 5 minutes | Should | Draft |
| NFR-002 | Published archives are self-contained: extracting the archive on a clean machine and pointing `local_path` at the extracted directory must produce a fully functional doctrine pack load | 100% of published archives pass `spec-kitty doctor doctrine` | Must | Draft |
| NFR-003 | The pack version file format is stable: once defined, the version key name and format must not change without a major pack version bump | Documented in the version file itself | Should | Draft |

---

## Constraints

| ID | Description | Status |
|---|---|---|
| C-001 | CI system is Jenkins connected to the Regnology Bitbucket instance; the pipeline file must be a `Jenkinsfile` at the repository root | Active |
| C-002 | Pack archives are published to Regnology Artefactory; the target repository path is `spec-kitty-packs/` under the configured Artefactory base URL | Active |
| C-003 | The bootstrap installer scripts (`dist/scripts/install-regnology-stack.sh` and `install-regnology-stack.ps1`) are already written and must not be modified by this mission — only the documentation and the pack/CI artifacts change | Active |
| C-004 | Pack version must follow semantic versioning (`MAJOR.MINOR.PATCH`); pre-release suffixes are permitted (`1.2.0-rc1`) | Active |
| C-005 | The CI pipeline must not publish archives for branches other than `main` (no pre-release or PR builds to the production Artefactory path) | Active |

---

## Assumptions

- Regnology Artefactory has a repository named `spec-kitty-packs` (or equivalent) configured for generic file storage. The exact repository name is treated as configurable in the Jenkinsfile.
- A Jenkins credential exists (or can be created) for Artefactory API token authentication. The credential ID is treated as configurable via a Jenkins parameter or pipeline variable.
- The `main` branch is the release branch; merges to `main` are the only trigger for pack publishing.
- `tar`, `zip`, and `curl` are available in the Jenkins agent environment.
- The CI agent has network access to Artefactory.

---

## Out of Scope

- Automatically updating `.kittify/config.yaml` in downstream engagement repos when a new pack version is published.
- Publishing spec-kitty itself (the Python package) to Artefactory; spec-kitty is installed from the Artefactory PyPI proxy and version management there is out of scope.
- The `org-charter.yaml extends:` schema change (tracked separately in spec-kitty#1397).
- Batch 3 agent profile migrations.

---

## Success Criteria

1. A developer with Artefactory credentials can run `./install-regnology-stack.sh` on a clean machine and have a working `spec-kitty` CLI with the `regnology-default` pack loaded within 5 minutes.
2. Merging a pack version change to `main` results in a new versioned archive appearing in Artefactory within 5 minutes, without any manual action from the maintainer.
3. `docs/HOW_TO_USE.md` no longer lists the git-clone process as the primary setup path; new readers follow the installer script path by default.
4. Re-running the installer with `--pack-version latest` on an existing installation updates the local pack to the newest published version without breaking engagement repo configuration.
