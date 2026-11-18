---
work_package_id: WP03
title: HOW_TO_USE Restructure
dependencies:
- WP01
requirement_refs:
- FR-006
- FR-007
- FR-008
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-regnology-stack-distribution-pipeline-01KSWHFT
base_commit: 1d208d986a18ad65d2c24872c61365a71ffd75e3
created_at: '2026-05-30T20:10:03.520665+00:00'
subtasks:
- T012
- T013
- T014
- T015
- T016
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "879383"
history: []
agent_profile: curator-carla
authoritative_surface: docs/
execution_mode: code_change
owned_files:
- docs/HOW_TO_USE.md
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Restructure `docs/HOW_TO_USE.md` so the bootstrap installer (`dist/scripts/install-regnology-stack.sh`
and `.ps1`) is the primary setup path for new developers. The existing 6-step
git-clone procedure is preserved verbatim in an Appendix labelled "Manual / Offline
Setup" for air-gapped use. Add a "Keeping the stack current" section explaining the
upgrade flow with `--pack-version latest`. Highlight the `ARTEFACTORY_TOKEN`
environment variable as the recommended secret-passing path, with the `--artefactory-token`
CLI flag explicitly marked as CI/scripted use only.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: A worktree allocated by `finalize-tasks` based on this
  WP's lane in `lanes.json`. Enter the workspace path printed by
  `spec-kitty agent action implement WP03 --agent <your-name>`.

## Context

Decision 5 of `research.md` resolves: installer is the primary path; the manual
path moves to an appendix. The reasons:

- FR-006 explicitly requires the installer be primary
- FR-008 requires retention of the manual path for air-gapped environments
- Deletion would violate FR-008; equal-prominence creates decision paralysis

A security-relevant point from the adversarial review (Sonnet finding S8) is
worked into T013: documenting `--artefactory-token <token>` as a CLI flag trains
users to pass secrets on the command line, where they leak into shell history
and process listings. The env-var pattern is the recommended path.

## Pre-Read

1. Read the existing `docs/HOW_TO_USE.md` in full — its current shape determines
   where Appendix content slots in.
2. Read `dist/scripts/install-regnology-stack.sh` lines 1–80 (parameter
   declarations and help text) to extract the authoritative installer flags.
3. Read `dist/scripts/install-regnology-stack.ps1` parameter block for the
   PowerShell equivalent.
4. Read `dist/scripts/README.md` for examples of how the scripts are documented
   elsewhere (consistency reference).

## Existing Structure (before this WP)

The current `docs/HOW_TO_USE.md` (346 lines) is organised as:

- `## Prerequisites`
- `## Step 1 — Configure the pack in .kittify/config.yaml` (3 options: local clone, team-shared, git auto-fetch)
- `## Step 2 — Fetch and verify`
- `## Step 3 — Run the charter interview`
- `## Step 4 — Complete the charter interview`
- `## Team lead checklist`
- `## Extending the pack for your project`
- `## Troubleshooting`

The git-clone-based path (existing Steps 1–2) is what the installer replaces.
The charter interview (existing Steps 3–4) is unchanged work that follows
installation; it collapses into a single "Step 2" in the new structure.

## Target Structure (after this WP)

```
# How To Use the Regnology Agent Stack

## What the pack gives you            (kept — existing intro)

## Prerequisites
  (T012: drop "spec-kitty ≥ 3.1 installed" line — installer handles it)

## Step 1 — Run the bootstrap installer
  (T013 — new: Unix one-liner, Windows one-liner, env-var token guidance,
   version pinning example)

## Step 2 — Set up an engagement repo
  (T014 — merge of former Step 3 + Step 4: charter interview workflow,
   prerequisite line reads "After Step 1 completes")

## Keeping the stack current
  (T014 — new: re-run installer with --pack-version latest; idempotency note)

## Team lead checklist
  (T014 — updated: drop "clone the doctrine repo" steps; issue API keys instead)

## Extending the pack for your project   (kept verbatim)

## Troubleshooting
  (T016: add 401, 404, truncated-archive, PowerShell-execution-policy entries;
   move git-clone troubleshooting under "Manual setup only" or Appendix)

## Appendix: Manual / Offline Setup
  (T015: former Step 1 (config.yaml) + former Step 2 (fetch) moved here
   verbatim, labelled as fallback for air-gapped use)
```

---

### Subtask T012 [P] — Update Prerequisites section

