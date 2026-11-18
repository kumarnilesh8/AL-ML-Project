#!/usr/bin/env bash
# Cursor pre-commit advisory hook: warn when fragment.yaml is newer than
# ps-agent-enabled-factory.graph.yaml.  Outputs a structured JSON response for
# the Cursor hook system and exits 0 (advisory only — does not block commit).
#
# Triggered by: .cursor/hooks.json pre-commit hook on pack/drg/fragment.yaml
# To compile the DRG graph:  make compile-drg
set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd)"
FRAGMENT="$REPO_ROOT/pack/drg/fragment.yaml"
GRAPH="$REPO_ROOT/pack/drg/ps-agent-enabled-factory.graph.yaml"

# Check if fragment.yaml appears in the staged files.
STAGED="$(git diff --cached --name-only 2>/dev/null || echo "")"
if ! echo "$STAGED" | grep -q "pack/drg/fragment.yaml"; then
    echo '{"outcome":"continue"}' && exit 0
fi

if [ ! -f "$GRAPH" ]; then
    cat <<'JSON'
{
  "outcome": "continue",
  "message": "WARNING: pack/drg/ps-agent-enabled-factory.graph.yaml does not exist. Run `make compile-drg` before committing fragment.yaml changes."
}
JSON
    exit 0
fi

if [ "$FRAGMENT" -nt "$GRAPH" ]; then
    cat <<'JSON'
{
  "outcome": "continue",
  "message": "WARNING: pack/drg/fragment.yaml is newer than ps-agent-enabled-factory.graph.yaml. The compiled DRG graph is stale. Run `make compile-drg` and stage the updated graph file."
}
JSON
    exit 0
fi

echo '{"outcome":"continue"}' && exit 0
