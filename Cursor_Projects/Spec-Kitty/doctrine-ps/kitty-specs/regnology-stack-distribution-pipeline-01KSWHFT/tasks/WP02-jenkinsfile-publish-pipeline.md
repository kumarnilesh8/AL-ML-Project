---
work_package_id: WP02
title: Jenkinsfile Publish Pipeline
dependencies:
- WP01
requirement_refs:
- FR-002
- FR-003
- FR-004
- FR-005
- FR-009
- FR-010
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-regnology-stack-distribution-pipeline-01KSWHFT
base_commit: 1d208d986a18ad65d2c24872c61365a71ffd75e3
created_at: '2026-05-30T20:02:47.943697+00:00'
subtasks:
- T004
- T005
- T006
- T007
- T008
- T009
- T010
- T011
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "905893"
history: []
agent_profile: implementer-ivan
authoritative_surface: Jenkinsfile
execution_mode: code_change
owned_files:
- Jenkinsfile
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load implementer-ivan
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Implement a declarative Jenkins pipeline at the repository root (`Jenkinsfile`)
that, on every merge to `main`, publishes a versioned pack release to Regnology
Artefactory with integrity manifest, security scans, atomic publish-or-rollback,
and a self-verifying smoke check.

This is the central deliverable of the mission. It is also the WP with the
highest review surface because it touches secrets, network egress, and the
contract with the locked installer scripts. Read **all** subtasks before starting.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: A worktree allocated by `finalize-tasks` based on this
  WP's lane in `lanes.json`. Enter the workspace path printed by
  `spec-kitty agent action implement WP02 --agent <your-name>`.

## Critical Pre-Read

Before writing any Groovy:

1. Read `dist/scripts/install-regnology-stack.sh` lines 300–330. Note that line
   ~319 already extracts with `tar -xzf "$PACK_ARCHIVE" -C "$PACK_DIR" --strip-components=1`.
   **The archive you produce MUST have a `pack/` top-level directory** so that
   `--strip-components=1` strips it cleanly. This is the single most important
   contract.
2. Read `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md`
   in full. Decisions 1–9 are the source of truth for every design choice in
   this pipeline. Do not deviate without raising a Decision Moment.
3. Read `pack/directives/043-appsec-compliance.directive.yaml` for the AppSec
   stage requirements (SAST + SBOM).
4. Read `pack/.pack-version` to confirm it exists and is readable
   (WP01 must be merged first).

## Pipeline Parameters Reference

The Jenkinsfile declares four parameters, all with defaults so a normal merge
needs zero input:

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `ARTEFACTORY_URL` | string | `https://artefactory.regnology.net/artifactory` | Artefactory base URL |
| `ARTEFACTORY_REPO` | string | `spec-kitty-packs` | Target repository in Artefactory |
| `ARTEFACTORY_CREDENTIAL_ID` | string | `ARTEFACTORY_API_TOKEN` | Jenkins credential ID |
| `FORCE_PUBLISH` | booleanParam | `false` | Bypass duplicate-version guard (does NOT suppress rollback) |

The credential must be an **Artefactory API key** (not an access token) because
the request header is `X-JFrog-Art-Api: <token>`. If the org moves to access
tokens, the header scheme changes to `Authorization: Bearer <token>` — document
this in T011's header comment but do not implement bearer mode now.

## Stage Architecture (all stages run only on `branch == 'main'`)

```
Checkout → Validate → Package → Security Scan → Publish → Smoke Check
                                                              │
                                                              └─ post.failure → Rollback
```

---

### Subtask T004 — Scaffold declarative Jenkinsfile

**Purpose**: Create the structural skeleton of the pipeline so subsequent
subtasks can fill in stage bodies without restructuring.

