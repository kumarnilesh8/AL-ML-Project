#Requires -Version 5.1
<#
.SYNOPSIS
    Install the Regnology Agent Stack from Artifactory and PyPI (Windows).

.DESCRIPTION
    Parity twin of install-regnology-stack.sh. Installs:
      - spec-kitty-cli  (via pipx; pinned PyPI version OR a git ref such as `main`)
      - regnology-all-company doctrine pack   (base layer, from the upstream root)
      - ps-agent-enabled-factory doctrine pack (PS overlay, from this repo's path)

    Ordered phases (parity-critical — must match the .sh installer exactly):
      resolve -> idempotency -> preflight -> integrity -> deps -> spec-kitty
              -> layers (base -> overlay) -> completion

    Build-time injection (D-005, WP01 release-map contract):
      The four @...@ tokens below are substituted by the Jenkins tag build before
      publishing. A published (injected) script is deterministic. An in-repo clone
      keeps the placeholders and runs in fallback/unpinned mode (default spec-kitty
      version + `latest` pack aliases).

    Endpoint URL templates (data-model.md § "Endpoint URL templates"):
      {base}          = $ArtefactoryUrl/$ArtefactoryRepo/$ArtefactoryPath
      {base_upstream} = $env:REGNOLOGY_BASE_UPSTREAM   (no hardcoded host)
      Overlay archive : {base}/ps-agent-enabled-factory-<overlay_pack_version>.tar.gz (+ .sha256)
      Base archive    : {base_upstream}/regnology-all-company-<base_pack_version>.tar.gz (+ .sha256)

.PARAMETER SpecKittyVersion
    Override the spec-kitty-cli version to install.

.PARAMETER PackVersion
    Override BOTH pack versions (base + overlay).

.PARAMETER InstallDir
    Root directory where packs are stored. Defaults to REGNOLOGY_STACK_DIR or
    "$env:USERPROFILE\regnology-agent-stack".

.PARAMETER ArtefactoryUrl
    Artifactory base URL ({base} part 1).

.PARAMETER ArtefactoryRepo
    Artifactory repo ({base} part 2).

.PARAMETER ArtefactoryPath
    Artifactory path ({base} part 3).

.PARAMETER PackRepoPath
    Combined repo/path ({base} parts 2+3, back-compat).

.PARAMETER BaseUpstream
    Upstream all-company distribution root ({base_upstream}).

.PARAMETER ArtefactoryToken
    Artifactory API token (prefer the REGNOLOGY_ARTEFACTORY_TOKEN env var).

.PARAMETER DryRun
    Print what would be done without making any changes.

.NOTES
    Exit codes:
      0  Success                3  Preflight / download failure
      1  Usage / argument error 4  Extraction failed
      2  Required tool missing  5  spec-kitty installation failed
      6  Integrity (checksum) verification failed
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string] $SpecKittyVersion = "",
    [string] $PackVersion      = "",
    [string] $InstallDir       = $(if ($env:REGNOLOGY_STACK_DIR) { $env:REGNOLOGY_STACK_DIR } else { Join-Path $env:USERPROFILE "regnology-agent-stack" }),
    [string] $ArtefactoryUrl   = $(if ($env:ARTEFACTORY_URL) { $env:ARTEFACTORY_URL } elseif ($env:REGNOLOGY_ARTEFACTORY_URL) { $env:REGNOLOGY_ARTEFACTORY_URL } else { "" }),
    [string] $ArtefactoryRepo  = $(if ($env:ARTEFACTORY_REPO) { $env:ARTEFACTORY_REPO } elseif ($env:REGNOLOGY_ARTEFACTORY_REPO) { $env:REGNOLOGY_ARTEFACTORY_REPO } else { "" }),
    [string] $ArtefactoryPath  = $(if ($env:ARTEFACTORY_PATH) { $env:ARTEFACTORY_PATH } elseif ($env:REGNOLOGY_ARTEFACTORY_PATH) { $env:REGNOLOGY_ARTEFACTORY_PATH } else { "" }),
    [string] $PackRepoPath     = $(if ($env:REGNOLOGY_PACK_REPO_PATH) { $env:REGNOLOGY_PACK_REPO_PATH } else { "" }),
    [string] $BaseUpstream     = $(if ($env:REGNOLOGY_BASE_UPSTREAM) { $env:REGNOLOGY_BASE_UPSTREAM } else { "" }),
    [string] $ArtefactoryToken = $(if ($env:REGNOLOGY_ARTEFACTORY_TOKEN) { $env:REGNOLOGY_ARTEFACTORY_TOKEN } else { "" }),
    [string] $BasePackName     = $(if ($env:REGNOLOGY_BASE_PACK_NAME) { $env:REGNOLOGY_BASE_PACK_NAME } else { "regnology-all-company" }),
    [string] $OverlayPackName  = $(if ($env:REGNOLOGY_OVERLAY_PACK_NAME) { $env:REGNOLOGY_OVERLAY_PACK_NAME } else { "ps-agent-enabled-factory" }),
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ScriptVersion = "3.0.0"

