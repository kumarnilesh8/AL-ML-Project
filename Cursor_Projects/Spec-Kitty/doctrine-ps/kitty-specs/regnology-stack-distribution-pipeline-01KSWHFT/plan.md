# Implementation Plan: Regnology Stack Distribution Pipeline

**Branch**: `overhaul/migrate_to_kitty` | **Date**: 2026-05-30 | **Spec**: [spec.md](spec.md)  
**Mission**: `regnology-stack-distribution-pipeline-01KSWHFT`

---

## Summary

Add the three missing pieces that allow `install-regnology-stack.sh` / `.ps1` to work
end-to-end from Artefactory: a `pack/.pack-version` semver file, a root `Jenkinsfile`
that publishes versioned `.tar.gz` + `.zip` archives to Artefactory on merge to `main`,
and a `docs/HOW_TO_USE.md` rewrite that positions the bootstrap installer as the primary
developer setup path.

No new data models or API endpoints. All deliverables are file changes in the existing
repository.

---

## Technical Context

**Language/Version**: Groovy (Jenkinsfile declarative pipeline syntax); POSIX shell (archive packaging steps); Markdown (docs update)  
**Primary Dependencies**: Jenkins (Bitbucket-connected CI); JFrog Artefactory (generic file repository `spec-kitty-packs/`); `tar`, `zip`, `curl` (available on Jenkins Linux agent)  
**Storage**: Artefactory generic repository — file naming: `regnology-default-<semver>.tar.gz`, `regnology-default-<semver>.zip`, plus `latest`-alias copies  
**Testing**: Manual smoke-check — run installer in `--dry-run` mode; run `spec-kitty doctor doctrine` on extracted pack  
**Target Platform**: Jenkins agents on Linux (CI); pack archives consumed on Linux / macOS / Windows  
**Project Type**: CI/CD pipeline + plain-text configuration + documentation  
**Performance Goals**: Publish stage completes within 5 minutes of merge trigger (NFR-001)  
**Constraints**: Pipeline publishes only on `main` branch (C-005); Artefactory auth via Jenkins credential — never hardcoded token (FR-005); archives must be self-contained (NFR-002)  
**Scale/Scope**: Single pack, single Artefactory repository, triggered on each merge to `main`

---

## Charter Check

| Concern | Assessment |
|---|---|
| `pack/.pack-version` placement | `pack/` is the shippable doctrine artifact directory (DIR-001). Version file belongs here and will be distributed via `spec-kitty doctrine fetch`. ✅ |
| `Jenkinsfile` at repo root | CI pipeline definition. Not a doctrine artifact, not a dashboard tool, not a doc. Root placement is the Jenkins convention; no charter rule conflicts. ✅ |
| `docs/HOW_TO_USE.md` update | `docs/` is human-readable documentation (charter directory rule). ✅ |
| Installer scripts (`dist/`) | Not touched (C-003). ✅ |

No charter conflicts.

---

## Project Structure

Affected files (repository root checkout):

```
pack/
  .pack-version                   # NEW — single-line semver, e.g. "1.0.0"
Jenkinsfile                       # NEW — declarative pipeline; publish on main merge
docs/
  HOW_TO_USE.md                   # MODIFIED — installer as primary setup path
  decisions/
    EDR-001-pack-distribution-archive-layout.md   # NEW — EDR for Decisions 1–2, 6–7
    EDR-002-jenkins-artefactory-publish-strategy.md # NEW — EDR for Decisions 3–5, 8–9
```

---

## Phase 0: Research

All design decisions were resolved in the engineering note
`docs/engineering_notes/2026-05-30-multi-org-migration-and-feature-gaps.md` §2.4 and §3.6,
and validated when the installer scripts were written. See `research.md` for the decision
log.

---

## Phase 1: Design

### 1.1 `pack/.pack-version`

A plain-text file containing a single line: the semantic version of the
`regnology-default` pack.

```
1.0.0
```

Rules:
- Format: `MAJOR.MINOR.PATCH` optionally followed by a pre-release suffix
  (e.g. `1.0.0-rc1`).
- Shell-readable via `$(cat pack/.pack-version | tr -d '[:space:]')`.
- Initial value: `1.0.0`.
- The CI publish stage reads this file; a missing or malformed file fails the build
  fast (FR-009).
