---
work_package_id: WP01
title: Onboarding Guide
dependencies: []
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-doctrine-discoverability-onboarding-and-drg-dashboard-01KT3R1X
base_commit: 286a269ff2c9b593238a7b8cb619c830707decb8
created_at: '2026-06-02T09:58:49.836719+00:00'
subtasks:
- T001
- T002
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "2206703"
history: []
agent_profile: curator-carla
authoritative_surface: docs/
execution_mode: code_change
owned_files:
- docs/ONBOARDING.md
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load curator-carla
```

Wait for the profile confirmation, then continue with this work package. You are
the curator: this artifact is a **doctrine deliverable**, not a throwaway README.
It is the canonical worked example of the `user-guide-conventions` styleguide, so
it must itself pass the styleguide it demonstrates.

---

## Objective

Author `docs/ONBOARDING.md` — a single authoritative guide for enrolling a new
engagement project into the Regnology doctrine pack. It must:

- Be written **per `pack/styleguides/user-guide-conventions.styleguide.yaml`** (it is
  the canonical worked example of that styleguide — FR-001, C-004).
- Give a new engineer an end-to-end install → configure → verify path they can follow
  **without consulting scattered engineering notes** (Success Criteria).
- Fold in the C-001→C-010 enrollment gotchas as a Troubleshooting section
  (symptom → cause → workaround).
- Pass all six checks of the styleguide `quality_test` (FR-005, NFR-004).

This is Track A and is fully independent of every other WP. One file is touched:
`docs/ONBOARDING.md`.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: a worktree allocated per this WP's lane in
  `lanes.json` by `finalize-tasks`. Enter the workspace path printed by
  `spec-kitty agent action implement WP01 --agent <your-name>`. Do all editing
  inside that worktree; completed work merges back to `overhaul/migrate_to_kitty`.

## Context

Relevant codebase facts (verify each before writing — do not trust this summary alone):

- **Styleguide** — `pack/styleguides/user-guide-conventions.styleguide.yaml` is the
  contract. Its `principles`, `patterns`, `anti_patterns`, and `quality_test` blocks
  are normative. Read the whole file. The six `quality_test` checks are your acceptance
  gate (T002).
- **Branding header** — copy the exact HTML comment block verbatim from the top of
  `docs/HOW_TO_USE.md` (the four-line ASCII Regnology block + "Property of Regnology
  Group GmbH … FOR INTERNAL USE ONLY"). Do not retype it; copy it so the ASCII art is
  byte-identical.
- **Install script (source of truth for flags/URLs)** —
  `dist/scripts/install-regnology-stack.sh`. Its header documents:
  - Default Artefactory base URL: `https://artefactory.regnology.net/artifactory`
    (note the spelling **artefactory** with an `e`).
  - Pack repo path: `ps-tooling-generic-local/doctrine-pack` (env `REGNOLOGY_PACK_REPO_PATH`).
  - Flags: `--spec-kitty-version`, `--pack-version`, `--install-dir`, `--artefactory-url`,
    `--artefactory-token`, `--dry-run`, `--help`.
  - Install layout: `~/regnology-agent-stack/` with `packs/regnology-default/` inside;
    `packs/` is the `local_path` **parent**.
  - The `.kittify/config.yaml` block shape:
    ```yaml
    doctrine:
      org:
        packs:
          - name: regnology-default
            local_path: ~/regnology-agent-stack/packs   # parent directory
            source_type: local
    ```
  - Verification command: `spec-kitty doctor doctrine`.
- **⚠ URL discrepancy to resolve** — this task brief referenced
  `https://artifactory.regnology.net/artifactory/ps-tooling-generic-local/doctrine-pack/install-regnology-stack.sh`
  (spelled *artifactory*, no `e`). The committed install script uses
  `artefactory.regnology.net` (with `e`). **The script is the source of truth.** Use the
  script's spelling and `--dry-run`/flag names. If you cannot reconcile a fact between the
  brief and the script, follow the script and note the discrepancy in your activity log —
  do not invent a URL.
- **Enrollment gotchas** — `docs/engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md`
  is the authoritative source for C-005/C-006 (charter sync footgun, rated High) and the
  fragment-vs-graph distinction (A-1) behind C-001. Read it for the exact wording.
