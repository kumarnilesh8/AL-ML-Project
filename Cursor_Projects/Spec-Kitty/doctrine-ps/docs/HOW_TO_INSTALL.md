<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Regnology Agent Stack — Installation Guide

This guide covers downloading and running the installer to get the full Regnology PS
development environment onto your local machine in one step.

The published installer is the single source of truth for the install command. The
copy in `dist/scripts/README.md` cross-links here rather than duplicating it.

---

## What gets installed

| Component | Source | Location after install |
|---|---|---|
| **spec-kitty CLI** (`spec-kitty-cli`) | PyPI, via `pipx` (global) | `~/.local/bin/spec-kitty` |
| **`regnology-all-company` doctrine pack** (base layer) | Upstream Artifactory root (`{base_upstream}`) | `~/regnology-agent-stack/packs/regnology-all-company/` |
| **`ps-agent-enabled-factory` doctrine pack** (PS overlay) | This repo's Artifactory path (`{base}`) | `~/regnology-agent-stack/packs/ps-agent-enabled-factory/` |

`pipx` isolates spec-kitty in its own venv but places the `spec-kitty` binary on your
global PATH. No manual venv activation is needed.

### Two-layer source model

The doctrine pack is delivered in two layers, applied **base → overlay**:

1. **Base — `regnology-all-company`.** The all-company governance baseline. It is
   published by the **upstream** all-company pipeline and fetched from the upstream
   distribution root `{base_upstream}` (no host is hardcoded in the installer — you
   provide it via configuration). The installer never publishes this layer.
2. **Overlay — `ps-agent-enabled-factory`.** The Professional Services overlay
   published by *this* repository to its Artifactory path `{base}`. It is applied on
   top of the base and may tweak, enhance, or extend it.

The installer always downloads and verifies the **base first, then the overlay**, and
extracts them in the same order so the overlay wins on any conflict.

### Integrity verification

Every payload is published with a **detached `.sha256`** sidecar. The installer
downloads the archive *and* its `.sha256`, computes the digest locally, and compares
it **before extraction**. A mismatch or an empty/invalid sidecar aborts the install
(exit code 6) and the partial download is removed. Nothing is extracted until both
layers pass verification.

### Where the installer is hosted (and the fallback rule)

- **Artifactory is the only automatic runtime payload source.** All archives (base,
  overlay, and their `.sha256` sidecars) are fetched from Artifactory at install time.
- **Bitbucket hosts the script for discovery and manual download only.** There is **no
  payload failover**: if Artifactory is unreachable the installer fails with an
  actionable message — it does **not** silently fetch payloads from Bitbucket or
  anywhere else.

---

## Prerequisites

