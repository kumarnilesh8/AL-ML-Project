# Implementation Plan: Single Command Installer Bootstrap

**Branch**: `feature/single-command-installer-bootstrap` | **Date**: 2026-06-19 | **Spec**: `kitty-specs/single-command-installer-bootstrap-01KVFHX6/spec.md`  
**Input**: Feature specification from `kitty-specs/single-command-installer-bootstrap-01KVFHX6/spec.md`

## Summary

Implement a stable one-command bootstrap flow for macOS, Debian Linux, and Windows PowerShell with
Artifactory-primary distribution and Bitbucket script discoverability (script only, no payload
failover). The plan introduces deterministic preflight access checks with bounded timeouts and
missing/denied/network discrimination, detached `.sha256` integrity verification before extraction,
Python 3.12 and pipx readiness checks, and **build-time-injected** release-tag pinning resolved from
`config/release-map.yaml` by a **tag-triggered** Jenkins pipeline that publishes JFrog-only.

This is a remediation-aware plan: it reconciles the mission's target design with the **current**
`Jenkinsfile` (mission `regnology-stack-distribution-pipeline-01KSWHFT`), which today triggers on
merge-to-`main`, versions from `pack/.pack-version`, and publishes a single `regnology-default-*`
archive. The deltas are captured explicitly below rather than assumed away.

## Technical Context

**Language/Version**: POSIX shell, PowerShell 5.1+, Python 3.12 runtime baseline  
**Primary Dependencies**: `curl`/`wget`, `tar`, `sha256sum`/`shasum`/`Get-FileHash`, `pipx`, `spec-kitty` (confirm dist name vs `spec-kitty-cli` — open item), Jenkins pipeline runtime, JFrog API  
**Storage**: Local filesystem manifests (`.stack-version`) + repo config mapping (`config/release-map.yaml`, created)  
**Testing**: Shell syntax check (`bash -n`), PowerShell parser check, installer dry-run parity checks, endpoint access checks (mocked 200/404/401/timeout), checksum-mismatch check, post-inject "no remaining `@…@` tokens" check, doc command smoke checks  
**Target Platform**: macOS (brew), Debian Linux (apt), Windows PowerShell  
**Project Type**: Single repository installer/distribution enhancement  
**Performance Goals**: preflight endpoint checks within 15s each; full dry-run feedback under 60s on normal network  
**Constraints**: JFrog-only publish path, no secrets committed, base->overlay install order preserved  
**Scale/Scope**: installer scripts (`dist/scripts/`), release mapping in `config/`, Jenkins release integration, mission documentation artifacts

## Charter Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **DIR-001 / DIR-002 / DIR-003 / DIR-004**: file placement respected (`config/` for release map, `dist/scripts/` for installers, docs under mission directory).
- ✅ **DIR-007 Risk boundaries**: no secrets in repository; token-based auth remains env-driven.
- ✅ **Code Review Checklist anchor**: parity checks and script parser checks are explicit in plan/test strategy.
- ✅ **Regression Vigilance anchor**: base-first then overlay order retained in both shell and PowerShell flows.
- ✅ **No charter violations requiring exception**.

## Project Structure

### Documentation (this mission)

```
kitty-specs/single-command-installer-bootstrap-01KVFHX6/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── installer-bootstrap.contract.yaml
└── tasks.md
```

### Source Code (repository root)

```
config/
└── release-map.yaml

dist/scripts/
├── install-regnology-stack.sh
├── install-regnology-stack.ps1
└── README.md

docs/
└── HOW_TO_INSTALL.md

Jenkinsfile
```

**Structure Decision**: keep installer logic in existing distribution scripts, centralize release pinning in `config/release-map.yaml`, and keep publish orchestration in `Jenkinsfile`.

## Current-State Reconciliation (deltas to close)

The existing `Jenkinsfile` and installer scripts predate this mission. Implementation must close
these concrete deltas (each becomes one or more tasks):

