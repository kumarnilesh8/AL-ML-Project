<!--
+----------------------------------------------------+
| REGNOLOGY                                          |
| Professional Services                              |
| professional_services@regnology.net                |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
FOR INTERNAL USE ONLY
-->

# Engineering Note: Surface Preservation Readiness - 2026-06-18

_Version: 1.0.0_
_Date: 2026-06-18_
_Status: Ready for review_
_Audience: Doctrine pack maintainers and release reviewers_

---

## Context

WP04 for mission `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`
removes generated `.cursor/` and `.claude/` harness outputs from the versioned
distribution. Before those surfaces were untracked, the authored repository-specific
canon was preserved under `tools/surfaces/`.

This keeps generated IDE and agent output out of the pack distribution while retaining
the source material needed to reconstruct shared harness behavior.

## Readiness Evidence

The repository-specific Cursor hook configuration is preserved in
`tools/surfaces/cursor/hooks.json`. The canonical hook now invokes the relocated
script path under `tools/surfaces/cursor/hooks/`, so the tracked source remains
usable without depending on ignored generated output.

The DRG freshness advisory hook script is preserved in
`tools/surfaces/cursor/hooks/check-drg-fresh.sh` with executable intent retained
in git. A dry-run with no staged DRG fragment change returns the same continue
outcome expected from the original hook.

The Claude shared settings baseline is preserved in
`tools/surfaces/claude/settings.json`. Machine-local Claude and Cursor overrides
remain ignored by `.gitignore`.

The inventory entry for `.claude/CLAUDE.md` was reviewed. That file is not present
in this lane, so no additional reference copy was created. Equivalent canonical
guidance remains reachable from the tracked root guidance files and pack governance
sources.

## Decision

Generated `.cursor/` and `.claude/` directories are removed from the git index after
the authored candidates were relocated and verified. Future shared harness canon
should be updated under `tools/surfaces/`; generated IDE and agent surfaces should
remain ignored.
