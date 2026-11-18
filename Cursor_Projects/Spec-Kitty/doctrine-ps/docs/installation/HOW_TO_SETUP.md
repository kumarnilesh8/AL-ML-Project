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

# Setting Up Your Regnology PS Development Environment

**Audience:** Developers joining a Regnology PS engagement — follow this guide once on your machine.
This guide is also machine-readable: a Cursor agent can execute it step by step on your behalf.

**What this guide covers:** Directory layout, repository checkout, spec-kitty + doctrine pack
install, regnology-mcp, credentials, and the `reg_agents` launcher alias.

**After this guide:** See [HOW_TO_USE.md](HOW_TO_USE.md) for per-engagement charter setup
(team lead task, once per project).

**Cursor skill:** A companion skill that lets agents execute or diagnose this setup lives at
`tools/surfaces/cursor/skills/regnology-setup/SKILL.md`. It is exported to `.cursor/skills/`
by the spec-kitty surface exporter.

---

## End state

When this guide is complete, your machine will have:

```
~/code/                                  ← all Regnology work in one place
├── _config/                             ← personal agent stack and credentials
│   ├── packs/                           ← doctrine packs (installed by spec-kitty)
│   │   ├── regnology-all-company/
│   │   └── ps-agent-enabled-factory/
│   ├── .regnology.env                   ← your PAT credentials (never committed)
│   ├── AGENTS.md                        ← shared governance file (from team lead)
│   ├── AGENT_ENHANCED_DEVELOPMENT.md    ← agent-enhanced dev guide (from team lead)
│   ├── communication-profile.md         ← your personal preferences (you author this)
│   └── venv/                            ← optional shared Python virtualenv
├── doctrine-ps/            ← governance source repo
├── skills/                              ← all-company doctrine base (rfg/skills)
├── spec-kitty/                          ← spec-kitty source
├── regnology-docgen/                    ← docgen tooling
└── <your-engagement-repos>/
```

`~/code` is used as the example throughout. Substitute your actual parent directory path
wherever you see it. The `_config` name is a convention — keep it so team mates and agents
can refer to it predictably.

---

## Prerequisites

Check these before starting:

```bash
python3 --version      # need 3.12+
node --version         # need 18+ (for regnology-mcp)
npm --version
git --version
spec-kitty --version   # OK if "command not found" — will be installed
```

You also need:
- **Artefactory API token** — request from your team lead
- **Jira, Bitbucket, Confluence PATs** — from each service's Profile → Personal Access Tokens
- SSH key registered on `bitbucket.regnology.net` (`ssh -T git@bitbucket.regnology.net`)

---

## Step 1 — Create the workspace

```bash
mkdir -p ~/code/_config
cd ~/code
```

Everything else in this guide runs from inside `~/code` unless noted.

---

## Step 2 — Clone the required repositories

```bash
cd ~/code

# Governance and tooling repos
git clone ssh://git@bitbucket.regnology.net:7999/raf/doctrine-ps.git
git clone ssh://git@bitbucket.regnology.net:7999/rfg/skills.git
git clone git@github.com:Priivacy-ai/spec-kitty.git
git clone ssh://git@bitbucket.regnology.net:7999/cons/regnology-docgen.git

# Switch the doctrine repo to its active development branch
cd doctrine-ps
git checkout beta
cd ..
```

For engagement project repos: clone them here too as you join each project.

---

## Step 3 — Install spec-kitty

spec-kitty is the governance CLI. Install it globally via `pipx` so it is available in
every project and every shell session.

```bash
# Install pipx if you don't have it
pip install --user pipx
pipx ensurepath
source ~/.bashrc   # or: source ~/.zshrc

# Install spec-kitty from the cloned source (or from PyPI when published)
pipx install ./spec-kitty
```

Verify:

```bash
spec-kitty --version
```

If `spec-kitty: command not found`, run `pipx ensurepath` again, then reload your shell.

---

## Step 4 — Set your Artefactory credentials

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# Regnology Artefactory — required by the doctrine installer
export REGNOLOGY_ARTEFACTORY_TOKEN='<your-api-token>'        # never paste this into a committed file
export ARTEFACTORY_URL='https://artifactory.regnology.net/artifactory'
export ARTEFACTORY_REPO='ps-tooling-generic-local'
export ARTEFACTORY_PATH='doctrine-pack'
export REGNOLOGY_BASE_UPSTREAM='<upstream-base-url-from-team-lead>'
```

Reload your shell after editing the profile:

```bash
source ~/.bashrc    # or source ~/.zshrc
```

---

## Step 5 — Install the doctrine packs

Download the installer and point it at `_config/`:

```bash
cd ~/code

curl -fsSL \
  -H "X-JFrog-Art-Api: $REGNOLOGY_ARTEFACTORY_TOKEN" \
  "$ARTEFACTORY_URL/$ARTEFACTORY_REPO/$ARTEFACTORY_PATH/install-regnology-stack-latest.sh" \
  -o install-regnology-stack.sh
