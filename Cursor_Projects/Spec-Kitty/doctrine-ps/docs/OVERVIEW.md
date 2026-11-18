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

# Regnology PS agent doctrine — overview

**Audience:** PS consultants, team leads, and engagement managers working with the
Regnology AI tooling programme.

**Purpose:** This document explains what the agent doctrine framework is, how the
governance layers compose, what types of AI assistant exist in the programme, which
specialist agents are available, and how to set up the tooling required to use them.

---

## Part 1: The governance framework

### The doctrine stack

All AI tooling built by and for the PS team operates under a shared governance
framework called the **agent doctrine stack**. It is not a single policy document. It
is a layered architecture of five artifact types, where each layer answers a different
question about how an agent should behave.

| Layer | Question | Contains |
|---|---|---|
| Guidelines | What do we value? | Broad principles: clarity over confidence, explicitness over assumption, human accountability |
| Approaches | How do we think about recurring problems? | Mental models and framing patterns for design choices |
| Directives | What are the non-negotiable constraints? | Explicit rules: security controls, branding, prohibited patterns, mandatory quality gates |
| Tactics | How do we execute a specific type of work? | Step-by-step procedures for recurring tasks: how to query a regulatory database, how to escalate, how to structure a review |
| Templates | What does finished output look like? | Reusable artifact shapes: document headers, diagram conventions, API contracts |

Any agent built for PS delivery inherits this stack. The team building a tool works
within the framework; they do not rebuild it. That is what keeps the quality standard
consistent across the portfolio.

