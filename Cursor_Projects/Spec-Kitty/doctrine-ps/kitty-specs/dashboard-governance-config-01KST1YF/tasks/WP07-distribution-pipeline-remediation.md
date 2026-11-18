---
work_package_id: WP07
title: Distribution Pipeline Remediation
dependencies: []
requirement_refs:
- FR-015
- FR-016
- FR-017
- FR-018
- FR-019
tracker_refs:
- MIGRATION-2576
- MIGRATION-2577
- MIGRATION-2578
- MIGRATION-2579
- MIGRATION-2580
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-dashboard-governance-config-01KST1YF
base_commit: e6b54a74bd6defbe1e0b5b206dac07334d2dff9d
created_at: '2026-06-01T10:24:50.355673+00:00'
subtasks:
- T032
- T033
- T034
- T035
- T036
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "1076493"
history: []
agent_profile: devops-danny
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
/ad-hoc-profile-load devops-danny
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Fix five findings from the post-merge review of mission
`regnology-stack-distribution-pipeline-01KSWHFT`. The blocker (T032 / FR-015) MUST be
fixed before the pipeline is ever pointed at a live Artefactory instance — the current
`Jenkinsfile` publishes to a double-segment URL path that the installer cannot download
from. T033 and T034 are hardening fixes. T035 and T036 are conditional/process tasks.

## Branch Strategy

- Planning base branch: `overhaul/migrate_to_kitty`
- Merge target: `overhaul/migrate_to_kitty`
- Work in the worktree assigned to this WP's lane by `spec-kitty agent action implement WP07 --agent <name>`

## Context

### The Jenkinsfile (current state)

`Jenkinsfile` at repo root — 506 lines, declarative pipeline. Key stages:

```
Checkout → Validate → Package → Security Scan → Publish → Smoke Check
                                                              └─ post.failure → Rollback
```

Six stages, all guarded by `when { branch 'main' }`. Pipeline parameters:
- `ARTEFACTORY_URL` (default: `https://artefactory.regnology.net/artifactory`)
- `ARTEFACTORY_REPO` (default: `spec-kitty-packs`)
- `ARTEFACTORY_CREDENTIAL_ID` (default: `ARTEFACTORY_API_TOKEN`)
- `FORCE_PUBLISH` (default: `false`)

**Security invariant (never violate):** All `curl` commands that reference `$ART_TOKEN`
MUST use single-quoted Groovy `sh '''...'''` blocks so `$ART_TOKEN` expands in the shell,
not in Groovy. Never write `"${env.ART_TOKEN}"` or `"${ART_TOKEN}"` in a double-quoted
Groovy string passed to `sh`.

### The installer contract (for T032 context)

`dist/scripts/install-regnology-stack.sh` line ~143 constructs the download URL as:

```bash
${ARTEFACTORY_URL}/spec-kitty-packs/${PACK_ARCHIVE_NAME}
# e.g. https://artefactory.regnology.net/artifactory/spec-kitty-packs/regnology-default-1.0.0.tar.gz
```

The Jenkinsfile must publish to the same single-segment path.

---

## Subtask Guidance

### T032 — Remove ARTEFACTORY_PATH; fix 4 URL construction sites (FR-015) [BLOCKER]

