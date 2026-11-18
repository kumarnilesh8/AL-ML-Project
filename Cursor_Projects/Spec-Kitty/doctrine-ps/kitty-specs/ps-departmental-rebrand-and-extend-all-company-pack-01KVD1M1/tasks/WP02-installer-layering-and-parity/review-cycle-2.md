---
affected_files: []
cycle_number: 2
mission_slug: ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1
reproduction_command:
reviewed_at: '2026-06-18T14:34:19Z'
reviewer_agent: unknown
verdict: rejected
wp_id: WP02
---

**Issue 1: PowerShell parser check was not executed.**

WP02 requires confirming that `dist/scripts/install-regnology-stack.ps1` passes a PowerShell parser check. The review lane does not have `pwsh` on PATH, so the required parser check could not be executed:

```text
pwsh not found
```

Required remediation: install or provide PowerShell (`pwsh`) in the review/implementation environment and capture a passing parser check, for example:

```bash
pwsh -NoProfile -Command '$null = [System.Management.Automation.Language.Parser]::ParseFile("dist/scripts/install-regnology-stack.ps1", [ref]$null, [ref]$errors); if ($errors.Count) { $errors | ForEach-Object { $_.ToString() }; exit 1 } else { "PowerShell parser: PASS" }'
```

**Issue 2: Required charter context selectors are unavailable.**

The review prompt requires running these charter context checks, but the lane returns missing-selector errors:

```text
spec-kitty charter context --include section:terminology-canon
Error: No charter section found for selector 'section:terminology-canon'.

spec-kitty charter context --include section:code-review-checklist
Error: No charter section found for selector 'section:code-review-checklist'.

spec-kitty charter context --include section:regression-vigilance
Error: No charter section found for selector 'section:regression-vigilance'.
```

Required remediation: restore or regenerate the mission/charter context so those selectors resolve, or update the review prompt/charter contract to the valid selector names, then rerun the three commands and capture their outputs.

**Issue 3: `dist/scripts/README.md` still documents the old single-pack installer flow.**

`dist/scripts/README.md` is under WP02's authoritative surface (`dist/scripts/`) and still tells users that the installer downloads `regnology-default`, extracts it to `packs/regnology-default/`, and runs `spec-kitty doctrine fetch --pack regnology-default`. That conflicts with FR-007 and NFR-004 for the installer distribution surface, where the active flow must be `regnology-all-company` base first and `ps-agent-enabled-factory` overlay second.

Required remediation: update `dist/scripts/README.md` to document both pack layers, both archive coordinates, the installed directory layout for both packs, the new environment variables if they are user-facing, and the two fetch commands in base-then-overlay order.
