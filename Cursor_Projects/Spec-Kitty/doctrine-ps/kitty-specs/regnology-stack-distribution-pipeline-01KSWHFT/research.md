# Research: Regnology Stack Distribution Pipeline

**Mission**: regnology-stack-distribution-pipeline-01KSWHFT  
**Date**: 2026-05-30  
**Source**: Engineering note `docs/engineering_notes/2026-05-30-multi-org-migration-and-feature-gaps.md`

All design decisions were resolved prior to this mission in the Architect Alphonso
analysis session. This file records the decisions for traceability.

Engineering decisions (pipeline tooling, CI/CD strategy) are to be recorded as EDRs
in `docs/decisions/`. See Decision 8 below.

---

## Decision 1 — Version file format: plain text over YAML

**Decision**: `pack/.pack-version` is a single-line plain-text file containing the
semver string.

**Rationale**: Both the POSIX shell installer (`install-regnology-stack.sh`) and the
PowerShell installer (`.ps1`) read this file without any parser. A plain `cat` or
`Get-Content` call is sufficient. YAML would require `yq` or Python in the CI
environment for authoritative parsing.

**Alternatives considered**:
- `pack/meta.yaml` with a `version:` key — requires a YAML parser in CI shell steps
- `pack/package.json` style — alien format for a doctrine pack

---

## Decision 2 — Archive layout: `pack/` prefix wrapper required

**Decision**: Archives are created from the repository root with
`tar czf regnology-default-${PACK_VERSION}.tar.gz pack/` so the archive contains a
top-level `pack/` directory. The installer strips it with `--strip-components=1`.

**Rationale**: The locked installer (`install-regnology-stack.sh` L319, C-003) already
uses `tar -xzf "$PACK_ARCHIVE" -C "$PACK_DIR" --strip-components=1`. This flag strips
exactly one path component from every archive entry. An archive without a top-level
wrapper would cause `--strip-components=1` to silently discard the first path segment
of every file inside the pack, corrupting the extracted layout on all platforms. The
archive *must* have a single `pack/` root so that `--strip-components=1` strips it
cleanly into `$PACK_DIR`.

The Jenkins agent runs on Linux (C-001), so GNU tar is guaranteed and
`--strip-components` behaves deterministically. The `--mtime`, `--sort=name`,
`--owner=0`, `--group=0` flags are added for reproducible archive checksums across
builds.