chmod +x install-regnology-stack.sh

# Install into _config — packs land at _config/packs/
./install-regnology-stack.sh --install-dir ~/code/_config
```

The installer:
1. Installs/updates `spec-kitty` globally via `pipx`
2. Downloads and verifies the base pack (`regnology-all-company`) from Artefactory
3. Downloads and verifies the PS overlay pack (`ps-agent-enabled-factory`) from Artefactory
4. Extracts both into `~/code/_config/packs/`

### Verify the packs

```bash
spec-kitty doctor doctrine
```

Expected output:

```
regnology-all-company     (local_path: ~/code/_config/packs/regnology-all-company)
  directives: ...
ps-agent-enabled-factory  (local_path: ~/code/_config/packs/ps-agent-enabled-factory)
  directives: ...
```

---

## Step 6 — Install regnology-mcp

The regnology-mcp server lets agents interact with Jira, Bitbucket, and Confluence. Install
it globally so it is available across all projects.

```bash
# Install from source (until npm package is published)
cd ~/code
git clone ssh://git@bitbucket.regnology.net:7999/cons/regnology-mcp.git  # if not already present

cd regnology-mcp
npm install
npm run build    # compiles TypeScript → dist/

# Make it globally available (optional: add an npm link or use the absolute path in mcp.json)
npm install -g .
```

> If you prefer not to install globally, note the absolute path to `dist/index.js` — you will
> need it in Step 7.

---

## Step 7 — Configure MCP credentials

### 7a — Create `.regnology.env`

Copy the template from the PS pack:

```bash
cp ~/code/_config/packs/ps-agent-enabled-factory/templates/setup/.env.regnology-mcp \
   ~/code/_config/.regnology.env
```

Open `~/code/_config/.regnology.env` and replace every `YOUR_TOKEN_HERE!` placeholder:

| Variable | What to fill in |
|---|---|
| `JIRA_PAT` | Your Jira Personal Access Token |
| `BITBUCKET_PAT` | Your Bitbucket Personal Access Token |
| `CONFLUENCE_PAT` | Your Confluence Personal Access Token |
| `JIRA_PROJECTS` | Comma-separated project keys for your engagement, e.g. `MIGRATION,ABC` |
| `BITBUCKET_REPOS` | `PROJECT/repo-slug` pairs to scope PR queries |
| `ARTEFACTORY_ACCESS_MODE` | Set to `readwrite` (required for publishing and downloading artefacts) |
| `ARTEFACTORY_API_KEY` | Your JFrog Artefactory API key — generate one at [artifactory.regnology.net/ui/user_profile](https://artifactory.regnology.net/ui/user_profile) under **Identity Tokens** |

Base URLs are pre-filled for `jira.regnology.net`, `bitbucket.regnology.net`, `confluence.regnology.net`.

> **Artefactory API key:** Never share this key in chat, email, or any committed file.
> It grants write access to the Artefactory instance. Treat it with the same care as a password.

> `.regnology.env` must never be committed to any repository. Add it to your global
> git exclude: `echo '*.regnology.env' >> ~/.config/git/ignore`

### 7b — Configure Cursor to use the MCP server

Copy the MCP wiring template into your Cursor config:

```bash
mkdir -p ~/.cursor
cp ~/code/_config/packs/ps-agent-enabled-factory/templates/setup/.cursor/mcp.json \
   ~/.cursor/mcp.json
```

Edit `~/.cursor/mcp.json` — replace the two path placeholders:

```json
{
  "mcpServers": {
    "regnology-mcp": {
      "command": "node",
      "args": [
        "--env-file=/home/<you>/code/_config/.regnology.env",
        "/home/<you>/code/regnology-mcp/dist/index.js"
      ]
    }
  }
}
```

Replace `<you>` with your username, or use absolute paths. Restart Cursor after saving.

Verify in Cursor: **Settings → MCP** — the `regnology-mcp` server should show green.

---

## Step 8 — Set up the `_config` governance files

### 8a — AGENTS.md (provided by team lead)

Your team lead will share the current `AGENTS.md`. Copy it into `_config`:

```bash
cp /path/to/provided/AGENTS.md ~/code/_config/AGENTS.md
```

This file tells agents how to initialize themselves. It points them at the doctrine pack
and required directives. Do not edit it locally — propose changes via the doctrine repo PR.

### 8b — AGENT_ENHANCED_DEVELOPMENT.md (provided by team lead)

Ask your team lead for this file if you do not have it. It explains how agent-enhanced
development works on your engagement: what agents are empowered to do, how to prompt
effectively, and escalation paths.

```bash
cp /path/to/provided/AGENT_ENHANCED_DEVELOPMENT.md ~/code/_config/AGENT_ENHANCED_DEVELOPMENT.md
```

### 8c — Communication profile (you write this)

Create `~/code/_config/communication-profile.md` to tell agents your working style.
Start from this template and edit to match your actual preferences:

```markdown
# My Communication Profile

