---
work_package_id: WP06
title: Profile & paradigm normalization
dependencies:
- WP01
requirement_refs:
- FR-009
- FR-010
- FR-011
tracker_refs: []
planning_base_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
merge_target_branch: refactor/doctrine-daphne-and-onboard-built-in-overlap
branch_strategy: Planning artifacts for this mission were generated on refactor/doctrine-daphne-and-onboard-built-in-overlap. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into refactor/doctrine-daphne-and-onboard-built-in-overlap unless the human explicitly redirects the landing branch.
subtasks:
- T025
- T026
- T027
- T028
- T029
- T030
- T031
shell_pid: "207561"
agent: "cursor:sonnet-4.6:reviewer-renata:reviewer"
history:
- 2026-06-30 created by /spec-kitty.tasks
authoritative_surface: pack/agent_profiles/
create_intent: []
execution_mode: code_change
owned_files:
- pack/paradigms/backend-for-frontend-bff.paradigm.yaml
- pack/paradigms/bounded-context-linguistic-discovery.paradigm.yaml
- pack/paradigms/capability-language-selection.paradigm.yaml
- pack/paradigms/client-data-storage.paradigm.yaml
- pack/paradigms/cloud-native-domain-modelling.paradigm.yaml
- pack/paradigms/extract-then-publish-separation.paradigm.yaml
- pack/paradigms/language-first-architecture.paradigm.yaml
- pack/agent_profiles/analyst-annie.agent.yaml
- pack/agent_profiles/comms-cleo.agent.yaml
- pack/agent_profiles/datamodel-darren.agent.yaml
- pack/agent_profiles/devops-danny.agent.yaml
- pack/agent_profiles/diagram-daisy.agent.yaml
- pack/agent_profiles/lexical-larry.agent.yaml
- pack/agent_profiles/minutes-maker-mahad.agent.yaml
- pack/agent_profiles/powershell-peter.agent.yaml
- pack/agent_profiles/receptionist-rob.agent.yaml
- pack/agent_profiles/scribe-sally.agent.yaml
- pack/agent_profiles/slidedeck-stanislav.agent.yaml
- pack/agent_profiles/sqlx-specialist-simon.agent.yaml
- pack/agent_profiles/synthesizer-sam.agent.yaml
- pack/procedures/migrate-doctrine-to-pack.procedure.yaml
- pack/procedures/onboard-external-agent-to-pack.procedure.yaml
tags: []
---

# WP06 — Profile & paradigm normalization

## Objective

Canonicalize **non-breaking** schema across all paradigms and all agent profiles **except
Georgia** (owned by WP03), and fold in the profile-resident dedup/clarity edits that would
otherwise collide with this WP's files. Document the canonical shapes in the schema-template
procedures.

## Scope guardrail (C-004)

**Non-breaking only.** Do **NOT** rename profile fields (`profile-id`→`id`,
`schema-version`→`schema_version`) — that breaking change is deferred to a future DDR-gated
mission and is **out of scope** here.

## Branch Strategy

Planning base / merge target: `refactor/doctrine-daphne-and-onboard-built-in-overlap`. Depends on
**WP01** (so the orphan paradigms' disposition is settled before canonicalizing their bodies).
Implement with: `spec-kitty agent action implement WP06 --agent <name>` (after WP01 merges).

## Subtasks

### T025 — Document canonical schema
- In `migrate-doctrine-to-pack.procedure.yaml` and `onboard-external-agent-to-pack.procedure.yaml`
  (the schema-template procedures), document the per-kind canonical conventions: paradigms carry
  both `summary:` and `body:`; the uniform `context-sources` shape (the exact key layout to use).

### T026 — Paradigm `summary`/`body`
- Ensure **every** paradigm file has both `summary:` and `body:` in the canonical shape. Fix any
  that use only one or a non-standard key. (Includes the two orphans wired in by WP01.)

### T027 — `context-sources` uniformity
- Apply the canonical `context-sources` shape to every owned profile. Do not change semantics —
  only the shape/keys so all profiles match.

### T028 — Enrich Scribe Sally
- Add the missing `toolguides` section to `scribe-sally.agent.yaml` `context-sources` (Sally is
  currently under-specified vs. peers).

### T029 — Profile-resident dedup
- Remove the duplicate consecutive `- juno-mcp` entry in `analyst-annie.agent.yaml` and
  `datamodel-darren.agent.yaml` (one each).
- In `minutes-maker-mahad.agent.yaml`, replace the verbatim re-inlined Scribe Sally neutrality
  ethos (appears twice) with a **reference** to `scribe-sally` instead of a copy.

### T030 — Mahad mode token
- Replace the non-canonical `confirmation-mode` token in `minutes-maker-mahad.agent.yaml` with a
  canonical mode token used elsewhere in the pack.

### T031 — Verify
```bash
for f in pack/paradigms/*.paradigm.yaml; do rg -q "^summary:" "$f" && rg -q "^body:" "$f" || echo "MISSING: $f"; done   # expect no output
rg -n "toolguides" pack/agent_profiles/scribe-sally.agent.yaml   # expect >=1
rg -cw "juno-mcp" pack/agent_profiles/analyst-annie.agent.yaml pack/agent_profiles/datamodel-darren.agent.yaml   # expect <=1 each
rg -n "neutrality ethos" pack/agent_profiles/   # expect 1 (scribe-sally); mahad references it
rg -n "confirmation-mode" pack/agent_profiles/minutes-maker-mahad.agent.yaml   # expect 0
```

## Definition of Done
- All paradigms have `summary`+`body`; uniform `context-sources`; Sally enriched; juno-mcp
  de-duplicated; Mahad references Sally and uses a canonical mode token; schema documented.
- No field renames (C-004). Regnology headers preserved. No edits outside owned files
  (Georgia is **not** owned here).

## Reviewer guidance
- Reject any `profile-id`/`schema-version` rename (out of scope).
- Confirm `context-sources` changes are shape-only, not semantic.

## Risks
- Touching ~22 files; keep edits mechanical and uniform. Re-run validation in WP07.

## Activity Log

- 2026-06-30T18:23:28Z – user – shell_pid=128779 – schema canonicalized (non-breaking, no field renames); paradigms have summary+body; Sally toolguides added; juno-mcp dedup; Mahad references Sally + canonical mode token; SC-008 greps pass
- 2026-06-30T18:24:37Z – cursor:sonnet-4.6:reviewer-renata:reviewer – shell_pid=207561 – Started review via action command
- 2026-06-30T18:32:09Z – user – shell_pid=207561 – Moved to planned
- 2026-06-30T18:34:10Z – user – shell_pid=207561 – Arbiter approval (cycle 1): the sole blocking issue (fragment.yaml in diff) is a diff-base artifact — WP06's own commit 2c9eb0fb does NOT touch fragment.yaml (git show --name-only count=0). The fragment.yaml delta is WP01's approved change inherited via the 'Merge dependency lane lane-a' commit. All 13 substantive criteria passed (SC-008, context-sources uniform, Sally toolguides, juno-mcp dedup, Mahad references Sally + canonical mode, C-004 no field renames).
