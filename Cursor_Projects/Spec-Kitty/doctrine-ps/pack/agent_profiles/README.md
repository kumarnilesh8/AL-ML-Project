# pack/agent_profiles — Productivity agents (Bright Factory)

> **PRODUCTIVITY AGENTS ONLY.**
>
> Every file in this directory is a `*.agent.yaml` profile for an **IDE / CLI
> productivity agent** wired into the Spec Kitty doctrine runtime and Cursor.
> These agents execute missions, review code, write specifications, and compile DRGs.
> They are used by **PS developers and team leads inside their IDE**.
>
> **Gemini chatbots** (chat agents accessible to all Regnology employees via the
> Gemini Enterprise workspace) live in the separate **`regnology-ps-chatbots`**
> repository's `gemini-agents/` tree — not a directory in this repository.
> **Do not add chatbot profiles here.** See `pack/README.md § Two agent surfaces`.

## What belongs here

An agent profile belongs in `pack/agent_profiles/` if and only if it meets **all** of
these criteria:

- It executes tasks in a developer's IDE or CLI (Cursor, Claude, OpenCode, etc.)
- It is wired into the DRG via `pack/drg/fragment.yaml` (has a node + edges)
- It participates in the Spec Kitty mission runtime (receives task routing, delegates,
  produces doctrine artifacts)

## What does NOT belong here

| If it is… | It belongs in… |
|---|---|
| A Gemini Enterprise chat agent (employee-facing back-and-forth) | `regnology-ps-chatbots`'s `gemini-agents/<slug>/` |
| A Confluence/SharePoint bot | Outside this repository |
| A Teams / Slack bot | Outside this repository |

## The one bridge: Gemini Bot Georgia

`gemini-bot-georgia.agent.yaml` is the single deliberate exception — she is a
**productivity agent** whose specific job is to *generate* the `regnology-ps-chatbots`
repository's `gemini-agents/` distribution surface. She lives here because she runs in the
IDE under doctrine routing. She is not herself a Gemini chatbot, and she does not appear in
that repository's `gemini-agents/roster.yaml`.

## Adding a new productivity agent

1. Create `pack/agent_profiles/<slug>.agent.yaml`
2. Add the DRG node and edges in `pack/drg/fragment.yaml`
3. Recompile: `make compile-drg` and `make validate-layered`
4. Bump `pack/.pack-version` (MINOR if new capability, PATCH if metadata only)

For the agent YAML schema, use an existing profile as a template.
