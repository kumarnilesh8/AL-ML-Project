<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██        Professional Services                 |
|████                                                |
|    ██        professional_services@regnology.net   |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Tasks: Gemini/Georgia generation doctrine + folded-in cleanup

**Mission:** `gemini-georgia-generation-doctrine-01KX3BAW`
**Plan:** [plan.md](./plan.md) · **Spec:** [spec.md](./spec.md)
**Branch:** `feat/migration-2967-gemini-doctrine` (planning base == merge target)

## Ownership model

WPs are scoped so no two WPs edit the same file. `pack/drg/ps-agent-enabled-factory.graph.yaml`
is generated — only WP05 regenerates it; never hand-edit. The Gemini cleanup (WP05) is kept isolated
from the Gemini-feature WPs for reviewability.

## Execution lanes

```
Phase 0 (parallel):  WP01   WP02   WP03   WP05
Phase 1:             WP04 (after WP01, WP02, WP03)
Phase 2 (terminal):  WP06 (after WP01..WP05)
```

## Subtask Index

| ID | Description | WP |
|----|-------------|----|
| T001 | Add optional "Connectors and tools", "Knowledge base overview", "Suggested starter prompts" sections to `instructions.template.md` | WP01 |
| T002 | Add "Recommended model" step + starter-prompts config step to `set-up-guide.template.md` | WP01 |
| T003 | Standardize `connector://<name>` / `tool://<name>` link syntax + grounding-vs-tools guidance in templates | WP01 |
| T004 | Create the single authoritative model→agent mapping artifact | WP02 |
| T005 | Author `gemini-chatbot-authoring` best-practices styleguide | WP03 |
| T007 | Update Georgia to author Connectors-and-tools fencing + KB manifest | WP04 |
| T008 | Update Georgia to emit Recommended-model (from mapping) + curated starter prompts | WP04 |
| T009 | Purge `backend-benny` (3 profiles + prose, artifact-tags, OVERVIEW, compile-drg allowlist) | WP05 |
| T010 | Dedup DRG edge `datamodel-darren → analyst-annie`; dedup `powershell-conventions` tag key; drop stale `shell-scripts` tag; wire orphan paradigm nodes if trivial; recompile graph | WP05 |
| T011 | Fix `docs/OVERVIEW.md` agent table to real roster | WP05 |
| T012 | `spec-kitty doctrine pack validate pack/` 0 errors; dry render check; CHANGELOG; record FR-011 re-pin follow-up | WP06 |

---

## WP01 — Gemini template contract extension

- **Priority:** P1 (gates WP04) · **Requirements:** FR-005, FR-006, FR-007, FR-008
- **Independent test:** the three optional sections render in `instructions.template.md`; `set-up-guide.template.md` has the two new steps; `connector://`/`tool://` syntax + grounding-vs-tools guidance present.
- Prompt: [tasks/WP01-gemini-template-contract.md](./tasks/WP01-gemini-template-contract.md)

## WP02 — Authoritative model→agent mapping

- **Priority:** P1 (gates WP04) · **Requirements:** FR-010
- **Independent test:** one mapping artifact exists; no per-file model duplication; references the leaderboard toolguide rather than copying tier data.
- Prompt: [tasks/WP02-model-mapping.md](./tasks/WP02-model-mapping.md)

## WP03 — Gemini best-practices doctrine

- **Priority:** P1 (gates WP04) · **Requirements:** FR-009
- **Independent test:** `gemini-chatbot-authoring` styleguide validates; discoverable via a DRG edge from Georgia.
- Prompt: [tasks/WP03-best-practices-styleguide.md](./tasks/WP03-best-practices-styleguide.md)

## WP04 — Georgia authoring behaviour

- **Priority:** P1 · **Requirements:** FR-001, FR-002, FR-003, FR-004 · **Depends:** WP01, WP02, WP03
- **Independent test:** Georgia profile instructs authoring of fenced connectors/tools, KB manifest, recommended-model (from mapping), and on-scope starter prompts; existing invariants (handoff, avoidance-boundary) preserved.
- Prompt: [tasks/WP04-georgia-authoring.md](./tasks/WP04-georgia-authoring.md)

## WP05 — Folded-in pack cleanup

- **Priority:** P1 · **Requirements:** FR-012, FR-013, FR-014, FR-015, FR-016, FR-017
- **Independent test:** no `backend-benny` anywhere; single `datamodel-darren → analyst-annie` edge; single `powershell-conventions` tag key; OVERVIEW table matches roster; graph recompiled clean.
- Prompt: [tasks/WP05-pack-cleanup.md](./tasks/WP05-pack-cleanup.md)

## WP06 — Validation, CHANGELOG, re-pin follow-up

- **Priority:** P1 (terminal) · **Requirements:** FR-011 · **Depends:** WP01, WP02, WP03, WP04, WP05
- **Independent test:** `pack validate` 0 errors; dry render shows new sections; CHANGELOG entry; FR-011 re-pin recorded as dependent follow-up.
- Prompt: [tasks/WP06-validate-changelog.md](./tasks/WP06-validate-changelog.md)
