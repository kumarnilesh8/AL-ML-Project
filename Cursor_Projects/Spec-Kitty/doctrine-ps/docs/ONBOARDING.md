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

# Onboarding: enrolling a project into the Regnology doctrine pack

The Regnology PS doctrine pack is a spec-kitty org governance bundle; this guide takes a new engineer from a fresh engagement repo to a working install verified by `spec-kitty doctor doctrine`. **Who is this for?**

| Persona | Role |
|---------|------|
| New-engagement Engineer Ed | Installs and configures the pack in a fresh engagement repo |
| Team Lead Tara | Owns engagement governance setup; signs off the charter |

This guide is the engineer-oriented companion to the team-lead setup guide. For the broader governance picture (what the pack contains, charter interview, upgrades), Team Lead Tara should read [`docs/installation/HOW_TO_USE.md`](installation/HOW_TO_USE.md); this guide does not duplicate it.

---

## Prerequisites

| Requirement | Reference / Description |
|-------------|------------------------|
| Artefactory access | Network reach plus an account on `artifactory.regnology.net` |
| Artefactory API token | Set `REGNOLOGY_ARTEFACTORY_TOKEN`, or pass `--artefactory-token` to the installer |
| Python 3 | Required by spec-kitty's virtualenv (the installer creates the venv for you) |
| POSIX shell | `sh`/`bash` to run the installer, with `curl` or `wget` present |
| Network egress | Reach to the Artefactory PyPI proxy plus the pack archive URL |

---

## Walkthrough

### Step 1: Run the bootstrap installer

| Description | Notes |
|-------------|-------|
| Fetch and run `install-regnology-stack.sh` from Artefactory. | Pack lives at `https://artifactory.regnology.net/artifactory`, repo path `ps-tooling-generic-local/doctrine-pack` (). |
| Preview first with `install-regnology-stack.sh --dry-run`. | `--dry-run` prints every action without making changes — confirm the install dir and versions before committing. |
| Run for real: `install-regnology-stack.sh --pack-version latest`. | `--pack-version latest` is the default; pin a version (e.g. `--pack-version 1.2.0`) for reproducible installs. Other flags: `--spec-kitty-version`, `--install-dir`, `--artefactory-url`, `--artefactory-token`. |
| The stack lands in `~/regnology-agent-stack/`. | Layout: `spec-kitty-env/` (venv), `bin/` (spec-kitty shim), and `packs/regnology-default/` (the extracted pack). Override the root with `--install-dir` or `REGNOLOGY_STACK_DIR`. |

### Step 2: Configure config.yaml

| Description | Notes |
|-------------|-------|
| In your engagement repo, add the `doctrine.org.packs` block to `.kittify/config.yaml`. | Use the exact shape below. |
| Point `local_path` at the `packs/` **parent** directory — not at `packs/regnology-default/`. | This is the most common enrollment mistake. `local_path: ~/regnology-agent-stack/packs` (see Troubleshooting C-007). |

```yaml
doctrine:
  org:
    packs:
      - name: regnology-default
        local_path: ~/regnology-agent-stack/packs   # parent directory
        source_type: local
```

### Step 3: Verify the install

| Description | Notes |
|-------------|-------|
| Run `spec-kitty doctor doctrine` in the engagement repo. | This is the single source of truth that enrollment succeeded. |
| Expect: pack `regnology-default` loaded, with directive and agent-profile counts reported. | A healthy run lists the required directives and profiles (see `docs/installation/HOW_TO_USE.md` for the full inventory). |
| A failure looks like: zero artifacts, "pack not found", or a missing-graph/validation error. | Match the symptom to the Troubleshooting section below before re-running. |

---

## Troubleshooting

Each entry below is **Symptom → Cause → Workaround**, sourced from `docs/engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md`.

### C-001 — DRG not auto-compiled

- **Symptom**: The validator or governance dashboard reports no compiled doctrine relation graph (no `graph.yaml`).
- **Cause**: `spec-kitty doctrine pack assemble` does not compile `graph.yaml` from `fragment.yaml`. Authors edit `fragment.yaml` (the authored source of truth); `graph.yaml` is the compiled distribution artifact the validator reads.
- **Workaround**: `pack/drg/graph.yaml` is committed to the pack as the live workaround. Regenerate and commit it on every pack version bump (per A-1/A-4 in the engineering note); no `spec-kitty doctrine pack compile-drg` command exists yet.

### C-005 / C-006 — charter generate/sync drops pack selections (rated High)

- **Symptom**: A governance-inert charter with **no error, warning, or visual indicator** — the charter appears valid, but all required directives from the org pack are silently absent.
- **Cause**: `charter generate` silently drops all org pack governance selections; `charter sync` then reinforces the empty state and overwrites any manual fix. This is rated **High** because the failure is silent, occurs in the highest-traffic scenario (first-time setup), and defeats the primary value of the pack.
- **Workaround**: Edit `charter.md` and `governance.yaml` manually, then **verify** — do **not** blindly re-run `charter sync --force`. Commit the manually fixed files with this warning block at the top:

```yaml
# ⚠ DO NOT run 'spec-kitty charter sync --force' without re-checking
# org pack directives. charter generate/sync drops pack IDs silently.
# See engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md
```

### C-007 — local_path is the packs/ parent

- **Symptom**: Pack not found, or `spec-kitty doctor doctrine` reports zero artifacts.
- **Cause**: `local_path` was set to the pack directory itself (`~/regnology-agent-stack/packs/regnology-default`) instead of its parent.
- **Workaround**: Point `local_path` at `~/regnology-agent-stack/packs` — the parent directory that *contains* `regnology-default/`.

### C-010 — rc32 ContextSources / MissionStepContract

- **Symptom**: A schema or validation error referencing `ContextSources` or `MissionStepContract` on rc32.
- **Cause**: `tool-integrations` were used where toolguides are expected.
- **Workaround**: Use **toolguides**, not `tool-integrations`.

---

## Related Resources

| Resource | Link / Location |
|----------|-----------------|
| Pack README | [`pack/README.md`](../pack/README.md) |
| HOW_TO_SETUP (machine setup) | [`docs/installation/HOW_TO_SETUP.md`](installation/HOW_TO_SETUP.md) |
| HOW_TO_USE (team-lead setup) | [`docs/installation/HOW_TO_USE.md`](installation/HOW_TO_USE.md) |
| Artefactory pack location | `https://artifactory.regnology.net/artifactory` (repo path `ps-tooling-generic-local/doctrine-pack`) |
| Challenge corrections (engineering note) | [`docs/engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md`](engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-02 | Initial onboarding guide: install → configure → verify, with C-001/C-005/C-006/C-007/C-010 troubleshooting. |
