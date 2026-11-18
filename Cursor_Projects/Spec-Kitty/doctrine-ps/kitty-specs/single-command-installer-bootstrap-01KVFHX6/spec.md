# Single Command Installer Bootstrap

## Mission Context

| Field | Value |
|---|---|
| Mission ID | `01KVFHX6HPTB54D4E743M8BHMK` |
| Mission Slug | `single-command-installer-bootstrap-01KVFHX6` |
| Mission Type | software-dev |
| Target Branch | `feature/single-command-installer-bootstrap` |
| Status | In Specification |

---

## Intent Summary

This mission establishes a one-command installer experience for the Regnology doctrine stack,
aligned with the usability pattern of curl/pipe bootstrappers. The installer must execute with
clear progress messages and predictable checks across three supported environments:
macOS, Debian-based Linux, and Windows PowerShell.

The installation flow must verify access to both doctrine layers (`regnology-all-company` and
`ps-agent-enabled-factory`), ensure `pipx` is available, ensure Python 3.12 is available, and
install `spec-kitty` via `pipx` from a stable, release-tag-controlled version mapping.

**Two-layer source model.** The two doctrine layers do not originate from the same place:
- `regnology-all-company` (base) is produced by the upstream all-company pipeline and **consumed**
  by this installer from its published Artifactory location.
- `ps-agent-enabled-factory` (overlay) is the pack built **by this repository** (`pack/`) and
  published by this repository's Jenkins pipeline. The installer always applies base first, then
  overlay (constraint C-005).

**Version pinning is resolved at build time, not at runtime.** A `curl | sh` entrypoint has no
release-tag context when it executes, so it cannot resolve a tag to a version at runtime. Instead,
the Jenkins pipeline runs on a tag build, resolves the pinned versions from `config/release-map.yaml`
(the single source of truth), and **injects** the concrete versions into the published installer
scripts (placeholder substitution). The published installer is therefore self-contained and
deterministic. The in-repo Bitbucket copy keeps placeholders and falls back to the map's
`default_spec_kitty_version` / `latest` pack aliases when run from a clone.

Distribution strategy is dual-source, with precise semantics:
- **Primary (runtime payload):** JFrog Artifactory hosts the install entrypoints, pack archives,
  and their detached integrity checksums. This is the only automatic runtime source.
- **Fallback (script discovery only):** the installer *script* remains readable in the Bitbucket
  repository for discovery and manual download. Bitbucket is **not** a runtime mirror of pack
  payloads — there is no automatic payload failover to Bitbucket (see C-002).

Publishing automation is explicitly constrained:
- publish installer release artifacts to **JFrog only** through Jenkins pipeline
- release lifecycle is driven by **version tagging** (tag-triggered build, not merge-to-main)

---

## Scope

**In scope:**

- Define a stable, cross-platform one-command installation UX for:
  - macOS (with Homebrew path where required)
  - Debian Linux (apt-based)
  - Windows (PowerShell)
- Add installer preflight checks for:
  - access to `regnology-all-company` doctrine pack source
  - access to `ps-agent-enabled-factory` doctrine pack source
  - Python 3.12 availability
  - `pipx` availability
- Ensure installer behavior can:
  - install/ensure Python 3.12 when missing (platform-appropriate guidance or automation)
  - install/ensure `pipx`
  - install `spec-kitty` via `pipx` from a pinned version resolved by release-tag mapping
- Define dual-source retrieval behavior (Artefactory primary, Bitbucket fallback script presence)
- Update Jenkins release/publish path so installer release artifacts publish to JFrog only
- Update installation documentation to explain:
  - what is checked
  - what is installed
  - what fallback path is used
  - what user-visible progress should look like

**Out of scope:**

- Publishing installer artifacts directly from Bitbucket releases
- Reworking doctrine content within `pack/` unrelated to installer bootstrapping
- Non-Debian Linux distribution-specific package manager support beyond documented fallback guidance

---

## Assumptions

1. The canonical upstream base doctrine pack identifier remains `regnology-all-company`, and it is
   published to a known Artifactory location by the upstream all-company pipeline (not by this repo).
