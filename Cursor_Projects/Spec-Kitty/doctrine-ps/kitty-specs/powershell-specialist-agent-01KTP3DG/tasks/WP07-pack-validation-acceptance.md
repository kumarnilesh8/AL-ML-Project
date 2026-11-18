---
work_package_id: WP07
title: Pack Validation and Acceptance
dependencies:
- WP04
- WP05
- WP06
requirement_refs:
- NFR-001
- NFR-002
- NFR-003
- NFR-004
tracker_refs: []
planning_base_branch: feature/powershell-specialist-agent-01KTP3DG
merge_target_branch: feature/powershell-specialist-agent-01KTP3DG
branch_strategy: Planning artifacts for this mission were generated on feature/powershell-specialist-agent-01KTP3DG. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feature/powershell-specialist-agent-01KTP3DG unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-powershell-specialist-agent-01KTP3DG
base_commit: 2560cff485d9bc038410dfbd3ee2d84eda9bed28
created_at: '2026-06-09T12:26:05.623451+00:00'
subtasks:
- T029
- T030
- T031
- T032
agent: "cursor:composer-2.5-fast:reviewer-renata:reviewer"
shell_pid: "39151"
history:
- date: '2026-06-09'
  event: created
agent_profile: reviewer-renata
authoritative_surface: work/
execution_mode: code_change
owned_files:
- work/2026-06-09-powershell-peter-validation.md
role: reviewer
tags: []
---

## ⚡ Do This First: Load Agent Profile

Before reading anything else, load your agent profile:

```
/ad-hoc-profile-load reviewer-renata
```

Wait for profile confirmation, then continue. This WP is the **final acceptance gate**
for the mission.

---

## Objective

Verify all PowerShell Peter deliverables pass pack validation (NFR-001) and the acceptance
contract in `contracts/pack-artifacts-acceptance.yaml`. Fix any residual issues and
document smoke-test evidence for NFR-002 and NFR-003.

## Branch Strategy

- **Planning/base branch**: `feature/powershell-specialist-agent-01KTP3DG`
- **Merge target**: `beta`
- **Depends on**: WP04 (DRG), WP05 (companion doc), WP06 (Cursor export)

**Implement command**: `spec-kitty agent action implement WP07 --agent <name>`

## Context

**Quickstart**: `kitty-specs/powershell-specialist-agent-01KTP3DG/quickstart.md`

**Acceptance contract**: `kitty-specs/powershell-specialist-agent-01KTP3DG/contracts/pack-artifacts-acceptance.yaml`

**Success criteria** (spec.md): pack validate 0 errors; DRG neighbourhood; boundaries clear;
companion attribution.

---

### Subtask T029 — Full pack validate

**Steps**:

```bash
cd /path/to/regnology-agent-doctrine
spec-kitty doctrine pack validate pack/
```

**Expected**: 0 errors (NFR-001).

If errors reference missing files from other WPs, confirm those WPs merged first.

Capture full output for T032 documentation.

**Validation**:
- [ ] Exit success with 0 errors
- [ ] Any warnings/advisories listed for T032

---

### Subtask T030 — Execute acceptance contract checks

Walk through `contracts/pack-artifacts-acceptance.yaml`:

| Check | Command / action |
|-------|------------------|
| GATE-VALIDATE | Already in T029 |
| GATE-DRG-COMPILE | `python3 tools/compile-drg.py` |
| Artifacts exist | `ls` each path in contract `artifacts:` list |
| required_fields | Inspect YAML for profile-id, styleguide id, etc. |
| required_edges | `rg` fragment.yaml for powershell-peter edges |
| required_tag_ids | `rg` artifact-tags.yaml |
| required_content | `rg "Stijn Dejongh\|REGNOLOGY" docs/references/powershell-primer.md` |
| C-004 distill | Compare line counts: styleguide ≪ companion doc |

**Validation**:
- [ ] All artifact paths exist
- [ ] required_edges match FR-008
- [ ] Five artifact-tags entries present

---

### Subtask T031 — Fix failures

If T029 or T030 fail:

1. Identify owning WP from failure (styleguide → WP01, etc.)
2. Apply minimal fix in this integration lane if allowed by ownership, OR document blocker
3. Re-run validate until 0 errors

**Common fixes**:

- Missing DRG node/edge → edit fragment.yaml + recompile
- Schema field typo → fix YAML key names to match java-conventions
- Missing directive reference code → align with pack/directives filenames

**Validation**:
- [ ] All blocking issues resolved
- [ ] Re-validate passes

---

### Subtask T032 — Document smoke results

Update or append verification notes in a mission work log:

`work/2026-06-09-powershell-peter-validation.md`

Do **not** edit `kitty-specs/` planning artifacts in this WP unless the human explicitly
requests it — record evidence in the work log instead.

**Document**:

1. Pack validate result (0 errors)
2. NFR-002: Profile readability confirmed (reviewer name, date)
3. NFR-003: Estimate % of styleguide principles that are pass/fail checkable
4. Residual advisories with justification (if any)

**Validation**:
- [ ] Evidence recorded for success criteria 4 and 5
- [ ] Mission ready for `/spec-kitty.analyze` or implement-review loop

---

## Definition of Done

- [ ] NFR-001: 0 pack validate errors
- [ ] Acceptance contract GATE-VALIDATE and GATE-DRG-COMPILE pass
- [ ] All FR-001 through FR-011 artifacts verified present
- [ ] NFR-002 and NFR-003 smoke documented
- [ ] No uncommitted fixes left dirty outside owned_files

## Risks

| Risk | Mitigation |
|------|------------|
| WP lane not merged | Implement WP07 only after WP04–WP06 complete |
| Flaky validate | Run twice; capture spec-kitty version |

## Reviewer Guidance

Use spec success criteria table as checklist. Reject if any Must FR is unmet or validate
shows errors.

**Implement command**: `spec-kitty agent action implement WP07 --agent <name>`

## Activity Log

- 2026-06-09T12:26:07Z – cursor:composer-2.5-fast:reviewer-renata:reviewer – shell_pid=39151 – Assigned agent via action command