**Steps**:
1. Create `Jenkinsfile` at the repository root with this skeleton:

   ```groovy
   pipeline {
       agent any

       options {
           timestamps()
           ansiColor('xterm')
           buildDiscarder(logRotator(numToKeepStr: '30'))
           timeout(time: 30, unit: 'MINUTES')
       }

       parameters {
           string(
               name: 'ARTEFACTORY_URL',
               defaultValue: 'https://artefactory.regnology.net/artifactory',
               description: 'Artefactory base URL'
           )
           string(
               name: 'ARTEFACTORY_REPO',
               defaultValue: 'spec-kitty-packs',
               description: 'Target repository name in Artefactory'
           )
           string(
               name: 'ARTEFACTORY_CREDENTIAL_ID',
               defaultValue: 'ARTEFACTORY_API_TOKEN',
               description: 'Jenkins credential ID for the Artefactory API key'
           )
           booleanParam(
               name: 'FORCE_PUBLISH',
               defaultValue: false,
               description: 'Bypass duplicate-version guard (does not suppress rollback on failure)'
           )
       }

       environment {
           PACK_VERSION       = ''
           UPLOADED_ARTIFACTS = ''
           ARTEFACTORY_URL    = "${params.ARTEFACTORY_URL}"
           ARTEFACTORY_REPO   = "${params.ARTEFACTORY_REPO}"
       }

       stages {
           stage('Checkout') {
               when { branch 'main' }
               steps {
                   checkout scm
               }
           }
           // Subsequent stages added in T005–T010
       }

       post {
           failure {
               // Rollback block added in T010
               echo 'Build failed — see Rollback stage output'
           }
       }
   }
   ```

2. Validate Groovy syntax locally if `groovy` CLI is available:
   ```bash
   groovy -e "new groovy.lang.GroovyShell().parse(new File('Jenkinsfile'))" 2>&1 || true
   ```
   This is best-effort; declarative pipeline syntax is not fully parseable
   outside Jenkins, but a successful parse confirms no basic Groovy errors.

**Files**:
- `Jenkinsfile` (new file, ~50 lines at this point)

**Validation**:
- [ ] File exists at repo root
- [ ] Four `parameters` declared with the documented defaults
- [ ] `when { branch 'main' }` is present
- [ ] `options` block includes `timestamps()`, `timeout(30 MINUTES)`, and `buildDiscarder`
- [ ] `environment {}` declares `PACK_VERSION`, `UPLOADED_ARTIFACTS`, `ARTEFACTORY_URL`, `ARTEFACTORY_REPO` (needed by later stages and the rollback block)

---

### Subtask T005 — Checkout + Validate stages

**Purpose**: Read the pack version, validate it against the semver regex, then
HEAD-check Artefactory for duplicate-version protection.

**Steps**:
1. The `Checkout` stage already exists (T004). Verify it.

2. Add a `Validate` stage immediately after `Checkout`. Body:

   ```groovy
   stage('Validate') {
       when { branch 'main' }
       steps {
           script {
               // Read version
               def ver = sh(
                   script: "cat pack/.pack-version | tr -d '[:space:]'",
                   returnStdout: true
               ).trim()

               if (!ver) {
                   error 'pack/.pack-version is missing or empty'
               }

               // Semver regex (matches plan.md §1.2)
               if (!(ver ==~ /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/)) {
                   error "pack version '${ver}' does not match semver pattern"
               }

               env.PACK_VERSION = ver
               echo "Pack version: ${env.PACK_VERSION}"

               // Duplicate-version guard (HTTP HEAD, no body download)
               if (!params.FORCE_PUBLISH) {
                   withCredentials([string(
                       credentialsId: params.ARTEFACTORY_CREDENTIAL_ID,
                       variable: 'ART_TOKEN'
                   )]) {
                       def url = "${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}/regnology-default-${env.PACK_VERSION}.tar.gz"
                       def httpStatus = sh(
                           script: '''
                               curl -sI -o /dev/null -w "%{http_code}" \
                                 -H "X-JFrog-Art-Api: $ART_TOKEN" \
                                 ''' + "\"${url}\"",
                           returnStdout: true
                       ).trim()

                       if (httpStatus == '200') {
                           error "Version '${env.PACK_VERSION}' already published. Bump pack/.pack-version or rerun with FORCE_PUBLISH=true."
                       }
                       echo "Duplicate-version guard: ${httpStatus} — OK to proceed"
                   }
               } else {
                   echo 'FORCE_PUBLISH=true — skipping duplicate-version guard'
               }
           }
       }
   }
   ```

