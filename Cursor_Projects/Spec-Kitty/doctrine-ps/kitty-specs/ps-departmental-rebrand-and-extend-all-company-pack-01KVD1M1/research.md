# Research: PS Departmental Rebrand + All-Company Extension

## Inputs reviewed

- `spec.md` for mission scope and FR/NFR constraints.
- `.kittify/charter/charter.md` for directory and quality gate policies.
- Current repository state (`git status`, tracked counts for `.cursor`/`.claude`).
- Upstream/epic context from Jira: `MIGRATION-1952`, `MIGRATION-2805`.

---

## Findings and decisions

### 1) Upstream pack identifier

- **Decision**: Keep upstream reference as `regnology-all-company`.
- **Rationale**: Confirmed by user and already aligned with upstream `RFG/skills` charter naming.
- **Alternatives considered**: `regnology-doctrine` label from conversational shorthand (rejected as non-canonical identifier).

### 2) Pack slug normalization

- **Decision**: Use `ps-agent-enabled-factory`.
- **Rationale**: Hyphenated lowercase slug matches established conventions and avoids mixed underscore/hyphen ambiguity.
- **Alternatives considered**: Keep `ps-agent_enabled-factory` (rejected: inconsistent and higher risk for tooling/path handling).

### 3) Generated-surface cleanup strategy

- **Decision**: Treat `.cursor/` and `.claude/` as generated surfaces to be untracked, with relocation of any hand-authored config first.
- **Rationale**: User direction explicitly prefers local generation; repository should keep canonical pack sources only.
- **Observed evidence**:
  - `.cursor`: 116 tracked files.
  - `.claude`: 1 tracked file; local config variants already partly ignored.
  - hand-authored candidates include `.cursor/hooks.json`, `.cursor/hooks/check-drg-fresh.sh`, `.claude/settings.json`.
- **Alternatives considered**:
  - Keep shipping all surfaces (rejected: drift and harness coupling).
  - Delete surfaces without relocation review (rejected: risk of losing canon).

### 4) Installer layering behavior

- **Decision**: Installer scripts should fetch the all-company base pack first and the PS departmental overlay second.
- **Rationale**: Enforces cumulative charter layering (upstream baseline + departmental additions).
- **Alternatives considered**:
  - Only fetch departmental pack (rejected: upstream baseline not guaranteed).
  - Vendor all-company content locally (rejected: duplication/drift).

### 5) Bulk-edit guardrail requirement

- **Decision**: Mark mission as `bulk_edit` and add `occurrence_map.yaml`.
- **Rationale**: Cross-cutting rename of a recurring slug (`regnology-default`) across docs/scripts/configs fits bulk-edit pattern.
- **Alternatives considered**:
  - Proceed as normal mission (rejected: implement/review gates may block and rename safety would be weaker).

---

## Risks to watch in implementation

1. **Atomicity risk**: partial slug migration can break install/fetch paths.
2. **Canon-loss risk**: untracking `.cursor`/`.claude` without relocation of non-generated files.
3. **Historical rewrite risk**: unintended edits to immutable engineering notes.
4. **Installer contract drift**: sequence/order mismatch between shell and PowerShell installers.

---

## Planning conclusion

Research is sufficient to proceed without additional clarification questions.
Implementation should be decomposed by concerns in `plan.md` and validated with pack/schema checks before moving to `/spec-kitty.tasks`.