## Language
English (British)

## Response style
- Concise and direct; no filler phrases
- Bullet points for lists, short paragraphs for prose
- Show me trade-offs, not just recommendations

## Technical level
Senior developer — skip basics, explain non-obvious choices

## Working preferences
- Terminal commands over GUI steps
- State assumptions before proceeding
- Flag blockers immediately rather than working around them
```

---

## Step 9 — Set up the `reg_agents` launcher

This alias opens Cursor with a pre-loaded doctrine bootstrap prompt, so every session
starts with governance context loaded automatically.

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
# Regnology PS — agent-enhanced Cursor launcher
# Opens Cursor in the current directory, pre-prompting doctrine initialization
alias reg_agents='cursor agents --default-prompt "Initialize as described in AGENTS.md in ~/.config/_config, and look for further guidance based on my current directory"'
```

Or, if your Cursor CLI uses a different command format:

```bash
alias reg_agents='cursor --new-window .'
# Then paste the bootstrap prompt manually: "Initialize as described in AGENTS.md..."
```

Check the exact Cursor CLI syntax with `cursor --help`. The goal is an alias that opens
Cursor in your current engagement directory and triggers the `AGENTS.md` bootstrap.

---

## Step 10 — Set up a shared Python virtualenv (optional)

If your engagement uses Python tooling, a shared venv in `_config/` avoids duplication:

```bash
python3 -m venv ~/code/_config/venv
source ~/code/_config/venv/bin/activate
pip install -r /path/to/your/project/requirements.txt
```

Activate from any repo with:

```bash
source ~/code/_config/venv/bin/activate
```

---

## Step 11 — Wire each engagement repo

For each project repo, register the doctrine packs and run the charter interview once.

```bash
cd ~/code/your-engagement-repo

# Initialize spec-kitty (once per repo)
spec-kitty init .

# Register both pack layers
cat >> .kittify/config.yaml <<'CFG'
doctrine:
  org:
    packs:
      - name: regnology-all-company
        local_path: ~/code/_config/packs
        source_type: local
      - name: ps-agent-enabled-factory
        local_path: ~/code/_config/packs
        source_type: local
CFG

spec-kitty doctrine fetch --pack regnology-all-company
spec-kitty doctrine fetch --pack ps-agent-enabled-factory
spec-kitty doctor doctrine
```

Run the charter interview (once per engagement, usually done by the team lead):

```bash
spec-kitty charter interview
spec-kitty charter generate
spec-kitty charter status
```

Commit the generated charter files (`.kittify/charter.md`, `.kittify/config.yaml`) to version
control. See [HOW_TO_USE.md](HOW_TO_USE.md) for the full engagement setup walkthrough.

---

## Step 12 — Final verification

```bash
# Spec-kitty and packs
spec-kitty --version
spec-kitty doctor doctrine

# Cursor MCP (check Settings → MCP in Cursor UI)
# regnology-mcp should show green

# reg_agents alias
source ~/.bashrc
type reg_agents

# _config layout
ls ~/code/_config/
# Should show: packs/  .regnology.env  AGENTS.md  AGENT_ENHANCED_DEVELOPMENT.md  communication-profile.md
```

---

## Keeping the stack current

Re-run the installer at any time — it is idempotent:

```bash
~/code/_config/bin/install-regnology-stack.sh --pack-version latest
```

After upgrading, verify in each engagement repo:

```bash
cd ~/code/your-engagement-repo
spec-kitty doctor doctrine
```

To update spec-kitty itself:

```bash
pipx upgrade spec-kitty-cli
```

---

## Troubleshooting

**`spec-kitty: command not found`**
```bash
pipx ensurepath && source ~/.bashrc
```

**`401 Unauthorized` from Artefactory**
```bash
printenv REGNOLOGY_ARTEFACTORY_TOKEN | head -c 4 ; echo "..."
# If empty or wrong: re-export and re-run the installer
```

**`spec-kitty doctor doctrine` shows 0 artifacts**
Check `.kittify/config.yaml` — `local_path` must point to `~/code/_config/packs`
(the directory that *contains* `regnology-all-company/` and `ps-agent-enabled-factory/`).

**MCP server red in Cursor**
Verify absolute paths in `~/.cursor/mcp.json`. The `dist/index.js` must exist
(`ls ~/code/regnology-mcp/dist/index.js`). Restart Cursor after any path changes.

**Agent does not load doctrine on startup**
- Confirm `AGENTS.md` is present in `~/code/_config/`
- Check that `reg_agents` alias is sourced in your shell profile
- In Cursor, open a new chat and run: `Initialize as described in AGENTS.md`