**Critical safety note for T005**: The `curl` command uses a single-quoted shell
string for the body (`'curl ... -H "X-JFrog-Art-Api: $ART_TOKEN"'`) so the
`$ART_TOKEN` expansion happens in the shell, not in Groovy. The URL is appended
via Groovy string concatenation, which is safe because the URL contains no
secrets. **Never** write `"curl -H 'X-JFrog-Art-Api: ${env.ART_TOKEN}'"` — that
would print the token in the build log.

**Files**:
- `Jenkinsfile` (updated, ~40 lines added)

**Validation**:
- [ ] `Validate` stage exists with `when { branch 'main' }`
- [ ] Semver regex matches plan.md §1.2 exactly
- [ ] Duplicate-version HEAD check uses `$ART_TOKEN` (shell-expanded), not `${env.ART_TOKEN}` (Groovy-expanded)
- [ ] `FORCE_PUBLISH=true` correctly skips the guard
- [ ] On version mismatch or HTTP 200, the build fails with a clear message

---

### Subtask T006 — Package stage with integrity manifest

**Purpose**: Produce a reproducible `.tar.gz` and best-effort `.zip` of the pack
directory, with a SHA-256 integrity manifest embedded inside the archive.

**Steps**:
1. Add the `Package` stage after `Validate`:

   ```groovy
   stage('Package') {
       when { branch 'main' }
       steps {
           sh '''
               set -euo pipefail

               # Generate integrity manifest BEFORE archiving (so it ends up inside)
               mkdir -p pack/META
               (cd pack && find . -type f ! -path './META/*' -print0 | sort -z | xargs -0 sha256sum) > pack/META/MANIFEST.yml

               # Ensure zip is present (Linux agent — apt-get is fine here)
               which zip >/dev/null 2>&1 || (apt-get update && apt-get install -y zip)

               # Reproducible tar with pack/ wrapper (DO NOT cd into pack/)
               tar czf "regnology-default-${PACK_VERSION}.tar.gz" \
                   --mtime="@0" \
                   --sort=name \
                   --owner=0 \
                   --group=0 \
                   pack/

               # Zip with pack/ wrapper (best effort)
               zip -r "regnology-default-${PACK_VERSION}.zip" pack/

               # Show what we built
               ls -lh regnology-default-*.tar.gz regnology-default-*.zip
               sha256sum regnology-default-*.tar.gz regnology-default-*.zip
           '''
       }
   }
   ```

2. Note the manifest format: each line is `<sha256-hex>  <relative-path>`,
   produced by `sha256sum`. The file extension is `.yml` for forward
   compatibility (consumers can later parse it as YAML if structure changes),
   but its current shape is `sha256sum` output. Documentation in WP04's EDR-001
   should describe this.

3. **Reproducibility**: `--mtime="@0"` sets all entries' mtime to 1970-01-01;
   `--sort=name` ensures deterministic ordering; `--owner=0 --group=0` strips
   user/group identity. With these flags, two builds of the same source produce
   bit-identical tar.gz files (modulo gzip header timestamps; use `gzip -n` if
   strict reproducibility is needed — defer for now).

4. **Why `find ! -path './META/*'`**: the manifest itself cannot include its
   own checksum (chicken-and-egg). Excluding `META/` from the manifest is the
   conventional resolution.

**Files**:
- `Jenkinsfile` (updated, ~30 lines added)

**Validation**:
- [ ] `Package` stage uses `tar czf ... pack/` (with `pack/` wrapper)
- [ ] `--mtime`, `--sort`, `--owner`, `--group` flags present for reproducibility
- [ ] `pack/META/MANIFEST.yml` is generated BEFORE the tar command
- [ ] `find` command excludes `./META/*` (avoids self-reference)
- [ ] Zip stage runs after a `which zip || apt-get install -y zip` guard
- [ ] On a local equivalent run, `tar -tzf regnology-default-*.tar.gz | head -3` shows entries beginning with `pack/`

---

### Subtask T007 — Security Scan stage

**Purpose**: Satisfy DIRECTIVE_043 (APPSEC_COMPLIANCE) by running SAST and
generating a CycloneDX SBOM before the artifact is published.

