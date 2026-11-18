# Usage Guide — Regnology Agent Doctrine Pack

This guide covers two distinct workflows:

1. **Creating and maintaining doctrine elements** (YAML artifacts in `pack/`)
2. **Using the Pack Governance Dashboard** (local web UI at `tools/pack-dashboard/`)

---

## Part 1 — Authoring Doctrine Elements

Doctrine artifacts live in `pack/` and are validated against spec-kitty Pydantic schemas.
Eight kinds are supported: directives, tactics, styleguides, toolguides, paradigms, procedures,
agent_profiles, mission_step_contracts.

### Quick reference: file layout

```
pack/
├── directives/          *.directive.yaml
├── tactics/             *.tactic.yaml
├── styleguides/         *.styleguide.yaml
├── toolguides/          *.toolguide.yaml
├── paradigms/           *.paradigm.yaml
├── procedures/          *.procedure.yaml
├── agent_profiles/      *.profile.yaml
├── mission_step_contracts/  *.contract.yaml
└── drg/
    └── fragment.yaml    Dependency Reference Graph nodes + edges
```

### Creating a new directive

1. Copy an existing directive as a template:
   ```bash
   cp pack/directives/REGNOLOGY_BRANDING.directive.yaml pack/directives/MY_NEW_DIRECTIVE.directive.yaml
   ```

2. Edit the YAML — required fields are enforced by the Pydantic schema:
   ```yaml
   id: MY_NEW_DIRECTIVE
   title: "My New Directive"
   intent: "One-sentence purpose"
   rationale: "Why this rule exists"
   instructions:
     - "Step 1 ..."
     - "Step 2 ..."
   ```

3. Validate before committing:
   ```bash
   spec-kitty doctrine pack validate pack/
   ```

4. Add a DRG node in `pack/drg/fragment.yaml` if this artifact should appear in governance queries:
   ```yaml
   nodes:
     - id: MY_NEW_DIRECTIVE
       kind: directive
       title: "My New Directive"
   ```

### Creating a new agent profile

Agent profiles use `profile-id` instead of `id`:

```yaml
profile-id: my-agent-name
name: "My Agent"
role: implementer
specialization:
  primary_focus: "..."
  avoidance_boundary: "..."
```

Validate:
```bash
spec-kitty doctor doctrine
```

### Migration guidance

If you have a Markdown doctrine document in `doctrine/`, see
`docs/AGENT_MIGRATION_GUIDANCE.md` for the step-by-step conversion process.
The batch tracker at `docs/pack-migration-plan.md` tracks which artifacts
have been converted.

---

## Part 2 — Pack Governance Dashboard

The dashboard is a local Angular 18 + Express.js webapp for visually inspecting,
editing, reviewing, and validating pack artifacts.

### Prerequisites

- Node.js 20+
- Python 3.11+ with spec-kitty installed (or the fork checked out)
- The `regnology-docgen` repository checked out as a sibling (optional — snapshot CSS fallback ships with the tool)

### Starting the dashboard

```bash
cd tools/pack-dashboard
npm install          # first time only
npm start
```