- Distributed with the pack (lives inside `pack/`) so the installer can confirm the
  downloaded archive's version matches the requested version.

**Why plain text over YAML?** Shell `cat` requires no parser. The installer scripts are
POSIX sh and PowerShell — both can read a single-line text file without dependencies.

**Version lifecycle governance**: The pack maintainer is responsible for bumping
`pack/.pack-version` in every PR that changes pack content before merging to `main`.
The Validate stage enforces this by checking whether the version already exists in
Artefactory (HTTP HEAD `regnology-default-${PACK_VERSION}.tar.gz`); if it does and
`FORCE_PUBLISH=false`, the build fails fast with "version already published — bump
pack/.pack-version". This prevents silent re-publication of stale content under an
unchanged version label.

### 1.2 `Jenkinsfile`

Declarative pipeline at the repository root. Trigger: `main` branch only (C-005).

**Stage sequence:**

| Stage | What it does |
|---|---|
| `Checkout` | Standard `checkout scm` |
| `Validate` | Read `pack/.pack-version`; assert it matches `^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$`; fail fast if absent or malformed (FR-009). Then HTTP HEAD `regnology-default-${PACK_VERSION}.tar.gz` in Artefactory — if HTTP 200 and `FORCE_PUBLISH=false`, fail fast: "version already published — bump pack/.pack-version" |
| `Package` | From repo root: `tar czf regnology-default-${PACK_VERSION}.tar.gz --mtime="@0" --sort=name --owner=0 --group=0 pack/` (archive root is `pack/`; installer strips it with `--strip-components=1`). Generate integrity manifest: `sha256sum $(find pack -type f \| sort) > META/MANIFEST.yml`. Include manifest in archive. `zip -r regnology-default-${PACK_VERSION}.zip pack/` (best-effort; see Decision 2 zip note). Guard: `which zip \|\| apt-get install -y zip` |
| `Security Scan` | Run SonarQube SAST: `sonar-scanner -Dsonar.projectKey=regnology-doctrine-pack`. Generate CycloneDX SBOM: `cyclonedx generate --output regnology-default-${PACK_VERSION}.sbom.json`. Upload SBOM to Artefactory alongside pack archives (DIRECTIVE_043) |
| `Publish` | Phase 1 — upload versioned `.tar.gz` and `.zip`; verify both return HTTP 201. Phase 2 — upload `latest`-alias `.tar.gz` and `.zip` only after Phase 1 succeeds (Decision 7). Auth via `withCredentials([string(credentialsId: ARTEFACTORY_CREDENTIAL_ID, variable: 'ART_TOKEN')])` and shell-level `$ART_TOKEN` in single-quoted `sh` steps — never Groovy double-quoted interpolation (Decision 9, FR-005) |
| `Smoke Check` | Download the published `.tar.gz` and verify it is a valid archive with non-zero file count: `curl -sL <url> \| tar -tzf - \| wc -l`. Fail if count is 0 or command errors. Verify `META/MANIFEST.yml` is present in the listing |

**Idempotency and rollback (FR-010):** The Validate stage prevents re-publication of
an existing version when `FORCE_PUBLISH=false` (fail-fast on HTTP 200 for versioned
artifact). If the Validate stage passes and Publish fails mid-way (partial upload),
the `post { failure { } }` block issues `curl -X DELETE` for each artifact successfully
uploaded in that run, restoring Artefactory to a clean state. This ensures a version
either has a complete four-file set (versioned tar, versioned zip, latest tar, latest zip)
or nothing. `FORCE_PUBLISH=true` bypasses the duplicate-version guard in Validate but
does not suppress the rollback on failure.

**Pipeline parameters (all with defaults, no required user input for normal merges):**

| Parameter | Default | Purpose |
|---|---|---|
| `ARTEFACTORY_URL` | `https://artefactory.regnology.net/artifactory` | Artefactory base URL |
| `ARTEFACTORY_REPO` | `spec-kitty-packs` | Target repository in Artefactory |
| `ARTEFACTORY_CREDENTIAL_ID` | `ARTEFACTORY_API_TOKEN` | Jenkins credential ID for the Artefactory API token |
| `FORCE_PUBLISH` | `false` | Override re-deployment protection |

### 1.3 `docs/HOW_TO_USE.md`

