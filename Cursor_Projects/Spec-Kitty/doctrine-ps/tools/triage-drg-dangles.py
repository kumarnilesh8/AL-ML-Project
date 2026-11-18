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
"""Triage the cross-layer dangling DRG edges reported by standalone validation.

The PS overlay pack ``ps-agent-enabled-factory`` (layer 2) ``extends`` the
``regnology-all-company`` base pack (layer 1).  Run ON ITS OWN, the overlay
references artefacts that were promoted to the parent layer, so
``spec-kitty doctrine pack validate pack/`` reports them as
``drg_dangling_edge`` errors.  Those are EXPECTED — the authoritative gate is
the LAYERED validation of an assembled (base + overlay) tree (``make
validate-layered``).

This helper classifies every standalone dangling edge so a developer can tell
expected cross-layer references apart from genuine defects:

  * ``resolvable-cross-layer`` — the dangling target's FULL URN (kind + id) IS
    present in the base pack inventory.  An assembled (base + overlay) tree
    resolves it.  Not a defect.
  * ``genuine`` — the dangling target's full URN is ABSENT from the base
    inventory.  This includes a target whose bare id exists in the base pack but
    under a DIFFERENT kind (a kind-mismatched edge) — such an edge would also
    fail the layered validation, so it is correctly flagged as a real defect.

Exit codes:
    0  All dangling edges are resolvable-cross-layer (or there are none).
    1  One or more genuine dangles found, OR a usage/bootstrap error.

Usage::

    python3 tools/triage-drg-dangles.py [--pack-root PATH] [--base-pack PATH]

    --pack-root   Path to the overlay pack root (default: pack/).
    --base-pack   Path to the parent-layer (base) pack root, e.g. the cloned
                  regnology-all-company pack root.  Also honoured via the
                  BASE_PACK_DIR environment variable.  When omitted, falls
                  back to the org pack's ``local_path`` configured in
                  ``.kittify/config.yaml`` (mirrors tools/compile-drg.py).
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Interpreter bootstrap — mirror tools/compile-drg.py.  If the current
# interpreter cannot import ``yaml`` (PyYAML, bundled with the spec-kitty venv)
# re-exec this script under the spec-kitty pipx venv Python.  This lets
# ``python3 tools/triage-drg-dangles.py`` run from the repo root without
# activating the venv first.
# ---------------------------------------------------------------------------
_SPEC_KITTY_PYTHON = Path.home() / ".local/share/pipx/venvs/spec-kitty-cli/bin/python"


def _ensure_yaml() -> None:
    """Re-exec under the spec-kitty venv Python if yaml is not importable."""
    try:
        import yaml  # noqa: F401
        return
    except ImportError:
        pass

    if not _SPEC_KITTY_PYTHON.exists():
        print(
            "ERROR: PyYAML not importable and spec-kitty pipx venv not found.\n"
            f"  Expected: {_SPEC_KITTY_PYTHON}\n"
            "  Install with: pipx install spec-kitty-cli",
            file=sys.stderr,
        )
        sys.exit(1)

    os.execv(str(_SPEC_KITTY_PYTHON), [str(_SPEC_KITTY_PYTHON)] + sys.argv)


_ensure_yaml()

import yaml  # noqa: E402  (imported after the re-exec guard)

# Matches the trailing "target URN '<kind>:<id>'" fragment of a validator line:
#   ... (drg_dangling_edge) — Error: dangling DRG edge — target URN 'toolguide:regnology-mcp' ...
_DANGLE_RE = re.compile(r"target URN '([^']+)'")


def _discover_base_pack(pack_root: Path) -> Path | None:
    """Resolve configured doctrine org-pack path from .kittify/config.yaml.

    Mirrors ``_discover_base_pack`` in tools/compile-drg.py so both tools agree
    on where the cached org pack lives without hardcoding the path twice.
    """
    config_path = pack_root.parent / ".kittify" / "config.yaml"
    try:
        payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    except (OSError, yaml.YAMLError):
        return None
    if not isinstance(payload, dict):
        return None

    packs = payload.get("doctrine", {}).get("org", {}).get("packs", [])
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


def _collect_dangling_urns(pack_root: Path) -> list[str]:
    """Return every dangling target URN reported by standalone validation.

    Runs ``spec-kitty doctrine pack validate <pack_root>`` and scrapes the
    ``drg_dangling_edge`` lines.  Duplicates are preserved here (the same URN
    may dangle from multiple edges); de-duplication happens at classification.
    """
    proc = subprocess.run(
        ["spec-kitty", "doctrine", "pack", "validate", str(pack_root)],
        capture_output=True,
        text=True,
        check=False,
    )
    combined = proc.stdout + proc.stderr
    urns: list[str] = []
    for line in combined.splitlines():
        if "drg_dangling_edge" not in line:
            continue
        match = _DANGLE_RE.search(line)
        if match:
            urns.append(match.group(1))
    return urns


def _load_base_pack_urns(base_pack: Path) -> dict[str, str]:
    """Return an ``id -> urn`` map from the base pack's compiled DRG graphs.

    Mirrors ``_load_base_pack_urns`` in tools/compile-drg.py: read every
    ``<base>/drg/*.graph.yaml`` and index each node by the bare id that follows
    the URN's first ``:`` separator.
    """
    mapping: dict[str, str] = {}
    drg_dir = base_pack / "drg"
    graphs = sorted(drg_dir.glob("*.graph.yaml"))
    if not graphs:
        print(
            f"  WARNING: --base-pack {base_pack} has no drg/*.graph.yaml; "
            "every dangle will be classified as genuine.",
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


def triage(pack_root: Path, base_pack: Path | None) -> int:
    """Classify standalone dangling edges; return 0 if all resolvable, else 1."""
    if base_pack is None:
        print(
            "ERROR: no base pack provided and none discoverable via .kittify/config.yaml.\n"
            "  The base pack inventory is required to distinguish resolvable\n"
            "  cross-layer references from genuine defects.\n"
            "  Fetch it via spec-kitty, or clone it manually and pass it, e.g.:\n"
            "    spec-kitty doctrine fetch --pack regnology-all-company\n"
            "    git clone ssh://git@bitbucket.regnology.net:7999/raf/doctrine-org.git\n"
            "    BASE_PACK_DIR=/path/to/doctrine-org/pack python3 tools/triage-drg-dangles.py\n"
            "  (or pass --base-pack /path/to/doctrine-org/pack)",
            file=sys.stderr,
        )
        return 1
    if not base_pack.is_dir():
        print(f"ERROR: --base-pack {base_pack} is not a directory.", file=sys.stderr)
        return 1

    print(f"Collecting dangling edges: spec-kitty doctrine pack validate {pack_root}")
    dangles = _collect_dangling_urns(pack_root)
    unique_dangles = sorted(set(dangles))
    print(f"  {len(dangles)} dangling edge(s), {len(unique_dangles)} distinct target URN(s)")

    base_urns = _load_base_pack_urns(base_pack)
    base_urn_set = set(base_urns.values())
    print(f"  Base pack inventory: {len(base_urns)} parent-layer URNs ({base_pack})")

    # Classify on the FULL URN (kind + id), not the bare id: a target whose id
    # exists in the base pack but under a different kind is a kind-mismatched
    # edge that the layered (assembled) validation would also reject, so it must
    # be reported as genuine rather than masked as resolvable.
    resolvable: list[str] = []
    genuine: list[str] = []
    for urn in unique_dangles:
        if urn in base_urn_set:
            resolvable.append(urn)
        else:
            genuine.append(urn)

    print("")
    print("Dangle triage summary")
    print("---------------------")
    print(f"  total dangling edges       : {len(dangles)}")
    print(f"  distinct target URNs       : {len(unique_dangles)}")
    print(f"  resolvable-cross-layer     : {len(resolvable)}")
    print(f"  genuine (real defects)     : {len(genuine)}")

    if resolvable:
        print("")
        print("Resolvable cross-layer references (present in base pack inventory):")
        for urn in resolvable:
            print(f"  resolvable-cross-layer  {urn}")

    if genuine:
        print("")
        print("GENUINE dangling edges (absent from base inventory — real defects):")
        for urn in genuine:
            bare_id = urn.split(":", 1)[-1] if ":" in urn else urn
            if bare_id in base_urns:
                print(f"  genuine                 {urn}  (kind mismatch: base has {base_urns[bare_id]})")
            else:
                print(f"  genuine                 {urn}")
        print("")
        print(f"FAIL: {len(genuine)} genuine dangling edge(s) found.")
        return 1

    print("")
    print(
        f"OK: all {len(unique_dangles)} distinct dangling edge(s) are resolvable "
        "cross-layer references. None are genuine defects."
    )
    return 0


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Triage standalone DRG dangling edges into resolvable-cross-layer vs genuine."
    )
    parser.add_argument(
        "--pack-root",
        type=Path,
        default=Path(__file__).parent.parent / "pack",
        help="Path to the overlay pack root directory (default: pack/ relative to repo root)",
    )
    parser.add_argument(
        "--base-pack",
        type=Path,
        default=(Path(os.environ["BASE_PACK_DIR"]) if os.environ.get("BASE_PACK_DIR") else None),
        help=(
            "Path to the parent-layer (base) pack root, e.g. the cloned "
            "regnology-all-company pack. Also honoured via the BASE_PACK_DIR "
            "environment variable. When omitted, falls back to .kittify/config.yaml's "
            "configured org pack local_path."
        ),
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    base_pack = args.base_pack or _discover_base_pack(args.pack_root)
    sys.exit(triage(args.pack_root, base_pack))