**Purpose**: Remove the "install spec-kitty separately" step since the bootstrap
installer now handles it.

**Steps**:
1. Locate the existing "Prerequisites" section (lines 41–46 in the current file).
   The existing list is:
   - `spec-kitty ≥ 3.1 installed and on PATH`
   - `SSH key registered on Bitbucket`
   - `An engagement repo already initialised`

2. Replace with this list:
   - Network access to Regnology Artefactory (or an offline pack archive — see Appendix)
   - An Artefactory API key (issued by your team lead — see Step 1)
   - Python 3.x available on PATH (the installer creates the venv)
   - A Unix shell **or** PowerShell 5.1+
   - An engagement repo already initialised (`spec-kitty init .` after Step 1 completes is fine)

3. Note: the SSH-to-Bitbucket prerequisite drops out because the installer
   pulls from Artefactory over HTTPS, not Bitbucket over SSH. The Bitbucket
   route survives only via the Appendix path.

**Files**:
- `docs/HOW_TO_USE.md` (existing, ~10 lines updated)

**Validation**:
- [ ] Prerequisites no longer mentions a separate spec-kitty pip install
- [ ] Prerequisites lists: Python 3, git, shell, network to Artefactory, API key

---

### Subtask T013 [P] — Step 1: Bootstrap installer

**Purpose**: Make the installer the visually-dominant primary path with
copy-pasteable one-liners for both platforms and explicit env-var guidance for
tokens.

**Steps**:
1. After "Prerequisites", insert "Step 1 — Run the bootstrap installer" as the
   first major step.

2. Write the section with this structure:

   ```markdown
   ## Step 1 — Run the bootstrap installer

   The bootstrap installer creates a self-contained `~/regnology-agent-stack/`
   directory containing a Python virtualenv, the `spec-kitty` CLI, and the
   doctrine pack. It is the recommended setup path.

   **Set your Artefactory API token first** (recommended: environment variable):

   ```bash
   # Unix / macOS
   export ARTEFACTORY_TOKEN='<your-api-key>'

   # Windows (PowerShell)
   $env:ARTEFACTORY_TOKEN = '<your-api-key>'
   ```

   > **Security note**: Pass the token via `ARTEFACTORY_TOKEN` as shown above.
   > The installer also accepts `--artefactory-token <value>`, but that path
   > stores the secret in shell history and process listings — use it only
   > from a CI runner where neither is observable.

   **Run the installer:**

   ```bash
   # Unix / macOS — latest stable
   curl -sL https://artefactory.regnology.net/artifactory/spec-kitty-packs/install-regnology-stack.sh | sh

   # Or with an explicit pack version (recommended for reproducibility)
   curl -sL .../install-regnology-stack.sh | sh -s -- --pack-version 1.2.0
   ```

   ```powershell
   # Windows (PowerShell 5.1+)
   irm https://artefactory.regnology.net/artifactory/spec-kitty-packs/install-regnology-stack.ps1 | iex

   # Or with an explicit pack version
   $script = irm https://.../install-regnology-stack.ps1
   & ([scriptblock]::Create($script)) -PackVersion 1.2.0
   ```

   **Verify the install:**

   ```bash
   ~/regnology-agent-stack/bin/spec-kitty doctor doctrine
   # Expected: all artifact counts present
   ```

   **Installer flags** (Unix):

   - `--spec-kitty-version <version>` — pin a spec-kitty version (default: latest stable)
   - `--pack-version <version>` — pin a pack version (default: latest)
   - `--install-dir <path>` — override `~/regnology-agent-stack`
   - `--artefactory-url <url>` — override the default Artefactory base URL
   - `--dry-run` — show what would happen without writing files

   See `./install-regnology-stack.sh --help` for the authoritative flag list.
   ```

3. The exact installer URL path may differ from the placeholder above — check
   `dist/scripts/README.md` for the published path or leave a TODO comment for
   the team lead to fill in once Artefactory is provisioned.

**Files**:
- `docs/HOW_TO_USE.md` (existing, ~80 lines added)

**Validation**:
- [ ] Step 1 references `install-regnology-stack.sh` and `.ps1` by name
- [ ] Environment-variable token pattern is the dominant example
- [ ] CLI `--artefactory-token` flag is mentioned with a security caveat
- [ ] Both Unix and Windows one-liners are present
- [ ] Verification command (`spec-kitty doctor doctrine`) included

---

### Subtask T014 [P] — Step 2, Keeping current, Team lead checklist

