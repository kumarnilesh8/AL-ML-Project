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
template: gemini-agent-review-submission
version: "1.0"
---

# Gemini agent — `review-submission.md` template

**Output-structure contract** for the `review-submission.md` file inside each
`gemini-agents/{chatbot-slug}/` folder — `gemini-agents/` is a directory in the
separate **`regnology-ps-chatbots`** repository, not `doctrine-ps`. This file is
the package the human operator submits when requesting org-wide (global) promotion
for the agent through the Gemini Enterprise workspace review process.

Audience target: the workspace reviewer or administrator deciding whether to publish
the agent org-wide. Georgia prepares this package; the human operator submits it.
Georgia never submits, publishes, or promotes to org-wide scope herself.

---

## 1. File header (required)

```markdown
# Review submission — {Agent Name} (request for org-wide promotion)

Audience: the workspace reviewer or administrator deciding whether to publish this
agent org-wide. Submit this when you choose to request promotion from personal to
org-wide scope.
```

---

## 2. Agent identity (required)

```markdown
## Agent

- Name: {Agent Name}
- Source profile: {pack/agent_profiles/{profile-id}.agent.yaml | or "hand-authored Gemini-only agent — no pack profile"}
- Roster version: {roster_version from roster.yaml}
- Source doctrine: {doctrine_pack} @ {doctrine_version}
- Requested scope: org-wide (currently personal)
```

---

## 3. Purpose (required)

```markdown
## Purpose

{2–3 sentences. State what the agent does for the end user — its business value,
the artefacts it produces, the problem it solves. Plain, non-technical language
targeted at a reviewer who may not know the doctrine stack.}
```

---

## 4. In scope (required)

```markdown
## In scope

{Bullet list or short prose. State clearly what tasks this agent handles.}
```

---

## 5. Out of scope (required)

```markdown
## Out of scope (routes elsewhere)

{Bullet list or short prose. State what this agent will not do and how it handles
out-of-scope requests (redirects to the front-door agent rather than attempting the
work).}
```

---

## 6. Governing doctrine (required)

```markdown
## Governing doctrine

{List the directive IDs and styleguide IDs the agent applies, with a one-line
summary of the constraint each one imposes. Gives the reviewer confidence that the
agent operates within the Regnology governance framework.}

- {DIRECTIVE_ID} — {one-line summary of the constraint}
- {STYLEGUIDE_ID} — {one-line summary of the constraint}
```

---

## 7. Connector / data access required (required)

```markdown
## Connector / data access required

{State the minimum connectors and data-access grants needed for the agent to function.
If the baseline agent requires no connectors, say so explicitly. For any optional
future connectors, describe them separately with the condition that triggers the need.
Grant at least privilege — do not request broad access.}
```

---

## 8. Test evidence (required)

```markdown
## Test evidence (attach before submitting)

{Checklist of acceptance checks the operator must complete before submitting.
Each item maps to a specific behaviour the reviewer will look for. Include at least:
- in-scope request produced correct output
- out-of-scope request(s) routed to front-door agent (not attempted)
- roster recommendations limited to agents that exist in the workspace}

- [ ] {In-scope acceptance check — specific to this agent's domain}
- [ ] {Out-of-scope routing check — names the front-door agent, did not attempt the work}
- [ ] {Additional routing check if applicable}
- [ ] Roster recommendations limited to agents available in the workspace.
```

---

## 9. Reviewer decision (required)

```markdown
## Reviewer decision

- [ ] Approved for org-wide publication
- [ ] Changes requested (note below)
- [ ] Rejected (note below)
```
