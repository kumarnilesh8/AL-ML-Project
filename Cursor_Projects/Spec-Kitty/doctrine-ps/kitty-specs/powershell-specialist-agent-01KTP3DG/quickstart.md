# Quickstart: Verify PowerShell Peter Mission Deliverables

**Mission**: `powershell-specialist-agent-01KTP3DG`  
**Audience**: Implementer or reviewer after all work packages merge

---

## Prerequisites

- Repository checkout on branch `beta`
- spec-kitty CLI 3.2.x available (`spec-kitty --version`)
- Python 3 for DRG compilation

---

## 1. Confirm artifacts exist

```bash
cd /path/to/regnology-agent-doctrine

ls pack/agent_profiles/powershell-peter.agent.yaml
ls pack/styleguides/powershell-conventions.styleguide.yaml
ls pack/tactics/powershell-module-scaffold.tactic.yaml
ls pack/procedures/powershell-pester-workflow.procedure.yaml
ls pack/tactics/powershell-script-quality-gate.tactic.yaml
ls pack/toolguides/pester.toolguide.yaml
ls pack/toolguides/psscriptanalyzer.toolguide.yaml
ls pack/templates/powershell/powershell-module-layout.md
ls docs/references/powershell-primer.md
```

---

## 2. Validate pack

```bash
spec-kitty doctrine pack validate pack/
```

**Expected**: 0 errors (NFR-001). Document any advisories in the mission work log.

---

## 3. Verify DRG wiring

```bash
rg "powershell-peter" pack/drg/fragment.yaml
python3 tools/compile-drg.py
git diff --stat pack/drg/
```

**Expected edges** (minimum):

- `powershell-peter` → `powershell-conventions` (`applies`)
- `powershell-peter` → `implementer-ivan` (`specializes_from`)
- `powershell-peter` → two tactics + one procedure (`applies`/`suggests`)
- `powershell-peter` → `pester`, `psscriptanalyzer` toolguides (`applies`)
- `powershell-peter` → `TEST_FIRST_BUG_FIXING` (`requires`)

---

## 4. Verify domain tags

```bash
rg "powershell-peter|powershell-conventions|powershell-module-scaffold" config/artifact-tags.yaml
```

**Expected**: entries with domains `tooling` and `engineering`.

---

## 5. Smoke-test profile readability (NFR-002)

Open `pack/agent_profiles/powershell-peter.agent.yaml` and confirm within 5 minutes:

- Primary focus is PowerShell module/script work
- Avoidance boundary mentions the DevOps specialist for Jenkins/Sonar
- Directive references include conceptual alignment and test-first bug fixing

---

## 6. Optional — dashboard DRG view

If pack dashboard is running locally:

1. Navigate to DRG tab
2. Seed from org-charter or search `powershell-peter`
3. Confirm neighbourhood shows styleguide + tactics + required directives

---

## Acceptance sign-off

Map to spec success criteria:

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Module scaffold scenario works | Manual or fixture repo test |
| 2 | DRG neighbourhood visible | Step 3 or dashboard |
| 3 | Boundaries vs Danny clear | Step 5 |
| 4 | Pack validate 0 errors | Step 2 |
| 5 | Companion doc attribution | Inspect `docs/references/powershell-primer.md` header |