# ---------- build-time-injection tokens (substituted by Jenkins tag build) ----
# These literal @...@ values are the ONLY substitution points (WP01 contract).
# Do NOT reference the literal token text anywhere else, or CI injection would
# rewrite the detection logic too. Placeholder detection uses the @*@ glob.
$SpecKittyVersionToken   = '@SPEC_KITTY_VERSION@'
$OverlayPackVersionToken = '@OVERLAY_PACK_VERSION@'
$BasePackVersionToken    = '@BASE_PACK_VERSION@'
$ReleaseTagToken         = '@RELEASE_TAG@'

# Built-in fallback spec-kitty version (used only if config/release-map.yaml is
# not reachable from a clone). Mirrors release-map default_spec_kitty_version.
$BuiltinDefaultSkVersion = "main"
$SpecKittyPackage        = "spec-kitty-cli"
$SpecKittyGitUrl         = "https://github.com/Priivacy-ai/spec-kitty.git"

# Build the pipx install spec for a resolved spec-kitty version. A value that
# starts with a digit is a PyPI release (spec-kitty-cli==X); anything else is a
# git ref (branch/tag/SHA) installed from source; a value already starting with
# "git+" is used verbatim.
function Get-SkInstallSpec {
    param([string] $Version)
    if     ($Version -like 'git+*')   { return $Version }
    elseif ($Version -match '^[0-9]') { return "$SpecKittyPackage==$Version" }
    else                              { return "git+$SpecKittyGitUrl@$Version" }
}

# ---------- derived paths ----------------------------------------------------

$PacksDir       = Join-Path $InstallDir "packs"
$BasePackDir    = Join-Path $PacksDir $BasePackName
$OverlayPackDir = Join-Path $PacksDir $OverlayPackName
$VersionFile    = Join-Path $InstallDir ".stack-version"
$TmpDir         = Join-Path $InstallDir ".tmp-install"
$Platform       = "windows"
$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---------- color helpers ----------------------------------------------------

