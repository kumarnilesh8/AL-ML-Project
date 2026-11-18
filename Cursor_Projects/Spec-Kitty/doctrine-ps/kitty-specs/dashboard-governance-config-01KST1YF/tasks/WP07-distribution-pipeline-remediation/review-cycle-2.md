---
affected_files: []
cycle_number: 2
mission_slug: dashboard-governance-config-01KST1YF
reproduction_command:
reviewed_at: '2026-06-01T10:34:03Z'
reviewer_agent: unknown
verdict: approved
wp_id: WP07
review_artifact_override_at: "2026-06-01T10:40:11Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP07"
review_artifact_override_reason: "Cycle-2 approved: agent linux label added at pipeline level (line 79), post.failure branch guard (env.BRANCH_NAME == main) with else no-op in place (lines 473-502), all cycle-1 fixes intact: ARTEFACTORY_PATH=0 hits, set+x=4 hits (Validate/Publish/Smoke Check/Rollback), apt-get install=1 hit in Package stage. Diff touches Jenkinsfile only."
---

---
review_cycle: 1
reviewer: claude:sonnet:reviewer-renata:reviewer
reviewed_at: 2026-06-01T12:40:00Z
verdict: rejected
wp_id: WP07
mission_slug: dashboard-governance-config-01KST1YF
source: live-jenkins-build-failure
build_branch: overhaul/migrate_to_kitty
jenkins_agent: frr-windowsagent-02-bis
---

# WP07 Review — Cycle 1 — REJECTED

## Verdict: REJECTED

Two blockers discovered from a live Jenkins build on branch `overhaul/migrate_to_kitty`
against Windows agent `frr-windowsagent-02-bis`. The original review passed the static
diff but did not exercise the pipeline against a real Jenkins environment. Live execution
surfaces two defects that must be fixed before WP07 can be approved.

---

## BLOCKER 1 — `agent any` dispatches to Windows agents; pipeline is Linux-only

**Finding:** The pipeline declares `agent any` at the pipeline level. When Jenkins
dispatched the build to `frr-windowsagent-02-bis` (a Windows agent), the build failed
with:

```
Cannot run program "sh" (in directory "C:\Jenkins\workspace\..."): CreateProcess error=2
```

The Jenkinsfile uses `sh`, `tar`, `sha256sum`, and `curl` throughout — it is Linux-only
by design. Without an explicit agent label, Jenkins may legitimately dispatch it to any
available agent including Windows nodes.

**Required fix:**

Change the top-level agent declaration from:

```groovy
agent any
```

to:

```groovy
agent { label 'linux' }
```

This is a one-line change at the pipeline level that prevents Windows agent dispatch
entirely, which is the correct resolution for a pipeline that has no Windows-compatible
execution path.

---

## BLOCKER 2 — `post { failure }` block runs unconditionally on all branches and fails on Windows

**Finding:** Declarative Pipeline `post { failure }` blocks do not support `when`
conditions. When the build was dispatched to the Windows agent on a non-main branch, all
6 stages correctly skipped (the `when { branch 'main' }` guards worked), but the
`post { failure }` rollback script ran unconditionally and failed because `sh` is not
available on Windows. This causes every non-main branch build to exit FAILED instead of
SUCCESS, masking real failures and blocking CI feedback.

**Required fix — wrap the `post { failure }` script body in a branch guard:**

```groovy
post {
    failure {
        script {
            if (env.BRANCH_NAME == 'main' && env.UPLOADED_ARTIFACTS?.trim()) {
                // ... existing rollback logic unchanged ...
            } else if (env.BRANCH_NAME != 'main') {
                echo 'Non-main branch — rollback not applicable'
            } else {
                echo 'Build failed before any upload completed. Nothing to roll back.'
            }
        }
    }
}
```

Note: If BLOCKER 1 (`agent { label 'linux' }`) is applied, Windows dispatch is prevented
and the `sh` failure no longer occurs. However, the branch guard is still required
independently because `post { failure }` running rollback logic on non-main branches
(even Linux agents) is incorrect behaviour — it would attempt to delete artifacts that
were never uploaded.

---

## INFORMATIONAL — `git whatchanged` deprecated in Git 2.53

**Finding:** The Jenkins git-client plugin calls `git whatchanged`, which is
deprecated/removed in Git 2.53 (the version installed on the agent). Build logs show
deprecation warnings from the git-client plugin.

**This is NOT a Jenkinsfile issue.** It is a Jenkins server/plugin issue and cannot be
fixed in the Jenkinsfile. However, the PREREQUISITES header comment should be updated to
note this dependency so operators are aware:

Add to the `/* PREREQUISITES: ... */` comment block at the top of the Jenkinsfile:

```
 *  Note: Jenkins git-client plugin must be compatible with the agent's git version.
 *        Git 2.53+ deprecates/removes 'git whatchanged'; downgrade the git-client
 *        plugin or upgrade to a version that supports git 2.53+ if this warning appears.
```

---

## Required Actions for Re-implementation

1. **BLOCKER**: Change `agent any` → `agent { label 'linux' }` at the pipeline level
2. **BLOCKER**: Wrap `post { failure }` script body in `if (env.BRANCH_NAME == 'main' && env.UPLOADED_ARTIFACTS?.trim())` guard (see exact code above)
3. **INFORMATIONAL**: Add git 2.53 plugin compatibility note to PREREQUISITES header comment

After these three changes are committed, re-run the pipeline on a non-main branch to
confirm:
- Build exits SUCCESS when all stages are skipped (non-main branch, no-op run)
- `post { failure }` does not execute rollback on non-main branch builds

---

## Evidence

- Live build on branch `overhaul/migrate_to_kitty`, Jenkins agent `frr-windowsagent-02-bis`
- Exit code: FAILURE
- Failure message: `Cannot run program "sh" (in directory "C:\Jenkins\workspace\..."): CreateProcess error=2`
- All 6 pipeline stages: SKIPPED (correct — `when { branch 'main' }` guards work)
- `post { failure }`: EXECUTED unconditionally (incorrect)