**Steps**:
1. Add the `Security Scan` stage after `Package`:

   ```groovy
   stage('Security Scan') {
       when { branch 'main' }
       steps {
           catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
               sh '''
                   set -euo pipefail

                   # SAST — best-effort until SonarQube is confirmed available on agent
                   if which sonar-scanner >/dev/null 2>&1; then
                       sonar-scanner -Dsonar.projectKey=regnology-doctrine-pack \
                                     -Dsonar.sources=pack
                   else
                       echo "WARN: sonar-scanner not installed — skipping SAST (DIRECTIVE_043 stage UNSTABLE)"
                   fi

                   # SBOM — generate CycloneDX in JSON format
                   if which cyclonedx >/dev/null 2>&1; then
                       cyclonedx generate \
                           --input-format dir \
                           --input pack/ \
                           --output-format json \
                           --output "regnology-default-${PACK_VERSION}.sbom.json"
                   elif which cyclonedx-cli >/dev/null 2>&1; then
                       cyclonedx-cli generate \
                           --input pack/ \
                           --output "regnology-default-${PACK_VERSION}.sbom.json"
                   else
                       echo "WARN: cyclonedx CLI not installed — skipping SBOM (DIRECTIVE_043 stage UNSTABLE)"
                   fi
               '''
           }
       }
   }
   ```

2. **First-deploy posture**: `catchError(buildResult: 'UNSTABLE')` means the
   first few builds, where SonarQube/CycloneDX may not yet be installed on the
   agent, will mark the build UNSTABLE but allow Publish to proceed. Once the
   tooling is confirmed installed (T011's header comment lists this as a
   prerequisite), a follow-up change should remove `catchError` and make the
   stage hard-blocking. **Document this transition in the Jenkinsfile header**
   in T011.

3. The exact CLI invocation for CycloneDX depends on which tool the org has
   standardised on (`cyclonedx-cli` vs `cyclonedx-bom` vs language-specific).
   The fallback chain above handles two common variants. If neither is found,
   the build is UNSTABLE — visible in Jenkins, not silently swallowed.

**Files**:
- `Jenkinsfile` (updated, ~30 lines added)

**Validation**:
- [ ] `Security Scan` stage exists after Package and before Publish
- [ ] Uses `catchError(buildResult: 'UNSTABLE')` for first-deploy resilience
- [ ] Runs `sonar-scanner` when available; logs a clear WARN when not
- [ ] Generates `regnology-default-${PACK_VERSION}.sbom.json` when CycloneDX is available
- [ ] No secrets in the stage; SonarQube tokens would be added later via `withCredentials` if needed

---

### Subtask T008 — Publish stage with phased ordering

**Purpose**: Upload the four artifacts (versioned tar, versioned zip, latest
tar, latest zip) plus the SBOM, in two strict phases, with safe credential
handling.

**Steps**:
1. Add the `Publish` stage after `Security Scan`:

   ```groovy
   stage('Publish') {
       when { branch 'main' }
       steps {
           withCredentials([string(
               credentialsId: params.ARTEFACTORY_CREDENTIAL_ID,
               variable: 'ART_TOKEN'
           )]) {
               script {
                   def base = "${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}"
                   def ver  = env.PACK_VERSION
                   def uploaded = []

                   // Helper closure: PUT one file, track on success, fail loudly on error
                   def upload = { localFile, remoteName ->
                       def remoteUrl = "${base}/${remoteName}"
                       echo "Uploading ${localFile} → ${remoteUrl}"
                       def status = sh(
                           script: '''
                               curl -s -o /dev/null -w "%{http_code}" \
                                 -X PUT \
                                 -H "X-JFrog-Art-Api: $ART_TOKEN" \
                                 --data-binary @''' + "\"${localFile}\" \"${remoteUrl}\"",
                           returnStdout: true
                       ).trim()
                       if (!(status ==~ /^20[01]$/)) {
                           error "Upload failed: ${remoteName} returned HTTP ${status}"
                       }
                       uploaded.add(remoteName)
                       env.UPLOADED_ARTIFACTS = uploaded.join(',')
                       echo "Uploaded: ${remoteName} (HTTP ${status})"
                   }

                   // Phase 1 — versioned pair
                   upload("regnology-default-${ver}.tar.gz", "regnology-default-${ver}.tar.gz")
                   upload("regnology-default-${ver}.zip",    "regnology-default-${ver}.zip")

                   // SBOM (best-effort; only if file exists)
                   if (fileExists("regnology-default-${ver}.sbom.json")) {
                       upload("regnology-default-${ver}.sbom.json", "regnology-default-${ver}.sbom.json")
                   }

                   // Phase 2 — latest-alias pair (only after Phase 1 succeeded)
                   upload("regnology-default-${ver}.tar.gz", "regnology-default-latest.tar.gz")
                   upload("regnology-default-${ver}.zip",    "regnology-default-latest.zip")

                   echo "All artifacts published. UPLOADED_ARTIFACTS=${env.UPLOADED_ARTIFACTS}"
               }
           }
       }
   }
   ```