2. The canonical PS overlay doctrine pack identifier remains `ps-agent-enabled-factory`; it is built
   from this repository's `pack/` and published by this repository's Jenkins pipeline.
3. JFrog base URL, repository, archive path, and credentials are managed by existing CI secrets and
   Jenkins runtime configuration. The concrete Artifactory endpoint URL templates the installer
   probes are defined in `data-model.md` (§ Endpoint URL templates), not invented per-script.
4. Version tags in this repository are authoritative for installer release selection and component
   version pinning, resolved through `config/release-map.yaml`.
5. The pinned `spec_kitty_version` and `base_pack_version` values in `config/release-map.yaml` are
   `NEEDS-CONFIRMATION` placeholders at planning time; pinning them to real published versions is an
   explicit implementation task, not an assumption to be silently satisfied.

---

## Decision Records

| ID | Decision | Rationale | Alternatives |
|---|---|---|---|
| D-001 | Artefactory is the sole automatic runtime source for payloads; Bitbucket holds the installer **script** for discovery/manual download only (no payload failover) | Preserves enterprise distribution control while retaining script discoverability without a confusing dual runtime path | Artefactory-only with no published script (rejected: no discoverability), Bitbucket payload mirror (rejected: bypasses distribution control, doubles integrity surface) |
| D-002 | Publish release installer artifacts to JFrog only via Jenkins | Centralized audited release pipeline | Manual publishing (rejected), dual publish to Bitbucket and JFrog (rejected per instruction) |
| D-003 | Pin spec-kitty by release-tag mapping in `config/release-map.yaml` | Improves stability and reproducibility of installs | Always latest release (rejected: drift risk) |
| D-004 | Standardize on Python 3.12 baseline | Consistent runtime expectation across platforms | 3.9+ compatibility baseline (rejected per instruction) |
| D-005 | Resolve pinned versions at **build time** and inject concrete values into the published installer (placeholder substitution) | A `curl\|sh` script has no tag context at runtime; build-time injection makes the published installer self-contained and deterministic | Runtime tag→version resolution (rejected: architecturally impossible for a piped script), bundling the whole map into the script and guessing the tag (rejected: ambiguous, fragile) |
| D-006 | Publish a detached integrity checksum (`.sha256`) for every payload and verify it after download and before extraction/`pipx` install | Protects against truncated/tampered downloads; the in-archive `MANIFEST.yml` only protects post-extraction | No detached verification (rejected: download integrity gap), signature-only (deferred: GPG key distribution out of scope this mission) |
| D-007 | This repo's pipeline publishes the **overlay** archive as `ps-agent-enabled-factory-<version>`; the base `regnology-all-company-<version>` is consumed from the upstream location | Matches the real two-layer ownership; resolves the `regnology-default-*` naming mismatch in the current pipeline | Keep single `regnology-default` archive (rejected: misrepresents the two-layer model the installer applies) |
| D-008 | Jenkins release publishing is **tag-triggered**; pinned versions come from `config/release-map.yaml`, not `pack/.pack-version` alone | Aligns CI with the tag-driven release lifecycle the mission requires | Keep merge-to-`main` trigger (rejected: contradicts tag-driven releases and version pinning) |

---

## User Scenarios & Testing

### Scenario 1 — Fresh Debian workstation bootstrap

**Given** a Debian-based machine without Python 3.12 and without pipx  
**When** the user runs the one-command installer  
**Then** the installer reports prerequisite checks, ensures Python 3.12 and pipx, verifies doctrine
pack access, installs pinned spec-kitty, and completes with actionable next steps.

### Scenario 2 — macOS bootstrap with Homebrew

**Given** a macOS machine missing Python 3.12  
**When** the user runs the shell installer  
**Then** the installer uses Homebrew-compatible guidance/flow for Python 3.12 and proceeds with the
same deterministic check/install sequence.

### Scenario 3 — Windows PowerShell bootstrap

**Given** a Windows user in PowerShell with partial prerequisites  
**When** the user runs the PowerShell installer  
**Then** the installer performs equivalent checks and installs, with parity in outcome and user
feedback compared to Unix installer behavior.

### Scenario 4 — Upstream doctrine pack unavailable (404 vs auth vs network)