**Finding reference:** F-001 / [MIGRATION-2576](https://jira.regnology.net/browse/MIGRATION-2576)

**Problem:**

The `environment {}` block contains:
```groovy
ARTEFACTORY_PATH = 'spec-kitty-packs'
```
Every URL construction in the pipeline appends `/${env.ARTEFACTORY_PATH}/${filename}` after
`${params.ARTEFACTORY_REPO}`, producing a double `spec-kitty-packs/` segment:

```
.../artifactory/spec-kitty-packs/spec-kitty-packs/regnology-default-1.0.0.tar.gz
```

The installer downloads from a single-segment path. The archives are unreachable.

**Fix:**

1. Remove the `ARTEFACTORY_PATH = 'spec-kitty-packs'` line from the `environment {}` block.
2. Find all 4 URL construction sites (use `grep -n "ARTEFACTORY_PATH" Jenkinsfile`).
3. Replace each URL pattern from:
   ```groovy
   "${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}/${env.ARTEFACTORY_PATH}/${filename}"
   ```
   to:
   ```groovy
   "${params.ARTEFACTORY_URL}/${params.ARTEFACTORY_REPO}/${filename}"
   ```
4. Affected locations: Validate stage (duplicate-version HEAD check), Publish stage
   (upload helper closure), Smoke Check stage (download URL), post.failure rollback
   (DELETE URL construction).

**Validation:**
- [ ] `grep -n "ARTEFACTORY_PATH" Jenkinsfile` returns zero hits
- [ ] Constructing the default URL gives exactly:
  `https://artefactory.regnology.net/artifactory/spec-kitty-packs/regnology-default-<ver>.tar.gz`
- [ ] The rollback DELETE uses the same corrected path

---

### T033 — Add `set +x` to Smoke Check curl (FR-016) [MUST — parallel with T034]

**Finding reference:** F-002 / [MIGRATION-2577](https://jira.regnology.net/browse/MIGRATION-2577)

**Problem:** The Smoke Check `sh` block opens with `set -eu` but omits `set +x` before the
`curl` command that uses `$ART_TOKEN`. With shell trace mode active, Jenkins logs every
executed command including the expanded `$ART_TOKEN` value in plaintext — a credential
leak visible to any developer with log read access. The Validate, Publish, and Rollback
stages all include `set +x` for this reason; the Smoke Check is the only stage missing it.
This is classified as **Must** (not Should) because it is a credential leak, not a
hardening suggestion.

**Fix:** Add `set +x` as the second line inside the Smoke Check `sh '''...'''` block,
immediately after `set -eu`:

```groovy
sh '''
    set -eu
    set +x
    URL="${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/regnology-default-${PACK_VERSION}.tar.gz"
    ...
```

**Validation:**
- [ ] `grep -n "set +x" Jenkinsfile` returns hits in Validate, Publish, Smoke Check,
  and Rollback stages (all 4 credential-using stages)

---

### T034 — Restore `apt-get` zip guard or document deviation (FR-017) [parallel with T033]

**Finding reference:** F-003 / [MIGRATION-2578](https://jira.regnology.net/browse/MIGRATION-2578)

**Problem:** The plan (`plan.md`) and WP02 T006 spec both specify:
```bash
which zip >/dev/null 2>&1 || (apt-get update && apt-get install -y zip)
```
The implementation instead hard-fails if `zip` is absent. This deviates from the spec
and will fail the first pipeline run on any Jenkins agent without `zip` pre-installed.

**Fix (preferred):** Replace the hard-fail guard in the Package stage with:
```bash
which zip >/dev/null 2>&1 || (apt-get update && apt-get install -y zip)
```

**Alternative (if intentionally keeping hard-fail):** If the team prefers fail-fast over
self-healing (to avoid silent `apt-get` side effects), document this in the Jenkinsfile
header (`/* ... */` block) under PREREQUISITES, add a line:
```
 *  3. [...] The zip utility must be pre-installed on the agent. The pipeline
 *     does NOT auto-install it (fail-fast by design; see plan.md deviation note).
```
And update `plan.md` to note the decision.

**Validation:**
- [ ] Either `grep -n "apt-get install" Jenkinsfile` returns a hit in the Package stage,
  **or** the Jenkinsfile header PREREQUISITES section explicitly documents that `zip`
  must be pre-installed and `plan.md` notes the deviation.

---

### T035 — Harden Security Scan credentials (FR-018) [conditional — do AFTER toolchain confirmed]

**Finding reference:** F-005 / [MIGRATION-2579](https://jira.regnology.net/browse/MIGRATION-2579)

**Trigger condition:** Only perform T035 once BOTH of the following are confirmed on the
Jenkins agent:
1. `sonar-scanner` is installed and reachable
2. A `cyclonedx` or `cyclonedx-cli` binary is available

Until then, the `catchError(buildResult: 'UNSTABLE')` wrapper is intentional
first-deploy resilience and should NOT be removed early.

**When the trigger condition is met:**

1. Replace `${SONAR_TOKEN:-}` with a proper `withCredentials` binding:
```groovy
withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
    sh '''
        set -euo pipefail
        set +x
        sonar-scanner -Dsonar.projectKey=regnology-doctrine-pack \
                      -Dsonar.sources=pack \
                      -Dsonar.login="$SONAR_TOKEN"
    '''
}
```
2. Remove the outer `catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE')` wrapper.
3. Update the header comment to remove the "catchError transition plan" paragraph (it will
   have been executed).

**If the trigger condition has NOT been met, skip T035 and note it in the handoff.**

**Validation (when executed):**
- [ ] `grep -n "catchError" Jenkinsfile` returns zero hits in Security Scan stage
- [ ] `grep -n "SONAR_TOKEN:-" Jenkinsfile` returns zero hits
- [ ] `grep -n "withCredentials" Jenkinsfile` includes a hit in the Security Scan stage

---

### T036 — Author retrospective for mission #4 (FR-019) [parallel with T033/T034]

**Finding reference:** F-006 / [MIGRATION-2580](https://jira.regnology.net/browse/MIGRATION-2580)

**Problem:** Mission `regnology-stack-distribution-pipeline-01KSWHFT` (ID
`01KSWHFTB563Q23BZG4WC5BGTR`) was merged directly without going through the formal
`spec-kitty accept` / `spec-kitty merge` workflow, so no retrospective artifact was
written under `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/`.

**Steps (run from the main repo root, not a worktree):**

```bash
# 1. Author the retrospective
spec-kitty retrospect create --mission regnology-stack-distribution-pipeline-01KSWHFT

# 2. Verify the file was created
cat .kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml

# 3. Run cross-mission aggregation (read-only, does not author)
spec-kitty retrospect summary

# 4. Inspect proposals (dry-run by default)
spec-kitty agent retrospect synthesize --mission regnology-stack-distribution-pipeline-01KSWHFT
```

**Commit the retrospective artifact:**
```bash
git add .kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/
git commit -m "chore: author retrospective for regnology-stack-distribution-pipeline-01KSWHFT (mission #4)"
```

**Validation:**
- [ ] `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml` exists
- [ ] `spec-kitty retrospect summary` exits 0 and includes mission #4 in output

---

## Definition of Done

- [ ] T032: `grep -n "ARTEFACTORY_PATH" Jenkinsfile` returns zero hits; all 4 URL
  construction sites use `${params.ARTEFACTORY_REPO}/${filename}` only
- [ ] T033: All 4 credential-using stages have `set +x` before the first `curl` call
- [ ] T034: Package stage has the `apt-get` self-healing guard, **or** Jenkinsfile header
  and plan.md document the hard-fail deviation explicitly
- [ ] T035: Either executed (all `catchError` removed, `withCredentials` added) and noted
  in handoff, or explicitly deferred with note "toolchain not yet confirmed on agent"
- [ ] T036: `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml` exists
  and is committed; `spec-kitty retrospect summary` runs clean
- [ ] No changes outside `Jenkinsfile`, `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/`,
  and `plan.md` (T034 deviation note only if applicable)

## Risks

| Risk | Mitigation |
|---|---|
| T032 grep misses a URL site | After fix, search for `ARTEFACTORY_PATH` and also for the old double-segment pattern `${params.ARTEFACTORY_REPO}/${env.ARTEFACTORY_PATH}` |
| T035 executed prematurely before toolchain is confirmed | Task explicitly gated — skip if trigger condition not met; note in handoff |
| T036 `retrospect create` fails (older spec-kitty version) | Check for `RetrospectiveCaptureFailed` events in `status.events.jsonl`; escalate to team lead if command errors |

## Reviewer Guidance

1. **T032 (blocker)** — Verify no `ARTEFACTORY_PATH` in `Jenkinsfile`. Construct the
   full default URL mentally: `https://artefactory.regnology.net/artifactory/spec-kitty-packs/regnology-default-1.0.0.tar.gz` — confirm it matches the installer's download pattern in `dist/scripts/install-regnology-stack.sh` line ~143.
2. **T033** — `grep -n "set +x" Jenkinsfile` must return 4 hits (one per credential-using stage).
3. **T034** — Either the `apt-get` guard is present, or BOTH Jenkinsfile header and `plan.md` document the deviation. One without the other is a reject.
4. **T035** — Accept "deferred — toolchain not confirmed" as a valid outcome. Reject only if there is no handoff note about T035 at all.
5. **T036** — Verify the retrospective file exists at `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml`.
6. **Scope** — Diff must touch only `Jenkinsfile`, `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/`, and optionally `plan.md`. Any other file changes are out of scope.

## Activity Log

- 2026-06-01T10:24:51Z – claude:sonnet:devops-danny:implementer – shell_pid=1022826 – Assigned agent via action command
- 2026-06-01T10:28:06Z – claude:sonnet:devops-danny:implementer – shell_pid=1022826 – T032: ARTEFACTORY_PATH removed from environment block; all 4 URL construction sites (Validate, Publish, Smoke Check, Rollback-via-UPLOADED_ARTIFACTS) fixed to single-segment path matching installer contract. T033: set+x added to Smoke Check sh block — all 4 credential-using stages now suppress shell trace before curl. T034: Hard-fail zip guard replaced with apt-get self-healing guard (which zip || apt-get install -y zip) per plan.md WP02/T006 spec. T035: Deferred — sonar-scanner and cyclonedx/cyclonedx-cli not confirmed on agent; catchError wrapper retained as first-deploy resilience. T036: Retrospective created at .kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml (auto-committed by spec-kitty); findings: 2 helpful, 9 not_helpful, 2 gaps.
- 2026-06-01T10:28:44Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041125 – Started review via action command
- 2026-06-01T10:31:00Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041125 – Review passed: T032 ARTEFACTORY_PATH fully removed (0 hits), all 4 URL sites use single-segment path; T033 set+x present in all 4 credential stages (Validate/Publish/Smoke Check/Rollback); T034 apt-get self-healing zip guard restored at line 263; T035 explicitly deferred with header note (catchError retained, toolchain unconfirmed); T036 retrospective.yaml exists at .kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml committed on merge target. Scope clean — diff touches only Jenkinsfile.
- 2026-06-01T10:34:03Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1041125 – Moved to planned
- 2026-06-01T10:36:56Z – claude:sonnet:devops-danny:implementer – shell_pid=1064048 – Started implementation via action command
- 2026-06-01T10:38:44Z – claude:sonnet:devops-danny:implementer – shell_pid=1064048 – Cycle 2: agent label 'linux' added, post.failure wrapped in BRANCH_NAME==main guard, git-whatchanged note added to header
- 2026-06-01T10:39:08Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1076493 – Started review via action command
- 2026-06-01T10:40:11Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=1076493 – Cycle-2 approved: agent linux label added at pipeline level (line 79), post.failure branch guard (env.BRANCH_NAME == main) with else no-op in place (lines 473-502), all cycle-1 fixes intact: ARTEFACTORY_PATH=0 hits, set+x=4 hits (Validate/Publish/Smoke Check/Rollback), apt-get install=1 hit in Package stage. Diff touches Jenkinsfile only.
