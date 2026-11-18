#!/usr/bin/env python3
# =============================================================================
# Release-map validator (WP01 / T003)
# Mission: single-command-installer-bootstrap-01KVFHX6
# -----------------------------------------------------------------------------
# Dependency-free (Python standard library ONLY). The Jenkins `tools` container
# has no PyYAML, so this hand-rolls a tolerant parser for the SIMPLE, known
# structure of config/release-map.yaml. It is NOT a general YAML parser.
#
# It asserts:
#   - the file parses,
#   - `schema_version` is present,
#   - `default_spec_kitty_version` is present,
#   - every releases[] entry has `tag`, `spec_kitty_version`,
#     `overlay_pack_version`, `base_pack_version`,
#   - release tags are unique.
#
# Exit 0 = valid; exit 1 = invalid (prints the reason to stderr).
#
# INVOCATION (WP03: wire this into the CI lint stage):
#   python3 config/validate-release-map.py                 # default map path
#   python3 config/validate-release-map.py path/to/map.yaml
# =============================================================================

import sys
from pathlib import Path

REQUIRED_TOP_LEVEL = ("schema_version", "default_spec_kitty_version")
REQUIRED_RELEASE_KEYS = (
    "tag",
    "spec_kitty_version",
    "overlay_pack_version",
    "base_pack_version",
)
DEFAULT_MAP = Path(__file__).resolve().parent / "release-map.yaml"


def _strip_inline_comment(value):
    """Remove a trailing ` # comment` from a scalar value (not inside quotes)."""
    in_quote = None
    for i, ch in enumerate(value):
        if ch in ('"', "'"):
            in_quote = None if in_quote == ch else (in_quote or ch)
        elif ch == "#" and in_quote is None and (i == 0 or value[i - 1] in " \t"):
            return value[:i]
    return value


def _unquote(value):
    value = _strip_inline_comment(value).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        return value[1:-1]
    return value


def parse_release_map(text):
    """Parse the minimal subset of YAML used by release-map.yaml.

    Supports: top-level `key: value`, a `releases:` block sequence of mappings
    introduced by `- key: value` with subsequent indented `key: value` lines.
    Blank lines and `#` comment lines are ignored.
    """
    top = {}
    releases = []
    current = None
    in_releases = False

    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        indent = len(line) - len(line.lstrip())

        if indent == 0:
            in_releases = False
            current = None
            if line.startswith("releases:"):
                in_releases = True
                continue
            if ":" in line:
                key, _, val = line.partition(":")
                top[key.strip()] = _unquote(val)
            continue

        if not in_releases:
            continue

        if stripped.startswith("- "):
            current = {}
            releases.append(current)
            item = stripped[2:]
            if ":" in item:
                key, _, val = item.partition(":")
                current[key.strip()] = _unquote(val)
        elif current is not None and ":" in stripped:
            key, _, val = stripped.partition(":")
            current[key.strip()] = _unquote(val)

    return top, releases


def validate(path):
    errors = []
    try:
        text = Path(path).read_text(encoding="utf-8")
    except OSError as exc:
        return [f"cannot read {path}: {exc}"]

    try:
        top, releases = parse_release_map(text)
    except Exception as exc:  # noqa: BLE001 - report any parse failure cleanly
        return [f"failed to parse {path}: {exc}"]

    for key in REQUIRED_TOP_LEVEL:
        if not top.get(key):
            errors.append(f"missing or empty top-level key: {key!r}")

    if not releases:
        errors.append("no entries under 'releases'")

    seen_tags = set()
    for idx, entry in enumerate(releases):
        for key in REQUIRED_RELEASE_KEYS:
            if not entry.get(key):
                errors.append(f"releases[{idx}] missing or empty key: {key!r}")
        tag = entry.get("tag")
        if tag:
            if tag in seen_tags:
                errors.append(f"duplicate release tag: {tag!r}")
            seen_tags.add(tag)

    return errors


def main(argv):
    path = argv[1] if len(argv) > 1 else DEFAULT_MAP
    errors = validate(path)
    if errors:
        print(f"release-map INVALID ({path}):", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1
    print(f"release-map OK: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
