# Issue Matrix: Dashboard Domain & Charter Governance

**Mission**: `dashboard-governance-config-01KST1YF`
**Source**: Post-merge review findings from mission `regnology-stack-distribution-pipeline-01KSWHFT` (#4)
**Last updated**: 2026-06-01

---

## Findings Carried Into This Mission

| Finding | Description | Severity | Verdict | Evidence Ref |
|---|---|---|---|---|
| F-001 | Jenkinsfile URL path duplication: double `spec-kitty-packs/` segment causes published archives to be unreachable by the installer (`dist/scripts/install-regnology-stack.sh` line ~143). `ARTEFACTORY_PATH` env var must be removed and 4 URL construction sites updated. | Critical (blocker) | fixed | [MIGRATION-2576](https://jira.regnology.net/browse/MIGRATION-2576) — fixed in WP07/T032, commit `7b40e2a6` |
| F-002 | Jenkinsfile Smoke Check stage missing `set +x` before curl credential reference — defence-in-depth gap vs the other 3 credential-using stages. | Minor | fixed | [MIGRATION-2577](https://jira.regnology.net/browse/MIGRATION-2577) — fixed in WP07/T033, commit `7b40e2a6` |
| F-003 | Jenkinsfile Package stage zip guard deviates from spec: hard-fail instead of `which zip \|\| apt-get install -y zip`. Will fail first run on any Jenkins agent without zip pre-installed. | Minor | fixed | [MIGRATION-2578](https://jira.regnology.net/browse/MIGRATION-2578) — fixed in WP07/T034, commit `7b40e2a6` |
| F-005 | Jenkinsfile Security Scan uses `${SONAR_TOKEN:-}` (empty-string fallback) and `catchError(buildResult: 'UNSTABLE')`. Must be hardened to `withCredentials` + hard gate once toolchain is confirmed on the Jenkins agent. | Informational | deferred-with-followup | [MIGRATION-2579](https://jira.regnology.net/browse/MIGRATION-2579) — T035 conditionally deferred per FR-018; pending toolchain confirmation on Jenkins agent |
| F-006 | Mission `regnology-stack-distribution-pipeline-01KSWHFT` was merged directly (schema v5/v6 event-log conflict workaround); no `spec-kitty accept` artifact or retrospective was written under `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/`. | Informational | fixed | [MIGRATION-2580](https://jira.regnology.net/browse/MIGRATION-2580) — retrospective created in WP07/T036, commit `7b40e2a6`; `.kittify/missions/01KSWHFTB563Q23BZG4WC5BGTR/retrospective.yaml` exists |

---

## Notes

- F-004 (WP03 reviewer commentary absent in cycle artifact) was assessed as informational with no corrective action. The HOW_TO_USE.md content meets all acceptance criteria on independent inspection. Not tracked.
- All findings above are carried into WP07 of this mission. When WP07 is approved and merged, update verdicts to `fixed` and reference the merge commit.