**Given** the user has network access but the base pack endpoint returns 404 (missing) or 401/403
(no entitlement)  
**When** preflight access checks run  
**Then** installation exits **before any download/extraction** with non-zero status, and the single
error block names (a) the failing layer (`regnology-all-company`), (b) the probed endpoint URL, and
(c) the distinct cause — *missing artifact* (404) vs *access denied / token* (401/403) vs *network
unreachable* (connect/timeout) — each with its own remediation line.

### Scenario 5 — Release-tag-controlled spec-kitty pinning (build-time injected)

**Given** an installer published by the tag build for `vX.Y.Z`  
**When** the installer runs  
**Then** it installs the exact `spec_kitty_version` that `config/release-map.yaml` mapped to that tag
(injected at publish time), never an unbounded latest, and records both the requested and resolved
versions in the manifest.

### Scenario 6 — In-repo (Bitbucket) fallback script run from a clone

**Given** the un-injected installer script run directly from a repository clone (no published
release)  
**When** the installer reaches the spec-kitty step  
**Then** it uses `default_spec_kitty_version` from `config/release-map.yaml` and the `latest` pack
aliases, and clearly logs that it is running in fallback/unpinned mode.

### Scenario 7 — Integrity verification failure

**Given** a pack archive downloads but its bytes do not match the published `.sha256`  
**When** the installer verifies integrity  
**Then** it deletes the partial download, exits non-zero before extraction/`pipx` install, and
reports the expected vs actual digest and the affected artifact.

### Scenario 8 — Already-installed / idempotent re-run

**Given** a machine where the pinned spec-kitty version and both pack layers are already present  
**When** the installer re-runs  
**Then** it detects the satisfied state, performs no redundant reinstall, and exits zero with a
manifest reflecting the existing versions.

### Scenario 9 — Slow/hanging endpoint

**Given** a preflight endpoint that does not respond  
**When** the access check runs  
**Then** the check aborts at the bounded timeout (NFR-002), does not hang indefinitely, and reports
the timeout as a network-class failure with remediation.

---

## Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| FR-001 | The installer provides a one-command user entrypoint for macOS, Debian Linux, and Windows PowerShell with consistent outcome semantics. | Approved | Must |
| FR-002 | Installer preflight validates accessibility of the `regnology-all-company` base archive at its Artifactory endpoint before any download/extraction begins, distinguishing missing (404), access-denied (401/403), and network (timeout/connect) outcomes. | Approved | Must |
| FR-003 | Installer preflight validates accessibility of the `ps-agent-enabled-factory` overlay archive at its Artifactory endpoint before any download/extraction begins, with the same outcome distinctions as FR-002. | Approved | Must |
| FR-004 | Installer verifies Python ≥ 3.12 presence and executes the platform-appropriate install/upgrade path (brew/apt/winget) or exits with explicit remediation instructions when automation is unavailable. | Approved | Must |
| FR-005 | Installer verifies `pipx` presence and installs/configures it when missing (system package manager first, `pip --user` fallback), ensuring it is on PATH for the subsequent step. | Approved | Must |
| FR-006 | Installer installs `spec-kitty` through `pipx` at the version injected from the release-tag mapping; when run un-injected (in-repo fallback) it uses `default_spec_kitty_version`. It never installs an unbounded latest in the published form. | Approved | Must |
| FR-007 | Installer retrieves payloads (pack archives, checksums) from Artifactory as the sole automatic runtime source; the Bitbucket-hosted script is documented as a discovery/manual-download location only, with no automatic payload failover. | Approved | Must |
| FR-008 | Jenkins release publishing is **tag-triggered**, resolves pinned versions from `config/release-map.yaml`, injects them into the published installer scripts, and publishes only to JFrog. | Approved | Must |
| FR-009 | Installer logs user-facing progress for each major phase (preflight, integrity, dependencies, spec-kitty, doctrine layers, completion), and on failure emits a single block naming the failing phase, target, cause, and remediation. | Approved | Must |
| FR-010 | Installer records installed component versions (spec-kitty requested + resolved, base pack, overlay pack, timestamp, platform) in a local `.stack-version` manifest for supportability. | Approved | Should |
| FR-011 | Documentation (`docs/HOW_TO_INSTALL.md`, `dist/scripts/README.md`) is updated for cross-platform usage, Python 3.12 prerequisite, token handling, the two-layer source model, fallback semantics (D-001), integrity verification, and release-tag pinning. | Approved | Must |
| FR-012 | Installer verifies each downloaded payload against its published detached `.sha256` after download and before extraction/`pipx` install, deleting the artifact and aborting non-zero on mismatch. | Approved | Must |
| FR-013 | Jenkins publishes the overlay archive as `ps-agent-enabled-factory-<version>` (not `regnology-default-*`) together with a detached `.sha256` for every published payload. | Approved | Must |
| FR-014 | Re-running the installer on an already-satisfied machine is idempotent: satisfied components are not reinstalled, and the run exits zero with an accurate manifest. | Approved | Should |

