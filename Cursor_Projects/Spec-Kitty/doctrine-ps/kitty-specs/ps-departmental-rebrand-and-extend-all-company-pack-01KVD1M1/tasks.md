# Tasks: PS Departmental Rebrand + Extend All-Company Pack

**Mission**: `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`  
**Branch**: `beta` -> merges into `beta`  
**Plan**: `kitty-specs/ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1/plan.md`

---

## Subtask Index

| ID | Description | WP | Parallel |
|----|-------------|----|----------|
| T001 | Update top-level and pack READMEs to PS departmental naming and upstream link | WP01 | [P] |
| T002 | Rename pack slug metadata to `ps-agent-enabled-factory` in canonical metadata files | WP01 | — |
| T003 | Harden `extends` commentary and layering semantics in charter docs/metadata | WP01 | — |
| T004 | Sweep active slug references in metadata/docs for atomic migration consistency | WP01 | — |
| T005 | Update shell installer to apply base (`regnology-all-company`) then overlay (`ps-agent-enabled-factory`) | WP02 | [P] |
| T006 | Update PowerShell installer with equivalent layering flow and coordinates | WP02 | [P] |
| T007 | Add syntax/parity verification hooks for both installers | WP02 | — |
| T008 | Validate installer ordering and placeholder-failure behavior consistency | WP02 | — |
| T009 | Remove `ai-initiatives` path coupling from operational files (`AGENTS.md`, `CLAUDE.md`, etc.) | WP03 | [P] |
| T010 | Update `CHANGELOG.md` with rename/layering/install/surface-cleanup entries | WP03 | — |
| T011 | Add explicit migration note for slug transition (`regnology-default` -> `ps-agent-enabled-factory`) | WP03 | — |
| T012 | Create destination structure for preserved non-generated harness config | WP04 | — |
| T013 | Relocate inventoried non-generated `.cursor`/`.claude` files to tracked canonical source paths | WP04 | — |
| T014 | Update `.gitignore` and remove generated harness outputs from git index post-relocation | WP04 | — |
| T015 | Verify surface-preservation readiness gate conditions and mirror completion in tracked docs evidence | WP04 | — |
| T016 | Run pack validation and scoped grep checks for slug cleanup and ai-initiatives removal | WP05 | — |
| T017 | Collect `extends` layering evidence checks and record outcomes | WP05 | — |
| T018 | Record validation outcomes and layering evidence in tracked engineering notes | WP05 | — |

---

## WP01 — Pack Identity and Layer Metadata Normalization

**Priority**: Critical  
**Goal**: Align naming, slug, and upstream-layer semantics across canonical metadata and docs.  
**Independent test**: All canonical identity files consistently use `ps-agent-enabled-factory` and reference upstream `regnology-all-company` semantics.  
**Estimated prompt size**: ~380 lines  
**Requirements**: FR-001, FR-002, FR-003, FR-004, C-001, C-002

- [x] T001 Update top-level and pack READMEs to PS departmental naming and upstream link (WP01)
- [x] T002 Rename pack slug metadata to `ps-agent-enabled-factory` in canonical metadata files (WP01)
- [x] T003 Harden `extends` commentary and layering semantics in charter docs/metadata (WP01)
- [x] T004 Sweep active slug references in metadata/docs for atomic migration consistency (WP01)

**Prompt file**: `tasks/WP01-pack-identity-and-layer-metadata.md`  
**Dependencies**: none

---

## WP02 — Installer Layering Refactor and Parity

**Priority**: Critical  
**Goal**: Refactor shell and PowerShell installers to pull upstream base pack first, then PS overlay, with equivalent behavior.  
**Independent test**: Both installers show deterministic base->overlay order and pass syntax/parity checks.  
**Estimated prompt size**: ~420 lines  
**Requirements**: FR-005, FR-007, NFR-001, NFR-004