- **Frontend**: [http://localhost:4200](http://localhost:4200)
- **API**: [http://localhost:3000](http://localhost:3000)
- **Health check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PACK_ROOT` | `../../pack` (relative to server/) | Absolute path to the `pack/` directory |
| `SPEC_KITTY_SRC` | `../../../../forks/spec-kitty/src` | Path to spec-kitty Python source |
| `PORT` | `3000` | Express API port |

Override via shell:
```bash
SPEC_KITTY_SRC=/path/to/spec-kitty/src npm start
```

### Core workflows in the UI

#### Browse artifacts

1. Select an artifact kind from the **sidebar** (e.g. "directives")
2. The artifact list shows each artifact's ID, title, validation status, and review status
3. Click any row to open the artifact detail view

#### Edit and save an artifact

1. Open an artifact detail page
2. Edit the YAML content in the editor pane
3. Click **Save**
   - The editor first validates the content against the Pydantic schema
   - If validation **fails**: errors are displayed inline; the file on disk is unchanged
   - If validation **passes**: the file is written to disk and the badge updates to `valid`
4. Click **Revert** to discard unsaved edits and restore the last saved content

> **Note**: The current editor is a plain textarea with monospace styling. Monaco editor
> integration is deferred pending an esbuild compatibility fix. Syntax highlighting
> and schema-aware autocompletion will be added in a follow-up.

#### Validate an artifact without saving

The validation badge on the detail page shows the last known schema status.
Saving always triggers a fresh validation. To validate independently, use the API directly:

```bash
curl -s -X POST http://localhost:3000/api/validate/directives/REGNOLOGY_BRANDING | jq .
```

#### Validate all artifacts at once

```bash
curl -s -X POST http://localhost:3000/api/validate-all | jq '{total, passed, failed}'
```

#### Submit a review decision

1. Open an artifact detail page
2. Scroll to the **Review** panel below the editor
3. Enter your **username** and a **summary**
4. Add line-level **comments** with severity (`must-fix`, `should-fix`, `nit`)
5. Click **Approve**, **Reject**, or **Request Changes**
6. The review JSON is written to `pack/.reviews/<kind>/<id>.review.json`

Review files are consumable by remediation agents. See the review schema below.

#### Dashboard overview

The **Dashboard** page (default landing page) shows:
- Total artifact count across all kinds
- Aggregate review status counts (approved / rejected / changes_requested / pending)
- Per-kind breakdown table

#### DRG coverage query

Find artifacts with no inbound edges for a given relation type (useful for identifying
orphaned artifacts during migration):

```bash
# All artifacts with no inbound edges
curl -s "http://localhost:3000/api/drg/coverage" | jq .

# Tactics with no 'suggests' edge from any agent profile
curl -s "http://localhost:3000/api/drg/coverage?relation=suggests&kind=tactics" | jq .
```

### Review file schema

Review files are written to `pack/.reviews/<kind>/<id>.review.json`. They follow this schema:

```json
{
  "artifact_id": "REGNOLOGY_BRANDING",
  "artifact_kind": "directives",
  "status": "changes_requested",
  "reviewed_at": "2026-05-20T15:30:00Z",
  "reviewer": "stijnd",
  "comments": [
    {
      "line": 12,
      "text": "Intent statement is too vague",
      "severity": "must-fix"
    }
  ],
  "summary": "Sharpen intent and add the header template reference"
}
```

**Note**: The schema intentionally omits `artifact_path`. Agents resolve the file path
from `(artifact_kind, artifact_id)` at runtime using the same pack-scanner logic,
so references stay valid across file renames.

`POST /api/reviews/:kind/:id` is a last-write-wins overwrite. Review history is out of scope
for the current version; if audit trail is required, the `.reviews/` directory can be
committed to git to capture the history via version control.

### API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/artifacts` | All artifacts grouped by kind |
| GET | `/api/artifacts/:kind` | Artifacts for one kind |
| GET | `/api/artifacts/:kind/:id` | Single artifact (YAML + parsed JSON + review status) |
| PUT | `/api/artifacts/:kind/:id` | Save edited YAML (body: `{"content": "..."}`) |
| POST | `/api/validate/:kind/:id` | Validate single artifact (optional body: `{"content": "..."}` for in-memory validation) |
| POST | `/api/validate-all` | Validate all artifacts, returns aggregate result |
| GET | `/api/reviews/:kind/:id` | Get review state |
| POST | `/api/reviews/:kind/:id` | Submit review decision |
| GET | `/api/reviews-summary` | Aggregate review counts |
| GET | `/api/drg` | Full DRG nodes and edges |
| GET | `/api/drg/coverage` | Unlinked nodes query (`?relation=&kind=`) |