**Zip archive note**: `Expand-Archive` (PowerShell / Windows) does not support
strip-components. The zip archive is created with `zip -r regnology-default-${PACK_VERSION}.zip pack/`,
which likewise has a `pack/` root entry. The Windows installer must account for this
wrapper when extracting the zip. Verify the PowerShell installer extraction path
during WP02 implementation; if the PS installer lacks strip logic for zip, a zip
post-processing step (move contents from `$PACK_DIR\pack\` to `$PACK_DIR`) may be
needed outside the locked installer scope.

**Alternatives considered**:
- `cd pack && tar czf ../...tar.gz .` (no wrapper) — breaks the locked installer's
  `--strip-components=1`, corrupting all extracted packs. Rejected.
- Modify the installer to remove `--strip-components=1` — violates C-003. Rejected.

---

## Decision 3 — Jenkins credential via parameter, not hardcoded ID

**Decision**: The Jenkinsfile uses a pipeline parameter `ARTEFACTORY_CREDENTIAL_ID`
(default: `ARTEFACTORY_API_TOKEN`) rather than hardcoding the credential ID.

**Rationale**: Different Jenkins instances (dev, staging, prod) may use different
credential IDs. A parameter allows the same Jenkinsfile to work across environments
without source edits.

**Alternatives considered**:
- Hardcoded ID — simpler but breaks in multi-environment setups.
- Environment variable injection — less discoverable than a declared pipeline parameter.

---

## Decision 4 — `latest`-alias via re-upload, not Artefactory symlink

**Decision**: The `latest` alias archives are created by re-uploading the same archive
bytes to a second Artefactory path (e.g., `regnology-default-latest.tar.gz`).

**Rationale**: JFrog Artefactory generic repositories do not support symlinks.
Re-uploading is the standard pattern for latest aliases in generic repos.

**Alternatives considered**:
- Artefactory Properties + AQL query to resolve `latest` dynamically — more complex,
  requires Artefactory Pro features; not needed for this use case.
- Artefactory Release Bundle — enterprise feature, out of scope.

---

## Decision 5 — HOW_TO_USE: installer as primary path, manual as appendix

**Decision**: The guide is restructured so the installer is Section 1 and the manual
git-clone path is demoted to an appendix labelled "Manual / Offline Setup".

**Rationale**: FR-006 requires the installer to be the primary path. The manual path
must be retained (FR-008) for air-gapped environments. Appendix placement retains the
content while de-emphasising it for the common case.

**Alternatives considered**:
- Delete the manual path entirely — violates FR-008.
- Keep both paths at equal prominence — creates decision paralysis for new readers.

---

## Decision 6 — Integrity manifest: `META/MANIFEST.yml` inside archive

**Decision**: The Package stage generates a SHA-256 manifest of all pack files and
includes it as `META/MANIFEST.yml` inside each published archive.

**Rationale**: DDR-008 (Framework Distribution and Upgrade Mechanisms) requires that
distributed pack archives include file checksums so consumers can verify archive
integrity. The manifest is generated before archiving: `sha256sum $(find pack -type f | sort)`.
The Smoke Check stage verifies the manifest is present and non-empty in the extracted
archive.

**Alternatives considered**:
- External `.sha256` sidecar file uploaded alongside the archive — requires a separate
  download step; not supported by the existing installer flow.
- No integrity checking — violates DDR-008.

---

## Decision 7 — Publish ordering: versioned pair before latest aliases

**Decision**: The Publish stage uploads in two sequential phases: (1) versioned
`.tar.gz` + `.zip`, both confirmed; then (2) `latest`-alias `.tar.gz` + `latest`-alias
`.zip`. The `latest` uploads proceed only after both versioned files return HTTP 201.

**Rationale**: Publishing the latest aliases before the versioned files creates a
window where a consumer requesting `latest` downloads an archive that is not yet
available as a versioned artifact — breaking reproducibility and rollback. Sequencing
versioned-first ensures a consistent pair exists before the alias is updated.
Concurrent pipeline runs can still create a brief inconsistency window on the
`latest` pair itself, but this is an accepted limitation (generic Artefactory repos
have no atomic multi-file transaction).

**Alternatives considered**:
- Upload all four artifacts in parallel — eliminates ordering guarantee. Rejected.
- Upload `latest` first — maximises the inconsistency window. Rejected.

---

## Decision 8 — Partial-publish rollback on failure

**Decision**: If any of the four Publish uploads fails, the `post { failure { } }` block
in the Jenkinsfile issues `curl -X DELETE` calls for each artifact that was successfully
uploaded in that run, then fails the build. A `FORCE_PUBLISH=true` parameter bypasses
the duplicate-version guard (not the rollback).

**Rationale**: Without rollback, a partial publish (e.g., versioned tar uploaded,
versioned zip upload fails) leaves Artefactory in an inconsistent state — one artifact
exists under a version that was never fully published. Consumers who download only the
tar get an incomplete release. The rollback ensures Artefactory either has a complete
set for a version or nothing for that version.

**Alternatives considered**:
- 403-warn-and-continue — masks partial publishes silently. Rejected.
- Manual cleanup — acceptable for hotfixes but not for automated pipelines. Rejected.

---

## Decision 9 — Artefactory credential via `X-JFrog-Art-Api` header; Groovy interpolation safety

**Decision**: The Jenkinsfile uses `withCredentials([string(...)])` and passes the token
via shell-level expansion inside single-quoted `sh '...'` strings — never via Groovy
double-quoted string interpolation.

**Rationale**: Groovy double-quoted string interpolation (`"${VAR}"`) in `sh` steps
resolves the variable *before* Jenkins can mask it, printing the raw token value in
the build log. Single-quoted `sh` strings pass the string literal to the shell, where
`$VAR` is expanded at shell runtime after Jenkins has registered the masking pattern.
The credential is provisioned as an Artefactory API key; the header is
`X-JFrog-Art-Api: $ART_TOKEN` (not `Authorization: Bearer`). If the credential is
ever migrated to an access token, the header scheme must change to `Authorization: Bearer`.

**Alternatives considered**:
- Groovy double-quoted interpolation — exposes token in build log. Rejected.
- Hardcoded token — violates FR-005. Rejected.
