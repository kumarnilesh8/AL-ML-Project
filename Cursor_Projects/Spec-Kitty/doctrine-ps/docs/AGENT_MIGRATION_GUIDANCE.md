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

# Agent Migration Guidance — `doctrine/` → `pack/`

**Audience:** Coding agents (Claude Code, Cursor agents, spec-kitty agents) working in this
repository or in downstream engagement repositories that consume the Regnology PS pack.  
**Status:** Active — migration in progress. This document is authoritative for the duration of
the migration window and should be consulted whenever you encounter a `doctrine/` file.

---

## What is happening

The Regnology PS governance stack is being migrated from freeform Markdown files in `doctrine/`
to typed YAML artifacts in `pack/`. The `pack/` directory is a spec-kitty org doctrine pack
distributed to engagement repos via `spec-kitty doctrine fetch`.

During the migration window both directories coexist. **`pack/` is the authoritative source for
any artifact that has been migrated.** `doctrine/` is the source of truth only for artifacts that
have not yet been converted.

When migration is complete, `doctrine/` will be deleted. Do not treat it as a permanent fixture.

---

## Quick reference: which source to use

| You need… | Check first | Fall back to |
|---|---|---|
| A directive | `pack/directives/*.directive.yaml` | `doctrine/directives/` |
| A tactic | `pack/tactics/*.tactic.yaml` | `doctrine/tactics/` |
| A styleguide | `pack/styleguides/*.styleguide.yaml` | `doctrine/styleguides/` |
| A toolguide | `pack/toolguides/*.toolguide.yaml` | `doctrine/toolguides/` |
| An agent profile | `pack/agent_profiles/*.agent.yaml` | `doctrine/agents/` |
| A procedure | `pack/procedures/*.procedure.yaml` | `doctrine/approaches/` |
| A paradigm | `pack/paradigms/*.paradigm.yaml` | `doctrine/approaches/` |

If a YAML artifact exists in `pack/`, it supersedes the corresponding Markdown original.
**Never modify a `doctrine/` Markdown file if the artifact has already been migrated to `pack/`.**

---

## Current migration state

See `docs/pack-migration-plan.md` § 6 (Batch Tracker) for the definitive list of what has been
migrated. As of the latest commit:

- **Batch 1 (complete):** 4 directives (D041–D044), 3 toolguides, 7 agent profiles
- **Batch 2 (complete):** 3 directives (D018, D022, D023), 9 tactics (Domain D + E),
  2 styleguides, 2 procedures, 1 paradigm
- **Batch 3 onward:** pending — check `docs/pack-migration-plan.md` for current status

---

## Rules for working in this repository

### Reading doctrine

1. **Use `pack/` first.** If the artifact you need exists there, use the YAML.
2. **Fall back to `doctrine/` only if the artifact is not yet in `pack/`.** Note the
   fallback in any reasoning you produce; do not cite `doctrine/` files as if they were
   canonical when a `pack/` equivalent exists.
3. **Treat stale `doctrine/` cross-references as noise.** Many `doctrine/` files reference each
   other using relative Markdown paths (e.g. `../tactics/foo.tactic.md`). These paths may point
   to files that no longer exist or have been superseded. Follow the intent, not the path.

### Writing or modifying doctrine

1. **Never add new governance content to `doctrine/`.** All new artifacts go into `pack/` as
   typed YAML. If you need a new directive, tactic, styleguide, or agent profile, create it in
   the appropriate `pack/` subdirectory following the schemas in `tests/test_pack_schema_validation.py`.
2. **Never edit a `doctrine/` file that has a `pack/` equivalent.** If you need to update a
   migrated artifact, edit the YAML in `pack/`.
3. **Validate before committing.** Run `python -m pytest tests/test_pack_schema_validation.py`
   after creating or editing any `pack/` artifact. All tests must pass (4 xfailed is expected
   until the upstream `guide_path` fix lands; those will become PASS once merged).

### Referencing artifacts from other files

Prefer pack-relative references in documentation and other artifacts:

```markdown
# Good — pack-relative
See pack directive `APPSEC_COMPLIANCE` for security gate requirements.
Invoke tactic `appsec-pipeline-setup` to configure the Jenkins pipeline.

# Avoid — absolute doctrine/ path (legacy, may be deleted)
See doctrine/directives/043_appsec_compliance.md
```

When writing YAML artifacts that cross-reference others, use the artifact `id` field, not a
file path.

---

## Rules for working in downstream engagement repositories

Engagement repositories receive the Regnology PS pack via:

```bash
spec-kitty doctrine fetch --pack regnology-default
```

In engagement repos there is no `doctrine/` directory. All governance content arrives through
the pack. The rules are simpler:

1. **Do not recreate `doctrine/` directories in engagement repos.** The pack is the governance
   layer; project-specific overrides belong in the project's own `.doctrine-config/`.
2. **Do not fork pack artifacts into the engagement repo.** If a pack artifact needs to change,
   the change belongs in this repository (the pack source), not in the consuming project.
3. **Project-specific content** (Jira conventions, tenant-specific toolguide extensions,
   project ADRs) belongs in `.doctrine-config/` per the `CORPORATE_TOOLING` directive.

---

## Identifying a migrated artifact

A `doctrine/` Markdown file has been migrated if a corresponding YAML exists in `pack/` with
a matching `id`. The mapping conventions are:

| Markdown filename pattern | Pack id convention |
|---|---|
| `043_appsec_compliance.md` | `APPSEC_COMPLIANCE` (directive, UPPER_SNAKE) |
| `appsec-pipeline-setup.tactic.md` | `appsec-pipeline-setup` (tactic, kebab-case) |
| `java-jenny.agent.md` | `java-jenny` (agent profile, kebab-case) |
| `google-cloud-mcp.md` | `google-cloud-mcp` (toolguide, kebab-case) |

If you are unsure, check `pack/` with:

```bash
# List all migrated artifact ids by kind
find pack/ -name "*.yaml" | xargs grep -h '^id:' | sort
```

---

## Handling references to doctrine/ files you find in the wild

If you encounter a reference to a `doctrine/` path inside a source file, comment, or document:

1. Check whether the artifact has been migrated to `pack/`.
2. If yes — update the reference to use the pack artifact `id` (or remove the reference if it
   was just providing context that is now obvious from the pack).
3. If no — leave the reference intact; the `doctrine/` file is still authoritative.
4. Do not silently drop references to unmigrated artifacts; the content may be load-bearing.

---

## What happens at migration completion

When all batches are done:

1. The `doctrine/` directory is deleted.
2. This guidance document is archived or updated to a "migration complete" state.
3. `CLAUDE.md` is updated to remove migration-window instructions.
4. Downstream engagement repos are notified to re-run `spec-kitty doctrine fetch`.

The authoritative signal that migration is complete is the deletion of `doctrine/` in the git
history of this repository. Until that commit lands, the migration window is still open and these
rules apply.
