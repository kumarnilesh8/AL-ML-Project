# Quickstart / Validation: Doctrine pack remediation & Georgia templates

**Mission:** `doctrine-pack-remediation-georgia-templates-01KWCBN5`

How to validate the mission's outcomes. These commands are the acceptance harness for the
Success Criteria (SC-001..008) and NFRs. All `rg` checks state their **expected count** so they
are not fakeable by fixing only a sampled subset.

## Prerequisites

```bash
# Secondary only: resolves genuinely-upstream IDs. NOT the fix for the local kind-prefix defect.
spec-kitty doctrine fetch --pack regnology-all-company
```

## Validation steps

1. **Pack schema validation (NFR-001, SC-005):**
   ```bash
   spec-kitty doctrine pack validate pack/   # baseline at mission start: 150 errors
   ```
   Expect: **0 errors**.

2. **DRG kind prefixes — ALL known local misclassifications (FR-005, SC-002):**
   ```bash
   # (a) Broadened grep over every confirmed-local mis-prefixed ID:
   rg -c "target: directive:(regnology-main-context|token-efficiency|regnology-mcp|evidence-based-requirements|decision-first-development|design-diagramming-incremental-detail|living-glossary-practice|commit-and-markdown-linting)" \
     pack/drg/ps-agent-enabled-factory.graph.yaml
   # Expect: 0

   # (b) Structural cross-check: NO target whose MANIFEST kind is non-directive may carry directive:
   #     (any remaining `target: directive:<id>` must be a genuine directive ID)
   rg -o "target: directive:[a-zA-Z0-9_-]+" pack/drg/ps-agent-enabled-factory.graph.yaml | sort -u
   # Expect: every listed id resolves to ./directives/ in pack/META/MANIFEST.yml
   ```

3. **DRG regeneration is deterministic + freshness (FR-005, NFR-002):**
   ```bash
   python3 tools/compile-drg.py            # regenerate from fragment.yaml
   git diff --exit-code pack/drg/ps-agent-enabled-factory.graph.yaml   # exit 0 = committed graph is fresh
   bash tools/surfaces/cursor/hooks/check-drg-fresh.sh 2>/dev/null || true
   ```
   Expect: regeneration produces no diff against the committed graph.

4. **No dangling / self / duplicate edges (SC-002):**
   ```bash
   rg -n "doctrine-daphne|planner-priti" pack/drg/fragment.yaml   # appear under external_nodes
   ```
   - `doctrine-daphne`, `planner-priti` appear in a declared `external_nodes` block.
   - No `source == target` edge (the `onboard-external-agent-to-pack` self-edge is gone); no duplicated `receptionist-rob → repository-initialization`.

5. **MANIFEST integrity — machine diff, not spot-check (NFR-003, SC-001):**
   ```bash
   # Every on-disk pack artefact must have a MANIFEST entry (expect: no lines printed)
   comm -23 \
     <(cd pack && find . -type f \( -name '*.yaml' -o -name '*.md' \) | sort) \
     <(rg -o "^\s*\./[^ ]+" pack/META/MANIFEST.yml | sed 's/^[[:space:]]*//' | sort)
   ```
   Expect: empty output (0 unregistered files), including `gemini-bot-georgia`, `minutes-maker-mahad`, `powershell-peter`.

6. **No orphans (SC-003):**
   - `backend-for-frontend-bff` and `capability-language-selection` are DRG nodes with ≥1 edge (or removed, with reason recorded in research/plan).

7. **Single source of truth — per-target greps (SC-004):**
   ```bash
   rg -l "InModuleScope" pack/            # Pester pitfalls — expect exactly 1 file
   rg -l "HADOOP_HOME" pack/              # SQLX JVM block — expect exactly 1 file
   rg -cw "juno-mcp" pack/agent_profiles/analyst-annie.agent.yaml pack/agent_profiles/datamodel-darren.agent.yaml   # expect ≤1 each
   rg -l "neutrality ethos" pack/agent_profiles/   # Sally ethos — expect exactly 1 (scribe-sally), Mahad references it
   ```

8. **Gemini templates — structural gate, not cosmetic (SC-006, NFR-004):**
   - `pack/templates/gemini/` exists with the template family.
   - `gemini-bot-georgia.agent.yaml` `specialization.primary-focus` contains **no per-file output-structure prose** and is reduced **≥50%** from baseline; all output-format detail is reachable only via template references.
   - `gemini-agents/README.md` points at the templates.

9. **Clarity fixes (FR-011, SC-007):**
   ```bash
   rg -n "Backend Benny|Python Pedro|Architect Alphonso|Code Reviewer Cindy" pack/   # expect: 0
   rg -nU "Regnology\s+Regnology" pack/procedures/create-branded-pdf-document.procedure.yaml   # expect: 0 (multiline)
   rg -n "scope: docs" pack/directives/050-ad-hoc-prompt-capture.directive.yaml   # expect: 0 (now agent-behavior)
   rg -n "confirmation-mode" pack/agent_profiles/minutes-maker-mahad.agent.yaml   # expect: 0 (canonical token)
   ```

10. **Schema canonicalization (FR-009, SC-008):**
    ```bash
    # Every paradigm has both summary: and body:
    for f in pack/paradigms/*.paradigm.yaml; do rg -q "^summary:" "$f" && rg -q "^body:" "$f" || echo "MISSING: $f"; done   # expect: no output
    rg -n "toolguides" pack/agent_profiles/scribe-sally.agent.yaml   # expect: ≥1 (context-sources enriched)
    ```

11. **Surfaces (FR-012, done — validation only):**
    - `gemini-agents/` documented in `docs/SURFACES.md` and `.kittify/charter/charter.md`. No execution work; confirm only.

## Note

`graph.yaml` and `MANIFEST.yml` are generated — never hand-edit; fix `fragment.yaml` / `tools/compile-drg.py` and regenerate.