**Purpose**: Bridge installer setup to engagement work; add the upgrade flow;
update team-lead steps to reference the installer.

**Steps**:
1. **Step 2 — Set up an engagement repo** (NEW, but built from existing content):
   the existing file has Steps 3 ("Run the charter interview") and Step 4
   ("Complete the charter interview") covering the same workflow. Collapse
   both into one new "Step 2" that includes:
   - `spec-kitty init .` invocation
   - Charter interview content (now consolidated from old Steps 3 + 4)
   - A line at the top: "After Step 1 completes, run the following in your
     engagement repo:"

   Preserve the substantive content of old Steps 3 + 4 verbatim; only the
   numbering, the prerequisite line, and the section header change.

2. **"Keeping the stack current"** (new section, after Step 2 or after Team
   lead checklist — whichever flows better):

   ```markdown
   ## Keeping the stack current

   To update an existing installation to the latest pack version:

   ```bash
   # Unix / macOS
   ~/regnology-agent-stack/bin/install-regnology-stack --pack-version latest

   # Or pin to a specific version
   ~/regnology-agent-stack/bin/install-regnology-stack --pack-version 1.3.0
   ```

   The installer is idempotent: it replaces the local pack directory in place
   without touching the Python venv, the spec-kitty CLI, or any engagement
   repo configuration.

   To upgrade spec-kitty itself separately:

   ```bash
   ~/regnology-agent-stack/bin/install-regnology-stack --spec-kitty-version 0.12.0
   ```
   ```

3. **Team lead checklist** (existing, updated): replace any "clone the
   regnology-agent-doctrine repo" steps with "issue Artefactory API keys to
   team members and share Step 1 from this doc". Keep team-lead-specific items
   like charter customisation and pack-content review.

**Files**:
- `docs/HOW_TO_USE.md` (existing, ~40 lines added/modified)

**Validation**:
- [ ] Step 2 references "After Step 1" instead of "After cloning"
- [ ] "Keeping the stack current" section exists with `--pack-version latest` example
- [ ] Team lead checklist no longer instructs cloning this repo for end-developer use
- [ ] Idempotency of the installer is explicitly stated

---

### Subtask T015 [P] — Move manual setup to Appendix

**Purpose**: Preserve the manual git-clone path for air-gapped use (FR-008)
without giving it visual prominence.

**Steps**:
1. Take the existing **Step 1 — Configure the pack in `.kittify/config.yaml`**
   (lines 49–139 of the current file; the section with Options A/B/C for local
   sibling clone, team-shared, and git auto-fetch) and the existing **Step 2 —
   Fetch and verify** (lines 142–166). Together these are the manual
   git-clone-based path. Relocate both sections verbatim to a new bottom
   section:

   ```markdown
   ## Appendix: Manual / Offline Setup

   Use this path only when:
   - Artefactory is unreachable (no network or no credentials)
   - You are in an air-gapped environment
   - The bootstrap installer is unavailable

   The procedure below produces the same end state as Step 1, but requires
   manual coordination of spec-kitty version and pack version.

   > Note: The bootstrap installer (Step 1) is the recommended path. The
   > steps below are retained for FR-008 (manual fallback) and are intentionally
   > less polished than Step 1.

   ### Manual Step 1 — Configure the pack in `.kittify/config.yaml`
   (verbatim former Step 1 content — Options A/B/C preserved as written)

   ### Manual Step 2 — Fetch and verify
   (verbatim former Step 2 content)
   ```

2. Do NOT delete or rewrite the manual steps. Preserve them verbatim — only
   relocate and renumber.

3. After the Appendix, add a one-line pointer to the installer help:

   ```markdown
   > For authoritative installer flag reference, run
   > `./install-regnology-stack.sh --help` after Step 1.
   ```

**Files**:
- `docs/HOW_TO_USE.md` (existing, content relocated; no net additions)

**Validation**:
- [ ] Former manual steps appear under "Appendix: Manual / Offline Setup"
- [ ] Appendix opens with an explicit "use this path only when..." preamble
- [ ] Content is preserved verbatim (compare via `git diff` — should be moves,
      not rewrites)
- [ ] `grep -n "git clone" docs/HOW_TO_USE.md` returns only Appendix line numbers

---

### Subtask T016 [P] — Update Troubleshooting

**Purpose**: Add installer-specific troubleshooting scenarios; remove or
demote git-clone troubleshooting.