- [x] T005 Update shell installer to apply base (`regnology-all-company`) then overlay (`ps-agent-enabled-factory`) (WP02)
- [x] T006 Update PowerShell installer with equivalent layering flow and coordinates (WP02)
- [x] T007 Add syntax/parity verification hooks for both installers (WP02)
- [x] T008 Validate installer ordering and placeholder-failure behavior consistency (WP02)

**Prompt file**: `tasks/WP02-installer-layering-and-parity.md`  
**Dependencies**: WP01

---

## WP03 — Operational References, Changelog, and Migration Note

**Priority**: High  
**Goal**: Remove active `ai-initiatives` coupling from operational docs and complete migration traceability notes.  
**Independent test**: Scoped operational grep is clean; changelog + migration note are present and accurate.  
**Estimated prompt size**: ~340 lines  
**Requirements**: FR-006, FR-011, FR-012, NFR-002

- [x] T009 Remove `ai-initiatives` path coupling from operational files (`AGENTS.md`, `CLAUDE.md`, etc.) (WP03)
- [x] T010 Update `CHANGELOG.md` with rename/layering/install/surface-cleanup entries (WP03)
- [x] T011 Add explicit migration note for slug transition (`regnology-default` -> `ps-agent-enabled-factory`) (WP03)

**Prompt file**: `tasks/WP03-operational-cleanup-and-migration-note.md`  
**Dependencies**: WP01

---

## WP04 — Harness Surface Canon Preservation and Cleanup

**Priority**: High  
**Goal**: Preserve authored harness canon, then untrack generated `.cursor`/`.claude` surfaces safely.  
**Independent test**: `surface-preservation-inventory.yaml` gate is satisfied and generated surface dirs are no longer shipped.  
**Estimated prompt size**: ~430 lines  
**Requirements**: FR-008, FR-009, NFR-002

- [x] T012 Create destination structure for preserved non-generated harness config (WP04)
- [x] T013 Relocate inventoried non-generated `.cursor`/`.claude` files to tracked canonical source paths (WP04)
- [x] T014 Update `.gitignore` and remove generated harness outputs from git index post-relocation (WP04)
- [x] T015 Verify surface-preservation readiness gate conditions and mirror completion in tracked docs evidence (WP04)

**Prompt file**: `tasks/WP04-surface-preservation-and-cleanup.md`  
**Dependencies**: WP01, WP03

---

## WP05 — Validation, Layering Evidence, and Issue Matrix Closure

**Priority**: Critical (final gate)  
**Goal**: Execute mission validation checks and close evidence artifacts for review/acceptance.  
**Independent test**: Pack validation passes, layering evidence is captured, and issue matrix verdicts are terminal with evidence refs.  
**Estimated prompt size**: ~300 lines  
**Requirements**: FR-010, NFR-003, NFR-004, C-003

- [x] T016 Run pack validation and scoped grep checks for slug cleanup and ai-initiatives removal (WP05)
- [x] T017 Collect `extends` layering evidence checks and record outcomes (WP05)
- [x] T018 Record validation outcomes and layering evidence in tracked engineering notes (WP05)

**Prompt file**: `tasks/WP05-validation-and-evidence-closure.md`  
**Dependencies**: WP02, WP03, WP04

---

## Parallelization Summary

```text
WP01 (identity/metadata)
 ├── WP02 (installer parity)
 ├── WP03 (operational + changelog)
 │     └── WP04 (surface preservation/cleanup)
 └──────────────────────────────┐
                                ▼
                        WP05 (validation + closure)
```

**MVP scope**: WP01 + WP02 + WP03 (core identity + installer + operational cleanup).

---

## Requirement Coverage Map

| Requirement | Work Package |
|-------------|--------------|
| FR-001, FR-002, FR-003, FR-004 | WP01 |
| FR-005, FR-007 | WP02 |
| FR-006, FR-011, FR-012 | WP03 |
| FR-008, FR-009 | WP04 |
| FR-010 | WP05 |
| NFR-001 | WP02 |
| NFR-002 | WP03, WP04 |
| NFR-003 | WP05 |
| NFR-004 | WP02, WP05 |