| Tool | Required version | Install |
|---|---|---|
| Python | **3.12** | [python.org](https://python.org) or OS package manager |
| git | any recent | [git-scm.com](https://git-scm.com) |
| curl / wget | any | OS package manager (Unix/macOS) |
| PowerShell | 5.1+ | Built-in on Windows 10/11 |
| Artifactory API token | — | Request from your team lead |

---

## Release-tag pinning vs. fallback

The installer carries four build-time-injection tokens. How they are resolved depends
on **how you obtained the script**:

- **Published (tagged) installer — pinned & deterministic.** When the Jenkins tag build
  publishes an installer, it substitutes the tokens with the concrete versions from
  `config/release-map.yaml` for that tag. A downloaded, published installer therefore
  installs a **fixed** `spec-kitty-cli` version and **fixed** pack versions every time.
  A published script contains no remaining `@…@` placeholders.
- **In-repo script run from a clone — fallback / unpinned.** If you run the script
  straight out of a checkout, the placeholders are still present. The installer logs
  `fallback/unpinned mode` and uses the documented default `spec-kitty` version
  (currently **`main`** — the GitHub active-development branch, installed via
  `pipx install git+…@main`; a digit-leading value such as `3.2.1` is treated as a
  PyPI release instead) plus the `latest` pack aliases for both layers.

> The base pack version for the current release tag is pinned to **`1.0.0`** in
> `config/release-map.yaml`, resolved from the upstream `regnology-all-company`
> source of truth (`RFG/skills`, `pack/.pack-version`). Re-pin it there whenever
> the upstream base pack cuts a new release that the overlay is validated against.

---

## Step 1 — Configure environment variables

Tokens and endpoints are read from environment variables. The token is **never**
committed or echoed; pass it via the environment so it never appears in shell history.

The Artifactory endpoints follow two templates:

- `{base}`          = `${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}` — the overlay (PS) path.
- `{base_upstream}` = `${REGNOLOGY_BASE_UPSTREAM}` — the upstream all-company root (no host is hardcoded).

| Environment variable | Purpose |
|---|---|
| `REGNOLOGY_ARTEFACTORY_TOKEN` | Artifactory API token (required for authenticated downloads) |
| `ARTEFACTORY_URL` (or `REGNOLOGY_ARTEFACTORY_URL`) | Artifactory base URL — `{base}` part 1 |
| `ARTEFACTORY_REPO` (or `REGNOLOGY_ARTEFACTORY_REPO`) | Artifactory repo — `{base}` part 2 |
| `ARTEFACTORY_PATH` (or `REGNOLOGY_ARTEFACTORY_PATH`) | Artifactory path — `{base}` part 3 |
| `REGNOLOGY_PACK_REPO_PATH` | Combined repo/path — `{base}` parts 2+3 (back-compat) |
| `REGNOLOGY_BASE_UPSTREAM` | Upstream all-company distribution root — `{base_upstream}` |
| `REGNOLOGY_STACK_DIR` | Installation root (default: `~/regnology-agent-stack`) |

```bash
# Unix / macOS
export REGNOLOGY_ARTEFACTORY_TOKEN='<your-api-token>'
export ARTEFACTORY_URL='https://artifactory.regnology.net/artifactory'
export ARTEFACTORY_REPO='ps-tooling-generic-local'
export ARTEFACTORY_PATH='doctrine-pack'
export REGNOLOGY_BASE_UPSTREAM='<upstream-all-company-distribution-root>'
```

```powershell
# Windows (PowerShell)
$env:REGNOLOGY_ARTEFACTORY_TOKEN = '<your-api-token>'
$env:ARTEFACTORY_URL  = 'https://artifactory.regnology.net/artifactory'
$env:ARTEFACTORY_REPO = 'ps-tooling-generic-local'
$env:ARTEFACTORY_PATH = 'doctrine-pack'
$env:REGNOLOGY_BASE_UPSTREAM = '<upstream-all-company-distribution-root>'
```

---

## Step 2 — One-command install

Download and run the **published** entrypoint for your platform. The published names
are `install-regnology-stack-latest.sh` and `install-regnology-stack-latest.ps1`
(versioned variants `install-regnology-stack-<version>.{sh,ps1}` are also published).

### macOS / Debian (Linux)

```bash
curl -fsSL \
  -H "X-JFrog-Art-Api: $REGNOLOGY_ARTEFACTORY_TOKEN" \
  "$ARTEFACTORY_URL/$ARTEFACTORY_REPO/$ARTEFACTORY_PATH/install-regnology-stack-latest.sh" \
  -o install-regnology-stack.sh
chmod +x install-regnology-stack.sh
./install-regnology-stack.sh
```

### Windows (PowerShell)

```powershell
$headers = @{ "X-JFrog-Art-Api" = $env:REGNOLOGY_ARTEFACTORY_TOKEN }
Invoke-WebRequest `
  -Uri "$env:ARTEFACTORY_URL/$env:ARTEFACTORY_REPO/$env:ARTEFACTORY_PATH/install-regnology-stack-latest.ps1" `
  -Headers $headers `
  -OutFile "install-regnology-stack.ps1"
.\install-regnology-stack.ps1
```

The installer runs through these ordered phases:
`resolve → idempotency → preflight → integrity → deps → spec-kitty → layers (base → overlay) → completion`.

#### Common options

```bash
# Preview what would happen without making changes:
./install-regnology-stack.sh --dry-run

# Override the spec-kitty-cli version:
./install-regnology-stack.sh --spec-kitty-version 3.2.1

# Override BOTH pack versions (base + overlay):
./install-regnology-stack.sh --pack-version 2.0.0

# Set Artifactory coordinates explicitly (instead of env vars):
./install-regnology-stack.sh \
  --artefactory-url https://artifactory.regnology.net/artifactory \
  --artefactory-repo ps-tooling-generic-local \
  --artefactory-path doctrine-pack \
  --base-upstream <upstream-all-company-distribution-root>

# Pass the token explicitly (prefer the env var):
./install-regnology-stack.sh --artefactory-token '<your-api-token>'

# Custom install location:
./install-regnology-stack.sh --install-dir /opt/regnology-stack
```

```powershell
# PowerShell equivalents:
.\install-regnology-stack.ps1 -DryRun
.\install-regnology-stack.ps1 -SpecKittyVersion 3.2.1
.\install-regnology-stack.ps1 -PackVersion 2.0.0
.\install-regnology-stack.ps1 -BaseUpstream <upstream-all-company-distribution-root>
.\install-regnology-stack.ps1 -InstallDir "C:\tools\regnology"
```

---

## Step 3 — Add spec-kitty to your PATH

Run once after installation, then reload your shell:

```bash
# Unix / macOS
pipx ensurepath
source ~/.bashrc     # or: source ~/.zshrc
```

On Windows the installer prints the exact command to add spec-kitty to your user PATH.
Alternatively:

```powershell
[System.Environment]::SetEnvironmentVariable(
    'PATH',
    "$env:USERPROFILE\.local\bin;$([System.Environment]::GetEnvironmentVariable('PATH','User'))",
    'User'
)
```

Verify:

```bash
spec-kitty --version
```

---

## Step 4 — Set up an engagement repo

```bash
cd /path/to/your-engagement-repo
spec-kitty init .

# Register both pack layers in your project config:
cat >> .kittify/config.yaml <<'CFG'
doctrine:
  org:
    packs:
      - name: regnology-all-company
        local_path: ~/regnology-agent-stack/packs
        source_type: local
      - name: ps-agent-enabled-factory
        local_path: ~/regnology-agent-stack/packs
        source_type: local
CFG

spec-kitty doctrine fetch --pack regnology-all-company
spec-kitty doctrine fetch --pack ps-agent-enabled-factory
spec-kitty doctor doctrine
spec-kitty charter interview
```

---

## Supported platforms

First-class, fully automated targets:

| Platform | Package manager assumed |
|---|---|
| **Debian / Ubuntu** | `apt` |
| **macOS** | `brew` |
| **Windows** | `winget` |

**Other Linux distributions are guidance-only.** The installer detects them as
`linux_other` and does not assume a package manager. On those systems, install the
prerequisites manually before running the script:

- Install **Python 3.12** via your distribution's package manager (or `pyenv`).
- Install **pipx** (`python3 -m pip install --user pipx && pipx ensurepath`).
- Ensure `git`, `tar`, and `curl`/`wget` are present.

Once the prerequisites are in place, the one-command install above works the same way.

---

## Token handling

- Tokens are read from **environment variables only** (`REGNOLOGY_ARTEFACTORY_TOKEN`).
- They are **never committed** to a repository and **never echoed** to logs or the
  terminal.
- Prefer the env var over the `--artefactory-token` / `-ArtefactoryToken` flag, which
  may be captured in shell history.
- This guide shows only the **variable name** — never paste a real token value into a
  file, command snippet, or chat.

---

## Upgrading

Re-run the installer at any time. The installer is idempotent — it short-circuits when
the stack is already at the expected versions:

```bash
./install-regnology-stack.sh
```

To upgrade spec-kitty independently:

```bash
pipx upgrade spec-kitty-cli
```

---

## Preflight & integrity failures

The installer probes every endpoint **before** downloading anything, and verifies
checksums **before** extracting. The messages you may see, and their remediations:

| Message you see | Cause | Remediation |
|---|---|---|
| `missing artifact (HTTP 404)` | The requested pack version or repo/path does not exist | Check the pack version and the Artifactory repo/path (and the upstream root for the base layer) |
| `access denied (HTTP 401/403)` | Token missing, expired, or lacks read entitlement | Check your entitlement and set `REGNOLOGY_ARTEFACTORY_TOKEN` to a valid token |
| `network failure / timeout (HTTP 000)` | Host unreachable within 15s | Check VPN and connectivity to the host |
| `missing {base_upstream} configuration` | `REGNOLOGY_BASE_UPSTREAM` is not set | Set `REGNOLOGY_BASE_UPSTREAM` (or `--base-upstream`) to the upstream all-company root |
| `empty/invalid .sha256 sidecar` | The published checksum file is malformed | Re-publish the artifact with a valid 64-char hex `.sha256` alongside it |
| `SHA-256 mismatch` | Download is corrupt or tampered | Retry, and verify the published checksum; the partial download is removed automatically |

Reminder: Artifactory is the only automatic payload source. A preflight or network
failure means the install stops — there is no automatic Bitbucket payload failover.

---

## Troubleshooting

**`spec-kitty: command not found` after install**

```bash
pipx ensurepath
source ~/.bashrc
```

**`pipx not found`**

The installer attempts to install `pipx` automatically via `pip install --user pipx`.
If that fails:

```bash
pip install --user pipx
export PATH="$HOME/.local/bin:$PATH"
pipx ensurepath
```

**On Windows: `tar: command not found`**

`tar` ships with Windows 10 1803+ and Windows Server 2019+. If unavailable, install a
recent Windows build or use the `.zip` archive variant.

---

## Installed directory layout

```
~/regnology-agent-stack/
  .stack-version              # install manifest (YAML)
  packs/
    regnology-all-company/    # extracted base pack (applied first)
      directives/
      tactics/
      styleguides/
      agent_profiles/
      org-charter.yaml
      ...
    ps-agent-enabled-factory/ # extracted PS overlay pack (applied second)
      directives/
      tactics/
      styleguides/
      agent_profiles/
      org-charter.yaml
      ...

~/.local/bin/
  spec-kitty                  # global pipx binary (Unix / macOS)

%USERPROFILE%\.local\bin\
  spec-kitty.exe              # global pipx binary (Windows)
```

The `.stack-version` manifest records `spec_kitty_version`,
`spec_kitty_requested_version`, `base_pack_version`, `overlay_pack_version`, and
`platform`.

---

For first-time machine setup — directory layout, repo checkout, regnology-mcp, and
the `reg_agents` launcher — see `docs/installation/HOW_TO_SETUP.md`.

For full usage guidance — per-project config, charter interviews, agent profiles,
and multi-developer team setup — see `docs/installation/HOW_TO_USE.md`.
