---
work_package_id: WP02
title: Cross-Platform Installer Logic
dependencies:
- WP01
requirement_refs:
- C-005
- FR-001
- FR-002
- FR-003
- FR-004
- FR-005
- FR-006
- FR-007
- FR-009
- FR-010
- FR-012
- FR-014
- NFR-002
- NFR-003
- NFR-004
- NFR-005
tracker_refs: []
planning_base_branch: feature/single-command-installer-bootstrap
merge_target_branch: feature/single-command-installer-bootstrap
branch_strategy: Planning artifacts for this mission were generated on feature/single-command-installer-bootstrap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/single-command-installer-bootstrap unless the human explicitly redirects the landing branch.
subtasks:
- T004
- T005
- T006
- T007
- T008
shell_pid: "1275113"
agent: "cursor:opus:code-reviewer-cindy:reviewer"
history:
- timestamp: '2026-06-19T11:53:39Z'
  actor: tasks
  note: Authored from remediated plan (IC-02).
authoritative_surface: dist/scripts/
create_intent: []
execution_mode: code_change
owned_files:
- dist/scripts/install-regnology-stack.sh
- dist/scripts/install-regnology-stack.ps1
tags: []
---

# WP02 — Cross-Platform Installer Logic

## Objective

Bring both installers — `dist/scripts/install-regnology-stack.sh` and `…-stack.ps1` — to behavioral
parity for: bounded-timeout preflight with failure-cause discrimination, detached checksum
verification before extraction, build-time-injection placeholders with a clean un-injected fallback,
two-layer (base→overlay) endpoint retrieval, and idempotent re-runs. Both scripts must run the same
ordered phases and emit a manifest with identical field structure.

## Context

- The two scripts already exist and were edited in a prior session (Python 3.12 + pipx logic). This
  WP layers the remediation behaviors on top. **Own both files in this WP** to guarantee parity.
- Token contract and the `{base_upstream}` root come from WP01 (`config/release-map.yaml`). Read that
  file's header comment for the authoritative token list and fallback semantics.
- Endpoint URL templates are defined in `data-model.md` § "Endpoint URL templates". Use those exactly;
  do not invent per-script URLs. Concrete host/repo/path come from env/CI (spec Assumption 3).
- NEVER echo tokens/credentials (NFR-005). Use single-quoted shell expansion; in PowerShell avoid
  string-interpolating secrets.
- Ordered phases (must match in both): `preflight → integrity → deps → spec-kitty → layers (base→overlay) → completion`.

## Subtasks

### T004 — Bounded-timeout preflight with 404/401/network discrimination

**Purpose**: Probe both pack endpoints before any download/extraction, fail fast, and tell the user
*why* it failed (FR-002, FR-003, NFR-002, NFR-003).

**Steps**:
1. Shell: `curl -sI -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$URL" || echo 000`.
   PowerShell: `Invoke-WebRequest -Method Head -TimeoutSec 15` wrapped in try/catch capturing status.
2. Probe **base first, then overlay** (C-005 order also applies to preflight ordering).
3. Map outcomes to distinct causes and exit codes:
   - `200` → proceed.
   - `404` → cause "missing artifact"; remediation: check version/path.
   - `401`/`403` → cause "access denied / token"; remediation: check entitlement/token env.
   - `000`/timeout/connect error → cause "network"; remediation: check VPN/connectivity.
4. On any non-200, print a single failure block (phase, layer, probed URL, cause, remediation) and
   exit non-zero **before** any download or extraction.

**Files**: both scripts.

**Validation**:
- [ ] Base probed before overlay; both before download.
- [ ] 404 / 401 / timeout each produce distinct cause + remediation and non-zero exit.
- [ ] A non-responding endpoint fails by ~15s (timeout is in the code, not assumed).

### T005 — Detached `.sha256` download + verify-before-extract

**Purpose**: Guarantee download integrity (FR-012, D-006) before extraction or `pipx` install.

**Steps**:
1. For each pack payload, also download its sibling `<artifact>.sha256` (see endpoint templates).
2. Compute the local digest: shell `sha256sum`/`shasum -a 256`; PowerShell `Get-FileHash -Algorithm SHA256`.
3. Compare (case-insensitive hex). On match → extract. On mismatch → delete the partial download,
   print expected vs actual + artifact name, exit non-zero **before** extraction/`pipx`.
4. Apply to both base and overlay archives.

**Files**: both scripts.

**Validation**:
- [ ] Mismatch aborts before extraction and removes the partial file.
- [ ] Match proceeds to extraction.
- [ ] Works on macOS (`shasum`) and Linux (`sha256sum`) and Windows (`Get-FileHash`).

### T006 — Placeholder tokens + un-injected fallback mode

**Purpose**: Make the published (injected) script deterministic and the in-repo script gracefully
unpinned (FR-006, D-005).

**Steps**:
1. Introduce the WP01 tokens as the values the script reads:
   `@SPEC_KITTY_VERSION@`, `@OVERLAY_PACK_VERSION@`, `@BASE_PACK_VERSION@`, `@RELEASE_TAG@`.
