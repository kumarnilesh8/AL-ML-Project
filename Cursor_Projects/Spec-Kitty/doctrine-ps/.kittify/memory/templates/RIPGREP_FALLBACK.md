# ripgrep (rg) — Availability and Fallback Guidance

**⚠️ READ THIS if `rg` is not found in the current environment**

---

## Decision: Always Prefer ripgrep Over grep

When `rg` is available, always use it over `grep -r` or `find | grep` patterns.
When `rg` is NOT available, fall back to `grep` but **inform the user** of the gap.

---

## Why This Matters

| Factor | grep -r | rg |
|--------|---------|-----|
| Speed on large codebases | Slow | Significantly faster |
| .gitignore awareness | No | Yes (by default) |
| Binary file skipping | No | Yes (by default) |
| Token expenditure | Higher — noisy output, more iterations | Lower — focused results |
| Hidden file handling | Included unless excluded | Excluded unless --hidden |

Searching a large codebase with `grep` instead of `rg` produces more output noise
(build artifacts, node_modules, vendored code), requires more filtering steps, and
burns more context tokens per search. On projects with `node_modules/` or generated
files, the difference can be an order of magnitude.

---

## Fallback Protocol

When `rg` is not found (`command not found: rg` or `rg: No such file or directory`):

1. **Fall back silently to grep** for the immediate task:
   ```bash
   grep -r "pattern" --include="*.yaml" .
   ```

2. **Inform the user once per session:**
   > ⚠️ `ripgrep` (rg) is not installed. Falling back to `grep`, which is slower and
   > less token-efficient on large codebases. Installing ripgrep will improve search
   > speed and reduce context noise materially.
   > Install: `brew install ripgrep` / `apt install ripgrep` / `choco install ripgrep`
   > See: https://github.com/BurntSushi/ripgrep

3. **Do not repeat the warning** on every subsequent search in the same session.

---

## Common rg Patterns for Quick Reference

```bash
# Find pattern in specific file type
rg "pattern" -t yaml

# List files containing pattern
rg -l "pattern"

# Context lines around match
rg -C 3 "pattern"

# Fixed string (no regex)
rg -F "literal.string()"

# Search ignored/hidden files
rg --no-ignore --hidden "pattern"

# List all tracked files
rg --files
```

---

**Reference:** `pack/toolguides/ripgrep.toolguide.yaml`
