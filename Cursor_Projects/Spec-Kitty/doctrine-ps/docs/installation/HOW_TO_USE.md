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

# How to Use the Regnology PS Doctrine Pack

**Audience:** Team leads and senior developers setting up a new or existing spec-kitty
engagement project to operate under Regnology PS governance.

**TL;DR:** Run the bootstrap installer to lay down `spec-kitty` + the doctrine pack
into `~/regnology-agent-stack/`, then run the charter interview in your engagement
repo. Re-run the installer with `--pack-version latest` to upgrade. The legacy
manual setup procedure survives in the Appendix for air-gapped use.

---

## What the pack gives you

Once installed, every agent operating in your project automatically picks up:

| Governance layer | What it does |
|---|---|
| **8 required directives** | REGNOLOGY_BRANDING, MODEL_DISCIPLINE, APPSEC_COMPLIANCE, CORPORATE_TOOLING, TRACEABLE_DECISIONS, AUDIENCE_ORIENTED_WRITING, VERSION_GOVERNANCE, FRAMEWORK_GUARDIAN |
| **2 required toolguides** | `agentic-model-leaderboard`, `regnology-mcp` — consulted during model selection and Jira/Confluence operations |
| **6 agent profiles** | Regnology-specific or Regnology-enhanced roles: datamodel-darren, devops-danny, gemini-bot-georgia, powershell-peter, receptionist-rob, sqlx-specialist-simon |
| **Coding styleguides** | java-conventions, python-conventions, domain-driven-naming, regnology-branding, jira-conventions, sqlx-coding-standards, sqlx-test-data-conventions |
| **Tactics and paradigms** | Full DDD, AppSec, SQLX, and communication tactic set |
| **Glossary** | 8-domain Regnology terminology pack |

The `org-charter.yaml` pre-fills the charter interview with mid-tier model defaults and
Regnology branding so new projects start correctly without manual answers.

### Migration note: `regnology-default` -> `ps-agent-enabled-factory`

The active pack slug is now `ps-agent-enabled-factory`. Consumers should update
installer artifact names, `.kittify/config.yaml` pack names, installed pack
directories, and `spec-kitty doctrine fetch --pack` commands to use the new slug.
The old slug, `regnology-default`, may still appear in historical engineering
notes, retrospectives, and archived command output; treat those occurrences as
historical references rather than active setup guidance.

Artifact path implication: active stack installs now resolve under
`~/regnology-agent-stack/packs/ps-agent-enabled-factory/`. If an engagement repo
still points to `~/regnology-agent-stack/packs/regnology-default/`, update the
pack name and path together, then re-run
`spec-kitty doctrine fetch --pack ps-agent-enabled-factory` followed by
`spec-kitty doctor doctrine`.

---

## Prerequisites

- Network access to Regnology Artefactory (or an offline pack archive — see the Appendix)
- An Artefactory API key (issued by your team lead — see Step 1)
- Python 3.x available on PATH (the installer creates the venv)
- A Unix shell **or** PowerShell 5.1+
- An engagement repo already initialised (`spec-kitty init .` after Step 1 completes is fine)

---

## Step 1 — Run the bootstrap installer

The bootstrap installer creates a self-contained `~/regnology-agent-stack/`
directory containing a Python virtualenv, the `spec-kitty` CLI, and the
`ps-agent-enabled-factory` doctrine pack. **This is the recommended setup path.**

### 1a — Set your Artefactory API token (recommended: environment variable)

```bash
# Unix / macOS
export REGNOLOGY_ARTEFACTORY_TOKEN='<your-api-key>'   # canonical name used by the installer
export ARTEFACTORY_TOKEN="$REGNOLOGY_ARTEFACTORY_TOKEN"   # convenient short alias
```

```powershell
# Windows (PowerShell)
$env:REGNOLOGY_ARTEFACTORY_TOKEN = '<your-api-key>'
$env:ARTEFACTORY_TOKEN          = $env:REGNOLOGY_ARTEFACTORY_TOKEN
```

> **Security note (read this):** Pass the token via `REGNOLOGY_ARTEFACTORY_TOKEN`
> (or its short alias `ARTEFACTORY_TOKEN`) as shown above. The installer also
> accepts `--artefactory-token <value>`, but that path stores the secret in
> shell history and process listings — use the CLI flag **only** from a CI runner
> where neither shell history nor `ps`-style process listings are observable to
> other users.

### 1b — Run the installer