**Steps**:
1. Locate the existing Troubleshooting section.

2. Add (or update) entries for these installer scenarios:

   - **`401 Unauthorized` from Artefactory during install**: token is missing,
     malformed, or revoked. Verify `$ARTEFACTORY_TOKEN`, regenerate if needed.
   - **`404 Not Found` for pack archive**: the requested `--pack-version` does
     not exist in Artefactory. Run `--pack-version latest` or check
     `pack/.pack-version` on the doctrine repo's `main` for known good versions.
   - **`tar: Exiting with failure status due to previous errors`**: archive is
     truncated. Re-run the installer.
   - **`PowerShell execution policy` error on Windows**: prepend
     `PowerShell -ExecutionPolicy Bypass -File .\install-regnology-stack.ps1`.

3. Move any git-clone-specific troubleshooting (if present) into the Appendix
   troubleshooting subsection, or label them "(Manual setup only)".

**Files**:
- `docs/HOW_TO_USE.md` (existing, ~20 lines added/modified)

**Validation**:
- [ ] Troubleshooting covers 401, 404, truncated archive, Windows execution policy
- [ ] Manual-setup troubleshooting is labeled or relocated to Appendix

---

## Definition of Done

- `docs/HOW_TO_USE.md` opens with installer-led "Step 1"
- `grep -n "install-regnology-stack" docs/HOW_TO_USE.md | head -1` returns
  a line BEFORE the first `git clone` reference
- `ARTEFACTORY_TOKEN` environment variable is documented as recommended;
  `--artefactory-token` CLI flag is labelled CI-only
- "Keeping the stack current" section exists
- Former git-clone steps preserved verbatim in "Appendix: Manual / Offline Setup"
- Troubleshooting includes installer-specific scenarios
- Markdown renders correctly (no broken headings, lists, or fences)

## Risks

| Risk | Mitigation |
|---|---|
| Documentation drifts from actual installer flag set | T013 includes `--help` pointer; T016 references actual error messages |
| Token security guidance is ignored | T013 elevates the env-var pattern to primary; CLI flag is explicitly labelled secondary |
| Manual-setup users feel deprecated | Appendix preamble says "use this path only when..." rather than "this is deprecated" |
| Placeholder Artefactory URLs in examples are wrong | T013 notes that the implementer should verify against `dist/scripts/README.md` |

## Reviewer Guidance

1. Read the diff top-to-bottom; do not just spot-check sections.
2. Confirm visual hierarchy: installer-led path is unambiguously primary.
3. `grep -n "git clone" docs/HOW_TO_USE.md` should return ONLY Appendix line numbers.
4. `grep -n "ARTEFACTORY_TOKEN" docs/HOW_TO_USE.md` should return at least
   one match in Step 1.
5. Confirm the manual-setup content is verbatim from the previous version
   (not rewritten, just moved + renumbered).
6. Confirm the security note about `--artefactory-token` is present in T013.

## Next Steps

After approval, the developer-facing documentation matches the installer
reality. Combined with WP02's Jenkinsfile, the end-to-end flow is operational.

## Activity Log

- 2026-05-30T20:19:35Z – claude:sonnet:curator-carla:implementer – shell_pid=3228318 – Assigned agent via action command
- 2026-06-01T06:38:17Z – claude:sonnet:curator-carla:implementer – shell_pid=3228318 – Stale recovery: no implementation was produced. Moving to for_review to enable replanning.
- 2026-06-01T07:17:12Z – claude:sonnet:curator-carla:implementer – shell_pid=3228318 – Moved to planned
- 2026-06-01T07:17:41Z – claude:sonnet:curator-carla:implementer – shell_pid=868897 – Assigned agent via action command
- 2026-06-01T07:20:34Z – claude:sonnet:curator-carla:implementer – shell_pid=868897 – HOW_TO_USE restructured: installer primary, git-clone in appendix, ARTEFACTORY_TOKEN documented, upgrade section added, troubleshooting updated
- 2026-06-01T07:21:06Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=879383 – Started review via action command
- 2026-06-01T07:23:53Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=879383 – Review passed (cycle-1 was stale-agent no-op, not a content rejection): all acceptance criteria met — installer primary (Step 1), git-clone in Appendix only, ARTEFACTORY_TOKEN documented in Step 1, --artefactory-token labelled CI-only, manual content verbatim, Keeping-current section with idempotency, troubleshooting covers 401/404/truncated/PS-policy, team-lead checklist updated.