Restructured so the bootstrap installer is the primary path (FR-006, FR-007) with a
manual fallback appendix for air-gapped environments (FR-008).

**New structure:**

```
## Prerequisites
  (updated: spec-kitty no longer needs separate installation)

## Step 1 — Run the bootstrap installer
  (new: platform-specific one-liners for Unix and Windows)
  (new: version pinning example)

## Step 2 — Set up an engagement repo
  (kept: spec-kitty init, charter interview)

## Keeping the stack current
  (new: re-run installer with --pack-version latest)

## Team lead checklist
  (updated: references installer instead of git-clone steps)

## Appendix: Manual Setup (air-gapped / Artefactory unavailable)
  (former Steps 1–8 moved here verbatim, labelled as fallback)

## Troubleshooting
  (kept, minor updates)
```

---

## Quickstart Validation Scenarios

1. **Version file readable**: `cat pack/.pack-version` — expected: prints a semver string, exits 0.
2. **Archive self-contained + manifest present**: Extract `regnology-default-1.0.0.tar.gz`
   to an empty temp dir with `--strip-components=1`; confirm `META/MANIFEST.yml` is present;
   run `spec-kitty doctor doctrine` with `local_path` pointing there — expected: all artifact
   counts match the source pack.
3. **Installer dry-run succeeds**: `./dist/scripts/install-regnology-stack.sh --dry-run` —
   expected: prints planned actions, exits 0, creates no files.
4. **HOW_TO_USE leads with installer**: First setup section references the installer scripts,
   not `git clone`.
5. **CI Validate fails on missing version**: Remove `pack/.pack-version`, run the Validate
   stage locally — expected: non-zero exit with "version file missing" message.
6. **CI Validate fails on already-published version**: With `FORCE_PUBLISH=false`, simulate
   a HEAD request returning 200 — expected: non-zero exit with "version already published" message.

---

## Implementation Sequence

Four work packages. WP01 is the dependency anchor; WP02, WP03, and WP04 can be
parallelized once WP01 is approved:

```
WP01 (pack/.pack-version)
  └─ WP02 (Jenkinsfile)         # reads the version file
  └─ WP03 (HOW_TO_USE update)   # references the version concept
  └─ WP04 (EDR-001, EDR-002)    # engineering decisions for pipeline + archive layout
```

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Jenkins credential ID `ARTEFACTORY_API_TOKEN` doesn't match the actual configured name | Medium | Publish stage fails | Jenkinsfile uses `ARTEFACTORY_CREDENTIAL_ID` parameter with a documented default; implementer confirms with Jenkins admin before merge. Credential must be an API key (not an access token) for `X-JFrog-Art-Api` header; document both types in Jenkinsfile header comment |
| Artefactory repository `spec-kitty-packs/` doesn't exist yet | Medium | HTTP 404 on first publish | Document repository creation as a pre-deployment prerequisite in the Jenkinsfile header comment |
| `zip` not available on CI agent | Low | Package stage fails | `which zip \|\| apt-get install -y zip` guard in Package stage |
| Zip archive with `pack/` wrapper not handled by PS installer's `Expand-Archive` | Medium | Windows install extracts to wrong path | Verify PowerShell installer extraction logic during WP02; if `Expand-Archive` does not strip the `pack/` root, add a post-extraction move step or supply the zip without a wrapper (tar-only for the strip-components constraint, zip flat for Windows) |
| SonarQube or CycloneDX not available on CI agent | Medium | Security Scan stage fails | Gate Security Scan with `which sonar-scanner` check; make stage non-blocking with `catchError(buildResult: 'UNSTABLE')` on first deploy; make it blocking once confirmed installed |
| `latest`-alias race window: concurrent pipeline runs may partially overwrite | Low | Consumer gets mismatched latest pair | Accept as known limitation; versioned artifacts are always consistent; document in Jenkinsfile comment |
| HOW_TO_USE appendix drifts from installer flags as scripts evolve | Low | Docs inaccuracy | Appendix note: "Run `./install-regnology-stack.sh --help` for authoritative flag reference" |
| `--artefactory-token` flag in HOW_TO_USE trains users to pass secrets in shell history | Medium | Token exposure | Document `ARTEFACTORY_TOKEN` env var as the recommended path; label the CLI flag as CI/scripted use only |
