<!--
+----------------------------------------------------+
| REGNOLOGY                                          |
| Professional Services                              |
| professional_services@regnology.net                |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
FOR INTERNAL USE ONLY
-->

# Engineering Note: PS Pack Validation Evidence - 2026-06-18

_Version: 1.1.0_
_Date: 2026-06-18_
_Status: SUPERSEDED IN PART (2026-06-19): standalone figure corrected; layered validation is authoritative_
_Audience: Doctrine pack maintainers and release reviewers_

---

## Update — 2026-06-19: Validation figure corrected (standalone vs. layered)

> This section supersedes the standalone validation result recorded on 2026-06-18.
> The original content below is retained unedited for traceability.

Since 2026-06-18 the overlay pack was slimmed: artefacts shared with the
all-company baseline were promoted to the parent `regnology-all-company` layer.
As a result, the earlier claim that `spec-kitty doctrine pack validate pack/`
reports "0 errors, 0 advisories" is **no longer accurate** and is misleading if
read in isolation.

### Corrected validation results

| Validation mode | Command | Result |
| --- | --- | --- |
| Standalone overlay (NOT authoritative) | `spec-kitty doctrine pack validate pack/` | 144 dangling-edge errors — cross-layer references, **by design** |
| Layered / assembled (AUTHORITATIVE) | assemble base 1.0.0 + overlay, then validate the merged tree | 0 errors, 0 advisories, 0 conflicts |

The 144 standalone errors are expected: they are cross-layer DRG references to
artefacts that now live in the parent layer. They are not a regression and are
not a failure of this pack.

### Why standalone validation dangles

- The overlay `extends: regnology-all-company` and is intentionally incomplete on
  its own; promoted artefacts (toolguides, paradigms, styleguides, tactics,
  procedures) resolve only when the parent is mounted.
- `tools/compile-drg.py` is now parent-aware (`--base-pack PATH` arg /
  `BASE_PACK_DIR` env var). With the parent mounted, cross-layer DRG edges carry
  their TRUE kind instead of a `directive:` fallback, so the assembled graph
  validates clean.

### Authoritative layered sequence

```
python3 tools/compile-drg.py --base-pack <base-pack>/pack
spec-kitty doctrine pack assemble /tmp/assembled <base-pack>/pack pack --conflicts-out /tmp/conflicts.json
spec-kitty doctrine pack validate /tmp/assembled   # => 0 errors, 0 advisories, 0 conflicts
```

### Correct local checks

- `make validate-layered` — assembles parent + overlay and validates the merged
  tree (obtains the parent via `BASE_PACK_DIR`).
- `tools/triage-drg-dangles.py` — distinguishes acceptable cross-layer dangles
  from genuine defects.

The parent base pack version is pinned in `config/release-map.yaml`
(`base_pack_version: "1.0.0"`); its source is
`ssh://git@bitbucket.regnology.net:7999/rfg/skills.git` (pack root `pack/`).

---

## Context

WP05 for mission `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`
captures final validation and layering evidence for the Professional Services
departmental pack rebrand.

This note is the tracked reviewer handoff for subtasks T016, T017, and T018. The
WP-owned surface is `docs/engineering_notes/**`, so functional fixes for findings
outside that surface remain with the owning work package or reviewer follow-up.

## Validation Command Evidence

> Note: the standalone "Pack schema validation" figure below is superseded — see
> the 2026-06-19 correction at the top of this note. Standalone validation now
> reports 144 cross-layer dangling-edge errors by design; the authoritative
> result is the layered/assembled validation (0 errors). The rows below are
> retained unedited for historical traceability.

The quickstart validation suite was run from the WP05 lane workspace.

| Check | Command | Result |
| --- | --- | --- |
| Pack schema validation | `spec-kitty doctrine pack validate pack/` | Passed: `Pack validation: 0 errors, 0 advisories` |
| Shell installer syntax | `bash -n dist/scripts/install-regnology-stack.sh` | Passed with no output |
| PowerShell installer syntax | `pwsh -NoProfile -Command "[void][System.Management.Automation.Language.Parser]::ParseFile('dist/scripts/install-regnology-stack.ps1',[ref]$null,[ref]$null)"` | Passed with no output |
| Old slug and invalid underscore slug in active surfaces | `rg -n "regnology-default|ps-agent_enabled-factory" README.md pack/README.md pack/org-charter.yaml dist/scripts config tools` | Findings remain; see residual reference matrix |
| Old slug in engineering notes and specs | `rg -n "regnology-default" docs/engineering_notes kitty-specs` | Findings remain; see residual reference matrix |
| `ai-initiatives` references | `rg -n "ai-initiatives" AGENTS.md CLAUDE.md README.md pack/ dist/scripts` | Passed: no matches |