The stack is maintained in the `doctrine-ps` repository at
[bitbucket.regnology.net/projects/RAF/repos/doctrine-ps](https://bitbucket.regnology.net/projects/RAF/repos/doctrine-ps)
and is versioned alongside the tools that depend on it.

---

### The pack

The doctrine stack is distributed to engagement repositories as a **doctrine pack**: a
collection of versioned, machine-readable YAML artifacts that a project pulls in and
activates via spec-kitty. The pack contains several distinct artifact types:

| Artifact type | What it governs |
|---|---|
| **Paradigms** | Named patterns of thinking that govern how a class of problems is approached — for example: decision-first development, evidence-based requirements, token efficiency |
| **Directives** | The hard constraints every agent must comply with — for example: AppSec compliance, Regnology branding, model discipline |
| **Tactics** | Operational playbooks for specific recurring tasks — for example: how to run a Juno regulatory query, how to apply the post-action learning loop |
| **Procedures** | Multi-step workflows with defined entry and exit conditions and actor responsibilities — for example: ATDD acceptance criteria preparation, automation scripting discipline |
| **Styleguides** | Writing and coding conventions — for example: professional communications, Java coding standards, SQLX coding standards |
| **Toolguides** | Reference guides for specific tools used in agent workflows — for example: how to use the Regnology MCP server, when to use ripgrep |
| **Agent profiles** | Specifications for each specialist agent: its role, its scope, what it does, what it delegates, and what it must never attempt |

These artifact types are distinct by design. An agent profile specifies who acts. A
procedure specifies how an activity flows. A directive specifies what is prohibited or
required. A tactic specifies how a particular execution step is carried out. Keeping
them separate means each can be updated independently when the underlying guidance
changes.

---

### The charter

At the project level, the governance framework is activated through a **charter** — a
structured configuration document that records the scope, governance selections, and
team context for a specific engagement. The charter is the bridge between the
organisation-wide doctrine pack and the decisions that are specific to one project.

When a new engagement starts, the charter interview captures: which regulatory domains
apply, which tooling integrations are in scope, which quality gates are mandatory, and
which agent profiles are relevant to the work. This pre-populates the context that
agents use when they start a session, so they begin with accurate scope and constraints
rather than needing to be briefed from scratch each time.

The charter is not a one-time document. It is updated as the engagement evolves — when
scope changes, when new tools come into play, or when governance requirements change.

---

## Part 2: Types of AI assistant

### Two modes, one spectrum

There are two fundamentally different ways to use AI in a delivery context. Both appear
in the PS tooling programme. Conflating them causes misunderstanding — in internal
conversations, in client conversations, and in governance decisions.

---

### Chat assistants

A chat assistant responds to questions. The user drives every step. The assistant
produces an answer; the user decides what to do with it. There is no defined workflow,
no structured output format, and no built-in review gate. The interaction is
open-ended.

Chat assistants are useful for a narrow class of work: brainstorming, sense-checking,
drafting a first version of a document, explaining an unfamiliar concept, or exploring
a problem where a structured tool would be overkill. They remain part of the PS
strategy for these purposes.

They are not appropriate for delivery-critical work. An open-ended assistant has no
defined scope, no traceability, and no human checkpoint built into the workflow. For a
mapping decision that will reach a client's regulatory submission, that is not an
acceptable risk profile.

---

### Semi-autonomous productivity assistants (specialist agents)

A productivity assistant — what the PS programme calls a **specialist agent** — operates
differently. It has:

- a defined role and a named scope of responsibility
- explicit constraints on what it should and should not attempt
- a structured output format that feeds into a real delivery workflow
- built-in review checkpoints where a human must confirm before the process continues

The specialist does not answer open-ended questions. It executes a workflow step,
surfaces uncertainty explicitly, and hands off to a human at the defined decision
boundary. The human reviews and approves; the workflow advances. If the agent cannot
proceed with confidence, it says so and escalates — it does not invent an answer.

This is the model the PS programme is deliberately building towards for delivery-critical
work. The same structure — constrained scope, explicit uncertainty, human checkpoints —
is what the EU AI Act (Article 14) requires for high-risk AI systems in financial
services from August 2026.

---

### The autonomy spectrum

Between fully manual work and fully autonomous AI, the programme uses a four-level
vocabulary:

| Level | Name | What it means | PS target? |
|---|---|---|---|
| 1 | AI-assisted | AI helps a human complete a single task | In active use |
| 2 | AI-augmented | AI automates one step; human checks output | In active use |
| 3 | Agent-enabled | AI orchestrates a multi-step workflow; human reviews and approves at decision boundaries | Primary target for delivery-critical work |
| 4 | Fully agentic | AI operates end-to-end without human checkpoints | Not appropriate for regulated workflows |

Level 3 is the target for every tool that touches a delivery-critical or client-facing
process. A human remains accountable for every significant outcome. That is both a
design principle and a legal requirement.

> "The most valuable use of so-called 'agentic' technology in our world is
> orchestration. Helping experts do more, faster, and with greater consistency —
> without losing visibility or control. Compliance should never be self-driving."
>
> — Jelle Dhuyvetter, Global Head of Professional Services, Regnology

---

## Part 3: Specialist agents

The doctrine pack includes a catalogue of specialist agent profiles, each with a
defined role, scope, and collaboration contract. The following tables give an overview
organised by the type of work each agent handles.

### Analysis and specification

| Agent | Role | What it does | What it does not do |
|---|---|---|---|
| Analyst Annie | Generalist functional analyst | Translates informal requirements into structured specs, BDD scenarios, and user journeys | Datamodel schema analysis; implementation; SQLX |
| Datamodel Darren | Datamodel analyst | Interprets ABACUS360 entity-relationship structures and field lineage; maps regulatory context to datamodel elements | SQLX generation; implementation |
| Lexical Larry | Terminology reviewer | Detects synonym drift, curates glossary entries, and preserves ubiquitous language across artifacts | Drafting communications; applying brand voice rules |

### Implementation and automation

| Agent | Role | What it does | What it does not do |
|---|---|---|---|
| DevOps Danny | CI/CD and release engineering | Designs reproducible build, test, AppSec, and release pipelines | Refactoring application logic; redefining release criteria |
| PowerShell Peter | PowerShell automation | Authors, refactors, tests, and reviews PowerShell 7+ modules and scripts | Jenkinsfile, SonarQube, SBOM, or full CI/AppSec pipeline design |
| SQLX Specialist Simon | SQLX authoring | Generates, validates, explains, tests, and optimises SQLX functional units against the ABACUS360 data model | Datamodel analysis; general API or service architecture |

### Onboarding and generated assistants

| Agent | Role | What it does | What it does not do |
|---|---|---|---|
| Receptionist Rob | Onboarding and session routing | Validates local setup, builds audience personas, opens session artifacts, and routes users to the right execution path | Implementation, code review, or mission execution |
| Gemini Bot Georgia | Gemini Enterprise agent generation | Generates Gemini Enterprise workspace agent packages from pack profiles and DRG context | Performing the generated agent's domain work; publishing or promoting agents |

### Communications, documents, and diagrams

| Agent | Role | What it does | What it does not do |
|---|---|---|---|
| Comms Cleo | Professional communications | Drafts and edits persona-targeted, brand-compliant reports, pages, release notes, updates, and slide briefs | Introducing new facts or changing factual claims without approval |
| Diagram Daisy | Diagram-as-code design | Creates Mermaid, PlantUML, and Graphviz diagrams with semantic fidelity and brand consistency | Decorative or semantically unverified diagrams |
| Minutes-Maker Mahad | Meeting minutes | Converts VTT transcripts into validated minutes and publishes them to Confluence | Inventing content; publishing unattributed action items |
| Scribe Sally | Documentation and meeting records | Captures neutral, traceable summaries and meeting notes | Substantive interpretation or editorial opinion |
| Slidedeck Stanislav | Presentation and document packages | Turns briefs into branded, audience-calibrated slide decks and document packages | Generating diagram code directly; choosing binary formats unless required |
| Synthesizer Sam | Multi-source integration | Integrates multi-agent outputs into coherent, source-preserving synthesis artifacts | Original research; modifying other agents' outputs directly |

---

### The key distinction, stated plainly

A chat assistant answers. A specialist agent executes a governed workflow step and
hands off.

The difference is not about the sophistication of the underlying model. It is about
structure: whether the interaction has a defined scope, a defined output, a defined
human checkpoint, and a traceable record of what was produced and why. In a regulated
delivery context, that structure is what makes AI assistance credible, auditable, and
safe to use.

---

## Part 4: Tooling setup

### Prerequisites

Before configuring MCP tools or running agent sessions, ensure the following are in
place:

- spec-kitty ≥ 3.1 installed and on PATH (`spec-kitty --version`)
- SSH key registered on Bitbucket (`ssh -T git@bitbucket.regnology.net` returns a
  greeting)
- Regnology VPN active (required for all internal tool access)
- An engagement repo initialised (`spec-kitty init .` run at least once)
- The doctrine pack loaded and verified (`spec-kitty doctor doctrine` shows expected
  artifact counts — see `docs/HOW_TO_USE.md` for pack setup)

---

### Core MCP servers

Model Context Protocol (MCP) servers extend the agent's reach into Regnology systems
and knowledge sources. These are the primary servers every PS engagement should have
configured.

---

#### Regnology MCP

**What it is:** The main integration server for Regnology corporate systems. Provides
access to Jira, Confluence, Bitbucket, rCloud, Jenkins, and SonarQube through a single
configured connection.

**Repository:**
[bitbucket.regnology.net/projects/SKYN/repos/regnology-mcp](https://bitbucket.regnology.net/projects/SKYN/repos/regnology-mcp/browse)

**Capabilities (58 tools across 7 providers):**

| Provider | Access | Key tools |
|---|---|---|
| Jira | Read + write | Search, get/create/update issues, transitions, comments |
| Confluence | Read + write | Search, get/create/update pages, manage attachments |
| Bitbucket | Read + write | List repos/branches/PRs, get file contents, create/comment PRs |
| rCloud | Read only | Dashboard queries, instance config, release notes, documentation search |
| Jenkins | Read + write | List jobs, build logs, trigger builds |
| SonarQube | Read only | Quality gates, code measures, issue list |
| rcloudinfra | Read only | Kubeconfig retrieval (requires local kubectl + gcloud) |

Default mode is read-only. Write tools are activated per-provider by setting
`ACCESS_MODE=readwrite` in the server's `.env` file (or per-provider overrides:
`JIRA_ACCESS_MODE`, `CONFLUENCE_ACCESS_MODE`, `BITBUCKET_ACCESS_MODE`,
`JENKINS_ACCESS_MODE`).

**Setup (Windows):**

```powershell
Install-McpServer.ps1 -Tool all
```

**Setup (manual):**

Configure `.env` in the repo root and add the following entry to
`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "regnology-mcp": {
      "command": "node",
      "args": ["/path/to/regnology-mcp/dist/index.js"],
      "env": {
        "ACCESS_MODE": "readonly"
      }
    }
  }
}
```

Rebuild after `git pull` on the server repository. Credentials (Jira API token,
Confluence URL) belong in the developer's shell profile — never committed to version
control. See `pack/toolguides/regnology-mcp.md` for the full credential reference.

---

#### Juno MCP

**What it is:** Read-only semantic search over Regnology product documentation and
regulatory knowledge (EBA, ECB, Bundesbank, national reporting frameworks). Hosted on
Cloud Run — no local installation required.

**Endpoint:** `https://juno-mcp-vjv4ctetga-ey.a.run.app/mcp`

**Capabilities:**

| Tool | What it does |
|---|---|
| `search_product_docs` | Natural-language query; returns cited answers from product and regulatory documentation. Filters: `product` (e.g. Abacus360), `locale` (e.g. `de`, `en`), `topK` (retrieval depth) |

**Setup:** Add to `.cursor/mcp.json` in your engagement repo:

```json
{
  "mcpServers": {
    "juno": {
      "url": "https://juno-mcp-vjv4ctetga-ey.a.run.app/mcp",
      "auth": {
        "type": "okta",
        "client_id": "<CLIENT_ID>"
      }
    }
  }
}
```

Restart Cursor and approve the server when prompted. Verify with a narrow query
(product: Abacus360, locale: de) before starting a session.

For regulatory research workflows using Juno (Bundesbank Rundschreiben, supervisory
circulars, cross-reference queries), apply the `juno-based-regulatory-research` tactic
in `pack/tactics/`.

---

#### Google Cloud MCP — SQLX data model server

**What it is:** Structured query access to the live ABACUS360 data model (entities,
fields, domain values) and the SQLX technical manual. The authoritative source for
data model lookups during SQLX authoring.

**GCP project:** `dmm-01` · **Region:** `europe-west1`

**Capabilities:**

| Tool | What it does |
|---|---|
| `query_datamodel_definitions` | SQL SELECT queries against ABACUS360 entities, fields, domains, and domain values |
| `get_sqlx_manual_chapter` | Retrieves chapters 0–31 of the SQLX technical manual |

**Session setup (run once per session, keep terminal open):**

```bash
gcloud run services proxy sqlx-mcp \
  --region=europe-west1 \
  --project=dmm-01 \
  --port=8080
```

**One-time setup:**

```bash
# Install gcloud CLI and the Cloud Run proxy component
gcloud components install cloud-run-proxy

# Authenticate with your Regnology account
gcloud auth login   # use your @regnology.net account

# Verify access (roles/run.invoker required on project dmm-01)
gcloud run services list --project=dmm-01 --region=europe-west1
```

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "data-model-definitions": {
      "url": "http://localhost:8080/mcp",
      "type": "http"
    }
  }
}
```

If the MCP connection shows as disconnected, the proxy terminal has been closed — restart
it. If `/sse` returns 404, switch to `/mcp` with `type: http`.

---

### Reference tools and knowledge sources

These tools are not interactive MCP servers but are referenced by agents during
analysis and datamodel work.

---

#### ABACUS360 datamodel tools

**What it is:** The canonical reference repository for ABACUS360 data model content.
Contains two categories: model operations (join definitions, transformation rules, data
quality checks) and core datamodel reference guides (entity overviews, field catalogues,
domain value catalogues, relationship maps).

**Repository:**
[bitbucket.regnology.net/projects/CONS/repos/datamodel-tools](https://bitbucket.regnology.net/projects/CONS/repos/datamodel-tools)

**Access requirements:** Regnology VPN + Bitbucket CONS project access.

Access the repository content via the regnology-mcp Bitbucket tools (`bb_get_file`,
`bb_list_repos`) or via direct `git clone`. Always read `README.md` first to resolve
the directory structure before fetching content. Use alongside the Google Cloud MCP
server for live data model queries; `datamodel-tools` provides the canonical operation
specifications and reference guides. This repository is read-only — do not push or
create branches.

---

#### SQLX MCP and manual reference

**What it is:** The full SQLX authoring workflow — MCP tools for live data model access,
the Abacus CLI for validation and testing, and a fallback knowledge base for offline use.

When MCP is available, always prefer it (live, authoritative). When MCP is unavailable,
fall back to the bundled knowledge base at `resources/sqlx/` in the doctrine pack.

**Abacus CLI commands used in the authoring workflow:**

| Command | Purpose |
|---|---|
| `abacus validate` | Structural validation of a SQLX functional unit |
| `abacus test` | Run tests against a functional unit |
| `abacus run` | Execute a functional unit in the configured environment |
| `abacus format` | Format SQLX source according to coding standards |
| `abacus analyse` | Static analysis of SQLX logic |
| `abacus dag-dump` | Dump the dependency graph for a functional unit |
| `abacus info` | Display metadata and configuration for the current environment |

Use the mid-tier model (Claude Sonnet, Gemini Flash) for routine SQLX work. Reserve
the premium tier for ambiguous spec decisions, cross-functional unit architecture, or
security-sensitive validation.

---

### Development tooling

#### ripgrep

**What it is:** A fast, portable text search tool used by agents for codebase
exploration, pattern matching, and log scanning. Preferred over `grep` in all agent
workflows.

**Install:**

```bash
# macOS
brew install ripgrep

