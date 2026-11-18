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

# Spec: Pack Assemble Fix — DRG Graph Naming + Compilation Automation

**Mission**: pack-assemble-drg-fix-01KT6K2Y
**Status**: Draft
**Created**: 2026-06-03
**Target branch**: overhaul/migrate_to_kitty

---

## Purpose

Fix a silent naming mismatch that causes `spec-kitty doctrine pack validate` to skip DRG
validation and `spec-kitty doctrine pack assemble` to drop the pack's DRG content, by
renaming the graph file to the correct convention, automating its regeneration, and wiring
that step into the CI pipeline.

---

## Background and Context

`pack_assembler.py` and `pack_validator.py` both resolve org-pack DRG fragments with:

```python
fragments = sorted(drg_dir.glob("*.graph.yaml"))
```

The pack currently contains `pack/drg/graph.yaml`. That filename does **not** match
`*.graph.yaml` (the glob requires a dot-prefix before `graph.yaml`, e.g.
`regnology-default.graph.yaml`). As a result:

- `pack validate` produces 0 DRG errors and 0 DRG warnings — not because the graph is
  correct, but because the graph file is never loaded.
- `pack assemble` produces assembled packs with no DRG contribution from our pack.
- The runtime path (`load_org_pack` → `drg/fragment.yaml`) is unaffected; `doctor
  doctrine` and `charter context` work correctly.

Additionally, `fragment.yaml` is the authored source but the compiled
`regnology-default.graph.yaml` must be regenerated each time `fragment.yaml` changes.
No automation exists for this step — it is currently done manually. After today's
FR-028 pack repair, `graph.yaml` is already stale relative to `fragment.yaml`.

The upstream fix (a `spec-kitty doctrine pack compile-drg` command) is tracked under
spec-kitty #1619 and is not yet scheduled. This mission implements the distribution-end
equivalent so the pack functions correctly without waiting for upstream.

---

## Functional Requirements

### FR-001: Correct DRG file naming

`pack/drg/regnology-default.graph.yaml` must exist and match the `*.graph.yaml` glob
pattern used by `pack_assembler.py` and `pack_validator.py`.

**Acceptance criteria:**
- `list(Path("pack/drg").glob("*.graph.yaml"))` returns a non-empty list.
- `spec-kitty doctrine pack validate pack/` reports 0 DRG errors.
- The file's content is a valid `DRGGraph` YAML (schema_version 1.0, nodes list with
  urn/kind/label/body_path, edges list with source/target/relation).

### FR-002: Automated graph compilation script

`tools/compile-drg.py` must be a standalone script that reads `pack/drg/fragment.yaml`
via the `doctrine` Python API and writes `pack/drg/regnology-default.graph.yaml`.

**Acceptance criteria:**
- Running `python tools/compile-drg.py` from the repository root produces (or refreshes)
  `pack/drg/regnology-default.graph.yaml`.
- The script uses `doctrine.drg.org_pack_loader.load_org_pack` and the merge bridge
  (`_bridge_org_node_to_drg_node`, `_bridge_org_edge_to_drg_edge`) to produce valid URNs.
- The script prints a summary of nodes/edges written and exits 0 on success, 1 on error.
- The script is executable directly (`python tools/compile-drg.py`) with no extra
  arguments required.

### FR-003: CI compilation stage

The `Jenkinsfile` pipeline must regenerate `regnology-default.graph.yaml` from
`fragment.yaml` before the `Package` stage runs.

**Acceptance criteria:**
- A `Compile DRG Graph` stage exists in the pipeline before `Package`.
- The stage runs `python tools/compile-drg.py` inside the `tools` container.
- On failure, the stage marks the build as failed (no `catchError` wrapper).

### FR-004: Staleness guard

A mechanism must warn or block when `fragment.yaml` is newer than
`regnology-default.graph.yaml`, preventing accidental distribution of a stale graph.

**Acceptance criteria:**
- A `Makefile` target `check-drg-fresh` compares mtimes and exits non-zero with a
  clear message if `fragment.yaml` is newer than `regnology-default.graph.yaml`.
- The `.cursor/hooks.json` (or pre-commit config) invokes `make check-drg-fresh` on
  pre-commit for any commit touching `pack/drg/fragment.yaml`.

### FR-005: Pack validate advisory suppression

`spec-kitty doctrine pack validate pack/` must exit with 0 errors and 0 advisories.
The 4 current advisories are about undeclared collision handling for artifacts that
intentionally enhance built-in spec-kitty equivalents.

**Acceptance criteria:**
- `pack/tactics/context-boundary-inference.tactic.yaml` declares `enhances: context-boundary-inference`.
- `pack/tactics/secure-design-checklist.tactic.yaml` declares `enhances: secure-design-checklist`.
- `pack/styleguides/java-conventions.styleguide.yaml` declares `enhances: java-conventions`.
- `pack/styleguides/python-conventions.styleguide.yaml` declares `enhances: python-conventions`.
- `spec-kitty doctrine pack validate pack/` reports `0 errors, 0 advisories`.

---

## Non-Goals

- Implementing `spec-kitty doctrine pack compile-drg` upstream (tracked separately).
- Changing the runtime `load_org_pack` path (reads `fragment.yaml` — already correct).
- Modifying `fragment.yaml` content (authored source, unchanged by this mission).

---

## Implementation Notes

The compile script must call into the `doctrine` package (importable from the `spec-kitty`
pipx venv at `/home/stijn/.local/share/pipx/venvs/spec-kitty-cli/bin/python`). The shebang
and the Jenkinsfile stage should both use the same interpreter resolution strategy:
prefer the pipx venv, fall back to `python3` on PATH.

The `DRGGraph` node format expected by `load_graph`:
```yaml
- urn: directive:MY_DIRECTIVE    # kind_singular:id
  kind: directive                # singular kind
  label: Human-readable title
  body_path: directives/my-directive.directive.yaml
```

The `OrgDRGFragment` node format in `fragment.yaml`:
```yaml
- id: MY_DIRECTIVE
  kind: directives               # plural kind
  title: Human-readable title
  body_path: directives/my-directive.directive.yaml
```

The URN conversion: `{kind_singular}:{id}`. Kind singularisation map is defined in
`doctrine.artifact_kinds.ArtifactKind` (or can be derived from the plural→singular
mapping already in `org_pack_loader`).
