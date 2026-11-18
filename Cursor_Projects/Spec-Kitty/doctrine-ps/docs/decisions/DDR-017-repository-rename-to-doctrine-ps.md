# DDR-017: Repository Rename to `doctrine-ps`

**Status:** Accepted
**Date:** 2026-06-30
**Author:** AAR Governance Group (recorded by Cursor agent)
**Related:** DDR-016 (Repository Scope Reduction)

---

## Context

The AAR governance group directed that the governance source repository be renamed from
`regnology-agent-doctrine` to **`doctrine-ps`**. The shorter name aligns the repository with the
Professional Services (PS) departmental identity and the AAR naming conventions.

Two distinct identifiers are affected by — and must be distinguished in — this rename:

1. **Repository slug** (`cons/regnology-agent-doctrine` → `cons/doctrine-ps`): the Bitbucket
   repo name, clone URLs, local checkout directory, and descriptive prose in docs.
2. **Pack slug** (`ps-agent-enabled-factory`): the spec-kitty doctrine pack identifier used in
   `spec-kitty doctrine fetch --pack …`, the DRG graph filename
   (`ps-agent-enabled-factory.graph.yaml`), `MANIFEST.yml`, the `fragment.yaml` header, and every
   engagement repo's `.kittify/config.yaml`. This is a **separate token** from the repo slug.

## Decisions

### Decision 1 — Repository slug renamed to `doctrine-ps`

The repository is renamed `regnology-agent-doctrine` → `doctrine-ps`. The following **live**
references are updated to the new slug:

- `README.md`, `docs/SURFACES.md`, `docs/OVERVIEW.md`
- `docs/installation/HOW_TO_USE.md`, `docs/installation/HOW_TO_SETUP.md` (clone URLs, local
  checkout/cache paths, directory trees, Bitbucket project/zip URLs)
- `.kittify/charter/charter.md` (Project Identity → Name)

### Decision 2 — Historical records are NOT rewritten

Engineering notes and prior DDRs (`docs/engineering_notes/*`, `docs/decisions/DDR-014`,
`DDR-016`, `docs/pack-migration-plan.md`) reference `regnology-agent-doctrine` as the repository
existed at the time of writing. These are append-only historical records; rewriting them would
falsify provenance. They are left intact, and this DDR supersedes their naming where current
state matters. The same applies to machine-managed history
(`*/status.events.jsonl`, `.kittify/encoding-provenance/`, `.kittify/canonical-events.jsonl`).

### Decision 3 — Pack slug `ps-agent-enabled-factory` is unchanged by this DDR

Renaming the spec-kitty pack slug is a **breaking change** for all downstream engagement repos
that fetch the pack and is therefore out of scope for this rename. Any change to the pack slug
must be captured in its own DDR and executed as a dedicated, migration-aware mission. (The "ps"
in `ps-agent-enabled-factory` already encodes the departmental identity.)

## Consequences / Follow-ups (coordination required)

- **Git remote** must be repointed: `git remote set-url origin ssh://git@bitbucket.regnology.net:7999/cons/doctrine-ps.git`.
- **Local checkout directory** rename (`regnology-agent-doctrine/` → `doctrine-ps/`) is performed
  by each developer; reopen the workspace afterwards.
- **SonarQube project key** (`Jenkinsfile`, `-Dsonar.projectKey=regnology-agent-doctrine`) is an
  external CI binding; it is **not** changed here. Renaming it requires the SonarQube project to
  be renamed/created by CI admins to avoid orphaning analysis history.
- **spec-kitty project slug** (`.kittify/config.yaml`, `slug: regnology-agent-doctrine`) is left
  unchanged pending confirmation, because changing it mid-mission can desync active mission
  lanes; if required, use a spec-kitty-supported rename path rather than a manual edit.
