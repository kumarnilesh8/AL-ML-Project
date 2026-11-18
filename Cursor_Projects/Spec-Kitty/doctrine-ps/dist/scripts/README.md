# Framework Scripts

This directory contains the installer and helper scripts for the Regnology Agent Stack.

> **The install command lives in `docs/HOW_TO_INSTALL.md` (single source of truth).**
> This README documents the scripts themselves and the developer/clone behavior; it
> cross-links the user-facing command rather than duplicating it.

---

## install-regnology-stack.sh / install-regnology-stack.ps1

Bootstrap the full Regnology Agent Stack onto a developer machine. The `.sh` and `.ps1`
scripts are parity twins. Each run executes the same ordered phases:

```
resolve -> idempotency -> preflight -> integrity -> deps -> spec-kitty
        -> layers (base -> overlay) -> completion
```

What a run does:

1. Installs **`spec-kitty-cli`** at a pinned version **globally via `pipx`** — no venv
   activation needed.
2. Downloads, **verifies (`.sha256`)**, and extracts the **`regnology-all-company`**
   doctrine pack as the **base** layer.
3. Downloads, verifies, and extracts the **`ps-agent-enabled-factory`** doctrine pack
   as the Professional Services **overlay** layer.

Layers are always processed **base → overlay** so the overlay wins on conflict:

1. `regnology-all-company` (all-company base)
2. `ps-agent-enabled-factory` (PS departmental overlay)

### Two source roots

The two layers come from two different roots (see `docs/HOW_TO_INSTALL.md` for detail):

- **Overlay** (`ps-agent-enabled-factory`): published by **this** repository to its
  Artifactory path `{base}` = `${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}`.
- **Base** (`regnology-all-company`): published by the **upstream** all-company pipeline
  and fetched from `{base_upstream}` = `${REGNOLOGY_BASE_UPSTREAM}` (no host hardcoded).

**Artifactory is the only automatic payload source.** Bitbucket hosts these scripts for
discovery and manual download only — there is **no payload failover** to Bitbucket if
Artifactory is unreachable.

### One-command install

See **`docs/HOW_TO_INSTALL.md`**. The published entrypoint names are
`install-regnology-stack-latest.sh` and `install-regnology-stack-latest.ps1` (with
versioned `install-regnology-stack-<version>.{sh,ps1}` aliases), matching what the
Jenkins pipeline publishes.

### Build-time injection & developer/clone fallback

The scripts carry four placeholder tokens (`@SPEC_KITTY_VERSION@`,
`@OVERLAY_PACK_VERSION@`, `@BASE_PACK_VERSION@`, `@RELEASE_TAG@`):

- **Published (injected) script** — the Jenkins tag build substitutes the tokens with
  concrete versions from `config/release-map.yaml`. The result is deterministic and
  contains no remaining `@…@` placeholders.
- **In-repo script run from a clone (fallback / unpinned)** — the placeholders are
  intact, so the script logs `fallback/unpinned mode` and resolves to the default
  `spec-kitty` version (read from `config/release-map.yaml`
  `default_spec_kitty_version`, currently **`main`** — the GitHub active-development
  branch, installed via `pipx install git+…@main`; a built-in `main` is used if the
  map is not reachable) plus the `latest` pack aliases for both layers. A digit-leading
  value (e.g. `3.2.1`) is treated as a PyPI release instead.

> The base pack version is pinned to `1.0.0` in `config/release-map.yaml`, resolved
> from the upstream `regnology-all-company` source of truth (`RFG/skills`,
> `pack/.pack-version`). Re-pin it there when upstream cuts a new validated release.

### Unix / macOS options

```bash
./install-regnology-stack.sh [OPTIONS]
```

| Flag | Default | Description |
|---|---|---|
| `--spec-kitty-version VER` | `default_spec_kitty_version` (`main`) | spec-kitty version: a PyPI release (e.g. `3.2.1`) or a git ref (`main`, branch, SHA) |
| `--pack-version VERSION` | injected, else `latest` | Override **both** pack versions (base + overlay) |
| `--install-dir DIR` | `~/regnology-agent-stack` | Installation root |
| `--artefactory-url URL` | — | Artifactory base URL (`{base}` part 1) |
| `--artefactory-repo REPO` | — | Artifactory repo (`{base}` part 2) |
| `--artefactory-path PATH` | — | Artifactory path (`{base}` part 3) |
| `--pack-repo-path PATH` | — | Combined repo/path (`{base}` parts 2+3, back-compat) |
| `--base-upstream URL` | — | Upstream all-company root (`{base_upstream}`) |
| `--artefactory-token TOKEN` | `$REGNOLOGY_ARTEFACTORY_TOKEN` | API token (prefer the env var) |
| `--dry-run` | — | Show what would be done without changes |

`--spec-kitty-ref` is accepted as a back-compat alias for `--spec-kitty-version`.

### Windows (PowerShell) options