2. At runtime, detect whether tokens were substituted (still literal `@…@` ⇒ un-injected).
3. Un-injected path: resolve `spec-kitty` to `default_spec_kitty_version` (read from local
   `config/release-map.yaml` when available) and use `latest` pack aliases; log
   "running in fallback/unpinned mode".
4. Injected path: install the exact injected `@SPEC_KITTY_VERSION@` via `pipx`; use the injected pack
   versions for endpoint resolution.
5. Record both requested and resolved spec-kitty versions for the manifest (T008).

**Files**: both scripts.

**Validation**:
- [ ] With tokens substituted, the pinned version is installed and no `@…@` remains.
- [ ] Without substitution, fallback mode is logged and uses default version + `latest`.

### T007 — Two-layer endpoint resolution (base→overlay)

**Purpose**: Retrieve base from upstream and overlay from this repo's Artifactory path, applying
base then overlay (FR-007, C-005).

**Steps**:
1. Build endpoint URLs from the `data-model.md` templates using injected/fallback versions:
   overlay → `{base}/ps-agent-enabled-factory-<overlay_pack_version>.tar.gz`; base →
   `{base_upstream}/regnology-all-company-<base_pack_version>.tar.gz` (+ `.sha256` siblings).
2. Source host/repo/path and `{base_upstream}` from env vars (documented defaults belong to WP04
   docs, not hardcoded here).
3. Download/verify/extract base, then overlay — never overlay first.
4. Payloads come **only** from Artifactory; Bitbucket is never used for payloads (C-002 / FR-007).

**Files**: both scripts.

**Validation**:
- [ ] Overlay and base URLs match the documented templates.
- [ ] Base layer is applied before overlay.
- [ ] No code path fetches a pack payload from Bitbucket.

### T008 — Idempotent short-circuit + manifest parity

**Purpose**: Make re-runs safe and the `.stack-version` manifest identical across platforms (FR-014,
FR-010, NFR-004).

**Steps**:
1. Before reinstalling, detect already-satisfied state: pinned spec-kitty present via `pipx`, and
   both pack layers present at expected versions.
2. If satisfied, skip reinstall and exit zero with a manifest reflecting existing versions.
3. Write `.stack-version` with identical fields/format in both scripts: `installed_at`,
   `spec_kitty_version`, `spec_kitty_requested_version`, `base_pack_version`, `overlay_pack_version`,
   `platform`.
4. Verify both scripts still pass `bash -n` / PowerShell parser (WP03 enforces this in CI; check
   locally here too).

**Files**: both scripts.

**Validation**:
- [ ] Re-run on satisfied machine performs no reinstall and exits zero.
- [ ] Manifest field set/format is byte-identical in structure across both scripts.
- [ ] `bash -n install-regnology-stack.sh` and the PS parser both pass.

## Branch Strategy

Planning branch: `feature/single-command-installer-bootstrap`. Final merge target:
`feature/single-command-installer-bootstrap`. Execution worktrees are allocated per computed lane
from `lanes.json`; do not create worktrees manually. This WP depends on **WP01** — implement against
the token contract WP01 freezes.

## Definition of Done

- Both installers implement T004–T008 with parity; mocked-endpoint runs produce correct exit
  codes/messages; checksum mismatch aborts pre-extract; injected vs fallback both work; re-run is
  idempotent; both scripts parse clean.

## Risks

- Shell/PowerShell divergence — implement each behavior in lockstep, same phase order and messages.
- Freshly installed `pipx` not on PATH (esp. Windows) — ensure PATH is updated before the spec-kitty step.
- `tar` vs `Expand-Archive` extraction differences — verify the `pack/` strip behavior matches the archive layout (Jenkinsfile uses a top-level `pack/` wrapper; installer strips it).

## Reviewer Guidance

- Verify failure-cause discrimination is real (distinct messages + exit handling), not a single
  generic error.
- Verify integrity check runs **before** extraction/`pipx` and deletes partials on mismatch.
- Verify no token/credential is ever echoed.
- Diff the two scripts' phase order and manifest fields side by side for parity.

## Activity Log

- 2026-06-19T13:29:38Z – user – shell_pid=1155438 – Moved to planned
- 2026-06-19T13:30:00Z – cursor:opus:devops-danny:implementer – shell_pid=1261195 – Started implementation via action command
- 2026-06-19T13:32:53Z – cursor:opus:devops-danny:implementer – shell_pid=1261195 – Python floor raised to 3.12 in both scripts; bash -n + pwsh parse clean
- 2026-06-19T13:33:19Z – cursor:opus:code-reviewer-cindy:reviewer – shell_pid=1275113 – Started review via action command
- 2026-06-19T13:35:24Z – user – shell_pid=1275113 – Cycle-2 re-review passed: Python floor raised 3.9->3.12 (FR-004/D-004) in both scripts; .sh uses sys.version_info >= (3, 12), .ps1 minor -ge 12; messages say Python 3.12+; bash -n and pwsh parser exit 0; fix commit 2a53929e limited to 4 lines (floor+messages), no regressions to preflight/integrity/injection/two-layer/idempotency