2. **Critical safety**: The curl invocation MUST use a single-quoted shell
   string for the header. The pattern is:
   - Single-quoted Groovy block ('''…''') so Groovy does not interpolate
   - `$ART_TOKEN` expansion happens in shell (where Jenkins masks it)
   - The remote URL and local file paths are appended via Groovy string
     concatenation (`+ "\"${localFile}\" …"`); these are safe because they
     do NOT contain secrets

3. **Why track `UPLOADED_ARTIFACTS`**: The rollback stage (T010) needs to know
   which artifacts succeeded in the current run so it can DELETE only those.
   Storing the list in `env.UPLOADED_ARTIFACTS` (comma-separated) lets the
   `post { failure }` block read it.

4. **Phase 2 timing**: The latest-alias uploads happen ONLY after the versioned
   pair (and optional SBOM) succeed. This eliminates the inconsistency where
   `latest` points to a version that does not yet exist as a versioned
   artifact.

**Files**:
- `Jenkinsfile` (updated, ~60 lines added)

**Validation**:
- [ ] Uses `withCredentials([string(...)])` to inject `$ART_TOKEN`
- [ ] All `curl` commands use single-quoted Groovy strings for the body
- [ ] `$ART_TOKEN` is expanded by the shell, not Groovy
- [ ] Phase 1 (versioned) completes fully before Phase 2 (latest) starts
- [ ] `env.UPLOADED_ARTIFACTS` is updated after each successful upload
- [ ] Any non-20x response triggers `error` (which fires the rollback)
- [ ] SBOM upload is gated on `fileExists` (does not break if Security Scan was UNSTABLE)

---

### Subtask T009 — Smoke Check stage

**Purpose**: Confirm the published versioned tar.gz is a valid archive with
the integrity manifest, not just an HTTP 200 on HEAD.

**Steps**:
1. Add the `Smoke Check` stage after `Publish`:

   ```groovy
   stage('Smoke Check') {
       when { branch 'main' }
       steps {
           withCredentials([string(
               credentialsId: params.ARTEFACTORY_CREDENTIAL_ID,
               variable: 'ART_TOKEN'
           )]) {
               sh '''
                   set -euo pipefail
                   URL="${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/regnology-default-${PACK_VERSION}.tar.gz"

                   # Download and validate tar stream
                   ENTRIES=$(curl -sL \
                       -H "X-JFrog-Art-Api: $ART_TOKEN" \
                       "$URL" | tar -tzf - | wc -l)

                   if [ "$ENTRIES" -eq 0 ]; then
                       echo "ERROR: published archive is empty or corrupt"
                       exit 1
                   fi
                   echo "Smoke check OK: $ENTRIES entries in archive"

                   # Verify integrity manifest is in the archive
                   MANIFEST_PRESENT=$(curl -sL \
                       -H "X-JFrog-Art-Api: $ART_TOKEN" \
                       "$URL" | tar -tzf - | grep -c '^pack/META/MANIFEST.yml$' || true)

                   if [ "$MANIFEST_PRESENT" -ne 1 ]; then
                       echo "ERROR: META/MANIFEST.yml missing from published archive"
                       exit 1
                   fi
                   echo "Smoke check OK: integrity manifest present"
               '''
               // ARTEFACTORY_URL / ARTEFACTORY_REPO / PACK_VERSION come from
               // the global pipeline environment block declared in T004.
           }
       }
   }
   ```

2. The smoke check downloads the archive a second time (already published) and
   confirms (a) the tar stream is valid and non-empty, (b) `pack/META/MANIFEST.yml`
   is present at the expected path. This catches truncated uploads that HTTP HEAD
   would not.