## Installer Layering Evidence

The installer dry-run evidence confirms base-then-overlay ordering.

| Check | Result |
| --- | --- |
| Shell dry-run | `dist/scripts/install-regnology-stack.sh --dry-run` passed. It installs `regnology-all-company` as layer 1/2, then `ps-agent-enabled-factory` as layer 2/2, and prints `spec-kitty doctrine fetch --pack regnology-all-company` before `spec-kitty doctrine fetch --pack ps-agent-enabled-factory`. |
| PowerShell dry-run | Initial Linux run failed because `$env:USERPROFILE` was unset. Re-run with `USERPROFILE=/home/stijn pwsh -NoProfile -File dist/scripts/install-regnology-stack.ps1 -DryRun` passed with the same layer order and fetch order. |
| README and installer ordering text | `rg -n "regnology-all-company|ps-agent-enabled-factory|doctrine fetch|dry-run|DRY" dist/scripts README.md pack/README.md` shows the shell script, PowerShell script, `dist/scripts/README.md`, root `README.md`, and `pack/README.md` all describe `regnology-all-company` before `ps-agent-enabled-factory`. |

## Layering Semantics Evidence

| Check | Command | Result |
| --- | --- | --- |
| Charter extends key | `rg -n "^extends:\s+regnology-all-company$" pack/org-charter.yaml` | Passed: `extends: regnology-all-company` is present |
| Additive and non-relaxing wording | `rg -n "additive|non-relaxing|extends" pack/org-charter.yaml README.md pack/README.md` | Passed: wording exists in the charter comments, root README, and pack README |

The charter and README wording describes the PS layer as cumulative: it extends
the all-company baseline and adds PS-specific directives without weakening,
relaxing, or bypassing the upstream doctrine.

## Residual Reference Matrix

The invalid underscore slug `ps-agent_enabled-factory` was not found in the scoped
operational search.

The old slug `regnology-default` remains in the scoped operational search:

| Surface | Count | Review classification |
| --- | ---: | --- |
| `tools/compile-drg.py` | 6 | Active tooling reference; outside WP05 ownership |
| `tools/scripts/manual_deploy.sh` | 9 | Active tooling reference; outside WP05 ownership |
| `tools/surfaces/cursor/hooks.json` | 1 | Preserved harness-source reference to the compiled DRG graph name |
| `tools/surfaces/cursor/hooks/check-drg-fresh.sh` | 4 | Preserved harness-source reference to the compiled DRG graph name |
| `tools/pack-dashboard/server/src/services/provenance.service.ts` | 1 | Dashboard provenance layer label; outside WP05 ownership |
| `tools/pack-dashboard/src/app/layout/sidebar.component.ts` | 1 | Dashboard display label; outside WP05 ownership |
| `tools/pack-dashboard/src/app/layout/footer.component.ts` | 1 | Dashboard display label; outside WP05 ownership |

Historical and mission-planning references also remain under `docs/engineering_notes`
and `kitty-specs`. The counted search returned 114 matches across prior engineering
notes, older mission specs, this mission's planning artifacts, occurrence map,
contracts, review notes, and unrelated historical missions. These are evidence and
planning records rather than direct installer execution paths, but reviewers should
decide whether this mission's own contract and quickstart should retain historical
old-slug references for traceability.

## Review Handoff

Passing evidence:

- Pack validation reports zero errors and zero advisories.
- Shell and PowerShell parser checks pass.
- Shell and PowerShell installer dry-runs confirm all-company base before PS overlay.
- `extends: regnology-all-company` is present in `pack/org-charter.yaml`.
- Additive and non-relaxing layering wording is present in charter and README surfaces.
- No `ai-initiatives` references remain in the scoped active surfaces.
- No invalid `ps-agent_enabled-factory` slug remains in the scoped operational search.

Open findings:

- `regnology-default` remains in active `tools/**` surfaces outside WP05 ownership.
- The first PowerShell dry-run on Linux fails if `USERPROFILE` is unset; setting
  `USERPROFILE` allows the dry-run to pass. Reviewers should decide whether that
  Linux-hosted PowerShell default-path behavior is in scope for WP02 or a follow-up.
