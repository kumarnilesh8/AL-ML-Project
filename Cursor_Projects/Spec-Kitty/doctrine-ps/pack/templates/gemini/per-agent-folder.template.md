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
template: gemini-agent-per-agent-folder
version: "1.0"
---

# Gemini agent — per-agent folder layout template

**Output-structure contract** for a single agent folder under `gemini-agents/` —
a directory in the separate **`regnology-ps-chatbots`** repository, not `doctrine-ps`
(see `pack/README.md` § Two agent surfaces).

The `{chatbot-slug}` placeholder is the agent's slug: a short, lowercase, hyphenated,
filesystem-safe form of the agent's name. No spaces, no capitals, no special characters.
It must match the agent's `id` field in `gemini-agents/roster.yaml`. Example:
"Comms Cleo" → `comms-cleo/`.

---

## Required folder structure

```
gemini-agents/{chatbot-slug}/
  instructions.md        # REQUIRED — the flattened doctrine + handoff protocol
                         #   to paste as the agent's instructions (system prompt).
                         #   Structure defined by: pack/templates/gemini/instructions.template.md
  about.md               # REQUIRED — short description and avatar reference
                         #   to paste into the agent's name/description/profile-picture
                         #   fields in the workspace.
                         #   Structure defined by: pack/templates/gemini/about.template.md
  avatar.png             # REQUIRED — generated profile picture.
                         #   Generated from the agent's name and the Regnology brand using
                         #   gemini-agents/shared/branding/ reference files. Must be under 200KB
                         #   (Gemini rejects larger icons); longest side ~460px.
                         #   See avatar generation rules in about.template.md.
  knowledge/             # REQUIRED folder — grounding material (may be empty if none needed).
                         #   Contains doctrine extracts and reference maps to attach as context
                         #   or data sources when creating the agent. The same key content is
                         #   also embedded in instructions.md so the agent works without connectors.
                         #   Some agents source knowledge externally (e.g. from Confluence);
                         #   in those cases, only knowledge/README.md is tracked in version control.
  set-up-guide.md        # REQUIRED — operator instructions for creating the agent in
                         #   the Gemini Enterprise browser UI at personal scope.
                         #   Structure defined by: pack/templates/gemini/set-up-guide.template.md
  review-submission.md   # REQUIRED — the review package to submit when requesting
                         #   org-wide promotion. Georgia prepares; the human submits.
                         #   Structure defined by: pack/templates/gemini/review-submission.template.md
```

---

## Naming rules

| Rule | Detail |
|------|--------|
| Slug format | Lowercase, hyphenated, filesystem-safe; no spaces, capitals, or special characters |
| Slug ↔ id | The folder name must equal the agent's `id` in `gemini-agents/roster.yaml` |
| Uniqueness | Exactly one folder per Gemini agent |

---

## Avatar generation rules

Georgia generates `avatar.png` from:

- **Background**: `gemini-agents/shared/branding/regnology-brand-wallpaper.jpeg` — colour palette
  (dark teal dotted field, green/blue/orange gradient blob shapes forming the Regnology logo cross)
- **Face reference**: `gemini-agents/shared/branding/avatar-reference-female.png` for female-named agents;
  `gemini-agents/shared/branding/avatar-reference-male.png` for male-named agents
- **Style**: illustrated portrait, not photorealistic; Regnology logo blob shapes behind the figure
- **Size constraint**: longest side ~460px; verify byte size is under **200KB** before saving —
  Gemini rejects agent icons above this limit; downscale and/or re-encode as needed

---

## Do not hand-edit

Files in `gemini-agents/{chatbot-slug}/` (except `knowledge/README.md` for
externally-sourced knowledge) are generated and maintained by Georgia. To change a
generated file, edit its source (the pack profile or Georgia's instructions) and
re-run Georgia. See the `regnology-ps-chatbots` repository's `gemini-agents/README.md`
for the pack-backed vs Gemini-only agent distinction.