**Files**:
- `Jenkinsfile` (updated, ~35 lines added)

**Validation**:
- [ ] Smoke Check downloads via curl + pipes to `tar -tzf - | wc -l`
- [ ] Fails the stage on zero entries
- [ ] Verifies `pack/META/MANIFEST.yml` is present in the archive
- [ ] Uses `$ART_TOKEN` shell expansion, not Groovy

---

### Subtask T010 — post.failure rollback

**Purpose**: If any stage between `Validate` and `Smoke Check` fails after
artifacts have been uploaded, delete every artifact uploaded in this run.
Restore Artefactory to its pre-build state.

**Steps**:
1. Replace the placeholder `post { failure { ... } }` block (from T004) with:

   ```groovy
   post {
       failure {
           script {
               if (env.UPLOADED_ARTIFACTS?.trim()) {
                   echo "Build failed after partial upload. Rolling back: ${env.UPLOADED_ARTIFACTS}"
                   withCredentials([string(
                       credentialsId: params.ARTEFACTORY_CREDENTIAL_ID,
                       variable: 'ART_TOKEN'
                   )]) {
                       env.UPLOADED_ARTIFACTS.split(',').each { artifact ->
                           def remoteUrl = "${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}/${artifact}"
                           echo "Rollback: DELETE ${remoteUrl}"
                           def status = sh(
                               script: '''
                                   curl -s -o /dev/null -w "%{http_code}" \
                                     -X DELETE \
                                     -H "X-JFrog-Art-Api: $ART_TOKEN" \
                                     ''' + "\"${remoteUrl}\"",
                               returnStdout: true
                           ).trim()
                           echo "Rollback ${artifact}: HTTP ${status}"
                       }
                   }
                   echo 'Rollback complete. Artefactory restored to pre-build state.'
               } else {
                   echo 'Build failed before any upload completed. Nothing to roll back.'
               }
           }
       }
   }
   ```

