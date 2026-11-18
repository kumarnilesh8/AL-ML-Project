# Research: Single Command Installer Bootstrap

## Inputs reviewed

- `kitty-specs/single-command-installer-bootstrap-01KVFHX6/spec.md`
- `dist/scripts/install-regnology-stack.sh`
- `dist/scripts/install-regnology-stack.ps1`
- `dist/scripts/README.md`
- `docs/HOW_TO_INSTALL.md`
- `.kittify/charter/charter.md`

---

## Findings and decisions

### 1) Distribution strategy

- **Decision**: Use Artifactory as primary install source and keep Bitbucket-hosted script as fallback location.
- **Rationale**: preserves managed enterprise distribution while maintaining repository accessibility.
- **Alternatives considered**:
  - Artifactory-only (rejected: no repository fallback visibility).
  - Bitbucket-only (rejected: bypasses centralized release distribution).

### 2) Publish path

- **Decision**: publish release artifacts to JFrog through Jenkins pipeline only.
- **Rationale**: clear, auditable release flow with one authoritative distribution channel.
- **Alternatives considered**:
  - manual publishing (rejected: inconsistent and error-prone).
  - dual publish to JFrog + Bitbucket releases (rejected per mission constraints).

### 3) spec-kitty version stability

- **Decision**: pin spec-kitty via release-tag mapping using `config/release-map.yaml`.
- **Rationale**: deterministic installations and reproducible support/debug behavior.
- **Alternatives considered**:
  - always latest release (rejected: drift risk).
  - hardcoded versions in each script (rejected: duplication and divergence risk).

### 4) Platform baseline

- **Decision**: enforce Python 3.12 baseline for installer readiness checks.
- **Rationale**: explicit baseline requested by stakeholder and consistent across platforms.
- **Alternatives considered**:
  - Python 3.9+ compatibility baseline (rejected: out of scope for this mission).

### 5) Parity-critical behavior

- **Decision**: preserve deterministic layer order in both scripts:
  1. `regnology-all-company`
  2. `ps-agent-enabled-factory`
- **Rationale**: consistent doctrine layering and reduced regression risk.

### 6) Tag→version resolution mechanism (resolves "runtime resolution is impossible")

- **Decision**: resolve pinned versions at **build time** and inject them into the published
  installer via placeholder substitution (`@SPEC_KITTY_VERSION@`, `@OVERLAY_PACK_VERSION@`,
  `@BASE_PACK_VERSION@`, `@RELEASE_TAG@`). The published `curl|sh` installer is self-contained.
- **Rationale**: a piped installer has no tag context at runtime and cannot reliably discover "which
  tag am I". Build-time injection is deterministic and auditable.
- **Alternatives considered**: runtime tag discovery (rejected: impossible/fragile); bundling the
  whole map into the script (rejected: still needs to know the tag); querying a "latest" API
  (rejected: defeats pinning).

### 7) Download integrity (resolves "no integrity/authenticity verification")

- **Decision**: publish a detached `<artifact>.sha256` for every payload; the installer verifies it
  after download and before extraction/`pipx`.
- **Rationale**: the existing pipeline only emits an *in-archive* `pack/META/MANIFEST.yml`, which
  cannot protect against a truncated/tampered download before extraction.
- **Alternatives considered**: GPG signatures (deferred: key distribution out of scope this mission);
  rely on TLS only (rejected: no end-to-end artifact integrity).

### 8) CI trigger model (resolves "Jenkins is not tag-driven")

- **Decision**: the release/publish path must be **tag-triggered** and resolve versions from
  `config/release-map.yaml`.
- **Current-state gap**: the existing `Jenkinsfile` (mission `regnology-stack-distribution-pipeline-01KSWHFT`)
  triggers on merge-to-`main` and derives the version solely from `pack/.pack-version`. Reconciling
  the trigger and version source is an implementation task, not a documentation assumption.

### 9) Artifact naming (resolves "artifact-name mismatch")

- **Decision**: publish the overlay archive as `ps-agent-enabled-factory-<version>`; consume the base
  `regnology-all-company-<version>` from the upstream distribution.
- **Current-state gap**: the existing pipeline publishes a single `regnology-default-*` archive. The
  installer's two-layer expectation and the pipeline's single-archive output must be reconciled
  (rename + ensure the base layer is sourced upstream).

### 10) Fallback semantics (resolves "undefined fallback trigger")

- **Decision**: Bitbucket hosts the installer **script** for discovery/manual download only. It is
  not a runtime payload mirror and there is no automatic Artifactory→Bitbucket payload failover.
- **Rationale**: matches the stakeholder statement that "the install script on bitbucket can just sit
  in the repo"; avoids a second integrity/availability surface.

---

## Open items (NEEDS-CONFIRMATION — implementation tasks, not assumptions)

1. Concrete pinned `spec_kitty_version` and `default_spec_kitty_version` in `config/release-map.yaml`.
2. ~~Concrete upstream `base_pack_version` and the `{base_upstream}` Artifactory root for the
   all-company layer.~~ **RESOLVED 2026-06-19:** `base_pack_version` pinned to `1.0.0` from the
   upstream `regnology-all-company` source of truth (`RFG/skills`, `pack/.pack-version`, merged
   to default). The `{base_upstream}` Artifactory root remains an env-provided deploy input.
3. Confirmation that the published spec-kitty distribution name (`spec-kitty` vs `spec-kitty-cli`)
   matches what `pipx install` expects — the existing Jenkinsfile uses `spec-kitty-cli`.

---

## Risks to manage during implementation

1. **Mapping drift**: scripts and Jenkins interpret release-map differently (mitigated: Jenkins is
   the sole authoritative reader; scripts consume injected values).
2. **Platform drift**: macOS/Linux/Windows paths diverge for dependency setup.
3. **Credential handling**: accidental logging of token-like values in verbose output.
4. **Publish drift**: pipeline behavior accidentally introduces non-JFrog publish side paths.
5. **Injection drift**: a published script still containing `@…@` tokens — guard with a post-inject
   "no remaining placeholders" check in CI.

---

## Planning conclusion

Research is sufficient for implementation planning. The architectural blockers raised in adversarial
review are resolved by decisions R-6 (build-time injection), R-7 (detached integrity), R-8
(tag-trigger), R-9 (two-layer naming), and R-10 (fallback semantics). Three version values remain
explicit `NEEDS-CONFIRMATION` implementation tasks rather than silent assumptions.