- **HOW_TO_USE.md** — `docs/HOW_TO_USE.md` is the team-lead-oriented setup guide; ONBOARDING.md
  is the *engineer-oriented* companion and links to it under Related Resources. Do not
  duplicate its content — point to it.

---

## Subtask Guidance

### Subtask T001 — Author `docs/ONBOARDING.md`

**Purpose**: Produce the complete onboarding guide, structured exactly as the
`user-guide-conventions` styleguide prescribes, with the enrollment gotchas folded into
Troubleshooting. This is the whole deliverable for the WP.

**Steps**:

1. **Branding header (mandatory — styleguide principle 7).** Open `docs/HOW_TO_USE.md`,
   copy its leading HTML comment block (lines 1–11) verbatim to the top of `docs/ONBOARDING.md`.
   This is the four-line ASCII Regnology block plus the "Property of Regnology Group GmbH …
   FOR INTERNAL USE ONLY" notice. Byte-for-byte copy — the quality_test check 6 looks for it.

2. **Title + one-sentence tool description.** `# Onboarding: enrolling a project into the
   Regnology doctrine pack`, then a single sentence describing what the pack is and what this
   guide gets you to (a working install verified by `spec-kitty doctor doctrine`).

3. **"Who is this for?" persona table (FR-001, styleguide pattern "Persona-first opening").**
   Must appear within the first twenty lines after the header and **before any instruction**.
   At least two named personas:

   | Persona | Role |
   |---------|------|
   | New-engagement Engineer Ed | Installs and configures the pack in a fresh engagement repo |
   | Team Lead Tara | Owns engagement governance setup; signs off the charter |

   Use named personas (not "the user") — the anti-pattern "Generic user audience" must not apply.

4. **Prerequisites table (FR-002, principle 2).** One requirement per row, `Requirement |
   Reference / Description` columns, scannable in under ten seconds. One row each for:

   | Requirement | Reference / Description |
   |-------------|------------------------|
   | Artefactory access | Network reach + an account on `artefactory.regnology.net` |
   | Artefactory API token | Set `REGNOLOGY_ARTEFACTORY_TOKEN` or pass `--artefactory-token` |
   | Python 3 | Required by spec-kitty's venv (the installer creates the venv) |
   | POSIX shell | `sh`/`bash` to run the installer; `curl` or `wget` present |
   | Network egress | Reach to Artefactory PyPI proxy + the pack archive URL |

   Confirm the exact env var name (`REGNOLOGY_ARTEFACTORY_TOKEN`) against the install script.

5. **Numbered steps (FR-003, principle 3 + pattern "Numbered steps with action tables").**
   Each step is a `### Step N: <verb phrase>` heading (sentence case, ≤5 words) followed by a
   `Description | Notes` two-column table. Required steps in order:

   - **Step 1: Run the bootstrap installer** — run `install-regnology-stack.sh` from
     Artefactory. Show the actual invocation using the script's real flag names. Notes column
     covers: `--dry-run` first to preview, `--pack-version latest` default, where the stack
     lands (`~/regnology-agent-stack/`). Cross-check every flag against
     `dist/scripts/install-regnology-stack.sh` — do not guess.
   - **Step 2: Configure `.kittify/config.yaml`** — in the engagement repo, add the
     `doctrine.org.packs` block with `local_path` pointing at the `packs/` **parent**
     directory (NOT `packs/regnology-default/`). Show the exact YAML from the script header.
     Notes column carries the C-007 warning (local_path is the parent — see Troubleshooting).
   - **Step 3: Verify the install** — run `spec-kitty doctor doctrine`. Notes column states the
     expected outcome (pack loaded, directive/profile counts reported) and what a failure looks like.