| # | Current state | Target state | Requirement |
|---|---|---|---|
| Δ1 | Trigger: `when { branch 'main' }` | Tag-triggered (`buildingTag()` / multibranch tag scan) | FR-008, D-008 |
| Δ2 | Version from `pack/.pack-version` only | Versions resolved from `config/release-map.yaml` for the built tag | FR-008, C-003 |
| Δ3 | Single archive `regnology-default-*` | Overlay archive `ps-agent-enabled-factory-<version>`; base consumed upstream | FR-013, D-007 |
| Δ4 | Only in-archive `MANIFEST.yml` | Also publish detached `<artifact>.sha256`; installer verifies pre-extract | FR-012, D-006 |
| Δ5 | Installer scripts published verbatim | Inject `@…@` version tokens at build time; assert none remain | FR-008, D-005 |
| Δ6 | No `bash -n` / PS parser stage | Add lint stage that fails build on parse error | NFR-001 |
| Δ7 | Security Scan soft-fails (`catchError → UNSTABLE`) | Keep first-deploy posture but track hardening to FAILURE once toolchain present | DIR-043 |
| Δ8 | Docs cite Python 3.9+, single-pack model | Docs cite Python 3.12, two-layer model, fallback + integrity semantics | FR-011 |

## Complexity Tracking

No charter exceptions required. Added scope vs the original plan (build-time injection, detached
integrity, tag-trigger migration) is justified by the adversarial review: without them the published
installer cannot deterministically pin versions or guarantee download integrity. None of these
introduce a new language, framework, or runtime — they extend existing shell/PowerShell/Groovy.

## Implementation Concern Map

### IC-01 — Release Version Mapping Canon + Build-Time Injection

- **Purpose**: enforce `config/release-map.yaml` as the single source of truth and bind versions into
  the published installer at build time (no runtime tag resolution).
- **Relevant requirements**: FR-006, FR-008, FR-013, C-001, C-003; decisions D-003, D-005.
- **Affected surfaces**: `config/release-map.yaml` (created), `Jenkinsfile` (resolve+inject+assert),
  `dist/scripts/install-regnology-stack.sh`, `dist/scripts/install-regnology-stack.ps1` (placeholder tokens).
- **Sequencing/depends-on**: none (foundational).
- **Risks**: a published script with un-substituted tokens — mitigate with a post-inject assertion.

### IC-02 — Cross-Platform Preflight, Integrity, and Bootstrap Parity

- **Purpose**: access checks (bounded timeout; 404/401/network discrimination), detached checksum
  verification, and dependency checks behave equivalently across macOS, Debian, and Windows.
- **Relevant requirements**: FR-001..FR-005, FR-009, FR-012, FR-014, NFR-001..NFR-005, C-005.
- **Affected surfaces**: both installer scripts, `dist/scripts/README.md`, `docs/HOW_TO_INSTALL.md`.
- **Sequencing/depends-on**: depends on IC-01 token contract + IC-03 published `.sha256` layout.
- **Risks**: platform package-manager drift; PowerShell PATH for freshly installed pipx; `tar`/`Expand-Archive` parity.

### IC-03 — Release Publishing Contract (Tag-Triggered, JFrog-Only, Two-Layer)

- **Purpose**: migrate CI to tag-triggered publishing, rename overlay artifact, publish detached
  checksums, and keep Bitbucket as script discovery only.
- **Relevant requirements**: FR-007, FR-008, FR-013, C-001, C-002; decisions D-001, D-007, D-008.
- **Affected surfaces**: `Jenkinsfile`, `docs/HOW_TO_INSTALL.md`, `dist/scripts/README.md`.
- **Sequencing/depends-on**: depends on IC-01 mapping/injection contract.
- **Risks**: trigger migration regressions; partial-release windows (existing rollback logic must be
  preserved); artifact-name change breaking existing consumers (coordinate cutover in docs).