```bash
# Unix / macOS — latest stable spec-kitty + latest pack
curl -sL https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.sh | sh

# Or with an explicit pack version (recommended for reproducibility)
curl -sL https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.sh | \
    sh -s -- --pack-version 1.0.0
```

```powershell
# Windows (PowerShell 5.1+)
irm https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.ps1 | iex

# Or with an explicit pack version
$script = irm https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.ps1
& ([scriptblock]::Create($script)) -PackVersion 1.0.0
```

> **Pack location**: `https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/`
> Published artifacts: `ps-agent-enabled-factory-<version>.tar.gz`, `ps-agent-enabled-factory-<version>.zip`,
> `ps-agent-enabled-factory-latest.tar.gz`, `ps-agent-enabled-factory-latest.zip`.

### 1c — Verify the install

```bash
# Make the shim discoverable for this shell:
export PATH="$HOME/regnology-agent-stack/bin:$PATH"

spec-kitty --version
spec-kitty doctor doctrine
```

Expected output of `spec-kitty doctor doctrine`:

```
ps-agent-enabled-factory  (local_path: ~/regnology-agent-stack/packs/ps-agent-enabled-factory)
  directives:          15
  tactics:             28
  styleguides:          8
  toolguides:           6
  paradigms:           10
  procedures:           8
  agent_profiles:      14
  org-charter.yaml:    present
```