6. **Troubleshooting section (FR-004, principle on gotchas).** A subsection per gotcha, each as
   **Symptom → Cause → Workaround**. Source the exact wording from the engineering note:
   - **C-001 — DRG not auto-compiled.** Symptom: validator/dashboard reports no compiled graph.
     Cause: `spec-kitty doctrine pack assemble` does not compile `graph.yaml` from
     `fragment.yaml`. Workaround: `graph.yaml` is committed to the pack; regenerate and commit it
     on each pack version bump (per A-1/A-4 in the engineering note).
   - **C-005 / C-006 — charter generate/sync drops pack selections (rated High).** Symptom:
     governance-inert charter, no error, all required directives silently absent. Cause:
     `charter generate` drops org pack governance selections; `charter sync` reinforces the empty
     state. Workaround: edit `charter.md`/`governance.yaml` manually, then **verify** — do NOT
     blindly re-run `charter sync --force`. Reproduce the warning comment block from the note.
   - **C-007 — `local_path` is the `packs/` parent.** Symptom: pack not found / zero artifacts.
     Cause: `local_path` set to the pack dir itself instead of its parent. Workaround: point
     `local_path` at `~/regnology-agent-stack/packs` (the parent that contains
     `regnology-default/`).
   - **C-010 — rc32 ContextSources / MissionStepContract.** Symptom: schema/validation error
     referencing ContextSources or MissionStepContract on rc32. Cause: tool-integrations used
     where toolguides are expected. Workaround: use **toolguides**, not `tool-integrations`.

7. **Related Resources table (FR-005, principle 4).** A table at the foot linking:

   | Resource | Link / Location |
   |----------|-----------------|
   | Pack README | `pack/README.md` |
   | HOW_TO_USE (team-lead setup) | `docs/HOW_TO_USE.md` |
   | Artefactory pack location | `https://artefactory.regnology.net/artifactory` (repo path `ps-tooling-generic-local/doctrine-pack`) |
   | Challenge corrections (engineering note) | `docs/engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md` |

8. **No placeholder tokens.** Replace every `{{PLACEHOLDER}}`-style token with a concrete value
   before finishing. If any value is genuinely unknown, resolve it from the source files rather
   than leaving a token (quality_test check 5 fails on any remaining token).

**Files**:
- `docs/ONBOARDING.md` (new)

**Validation**:
- [ ] File exists at `docs/ONBOARDING.md`
- [ ] Branding HTML comment block is byte-identical to `docs/HOW_TO_USE.md`'s
- [ ] A named persona is visible within the first twenty lines, before any instruction
- [ ] Prerequisites are a table (not prose), one requirement per row
- [ ] Each step is `### Step N: <verb phrase>` with a `Description | Notes` table
- [ ] Steps cover installer → configure `.kittify/config.yaml` → `spec-kitty doctor doctrine`
- [ ] Troubleshooting covers C-001, C-005/C-006, C-007, C-010 as symptom→cause→workaround
- [ ] Related Resources table links all four resources
- [ ] No `{{PLACEHOLDER}}` tokens remain
- [ ] All flags/URLs match `dist/scripts/install-regnology-stack.sh`

---

### Subtask T002 — Self-verify against the six-point quality_test

**Purpose**: Run the styleguide's own `quality_test` over the finished guide and fix any
failure before handing off for review. This is the FR-005 / NFR-004 acceptance gate, applied
by the author first so review is a confirmation, not a discovery.

**Steps**:

1. Re-read the `quality_test` block at the bottom of
   `pack/styleguides/user-guide-conventions.styleguide.yaml`. The six checks are:
   1. A named persona is visible in the first twenty lines.
   2. Prerequisites are presented in a table.
   3. Every step has a `###` heading and a `Description | Notes` table.
   4. The related-resources table is complete.
   5. All `{{PLACEHOLDER}}` tokens have been replaced.
   6. The branding header is present.

2. Walk the finished `docs/ONBOARDING.md` against each check, top to bottom. For check 5, grep
   the file for the token pattern:
   ```bash
   grep -nE '\{\{[A-Z0-9_]+\}\}' docs/ONBOARDING.md || echo "no placeholder tokens — OK"
   ```
3. For check 6, confirm the branding header matches `docs/HOW_TO_USE.md`:
   ```bash
   diff <(sed -n '1,11p' docs/HOW_TO_USE.md) <(sed -n '1,11p' docs/ONBOARDING.md) && echo "branding header matches"
   ```
