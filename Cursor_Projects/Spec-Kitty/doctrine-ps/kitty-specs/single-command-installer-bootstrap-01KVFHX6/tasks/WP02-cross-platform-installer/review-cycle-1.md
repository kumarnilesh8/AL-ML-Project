# WP02 Review Feedback — Cycle 1

## Single blocking issue: Python version floor violates FR-004 / D-004

The spec requires **Python ≥ 3.12** (FR-004: "verifies Python ≥ 3.12 presence"; D-004: "Standardize on Python 3.12 baseline"). Both installers currently enforce **3.9+**, which would wrongly accept Python 3.9–3.11. The WP04 docs already state 3.12, so the scripts and docs are inconsistent.

### Required fixes (both scripts only — stay in WP02 scope: `dist/scripts/*`)

1. `dist/scripts/install-regnology-stack.sh`
   - Line ~525: change `sys.version_info >= (3, 9)` to `sys.version_info >= (3, 12)`.
   - Line ~533 (and any related message): change "Python 3.9+ is required" to "Python 3.12+ is required".
2. `dist/scripts/install-regnology-stack.ps1`
   - Line ~429: change the minor-version test from `-ge 9` to `-ge 12` (semantics: major==3 AND minor>=12, i.e. Python 3.12 or newer).
   - Line ~437 (and any related message): change "Python 3.9+ is required" to "Python 3.12+ is required".
3. Sweep BOTH scripts for any other "3.9" / "3, 9" references (comments, help text, install-target hints) and align them to 3.12. Confirm the auto-install paths (brew/apt/winget) target a Python that satisfies >=3.12 (e.g. `python@3.12` / `python3.12`); adjust only if they would install something < 3.12.

### Do NOT change anything else
All other WP02 behavior (preflight, integrity, injection/fallback, two-layer, idempotency, manifest) was already approved — leave it untouched.

### Re-verify before handoff
- `grep -nE '3\.9|3, 9' dist/scripts/install-regnology-stack.sh dist/scripts/install-regnology-stack.ps1` → no functional 3.9 floor remains.
- `bash -n dist/scripts/install-regnology-stack.sh` → exit 0.
- `pwsh -NoProfile -Command "$null=[System.Management.Automation.Language.Parser]::ParseFile('dist/scripts/install-regnology-stack.ps1',[ref]$null,[ref]$e); if($e){exit 1}"` → exit 0.
