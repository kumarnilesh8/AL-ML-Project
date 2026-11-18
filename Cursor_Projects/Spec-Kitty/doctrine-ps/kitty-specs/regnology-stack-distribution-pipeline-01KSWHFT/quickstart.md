# Quickstart: Regnology Stack Distribution Pipeline

**Mission**: regnology-stack-distribution-pipeline-01KSWHFT

Validation scenarios for verifying the three deliverables work end-to-end.

---

## Scenario 1 — Version file is readable

```bash
# From repo root:
cat pack/.pack-version
# Expected: prints a semver string (e.g. "1.0.0"), exits 0

# Verify no whitespace issues:
VER=$(cat pack/.pack-version | tr -d '[:space:]')
echo "Version: $VER"
```

---

## Scenario 2 — Archive is self-contained and manifest is present

```bash
# Create a test extract dir
TMPDIR=$(mktemp -d)
tar -xzf /path/to/regnology-default-1.0.0.tar.gz -C "$TMPDIR" --strip-components=1

# Verify pack structure (archive has pack/ wrapper, stripped by --strip-components=1)
ls "$TMPDIR"
# Expected: directives  tactics  styleguides  agent_profiles  toolguides  META  ...

# Verify integrity manifest is present
ls "$TMPDIR/META/MANIFEST.yml"
# Expected: file exists, non-empty

# Verify spec-kitty loads it
spec-kitty doctor doctrine --local-path "$TMPDIR"
# Expected: all artifact counts match

rm -rf "$TMPDIR"
```

---

## Scenario 3 — Installer dry-run

```bash
# Unix:
./dist/scripts/install-regnology-stack.sh --dry-run
# Expected: prints [DRY-RUN] lines for each planned step, exits 0, creates no files

# Verify no files were created:
ls ~/regnology-agent-stack 2>/dev/null && echo "ERROR: install dir was created" || echo "OK: no files created"
```

```powershell
# Windows:
.\dist\scripts\install-regnology-stack.ps1 -DryRun
# Expected: prints [DRY-RUN] lines for each planned step, exits 0, creates no files
```

---

## Scenario 4 — HOW_TO_USE structure check

```bash
# Verify installer is the first setup section:
grep -n "bootstrap\|install-regnology-stack\|Step 1" docs/HOW_TO_USE.md | head -5
# Expected: installer reference appears before any "git clone" reference

grep -n "git clone" docs/HOW_TO_USE.md
# Expected: only appears in the Appendix / Manual Setup section
```

---

## Scenario 6 — CI Validate stage blocks re-publication of an existing version

```bash
# Simulate the duplicate-version guard locally (requires ARTEFACTORY_URL and token set):
PACK_VERSION=$(cat pack/.pack-version | tr -d '[:space:]')
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "X-JFrog-Art-Api: ${ARTEFACTORY_TOKEN}" \
  "${ARTEFACTORY_URL}/spec-kitty-packs/regnology-default-${PACK_VERSION}.tar.gz")

if [ "$HTTP_STATUS" = "200" ] && [ "${FORCE_PUBLISH:-false}" = "false" ]; then
  echo "ERROR: version '$PACK_VERSION' already published — bump pack/.pack-version"
  exit 1
fi
echo "Version guard passed"
```

---

## Scenario 5 — CI Validate stage fast-fails on missing version file

```bash
# Simulate the CI validate step locally:
PACK_VERSION=$(cat pack/.pack-version | tr -d '[:space:]' 2>/dev/null) || {
  echo "ERROR: pack/.pack-version missing or unreadable"
  exit 1
}
echo "$PACK_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$' || {
  echo "ERROR: pack version '$PACK_VERSION' does not match semver pattern"
  exit 1
}
echo "Version valid: $PACK_VERSION"

# To test failure:
mv pack/.pack-version pack/.pack-version.bak
# Re-run above — expected: exits 1 with "missing" message
mv pack/.pack-version.bak pack/.pack-version
```