4. For check 3, confirm every `### Step` heading is immediately followed by a `| Description | Notes |`
   table header. Fix any step that uses prose instead of a table (anti-pattern from the styleguide).
5. Record the six-check result in your activity log (pass/fail per check). Fix any failing check
   and re-run, then hand off.

**Files**:
- `docs/ONBOARDING.md` (corrections only; no other files)

**Validation**:
- [ ] All six quality_test checks pass and the result is recorded in the activity log
- [ ] The placeholder grep returns no matches
- [ ] The branding-header diff is clean
- [ ] Every `### Step` heading is followed by a `Description | Notes` table

---

## Definition of Done

- `docs/ONBOARDING.md` exists with: branding header, persona table, prerequisites table,
  three numbered step tables (install → configure → verify), Troubleshooting (C-001,
  C-005/C-006, C-007, C-010), and a complete Related Resources table.
- The guide passes all six `user-guide-conventions` quality_test checks (FR-005, NFR-004).
- No `{{PLACEHOLDER}}` tokens remain.
- Every flag, URL, env var, and config-block shape matches
  `dist/scripts/install-regnology-stack.sh` (the source of truth).
- Only `docs/ONBOARDING.md` is touched.

## Risks

| Risk | Mitigation in this WP |
|---|---|
| Artefactory URL spelled inconsistently (`artifactory` vs `artefactory`) | Follow the install script (`artefactory.regnology.net`); note the brief's discrepancy in the activity log |
| Prerequisites written as prose instead of a table | T002 check 2 explicitly verifies the table; styleguide anti-pattern "Prose prerequisites" |
| Steps written as paragraphs instead of `Description \| Notes` tables | T002 check 3 verifies every `### Step` is followed by a table |
| Troubleshooting paraphrases the gotchas inaccurately | Source exact wording from the 2026-06-01 engineering note; reproduce the C-005/C-006 warning block verbatim |
| Leftover placeholder tokens shipping a "draft" | T002 check 5 greps for the token pattern |
| Branding header retyped and drifting from canonical | Copy verbatim from HOW_TO_USE.md; T002 diffs the two |

## Reviewer Guidance

Review priorities (in order):

1. **Quality_test compliance** — independently run the six checks from
   `user-guide-conventions.styleguide.yaml`. This guide IS the worked example of that
   styleguide; if it fails its own styleguide, reject.
2. **Persona placement** — a named persona (e.g. "New-engagement Engineer Ed") must appear in
   the first twenty lines, before the first instruction. "The user" is a rejectable anti-pattern.
3. **Tables, not prose** — prerequisites and every walkthrough step must be tables. Reject any
   step written as a paragraph.
4. **Troubleshooting fidelity** — confirm C-001, C-005/C-006, C-007, C-010 are each present as
   symptom→cause→workaround and faithful to
   `docs/engineering_notes/2026-06-01-spec-kitty-integration-challenge-corrections.md`. C-005/C-006
   must convey the "silent, High-severity" framing.
5. **Fact accuracy** — spot-check the installer flags, the `local_path`-parent rule, and the
   `spec-kitty doctor doctrine` verify command against the install script. Reject invented URLs.
6. **No regressions** — diff touches only `docs/ONBOARDING.md`.

## Activity Log

- 2026-06-02T09:58:51Z – claude:sonnet:curator-carla:implementer – shell_pid=2178708 – Assigned agent via action command
- 2026-06-02T10:02:39Z – claude:sonnet:curator-carla:implementer – shell_pid=2178708 – Authored docs/ONBOARDING.md. Six quality_test checks: (1) named persona in first 20 lines PASS; (2) prerequisites table PASS; (3) every Step has ### heading + Description|Notes table PASS; (4) related-resources table complete (4 rows) PASS; (5) no placeholder tokens PASS; (6) branding header byte-identical to HOW_TO_USE.md PASS. URL discrepancy resolved in favour of install script: used artefactory.regnology.net (with 'e'), not the brief's 'artifactory'.
- 2026-06-02T10:02:54Z – claude:sonnet:curator-carla:implementer – shell_pid=2178708 – Ready for review: ONBOARDING.md authored, 6 quality checks documented
- 2026-06-02T10:03:23Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=2206703 – Started review via action command
