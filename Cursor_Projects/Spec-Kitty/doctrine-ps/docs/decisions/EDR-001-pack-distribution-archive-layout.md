# EDR-001: Pack Distribution Archive Layout

**Status:** Accepted
**Date:** 2026-05-30
**Author:** Architect Alphonso
**Mission:** regnology-stack-distribution-pipeline-01KSWHFT
**Related:** DDR-008 (Framework Distribution and Upgrade Mechanisms),
             EDR-002 (Jenkins Artefactory Publish Strategy)

---

## Context

The Regnology doctrine pack must be distributed as downloadable archives
from Artefactory to power the bootstrap installer scripts
(`dist/scripts/install-regnology-stack.sh` / `.ps1`). The installer scripts
are already written and locked (mission constraint C-003 of
`regnology-stack-distribution-pipeline-01KSWHFT`). Four design questions
needed resolution before a Jenkins publish pipeline could be built:

1. How should the pack's machine-readable version be stored?
2. What layout should the published archives use?
3. How is archive integrity verified by downstream consumers?
4. In what order should the four published artifacts (versioned tar,
   versioned zip, latest tar, latest zip) be uploaded?

---

## Decisions

### Decision 1 — Version file format: plain-text semver

`pack/.pack-version` is a single-line plain-text file containing a semver
string (e.g., `1.0.0`). Both the POSIX shell installer and the PowerShell
installer read this file with `cat` / `Get-Content` — no parser needed.

**Why not YAML?** YAML would require `yq` or Python in the Jenkins shell
context and in user environments running the installer. The single-key
value does not justify the dependency.

### Decision 2 — Archive layout: top-level `pack/` directory wrapper

Archives are created from the repository root with `tar czf ... pack/`,
placing a single `pack/` directory at the archive root. The locked installer
uses `--strip-components=1` during extraction, which strips this wrapper
cleanly into `$PACK_DIR`.

An earlier proposal (Decision 2 first draft in research.md) suggested
omitting the wrapper via `cd pack && tar czf ../...tar.gz .`. That layout
would cause `--strip-components=1` to silently discard the first path
segment of every pack file, corrupting the extraction. The wrapper layout
is required by the locked installer contract.

Reproducibility flags accompany the tar invocation:
- `--mtime="@0"` — fixed mtime
- `--sort=name` — deterministic ordering
- `--owner=0 --group=0` — strip user/group identity

These produce bit-identical tar output across builds of the same source.

**PowerShell zip caveat**: `Expand-Archive` does not honour
`--strip-components`. The Windows extraction path must either tolerate a
`pack/` wrapper in the zip (move contents up after extract) or the
pipeline must produce a zip without the wrapper — to be resolved as the
PowerShell installer is finalised.

### Decision 3 — Integrity manifest: `META/MANIFEST.yml` inside archive

The Package stage generates a SHA-256 manifest of every pack file (excluding
`META/` itself) and includes it as `pack/META/MANIFEST.yml` inside each
archive. DDR-008 requires distributed archives to include checksums. The
manifest format is `sha256sum` output (`<hex>  <relative-path>` per line);
the `.yml` extension is for forward compatibility.

The Smoke Check stage verifies the manifest is present in the published
archive after upload.

### Decision 4 — Publish ordering: versioned pair before latest pair

The four artifacts (versioned tar, versioned zip, latest tar, latest zip)
upload in two strict phases:

1. Versioned `.tar.gz` and `.zip` — both must return HTTP 201 before
   proceeding.
2. Latest-alias `.tar.gz` and `.zip` — upload only after Phase 1 succeeds.

This eliminates the window where `latest` points to a version that does not
yet exist as a versioned artifact. A residual race exists if two pipelines
run concurrently on `main`, but versioned artifacts remain immutable and
consistent regardless.

---

## Consequences

- The Jenkins `Package` stage uses one canonical tar invocation; no
  conditional logic for "with wrapper / without wrapper".
- The installer's existing `--strip-components=1` continues to work
  unchanged (C-003 satisfied).
- All published archives carry a self-contained integrity manifest,
  enabling future integrity-verification features in the installer.
- The publish ordering rules out one class of consistency bug at the cost
  of slightly longer Publish-stage runtime.

---

## Alternatives Considered

- **No `pack/` wrapper + remove `--strip-components=1` from installer**:
  Violates C-003 (installer is locked).
- **`pack/meta.yaml` instead of `.pack-version`**: Requires YAML parser in
  shell contexts.
- **External `.sha256` sidecar files**: Forces a separate download per
  archive; not supported by the existing installer flow.
- **All four uploads in parallel**: Eliminates ordering guarantee for the
  `latest` alias.

---

## References

- Mission spec: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/spec.md`
- Research log: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md` (Decisions 1, 2, 6, 7)
- Locked installer: `dist/scripts/install-regnology-stack.sh` L319
- Related: DDR-008 (Framework Distribution and Upgrade Mechanisms)
