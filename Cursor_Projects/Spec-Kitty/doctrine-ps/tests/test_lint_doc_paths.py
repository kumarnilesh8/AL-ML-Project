"""Fixture-based inject-and-detect test for `tools/lint-doc-paths.py` (WP03/T020).

Injects a deliberately-dangling repo-relative path reference into a fixture
Markdown file, runs the scanner against it, and asserts detection (non-zero
exit). Then confirms the scanner passes (exit 0) once the dangling reference
is replaced with one that resolves on disk.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
LINT_SCRIPT = REPO_ROOT / "tools" / "lint-doc-paths.py"

# `tools/lint-doc-paths.py` has a hyphen, so it can't be `import`-ed by module
# name; load it by file path instead.
_spec = importlib.util.spec_from_file_location("lint_doc_paths", LINT_SCRIPT)
lint_doc_paths = importlib.util.module_from_spec(_spec)
sys.modules["lint_doc_paths"] = lint_doc_paths
_spec.loader.exec_module(lint_doc_paths)


def test_dangling_reference_is_detected(tmp_path: Path, capsys) -> None:
    """A backtick-quoted path that does not resolve on disk is flagged (exit 1),
    and the report names both the offending file and the offending path token
    (T020 acceptance criterion: actionable, not just a count)."""
    fixture = tmp_path / "fixture.md"
    fixture.write_text(
        "See `docs/this-path-does-not-exist.md` for details.\n",
        encoding="utf-8",
    )

    exit_code = lint_doc_paths.lint(tmp_path, ["fixture.md"])

    assert exit_code == 1

    captured = capsys.readouterr()
    assert "fixture.md" in captured.out
    assert "docs/this-path-does-not-exist.md" in captured.out


def test_resolvable_reference_passes(tmp_path: Path) -> None:
    """Once the dangling reference is replaced by one that resolves, exit 0."""
    real_dir = tmp_path / "docs"
    real_dir.mkdir()
    real_file = real_dir / "this-path-exists.md"
    real_file.write_text("# Exists\n", encoding="utf-8")

    fixture = tmp_path / "fixture.md"
    fixture.write_text(
        "See `docs/this-path-exists.md` for details.\n",
        encoding="utf-8",
    )

    exit_code = lint_doc_paths.lint(tmp_path, ["fixture.md"])

    assert exit_code == 0
