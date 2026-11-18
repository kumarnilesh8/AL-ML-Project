---
work_package_id: WP04
title: Engineering Decision Records
dependencies:
- WP01
requirement_refs:
- NFR-003
tracker_refs: []
planning_base_branch: overhaul/migrate_to_kitty
merge_target_branch: overhaul/migrate_to_kitty
branch_strategy: Planning artifacts for this mission were generated on overhaul/migrate_to_kitty. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into overhaul/migrate_to_kitty unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-regnology-stack-distribution-pipeline-01KSWHFT
base_commit: fc2c82443a67a5f66f075d365f10540a780aa875
created_at: '2026-06-01T07:22:46.586340+00:00'
subtasks:
- T017
- T018
agent: "claude:sonnet:reviewer-renata:reviewer"
shell_pid: "899388"
history: []
agent_profile: architect-alphonso
authoritative_surface: docs/decisions/
execution_mode: code_change
owned_files:
- docs/decisions/EDR-001-pack-distribution-archive-layout.md
- docs/decisions/EDR-002-jenkins-artefactory-publish-strategy.md
role: implementer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load architect-alphonso
```

Wait for profile confirmation, then continue with this work package.

---

## Objective

Record the nine engineering decisions from `research.md` as two formal
Engineering Decision Records (EDRs) under `docs/decisions/`. EDRs preserve
rationale and alternatives for future maintainers and satisfy TRACEABLE_DECISIONS
(DIRECTIVE_018) for tooling decisions.

**Important scope clarification**: DDRs are reserved for decisions about doctrine
content or charter content. The decisions in this mission concern pipeline
tooling and CI/CD strategy — these are engineering decisions and belong in EDRs.
This is the first EDR pair in `docs/decisions/`; the format follows the DDR
convention but uses the EDR prefix and "Engineering Decision Record" framing.

## Branch Strategy

- **Planning branch**: `overhaul/migrate_to_kitty`
- **Merge target**: `overhaul/migrate_to_kitty`
- **Execution workspace**: A worktree allocated by `finalize-tasks` based on this
  WP's lane in `lanes.json`. Enter the workspace path printed by
  `spec-kitty agent action implement WP04 --agent <your-name>`.

## Pre-Read

1. Read `docs/decisions/DDR-016-spec-kitty-migration-and-repo-scope.md` as the
   style reference. The EDRs should match its structure (Context / Decisions /
   Consequences / Alternatives).
2. Read `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md`
   end-to-end. The nine decisions there are the authoritative source content.
3. Confirm there are no existing `EDR-*` files in `docs/decisions/`. If any exist,
   pick the next free numbers. If none, this WP establishes EDR-001 and EDR-002.

## Decision-to-EDR Allocation

| EDR | Title | research.md decisions covered |
|---|---|---|
| EDR-001 | Pack Distribution Archive Layout | 1 (version file format), 2 (archive layout / `pack/` wrapper), 6 (integrity manifest), 7 (publish ordering) |
| EDR-002 | Jenkins Artefactory Publish Strategy | 3 (credential parameter), 4 (latest-alias re-upload), 5 (HOW_TO_USE primary path), 8 (rollback), 9 (Groovy interpolation safety) |

The split is by concern: EDR-001 covers the *artifact* (what gets built and how
it's laid out). EDR-002 covers the *delivery* (how it gets to Artefactory and
how the docs introduce it).

---

### Subtask T017 [P] — EDR-001: Pack Distribution Archive Layout

**Purpose**: Record archival rationale for future maintainers.

**Steps**:
1. Create `docs/decisions/EDR-001-pack-distribution-archive-layout.md` with this
   structure:

   ```markdown
   # EDR-001: Pack Distribution Archive Layout

   **Status:** Accepted
   **Date:** 2026-05-30
   **Author:** Architect Alphonso
   **Mission:** regnology-stack-distribution-pipeline-01KSWHFT
   **Related:** DDR-008 (Framework Distribution and Upgrade Mechanisms),
                EDR-002 (Jenkins Artefactory Publish Strategy)

   ---

   ## Context

   The Regnology doctrine pack must be distributed as downloadable archives
   from Artefactory to power the bootstrap installer scripts
   (`dist/scripts/install-regnology-stack.sh` / `.ps1`). The installer scripts
   are already written and locked (mission constraint C-003 of
   `regnology-stack-distribution-pipeline-01KSWHFT`). Four design questions
   needed resolution before a Jenkins publish pipeline could be built:

   1. How should the pack's machine-readable version be stored?
   2. What layout should the published archives use?
   3. How is archive integrity verified by downstream consumers?
   4. In what order should the four published artifacts (versioned tar,
      versioned zip, latest tar, latest zip) be uploaded?

   ---

   ## Decisions

   ### Decision 1 — Version file format: plain-text semver

   `pack/.pack-version` is a single-line plain-text file containing a semver
   string (e.g., `1.0.0`). Both the POSIX shell installer and the PowerShell
   installer read this file with `cat` / `Get-Content` — no parser needed.

   **Why not YAML?** YAML would require `yq` or Python in the Jenkins shell
   context and in user environments running the installer. The single-key
   value does not justify the dependency.

   ### Decision 2 — Archive layout: top-level `pack/` directory wrapper

   Archives are created from the repository root with `tar czf ... pack/`,
   placing a single `pack/` directory at the archive root. The locked installer
   uses `--strip-components=1` during extraction, which strips this wrapper
   cleanly into `$PACK_DIR`.

   An earlier proposal (Decision 2 first draft in research.md) suggested
   omitting the wrapper via `cd pack && tar czf ../...tar.gz .`. That layout
   would cause `--strip-components=1` to silently discard the first path
   segment of every pack file, corrupting the extraction. The wrapper layout
   is required by the locked installer contract.

   Reproducibility flags accompany the tar invocation:
   - `--mtime="@0"` — fixed mtime
   - `--sort=name` — deterministic ordering
   - `--owner=0 --group=0` — strip user/group identity

   These produce bit-identical tar output across builds of the same source.

   **PowerShell zip caveat**: `Expand-Archive` does not honour
   `--strip-components`. The Windows extraction path must either tolerate a
   `pack/` wrapper in the zip (move contents up after extract) or the
   pipeline must produce a zip without the wrapper — to be resolved as the
   PowerShell installer is finalised.

   ### Decision 3 — Integrity manifest: `META/MANIFEST.yml` inside archive

   The Package stage generates a SHA-256 manifest of every pack file (excluding
   `META/` itself) and includes it as `pack/META/MANIFEST.yml` inside each
   archive. DDR-008 requires distributed archives to include checksums. The
   manifest format is `sha256sum` output (`<hex>  <relative-path>` per line);
   the `.yml` extension is for forward compatibility.

   The Smoke Check stage verifies the manifest is present in the published
   archive after upload.

   ### Decision 4 — Publish ordering: versioned pair before latest pair

   The four artifacts (versioned tar, versioned zip, latest tar, latest zip)
   upload in two strict phases:

   1. Versioned `.tar.gz` and `.zip` — both must return HTTP 201 before
      proceeding.
   2. Latest-alias `.tar.gz` and `.zip` — upload only after Phase 1 succeeds.

   This eliminates the window where `latest` points to a version that does not
   yet exist as a versioned artifact. A residual race exists if two pipelines
   run concurrently on `main`, but versioned artifacts remain immutable and
   consistent regardless.

   ---

   ## Consequences

   - The Jenkins `Package` stage uses one canonical tar invocation; no
     conditional logic for "with wrapper / without wrapper".
   - The installer's existing `--strip-components=1` continues to work
     unchanged (C-003 satisfied).
   - All published archives carry a self-contained integrity manifest,
     enabling future integrity-verification features in the installer.
   - The publish ordering rules out one class of consistency bug at the cost
     of slightly longer Publish-stage runtime.

   ---

   ## Alternatives Considered

   - **No `pack/` wrapper + remove `--strip-components=1` from installer**:
     Violates C-003 (installer is locked).
   - **`pack/meta.yaml` instead of `.pack-version`**: Requires YAML parser in
     shell contexts.
   - **External `.sha256` sidecar files**: Forces a separate download per
     archive; not supported by the existing installer flow.
   - **All four uploads in parallel**: Eliminates ordering guarantee for the
     `latest` alias.

   ---

   ## References

   - Mission spec: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/spec.md`
   - Research log: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md` (Decisions 1, 2, 6, 7)
   - Locked installer: `dist/scripts/install-regnology-stack.sh` L319
   - Related: DDR-008 (Framework Distribution and Upgrade Mechanisms)
   ```

2. Confirm the file renders correctly as Markdown.

**Files**:
- `docs/decisions/EDR-001-pack-distribution-archive-layout.md` (new file, ~110 lines)

**Validation**:
- [ ] File exists at the documented path
- [ ] Status: Accepted; Date: 2026-05-30; Author: Architect Alphonso; Mission slug present
- [ ] Covers all four decisions (version file, archive layout, manifest, publish ordering)
- [ ] Explicitly explains why the `--strip-components=1` constraint dictates the wrapper layout
- [ ] References research.md by Decision number

---

### Subtask T018 [P] — EDR-002: Jenkins Artefactory Publish Strategy

**Purpose**: Record CI/CD and credential-handling rationale.

**Steps**:
1. Create `docs/decisions/EDR-002-jenkins-artefactory-publish-strategy.md` with
   this structure:

   ```markdown
   # EDR-002: Jenkins Artefactory Publish Strategy

   **Status:** Accepted
   **Date:** 2026-05-30
   **Author:** Architect Alphonso
   **Mission:** regnology-stack-distribution-pipeline-01KSWHFT
   **Related:** EDR-001 (Pack Distribution Archive Layout),
                DIRECTIVE_043 (AppSec Compliance),
                DIRECTIVE_018 (Traceable Decisions)

   ---

   ## Context

   With the archive layout settled (EDR-001), the publishing pipeline needs
   to resolve five further decisions:

   1. How is the Artefactory credential identified across Jenkins
      environments?
   2. How does the `latest` alias mechanism work in a generic Artefactory
      repository?
   3. Where should the bootstrap installer sit in `docs/HOW_TO_USE.md`?
   4. What happens when a publish run partially succeeds?
   5. How are credentials kept out of the Jenkins build log?

   ---

   ## Decisions

   ### Decision 1 — Credential ID via pipeline parameter

   The Jenkinsfile exposes `ARTEFACTORY_CREDENTIAL_ID` as a `string` pipeline
   parameter with default `ARTEFACTORY_API_TOKEN`. The credential is consumed
   via `withCredentials([string(credentialsId: params.ARTEFACTORY_CREDENTIAL_ID, ...)])`.

   This allows the same Jenkinsfile to work across dev / staging / prod
   Jenkins instances that may have different credential IDs, without source
   edits. The credential must be an **Artefactory API key** (header:
   `X-JFrog-Art-Api: <token>`); if the org migrates to access tokens, the
   header scheme switches to `Authorization: Bearer <token>` via a single
   find/replace.

   ### Decision 2 — `latest` alias via re-upload

   Artefactory generic repositories do not support symlinks. The `latest`
   alias is implemented by re-uploading the same archive bytes to a second
   path (`regnology-default-latest.tar.gz` / `.zip`). This is the standard
   pattern for generic repos.

   Artefactory Pro features (AQL queries, Properties, Release Bundles) were
   considered and rejected as out-of-scope.

   ### Decision 3 — HOW_TO_USE: installer as primary, manual as appendix

   `docs/HOW_TO_USE.md` leads with the bootstrap installer. The former
   git-clone manual procedure is preserved verbatim in an Appendix labelled
   "Manual / Offline Setup" for air-gapped use (FR-008).

   The CLI flag `--artefactory-token <value>` is explicitly labelled
   CI-only; the recommended interactive path is the `ARTEFACTORY_TOKEN`
   environment variable. This avoids training developers to pass secrets via
   shell command-line arguments, which would leak into shell history and
   process listings.

   ### Decision 4 — Partial-publish rollback in `post { failure }`

   The Publish stage tracks uploaded artifacts in `env.UPLOADED_ARTIFACTS`
   (comma-separated). If any stage between Validate and Smoke Check fails,
   the `post { failure }` block issues `curl -X DELETE` for every artifact
   uploaded in that run, restoring Artefactory to its pre-build state.

   An earlier design (research.md historical note) had the publish step
   accept HTTP 403 (already-published) and continue. That design silently
   masked partial publishes — if the tar succeeded but the zip failed,
   downstream consumers would see an incomplete release under a valid
   version. The Validate-stage duplicate-version guard plus post-failure
   rollback gives a clean all-or-nothing publish.

   `FORCE_PUBLISH=true` bypasses the duplicate-version guard for hotfix
   scenarios but does NOT suppress rollback on failure.

   ### Decision 5 — Groovy interpolation safety for credentials

   Every `curl` invocation that includes the Artefactory token uses a
   single-quoted Groovy `sh` block so the `$ART_TOKEN` reference is expanded
   by the shell, not by Groovy. Jenkins masks the secret in the build log
   only when it appears as a shell variable reference, not when it has
   already been interpolated by Groovy.

   **Forbidden pattern**: `sh "curl -H \"X-JFrog-Art-Api: ${ART_TOKEN}\" ..."`
   — Groovy resolves `${ART_TOKEN}` before Jenkins sees the string. The
   raw token value lands in the build log.

   **Required pattern**:
   ```groovy
   sh '''
       curl -H "X-JFrog-Art-Api: $ART_TOKEN" "$URL"
   '''
   ```
   The single quotes prevent Groovy interpolation; the shell expands
   `$ART_TOKEN` at runtime, which Jenkins masks.

   This rule is enforced by the Jenkinsfile header comment and reviewer
   guidance in WP02.

   ---

   ## Consequences

   - Credential ID is a single point of configuration across Jenkins
     environments.
   - The `latest` mechanism does not depend on Artefactory enterprise features.
   - Developer documentation flows from installer to manual fallback,
     matching the actual recommended path.
   - Partial publishes can never leave Artefactory inconsistent; every
     published version represents a complete four-file set or nothing.
   - Token exposure via Groovy interpolation is eliminated by convention,
     enforced in code review.

   ---

   ## Alternatives Considered

   - **Hardcoded credential ID**: Simpler but breaks multi-environment Jenkins
     setups.
   - **Artefactory Properties + AQL for `latest`**: Requires Pro features.
   - **403-warn-and-continue idempotency**: Masks partial publishes silently.
   - **Manual cleanup of partial publishes**: Acceptable ad-hoc, unacceptable
     in an automated pipeline.
   - **Documenting `--artefactory-token` as the recommended path**: Trains
     users to leak secrets via shell history.

   ---

   ## References

   - Mission spec: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/spec.md`
   - Research log: `kitty-specs/regnology-stack-distribution-pipeline-01KSWHFT/research.md` (Decisions 3, 4, 5, 8, 9)
   - Implementation: `Jenkinsfile`, `docs/HOW_TO_USE.md`
   - Related: EDR-001, DIRECTIVE_043 (AppSec Compliance), DIRECTIVE_018 (Traceable Decisions)
   ```

