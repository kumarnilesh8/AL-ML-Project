<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██                                              |
|████                                                |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Set up Spec Kitty + the Regnology Doctrine on Windows

> **How to use this document.** Give it to your Cursor agent — either paste the whole thing
> into the Cursor chat, or attach it and say: *"Read and act upon these instructions."* Then
> stay nearby and answer the occasional plain-English question. You do not need to know
> Python, Git, or the command line. On **macOS, Linux, or Windows+WSL**, use the unified
> guide:
> [Unix (macOS · Linux · WSL)](https://artifactory.regnology.net/artifactory/raf-generic-local/kb/INTERNAL_KITTY_UNIX_INSTALL_GUIDE.md).
> **WSL2 users:** do **not** use this PowerShell guide — follow the Unix guide inside WSL bash.
>
> **CLI only (human, PowerShell):** with the Regnology VPN connected — uninstall any legacy
> open-source package first, then install the Regnology CLI:
> ```powershell
> python -m pip uninstall -y spec-kitty-cli 2>$null
> python -m pip install --user --upgrade "regnology-spec-kitty-cli" `
>   --index-url "https://artifactory.regnology.net/artifactory/api/pypi/raf-spec-kitty-python/simple" `
>   --extra-index-url "https://pypi.org/simple"
> ```

---

## Who reads what

| Audience | What to read |
|---|---|
| **You (human)** | The callout above, any line marked **Ask the user**, Step 6, and **Troubleshooting** if setup fails |
| **Cursor agent** | **Agent instructions** below through Step 6 — execute in order |

---

> **Agent instructions** — read all of the following before acting, then execute the steps in
> order.

You are setting up a non-technical Regnology colleague on a *managed corporate Windows 10/11
laptop*, working in **PowerShell**. Your goal state, which you will confirm in the final
summary, is:

- The **Spec Kitty** CLI installed and callable in any terminal.
- Their **project folder** at `C:\code` initialised as a Git repository.
- The **Regnology doctrine pack** (`RAF/doctrine-org`) wired into the project.
- A short **pass/fail summary + next steps** delivered to the user.

Operating rules for the whole run:

- **Everything internal (Artifactory, Bitbucket) requires the Regnology VPN.** If a step that
  reaches an internal host fails, treat it as a possible VPN/connectivity problem first — stop
  and re-check the VPN with the user (Step 0b). **Never** silently fall through to a public
  source to "route around" a connectivity failure. The Spec Kitty package lives only on
  Artifactory (`regnology-spec-kitty-cli`) — public PyPI is not a substitute for it.
- Corporate security policy (**Intune / AzureAD application control**) commonly blocks
  execution of `.exe` files in user-writable folders — expect the `spec-kitty.exe` launcher to
  be blocked and use the Python-launcher workaround as the **primary** verify path. Every known
  blocker has a fix in **Troubleshooting** — when a step fails for that reason, jump there
  rather than stopping.
- All installs are **per-user** — do **not** attempt system-wide / all-users installs; the
  user almost certainly has no admin rights.
- **Use `C:\code` as the workspace root** — on Regnology laptops `$HOME` / `$env:USERPROFILE`
  often redirects to OneDrive (`OneDrive - Regnology Germany GmbH\...`), which breaks profiles,
  paths, and Git workflows. Create `C:\code` if missing, run all project/doctrine/bin steps
  from there, and do **not** put the project or doctrine pack under the OneDrive homedir.
- Keep every message to the user non-technical: never paste stack traces; say "what happened /
  what I'm doing about it."
- If a command fails with an unexpected-token / bad-quote error, it is almost certainly a copy
  artifact (curly "smart" quotes instead of straight `"`, or a mangled backtick). Retype the
  quotes/backticks verbatim and re-run before treating it as a real failure.
- **Secrets policy — never collect credentials through chat.** You must **never** ask the user
  to paste a password, Personal Access Token (PAT), or any other secret into the Cursor chat.
  The Spec Kitty CLI install and the doctrine Artifactory pack **do not require a PAT**.

## Prerequisites — Confirm Cursor is installed

This guide is executed **by Cursor** — the user pastes or attaches it to a Cursor chat.
Before Step 0, confirm Cursor is present. Ask the user in plain language:
**"Do you have Cursor installed and open on this machine?"**

- **Yes** → continue to Step 0.
- **No / not sure** → stop. Tell them they need Cursor first — ask their team lead or IT
  for the internal Regnology Cursor setup instructions. Do **not** proceed without Cursor;
  there is no supported CLI-only path for non-technical onboarding.

Do **not** probe for `Cursor.exe` on disk — IT may install Cursor outside
`%LOCALAPPDATA%\Programs\cursor\`. A failed path check does **not** mean Cursor is missing if
the user confirms it is open. Their answer is authoritative.

## Step 0 — Adopt the onboarding role and introduce yourself

Act as **Receptionist Rob**, the Regnology onboarding/setup assistant: a semi-autonomous
productivity assistant (not an open-ended chatbot) who validates the machine, installs and
wires the tools, routes around corporate blockers, and finishes with a plain-language pass/fail
report. Surface anything needing a human (admin rights, missing repo access) instead of
guessing. Use this bootstrap definition now — do **not** try to read the profile from disk; it
lives inside the doctrine pack you haven't installed yet.

Then greet the user in one short paragraph: who you are, what you'll do (check their machine,
install two things, wire them together, verify), and that you'll ask them to confirm a couple
of things along the way.

## Step 0b — Confirm the Regnology VPN is connected (mandatory)

The Regnology Artifactory (and Bitbucket) are only reachable on the **Regnology VPN**. Before any
step that reaches them, confirm the VPN is on. Ask the user directly, in plain language:
**"Are you connected to the Regnology VPN right now?"**

- **Yes** → continue.
- **No / not sure** → ask them to connect their usual Regnology VPN, wait, and confirm before
  you go on. Do **not** proceed to the internal installs without this.

Optionally sanity-check reachability (a failure here means the VPN is likely off — stop and
re-check with the user, do not work around it):

```powershell
try {
    Invoke-WebRequest -Uri "https://artifactory.regnology.net/" -UseBasicParsing -TimeoutSec 10 *> $null
    Write-Output "VPN_OK"
} catch {
    Write-Output "VPN_UNREACHABLE - ask the user to connect the Regnology VPN, then retry"
}
```

If this reports `VPN_UNREACHABLE` at any later point (during the CLI install or the doctrine
download), treat it as a VPN/connectivity problem: stop, re-confirm the VPN with the user, and
retry the **same** internal source. Never substitute a public source to bypass it.

## Step 0c — Establish the `C:\code` workspace (mandatory)

On Regnology managed Windows, the user profile often lives under OneDrive. **Do not** run the
project setup from `Documents`, `OneDrive`, or any path under `$env:USERPROFILE` unless it is
explicitly `C:\Users\<name>` with no OneDrive redirect. Use **`C:\code`** instead — the standard
local dev root on Regnology machines.

Create it, switch to it, and keep using it for every step from here on:

```powershell
$CodeRoot = "C:\code"
New-Item -ItemType Directory -Force -Path $CodeRoot | Out-Null
Set-Location $CodeRoot
Write-Output "Workspace: $CodeRoot"
```

If the user opened Cursor in an OneDrive folder (e.g. `Documents\CursorTesting`), tell them in
plain language that you are moving the workspace to `C:\code` to avoid sync/path issues, and
that they should **re-open that folder in Cursor** when setup finishes. Do not download doctrine
or run `spec-kitty init` from the OneDrive path.

## Step 1 — Ensure Python and Git are present

Detect first; install only what's missing. Do **not** assume `python`, `pip`, or `pipx` are on
PATH — they often are not on Regnology machines. Python 3.9+ is required (prefer 3.12).

```powershell
# Find a working Python launcher ('python' or the 'py' launcher).
$Python = $null
foreach ($c in @("python", "py")) {
    try { & $c --version *> $null; if ($LASTEXITCODE -eq 0) { $Python = $c; break } } catch {}
}
if (-not $Python) { Write-Output "PYTHON_NOT_FOUND" } else { & $Python --version }
git --version
```

**If Python or Git is missing**, install them **per-user** (no admin).

```powershell
# Python — Attempt 1: winget (ships with Windows 10/11, policy-approved).
winget install --id Python.Python.3.12 --source winget --scope user --silent `
  --accept-package-agreements --accept-source-agreements

# Python — Attempt 2 (if winget missing/blocked): use Company Portal — do not download a
# hardcoded python.org URL; patch releases break those links on managed machines.

# Git — winget:
winget install --id Git.Git --source winget --scope user --silent `
  --accept-package-agreements --accept-source-agreements
```

> If winget is blocked, stop and tell the user to open the **Company Portal** (or Software
> Center) and click **Install** on **Python 3.12** (and **Git**), then continue. This is the
> one place a human click may be unavoidable.

A fresh install only updates PATH for *new* terminals, so re-detect in this one:

```powershell
$Python = $null
foreach ($c in @("python", "py")) {
    try { & $c --version *> $null; if ($LASTEXITCODE -eq 0) { $Python = $c; break } } catch {}
}
if (-not $Python) {
    $found = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Python", "$env:LOCALAPPDATA\Python" `
        -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($found) { $Python = $found.FullName }
}
if (-not $Python) { Write-Output "Open a NEW terminal and restart Step 1" } else { & $Python --version }
```

From here on, **always use `& $Python`** (it may be a full path like
`C:\Users\<you>\AppData\Local\Programs\Python\Python312\python.exe`).

## Step 2 — Install the Spec Kitty CLI

Confirm the VPN is on (Step 0b), then install **`regnology-spec-kitty-cli`** from Artifactory
(with public PyPI only as `--extra-index-url` for dependencies). Do **not** install the CLI
package from public PyPI alone, and do **not** clone Bitbucket for the CLI.

```powershell
# Make sure pip works; bootstrap it if needed.
& $Python -m pip --version *> $null; if ($LASTEXITCODE -ne 0) { & $Python -m ensurepip --upgrade }

# Remove legacy open-source package so it cannot shadow the Regnology CLI
# (Unix curl installer does this automatically).
& $Python -m pip uninstall -y spec-kitty-cli 2>$null
if (Get-Command pipx -ErrorAction SilentlyContinue) {
  pipx uninstall spec-kitty-cli 2>$null
}

& $Python -m pip install --user --upgrade "regnology-spec-kitty-cli" `
  --index-url "https://artifactory.regnology.net/artifactory/api/pypi/raf-spec-kitty-python/simple" `
  --extra-index-url "https://pypi.org/simple"
```

The pip package is **`regnology-spec-kitty-cli`**; the importable Python module is
**`specify_cli`** (not `spec_kitty`). Check that it imports:

```powershell
& $Python -c "import specify_cli; assert hasattr(specify_cli, 'main')" *> $null
if ($LASTEXITCODE -eq 0) { Write-Output "INSTALLED" } else { Write-Output "NOT_YET" }
```

If pip reports success but `import specify_cli` fails, run
`& $Python -m pip show regnology-spec-kitty-cli` and reinstall — do not substitute another
module name.

- **Artifactory unreachable / connection timeout** → VPN problem — return to Step 0b and
  re-run the same pip install. Do **not** install from public PyPI.
- **`401` / `403`** → access problem (not VPN) — ask the user to request Artifactory access
  from their team lead. Do **not** fall through to public PyPI.
- **`No module named pip` / ensurepip failed** → reinstall Python via winget or Company Portal,
  then re-run Step 2.

Once you see `INSTALLED`, verify the command runs. On this machine the generated
`spec-kitty.exe` is very likely blocked by Intune/AzureAD, so define the Python-launcher
function first, then test:

```powershell
function spec-kitty { & $Python -c "import sys; import specify_cli; sys.exit(specify_cli.main())" @args }
spec-kitty --version
```

- **You see** `regnology-spec-kitty-cli version X.Y.Z+rgn…` → apply the
  permanent **Blocked-launcher fix** in Troubleshooting, **verify in a fresh shell** (see that
  section), then continue to Step 3. Do **not** treat the inline function in the current session
  as proof the permanent fix worked.
- **You see a different package** (e.g. `spec-kitty-cli version 0.0.0-dev` or an editable /
  open-source build) → a **legacy CLI is shadowing** the Regnology install. Apply the permanent
  **Blocked-launcher fix** (profile function + `spec-kitty.cmd` early on PATH), verify in a
  **fresh** shell until the line starts with `regnology-spec-kitty-cli`.
- **"Access is denied"** on `spec-kitty.exe` → that's the blocked launcher; the function above
  is exactly the workaround — apply the permanent **Blocked-launcher fix**, then verify in a
  fresh shell.
- **"not recognized"** → PATH/profile not loaded — apply the **Blocked-launcher fix**, verify in
  a fresh shell, or use the inline function above for this session only.

Do not proceed until the **Blocked-launcher fix** is applied **and** a fresh-shell verification
(see Troubleshooting) confirms `spec-kitty --version` prints a line starting with
`regnology-spec-kitty-cli`.

> **Virtualenv** (optional): create and activate a venv, then run the same Artifactory pip
> install **without** `--user` so the package lands in the venv. Prefer the global per-user
> install + Blocked-launcher fix for non-technical onboarding.

## Step 3 — Prepare the project folder with Git

Work in **`C:\code`** (set in Step 0c). Confirm you are there, then make it a Git repository:

```powershell
$CodeRoot = "C:\code"
New-Item -ItemType Directory -Force -Path $CodeRoot | Out-Null
Set-Location $CodeRoot
Write-Output "Working directory: $(Get-Location)"
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { git init }
# Empty repos have no commits yet — do not use `git rev-parse --abbrev-ref HEAD`
# (fails with "ambiguous argument 'HEAD'"). symbolic-ref / branch --show-current work on unborn HEAD.
git symbolic-ref --short HEAD 2>$null
if ($LASTEXITCODE -ne 0) { git branch --show-current }
```

If `git init` created a brand-new repo, that's expected — the user now has a version-controlled
workspace at `C:\code`.

## Step 4 — Get the Regnology doctrine pack

This reaches Artifactory, so the VPN must be on (Step 0b). Prefer the **static Artifactory
pack** (no Bitbucket credentials required):

- <https://artifactory.regnology.net/artifactory/raf-generic-local/doctrine-org-latest.tar.gz>
- <https://artifactory.regnology.net/artifactory/raf-generic-local/doctrine-org-latest.zip>

Prefer `.tar.gz` on Windows (`tar` ships with Windows 10/11); use `.zip` if the download or
extract fails. The archive contains a top-level `doctrine-org/pack/` tree — extract it **into**
`.regnology` so the result is `C:\code\.regnology\doctrine-org\pack`.

**On every run (including reruns)** refresh the pack from Artifactory so the workstation stays
on `doctrine-org-latest`. A Bitbucket git clone at the same path is updated with `git pull`
instead (no Artifactory overwrite of a `.git` tree).

```powershell
$CodeRoot = "C:\code"
$RegnologyDir = "$CodeRoot\.regnology"
$Dest = "$RegnologyDir\doctrine-org"
$TarUrl = "https://artifactory.regnology.net/artifactory/raf-generic-local/doctrine-org-latest.tar.gz"
$ZipUrl = "https://artifactory.regnology.net/artifactory/raf-generic-local/doctrine-org-latest.zip"
New-Item -ItemType Directory -Force -Path $RegnologyDir | Out-Null

# Legacy layout: .regnology\pack → .regnology\doctrine-org\pack
$legacyPack = "$RegnologyDir\pack"
if ((Test-Path "$legacyPack\org-charter.yaml") -and -not (Test-Path "$Dest\pack\org-charter.yaml")) {
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    Move-Item -Path $legacyPack -Destination "$Dest\pack"
    Write-Output "DOCTRINE_MIGRATED_LEGACY_LAYOUT"
}

if ((Test-Path "$Dest\.git") -and (Test-Path "$Dest\pack\org-charter.yaml")) {
    git -C $Dest pull --ff-only
    if ($LASTEXITCODE -eq 0) {
        Write-Output "DOCTRINE_GIT_UPDATED"
    } else {
        Write-Output "DOCTRINE_GIT_PULL_FAILED - fix the clone or remove $Dest and re-run for Artifactory"
        exit 1
    }
} elseif ((Test-Path $Dest) -and -not (Test-Path "$Dest\pack\org-charter.yaml") -and -not (Test-Path "$Dest\.git")) {
    Write-Output "DOCTRINE_DESTINATION_BLOCKED - $Dest exists but has no pack; ask before removing"
    exit 1
} else {
    $tmp = Join-Path $env:TEMP ("doctrine-org-" + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    $ok = $false
    try {
        Invoke-WebRequest -Uri $TarUrl -OutFile "$tmp\doctrine-org-latest.tar.gz"
        tar -xzf "$tmp\doctrine-org-latest.tar.gz" -C $tmp
        if (Test-Path "$tmp\doctrine-org\pack\org-charter.yaml") { $ok = $true }
    } catch {
        Write-Output "TAR_FALLBACK_FAILED - trying .zip"
    }
    if (-not $ok) {
        try {
            Invoke-WebRequest -Uri $ZipUrl -OutFile "$tmp\doctrine-org-latest.zip"
            Expand-Archive -Path "$tmp\doctrine-org-latest.zip" -DestinationPath $tmp -Force
            if (Test-Path "$tmp\doctrine-org\pack\org-charter.yaml") { $ok = $true }
        } catch {
            Write-Output "DOCTRINE_ARTIFACTORY_FAILED - ask the user to request Artifactory access from their team lead"
        }
    }
    if (-not $ok) {
        Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
        exit 1
    }
    # Atomic replace so a rerun always picks up doctrine-org-latest (including file removals).
    $bak = "$Dest.bak"
    if (Test-Path $bak) { Remove-Item -Recurse -Force $bak }
    if (Test-Path $Dest) { Move-Item -Path $Dest -Destination $bak }
    Move-Item -Path "$tmp\doctrine-org" -Destination $Dest
    if (Test-Path $bak) { Remove-Item -Recurse -Force $bak }
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    if (Test-Path "$Dest\pack\org-charter.yaml") {
        Write-Output "DOCTRINE_ARTIFACTORY_UPDATED"
    } else {
        Write-Output "DOCTRINE_ARTIFACTORY_FAILED - extract missing org-charter.yaml"
        exit 1
    }
}
```

If Artifactory download fails because the host is unreachable, go back to Step 0b (VPN). Do not
proceed to Step 5 on failure.

> Optional browse: <https://bitbucket.regnology.net/projects/RAF/repos/doctrine-org/browse>.
> If an old copy exists under OneDrive (`$env:USERPROFILE\.regnology`), ignore it and use the
> `C:\code` location. The pack lives at `C:\code\.regnology\doctrine-org\pack`.

**Find the pack root** — the folder that contains `org-charter.yaml`, `directives\`, and
`agent_profiles\` (normally `C:\code\.regnology\doctrine-org\pack`):

```powershell
$PackRoot = Get-ChildItem -Path "C:\code\.regnology\doctrine-org" -Filter org-charter.yaml `
  -Recurse -ErrorAction SilentlyContinue |
  Sort-Object { $_.FullName.Split('\').Count }, FullName |
  Select-Object -First 1 -ExpandProperty DirectoryName
if (-not $PackRoot) {
    Write-Output "PACK_ROOT_NOT_FOUND - org-charter.yaml missing; re-run Step 4."
} else {
    Write-Output "Pack root: $PackRoot"
}
```

Do not proceed to Step 5 until `Pack root:` prints a valid path.

## Step 5 — Wire the doctrine into the project and verify

From `C:\code`:

```powershell
$CodeRoot = "C:\code"
Set-Location $CodeRoot
Write-Output "Working directory: $(Get-Location)"
if ((Get-Location).Path -ne $CodeRoot) {
    Write-Output "WRONG_DIRECTORY - expected C:\code before spec-kitty init"
}
spec-kitty init --ai cursor --non-interactive
```

Add a `doctrine` block to `.kittify/config.yaml` pointing at the pack root from Step 4 (use
forward slashes — spec-kitty accepts them on Windows). The `local_path` **must match** the
`Pack root:` path from Step 4 exactly (the folder that contains `org-charter.yaml`):

```powershell
$LocalPath = ($PackRoot -replace '\\','/')
Write-Output "Set doctrine local_path to: $LocalPath"
```

```yaml
doctrine:
  org:
    packs:
      - name: regnology-default
        local_path: C:/code/.regnology/doctrine-org/pack
```

Confirm the YAML value matches `$LocalPath` before continuing:

```powershell
Select-String -Path .kittify\config.yaml -Pattern 'local_path'
$configLocalPath = (Select-String -Path .kittify\config.yaml -Pattern 'local_path:\s*(.+)' |
    Select-Object -First 1).Matches.Groups[1].Value.Trim()
if ($configLocalPath -ne $LocalPath) {
    Write-Output "LOCAL_PATH_MISMATCH - local_path must be $LocalPath (found $configLocalPath)"
}
```

Verify the pack loads:

```powershell
spec-kitty doctor doctrine
```

Expect **non-zero counts** for directives / tactics / agent_profiles and
`org-charter.yaml: present`. A yellow `DoctrineLayerCollisionWarning` ("org shadowed builtin")
is **normal** — the pack is meant to override some defaults. If it shows **0 artifacts**, the
`local_path` is wrong (point it at the `pack` subfolder, not the repo root).

## Step 5b — Install the Kitty invocation Cursor rule (optional)

Try to install the Regnology doctrine bootstrap rule so Cursor applies the Kitty gate when the
user invokes Kitty (`hey kitty`, `kitty, do …`). This step reaches Artifactory — the VPN must be
on (Step 0b).

**This step is not a deal-breaker.** If the download fails, report it in Step 6 and **continue**
— Spec Kitty and the doctrine pack are still usable without the Cursor rule.

When the download succeeds, cache the file under `.regnology`, then copy it into **both**:

1. **User home** — `%USERPROFILE%\.cursor\rules\` (global; applies across projects on this machine)
2. **Workspace** — `C:\code\.cursor\rules\` (project-scoped; picked up when `C:\code` is open)

- <https://artifactory.regnology.net/artifactory/raf-generic-local/kb/load-regnology-spec-kitty-doctrine.mdc>

```powershell
$CodeRoot = "C:\code"
$RegnologyHome = "$CodeRoot\.regnology"
$RuleName = "load-regnology-spec-kitty-doctrine.mdc"
$RuleUrl = "https://artifactory.regnology.net/artifactory/raf-generic-local/kb/$RuleName"
$cache = "$RegnologyHome\cursor-rules\$RuleName"
$tmp = "$env:TEMP\$RuleName"
$ruleOk = $false

New-Item -ItemType Directory -Force -Path "$RegnologyHome\cursor-rules" | Out-Null
try {
    Invoke-WebRequest -Uri $RuleUrl -OutFile $tmp
    Copy-Item -Path $tmp -Destination $cache -Force
    $ruleOk = $true
} catch {
    if (Test-Path $cache) {
        Write-Output "CURSOR_RULE_CACHE_OK - using cached copy (download failed; check VPN)"
        $tmp = $cache
        $ruleOk = $true
    } else {
        Write-Output "CURSOR_RULE_SKIPPED - optional step failed; report in Step 6 and continue"
    }
}

if ($ruleOk) {
    $homeRules = Join-Path $env:USERPROFILE ".cursor\rules"
    $workspaceRules = "$CodeRoot\.cursor\rules"
    New-Item -ItemType Directory -Force -Path $homeRules, $workspaceRules | Out-Null
    Copy-Item -Path $tmp -Destination (Join-Path $homeRules $RuleName) -Force
    Copy-Item -Path $tmp -Destination (Join-Path $workspaceRules $RuleName) -Force
    Write-Output "CURSOR_RULE_OK: $homeRules and $workspaceRules"
}
```

If installation succeeded, tell the user in plain language that Kitty-governed work starts when
they invoke Kitty in chat. Reload Cursor (**Developer: Reload Window**) if the rule does not
appear under **Cursor Settings → Rules**.

## Step 6 — Report back to the human

> **For the user** — the agent delivers this summary in plain language. You do not need to
> read the technical steps above to understand the outcome.

Give a short, non-technical summary:

- ✅ / ❌ for each: VPN connected · Python & Git ready · Spec Kitty installed · `spec-kitty`
  command works · project at `C:\code` with a Git repo · doctrine pack loaded.
- ✅ / ⚠️ **Optional:** Cursor Kitty rule installed (Step 5b). If this failed, say so in plain
  language — setup is still complete; the user can retry later or ask IT. Do **not** treat a
  missing Cursor rule as a failed installation.
- **What to do next:** *"Re-open **`C:\code`** in Cursor if you started somewhere else. Open a
  **new** terminal any time and type `spec-kitty --version` to confirm it's working. If that
  fails, run `. $PROFILE` once in the current terminal, then try again — or open another new
  terminal. When you're ready to set up governance for this project, run
  `spec-kitty charter interview` — I can walk you through it."*
- **Anything blocked** that needs a human: VPN not available, missing admin rights, or no
  Artifactory access — say exactly who to ask and for what.

---

## Upgrading from the legacy setup

Follow this procedure if you are running the open-source Spec Kitty (editable install from
`file:///C:/code/spec-kitty`, or version `3.2.0rc*`), the old package name `spec-kitty-cli`,
or the legacy doctrine repo (`cons/regnology-agent-doctrine` in `.kittify/config.yaml`).

**Diagnose first:**

```powershell
& $Python -m pip show regnology-spec-kitty-cli spec-kitty-cli   # check Version and Location
Get-Content .kittify\config.yaml                                 # look for local_path under doctrine
```

### Step A — Migrate the Spec Kitty CLI

Uninstall the legacy package if present, then install from Artifactory (VPN required):

```powershell
& $Python -m pip uninstall -y spec-kitty-cli 2>$null

& $Python -m pip install --user --upgrade "regnology-spec-kitty-cli" `
  --index-url "https://artifactory.regnology.net/artifactory/api/pypi/raf-spec-kitty-python/simple" `
  --extra-index-url "https://pypi.org/simple"

& $Python -m pip show regnology-spec-kitty-cli   # expect: Version with +rgn…, non-editable
function spec-kitty { & $Python -c "import sys; import specify_cli; sys.exit(specify_cli.main())" @args }
spec-kitty --version
```

Re-apply the permanent **Blocked-launcher fix** in Troubleshooting if needed, then verify in a
fresh shell.

### Step B — Migrate the doctrine pack

Doctrine wiring is **per-project** — there is no machine-wide global default. Every project's
`.kittify/config.yaml` must be updated individually.

```powershell
# Ensure doctrine pack is present (Artifactory; reuse Step 4 if needed):
# Find all projects still pointing at the legacy pack:
Get-ChildItem -Path "C:\code" -Filter "config.yaml" -Recurse -ErrorAction SilentlyContinue |
  Where-Object { (Get-Content $_.FullName -Raw) -match 'regnology-agent-doctrine' } |
  Select-Object FullName
```

For each project found, open `.kittify/config.yaml` and update `local_path`:

```yaml
# Change from:
local_path: C:/Code/regnology-agent-doctrine/pack
# To (use forward slashes):
local_path: C:/code/.regnology/doctrine-org/pack
```

Then verify each updated project:

```powershell
cd <project-dir>
spec-kitty doctor doctrine   # expect: non-zero artifact counts, org-charter.yaml: present
```

> New projects initialised with `spec-kitty init` also need the doctrine `local_path` added
> manually — there is no global fallback that supplies it automatically.

---

## Troubleshooting (symptom → fix)

> **For humans without Cursor** — search this table for what you see on screen. Fixes are
> written for the agent; many are commands you can paste into a terminal.

| What you see | Fix |
|---|---|
| `Could not resolve host` / connection timeout / Artifactory unreachable | The Regnology VPN is almost certainly off — stop, ask the user to connect the VPN (Step 0b), then retry the **same** Artifactory pip install or doctrine download. Do not switch to public PyPI for the CLI package |
| `Program 'spec-kitty.exe' failed to run: Access is denied.` | Intune/AzureAD blocks `.exe` in user-writable folders — use the **Blocked-launcher fix** below (PowerShell profile function + `spec-kitty.cmd` on PATH); never rely on the `.exe` |
| `spec-kitty : The term 'spec-kitty' is not recognized` | (1) Run `. $PROFILE` in the current terminal. (2) Open a **new** terminal. (3) If still failing, check the profile isn't empty: `Get-Content $PROFILE`. (4) Ensure `spec-kitty.cmd` exists in `C:\code\bin` and that folder is on user PATH. **Do not rely on `spec-kitty.ps1` alone** — PowerShell won't run `.ps1` files from PATH by name |
| `spec-kitty --version` shows `spec-kitty-cli` / `0.0.0-dev` / editable install (not `regnology-spec-kitty-cli …+rgn…`) | A legacy CLI earlier on PATH is shadowing the Regnology install — re-apply the **Blocked-launcher fix** so the profile function / `C:\code\bin\spec-kitty.cmd` wins, then verify in a **fresh** shell |
| `python : The term 'python' is not recognized` | Python not on PATH but may exist as `py` — use `$Python = "py"`, or install Python 3.12 from winget / Company Portal (Step 1) |
| `No module named pip` | `& $Python -m ensurepip --upgrade`; if unavailable, reinstall Python via winget or the Company Portal |
| winget missing / blocked | Open **Company Portal** (or Software Center) and install **Python 3.12** and **Git**, then re-run Step 1 |
| `spec-kitty doctor doctrine` shows 0 artifacts | `local_path` is wrong — point it at `C:/code/.regnology/doctrine-org/pack` (the `pack` subfolder that contains `org-charter.yaml`), not the repo root or an OneDrive homedir copy |
| Project or doctrine under `OneDrive\...\Documents` | Stop — move work to `C:\code` (Step 0c). Re-open `C:\code` in Cursor; update `local_path` to `C:/code/.regnology/doctrine-org/pack` |
| PowerShell refuses to run a script | Execution policy — run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| `401 / 403` on Artifactory | An auth/access problem (not VPN): ask the user to request Artifactory access from their team lead. **Do not** fall through to public PyPI for `regnology-spec-kitty-cli` |
| `UserWarning: ... terminology-guard.toolguide.yaml ... extra_forbidden` from `spec-kitty doctor doctrine` | Informational — a packaging issue inside the internal build, unrelated to your doctrine pack. The pack still loads correctly if artifact counts are non-zero and `org-charter.yaml: present`. No action required |

### Blocked-launcher fix (Intune/AzureAD blocks the generated `spec-kitty.exe`)

Corporate policy commonly blocks `.exe` files in user-writable folders like
`%USERPROFILE%\.local\bin`. Bypass the blocked `.exe` by running Spec Kitty *through* Python
(`python` is an approved executable), so the user just types `spec-kitty`.

> **OneDrive homedir vs `C:\code`.** On Regnology laptops, `$HOME` / `$env:USERPROFILE` often
> redirects to OneDrive (`OneDrive - Regnology Germany GmbH\...`). Use **`C:\code`** for the
> project, doctrine pack, and `spec-kitty.cmd` wrapper — not OneDrive `Documents`. PowerShell
> profiles still live under OneDrive `Documents`; always create the parent folder before writing,
> and verify with `Get-Content $PROFILE` — the file can exist but stay empty if the parent
> directory was missing.

**Use it immediately in this terminal:**

```powershell
function spec-kitty { & $Python -c "import sys; import specify_cli; sys.exit(specify_cli.main())" @args }
```

**Make it permanent** — you need **both**:

1. A **profile function** (PowerShell resolves `spec-kitty` when the profile loads).
2. A **`spec-kitty.cmd`** wrapper in `C:\code\bin` (PowerShell and Command Prompt resolve
   `.cmd` from PATH; **`.ps1` on PATH does not work** — typing `spec-kitty` never finds
   `spec-kitty.ps1`). Use `C:\code\bin`, not `%USERPROFILE%\bin`, to stay off OneDrive.

Use `python` (not a captured install-time path) so the launcher survives Python upgrades.

Also write to **both** PowerShell profile locations — Windows PowerShell 5.1 and PowerShell 7
use different paths; Cursor may open either one.

```powershell
$CodeRoot = "C:\code"
$snippet = "`n# spec-kitty global command (Python launcher — bypasses blocked .exe)`nfunction spec-kitty { python -c `"import sys; import specify_cli; sys.exit(specify_cli.main())`" @args }`n"

# 1) PowerShell profile function — write to every profile this machine may use.
$profiles = @(
    $PROFILE,
    "$HOME\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1",
    "$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
) | Select-Object -Unique

foreach ($p in $profiles) {
    $profileDir = Split-Path $p -Parent
    New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
    if (-not (Test-Path $p)) { New-Item -ItemType File -Path $p -Force | Out-Null }
    $profileContent = Get-Content $p -Raw -ErrorAction SilentlyContinue
    if ($profileContent -notlike "*spec-kitty global command*") {
        Add-Content -Path $p -Value $snippet
    }
}

# 2) .cmd wrapper on C:\code\bin (works in PowerShell and cmd.exe; avoids OneDrive homedir).
New-Item -ItemType Directory -Force -Path $CodeRoot | Out-Null
$binDir = "$CodeRoot\bin"
New-Item -ItemType Directory -Force -Path $binDir | Out-Null
$cmdContent = "@echo off`r`npython -c `"import sys; import specify_cli; sys.exit(specify_cli.main())`" %*"
Set-Content -Path "$binDir\spec-kitty.cmd" -Value $cmdContent -Encoding ASCII
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$userPath;$binDir", "User")
}
```

**Mandatory verification** — do not report success until both checks pass:

```powershell
# Confirm the profile actually contains the function (not an empty file).
$profileOk = $false
foreach ($p in $profiles) {
    if (Test-Path $p) {
        if (Select-String -Path $p -Pattern "function spec-kitty" -Quiet) { $profileOk = $true }
    }
}
if (-not $profileOk) { Write-Output "PROFILE_VERIFY_FAILED - rewrite the profile snippet" }

# Confirm spec-kitty.cmd exists on PATH.
if (-not (Test-Path "$binDir\spec-kitty.cmd")) { Write-Output "CMD_WRAPPER_MISSING" }

# Confirm it works in a FRESH shell (not the agent's current session).
# Expect a line starting with regnology-spec-kitty-cli (not a legacy spec-kitty-cli).
powershell -NoProfile -Command ". '$PROFILE'; spec-kitty --version"
```

If verification fails, rewrite the profile and `.cmd` wrapper — do not proceed to Step 3.
If verification prints a legacy `spec-kitty-cli` / `0.0.0-dev` line, the PATH still prefers an
old install — ensure `C:\code\bin` is early on the user PATH and the profile `function
spec-kitty` is defined, then re-run the fresh-shell check.
If verification passes, tell the user to open a **new** terminal and run `spec-kitty --version`
again as a final sanity check.

---

_Audience: non-technical Regnology staff on managed Windows 10/11 laptops (primary) and the
executing Cursor agent (secondary)._