```powershell
.\install-regnology-stack.ps1 [OPTIONS]
```

Parameters mirror the shell flags: `-SpecKittyVersion`, `-PackVersion`, `-InstallDir`,
`-ArtefactoryUrl`, `-ArtefactoryRepo`, `-ArtefactoryPath`, `-PackRepoPath`,
`-BaseUpstream`, `-ArtefactoryToken`, `-BasePackName`, `-OverlayPackName`, `-DryRun`.

### Environment variables (both scripts)

| Variable | Description |
|---|---|
| `REGNOLOGY_ARTEFACTORY_TOKEN` | API token for authenticated downloads (read from env only) |
| `ARTEFACTORY_URL` / `REGNOLOGY_ARTEFACTORY_URL` | Artifactory base URL (`{base}` part 1) |
| `ARTEFACTORY_REPO` / `REGNOLOGY_ARTEFACTORY_REPO` | Artifactory repo (`{base}` part 2) |
| `ARTEFACTORY_PATH` / `REGNOLOGY_ARTEFACTORY_PATH` | Artifactory path (`{base}` part 3) |
| `REGNOLOGY_PACK_REPO_PATH` | Combined repo/path (`{base}` parts 2+3, back-compat) |
| `REGNOLOGY_BASE_UPSTREAM` | Upstream all-company distribution root (`{base_upstream}`) |
| `REGNOLOGY_STACK_DIR` | Installation root for the doctrine pack layers |
| `REGNOLOGY_BASE_PACK_NAME` | Base layer pack name (default: `regnology-all-company`) |
| `REGNOLOGY_OVERLAY_PACK_NAME` | Overlay layer pack name (default: `ps-agent-enabled-factory`) |

Tokens are read from environment variables **only** — never committed or echoed. Show
the variable name; never paste a real token value.

### Artifactory layout

`{base}` = `${ARTEFACTORY_URL}/${ARTEFACTORY_REPO}/${ARTEFACTORY_PATH}` holds the
overlay archives, installer scripts, and the guide:

```
{base}/
  ps-agent-enabled-factory-latest.tar.gz      # latest PS overlay archive
  ps-agent-enabled-factory-latest.zip         # latest PS overlay archive (zip)
  ps-agent-enabled-factory-<version>.tar.gz   # versioned PS overlay archive
  ps-agent-enabled-factory-<version>.zip      # versioned PS overlay archive (zip)
  <each archive above>.sha256                 # detached checksum (verified before extract)
  install-regnology-stack-latest.sh           # installer (Unix/macOS, latest)
  install-regnology-stack-latest.ps1          # installer (Windows, latest)
  install-regnology-stack-<version>.sh        # installer (Unix/macOS, versioned)
  install-regnology-stack-<version>.ps1       # installer (Windows, versioned)
  install-regnology-stack-*.{sh,ps1}.sha256   # detached installer checksums
  HOW_TO_INSTALL.md                           # installation guide
```

`{base_upstream}` = `${REGNOLOGY_BASE_UPSTREAM}` holds the base archives, published by
the upstream pipeline (not this CI):

```
{base_upstream}/
  regnology-all-company-<version>.tar.gz      # base archive
  regnology-all-company-<version>.tar.gz.sha256
```

### Installed directory structure

```
~/regnology-agent-stack/
  .stack-version                # install manifest (YAML)
  packs/
    regnology-all-company/      # extracted base pack (applied first)
      directives/ tactics/ styleguides/ agent_profiles/ org-charter.yaml ...
    ps-agent-enabled-factory/   # extracted PS overlay pack (applied second)
      directives/ tactics/ styleguides/ agent_profiles/ org-charter.yaml ...

~/.local/bin/
  spec-kitty                    # global binary placed by pipx (Unix/macOS)

%USERPROFILE%\.local\bin\
  spec-kitty.exe                # global binary placed by pipx (Windows)
```

### After installation

```bash
# Add spec-kitty to PATH:
pipx ensurepath
source ~/.bashrc

# Verify:
spec-kitty --version

# Set up an engagement repo:
cd /path/to/your-engagement-repo
spec-kitty init .
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

### Upgrading

Re-run the installer to update (it is idempotent):

```bash
./install-regnology-stack.sh
```

To upgrade spec-kitty independently:

```bash
pipx upgrade spec-kitty-cli
```

---

## Legacy framework scripts

### framework_install.sh

Installs the older zip-based framework into a target repository.

```bash
./framework_install.sh RELEASE_DIR TARGET_DIR [--dry-run] [--verbose]
```

### framework_upgrade.sh

Upgrades an existing older framework installation while preserving local customizations.

```bash
./framework_upgrade.sh RELEASE_DIR TARGET_DIR [--dry-run] [--plan] [--verbose]
```

These scripts are preserved for backward compatibility. New installations should
use `install-regnology-stack.sh` / `install-regnology-stack.ps1` instead.

---

**Maintained by:** Regnology Professional Services
**Installer version:** 3.0.0