2. Confirm the file renders correctly.

**Files**:
- `docs/decisions/EDR-002-jenkins-artefactory-publish-strategy.md` (new file, ~130 lines)

**Validation**:
- [ ] File exists at the documented path
- [ ] Status / Date / Author / Mission slug header present
- [ ] Covers all five assigned decisions
- [ ] Explicitly documents the Groovy interpolation safety rule with code examples
- [ ] References EDR-001 and DIRECTIVE_043
- [ ] References research.md by Decision number

---

## Definition of Done

- `docs/decisions/EDR-001-pack-distribution-archive-layout.md` exists and
  covers Decisions 1, 2, 6, 7 from research.md
- `docs/decisions/EDR-002-jenkins-artefactory-publish-strategy.md` exists and
  covers Decisions 3, 4, 5, 8, 9 from research.md
- Both files follow the DDR style (Context / Decisions / Consequences /
  Alternatives / References)
- Mission slug, status, date, and author are present in both files
- Decisions narrative explains *why*, not just *what*
- Cross-references between EDR-001 and EDR-002 are bidirectional

## Risks

| Risk | Mitigation |
|---|---|
| EDR-001 and EDR-002 numbering collides with existing files | T017/T018 first step: list `docs/decisions/EDR-*` and pick next free numbers if present |
| EDRs drift from research.md as the Jenkinsfile evolves | EDRs are point-in-time records; future changes should produce new EDRs (or amendments) rather than editing these in place |
| Reviewer expects formal EDR template not yet established | The DDR style is the prevailing convention in `docs/decisions/`; this WP establishes the EDR pair as the first concrete example |

