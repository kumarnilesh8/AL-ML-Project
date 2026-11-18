<!--
+----------------------------------------------------+
|████          R E G N O L O G Y                     |
|    ██                                              |
|████                                                |
+----------------------------------------------------+

Property of Regnology Group GmbH - All Rights Reserved
              FOR INTERNAL USE ONLY
-->

# Engineering Note: Pack Governance Dashboard — Mission Debrief

_Version: 1.0_  
_Date: 2026-05-20_  
_Author: Stijn Dejongh (with Claude agent support)_  
_Status: Specified — ready for mission creation_  
_Predecessor: `docs/engineering_notes/2026-05-20-batch-3-and-beyond-next-steps.md`_

---

## Context

With batches 1–2 shipped and the pack functional (33 DRG nodes, 68 edges, 108-test suite), the
remaining migration work (batches 3–6, ~50 artifacts) needs an efficient governance surface.
Manual YAML editing + pytest loops are workable but slow. The review-and-remediation cycle —
human reviews artifacts, requests changes, agents fix them — needs a structured feedback channel.

This note specifies a **local Angular + Express webapp** ("Pack Dashboard") that provides:

1. Artifact browsing and inspection
2. Schema-validated live YAML editing
3. A review workflow (approve / reject / changes_requested)
4. Disk-persisted review files consumable by agents for remediation

---

## Decision: Build a Local Pack Dashboard

### Why a webapp (not CLI-only)?

- Visual inspection of YAML artifacts is faster with syntax highlighting and structured layout
- Review comments benefit from inline annotation (line-level)
- The DRG graph (future) is inherently visual
- The Regnology design system exists and should be exercised

### Why Angular + Express (not Python/Flask)?

- The Regnology design system (`regnology-docgen/design-system/`) is CSS-first with web
  component patterns — natural fit for an Angular frontend
- Node/Express is minimal for a filesystem API server
- Schema validation stays in Python (subprocess bridge) — no drift from spec-kitty Pydantic models
- TypeScript end-to-end (frontend + backend) keeps the codebase uniform

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Angular 18 Frontend                     │
│  - Artifact browser (list/detail)       │
│  - Monaco YAML editor (live edit)       │
│  - Review panel (comment, decide)       │
│  - [WANT] DRG graph viewer             │
│  Styled: regnology-web.css             │
└────────────────┬────────────────────────┘
                 │ HTTP REST
┌────────────────┴────────────────────────┐
│  Express.js Backend                      │
│  - Artifact CRUD (read/write YAML)      │
│  - Review lifecycle (persist JSON)      │
│  - Validation trigger (Python bridge)   │
│  - DRG endpoint (parse fragment.yaml)   │
└────────────────┬────────────────────────┘
                 │ Filesystem
┌────────────────┴────────────────────────┐
│  pack/                                   │
│    directives/*.directive.yaml          │
│    tactics/*.tactic.yaml                │
│    agent_profiles/*.agent.yaml          │
│    ...                                   │
│    .reviews/<kind>/<id>.review.json     │
│    drg/fragment.yaml                    │
└─────────────────────────────────────────┘
                 │ subprocess
┌────────────────┴────────────────────────┐
│  Python validation bridge                │
│  - Imports spec-kitty Pydantic models   │
│  - Validates YAML → JSON result         │
└─────────────────────────────────────────┘
```

---

## MoSCoW Prioritization

### Must (MVP)

| Feature | Description |
|---------|-------------|
| Artifact browser | List/detail views for all 8 pack artifact kinds |
| YAML live editor | Monaco with save-to-disk |
| Schema validation | Python bridge, per-artifact and bulk |
| Review workflow | Approve / reject / changes_requested with line-level comments |
| Review persistence | `.reviews/` JSON files consumable by agents |
| Regnology styling | Design system CSS integration |

### Should

| Feature | Description |
|---------|-------------|
| Dashboard overview | Counts, validation status, review progress |
| Filesystem watcher | Auto-refresh when artifacts change externally |
| Editor gutter annotations | Inline validation errors |

### Could

| Feature | Description |
|---------|-------------|
| Diff view | Show changes since last review |
| Batch review ops | Approve all passing, reject all failing |
| Review history | Multiple review rounds per artifact |

### Want (defer)

| Feature | Description |
|---------|-------------|
| DRG graph visualization | Cytoscape.js interactive node/edge explorer |
| Graph click-through | Navigate from graph nodes to artifact detail |
| Graph filtering | Filter by kind/relation type |

---

## Review File Contract (Agent Consumption)

Review decisions are stored as individual JSON files at `pack/.reviews/<kind>/<artifact-id>.review.json`.

```json
{
  "artifact_id": "REGNOLOGY_BRANDING",
  "artifact_kind": "directives",
  "artifact_path": "pack/directives/041-regnology-branding.directive.yaml",
  "status": "changes_requested",
  "reviewed_at": "2026-05-20T15:30:00Z",
  "reviewer": "stijn",
  "comments": [
    {
      "line": 12,
      "text": "Intent statement is too vague — should reference the exact header format",
      "severity": "must-fix"
    }
  ],
  "summary": "Sharpen intent and add the header template reference"
}
```

**Status values:** `pending` | `in_review` | `approved` | `rejected` | `changes_requested`

**Comment severity:** `must-fix` | `should-fix` | `nit`

**Agent workflow:** Agents query `pack/.reviews/` for files with `"status": "changes_requested"`,
read the `comments` and `summary`, apply fixes to the referenced `artifact_path`, then update
the review status to `in_review` (triggering re-review by the human).

---

## Phased Build

**Phase 1 — Read + Validate:**
Scaffold project, backend filesystem service, artifact API, Angular shell with Regnology CSS,
artifact browser pages, Python validation bridge.

**Phase 2 — Edit + Review:**
Monaco editor integration, save-to-disk, review panel component, review API routes,
`.reviews/` persistence, agent contract documentation.

**Phase 3 — Polish + Want:**
Dashboard overview, filesystem watcher, DRG graph viewer (if time permits).

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Project at `tools/pack-dashboard/` | Aligns with repo structure for dev utilities |
| Python subprocess for validation | Zero schema drift from spec-kitty Pydantic models |
| Monaco editor | Best-in-class YAML editing with syntax highlighting |
| `.reviews/` under `pack/` | Co-located with artifacts; gitignore-able if needed |
| One review JSON per artifact | Simple for agents to discover and parse |
| Express (not Fastify/Hono) | Minimal, well-known, adequate for local tool |

---

## Dependencies

**Node (backend + frontend):**
- express, js-yaml, chokidar, cors
- @angular/cli (v18), ngx-monaco-editor-v2
- [WANT] cytoscape + @types/cytoscape

**Python (validation bridge):**
- spec-kitty fork (`/home/stijnd/Documents/code/forks/spec-kitty/src`)
- ruamel.yaml, pydantic (already in spec-kitty deps)

**Design system:**
- `regnology-docgen/design-system/dist/regnology-web.css`

---

_[Stijn Dejongh with Claude agent] — 2026-05-20_
