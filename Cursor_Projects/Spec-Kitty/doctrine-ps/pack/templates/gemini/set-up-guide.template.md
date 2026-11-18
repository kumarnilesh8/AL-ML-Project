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
---
template: gemini-agent-set-up-guide
version: "1.0"
---

# Gemini agent — `set-up-guide.md` template

**Output-structure contract** for the `set-up-guide.md` file inside each
`gemini-agents/{chatbot-slug}/` folder — `gemini-agents/` is a directory in the
separate **`regnology-ps-chatbots`** repository, not `doctrine-ps`. This file tells
a human operator, step by step, how to create the agent in the Gemini Enterprise
workspace at personal scope.

Audience target: human operator with no prior experience creating Gemini Enterprise
agents. Persona-targeted; write to the specific operator persona for this agent type.

---

## 1. File header (required)

```markdown
# Set-up guide — {Agent Name} (Gemini Enterprise)

Audience: {one sentence describing the target operator persona — e.g. "the human
operator creating this agent in the Gemini Enterprise app in the browser. No prior
experience assumed."}.

This guide targets the online Gemini Enterprise workspace (agents created in the
browser). Exact menu names depend on your workspace version; confirm against your
Gemini Enterprise UI if a label differs.

{Optional prerequisite note: if this agent depends on other agents already existing
(e.g. navigator requires specialist agents), state the dependency here. Otherwise omit.}
```

---

## 2. Step 1 — Create the agent at personal scope (required)

```markdown
## 1. Create the agent at personal scope

1. Open Gemini Enterprise in the browser, choose "Proceed to builder", and click the
   "My Agent" box. This opens a detail session where you fill in the information for
   the agent to be created.
2. Name it: {Agent Name}.
3. Keep it at personal scope for now (only you can use it). Do not request org-wide
   review yet.
```

---

## 3. Step 2 — Select the recommended model (required)

```markdown
## 2. Select the recommended model

Recommended model: `{recommended_model}`

The `{recommended_model}` value is resolved from
`pack/templates/gemini/model-recommendation.map.yaml` during generation. Do not
choose or duplicate a per-agent model recommendation outside that mapping.

1. In the agent builder, open the model selection field.
2. Select `{recommended_model}`.
3. If the model is not available in the workspace, record the mismatch before
   promotion and ask the workspace owner which approved fallback to use.
```

---

## 4. Step 3 — Paste the instructions (required)

```markdown
## 3. Paste the instructions

1. Open `gemini-agents/{chatbot-slug}/instructions.md` from the repo.
2. Copy everything below the generation comment block (the content starting at
   "# {Agent Name} — {tagline}").
3. Paste it into the agent's instructions / system prompt field and save.
```

---

## 5. Step 4 — Set the profile picture (required)

```markdown
## 4. Set the profile picture

1. Use `gemini-agents/{chatbot-slug}/avatar.png` as the agent's profile picture / icon.
2. The file is already under the 200KB limit Gemini requires for agent icons.
```

---

## 6. Step 5 — Attach Regnology terminology (required section, optional action)

```markdown
## 5. Attach Regnology terminology (optional but encouraged)

Attaching the shared glossary files as knowledge gives the agent canonical Regnology
vocabulary, so it uses the right terms when {specific use-case for this agent type}.

1. In the agent builder, open the knowledge / context section.
2. Upload the following files from `gemini-agents/shared/glossary/` in the repo:
   - `{filename.md}` — {one-line description of what this file covers and why it
     helps this specific agent}. {Use when / useful for ...}
3. Save.

Without these files the agent still works — the key terms are embedded in the
instructions. The glossary files make the agent more accurate on terminology-sensitive
content. See `gemini-agents/shared/glossary/README.md` for the full description of each file
and which agent types benefit from it.
```

---

## 7. Step 6 — Connector or data-source steps (include if required, omit if none)

```markdown
## 6. Connect data sources (if required)

{If the agent requires specific connectors or data sources, list each one here with
the step to grant or configure it. If the agent needs no connectors beyond standard
text generation, omit this step entirely.}

Use this link syntax in the generated guide and in the agent instructions:
- `connector://<name>` for Gemini Enterprise connectors or attached data sources.
- `tool://<name>` for tools the agent may call.

For grounded agents, tool access does not loosen grounding strictness. A general
web-search tool such as `tool://google_search` may only locate official sources
to attach or cite as grounding. It must never answer the agent's domain substance
from search results alone.
```

---

## 8. Step 7 — Configure starter prompts (include if present, omit if none)

```markdown
## 7. Configure starter prompts (if present)

{If `gemini-agents/{chatbot-slug}/instructions.md` contains a "Suggested starter
prompts" section, copy its prompts into Gemini Enterprise. If the instructions
omit that optional section, omit this setup step too.}

1. In the agent builder, open the starter prompts / suggested prompts field.
2. Paste the prompts from the "Suggested starter prompts" section.
3. Confirm every prompt is on-scope for this agent and does not require access
   beyond the configured `connector://<name>` or `tool://<name>` entries.
```

---

## 9. Step 8 — Test the behaviour (required)

```markdown
## {N}. Test the behaviour (acceptance checks)

{Three acceptance checks verifying the agent behaves correctly:}

1. In-scope — {concrete in-scope request}. Expect {expected outcome aligned with
   the agent's governing doctrine and scope}.
2. Out-of-scope, routes to front-door — {out-of-scope request}. Expect the agent to
   decline and redirect the user to {front_door_name} rather than attempting the work.
   {Resolve `{front_door_name}` from `gemini-agents/roster.yaml` -> `front_door.name`.}
3. Out-of-scope, no specialist exists — {out-of-scope request with no dedicated agent}.
   Expect the agent to decline and say no specialised Gemini agent exists yet, rather
   than attempting the work or naming a non-existent agent.

If checks 1–3 pass, the scope boundary and handoff protocol work.
```

---

## 10. Step 9 — Promote to org-wide (required)

```markdown
## {N+1}. Promote to org-wide (when ready)

When you want everyone in the org to use this agent, submit the package in
`gemini-agents/{chatbot-slug}/review-submission.md` through your workspace review
process. Promotion is reviewer-gated; it does not happen automatically.
```

---

## 11. Known limitation (required)

```markdown
## Known limitation

Gemini Enterprise agents cannot call each other. This agent recommends a specialist;
you switch to that agent yourself in the workspace. A recommended agent only works if
it has already been created in your workspace.
```