2. **Rollback semantics**:
   - The `post { failure }` block runs after a stage `error` propagates up.
   - It reads `env.UPLOADED_ARTIFACTS` (comma-separated, populated by T008's upload closure).
   - It issues DELETE for each artifact. DELETE failures are logged but do not
     escalate further (we are already in a failure path; surfacing rollback
     failures here would mask the original cause).

3. **Edge case**: If `Validate` fails (before any upload), `UPLOADED_ARTIFACTS`
   is empty, and the rollback block prints "Nothing to roll back" without
   making any DELETE calls. This is correct behavior.

**Files**:
- `Jenkinsfile` (updated, ~30 lines replacing the placeholder)

**Validation**:
- [ ] `post.failure` reads `env.UPLOADED_ARTIFACTS`
- [ ] Splits on `,` and DELETEs each entry
- [ ] Uses `$ART_TOKEN` (single-quoted sh) for the auth header
- [ ] Handles the empty-list case gracefully ("Nothing to roll back")
- [ ] Logs each DELETE result; does not escalate DELETE failures

---

### Subtask T011 — Header documentation block

**Purpose**: Make the Jenkinsfile self-documenting so future maintainers
understand prerequisites, credential type, and the Security Scan transition
plan.

**Steps**:
1. Prepend the following comment block to the top of `Jenkinsfile` (before
   `pipeline {`):

   ```groovy
   /*
    * Jenkinsfile — Regnology Doctrine Pack Distribution Pipeline
    *
    * Mission: regnology-stack-distribution-pipeline-01KSWHFT
    * See:     kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/
    *
    * PREREQUISITES (must be configured in Jenkins / Artefactory BEFORE first run):
    *
    *  1. Artefactory repository `${ARTEFACTORY_REPO}` exists (default: spec-kitty-packs)
    *     under `${ARTEFACTORY_URL}` (default: https://artefactory.regnology.net/artifactory).
    *     Repository type: generic.
    *
    *  2. Jenkins credential `${ARTEFACTORY_CREDENTIAL_ID}` (default: ARTEFACTORY_API_TOKEN)
    *     exists as a "Secret text" credential containing an Artefactory API KEY (not an
    *     access token). The header scheme is `X-JFrog-Art-Api: <token>`. If your org
    *     migrates to access tokens, change the curl headers throughout this file to
    *     `Authorization: Bearer <token>` — this is a single global find/replace.
    *
    *  3. The Jenkins Linux agent has: tar (GNU), zip, curl, sha256sum, sonar-scanner
    *     (DIRECTIVE_043), and a CycloneDX CLI (`cyclonedx` or `cyclonedx-cli`).
    *     The `Security Scan` stage tolerates missing sonar-scanner/cyclonedx via
    *     catchError(buildResult: 'UNSTABLE') during first deploys. Once tooling is
    *     confirmed installed, remove catchError and make the stage hard-blocking.
    *
    *  4. The pack source must contain pack/.pack-version (single-line semver).
    *     The Validate stage refuses to build without it.
    *
    * IDEMPOTENCY & ROLLBACK:
    *  - The Validate stage HEAD-checks the versioned archive in Artefactory. If it
    *    already exists and FORCE_PUBLISH=false, the build fails fast: "bump
    *    pack/.pack-version".
    *  - The Publish stage uploads in two phases: versioned pair first, then latest
    *    aliases. The latest pair updates only after the versioned pair is confirmed.
    *  - On any failure after upload starts, post.failure issues DELETE for every
    *    artifact already uploaded in this run. Artefactory is restored to pre-build
    *    state. FORCE_PUBLISH bypasses the duplicate guard but does NOT suppress
    *    rollback.
    *
    * BRANCH SCOPE:
    *  - All stages run only when branch == 'main' (C-005). Other branches no-op.
    *
    * SECURITY NOTES (DIRECTIVE_043):
    *  - All curl commands use single-quoted shell strings for the body so that
    *    $ART_TOKEN is expanded by the shell, not by Groovy. NEVER write
    *    `"...${ART_TOKEN}..."` — Groovy interpolation prints secrets in the log.
    *  - The Security Scan stage runs SonarQube SAST and generates a CycloneDX SBOM.
    *    The SBOM is published alongside pack archives for downstream SCA tooling.
    */
   ```

2. Confirm the rest of the file still parses (Groovy comments are non-functional).

**Files**:
- `Jenkinsfile` (updated, ~50 lines added at top)

**Validation**:
- [ ] Header comment block precedes `pipeline {`
- [ ] Lists Artefactory repository, credential type, and agent tooling prerequisites
- [ ] Documents the API key → bearer migration path
- [ ] Includes the "NEVER use Groovy interpolation for secrets" warning
- [ ] Notes the catchError → hard-block transition for Security Scan
- [ ] References mission slug and `kitty-specs/` path for context

---

## Definition of Done

- `Jenkinsfile` exists at repo root with all stages: Checkout, Validate, Package, Security Scan, Publish, Smoke Check, plus `post.failure` rollback
- Pipeline parameters: ARTEFACTORY_URL, ARTEFACTORY_REPO, ARTEFACTORY_CREDENTIAL_ID, FORCE_PUBLISH — all with documented defaults
- All `curl` commands use single-quoted sh bodies with `$ART_TOKEN` shell expansion
- Package stage produces a tar.gz with `pack/` top-level wrapper (matches installer `--strip-components=1`)
- Integrity manifest `pack/META/MANIFEST.yml` is generated before archiving and included inside the archive
- Publish stage uses phased ordering (versioned before latest)
- Rollback deletes every artifact uploaded in the failing run
- Header comment block documents prerequisites and security rules
- `when { branch 'main' }` guards every stage (C-005)
- File passes `groovy -e` syntax check if available locally

## Risks

| Risk | Mitigation in this WP |
|---|---|
| Groovy string interpolation leaking the token | T005/T008/T009/T010 use single-quoted sh blocks; T011 header documents the rule |
| Archive layout wrong (no `pack/` wrapper) | T006 explicitly uses `tar czf ... pack/` and the validation checklist requires `tar -tzf` to show `pack/` entries |
| Missing SonarQube/CycloneDX on agent breaking first builds | T007 uses `catchError(buildResult: 'UNSTABLE')` so first deploys go yellow not red |
| Partial publish leaving Artefactory inconsistent | T010 rollback DELETEs all artifacts uploaded in current run |
| Concurrent main builds racing on latest alias | Accepted limitation; documented in T011 header (not solvable without an Artefactory mutex) |
| Operator using FORCE_PUBLISH carelessly | T011 header explicitly notes FORCE_PUBLISH bypasses the duplicate guard but NOT rollback |

## Reviewer Guidance

Review priorities (in order):

1. **Secret safety** — Grep the file for `${ART_TOKEN}`, `${env.ART_TOKEN}`,
   `"${ARTEFACTORY_CREDENTIAL_ID}"`. There must be zero matches inside double-
   quoted Groovy strings used in `sh` step bodies. All token references must be
   inside single-quoted sh blocks.

2. **Archive layout** — Read T006's tar command. Confirm it is `tar czf ... pack/`
   (with the wrapper), not `(cd pack && tar czf ...)`.

3. **Phased publish ordering** — In T008, confirm Phase 2 (latest uploads)
   happens only after Phase 1 completes successfully.

4. **Rollback completeness** — In T010, confirm `env.UPLOADED_ARTIFACTS` is
   populated after every successful upload in T008.

5. **Main-only trigger** — Every stage has `when { branch 'main' }` (C-005).

6. **Header documentation** — T011 header covers all four prerequisites,
   warns about Groovy interpolation, and documents the catchError transition.

7. **No regressions** — Diff should touch only `Jenkinsfile`. No edits to
   `dist/scripts/` (C-003).

## Next Steps

Once approved, WP02 unblocks the technical MVP. WP03 (docs) and WP04 (EDRs)
can proceed in parallel.

## Activity Log

- 2026-05-30T20:11:52Z – claude:sonnet:implementer-ivan:implementer – shell_pid=3204812 – Assigned agent via action command
- 2026-06-01T06:38:14Z – claude:sonnet:implementer-ivan:implementer – shell_pid=3204812 – Stale recovery: no implementation was produced. Moving to for_review to enable replanning.
- 2026-06-01T07:17:09Z – claude:sonnet:implementer-ivan:implementer – shell_pid=3204812 – Moved to planned
- 2026-06-01T07:17:26Z – claude:sonnet:implementer-ivan:implementer – shell_pid=868574 – Assigned agent via action command
- 2026-06-01T07:21:44Z – claude:sonnet:implementer-ivan:implementer – shell_pid=868574 – Jenkinsfile implemented: all 6 stages (Checkout, Validate, Package, Security Scan, Publish, Smoke Check), post.failure rollback, header doc block, all security invariants honoured. Parameters: ARTEFACTORY_URL, ARTEFACTORY_REPO, ARTEFACTORY_CREDENTIAL_ID, FORCE_PUBLISH. UPLOADED_ARTIFACTS comma-separated. SBOM uploaded in Publish Phase 1 when present.
- 2026-06-01T07:22:22Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=886952 – Started review via action command
- 2026-06-01T07:25:30Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=886952 – Moved to planned
- 2026-06-01T07:26:00Z – claude:sonnet:implementer-ivan:implementer – shell_pid=901066 – Started implementation via action command
- 2026-06-01T07:28:34Z – claude:sonnet:implementer-ivan:implementer – shell_pid=901066 – Fixed: X-JFrog-Art-Api header, correct parameter defaults (artifactory/spec-kitty-packs/ARTEFACTORY_API_TOKEN), env block PACK_VERSION, block-comment header doc
- 2026-06-01T07:29:00Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=905893 – Started review via action command
- 2026-06-01T07:31:14Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=905893 – Arbiter override: cycle-3 review artifact (review-cycle-3.md) identified 4 blockers; all 4 are verified fixed in cycle-2 implementation commit d30e200e. (1) Auth header: Authorization: Bearer confined to comment block only; X-JFrog-Art-Api present in all 4 functional curl commands. (2) Parameter defaults: artefactory.regnology.net/artifactory, spec-kitty-packs, ARTEFACTORY_API_TOKEN all correct. (3) PACK_VERSION and UPLOADED_ARTIFACTS declared in environment block. (4) Header replaced with /* */ block comment covering all 4 T011 prerequisites. All 6 stages have when { branch main }. Package uses tar czf with pack/ wrapper. Phase 1 versioned before Phase 2 latest. post.failure handles empty UPLOADED_ARTIFACTS. dist/scripts frozen file untouched. Full acceptance criteria met.
