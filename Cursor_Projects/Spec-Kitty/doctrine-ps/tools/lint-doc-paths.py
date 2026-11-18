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
"""Scan tracked Markdown files for dangling repo-relative doc-path references.

`AGENTS.md`, `CLAUDE.md`, `README.md`, and other governance/onboarding docs
frequently cite repo-relative paths in backtick-quoted inline code spans (e.g.
`` `docs/installation/HOW_TO_USE.md` ``). Those references silently rot as the
repository is restructured — this is the exact failure class the
`doctrine-ps-structural-alignment` mission was created to fix (see FR-009).

This script extracts every backtick-quoted, repo-relative path token from
tracked `.md` files and checks it against the filesystem, flagging anything
that does not resolve to an existing file or directory (unless it is covered
by the FR-010 allow-list below).

Detection scope (pinned by spec.md FR-009 — do not broaden/narrow without
updating the spec first):
  * Source files: tracked `.md` files only (``git ls-files '*.md'``).
  * Tokens: backtick-quoted (single backtick, inline) spans matching
    ``^[\\w.\\-]+/[\\w./\\-]*$`` — i.e. containing at least one path separator.
  * Content inside fenced (triple-backtick) code blocks is NOT scanned. Tree
    diagrams there show leaf names relative to their nested parent, not full
    repo-relative paths, so treating each line as a root-relative path would
    make every subdirectory entry a false positive (verified empirically
    against this repo's own README.md/AGENTS.md tree diagrams).
  * Templated placeholders (containing ``{``, ``}``, ``<``, ``>``, ``[``, or
    ``]``) are skipped — e.g. ``{chatbot-slug}/``, ``<feature_dir>/spec.md``.

Three independent suppression mechanisms exist, and are intentionally kept
separate so a reviewer can tell them apart at a glance:

  * ``ALLOWLIST`` (FR-010) — specific target paths that are gitignored but
    documented elsewhere as intentionally generated/local-only (e.g.
    `.cursor/`, `.claude/`). A finding whose token is, or is nested under, one
    of these entries is not reported.
  * ``CROSS_REPO_ALLOWLIST`` — specific target paths that are not gitignored
    (they are never created in this repo at all) but document a structure
    that legitimately lives in a different repository or pack layer (e.g.
    `gemini-agents/`, repointed by this mission's FR-012/013/014 to the
    separate `regnology-ps-chatbots` repository; or `pack/tools/fallback/`
    and `pack/tactics/model-discipline-selection.tactic.yaml`, inherited
    from the `regnology-all-company` parent pack per this mission's FR-003
    fix).
  * ``SCAN_EXCLUDE_PREFIXES`` / ``SCAN_EXCLUDE_FILES`` — whole source
    directories/files excluded from scanning entirely because they are
    point-in-time historical records or tool-generated state, not living
    documentation a reader bootstraps from (spec-kitty mission archives under
    `kitty-specs/`, spec-kitty's own generated runtime/charter state under
    `.kittify/`, Doctrine/Engineering Decision Records under `docs/decisions/`,
    dated session notes under `docs/engineering_notes/`, `CHANGELOG.md`, and
    the `doctrine/` -> `pack/` migration-mapping documents). Editing these to
    match current reality would corrupt the historical record they exist to
    preserve — the same rationale `research.md` R4 applied to
    `.kittify/charter/charter.md`. This decision is deliberate and documented
    here (not silent) per this mission's "do not silence real drift without
    justification" instruction; scanning them produced over a thousand
    unrelated, non-actionable hits during development (point-in-time paths
    that were correct when each historical document was authored) which would
    make the tool's output useless for NFR-002's actionability requirement.

Usage::

    python3 tools/lint-doc-paths.py [--repo-root PATH] [--paths FILE ...]

    --repo-root  Path to the repository root (default: repo root relative to
                 this script).
    --paths      Scan exactly these repo-relative Markdown files instead of
                 the full git-tracked ``*.md`` set. Intended for
                 ``tests/test_lint_doc_paths.py``; production runs should omit
                 this flag so the default tracked-file walk (and the
                 exclusions above) applies.

Exit codes:
    0  No unexplained dangling doc-path references found.
    1  One or more unexplained dangling doc-path references found.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# FR-010 allow-list. A token equal to, or nested under, one of these entries
# is excused from reporting even though it does not resolve on disk. Every
# entry MUST carry a substantive justification naming the doc that explains
# it — "generated + gitignored", not merely "ignore this" (FR-010 acceptance
# criterion). Seeded by T017's full `.gitignore` cross-reference pass.
# ---------------------------------------------------------------------------
ALLOWLIST = [
    ".cursor/",       # gitignored, generated locally from tools/surfaces/ (README.md
                      #   "Local Agent And IDE Harnesses" section)
    ".claude/",       # gitignored, generated locally from tools/surfaces/ (README.md
                      #   "Local Agent And IDE Harnesses" section)
    "work/",          # gitignored local orchestration workspace (README.md's
                      #   Repository Structure tree: "work/ ... (gitignored)"; also
                      #   AGENTS.md Directives 014/015 work-log path guidance)
    "pack/.reviews/", # gitignored dashboard review-artifact directory, written by the
                      #   live pack-governance-dashboard server during review sessions,
                      #   not version-controlled (documented in docs/usage.md)
]

# ---------------------------------------------------------------------------
# Cross-repository allow-list — a SEPARATE mechanism from FR-010's ALLOWLIST
# above. These paths are not gitignored (they are never created in THIS repo
# at all); they document a structure that lives in a different repository or
# a different, downstream repo's local convention. This is exactly this
# mission's FR-012/013/014 subject matter: `gemini-agents/` was deliberately
# repointed from a local (now-removed) directory to the separate
# `regnology-ps-chatbots` repository's actual layout — flagging it as
# "dangling" here would be reporting the fix itself as a defect. Kept
# distinct from ALLOWLIST (and its own inline justification below) so a
# reviewer checking FR-010's "generated + gitignored" criterion is not misled
# about which entries satisfy it.
# ---------------------------------------------------------------------------
CROSS_REPO_ALLOWLIST = [
    "gemini-agents/",     # Lives in the separate `regnology-ps-chatbots` repository
                          #   (this mission's FR-012/013/014 repoint target) — never a
                          #   local directory in doctrine-ps (pack/README.md,
                          #   docs/SURFACES.md, pack/agent_profiles/README.md,
                          #   pack/templates/gemini/*).
    ".doctrine-config/",  # Convention for separate ENGAGEMENT repositories that consume
                          #   this pack via `spec-kitty doctrine fetch` — never created in
                          #   this pack-source repo itself (AGENTS.md, README.md,
                          #   CLAUDE.md, pack/README.md).
    "pack/tools/fallback/",  # inherited from regnology-all-company parent pack via
                          #   `extends:` in pack/org-charter.yaml; never present in this
                          #   repo's checkout (AGENTS.md's "Model Discipline (Directive 042)"
                          #   section and its "Pack Structure (Governance Artifacts)" section,
                          #   both corrected by this mission's FR-003 fix).
    "pack/tactics/model-discipline-selection.tactic.yaml",  # inherited from
                          #   regnology-all-company parent pack via `extends:` in
                          #   pack/org-charter.yaml; never present in this repo's checkout
                          #   (AGENTS.md's "Model Discipline (Directive 042)" section,
                          #   corrected by this mission's FR-003 fix).
]

# ---------------------------------------------------------------------------
# Whole source directories/files excluded from the scan (see module docstring
# for the full rationale). This is deliberately a DIFFERENT mechanism from
# ALLOWLIST/CROSS_REPO_ALLOWLIST above: it excuses source locations, not
# target paths.
# ---------------------------------------------------------------------------
SCAN_EXCLUDE_PREFIXES = (
    "kitty-specs/",             # spec-kitty mission archives: point-in-time planning
                                 #   snapshots (spec/plan/tasks/review-cycle files) for
                                 #   completed and in-flight missions.
    ".kittify/",                # spec-kitty's own generated runtime/charter state
                                 #   (charter backups, generated charter.md, memory
                                 #   templates) — regenerated by `spec-kitty charter
                                 #   generate`, never hand-authored documentation
                                 #   (research.md R4).
    "docs/decisions/",          # Doctrine/Engineering Decision Records (DDR-*/EDR-*)
                                 #   are frozen snapshots of the reasoning and repo
                                 #   state at decision time; intentionally not updated
                                 #   as the repo evolves.
    "docs/engineering_notes/",  # Dated, point-in-time session notes and journals; same
                                 #   frozen-snapshot rationale as docs/decisions/.
)
SCAN_EXCLUDE_FILES = (
    "CHANGELOG.md",                     # Historical release log; each entry describes
                                         #   repo state at the time of that past release,
                                         #   not current reality.
    "docs/pack-migration-plan.md",      # Documents the historical `doctrine/` -> `pack/`
                                         #   migration mapping; references to the retired
                                         #   `doctrine/` tree are the document's subject
                                         #   matter, not current-state claims (spec.md's
                                         #   own Out of Scope section verified this file
                                         #   needs no change for this mission).
    "docs/AGENT_MIGRATION_GUIDANCE.md", # Same `doctrine/` -> `pack/` migration-mapping
                                         #   genre as pack-migration-plan.md above.
)

# Backtick-quoted inline code span, e.g. `docs/installation/HOW_TO_USE.md`.
_TOKEN_RE = re.compile(r"`([^`\n]+)`")
# Repo-relative path token: at least one path separator (spec.md FR-009).
_PATH_TOKEN_RE = re.compile(r"^[\w.\-]+/[\w./\-]*$")
# Fenced code block delimiter (```lang or plain ```), toggled open/close.
_FENCE_RE = re.compile(r"^\s*```")
# Templated-placeholder characters that mark a token as NOT a real path
# (spec.md Edge Case: `{chatbot-slug}/`, `<feature_dir>/spec.md`, `[MISSION NAME]`).
_PLACEHOLDER_CHARS = set("{}<>[]")


def _is_scan_excluded(rel_path: str) -> bool:
    """True if `rel_path` is a historical/generated source excluded from scanning."""
    if rel_path in SCAN_EXCLUDE_FILES:
        return True
    return any(rel_path.startswith(prefix) for prefix in SCAN_EXCLUDE_PREFIXES)


def _is_allowlisted(token: str) -> bool:
    """True if `token` is, or is nested under, an allow-list entry (FR-010 or cross-repo)."""
    entries = ALLOWLIST + CROSS_REPO_ALLOWLIST
    return any(token == entry or token.startswith(entry) for entry in entries)


def _tracked_markdown_files(repo_root: Path) -> list[str]:
    """Return tracked `*.md` files (repo-relative), via `git ls-files`."""
    proc = subprocess.run(
        ["git", "-C", str(repo_root), "ls-files", "*.md"],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        print(f"ERROR: git ls-files failed: {proc.stderr.strip()}", file=sys.stderr)
        return []
    return [line for line in proc.stdout.splitlines() if line]


def _extract_findings(repo_root: Path, rel_paths: list[str]) -> list[tuple[str, int, str]]:
    """Return (rel_path, line_number, offending_token) for every dangling path."""
    findings: list[tuple[str, int, str]] = []
    for rel_path in rel_paths:
        abs_path = repo_root / rel_path
        try:
            text = abs_path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            print(f"  WARNING: cannot read {rel_path}: {exc}", file=sys.stderr)
            continue

        in_fence = False
        for lineno, line in enumerate(text.splitlines(), start=1):
            if _FENCE_RE.match(line):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            for match in _TOKEN_RE.finditer(line):
                token = match.group(1).strip()
                if not token or not _PATH_TOKEN_RE.match(token):
                    continue
                if _PLACEHOLDER_CHARS & set(token):
                    continue
                if _is_allowlisted(token):
                    continue
                if not (repo_root / token).exists():
                    findings.append((rel_path, lineno, token))
    return findings


def lint(repo_root: Path, paths: list[str] | None) -> int:
    """Scan `repo_root` for dangling doc-path references; return an exit code."""
    if paths:
        rel_paths = list(paths)
    else:
        rel_paths = [
            p for p in _tracked_markdown_files(repo_root) if not _is_scan_excluded(p)
        ]

    print(f"Scanning {len(rel_paths)} tracked Markdown file(s) under {repo_root}")
    findings = _extract_findings(repo_root, rel_paths)

    if not findings:
        print("")
        print(
            f"OK: 0 unexplained dangling doc-path reference(s) found across "
            f"{len(rel_paths)} file(s)."
        )
        return 0

    print("")
    print("Dangling doc-path references")
    print("-----------------------------")
    for rel_path, lineno, token in findings:
        print(f"  {rel_path}:{lineno}: `{token}` does not resolve to an existing file or directory")

    print("")
    print(f"FAIL: {len(findings)} unexplained dangling doc-path reference(s) found.")
    return 1


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scan tracked Markdown files for backtick-quoted repo-relative paths "
            "that do not resolve to an existing file or directory."
        )
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Path to the repository root (default: repo root relative to this script)",
    )
    parser.add_argument(
        "--paths",
        nargs="+",
        default=None,
        metavar="FILE",
        help=(
            "Scan exactly these repo-relative Markdown files instead of the full "
            "git-tracked *.md set. Intended for tests/test_lint_doc_paths.py; "
            "production runs should omit this flag."
        ),
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    sys.exit(lint(args.repo_root.resolve(), args.paths))