## Reviewer Guidance

1. Confirm each EDR maps 1-to-1 to the listed research.md decisions.
2. Confirm the explanation of *why* a decision was taken is present, not just
   the decision itself.
3. Confirm the `--strip-components=1` constraint explanation appears in EDR-001
   (this was the single critical adversarial-review finding).
4. Confirm the Groovy interpolation safety rule appears in EDR-002 with both
   the forbidden and required patterns.
5. The two files should cross-reference each other.

## Next Steps

After approval, all four WPs of the mission are complete. Run
`spec-kitty accept --mission regnology-stack-distribution-pipeline-01KSWHFT`
to validate the mission, then `spec-kitty merge` to finalise.

## Activity Log

- 2026-06-01T07:22:48Z – claude:sonnet:implementer-ivan:implementer – shell_pid=888433 – Started implementation via action command
- 2026-06-01T07:24:59Z – claude:sonnet:implementer-ivan:implementer – shell_pid=888433 – EDR-001 and EDR-002 authored: archive layout and Jenkins publish strategy decisions
- 2026-06-01T07:25:28Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=899388 – Started review via action command
- 2026-06-01T07:26:51Z – claude:sonnet:reviewer-renata:reviewer – shell_pid=899388 – Review passed: EDR-001 covers archive layout rationale (pack/ wrapper, --strip-components=1 constraint, META/MANIFEST.yml, phased publish ordering); EDR-002 covers Jenkins publish strategy (credential as pipeline parameter, latest-alias re-upload, all-or-nothing rollback, Groovy interpolation safety rule with forbidden/required pattern examples). Both files follow the DDR-016 format convention and cross-reference each other. The WP04 commit touches only the two EDR files.
