# EDR-002: Jenkins Artefactory Publish Strategy

**Status:** Accepted
**Date:** 2026-05-30
**Author:** Architect Alphonso
**Mission:** regnology-stack-distribution-pipeline-01KSWHFT
**Related:** EDR-001 (Pack Distribution Archive Layout),
             DIRECTIVE_043 (AppSec Compliance),
             DIRECTIVE_018 (Traceable Decisions)

---

## Context

With the archive layout settled (EDR-001), the publishing pipeline needs
to resolve five further decisions:

1. How is the Artefactory credential identified across Jenkins
   environments?
2. How does the `latest` alias mechanism work in a generic Artefactory
   repository?
3. Where should the bootstrap installer sit in `docs/HOW_TO_USE.md`?
4. What happens when a publish run partially succeeds?
5. How are credentials kept out of the Jenkins build log?

---

## Decisions

### Decision 1 — Credential ID via pipeline parameter

The Jenkinsfile exposes `ARTEFACTORY_CREDENTIAL_ID` as a `string` pipeline
parameter with default `ARTEFACTORY_API_TOKEN`. The credential is consumed
via `withCredentials([string(credentialsId: params.ARTEFACTORY_CREDENTIAL_ID, ...)])`.

This allows the same Jenkinsfile to work across dev / staging / prod
Jenkins instances that may have different credential IDs, without source
edits. The credential must be an **Artefactory API key** (header:
`X-JFrog-Art-Api: <token>`); if the org migrates to access tokens, the
header scheme switches to `Authorization: Bearer <token>` via a single
find/replace.

### Decision 2 — `latest` alias via re-upload

Artefactory generic repositories do not support symlinks. The `latest`
alias is implemented by re-uploading the same archive bytes to a second
path (`regnology-default-latest.tar.gz` / `.zip`). This is the standard
pattern for generic repos.

Artefactory Pro features (AQL queries, Properties, Release Bundles) were
considered and rejected as out-of-scope.

### Decision 3 — HOW_TO_USE: installer as primary, manual as appendix

`docs/HOW_TO_USE.md` leads with the bootstrap installer. The former
git-clone manual procedure is preserved verbatim in an Appendix labelled
"Manual / Offline Setup" for air-gapped use (FR-008).

The CLI flag `--artefactory-token <value>` is explicitly labelled
CI-only; the recommended interactive path is the `ARTEFACTORY_TOKEN`
environment variable. This avoids training developers to pass secrets via
shell command-line arguments, which would leak into shell history and
process listings.

### Decision 4 — Partial-publish rollback in `post { failure }`

The Publish stage tracks uploaded artifacts in `env.UPLOADED_ARTIFACTS`
(comma-separated). If any stage between Validate and Smoke Check fails,
the `post { failure }` block issues `curl -X DELETE` for every artifact
uploaded in that run, restoring Artefactory to its pre-build state.

An earlier design (research.md historical note) had the publish step
accept HTTP 403 (already-published) and continue. That design silently
masked partial publishes — if the tar succeeded but the zip failed,
downstream consumers would see an incomplete release under a valid
version. The Validate-stage duplicate-version guard plus post-failure
rollback gives a clean all-or-nothing publish.

`FORCE_PUBLISH=true` bypasses the duplicate-version guard for hotfix
scenarios but does NOT suppress rollback on failure.

### Decision 5 — Groovy interpolation safety for credentials

Every `curl` invocation that includes the Artefactory token uses a
single-quoted Groovy `sh` block so the `$ART_TOKEN` reference is expanded
by the shell, not by Groovy. Jenkins masks the secret in the build log
only when it appears as a shell variable reference, not when it has
already been interpolated by Groovy.

**Forbidden pattern**: `sh "curl -H \"X-JFrog-Art-Api: ${ART_TOKEN}\" ..."`
— Groovy resolves `${ART_TOKEN}` before Jenkins sees the string. The
raw token value lands in the build log.

**Required pattern**:
```groovy
sh '''
    curl -H "X-JFrog-Art-Api: $ART_TOKEN" "$URL"
'''
```
The single quotes prevent Groovy interpolation; the shell expands
`$ART_TOKEN` at runtime, which Jenkins masks.

This rule is enforced by the Jenkinsfile header comment and reviewer
guidance in WP02.

---

## Consequences

- Credential ID is a single point of configuration across Jenkins
  environments.
- The `latest` mechanism does not depend on Artefactory enterprise features.
- Developer documentation flows from installer to manual fallback,
  matching the actual recommended path.
- Partial publishes can never leave Artefactory inconsistent; every
  published version represents a complete four-file set or nothing.
- Token exposure via Groovy interpolation is eliminated by convention,
  enforced in code review.

---

## Alternatives Considered

- **Hardcoded credential ID**: Simpler but breaks multi-environment Jenkins
  setups.
- **Artefactory Properties + AQL for `latest`**: Requires Pro features.
- **403-warn-and-continue idempotency**: Masks partial publishes silently.
- **Manual cleanup of partial publishes**: Acceptable ad-hoc, unacceptable
  in an automated pipeline.
- **Documenting `--artefactory-token` as the recommended path**: Trains
  users to leak secrets via shell history.

---

## References

- Mission spec: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/spec.md`
- Research log: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md` (Decisions 3, 4, 5, 8, 9)
- Implementation: `Jenkinsfile`, `docs/HOW_TO_USE.md`
- Related: EDR-001, DIRECTIVE_043 (AppSec Compliance), DIRECTIVE_018 (Traceable Decisions)