---

## Non-Functional Requirements

| ID | Description | Status | Priority |
|---|---|---|---|
| NFR-001 | Installer scripts pass static syntax checks (`bash -n` / `sh -n` and the PowerShell `Parser`) with zero parse errors, enforced as a Jenkins lint stage that fails the build on error. | Approved | Must |
| NFR-002 | Each preflight access check uses an explicit bounded timeout (`--connect-timeout 10 --max-time 15` or PowerShell equivalent) so a non-responsive endpoint fails by ~15s rather than hanging; the timeout is set in the code, not assumed from network conditions. | Approved | Must |
| NFR-003 | For missing prerequisites, integrity failures, or inaccessible sources, failure messaging indicates the failed phase, the target, the distinct cause, and the remediation step in one output block. | Approved | Must |
| NFR-004 | Cross-platform behavioral parity: shell and PowerShell installers execute the same ordered phases, apply layers base→overlay, perform integrity verification, and emit a manifest with identical field structure and version string format. | Approved | Must |
| NFR-005 | No secrets or credentials are persisted to repository files or plaintext logs; tokens are read from environment only and never echoed (CI uses single-quoted shell expansion, never Groovy interpolation). | Approved | Must |

---

## Constraints

| ID | Description | Status | Priority |
|---|---|---|---|
| C-001 | Publish installer release artifacts to JFrog through Jenkins pipeline only. | Approved | Must |
| C-002 | The Bitbucket-hosted installer script is a discovery/manual-download location only. It is NOT a release artifact channel and NOT an automatic runtime payload mirror — there is no automatic failover from Artifactory to Bitbucket for pack payloads. | Approved | Must |
| C-003 | spec-kitty installation must be pinned via release-tag mapping for stability. | Approved | Must |
| C-004 | Supported Linux package-manager automation target is Debian/apt; other Linux variants may receive guidance but are not first-class automated targets in this mission. | Approved | Should |
| C-005 | Existing doctrine layer installation order remains base-first (`regnology-all-company`) then overlay (`ps-agent-enabled-factory`). | Approved | Must |

---

## Success Criteria

A "successful install state" means: the pinned `spec-kitty` is invocable via `pipx`, both doctrine
layers are present (base then overlay), and a `.stack-version` manifest records the resolved
versions — confirmed by the script exiting zero and the documented post-install check passing.

1. A user can execute one documented command per platform (macOS, Debian Linux, Windows PowerShell)
   and reach the successful install state defined above.
2. Installer preflight catches inaccessible base/overlay pack endpoints before download/extract,
   reports which endpoint failed, and distinguishes missing vs access-denied vs network causes.
3. On systems missing Python 3.12 and/or pipx, installer either remediates automatically (where
   supported) or exits with clear, platform-specific remediation guidance.
4. The published installer for a tag installs the `spec_kitty_version` mapped to that tag in
   `config/release-map.yaml` (build-time injected), never an uncontrolled latest.
5. Jenkins tag-triggered release publishes installer artifacts plus detached `.sha256` checksums to
   JFrog only, with the overlay archive named `ps-agent-enabled-factory-<version>`, and introduces
   no Bitbucket release-publish dependency.
6. Every downloaded payload is integrity-verified against its published checksum before extraction
   or `pipx` install; a mismatch aborts the install non-zero.