function Write-Phase  { param([string]$name, [string]$msg) Write-Host "`n==> [phase: $name] $msg" -ForegroundColor Cyan }
function Write-Info   { param([string]$msg) Write-Host "[INFO]  $msg" -ForegroundColor Blue }
function Write-Ok     { param([string]$msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn   { param([string]$msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Err    { param([string]$msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-DryRun { param([string]$msg) Write-Host "[DRY-RUN] would run: $msg" -ForegroundColor Yellow }

# ---------- helpers ----------------------------------------------------------

# Placeholder detection: a still-un-injected token looks like @...@.
function Test-Placeholder { param([string]$value) return ($value -like '@*@') }

# Read default_spec_kitty_version from a reachable config/release-map.yaml.
function Read-DefaultSkVersion {
    $candidates = @(
        (Join-Path $ScriptDir "..\..\config\release-map.yaml"),
        (Join-Path $ScriptDir "config\release-map.yaml"),
        ".\config\release-map.yaml"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) {
            foreach ($line in Get-Content -Path $p) {
                if ($line -match '^\s*default_spec_kitty_version:\s*"?([^"\s]+)"?') {
                    return $Matches[1]
                }
            }
        }
    }
    return $BuiltinDefaultSkVersion
}

# Single, actionable failure block. Args: phase layer url cause remediation.
function Write-FailBlock {
    param([string]$phaseName, [string]$layer, [string]$url, [string]$cause, [string]$remediation)
    Write-Err "Installer failed — aborting before any further action."
    Write-Host ("  {0,-12} {1}" -f "phase:",       $phaseName)
    Write-Host ("  {0,-12} {1}" -f "layer:",       $layer)
    Write-Host ("  {0,-12} {1}" -f "url:",         $url)
    Write-Host ("  {0,-12} {1}" -f "cause:",       $cause)
    Write-Host ("  {0,-12} {1}" -f "remediation:", $remediation)
}

function Get-AuthHeaders {
    $h = @{}
    if ($ArtefactoryToken) { $h["X-JFrog-Art-Api"] = $ArtefactoryToken }
    return $h
}

# HEAD probe returning an HTTP status code (0 on network failure/timeout).
function Get-HttpStatus {
    param([string]$url)
    try {
        $ProgressPreference = "SilentlyContinue"
        $resp = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 15 -Headers (Get-AuthHeaders) -UseBasicParsing
        return [int]$resp.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

# Probe one layer; on non-200, emit a discriminated failure block and exit.
function Invoke-PreflightLayer {
    param([string]$layer, [string]$url)
    Write-Info "Probing ${layer}: $url"
    if ($DryRun) { Write-DryRun "HEAD $url"; return }
    $code = Get-HttpStatus -url $url
    switch ($code) {
        { $_ -in 200, 204, 301, 302 } { Write-Ok "$layer reachable (HTTP $code)"; return }
        404 {
            Write-FailBlock "preflight" $layer $url "missing artifact (HTTP 404)" `
                "Check the pack version and the Artifactory repo/path (and $layer upstream root)."
            exit 3
        }
        { $_ -in 401, 403 } {
            Write-FailBlock "preflight" $layer $url "access denied (HTTP $code)" `
                "Check your entitlement and set REGNOLOGY_ARTEFACTORY_TOKEN to a valid token."
            exit 3
        }
        default {
            Write-FailBlock "preflight" $layer $url "network failure / timeout (HTTP $code)" `
                "Check VPN and connectivity to the host; the endpoint did not respond within 15s."
            exit 3
        }
    }
}

# Download a URL to a destination (exits 3 on failure).
function Invoke-Download {
    param([string]$url, [string]$dest, [string]$label = "file")
    Write-Info "Downloading $label"
    Write-Info "  from: $url"
    if ($DryRun) { Write-DryRun "download '$url' -> '$dest'"; return }
    try {
        $ProgressPreference = "SilentlyContinue"
        Invoke-WebRequest -Uri $url -OutFile $dest -Headers (Get-AuthHeaders) -UseBasicParsing
        Write-Ok "Downloaded $label"
    } catch {
        Write-Err "Download failed: $url"
        Write-Err $_.Exception.Message
        exit 3
    }
}

# Verify a payload against its detached .sha256 BEFORE extraction (FR-012).
function Test-Checksum {
    param([string]$layer, [string]$archive, [string]$shaFile, [string]$artifact)
    if ($DryRun) { Write-DryRun "verify SHA-256 of '$artifact'"; return }
    $expected = ((Get-Content -Path $shaFile -Raw) -split '\s+' | Where-Object { $_ } | Select-Object -First 1)
    if ($expected) { $expected = $expected.Trim().ToLower() }
    $actual = (Get-FileHash -Path $archive -Algorithm SHA256).Hash.ToLower()
    if (-not $expected) {
        Remove-Item -Force -ErrorAction SilentlyContinue $archive, $shaFile
        Write-FailBlock "integrity" $layer $artifact "empty/invalid .sha256 sidecar" `
            "Re-publish the artifact with a valid 64-char hex .sha256 alongside it."
        exit 6
    }
    if ($expected -eq $actual) {
        Write-Ok "$layer checksum verified ($artifact)"
    } else {
        Remove-Item -Force -ErrorAction SilentlyContinue $archive
        Write-Err "Checksum MISMATCH for $artifact — partial download removed."
        Write-Host ("  {0,-12} {1}" -f "expected:", $expected)
        Write-Host ("  {0,-12} {1}" -f "actual:",   $actual)
        Write-FailBlock "integrity" $layer $artifact "SHA-256 mismatch" `
            "The download is corrupt or tampered; retry, and verify the published checksum."
        exit 6
    }
}

# Extract a verified archive, stripping the top-level pack/ wrapper.
function Expand-Pack {
    param([string]$packName, [string]$archive, [string]$packDir)
    Write-Info "Extracting $packName -> $packDir"
    if ($DryRun) { Write-DryRun "tar -xzf '$archive' -C '$packDir' --strip-components=1"; return }
    if (Test-Path $packDir) { Remove-Item -Recurse -Force $packDir }
    New-Item -ItemType Directory -Path $packDir -Force | Out-Null
    if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
        Write-Err "tar is required to extract .tar.gz archives (Windows 10 1803+/Server 2019+)."
        exit 2
    }
    # --strip-components=1 removes the top-level pack/ dir the Jenkins build wraps.
    tar -xzf $archive -C $packDir --strip-components=1
    if ($LASTEXITCODE -ne 0) { Write-Err "Extraction failed for $packName (tar)"; exit 4 }
    foreach ($req in @("directives", "tactics", "styleguides", "agent_profiles")) {
        if (-not (Test-Path (Join-Path $packDir $req))) {
            Write-Err "Pack extraction incomplete for ${packName}: missing $req"
            exit 4
        }
    }
    Write-Ok "$packName extracted and structure verified"
}

# Read a pack's recorded version (manifest field or in-pack .pack-version).
function Get-RecordedPackVersion {
    param([string]$packDir, [string]$manifestField)
    $verFile = Join-Path $packDir ".pack-version"
    if (Test-Path $verFile) { return (Get-Content $verFile -Raw).Trim() }
    if (Test-Path $VersionFile) {
        foreach ($line in Get-Content -Path $VersionFile) {
            if ($line -match "^$manifestField`:\s*(.+)$") { return $Matches[1].Trim() }
        }
    }
    return ""
}

# Write the install manifest. Field set is byte-identical with the .sh script.
function Write-Manifest {
    param([string]$skInstalled, [string]$skRequested, [string]$baseVer, [string]$overlayVer)
    if ($DryRun) { Write-DryRun "write manifest to '$VersionFile'"; return }
    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    $ts = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ" -AsUTC)
    @"
# Regnology Agent Stack manifest
installed_at: $ts
spec_kitty_version: $skInstalled
spec_kitty_requested_version: $skRequested
base_pack_version: $baseVer
overlay_pack_version: $overlayVer
platform: $Platform
"@ | Set-Content -Path $VersionFile -Encoding UTF8
    Write-Ok "Manifest written to $VersionFile"
}

# ===========================================================================
# PHASE: resolve — version tokens (injected vs fallback/unpinned)
# ===========================================================================

Write-Phase "resolve" "Resolving component versions"

if (Test-Placeholder $SpecKittyVersionToken) {
    $FallbackMode = $true
    $SkResolved   = Read-DefaultSkVersion
    $SkRequested  = "default"
    Write-Warn "Running in fallback/unpinned mode (tokens not injected)."
    Write-Info "spec-kitty -> $(Get-SkInstallSpec $SkResolved) (default); packs -> latest aliases"
} else {
    $FallbackMode = $false
    $SkResolved   = $SpecKittyVersionToken
    $SkRequested  = $SpecKittyVersionToken
    Write-Info "Running in injected/pinned mode (release $ReleaseTagToken)."
}

if (Test-Placeholder $OverlayPackVersionToken) { $OverlayVer = "latest" } else { $OverlayVer = $OverlayPackVersionToken }
if (Test-Placeholder $BasePackVersionToken)    { $BaseVer    = "latest" } else { $BaseVer    = $BasePackVersionToken }

# Explicit CLI overrides win over resolution.
if ($SpecKittyVersion) { $SkResolved = $SpecKittyVersion; $SkRequested = $SpecKittyVersion }
if ($PackVersion)      { $BaseVer = $PackVersion; $OverlayVer = $PackVersion }

# Build endpoint URLs from the data-model templates.
if ($ArtefactoryRepo -and $ArtefactoryPath) {
    $ArtifactoryBase = "$ArtefactoryUrl/$ArtefactoryRepo/$ArtefactoryPath"
} elseif ($PackRepoPath) {
    $ArtifactoryBase = "$ArtefactoryUrl/$PackRepoPath"
} else {
    $ArtifactoryBase = "$ArtefactoryUrl"
}

$BaseArchiveName    = "$BasePackName-$BaseVer.tar.gz"
$OverlayArchiveName = "$OverlayPackName-$OverlayVer.tar.gz"
# Base payload comes from the upstream root; overlay from this repo's Artifactory.
$BaseUrl       = "$BaseUpstream/$BaseArchiveName"
$BaseShaUrl    = "$BaseUrl.sha256"
$OverlayUrl    = "$ArtifactoryBase/$OverlayArchiveName"
$OverlayShaUrl = "$OverlayUrl.sha256"

$BaseArchive    = Join-Path $TmpDir $BaseArchiveName
$BaseSha        = Join-Path $TmpDir "$BaseArchiveName.sha256"
$OverlayArchive = Join-Path $TmpDir $OverlayArchiveName
$OverlaySha     = Join-Path $TmpDir "$OverlayArchiveName.sha256"

Write-Info "Resolved: spec-kitty=$SkResolved base=$BasePackName@$BaseVer overlay=$OverlayPackName@$OverlayVer"

# ===========================================================================
# PHASE: idempotency — short-circuit when the stack is already satisfied
# ===========================================================================

Write-Phase "idempotency" "Checking for an already-satisfied stack"

$Satisfied     = $true
$CurSkVersion  = ""
if (Get-Command spec-kitty -ErrorAction SilentlyContinue) {
    $CurSkVersion = ((spec-kitty --version 2>$null) -split '\s+' | Where-Object { $_ } | Select-Object -Last 1)
    if ($CurSkVersion -ne $SkResolved) { $Satisfied = $false }
} else {
    $Satisfied = $false
}

# Packs: only verifiable when pinned to a concrete (non-"latest") version.
if ($BaseVer -eq "latest") {
    $Satisfied = $false
} elseif (-not (Test-Path $BasePackDir) -or (Get-RecordedPackVersion $BasePackDir "base_pack_version") -ne $BaseVer) {
    $Satisfied = $false
}
if ($OverlayVer -eq "latest") {
    $Satisfied = $false
} elseif (-not (Test-Path $OverlayPackDir) -or (Get-RecordedPackVersion $OverlayPackDir "overlay_pack_version") -ne $OverlayVer) {
    $Satisfied = $false
}

if ($Satisfied -and -not $DryRun) {
    Write-Ok "Stack already satisfied — spec-kitty $CurSkVersion, packs at expected versions."
    Write-Info "No reinstall performed (idempotent re-run)."
    Write-Manifest $CurSkVersion $SkRequested $BaseVer $OverlayVer
    exit 0
}
Write-Info "Stack not fully satisfied — proceeding with install."

# ===========================================================================
# PHASE: preflight — bounded-timeout probes (base first, then overlay)
# ===========================================================================

Write-Phase "preflight" "Probing endpoints before any download"

if (-not $BaseUpstream -and -not $DryRun) {
    Write-FailBlock "preflight" "base" $BaseUrl "missing {base_upstream} configuration" `
        "Set REGNOLOGY_BASE_UPSTREAM (or -BaseUpstream) to the upstream all-company root."
    exit 3
}

# C-005: base before overlay, both before any download.
Invoke-PreflightLayer "base" $BaseUrl
Invoke-PreflightLayer "overlay" $OverlayUrl

# ===========================================================================
# PHASE: integrity — download payloads + .sha256, verify BEFORE extraction
# ===========================================================================

Write-Phase "integrity" "Downloading and verifying payloads (no extraction yet)"

if (-not $DryRun -and -not (Test-Path $TmpDir)) { New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null }

# Base first.
Invoke-Download $BaseUrl $BaseArchive "$BasePackName archive"
Invoke-Download $BaseShaUrl $BaseSha "$BasePackName checksum"
Test-Checksum "base" $BaseArchive $BaseSha $BaseArchiveName

# Then overlay.
Invoke-Download $OverlayUrl $OverlayArchive "$OverlayPackName archive"
Invoke-Download $OverlayShaUrl $OverlaySha "$OverlayPackName checksum"
Test-Checksum "overlay" $OverlayArchive $OverlaySha $OverlayArchiveName

# ===========================================================================
# PHASE: deps — prerequisites for install/extraction
# ===========================================================================

Write-Phase "deps" "Checking prerequisites"

$PythonExe = $null
foreach ($candidate in @("python3.12", "python", "python3", "py")) {
    try {
        $ver = & $candidate -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null
        $parts = $ver -split '\.'
        if ([int]$parts[0] -ge 3 -and [int]$parts[1] -ge 12) {
            $PythonExe = $candidate
            Write-Ok "Python found: $candidate $ver"
            break
        }
    } catch { }
}
if (-not $PythonExe) {
    Write-Err "Python 3.12+ is required but not found."
    exit 2
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git is required."
    exit 2
}
Write-Ok "git found: $((Get-Command git).Source)"

if (-not (Get-Command tar -ErrorAction SilentlyContinue)) {
    Write-Err "tar is required (Windows 10 1803+/Server 2019+)."
    exit 2
}
Write-Ok "tar found: $((Get-Command tar).Source)"

if (Get-Command pipx -ErrorAction SilentlyContinue) {
    Write-Ok "pipx found: $((Get-Command pipx).Source)"
} else {
    Write-Info "pipx not found — installing via pip..."
    if (-not $DryRun) {
        & $PythonExe -m pip install --user pipx
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Failed to install pipx automatically. Install: pip install --user pipx"
            exit 2
        }
        $userBase = & $PythonExe -c "import site; print(site.getuserbase())"
        $userScripts = Join-Path $userBase "Scripts"
        $env:PATH = "$userScripts;$env:PATH"
        pipx ensurepath | Out-Null
        if (-not (Get-Command pipx -ErrorAction SilentlyContinue)) {
            Write-Err "pipx installed but not on PATH. Add '$userScripts' to PATH and re-run."
            exit 2
        }
        Write-Ok "pipx installed: $((Get-Command pipx).Source)"
    } else {
        Write-DryRun "install pipx (winget preferred, pip fallback)"
    }
}

# ===========================================================================
# PHASE: spec-kitty — install the pinned/fallback CLI version via pipx
# ===========================================================================

$SkInstallSpec = Get-SkInstallSpec $SkResolved
Write-Phase "spec-kitty" "Installing spec-kitty ($SkInstallSpec)"

if (-not $DryRun) {
    pipx install --force "$SkInstallSpec"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "spec-kitty installation failed: $SkInstallSpec"
        exit 5
    }
    $InstalledSkVersion = ((spec-kitty --version 2>$null) -split '\s+' | Where-Object { $_ } | Select-Object -Last 1)
    if (-not $InstalledSkVersion) { $InstalledSkVersion = $SkResolved }
    Write-Ok "spec-kitty installed: $InstalledSkVersion"
    if (-not (Get-Command spec-kitty -ErrorAction SilentlyContinue)) {
        Write-Warn "spec-kitty not yet on PATH — run 'pipx ensurepath' and reload your shell."
    }
} else {
    Write-DryRun "pipx install --force '$SkInstallSpec'"
    $InstalledSkVersion = "$SkResolved (dry-run)"
}

# ===========================================================================
# PHASE: layers — extract verified archives (base -> overlay)
# ===========================================================================

Write-Phase "layers" "Applying doctrine packs (base -> overlay)"

if (-not $DryRun -and -not (Test-Path $PacksDir)) { New-Item -ItemType Directory -Path $PacksDir -Force | Out-Null }

Expand-Pack $BasePackName $BaseArchive $BasePackDir
$InstalledBasePackVersion = $BaseVer
$basePackVerFile = Join-Path $BasePackDir ".pack-version"
if (-not $DryRun -and (Test-Path $basePackVerFile)) {
    $InstalledBasePackVersion = (Get-Content $basePackVerFile -Raw).Trim()
}

Expand-Pack $OverlayPackName $OverlayArchive $OverlayPackDir
$InstalledOverlayPackVersion = $OverlayVer
$overlayPackVerFile = Join-Path $OverlayPackDir ".pack-version"
if (-not $DryRun -and (Test-Path $overlayPackVerFile)) {
    $InstalledOverlayPackVersion = (Get-Content $overlayPackVerFile -Raw).Trim()
}

# ===========================================================================
# PHASE: completion — manifest, cleanup, next steps
# ===========================================================================

Write-Phase "completion" "Writing manifest and cleaning up"

Write-Manifest $InstalledSkVersion $SkRequested $InstalledBasePackVersion $InstalledOverlayPackVersion

if (-not $DryRun -and (Test-Path $TmpDir)) { Remove-Item -Recurse -Force $TmpDir }

Write-Host ""
Write-Host "Regnology Agent Stack installed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "  spec-kitty:    $InstalledSkVersion  (requested: $SkRequested)"
Write-Host "  base pack:     $BasePackName $InstalledBasePackVersion"
Write-Host "  overlay pack:  $OverlayPackName $InstalledOverlayPackVersion"
Write-Host "  install root:  $InstallDir"
Write-Host "  platform:      $Platform"
Write-Host ""
Write-Host "Ensure spec-kitty is on your PATH:" -ForegroundColor Cyan
Write-Host "  pipx ensurepath        # run once, then restart your shell" -ForegroundColor Gray
Write-Host "  spec-kitty --version   # verify" -ForegroundColor Gray
Write-Host ""
Write-Host "Wire the packs into an engagement repo (.kittify/config.yaml):" -ForegroundColor Cyan
Write-Host "  doctrine:" -ForegroundColor Gray
Write-Host "    org:" -ForegroundColor Gray
Write-Host "      packs:" -ForegroundColor Gray
Write-Host "        - name: $BasePackName" -ForegroundColor Gray
Write-Host "          local_path: $PacksDir" -ForegroundColor Gray
Write-Host "          source_type: local" -ForegroundColor Gray
Write-Host "        - name: $OverlayPackName" -ForegroundColor Gray
Write-Host "          local_path: $PacksDir" -ForegroundColor Gray
Write-Host "          source_type: local" -ForegroundColor Gray
