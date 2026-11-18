# Adversarial Review Squad Report

Mission: `ps-departmental-rebrand-and-extend-all-company-pack-01KVD1M1`  
Date: 2026-06-18  
Execution mode: delegated multi-profile adversarial review  
Model discipline: all delegated reviewers run on `gpt-5.5-medium` (text-only review workload; no premium tier needed)

## Squad composition (Spec Kitty built-in profiles)

- `reviewer-renata` — quality/compliance lens
- `architect-alphonso` — architecture/boundary lens
- `curator-carla` — doctrine taxonomy/traceability lens
- `debugger-debbie` — failure-mode/regression lens

Each profile was loaded via `spec-kitty dispatch ... --profile <id> --json` before delegation.

## Consolidated findings

### Critical

- **None unanimously identified as critical.**

### High (consensus blockers before `/spec-kitty.tasks`)

1. **Occurrence map contradiction with required slug migration**
   - `occurrence_map.yaml` currently sets `cli_commands: do_not_change` (and related conservative defaults), while mission FRs require active install/fetch/distribution references to migrate from `regnology-default` to `ps-agent-enabled-factory`.
   - Risk: stale active commands/paths survive and break atomic migration.

2. **Generated surface cleanup is underspecified for canon preservation**
   - The plan requires untracking `.cursor/` and `.claude/`, but reviewers flagged missing relocation inventory and destination mapping for hand-authored files.
   - Risk: accidental loss of repository behavior/config canon.

3. **Installer parity contract is too weak**
   - Contract checks ordering conceptually but not shell/PowerShell behavior equivalence.
   - Risk: one installer diverges, causing asymmetric deployment/bootstrap behavior.

4. **`extends` enforcement proof gap**
   - Metadata says `extends: regnology-all-company`, but review flagged need for stronger evidence that composition semantics are actually enforced (vs declarative-only no-op).

### Medium

- Quickstart grep checks are noisy and insufficiently scoped to active vs historical references.
- Layering wording in plan/contract may still be interpreted ambiguously as one vs two artifacts.

## Squad verdict

**Not Ready for `/spec-kitty.tasks` yet.**

Required pre-task updates:

1. Refine `occurrence_map.yaml` so active command/path/value surfaces needed for the slug migration are `rename` or explicit `manual_review` with path-level exceptions.
2. Add a surface inventory artifact for `.cursor`/`.claude` with classification + relocation destination for each non-generated file.
3. Strengthen installer acceptance criteria to assert shell/PowerShell parity and syntax validation.
4. Add explicit evidence checks for `extends` layering semantics beyond key presence.
