# Engineering Note: RC35 Pack Repair and FR-028 Hard Cutover

**Date:** 2026-06-03  
**Context:** Post-upstream-review session — applying changes triggered by spec-kitty rc35 FR-028 enforcement  
**State before:** `doctor doctrine` RC=1, pack degraded — 11 agent profiles skipped, DRG collision-check blocked

---

## What Changed Upstream (spec-kitty rc35 / PR #1625)

PR #1625 (org doctrine profile integrity + charter activation) introduced a **hard cutover (FR-028)**:
the `specializes-from:` field on agent profile YAMLs is now **retired and rejected** by the
`AgentProfile` validator. Lineage and augmentation must be authored as DRG fragment edges:

```yaml
- source: <profile-id>
  target: <parent-profile-id>
  relation: specializes_from
```

Additionally, two new built-in profiles landed (PR #1632): **Debugger Debbie** and **Paula
Patterns**. These are now spec-kitty built-ins — no pack-level profiles are needed.

---

## Errors Found and Fixed

### 1. `specializes-from:` inline field (FR-028 hard cutover)

**Affected:** 9 pack profiles  
**Fix:** Removed `specializes-from:` from all YAML files; DRG `specializes_from` edges added to `drg/fragment.yaml`

| Profile | Was specializing from |
|---|---|
| comms-cleo | curator-carla (built-in) |
| datamodel-darren | analyst-annie (pack) |
| devops-danny | implementer-ivan (built-in) |
| diagram-daisy | designer-dagmar (built-in) |
| lexical-larry | analyst-annie (pack) |
| scribe-sally | comms-cleo (pack) |
| slidedeck-stanislav | designer-dagmar (built-in) |
| sqlx-specialist-simon | implementer-ivan (built-in) |
| synthesizer-sam | comms-cleo (pack) |

### 2. `tools:` top-level field (not in AgentProfile schema)

**Affected:** analyst-annie, datamodel-darren, sqlx-specialist-simon  
**Fix:** Removed `tools:` blocks. The tool references are already captured in `context-sources.toolguides` and `context-sources.additional` within the same profiles.

### 3. Pack profiles for frontend-freddy and java-jenny (CHANGELOG decision)

**Status:** These were scheduled for removal in a 2026-05-22 late session but the files were never deleted.  
**Fix:** Deleted `pack/agent_profiles/frontend-freddy.agent.yaml` and `pack/agent_profiles/java-jenny.agent.yaml`. Removed the `frontend-freddy` pack node from the DRG. Augmentation edges (injecting Regnology directives/tactics into the SK built-in profiles) remain in the DRG fragment.

### 4. Non-canonical DRG relations

| Relation | Instances | Canonical replacement |
|---|---|---|
| `related_to` | 2 (google-cloud-mcp ↔ sqlx-mcp) | `suggests` |
| `performs` | 3 (agent → procedure) | `applies` |
| `uses` | 1 (lexical-larry → context-boundary-inference) | `applies` |

---

## DRG Fragment Updates

**Added:** `specializes_from` edges for all 9 profiles listed above.  
**Added:** Enhancement edges for built-in Debugger Debbie and Paula Patterns:
- `debugger-debbie` → `TRACEABLE_DECISIONS` (requires)
- `debugger-debbie` → `ENSURE_CONCEPTUAL_ALIGNMENT` (requires)
- `paula-patterns` → `TRACEABLE_DECISIONS` (requires)
- `paula-patterns` → `ENSURE_CONCEPTUAL_ALIGNMENT` (requires)

**Updated:** `java-jenny` augmentation edges expanded with `java-conventions` (applies) and `APPSEC_COMPLIANCE` (requires).

---

## Pack State After Repair

```
doctor doctrine (rc35) in ai-initiatives engagement repo:
  RC=0
  Pack: regnology-default (vunknown)
  Loaded: 91 nodes, 281 edges
  Profiles: 11 valid (0 skipped)
  Collisions: 4 intentional overrides (context-boundary-inference, secure-design-checklist, java-conventions, python-conventions)
```

The 4 collision warnings are **expected** — these are deliberate Regnology overrides of spec-kitty built-ins.

---

## Deployed Pack Sync

The deployed pack at `/home/stijn/Documents/_code/CLIENTS/regnology/_config/packs/regnology-default/`
was also updated via `rsync` (profiles + DRG fragment). The deployed pack previously had `tool-integrations:`
keys (old field name, pre-rename to `toolguides:`) in several profiles — these are now replaced by the
corrected source.

---

## Concern Resolution Status

From `2026-06-01-spec-kitty-integration-challenge-corrections.md`:

| Concern | Status |
|---|---|
| C-005/C-006: Silent charter governance drop | ✅ Resolved by PR #1625 (`doctor doctrine` RC=1 on degraded pack confirmed) |
| C-003: `specializes_from` DRG enum | ✅ Resolved by PR #1625 (now canonical relation; FR-028 hard cutover enforced) |
| FR-028 compliance of our pack | ✅ Fixed in this session |
| Debbie/Paula pack profiles | ✅ Not needed — built-in since PR #1632 |
| C-001/C-004: DRG auto-compilation | ⏳ Still open (upstream issue #1619) |
