# Data Model: Single Command Installer Bootstrap

## Overview

This mission is installer/distribution focused. The model is artifact-centric and captures
release mapping, source access checks, and install execution metadata.

---

## Entities

### 1) ReleaseMap

Canonical mapping between repository release tags and pinned component versions.
Physical artifact: `config/release-map.yaml` (created; SSOT).

| Field | Type | Description | Constraints |
|---|---|---|---|
| `schema_version` | string | Version of release-map schema | Required, `"1.0"` |
| `default_spec_kitty_version` | string | Fallback spec-kitty version for un-injected / untagged runs | Required (may be `NEEDS-CONFIRMATION` until implementation pins it) |
| `releases` | list<object> | Tag-specific mappings | Required, unique tags |
| `releases[].tag` | string | Repository release tag | Required, unique |
| `releases[].spec_kitty_version` | string | Pinned spec-kitty version for that tag | Required |
| `releases[].overlay_pack_version` | string | `ps-agent-enabled-factory` version for that tag | Required |
| `releases[].base_pack_version` | string | `regnology-all-company` version validated against the overlay | Required |

**Invariants**
- Each release tag maps to exactly one spec-kitty version.
- **Jenkins is the authoritative reader at tag-build time**; it injects resolved values into the
  published installer (see entity 5). The published installer does NOT parse this file at runtime.
- The in-repo fallback installer, run from a clone, MAY read this file locally and falls back to
  `default_spec_kitty_version`.

### 5) InstallerReleaseBinding (build-time injection)

Represents how concrete versions are bound into a published installer. This is the mechanism that
makes runtime pinning possible without runtime tag resolution.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `release_tag` | string | Tag being built | Required for published artifacts |
| `placeholder_tokens` | list<string> | Tokens substituted in the script | `@SPEC_KITTY_VERSION@`, `@OVERLAY_PACK_VERSION@`, `@BASE_PACK_VERSION@`, `@RELEASE_TAG@` |
| `injection_site` | enum | Where substitution occurs | Must be `jenkins_tag_build` |
| `published_form` | enum | State of the script after injection | `injected` (Artifactory) or `placeholder` (in-repo Bitbucket fallback) |

**Invariants**
- A published (`injected`) installer contains no remaining `@…@` tokens.
- A `placeholder` installer resolves to `default_spec_kitty_version` + `latest` pack aliases and logs
  "fallback/unpinned mode".

### 6) ArtifactIntegrity

Detached integrity record for each published payload (D-006 / FR-012 / FR-013).

| Field | Type | Description | Constraints |
|---|---|---|---|
| `artifact` | string | Payload filename (archive or script) | Required |
| `sha256` | string | Hex digest published alongside as `<artifact>.sha256` | Required, 64 hex chars |
| `verified_stage` | enum | When the installer checks it | Must be `after_download_before_extract` |

**Invariants**
- Every published pack archive has a sibling `.sha256`.
- The installer aborts non-zero on digest mismatch and removes the partial download.
- This is distinct from the in-archive `pack/META/MANIFEST.yml`, which only protects
  post-extraction file contents.

### 2) InstallerSourceProfile

Defines distribution source priority and endpoint metadata.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `primary_source` | enum | Sole automatic runtime payload source | Must be `artifactory` |
| `fallback_source` | enum | Script discovery / manual-download location only | Must be `bitbucket_repo` |
| `base_pack_name` | string | Base doctrine pack id (consumed from upstream) | Must be `regnology-all-company` |
| `overlay_pack_name` | string | Overlay doctrine pack id (published by this repo) | Must be `ps-agent-enabled-factory` |

**Invariants**
- Access checks validate both pack endpoints before extraction.
- Layer order is always base then overlay.
- `fallback_source` is NOT a runtime payload mirror; there is no automatic payload failover (C-002).

### Endpoint URL templates

The installer probes/downloads from these templates (concrete host/repo/path come from CI/env, not
hardcoded per script — see spec Assumption 3). `{base}` = `${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}`.

| Purpose | Template |
|---|---|
| Overlay archive | `{base}/ps-agent-enabled-factory-<overlay_pack_version>.tar.gz` |
| Overlay checksum | `{base}/ps-agent-enabled-factory-<overlay_pack_version>.tar.gz.sha256` |
| Base archive | `{base_upstream}/regnology-all-company-<base_pack_version>.tar.gz` |
| Base checksum | `{base_upstream}/regnology-all-company-<base_pack_version>.tar.gz.sha256` |
| Installer (latest) | `{base}/install-regnology-stack-latest.sh` / `.ps1` |

> `{base_upstream}` is the upstream all-company distribution root, configured separately from this
> repo's overlay path. Both default values are documented in `docs/HOW_TO_INSTALL.md`.

### 3) RuntimePrerequisiteState

Represents machine readiness for installer execution.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `python_version` | string | Detected Python version | Must satisfy >= 3.12 |
| `pipx_available` | boolean | Whether pipx is available and on PATH | Must be true before spec-kitty install |
| `platform` | enum | Execution platform | `macos`, `debian`, `windows`, `linux_other` |
| `package_manager` | enum | Auto-remediation channel | `brew`, `apt`, `winget`, `none` (guidance-only) |

**Invariants**
- Installer does not proceed to spec-kitty install until prereqs are satisfied or remediated.

### 4) InstallManifest

Local post-install record for supportability and reproducibility.

| Field | Type | Description | Constraints |
|---|---|---|---|
| `installed_at` | datetime string | Install timestamp | Required |
| `spec_kitty_version` | string | Installed spec-kitty version | Required |
| `spec_kitty_requested_version` | string | Requested version or mapping-resolved version | Required |
| `base_pack_version` | string | Installed base pack version | Required |
| `overlay_pack_version` | string | Installed overlay pack version | Required |

**Invariants**
- Manifest is written on successful installation.
- Reported versions reflect actual installed artifacts.

---

## State transitions

### Release mapping lifecycle

`tag_declared` -> `mapped` -> `resolved_and_injected` -> `published`

- `tag_declared`: repository release tag exists (triggers the Jenkins tag build).
- `mapped`: mapping entry for the tag exists in `config/release-map.yaml`.
- `resolved_and_injected`: Jenkins resolves versions and substitutes placeholders into the installer
  scripts.
- `published`: Jenkins publishes injected scripts + pack archives + `.sha256` checksums to JFrog.

### Runtime install lifecycle

`preflight` -> `integrity_verified` -> `prereqs_ready` -> `spec_kitty_installed` -> `packs_installed` -> `manifest_written`

- `preflight`: both endpoints probed with bounded timeouts; missing/denied/network distinguished.
- `integrity_verified`: each downloaded payload matches its `.sha256` before extraction.
- Failure in any state emits a single actionable error block and exits non-zero; partial downloads
  are removed.
- Re-running when already satisfied short-circuits to `manifest_written` (idempotent, FR-014).