If `doctor doctrine` shows 0 artifacts or reports the pack as missing, see
[Troubleshooting](#troubleshooting) at the end of this document.

### 1d — Installer flags reference

Most-used flags (Unix `install-regnology-stack.sh`; PowerShell parameter names
in parentheses):

- `--spec-kitty-version <version>` (`-SpecKittyVersion`) — pin a spec-kitty version (default: `latest`)
- `--pack-version <version>` (`-PackVersion`) — pin a pack version (default: `latest`)
- `--install-dir <path>` (`-InstallDir`) — override `~/regnology-agent-stack`
- `--artefactory-url <url>` (`-ArtefactoryUrl`) — override the Artefactory base URL (default: `https://artifactory.regnology.net/artifactory`)
- `--pack-repo-path <path>` — override the repository + subdirectory path (default: `ps-tooling-generic-local/doctrine-pack`)
- `--artefactory-token <token>` (`-ArtefactoryToken`) — **CI use only** (see security note in §1a)
- `--dry-run` (`-DryRun`) — print what would happen without writing files

For the authoritative flag list run:

```bash
~/regnology-agent-stack/bin/install-regnology-stack.sh --help
```

Recognised environment variables (both scripts):

| Variable | Purpose |
|---|---|
| `REGNOLOGY_ARTEFACTORY_URL` | Artefactory base URL (default: `https://artifactory.regnology.net/artifactory`) |
| `REGNOLOGY_ARTEFACTORY_TOKEN` | API token for authenticated downloads |
| `REGNOLOGY_PACK_REPO_PATH` | Repository + subdirectory path (default: `ps-tooling-generic-local/doctrine-pack`) |
| `REGNOLOGY_STACK_DIR` | Installation root directory |

---

## Step 2 — Set up an engagement repo

After Step 1 completes, run the following in your engagement repo to create
the project-level charter and wire the pack into spec-kitty's loader.

```bash
cd /path/to/your-engagement-repo
spec-kitty init .          # only needed once per repo

# Tell spec-kitty where the installed pack lives:
cat >> .kittify/config.yaml <<'CFG'
doctrine:
  org:
    packs:
      - name: ps-agent-enabled-factory
        local_path: ~/regnology-agent-stack/packs    # parent — pack lives at local_path/ps-agent-enabled-factory/
CFG

spec-kitty doctrine fetch --pack ps-agent-enabled-factory
spec-kitty doctor doctrine
```

The charter interview captures project-level governance decisions. Run it once
when starting a new engagement:

```bash
spec-kitty charter interview
```

The pack pre-fills several answers automatically via `org-charter.yaml`:

| Interview question | Pre-filled value | Override? |
|---|---|---|
| Model tier default | `mid` | Yes — set to `premium` for research-heavy projects |
| Branding | `ps-agent-enabled-factory` | No |
| Required directives | All 8 org-mandated directives | No — these are non-negotiable |
| Required toolguides | `agentic-model-leaderboard`, `regnology-mcp` | No |

### Key charter interview questions for a Regnology PS engagement

When running `spec-kitty charter interview`, pay attention to these questions. The pack
pre-fills the org-level answers; the questions below require project-specific input:

| Question | Guidance |
|---|---|
| Primary language / stack | Java 21 (Maven), Python 3.12, or mixed — determines which AppSec tactic variants agents will invoke |
| Jira instance URL | `https://[client].atlassian.net` — agents read this from charter context when creating tickets |
| Jira project key | e.g. `ABC` — used as prefix for all ticket references |
| Sprint cadence | 2-week sprints (default for Regnology PS engagements) |
| ADR directory | `docs/decisions/` (Regnology PS standard) |
| Model tier override | Leave `mid` unless this is a research-heavy engagement |

### After the interview

```bash
spec-kitty charter generate
spec-kitty charter status
spec-kitty charter lint        # optional — detects decay early
```

Commit the generated charter files (`.kittify/charter.md` and any generated YAML
config) to version control. The charter is the project's single source of truth for
governance decisions; team members and agents derive context from it, not from loose
config files.

### Action-scoped doctrine (optional, per-project stopgap)

`spec-kitty charter context --action <specify|plan|implement|review|...> --json` is meant
to return only the directives/tactics relevant to that mission step. As of
**spec-kitty-cli 3.2.4**, that scoping only works from entries hand-authored in **your own**
`.kittify/charter.md` — the pack's `org-charter.yaml` also declares an `activations:` list of
recommended action mappings, but that org-pack-level registry is not yet wired into the
runtime by spec-kitty (tracked upstream:
[Priivacy-ai/spec-kitty#2365](https://github.com/Priivacy-ai/spec-kitty/issues/2365)). Until
that lands, if you want action-scoped surfacing today, paste the block below into a fenced
YAML section of your project's `.kittify/charter.md` (any section — the extractor scans every
fenced block for a top-level `activations:` key) and re-run `spec-kitty charter generate`:

```yaml
activations:
  - activation_context: { mission_type: software-dev, action: specify }
    doctrine_pack_id: ps-agent-enabled-factory
    artifact_id: CONTEXT_AWARE_DESIGN
    artifact_kind: directives
  - activation_context: { mission_type: software-dev, action: review }
    doctrine_pack_id: ps-agent-enabled-factory
    artifact_id: cloud-native-design-review
    artifact_kind: tactics
```

Add more entries following the same shape for any pack directive/tactic you want scoped to a
specific action; see `pack/org-charter.yaml`'s `activations:` block in this repo for the full
recommended mapping (16 entries, covering `CONTEXT_AWARE_DESIGN` and the SQLX/PowerShell/design
tactics). Once the upstream wiring lands, this manual copy step becomes unnecessary — the
org-pack registry will apply automatically and this section will be removed.

### MCP setup for Cursor IDE (regnology-mcp)

The pack ships two setup templates to bootstrap the Regnology MCP server for
Cursor. Credentials are **never committed** — copy the templates locally and
fill in your Personal Access Tokens.

#### Step A — Copy the templates

After fetching the pack, the templates live at:

```
pack/templates/setup/.cursor/mcp.json      # Cursor MCP server wiring
pack/templates/setup/.env.regnology-mcp    # PAT credentials (gitignored)
```

Copy them into your engagement repo (or home directory):

```bash
# From your engagement repo root:
cp "$(spec-kitty doctor doctrine --json | python3 -c "import sys,json; print(json.load(sys.stdin)['packs'][0]['local_path'])")/templates/setup/.cursor/mcp.json" .cursor/mcp.json
cp "$(spec-kitty doctor doctrine --json | python3 -c "import sys,json; print(json.load(sys.stdin)['packs'][0]['local_path'])")/templates/setup/.env.regnology-mcp" .env.regnology-mcp
```

Or copy them manually from your pack install directory
(`~/regnology-agent-stack/packs/ps-agent-enabled-factory/templates/setup/`).

> Make sure `.env.regnology-mcp` is in your `.gitignore` before committing.

#### Step B — Edit `.env.regnology-mcp`

Open the copied `.env.regnology-mcp` and replace every `YOUR_TOKEN_HERE!`
placeholder with your actual PAT. Key fields:

| Variable | What to fill in |
|---|---|
| `JIRA_BASE_URL` | `https://jira.regnology.net` (already set for Regnology Server) |
| `JIRA_PAT` | Your Jira Personal Access Token |
| `BITBUCKET_BASE_URL` | `https://bitbucket.regnology.net` (already set) |
| `BITBUCKET_PAT` | Your Bitbucket Personal Access Token |
| `CONFLUENCE_BASE_URL` | `https://confluence.regnology.net` (already set) |
| `CONFLUENCE_PAT` | Your Confluence Personal Access Token |
| `JIRA_PROJECTS` | Comma-separated project keys for this engagement, e.g. `MIGRATION,PROFSERV` |
| `BITBUCKET_REPOS` | `PROJECT/repo-slug` pairs to scope default PR queries |

#### Step C — Edit `.cursor/mcp.json`

Update the two path placeholders in the copied `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "regnology-mcp": {
      "command": "node",
      "args": [
        "--env-file=/YOUR/PATH/TO/.env.regnology-mcp",
        "/YOUR/PATH/TO/regnology-mcp/dist/index.js"
      ]
    }
  }
}
```

Replace:
- `/YOUR/PATH/TO/.env.regnology-mcp` → absolute path to the `.env.regnology-mcp` you edited above
- `/YOUR/PATH/TO/regnology-mcp/dist/index.js` → absolute path to your local `regnology-mcp` checkout's compiled entry point

Restart Cursor after saving `.cursor/mcp.json` to pick up the new MCP server.

#### Optional: global access mode

By default `ACCESS_MODE=read` in the template (safe for most work). Set
`JIRA_ACCESS_MODE=readwrite` and/or `BITBUCKET_ACCESS_MODE=readwrite` in
`.env.regnology-mcp` to enable write tools (create PR, approve, comment, transition tickets).

See `pack/toolguides/regnology-mcp.toolguide.yaml` for the full configuration reference.

---

## Keeping the stack current

To update an existing installation to the latest pack version, re-run the
installer. It is **idempotent**: it replaces the local doctrine pack directory
in place without touching the Python venv, the `spec-kitty` CLI, or any
engagement-repo configuration.

```bash
# Unix / macOS — latest pack only
~/regnology-agent-stack/bin/install-regnology-stack.sh --pack-version latest

# Pin to a specific pack version
~/regnology-agent-stack/bin/install-regnology-stack.sh --pack-version 1.3.0
```

```powershell
# Windows
& "$env:USERPROFILE\regnology-agent-stack\bin\install-regnology-stack.ps1" -PackVersion latest
```

To upgrade `spec-kitty` itself in the same stack:

```bash
~/regnology-agent-stack/bin/install-regnology-stack.sh --spec-kitty-version 3.3.0
```

To upgrade both at once:

```bash
~/regnology-agent-stack/bin/install-regnology-stack.sh \
    --spec-kitty-version 3.3.0 --pack-version 1.3.0
```

After upgrading, re-run `spec-kitty doctor doctrine` in each engagement repo to
confirm the new artifact counts. Consider pinning a specific `--pack-version`
during a delivery sprint to prevent surprise governance changes; bump it
deliberately at sprint boundaries.

---

## Team lead checklist

Run through this checklist when setting up a new engagement or onboarding a new
team member:

### Initial project setup (team lead, once per engagement)

- [ ] Artefactory API keys requested and issued for every developer on the engagement
- [ ] Step 1 installer one-liner shared with the team (link this document)
- [ ] `.kittify/config.yaml` in the engagement repo points to `~/regnology-agent-stack/packs/ps-agent-enabled-factory`
- [ ] `spec-kitty doctor doctrine` shows the expected artifact counts on a reference machine
- [ ] `spec-kitty charter interview` completed with Jira instance URL, project key, language stack, and ADR directory
- [ ] `spec-kitty charter generate` run and charter files committed to version control
- [ ] `docs/decisions/` directory exists for ADRs
- [ ] Team briefed: agents derive project context from the charter; pack changes go via PR to this repo

### Per-developer setup (each team member)

- [ ] Artefactory API key set in shell profile as `REGNOLOGY_ARTEFACTORY_TOKEN`
- [ ] Step 1 bootstrap installer run successfully
- [ ] `~/regnology-agent-stack/bin` added to PATH in shell profile
- [ ] `spec-kitty doctor doctrine` shows the expected artifact counts
- [ ] `.env.regnology-mcp` copied from `pack/templates/setup/` and PATs filled in
- [ ] `.cursor/mcp.json` copied from `pack/templates/setup/.cursor/` and paths updated
- [ ] `.env.regnology-mcp` confirmed present in `.gitignore`
- [ ] Cursor restarted after `mcp.json` change; MCP server shows green in Cursor settings
- [ ] Dev has read the pack README at `pack/README.md` and run `spec-kitty charter status`

### Keeping the pack current (recurring, team lead)

```bash
# Re-run the installer to pull the latest pack
~/regnology-agent-stack/bin/install-regnology-stack.sh --pack-version latest

# Verify in any engagement repo
cd /path/to/engagement-repo
spec-kitty doctor doctrine
```

See "[Keeping the stack current](#keeping-the-stack-current)" for the full
upgrade flow, including pinned-version and combined spec-kitty + pack
upgrades.

---

## Extending the pack for your project

The pack is read-only from the engagement repo's perspective. Project-specific decisions
and context belong in the charter. What belongs where:

| Content | Where it goes |
|---|---|
| Regnology PS governance (directives, tactics, styleguides) | `pack/` in this repo — propose a change via PR |
| Project-specific context (Jira instance, language stack, sprint config, ADR location) | Charter — `spec-kitty charter interview` + `generate` |
| Project ADRs | `docs/decisions/` in the engagement repo |
| MCP credentials | Developer shell profile only — never committed |

Do not copy-edit pack artifacts into your engagement repo. If a pack artifact needs to
change, propose the change to this repository so all Regnology PS projects benefit.

---

## Troubleshooting

### `401 Unauthorized` from Artefactory during install

The Artefactory API token is missing, malformed, or has been revoked. Verify
that `REGNOLOGY_ARTEFACTORY_TOKEN` (or the short alias `ARTEFACTORY_TOKEN`)
is set in the shell that runs the installer:

```bash
printenv REGNOLOGY_ARTEFACTORY_TOKEN | head -c 4 ; echo "..."
```

If the value is empty or stale, request a fresh token from your team lead and
re-export it before re-running the installer.

### `404 Not Found` for pack archive

The `--pack-version` you requested does not exist in Artefactory. Run with
`--pack-version latest` to confirm the network path is correct, or check
`pack/.pack-version` on the doctrine repo's `main` branch for the list of
known-good versions.

### `tar: Exiting with failure status due to previous errors`

The downloaded archive is truncated (interrupted download, proxy buffering,
expired token mid-transfer). Re-run the installer; the installer redownloads
the archive on each run.

### `PowerShell execution policy` error on Windows

If PowerShell refuses to execute the script, invoke it explicitly with a
relaxed policy for the current process only:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\install-regnology-stack.ps1
```

Or, before piping `irm | iex`, set the execution policy for the current
process:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### `spec-kitty doctor doctrine` shows 0 artifacts

The pack `local_path` in `.kittify/config.yaml` does not point to a directory
containing pack artifact subdirectories (`directives/`, `tactics/`, etc.).
After running Step 1, the expected path is
`~/regnology-agent-stack/packs/ps-agent-enabled-factory`. Verify:

```bash
ls ~/regnology-agent-stack/packs/ps-agent-enabled-factory
# Should show: directives  tactics  styleguides  toolguides  ...
```

### `OrgPackMissingError` on any spec-kitty command

The directory at `local_path` does not exist. Re-run Step 1 (or, if you are
using the Appendix path, run `spec-kitty doctrine fetch --pack ps-agent-enabled-factory`).

### Agent is not respecting a pack directive

Verify the pack is loaded and the directive is in `required_directives`:

```bash
spec-kitty doctor doctrine --json | python3 -m json.tool | grep -A5 "required_directives"
```

If the directive is present but the agent ignores it, check whether a stale charter
synthesis artifact is shadowing the pack directive. Run `spec-kitty charter lint`
to detect decay.

### Charter interview does not show Regnology-pre-filled answers

The charter interview reads pre-fills from `org-charter.yaml` via the loaded pack.
If the pack is not loaded at interview time, the pre-fills are absent. Run
`spec-kitty doctor doctrine` before `spec-kitty charter interview` to confirm the
pack is active.

### Manual-setup troubleshooting

The troubleshooting entries below apply only to the **Appendix: Manual /
Offline Setup** path. If you used the Step 1 installer, these do not apply.

**(Manual setup only) `local_path` does not resolve.** The path resolves to
the doctrine repo root instead of its `pack/` subdirectory. Append `/pack` to
the `local_path` value in `.kittify/config.yaml`.

**(Manual setup only) SSH to Bitbucket fails.** Re-check your SSH key
registration:

```bash
ssh -T git@bitbucket.regnology.net
```

If the greeting does not appear, register your key with Bitbucket before
attempting the manual clone.

---

## Appendix: Manual / Offline Setup

Use this path only when:

- Artefactory is unreachable (no network or no credentials)
- You are in an air-gapped environment
- The bootstrap installer is unavailable

The procedure below produces the same end state as Step 1, but requires
manual coordination of the spec-kitty version and the pack version, and a
working SSH path to Bitbucket.

> Note: The bootstrap installer (Step 1) is the recommended path. The steps
> below are retained for FR-008 (manual fallback) and are intentionally less
> polished than Step 1. They reflect the legacy procedure preserved verbatim.

### Manual prerequisites

- spec-kitty ≥ 3.1 installed and on PATH (`spec-kitty --version`)
- SSH key registered on Bitbucket (`ssh -T git@bitbucket.regnology.net` returns a greeting)
- An engagement repo already initialised (`spec-kitty init .` run at least once)

### Manual Step 1 — Configure the pack in `.kittify/config.yaml`

Add a `doctrine.org.packs` block. Choose the layout that matches your setup.

#### Option A — Local sibling checkout (recommended for individual developers)

Clone the doctrine repo once, then point `local_path` at its `pack/` subdirectory:

```bash
# Do this once, outside your engagement repo:
git clone ssh://bitbucket.regnology.net:7999/raf/doctrine-ps.git \
    ~/.regnology/doctrine-pack
```

Then in your engagement repo's `.kittify/config.yaml`:

```yaml
doctrine:
  org:
    packs:
      - name: ps-agent-enabled-factory
        local_path: ~/.regnology/doctrine-pack/pack
```

`~` is expanded at load time. To update, run `git pull` in `~/.regnology/doctrine-pack`.

#### Option B — Team-shared location (recommended for consistent team setups)

Agree on a shared checkout path that all developers clone to the same absolute location.
One option is an ops script (`bootstrap-dev.sh`) that clones or updates the doctrine repo:

```bash
# bootstrap-dev.sh (run by each developer once)
DOCTRINE_DIR="$HOME/.regnology/doctrine-pack"
if [ -d "$DOCTRINE_DIR/.git" ]; then
    git -C "$DOCTRINE_DIR" pull --ff-only
else
    git clone ssh://bitbucket.regnology.net:7999/raf/doctrine-ps.git \
        "$DOCTRINE_DIR"
fi
```

`.kittify/config.yaml` (same as Option A — shared across the team via version control):

```yaml
doctrine:
  org:
    packs:
      - name: ps-agent-enabled-factory
        local_path: ~/.regnology/doctrine-pack/pack
```

#### Option C — Auto-fetch via git source (for CI pipelines and automations)

When `source_type: git` is set, `spec-kitty doctrine fetch` clones the remote repository
directly **into** `local_path`. Because the pack content lives in the `pack/` subdirectory
of the doctrine repo (not at repo root), use a separate clone directory:

```yaml
doctrine:
  org:
    packs:
      - name: ps-agent-enabled-factory
        # spec-kitty clones the full repo here:
        local_path: .kittify/org-packs/doctrine-ps
        source_type: git
        url: ssh://bitbucket.regnology.net:7999/raf/doctrine-ps.git
        ref: main           # or a release tag, e.g. v1.2.0
```

> **Important:** After `spec-kitty doctrine fetch`, the pack artifacts are at
> `.kittify/org-packs/doctrine-ps/pack/` — not at the `local_path` root.
> The loader expects artifacts directly in `local_path`. To use the git-fetch approach,
> update `local_path` to include the `pack` suffix after the initial clone:

```yaml
        local_path: .kittify/org-packs/doctrine-ps/pack
```

> Or use a post-fetch hook or Makefile target to symlink / copy the pack subdir.
> A future distribution pipeline (Artifactory release) will make this unnecessary.

For CI using a short-lived token (HTTPS):

```yaml
        source_type: https
        url: https://bitbucket.regnology.net/rest/api/latest/projects/RAF/repos/doctrine-ps/archive?format=zip
```

Set `GIT_TOKEN` in your CI environment for authentication; spec-kitty injects it automatically.

### Manual Step 2 — Fetch and verify

```bash
spec-kitty doctrine fetch --pack ps-agent-enabled-factory
spec-kitty doctor doctrine
```

Expected output of `doctor doctrine`:

```
ps-agent-enabled-factory  (local_path)
  directives:          15
  tactics:             28
  styleguides:          8
  toolguides:           6
  paradigms:           10
  procedures:           8
  agent_profiles:      14
  org-charter.yaml:    present
```

If `doctor doctrine` shows 0 artifacts or reports the pack as missing, see
[Troubleshooting](#troubleshooting) — in particular the "Manual-setup
troubleshooting" subsection.

> For authoritative installer flag reference (Step 1 path), run
> `~/regnology-agent-stack/bin/install-regnology-stack.sh --help`.