# Debian / Ubuntu
apt-get install ripgrep

# Windows
winget install BurntSushi.ripgrep.MSVC
```

Verify: `rg --version`

Common patterns used in agent sessions:

```bash
# Search for a pattern across all files
rg "pattern"

# Restrict to specific file types
rg "pattern" --type java

# List files containing matches (no content)
rg --files-with-matches "pattern"

# Case-insensitive search
rg -i "pattern"
```

If `rg` is unavailable, fall back to `grep -r` with explicit encoding flags. Do not
use `find | xargs grep` chains in agent scripts — prefer `rg` for its reliability and
consistent output format.

---

### Model selection reference

Agents follow the `MODEL_DISCIPLINE` directive, which governs which LLM tier to use for
a given task. The decision framework maps tasks to arenas and cost tiers:

| Arena | Task examples | Recommended tier |
|---|---|---|
| Text (structural, YAML, docs) | Artifact generation, document editing, summary writing | Mid (Sonnet / Flash) |
| Code (complex) | Architecture, debugging, ambiguous spec decisions | Premium (Opus / Pro) |
| Code (routine) | SQLX generation, file edits, template instantiation | Mid (Sonnet / Flash) |
| Search / grounding | Regulatory research, product documentation queries | Search-capable model |

The `agentic-model-leaderboard` toolguide (at `pack/toolguides/agentic-model-leaderboard.md`)
provides a parseable reference for current top-performing models by arena and cost tier.
Refresh it quarterly as the landscape changes.

---

## Further reference

| Document | Location |
|---|---|
| Pack install and setup | `docs/HOW_TO_USE.md` |
| Architecture decisions (DDRs) | `docs/decisions/` |
| Pack artifact inventory | `docs/pack-migration-plan.md` |
| Toolguide detail pages | `pack/toolguides/*.md` |
| Agent profiles | `pack/agent_profiles/*.agent.yaml` |
| Doctrine relationship graph | `pack/drg/fragment.yaml` |

---

*For questions about specific governance requirements, agent profiles, or tooling
access, contact the Professional Services AI governance team through standard internal
channels.*
