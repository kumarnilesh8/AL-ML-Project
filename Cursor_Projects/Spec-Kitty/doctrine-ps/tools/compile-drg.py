#!/usr/bin/env python3
# +----------------------------------------------------+
# |####          R E G N O L O G Y                     |
# |    ##        Professional Services                 |
# |####                                                |
# |    ##        professional_services@regnology.net   |
# +----------------------------------------------------+
#
# Property of Regnology Group GmbH - All Rights Reserved
#               FOR INTERNAL USE ONLY
# =============================================================================
"""Compile pack/drg/fragment.yaml → pack/drg/<pack_name>.graph.yaml.

This is the distribution-end substitute for the upstream ``spec-kitty doctrine
pack compile-drg`` command (spec-kitty #1619 — not yet scheduled).

``pack_assembler.py`` and ``pack_validator.py`` both resolve org-pack DRG
fragments via ``drg_dir.glob("*.graph.yaml")``.  The authored source is named
``fragment.yaml`` — it does not match that glob and is therefore invisible to
the assembler/validator.  This script produces ``<pack_name>.graph.yaml``
(``ps-agent-enabled-factory.graph.yaml``) which matches the ``*.graph.yaml``
convention and contains a valid DRGGraph document with all pack-owned nodes
and edges.  ``pack_name`` and ``layer_index`` are read from the fragment header.

Cross-layer augmentation edges (where the source is a built-in SK agent not
declared as a pack node) are preserved by synthesising an ``agent_profile:``
URN for the built-in source.  At pack-assemble time the runtime merge engine
reconciles these against the full built-in node universe.

Usage::

    python tools/compile-drg.py [--pack-root PATH]

    --pack-root   Path to the pack root directory (default: pack/).
                  The script reads  <pack-root>/drg/fragment.yaml and writes
                  <pack-root>/drg/<pack_name>.graph.yaml.

Exit codes:
    0  Success.
    1  Fragment load error or validation failure.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Interpreter bootstrap — if the current interpreter does not have the
# ``doctrine`` package available, locate the spec-kitty pipx venv Python and
# re-exec this script under it.  This allows ``python3 tools/compile-drg.py``
# to work from the repo root without activating the venv first.
#
# The doctrine package contains compiled C extensions (pydantic-core) which
# means we cannot just add paths to sys.path — we must use the same interpreter
# binary that the spec-kitty venv was created with.
# ---------------------------------------------------------------------------
_SPEC_KITTY_PYTHON = Path.home() / ".local/share/pipx/venvs/spec-kitty-cli/bin/python"


def _ensure_doctrine() -> None:
    """Re-exec under the spec-kitty venv Python if doctrine is not importable."""
    try:
        import doctrine  # noqa: F401
        return
    except ImportError:
        pass

    if not _SPEC_KITTY_PYTHON.exists():
        print(
            "ERROR: doctrine package not importable and spec-kitty pipx venv not found.\n"
            f"  Expected: {_SPEC_KITTY_PYTHON}\n"
            "  Install with: pipx install spec-kitty-cli",
            file=sys.stderr,
        )
        sys.exit(1)

    os.execv(str(_SPEC_KITTY_PYTHON), [str(_SPEC_KITTY_PYTHON)] + sys.argv)


_ensure_doctrine()

import yaml  # noqa: E402  (imported after the re-exec guard)

try:
    from doctrine.drg.merge import _PLURAL_TO_SINGULAR, _bridge_org_edge_to_drg_edge, _bridge_org_node_to_drg_node
    from doctrine.drg.org_pack_loader import (
        OrgDRGFragment,
        OrgPackMissingError,
        OrgPackParseError,
        OrgPackSchemaError,
        _collect_augmentation_edges,
        load_org_pack,
    )
except ImportError as exc:
    print(
        f"ERROR: cannot import doctrine package.\n"
        f"  Expected pipx venv at: {_SPEC_KITTY_PYTHON.parent.parent}\n"
        f"  Make sure spec-kitty is installed: pipx install spec-kitty-cli\n"
        f"  {exc}",
        file=sys.stderr,
    )
    sys.exit(1)

def _load_base_pack_urns(base_pack: Path) -> dict[str, str]:
    """Return an ``id -> urn`` map from the parent-layer (base) pack's compiled DRG.

    The PS overlay references artefacts that were promoted to the
    ``regnology-all-company`` layer (e.g. ``regnology-mcp`` → toolguide,
    ``professional-communications`` → styleguide).  Those targets are absent from
    this fragment, so without the parent inventory the compiler can only fall back
    to the ``directive:`` kind — producing cross-layer edges that never resolve at
    assemble time.  Reading the base pack's ``drg/*.graph.yaml`` lets each
    cross-layer target carry its TRUE kind, so an assembled (base + overlay) pack
    validates with zero dangling edges.
    """
    mapping: dict[str, str] = {}
    drg_dir = base_pack / "drg"
    graphs = sorted(drg_dir.glob("*.graph.yaml"))
    if not graphs:
        print(
            f"  WARNING: --base-pack {base_pack} has no drg/*.graph.yaml; "
            "cross-layer edge kinds will fall back to directive:",
            file=sys.stderr,
        )
        return mapping
    for graph_path in graphs:
        try:
            with graph_path.open("r", encoding="utf-8") as fh:
                doc = yaml.safe_load(fh) or {}
        except (OSError, yaml.YAMLError) as exc:
            print(f"  WARNING: cannot read base graph {graph_path}: {exc}", file=sys.stderr)
            continue
        for node in doc.get("nodes", []):
            urn = node.get("urn")
            if not urn or ":" not in urn:
                continue
            mapping.setdefault(urn.split(":", 1)[-1], urn)
    return mapping


def _resolve_kind_label(kind: Any) -> str | None:
    """Normalise plural fragment labels to singular URN kind labels."""
    if not isinstance(kind, str):
        return None
    value = kind.strip()
    if not value:
        return None
    return _PLURAL_TO_SINGULAR.get(value, value)


def _load_local_pack_urns(pack_root: Path) -> dict[str, str]:
    """Return an ``id -> urn`` map for local artefacts in ``pack/`` directories."""
    mapping: dict[str, str] = {}
    for plural_kind, singular_kind in sorted(_PLURAL_TO_SINGULAR.items()):
        kind_dir = pack_root / plural_kind
        if not kind_dir.is_dir():
            continue
        for artefact_path in sorted(kind_dir.iterdir()):
            if artefact_path.suffix.lower() not in {".yaml", ".yml"}:
                continue
            try:
                payload = yaml.safe_load(artefact_path.read_text(encoding="utf-8")) or {}
            except (OSError, yaml.YAMLError) as exc:
                print(f"  WARNING: cannot read local artefact {artefact_path}: {exc}", file=sys.stderr)
                continue
            if not isinstance(payload, dict):
                continue
            artefact_id = payload.get("id") or payload.get("profile-id")
            if not artefact_id:
                continue
            mapping.setdefault(str(artefact_id), f"{singular_kind}:{artefact_id}")
    return mapping


def _load_fragment_external_urns(fragment_path: Path) -> dict[str, str]:
    """Return ``id -> urn`` map from ``external_nodes`` declarations."""
    try:
        payload = yaml.safe_load(fragment_path.read_text(encoding="utf-8")) or {}
    except (OSError, yaml.YAMLError) as exc:
        print(f"  WARNING: cannot read external_nodes from {fragment_path}: {exc}", file=sys.stderr)
        return {}
    if not isinstance(payload, dict):
        return {}
    mapping: dict[str, str] = {}
    for item in payload.get("external_nodes", []) or []:
        if not isinstance(item, dict):
            continue
        node_id = str(item.get("id", "")).strip()
        kind = _resolve_kind_label(item.get("kind"))
        if not node_id or not kind:
            continue
        mapping[node_id] = f"{kind}:{node_id}"
    return mapping


def _load_org_pack_compat(pack_name: str, pack_root: Path, layer_index: int) -> OrgDRGFragment:
    """Load fragment, tolerating additive ``external_nodes`` declarations."""
    try:
        return load_org_pack(pack_name, pack_root, layer_index)
    except OrgPackSchemaError as exc:
        if "external_nodes" not in str(exc):
            raise

    fragment_yaml = pack_root / "drg" / "fragment.yaml"
    try:
        fragment_data = yaml.safe_load(fragment_yaml.read_text(encoding="utf-8")) or {}
    except Exception as exc:  # noqa: BLE001
        raise OrgPackParseError(
            f"Org pack {pack_name!r}: YAML parse error in {fragment_yaml}: {exc}"
        ) from exc

    # Allow additive external node declarations that older doctrine loaders
    # do not yet accept in OrgDRGFragment.
    fragment_data.pop("external_nodes", None)
    fragment_data["pack_name"] = pack_name
    fragment_data["source_kind"] = "local_path"
    fragment_data["source_ref"] = str(pack_root)
    fragment_data["layer_index"] = layer_index

    existing_edges = fragment_data.setdefault("edges", []) or []
    seen: set[tuple[str, str, str]] = set()
    for edge in existing_edges:
        if isinstance(edge, dict):
            seen.add(
                (
                    str(edge.get("source", "")),
                    str(edge.get("target", "")),
                    str(edge.get("relation", "")),
                )
            )
    for auto_edge in _collect_augmentation_edges(pack_root):
        key = (auto_edge["source"], auto_edge["target"], auto_edge["relation"])
        if key in seen:
            continue
        existing_edges.append(auto_edge)
        seen.add(key)
    fragment_data["edges"] = existing_edges

    try:
        return OrgDRGFragment.model_validate(fragment_data)
    except Exception as exc:  # noqa: BLE001
        raise OrgPackSchemaError(
            f"Org pack {pack_name!r}: schema validation error in {fragment_yaml}: {exc}"
        ) from exc


def _discover_base_pack(pack_root: Path) -> Path | None:
    """Resolve configured doctrine org-pack path from .kittify/config.yaml."""
    config_path = pack_root.parent / ".kittify" / "config.yaml"
    try:
        payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    except (OSError, yaml.YAMLError):
        return None
    if not isinstance(payload, dict):
        return None

    packs = (
        payload.get("doctrine", {})
        .get("org", {})
        .get("packs", [])
    )
    if not isinstance(packs, list):
        return None

    for pack in packs:
        if not isinstance(pack, dict):
            continue
        local_path = pack.get("local_path")
        if not isinstance(local_path, str) or not local_path.strip():
            continue
        root = Path(local_path)
        if not root.is_absolute():
            root = pack_root.parent / root
        subdir = pack.get("subdir")
        if isinstance(subdir, str) and subdir.strip():
            root = root / subdir
        if root.is_dir():
            return root
    return None


def _stable_generated_at(fragment_path: Path) -> str:
    """Return deterministic generated_at value for reproducible graph output."""
    source_date_epoch = os.environ.get("SOURCE_DATE_EPOCH")
    if source_date_epoch:
        try:
            ts = int(source_date_epoch)
            return datetime.fromtimestamp(ts, timezone.utc).isoformat()
        except ValueError:
            pass
    return datetime.fromtimestamp(fragment_path.stat().st_mtime, timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Agents that are built-in SK profiles (not declared in the pack fragment)
# but appear as edge *sources* in the pack's augmentation section.  We assign
# them agent_profile URNs so the edges are preserved in the compiled graph.
# ---------------------------------------------------------------------------
_BUILTIN_AGENT_SOURCES = {
    "frontend-freddy",
    "java-jenny",
    "python-pedro",
    "debugger-debbie",
    "paula-patterns",
    "implementer-ivan",
    "backend-benny",
    "curator-carla",
    "designer-dagmar",
    "architect-alphonso",
    "reviewer-renata",
    "researcher-robbie",
    "planner-priti",
    "node-norris",
    "generic-agent",
    "human-in-charge",
    "doctrine-daphne",
    "retrospective-facilitator",
}


def compile_drg(pack_root: Path, base_pack: Path | None = None) -> int:
    """Compile fragment.yaml to ``<pack_name>.graph.yaml``.

    ``pack_name`` and ``layer_index`` are read from the fragment's own header so
    the compiled artifact is self-consistent with the authored source.

    When ``base_pack`` is supplied (the parent-layer pack, e.g.
    ``regnology-all-company``), cross-layer edge targets resolve to the promoted
    artefact's TRUE kind from the base pack's compiled graph rather than the
    ``directive:`` fallback — a prerequisite for an assembled (base + overlay)
    pack to validate with zero dangling edges.

    Returns 0 on success, 1 on failure.
    """
    fragment_path = pack_root / "drg" / "fragment.yaml"

    # Read identity from the fragment header so the graph is self-describing
    # (pack_name + layer_index are authored in fragment.yaml, not hardcoded).
    try:
        with fragment_path.open("r", encoding="utf-8") as fh:
            _fragment_header = yaml.safe_load(fh) or {}
    except (OSError, yaml.YAMLError) as exc:
        print(f"ERROR: cannot read {fragment_path}: {exc}", file=sys.stderr)
        return 1
    pack_name = _fragment_header.get("pack_name", "ps-agent-enabled-factory")
    layer_index = int(_fragment_header.get("layer_index", 2))
    output_path = pack_root / "drg" / f"{pack_name}.graph.yaml"

    # --- Load and validate fragment ------------------------------------------
    print(f"Loading fragment: {fragment_path}")
    try:
        fragment = _load_org_pack_compat(pack_name, pack_root, layer_index)
    except OrgPackMissingError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except (OrgPackParseError, OrgPackSchemaError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"  Fragment loaded: {len(fragment.nodes)} nodes, {len(fragment.edges)} edges")

    # --- Bridge nodes ---------------------------------------------------------
    source_marker = f"org:{pack_name}"
    node_id_to_urn: dict[str, str] = {}
    compiled_nodes: list[dict] = []

    for node in fragment.nodes:
        try:
            urn, drg_node = _bridge_org_node_to_drg_node(node, source_marker)
        except Exception as exc:  # noqa: BLE001
            print(f"  WARNING: skipping node {node.id!r}: {exc}", file=sys.stderr)
            continue
        node_id_to_urn[node.id] = urn
        entry: dict = {"urn": urn, "kind": drg_node.kind.value, "label": node.title}
        if node.body_path:
            entry["body_path"] = node.body_path
        compiled_nodes.append(entry)

    # Extend the id→urn map with known built-in agent profiles so that
    # augmentation edges referencing built-ins are preserved.
    for builtin_id in _BUILTIN_AGENT_SOURCES:
        if builtin_id not in node_id_to_urn:
            node_id_to_urn[builtin_id] = f"agent_profile:{builtin_id}"

    # Resolve pack-local targets to their real kind prefixes (toolguide/,
    # paradigm/, styleguide/, ...) instead of falling back to directive:.
    local_urns = _load_local_pack_urns(pack_root)
    for _id, _urn in local_urns.items():
        node_id_to_urn.setdefault(_id, _urn)
    print(f"  Local pack inventory: {len(local_urns)} URNs")

    # Resolve declared cross-layer references from fragment external_nodes.
    external_urns = _load_fragment_external_urns(fragment_path)
    for _id, _urn in external_urns.items():
        node_id_to_urn.setdefault(_id, _urn)
    if external_urns:
        print(f"  External node inventory: {len(external_urns)} declared URNs")

    # Extend with parent-layer (base pack) URNs so cross-layer edges resolve to
    # the promoted artefact's TRUE kind (toolguide:/paradigm:/styleguide:/tactic:/
    # procedure:/directive:) instead of the directive: fallback.  Overlay-owned
    # ids retain precedence (setdefault never overwrites an existing entry).
    if base_pack is not None:
        base_urns = _load_base_pack_urns(base_pack)
        for _id, _urn in base_urns.items():
            node_id_to_urn.setdefault(_id, _urn)
        print(f"  Base pack inventory: {len(base_urns)} parent-layer URNs ({base_pack})")

    # Extend with built-in graph URNs so cross-layer target edges resolve
    # to the correct kind instead of defaulting to ``directive:``.
    try:
        from charter.catalog import resolve_doctrine_root
        from doctrine.drg.loader import load_graph as _load_builtin

        builtin_graph = _load_builtin(resolve_doctrine_root() / "graph.yaml")
        for _node in builtin_graph.nodes:
            _id = _node.urn.split(":", 1)[-1]
            if _id not in node_id_to_urn:
                node_id_to_urn[_id] = _node.urn
    except Exception:  # noqa: BLE001
        pass  # built-in graph unavailable — cross-layer targets fall back to directive:

    # --- Bridge edges (deduplicated) -----------------------------------------
    # load_org_pack's backward-compat field-projection path may synthesise edges
    # that are already authored explicitly in fragment.yaml.  Deduplicating on
    # (source, target, relation) eliminates the duplicate_drg_edge advisories
    # that pack_validator raises when the same edge appears twice in the graph.
    compiled_edges: list[dict] = []
    seen_edges: set[tuple[str, str, str]] = set()
    skipped_edges = 0

    for edge in fragment.edges:
        try:
            drg_edge = _bridge_org_edge_to_drg_edge(edge, node_id_to_urn, source_marker)
        except Exception as exc:  # noqa: BLE001
            print(f"  WARNING: skipping edge {edge.source!r}→{edge.target!r}: {exc}", file=sys.stderr)
            skipped_edges += 1
            continue
        if drg_edge is None:
            print(f"  WARNING: skipping edge {edge.source!r}→{edge.target!r}: source not in pack node index", file=sys.stderr)
            skipped_edges += 1
            continue
        key = (drg_edge.source, drg_edge.target, drg_edge.relation.value)
        if key in seen_edges:
            continue
        seen_edges.add(key)
        compiled_edges.append({
            "source": drg_edge.source,
            "target": drg_edge.target,
            "relation": drg_edge.relation.value,
        })

    # --- Serialise ------------------------------------------------------------
    document = {
        "schema_version": "1.0",
        "generated_at": _stable_generated_at(fragment_path),
        "generated_by": "tools/compile-drg.py",
        "pack_name": pack_name,
        "layer_index": layer_index,
        "nodes": compiled_nodes,
        "edges": compiled_edges,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        yaml.dump(document, fh, allow_unicode=True, sort_keys=False, default_flow_style=False)

    print(
        f"Written: {output_path}\n"
        f"  {len(compiled_nodes)} nodes, {len(compiled_edges)} edges"
        + (f" ({skipped_edges} edges skipped)" if skipped_edges else "")
    )
    return 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compile pack/drg/fragment.yaml → pack/drg/<pack_name>.graph.yaml"
    )
    parser.add_argument(
        "--pack-root",
        type=Path,
        default=Path(__file__).parent.parent / "pack",
        help="Path to the pack root directory (default: pack/ relative to repo root)",
    )
    parser.add_argument(
        "--base-pack",
        type=Path,
        default=(Path(os.environ["BASE_PACK_DIR"]) if os.environ.get("BASE_PACK_DIR") else None),
        help=(
            "Path to the parent-layer (base) pack root, e.g. the regnology-all-company "
            "pack. When provided, cross-layer DRG edge targets resolve to their true kind "
            "from the base pack's compiled graph instead of defaulting to directive:. "
            "Also honoured via the BASE_PACK_DIR environment variable."
        ),
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    base_pack = args.base_pack or _discover_base_pack(args.pack_root)
    sys.exit(compile_drg(args.pack_root, base_pack))
