# WP02 Review Cycle 2 — Feedback

Reviewer: claude:sonnet:reviewer-renata:reviewer
Date: 2026-06-01

## Verdict: CHANGES REQUESTED

Four blocking issues must be fixed before approval. All issues are in `Jenkinsfile`.

---

## Issue 1 (BLOCKER): Wrong Artefactory authentication header scheme

**Location**: Lines 156, 334, 408, 463 — every `curl` command in Validate, Publish, Smoke Check, and Rollback.

**Problem**: All `curl` calls use `Authorization: Bearer $ART_TOKEN`. The spec (T005, T008, T009, T010, T011) is explicit: the credential is an **Artefactory API key**, not an access token, and the correct header is `X-JFrog-Art-Api: $ART_TOKEN`. The spec states: _"The credential must be an Artefactory API key (not an access token) because the request header is `X-JFrog-Art-Api: <token>`. If the org moves to access tokens, the header scheme changes to `Authorization: Bearer <token>` — document this in T011's header comment but do not implement bearer mode now."_

**Fix**: Change every `curl` header from:
```sh
-H "Authorization: Bearer $ART_TOKEN" \
```
to:
```sh
-H "X-JFrog-Art-Api: $ART_TOKEN" \
```
This affects 4 locations. Then update the T011 header comment to say the credential is an **API key** (not a Bearer/access token) and document the future migration path: _"If migrating to access tokens, change the header throughout this file to `Authorization: Bearer <token>` — single global find/replace."_

---

## Issue 2 (BLOCKER): Wrong default parameter values

**Location**: `parameters {}` block, lines 69–88.

**Problem**: Three parameters have defaults that do not match the spec (T004 / Pipeline Parameters Reference table):

| Parameter | Spec default | Implementation default |
|---|---|---|
| `ARTEFACTORY_URL` | `https://artefactory.regnology.net/artifactory` | `https://artefactory.regnology.net/artefactory` (typo: `artefactory` path vs `artifactory`) |
| `ARTEFACTORY_REPO` | `spec-kitty-packs` | `generic-local` |
| `ARTEFACTORY_CREDENTIAL_ID` | `ARTEFACTORY_API_TOKEN` | `artefactory-publish-token` |

The spec's parameters table is authoritative. These defaults must match exactly so a normal merge requires zero operator input.

**Fix**:
- `ARTEFACTORY_URL` defaultValue: `'https://artefactory.regnology.net/artifactory'`
- `ARTEFACTORY_REPO` defaultValue: `'spec-kitty-packs'`
- `ARTEFACTORY_CREDENTIAL_ID` defaultValue: `'ARTEFACTORY_API_TOKEN'`

---

## Issue 3 (BLOCKER): PACK_VERSION not declared in the environment block

**Location**: `environment {}` block, lines 90–97.

**Problem**: The spec (T004 validation checklist) requires `PACK_VERSION` to be declared in the `environment {}` block with an empty default (`PACK_VERSION = ''`). The environment block currently omits `PACK_VERSION`. It also omits `ARTEFACTORY_URL` and `ARTEFACTORY_REPO` mapped from params (required by T004 scaffold: `ARTEFACTORY_URL = "${params.ARTEFACTORY_URL}"`, `ARTEFACTORY_REPO = "${params.ARTEFACTORY_REPO}"`). The absence of `PACK_VERSION` in the environment block means it is only available as an `env` property set at runtime, which is less robust and breaks the declared contract.

**Fix**: Add to the `environment {}` block:
```groovy
PACK_VERSION       = ''
ARTEFACTORY_URL    = "${params.ARTEFACTORY_URL}"
ARTEFACTORY_REPO   = "${params.ARTEFACTORY_REPO}"
```

---

## Issue 4 (BLOCKER): Header documentation missing required content (T011)

**Location**: Header comment block, lines 1–54.

**Problem**: The T011 header documentation checklist requires:
1. Lists the Artefactory **repository** must exist (type: generic) — the header only mentions parameters, not the prerequisite that the repo must be pre-created.
2. Documents the **API key vs access token** distinction with the exact migration note: _"If your org migrates to access tokens, change the curl headers throughout this file to `Authorization: Bearer <token>` — this is a single global find/replace."_ The current header ambiguously says `Bearer/API token` without explaining which is in use now and which is the future option.
3. Must include the `pack/.pack-version` (single-line semver) as an explicit numbered prerequisite.
4. The current header uses `//` line-comment style rather than a `/* ... */` block. The spec T011 specifies a `/* ... */` block comment. This is a style deviation but still a requirement.

**Fix**: Replace the `//`-style header with a `/* ... */` block comment following the T011 template exactly (see T011 step 1 in the WP prompt). The block must list all 4 prerequisites in explicit numbered form:
1. Artefactory repository `${ARTEFACTORY_REPO}` exists (type: generic).
2. Jenkins credential `${ARTEFACTORY_CREDENTIAL_ID}` exists as "Secret text" with an **Artefactory API KEY** (not access token). Header: `X-JFrog-Art-Api: <token>`. Migration note for access tokens.
3. Agent tooling: tar (GNU), zip, curl, sha256sum, sonar-scanner (DIRECTIVE_043), cyclonedx CLI.
4. `pack/.pack-version` exists (single-line semver).

---

## Non-blocking observations (do not block approval)

- **SBOM filename inconsistency**: The Security Scan stage writes `sbom.cdx.json` (flat name) while the Publish stage uploads it as `regnology-default-${version}-sbom.cdx.json` to Artefactory. The spec (T007) calls the output `regnology-default-${PACK_VERSION}.sbom.json`. The pipeline works correctly because the Publish stage uses `fileExists('sbom.cdx.json')` to gate the upload, but the remote filename deviates from the spec naming convention. Consider aligning with T007's `regnology-default-${PACK_VERSION}.sbom.json` naming in a follow-up.

- **Rollback tracks full URLs, not relative names**: T010's spec says to track artifact names (relative) and construct the DELETE URL in the rollback. The implementation tracks full URLs in `UPLOADED_ARTIFACTS`, which means the rollback loop correctly constructs the DELETE, but the URL construction logic is duplicated. This is acceptable but note it for WP04 EDR.

---

## Summary

The implementation is structurally sound: all 6 stages exist, `when { branch 'main' }` guards every stage, phased publish ordering is correct, the rollback reads `UPLOADED_ARTIFACTS` and handles the empty-list case gracefully, `$ART_TOKEN` is shell-expanded in single-quoted sh blocks (no Groovy interpolation). However, the four issues above are blockers that must be resolved before the Jenkinsfile is safe to run against a real Artefactory instance.
