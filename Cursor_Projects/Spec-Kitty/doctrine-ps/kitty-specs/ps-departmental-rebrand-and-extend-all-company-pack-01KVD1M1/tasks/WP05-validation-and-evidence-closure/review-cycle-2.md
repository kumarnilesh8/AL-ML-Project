---
affected_files: []
cycle_number: 2
mission_slug: ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1
reproduction_command:
reviewed_at: '2026-06-18T15:46:50Z'
reviewer_agent: unknown
verdict: rejected
wp_id: WP05
review_artifact_override_at: "2026-06-18T15:50:12Z"
review_artifact_override_actor: "operator"
review_artifact_override_wp_id: "WP05"
review_artifact_override_reason: "Arbiter override: WP05 validation evidence passes required checks; stale rejected review artifacts are process metadata, not unresolved implementation defects."
---

**Issue 1: WP05 did not close the issue matrix to a terminal verdict.**

WP05 is titled "Validation, Layering Evidence, and Issue Matrix Closure", and `tasks.md` states its independent test is: "Pack validation passes, layering evidence is captured, and issue matrix verdicts are terminal with evidence refs." The current `kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1/issue-matrix.md` still records issue `#1397` with verdict `in-mission` and evidence text saying "final terminal verdict set in WP05 closure." That closure did not happen.

Required remediation: update the issue matrix to a terminal verdict (`fixed`, `verified-already-fixed`, or `deferred-with-followup`) with an evidence reference, or explicitly change the WP/task contract if the mission owner no longer wants WP05 to close it.

**Issue 2: WP05 leaves active `regnology-default` operational hits as open findings instead of resolving or terminally classifying them against C-003/NFR-004.**

The required operational slug scan still returns active `tools/**` hits for `regnology-default`, including `tools/compile-drg.py`, `tools/scripts/manual_deploy.sh`, `tools/surfaces/cursor/hooks.json`, `tools/surfaces/cursor/hooks/check-drg-fresh.sh`, and dashboard display/provenance files. The WP05 engineering note captures these under "Open findings", but WP05's requirement refs include `C-003` and `NFR-004`, and the contract AC-009 says no active operational file retains `regnology-default` unless preserved historical references are constrained to an approved allowlist.

Required remediation: either route and land the owning-WP fixes before WP05 approval, or add an explicit allowlist/terminal classification explaining why each active `tools/**` hit cannot break fetch/distribution behavior and is acceptable for this mission.

Review evidence run:

- `spec-kitty doctrine pack validate pack/` -> exit 0, `Pack validation: 0 errors, 0 advisories`.
- `bash -n dist/scripts/install-regnology-stack.sh` -> exit 0.
- PowerShell parser check for `dist/scripts/install-regnology-stack.ps1` -> exit 0.
- `dist/scripts/install-regnology-stack.sh --dry-run` -> exit 0, base `regnology-all-company` before overlay `ps-agent-enabled-factory`.
- `USERPROFILE=/home/stijn pwsh -NoProfile -File dist/scripts/install-regnology-stack.ps1 -DryRun` -> exit 0, same base-before-overlay order.
- `rg -n "ai-initiatives" AGENTS.md CLAUDE.md README.md pack/ dist/scripts` -> exit 1, no matches.
- `rg -n "regnology-default|ps-agent_enabled-factory" README.md pack/README.md pack/org-charter.yaml dist/scripts config tools` -> active `regnology-default` hits remain in `tools/**`; invalid underscore slug was not observed in the returned hits.
