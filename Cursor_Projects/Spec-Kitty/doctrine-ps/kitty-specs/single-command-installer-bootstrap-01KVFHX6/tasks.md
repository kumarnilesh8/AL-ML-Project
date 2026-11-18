# Tasks: Single Command Installer Bootstrap

**Mission**: `single-command-installer-bootstrap-01KVFHX6`
**Planning base / merge target**: `feature/single-command-installer-bootstrap`
**Source docs**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/installer-bootstrap.contract.yaml`

Execution worktrees are allocated per computed lane from `lanes.json` after `finalize-tasks`.

## Phasing

- **Phase 1 — Foundation**: WP01 (release-map SSOT + injection contract).
- **Phase 2 — Runtime**: WP02 (cross-platform installer logic). Depends on WP01.
- **Phase 3 — Delivery**: WP03 (CI tag-triggered publish + injection). Depends on WP01, WP02.
- **Phase 4 — Documentation**: WP04 (install docs/README). Depends on WP02, WP03.

**MVP** = WP01 + WP02 (a functional installer that pins via injected values, falls back cleanly when
un-injected, and verifies integrity).

## Subtask Index

| ID | Description | WP | Parallel |
|---|---|---|---|
| T001 | Pin/resolve `release-map.yaml` versions (replace NEEDS-CONFIRMATION or record open-resolution) | WP01 | |
| T002 | Define + document the placeholder-token injection contract consumed by scripts and CI | WP01 | |
| T003 | Add a `release-map.yaml` schema/lint validation hook (yaml parse + required keys) | WP01 | [P] |
| T004 | Add bounded-timeout preflight with 404/401/network discrimination to both installers | WP02 | |
| T005 | Add detached `.sha256` download + verify-before-extract to both installers | WP02 | |
| T006 | Add placeholder tokens + un-injected fallback (default version, `latest` aliases) to both installers | WP02 | |
| T007 | Implement two-layer endpoint resolution (base upstream, overlay this-repo) base→overlay | WP02 | |
| T008 | Add idempotent already-satisfied short-circuit + manifest write parity | WP02 | |
| T009 | Migrate Jenkins trigger from merge-to-`main` to tag-triggered; resolve versions from `release-map.yaml` | WP03 | |
| T010 | Rename overlay archive to `ps-agent-enabled-factory-<version>`; publish detached `.sha256` per payload | WP03 | |
| T011 | Add build-time injection step + "no remaining `@…@` tokens" post-inject assertion | WP03 | |
| T012 | Add installer lint stage (`bash -n` + PowerShell parser) that fails the build on error | WP03 | [P] |
| T013 | Record security-scan hardening posture (catchError→FAILURE transition tracking) | WP03 | [P] |
| T014 | Update `docs/HOW_TO_INSTALL.md` (Python 3.12, two-layer model, integrity, fallback, pinning) | WP04 | |
| T015 | Update `dist/scripts/README.md` and verify documented one-command invocation matches published entrypoint | WP04 | [P] |
| T016 | Add non-Debian Linux guidance (C-004) and token-handling note | WP04 | [P] |

---

## WP01 — Release-Map SSOT & Injection Contract

- **Goal**: Make `config/release-map.yaml` the authoritative, validated source of truth for pinned
  versions, and freeze the placeholder-token contract that scripts and CI both depend on.
- **Priority**: P1 (foundational). **Est. size**: ~220 lines.
- **Independent test**: `release-map.yaml` parses, contains required keys for `v2.0.0`, and the
  documented token list matches what WP02/WP03 consume; no `NEEDS-CONFIRMATION` remains (or each is
  recorded as an explicit, tracked open-resolution).
- **Dependencies**: none.
- **Requirements**: FR-006, FR-008 (map portion), C-003.
- **Prompt**: `tasks/WP01-release-map-ssot.md`

- [x] T001 Pin/resolve release-map versions (WP01)
- [x] T002 Define + document placeholder-token injection contract (WP01)
- [x] T003 Add release-map schema/lint validation hook (WP01)

## WP02 — Cross-Platform Installer Logic

- **Goal**: Bring both installers (`.sh` + `.ps1`) to behavioral parity for preflight, integrity,
  injection/fallback, two-layer retrieval, and idempotency.
- **Priority**: P1. **Est. size**: ~480 lines.
- **Independent test**: mocked endpoints (200/404/401/timeout) drive correct exit codes/messages;
  checksum mismatch aborts before extract; both scripts pass `bash -n`/PS parser and emit identical
  manifest structure.
- **Dependencies**: WP01 (token contract).
- **Requirements**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009, FR-010, FR-012,
  FR-014, NFR-002, NFR-003, NFR-004, NFR-005, C-005.
- **Prompt**: `tasks/WP02-cross-platform-installer.md`

- [x] T004 Bounded-timeout preflight + 404/401/network discrimination (WP02)
- [x] T005 Detached `.sha256` download + verify-before-extract (WP02)
- [x] T006 Placeholder tokens + un-injected fallback mode (WP02)
- [x] T007 Two-layer endpoint resolution base→overlay (WP02)
- [x] T008 Idempotent short-circuit + manifest parity (WP02)

## WP03 — CI Tag-Triggered Publish & Injection

- **Goal**: Migrate the Jenkins pipeline to tag-triggered, release-map-driven publishing with
  injection, correct artifact naming, detached checksums, and an installer lint gate.
- **Priority**: P2. **Est. size**: ~430 lines.
- **Independent test**: a tag build resolves versions from the map, injects them (no `@…@` left),
  publishes `ps-agent-enabled-factory-<version>` + `.sha256` to JFrog only, and fails on a deliberate
  script parse error.
- **Dependencies**: WP01 (map), WP02 (script token placeholders).
- **Requirements**: FR-008, FR-013, C-001, C-002, NFR-001, NFR-005.
- **Prompt**: `tasks/WP03-ci-tag-publish.md`

- [x] T009 Tag-triggered + release-map-driven versioning (WP03)
- [x] T010 Overlay artifact rename + detached `.sha256` publish (WP03)
- [x] T011 Build-time injection + no-remaining-token assertion (WP03)
- [x] T012 Installer lint stage (`bash -n` + PS parser) (WP03)
- [x] T013 Security-scan hardening posture tracking (WP03)

## WP04 — Installation Documentation

- **Goal**: Make user-facing docs accurate for the remediated design.
- **Priority**: P3. **Est. size**: ~240 lines.
- **Independent test**: docs state Python 3.12, two-layer model, integrity verification, fallback
  semantics, and release-tag pinning; the documented command matches the published entrypoint.
- **Dependencies**: WP02, WP03.
- **Requirements**: FR-011, C-004.
- **Prompt**: `tasks/WP04-installer-docs.md`

- [x] T014 Update `docs/HOW_TO_INSTALL.md` (WP04)
- [x] T015 Update `dist/scripts/README.md` + invocation parity (WP04)
- [x] T016 Non-Debian guidance + token-handling note (WP04)
