# Data Model: PowerShell Specialist Agent (PowerShell Peter)

**Mission**: `powershell-specialist-agent-01KTP3DG`

This mission adds governed pack artifacts — not runtime application entities. The model
describes artifact shapes and DRG relationships implementers must produce.

---

## Entities

### AgentProfile (powershell-peter)

Pack agent profile YAML conforming to spec-kitty agent profile schema.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| profile-id | string | yes | `powershell-peter` (C-002) |
| schema-version | string | yes | `"1.0"` |
| name | string | yes | `PowerShell Peter` |
| description | string | yes | Short routing summary |
| roles | string[] | yes | e.g. `implementer`, `automation-engineer` |
| capabilities | string[] | yes | e.g. `powershell-module-authoring`, `pester-testing` |
| routing-priority | number | yes | Suggest 55–60 (align with devops-danny) |
| purpose | string | yes | Multi-line scope statement |
| context-sources | object | yes | styleguide, tactics, toolguides |
| specialization | object | yes | primary-focus, secondary-awareness, avoidance-boundary, success-definition |
| collaboration | object | yes | works-with, handoff-to, output-artifacts |
| mode-defaults | array | yes | analysis-mode default |
| directive-references | array | yes | codes 007, 018, 023, 028, 038, 043 |

**Invariants**:

- Multi-step workflows MUST NOT live in `specialization.primary-focus` (C-005)
- `avoidance-boundary` MUST mention the DevOps specialist for CI/Sonar (FR-003)

---

### Styleguide (powershell-conventions)

| Field | Type | Required |
|-------|------|----------|
| schema_version | string | yes |
| id | string | yes | `powershell-conventions` |
| title | string | yes |
| scope | string | yes | `code` |
| principles | string[] | yes | ≥8 distilled rules |
| patterns | object[] | yes | ≥3 with good/bad examples |

**Relationships**:

- Referenced by `powershell-peter` via DRG `applies`
- Description field MAY reference `docs/references/powershell-primer.md`

---

### Tactic (×2) and Procedure (×1)

Each tactic YAML:

| Field | Type | Required |
|-------|------|----------|
| schema_version | string | yes |
| id | string | yes | kebab-case id |
| name | string | yes | Human title |
| purpose | string | yes | When to apply |
| steps | array | yes | title + description per step |
| failure_modes | string[] | optional | Recommended |
| applies_to_languages | string[] | optional | `powershell` |

The Pester workflow was reclassified from tactic to **procedure** (has entry/exit conditions and actor assignments).

**Instances**:

| id | Kind | Purpose |
|----|------|---------|
| `powershell-module-scaffold` | tactic | Bootstrap module tree + build.ps1 |
| `powershell-pester-workflow` | procedure | Author and run Pester tests (gated workflow) |
| `powershell-script-quality-gate` | tactic | PSScriptAnalyzer + C-001 checklist |

---

### DRGNode

Registered in `pack/drg/fragment.yaml` under `nodes:`.

| Field | Type | Example |
|-------|------|---------|
| id | string | `powershell-peter` |
| kind | enum | `agent_profiles` |
| title | string | Display name |
| body_path | string | `agent_profiles/powershell-peter.agent.yaml` |

---

### DRGEdge

Registered in `pack/drg/fragment.yaml` under `edges:`.

| Field | Type | Allowed values |
|-------|------|----------------|
| source | string | Artifact id |
| target | string | Artifact id |
| relation | enum | `requires`, `applies`, `suggests`, `delegates_to`, … |

**Required edges for Peter** — see plan.md DRG wiring checklist.

---

### ArtifactTagEntry

In `config/artifact-tags.yaml`:

```yaml
powershell-peter:
  domains:
    - tooling
    - engineering
  primary_domain: engineering
```

Same pattern for `powershell-conventions` and each tactic id.

---

### CompanionReference (docs)

Markdown file — not a DRG node.

| Field | Requirement |
|-------|-------------|
| Path | `docs/references/powershell-primer.md` |
| Header | Regnology branding HTML comment |
| Attribution | Stijn Dejongh, source date 2025-11-13 |
| Status note | Derived from draft primer; styleguide is authoritative for enforcement |

---

## State transitions

Not applicable — artifacts are version-controlled files with no runtime lifecycle.

---

## Validation rules (summary)

| Rule | Check |
|------|-------|
| Schema valid | `spec-kitty doctrine pack validate pack/` |
| DRG complete | Every cross-reference in profile/tactic prose has matching edge |
| No duplicate ids | `rg '^id:' pack/**/*.yaml` before adding |
| Alliteration | profile-id and display name satisfy C-002 |
