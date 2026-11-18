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

# Tasks: Regnology Stack Distribution Pipeline

**Mission**: regnology-stack-distribution-pipeline-01KSWHFT
**Branch**: overhaul/migrate_to_kitty
**Date**: 2026-05-30

This task list is generated from `spec.md` and `plan.md` (post-adversarial-review).
The plan was revised after a two-reviewer (Opus 4.6 + Sonnet 4.6) adversarial
review; critical findings (archive layout, idempotency, integrity, AppSec)
are reflected in WP02 subtask guidance.

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Create `pack/.pack-version` with semver `1.0.0` | WP01 | |
| T002 | Document version bump procedure in `pack/README.md` | WP01 | |
| T003 | Verify file is shell-readable end-to-end (cat + tr round-trip) | WP01 | |
| T004 | Scaffold declarative Jenkinsfile (params, agent, main-only trigger) | WP02 | |
| T005 | Implement `Checkout` + `Validate` stages (version read, semver regex, duplicate-version HEAD guard) | WP02 | |
| T006 | Implement `Package` stage (reproducible tar with `pack/` wrapper, zip, `META/MANIFEST.yml` integrity manifest) | WP02 | |
| T007 | Implement `Security Scan` stage (SonarQube SAST + CycloneDX SBOM) with `catchError` unstable on first deploy | WP02 | |
| T008 | Implement `Publish` stage with phased ordering (versioned pair before latest pair) using safe `withCredentials` + single-quoted sh | WP02 | |
| T009 | Implement `Smoke Check` stage (tar stream validation + manifest presence) | WP02 | |
| T010 | Implement `post { failure }` rollback (curl DELETE for all artifacts uploaded in current run) | WP02 | |
| T011 | Add Jenkinsfile header comment block (credential type, Artefactory prerequisites, parameter reference) | WP02 | |
| T012 | Update Prerequisites section of HOW_TO_USE.md (remove separate spec-kitty install step) | WP03 | [P] |
| T013 | Write Step 1 — Bootstrap installer (Unix one-liner, Windows one-liner, env-var token guidance) | WP03 | [P] |
| T014 | Update Step 2, "Keeping the stack current", and Team-lead checklist sections | WP03 | [P] |
| T015 | Move former Steps 1–2 (git-clone config + fetch path) to "Appendix: Manual / Offline Setup" | WP03 | [P] |
| T016 | Update Troubleshooting section for installer-specific scenarios | WP03 | [P] |
| T017 | Write `docs/decisions/EDR-001-pack-distribution-archive-layout.md` (Decisions 1, 2, 6, 7 from research.md) | WP04 | [P] |
| T018 | Write `docs/decisions/EDR-002-jenkins-artefactory-publish-strategy.md` (Decisions 3, 4, 5, 8, 9 from research.md) | WP04 | [P] |

---

## Phase 1 — Foundation

### WP01 — Pack Version File

**Goal**: Introduce the machine-readable semver file that anchors versioning for the
entire distribution pipeline. Without this file, WP02's Validate stage has nothing
to read and the installer cannot resolve a requested version.

**Priority**: Critical (anchor)

**Independent test**: `cat pack/.pack-version | tr -d '[:space:]'` prints a string
matching `^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$`.

**Estimated prompt size**: ~200 lines

**Dependencies**: none

**Included subtasks**:
- [x] T001 Create `pack/.pack-version` with `1.0.0`
- [x] T002 Document version bump procedure in `pack/README.md`
- [x] T003 Verify shell-readability end-to-end

**Implementation sketch**: Write the file, append a "Version Bumping" section to
`pack/README.md`, run the validation command locally.

**Risks**: None significant.

**Prompt file**: `tasks/WP01-pack-version-file.md`

---

## Phase 2 — Parallel implementation (after WP01)

The three WPs below run in parallel once WP01 is approved.

### WP02 — Jenkinsfile Publish Pipeline

**Goal**: Implement the declarative Jenkins pipeline that, on every merge to `main`,
packages the pack into versioned + latest-alias `.tar.gz` and `.zip` archives with
an integrity manifest, runs security scans, publishes to Artefactory atomically
(with rollback on partial failure), and verifies the published archive.

**Priority**: Critical

**Independent test**: A dry-run / Replay through Jenkins on a sandbox branch
completes all stages without secrets in the log and produces the expected
artifacts (or, where dry-run is not available, a local `groovy -e` syntax check
plus stage-by-stage shell extraction).

**Estimated prompt size**: ~650 lines (8 subtasks, dense per-subtask guidance)

**Dependencies**: WP01 (must read `pack/.pack-version`)

**Included subtasks**:
- [ ] T004 Scaffold declarative Jenkinsfile (params, agent, main-only trigger)
- [ ] T005 Implement Checkout + Validate stages
- [ ] T006 Implement Package stage with integrity manifest
- [ ] T007 Implement Security Scan stage (SonarQube SAST + CycloneDX SBOM)
- [ ] T008 Implement Publish stage with phased ordering and safe credentials
- [ ] T009 Implement Smoke Check stage
- [ ] T010 Implement post-failure rollback
- [ ] T011 Add Jenkinsfile header documentation

**Implementation sketch**:
1. Write the skeleton (`pipeline { agent any; parameters { ... }; when { branch 'main' }; stages { ... } }`)
2. Build out each stage bottom-up; commit per logical group of stages
3. Wire `post { failure { ... } }` rollback last
4. Add header comment with credential type and prerequisite list

**Risks**:
- Jenkins agent missing `zip`, `sonar-scanner`, or `cyclonedx` — mitigated with guards
- Token exposure via Groovy interpolation — explicitly forbidden; T008 enforces single-quoted sh

**Prompt file**: `tasks/WP02-jenkinsfile-publish-pipeline.md`

---

### WP03 — HOW_TO_USE Restructure

**Goal**: Reposition the bootstrap installer as the primary setup path. Demote the
git-clone manual steps to an Appendix. Document the "keeping the stack current"
upgrade flow. Highlight the `ARTEFACTORY_TOKEN` environment variable as the
recommended secret-passing path (not the CLI flag).

**Priority**: High

**Independent test**:
- `grep -n "install-regnology-stack" docs/HOW_TO_USE.md | head -1` returns a line
  before any `git clone` reference.
- `grep -n "ARTEFACTORY_TOKEN" docs/HOW_TO_USE.md` returns at least one match in
  the primary setup section.

**Estimated prompt size**: ~350 lines

**Dependencies**: WP01 (references version concept; not a hard blocker for drafting,
but WP01 should land first so the doc can reference real file paths)

**Included subtasks**:
- [x] T012 [P] Update Prerequisites section
- [x] T013 [P] Write Step 1 — Bootstrap installer
- [x] T014 [P] Update Step 2, Keeping stack current, Team-lead checklist
- [x] T015 [P] Move git-clone path to Appendix
- [x] T016 [P] Update Troubleshooting

**Implementation sketch**: Read the existing HOW_TO_USE.md once, sketch the
restructured outline, then perform the edits section by section.

**Risks**:
- Appendix drifting from installer flag set — mitigated with "run `--help` for
  authoritative flags" note.

**Prompt file**: `tasks/WP03-how-to-use-restructure.md`

---

### WP04 — Engineering Decision Records

**Goal**: Record the nine engineering decisions from `research.md` as two formal
EDRs in `docs/decisions/`. These EDRs preserve rationale and alternatives for
future maintainers and satisfy TRACEABLE_DECISIONS (DIRECTIVE_018).

**Priority**: High

**Independent test**: `ls docs/decisions/EDR-001*.md docs/decisions/EDR-002*.md`
both exist and contain Decision/Rationale/Alternatives sections matching
research.md.

**Estimated prompt size**: ~300 lines

**Dependencies**: WP01 (so the EDRs reference an actual `pack/.pack-version`
that exists in the tree, not a hypothetical one)

**Included subtasks**:
- [x] T017 [P] Write EDR-001 — Pack Distribution Archive Layout (Decisions 1, 2, 6, 7)
- [x] T018 [P] Write EDR-002 — Jenkins Artefactory Publish Strategy (Decisions 3, 4, 5, 8, 9)

**Implementation sketch**: Check existing `docs/decisions/` to confirm whether
EDR numbering already exists and pick the next free numbers if so. Mirror the
DDR style currently used in `docs/decisions/`. Each EDR maps directly to the
matching decisions in `research.md`.

**Risks**:
- EDR numbering collision — mitigated by `ls docs/decisions/EDR-*` check at start
- DDR-style template not yet established for EDRs — implementer to use DDR style
  with "EDR" prefix and "Engineering" framing

**Prompt file**: `tasks/WP04-engineering-decision-records.md`

---

## Implementation Sequence

```
WP01 (pack/.pack-version)
  ├─ WP02 (Jenkinsfile)
  ├─ WP03 (HOW_TO_USE.md)
  └─ WP04 (EDR-001, EDR-002)
```

WP02, WP03, WP04 are parallel-safe once WP01 is approved.

---

## MVP Scope

WP01 + WP02 together comprise the technical minimum: the version file exists,
and the pipeline can publish archives. WP03 (doc update) and WP04 (EDRs) add
polish and traceability but do not block the installer from working
end-to-end.
